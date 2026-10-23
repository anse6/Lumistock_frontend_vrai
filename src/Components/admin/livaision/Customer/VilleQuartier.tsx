import React, { useEffect, useMemo, useState } from "react";
import { AutoComplete, Input, Spin } from "antd";
import { MapPin, Navigation } from "lucide-react";
import { getUrlServer } from "../../../../configServer";

// Ville puis quartier, en cascade, pour n'importe quel pays du monde, avec
// uniquement des sources gratuites et sans clé :
//  - villes : base enregistrée sur le serveur (OpenStreetMap, avec villages et
//    quartiers, pour les pays déjà enregistrés) + base libre
//    « country-state-city » (toutes les villes de chaque pays) + recherche
//    Photon pendant la frappe pour tout village absent des deux ;
//    les grandes villes sont proposées en premier ;
//  - quartiers : liste complète OpenStreetMap de la ville (via le serveur, mise
//    en cache) + recherche Photon pendant la frappe (aussi le secours quand
//    OpenStreetMap est saturé).
// On peut toujours saisir un nom absent des listes : il est enregistré tel quel.

interface VilleQuartierProps {
  /** Code ISO du pays (celui choisi avec le numéro de téléphone). */
  pays: string;
  ville: string;
  quartier: string;
  onChange: (valeurs: { ville: string; quartier: string }) => void;
  disabled?: boolean;
}

interface Ville {
  nom: string;
  lat?: number;
  lon?: number;
  region?: string | null;
  /** 0 = grande ville, 1 = ville, 2 = village (ordre d'affichage). */
  rang?: number;
  population?: number;
  /** Capitale du pays : proposée en premier. */
  capitale?: boolean;
  /** Autres noms (anglais, local…) : « Dubai » pour « Doubaï ». */
  autres_noms?: string[];
  /** Nombre de quartiers enregistrés sur le serveur. */
  quartiers?: number;
}

const ordreVilles = (a: Ville, b: Ville) =>
  (a.rang ?? 1) - (b.rang ?? 1) ||
  Number(!!b.capitale) - Number(!!a.capitale) ||
  (b.population ?? 0) - (a.population ?? 0) ||
  a.nom.localeCompare(b.nom, "fr");

const nomsVille = (v: Ville) => [v.nom, ...(v.autres_noms ?? [])];

const sansAccents = (texte: string) =>
  texte.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

/** « commence par », puis « contient », insensible aux accents ; un élément
 *  peut avoir plusieurs noms (« Doubaï » / « Dubai »). */
// Noms déjà normalisés, gardés par objet : le Canada compte 20 000 localités,
// les normaliser à chaque touche ralentissait la frappe.
const clesNormalisees = new WeakMap<object, string[]>();

const filtrer = <T,>(liste: T[], saisie: string, noms: (x: T) => string | string[], max = 60) => {
  const q = sansAccents(saisie);
  if (!q) return liste.slice(0, max);
  const tous = (v: T): string[] => {
    if (typeof v !== "object" || v === null) return ([] as string[]).concat(noms(v)).map(sansAccents);
    let cles = clesNormalisees.get(v);
    if (!cles) clesNormalisees.set(v, (cles = ([] as string[]).concat(noms(v)).map(sansAccents)));
    return cles;
  };
  const debut: T[] = [];
  const dedans: T[] = [];
  for (const v of liste) {
    const cles = tous(v);
    if (cles.some((n) => n.startsWith(q))) debut.push(v);
    else if (dedans.length < max && cles.some((n) => n.includes(q))) dedans.push(v);
  }
  return [...debut, ...dedans].slice(0, max);
};

const api = async <T,>(chemin: string, params: Record<string, string | number>, signal?: AbortSignal): Promise<T | null> => {
  try {
    const query = new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)]));
    const reponse = await fetch(`${getUrlServer()}/locations/${chemin}?${query}`, { signal });
    return reponse.ok ? ((await reponse.json()) as T) : null;
  } catch {
    return null;
  }
};

/** Valeur stabilisée après une pause de frappe. */
const useDifferee = <T,>(valeur: T, delai: number) => {
  const [stable, setStable] = useState(valeur);
  useEffect(() => {
    const minuteur = setTimeout(() => setStable(valeur), delai);
    return () => clearTimeout(minuteur);
  }, [valeur, delai]);
  return stable;
};

const libelle = (icone: React.ReactNode, texte: string, etat?: React.ReactNode) => (
  <div className="mb-2 flex min-h-[22px] items-center justify-between gap-2">
    <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">
      {icone} {texte}
    </span>
    {etat}
  </div>
);

const pastille = (chargement: boolean, n: number, unite: string, texteChargement = "Recherche…") =>
  chargement ? (
    <span className="flex items-center gap-1.5 text-[11px] text-purple-700">
      <Spin size="small" /> {texteChargement}
    </span>
  ) : n > 0 ? (
    <span className="rounded-full bg-purple-50 px-2 py-0.5 text-[11px] font-semibold text-purple-900">
      {n.toLocaleString("fr-FR")} {unite}
    </span>
  ) : null;

const VilleQuartier: React.FC<VilleQuartierProps> = ({ pays, ville, quartier, onChange, disabled }) => {
  // ---------- Villes du pays (base libre, chargée à la demande) ----------
  const [villesPays, setVillesPays] = useState<Ville[]>([]);
  const [chargementVilles, setChargementVilles] = useState(false);
  useEffect(() => {
    let actif = true;
    setVillesPays([]);
    if (!pays) return;
    setChargementVilles(true);
    Promise.all([
      import("country-state-city")
        .then(({ City, State }) => {
          const regions = new Map((State.getStatesOfCountry(pays) ?? []).map((s) => [s.isoCode, s.name]));
          return (City.getCitiesOfCountry(pays) ?? []).map((c) => ({
            nom: c.name,
            lat: Number(c.latitude),
            lon: Number(c.longitude),
            region: regions.get(c.stateCode) ?? null,
          }));
        })
        .catch(() => [] as Ville[]),
      // Base enregistrée du serveur (villes, villages, quartiers)
      api<Ville[]>("villes", { country_code: pays }).then((v) => (Array.isArray(v) ? v : [])),
    ])
      .then(([monde, locales]) => {
        if (!actif) return;
        const parNom = new Map<string, Ville>();
        // Une ville de la base libre déjà connue sous un autre nom (« Dubai »)
        // n'est pas ajoutée une seconde fois.
        const autres = new Map<string, Ville>();
        locales.forEach((v) => (v.autres_noms ?? []).forEach((n) => autres.set(sansAccents(n), v)));
        [...locales, ...monde].forEach((v) => {
          const cle = sansAccents(v.nom);
          if (!parNom.has(cle) && autres.has(cle)) return;
          const deja = parNom.get(cle);
          if (!deja) parNom.set(cle, v);
          else
            parNom.set(cle, {
              ...deja,
              lat: deja.lat ?? v.lat,
              lon: deja.lon ?? v.lon,
              region: deja.region || v.region,
            });
        });
        setVillesPays([...parNom.values()].sort(ordreVilles));
      })
      .finally(() => actif && setChargementVilles(false));
    return () => {
      actif = false;
    };
  }, [pays]);

  // ---------- Recherche Photon des villes pendant la frappe ----------
  const villeTapee = useDifferee(ville.trim(), 400);
  const [villesTrouvees, setVillesTrouvees] = useState<Ville[]>([]);
  const [rechercheVilles, setRechercheVilles] = useState(false);
  useEffect(() => {
    setVillesTrouvees([]);
    if (villeTapee.length < 2 || !pays) return;
    const controleur = new AbortController();
    setRechercheVilles(true);
    api<Ville[]>("cities/search", { q: villeTapee, country_code: pays }, controleur.signal)
      .then((v) => !controleur.signal.aborted && setVillesTrouvees(v || []))
      .finally(() => !controleur.signal.aborted && setRechercheVilles(false));
    return () => controleur.abort();
  }, [villeTapee, pays]);

  const toutesVilles = useMemo(() => {
    const cles = new Set(villesPays.flatMap((v) => nomsVille(v).map(sansAccents)));
    return [...villesPays, ...villesTrouvees.filter((v) => !cles.has(sansAccents(v.nom)))];
  }, [villesPays, villesTrouvees]);

  // Ville retenue = une ville connue (avec ses coordonnées pour les quartiers)
  const villeChoisie = useMemo(
    () =>
      toutesVilles.find((v) => sansAccents(v.nom) === sansAccents(villeTapee)) ||
      toutesVilles.find((v) => nomsVille(v).some((n) => sansAccents(n) === sansAccents(villeTapee))) ||
      null,
    [toutesVilles, villeTapee],
  );

  // ---------- Quartiers de la ville (liste OpenStreetMap complète) ----------
  const [quartiersVille, setQuartiersVille] = useState<string[]>([]);
  const [chargementQuartiers, setChargementQuartiers] = useState(false);
  // Liste vide (OpenStreetMap saturé) : le serveur réessaie en arrière-plan,
  // la page la redemande toutes les 20 s pendant 2 minutes.
  const [enAttente, setEnAttente] = useState(false);
  // Clé stable : la liste n'est rechargée que si la ville change vraiment.
  const cleVille = villeChoisie ? `${villeChoisie.nom}|${villeChoisie.lat ?? ""}|${villeChoisie.lon ?? ""}` : "";
  useEffect(() => {
    setQuartiersVille([]);
    setEnAttente(false);
    if (!cleVille) return;
    const [nom, lat, lon] = cleVille.split("|");
    const controleur = new AbortController();
    let minuteur: ReturnType<typeof setTimeout> | undefined;
    const params: Record<string, string | number> = { country_code: pays, city: nom };
    if (lat && lon) {
      params.lat = lat;
      params.lon = lon;
    }
    const charger = (essai: number) => {
      if (essai === 0) setChargementQuartiers(true);
      api<string[]>("neighborhoods", params, controleur.signal)
        .then((q) => {
          if (controleur.signal.aborted) return;
          const liste = Array.isArray(q) ? q : [];
          setQuartiersVille(liste);
          const encore = !liste.length && essai < 6;
          setEnAttente(encore);
          if (encore) minuteur = setTimeout(() => charger(essai + 1), 20000);
        })
        .finally(() => !controleur.signal.aborted && setChargementQuartiers(false));
    };
    charger(0);
    return () => {
      controleur.abort();
      if (minuteur) clearTimeout(minuteur);
    };
  }, [cleVille, pays]);

  // ---------- Recherche Photon des quartiers pendant la frappe ----------
  // Photon n'est interrogé que sur les 3 premières lettres (puis le navigateur
  // filtre) : « Nyle » réutilise la réponse de « Nyl », sans nouvel appel lent.
  const quartierTape = useDifferee(quartier.trim().slice(0, 3), 400);
  const [quartiersTrouves, setQuartiersTrouves] = useState<string[]>([]);
  const [rechercheQuartiers, setRechercheQuartiers] = useState(false);
  useEffect(() => {
    setQuartiersTrouves([]);
    if (quartierTape.length < 2 || villeChoisie?.lat == null || villeChoisie?.lon == null) return;
    // Inutile si la liste complète contient déjà des correspondances.
    if (filtrer(quartiersVille, quartier.trim(), (q) => q, 5).length >= 5) return;
    const controleur = new AbortController();
    setRechercheQuartiers(true);
    api<string[]>("neighborhoods/search", { q: quartierTape, lat: villeChoisie.lat, lon: villeChoisie.lon }, controleur.signal)
      .then((q) => !controleur.signal.aborted && setQuartiersTrouves(q || []))
      .finally(() => !controleur.signal.aborted && setRechercheQuartiers(false));
    return () => controleur.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quartierTape, cleVille, quartiersVille]);

  const tousQuartiers = useMemo(() => {
    const cles = new Set(quartiersVille.map(sansAccents));
    return [...quartiersVille, ...quartiersTrouves.filter((q) => !cles.has(sansAccents(q)))];
  }, [quartiersVille, quartiersTrouves]);

  // ---------- Options affichées ----------
  const optionsVilles = useMemo(
    () =>
      // Champ vide : toutes les villes, les grandes d'abord (Yaoundé, Douala…).
      filtrer(toutesVilles, ville, nomsVille, ville.trim() ? 100 : 5000).map((v) => ({
        value: v.nom,
        label: (
          // Deux lignes : le nom entier, puis quartiers et région en petit.
          <span className="block leading-tight">
            <span className="block truncate">
              <span className={v.rang === 0 ? "font-semibold text-purple-950" : ""}>{v.nom}</span>
              {/* Trouvée par un autre nom : on le montre (« Doubaï » · Dubai). */}
              {(() => {
                const q = sansAccents(ville);
                const autre = q && !sansAccents(v.nom).includes(q)
                  ? v.autres_noms?.find((n) => sansAccents(n).includes(q))
                  : undefined;
                return autre ? <span className="text-xs text-slate-400"> · {autre}</span> : null;
              })()}
            </span>
            {(v.quartiers || v.region) && (
              <span className="block truncate text-[11px] text-slate-400">
                {[v.quartiers ? `${v.quartiers} quartiers` : null, v.region].filter(Boolean).join(" · ")}
              </span>
            )}
          </span>
        ),
      })),
    [toutesVilles, ville],
  );
  const optionsQuartiers = useMemo(
    () => filtrer(tousQuartiers, quartier, (q) => q, 200).map((q) => ({ value: q })),
    [tousQuartiers, quartier],
  );

  const aideQuartier = !villeChoisie
    ? null
    : chargementQuartiers
      ? "Recherche des quartiers de la ville…"
      : quartiersVille.length
        ? null
        : enAttente
          ? "Liste des quartiers en cours de récupération (service gratuit saturé) : tapez les premières lettres ou patientez."
          : "Tapez les premières lettres du quartier pour le chercher.";

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div>
        {libelle(
          <MapPin size={13} className="text-slate-400" />,
          "Ville",
          pastille(chargementVilles || rechercheVilles, villesPays.length, "villes", chargementVilles ? "Chargement…" : "Recherche…"),
        )}
        <AutoComplete
          value={ville}
          options={optionsVilles}
          // Changer de ville vide le quartier : il appartenait à l'ancienne ville.
          onChange={(v) => onChange({ ville: v, quartier: v === ville ? quartier : "" })}
          disabled={disabled}
          className="w-full"
          popupMatchSelectWidth
          notFoundContent={
            ville.trim().length >= 2 && !rechercheVilles && !chargementVilles ? (
              <span className="text-xs text-slate-400">Ville introuvable : elle sera enregistrée telle quelle.</span>
            ) : null
          }
        >
          <Input size="large" placeholder={chargementVilles ? "Chargement des villes…" : "Choisir ou saisir une ville"} maxLength={80} allowClear />
        </AutoComplete>
      </div>
      <div>
        {libelle(
          <Navigation size={13} className="text-slate-400" />,
          "Quartier",
          villeChoisie ? pastille(chargementQuartiers || rechercheQuartiers, quartiersVille.length, "quartiers") : null,
        )}
        <AutoComplete
          value={quartier}
          options={optionsQuartiers}
          onChange={(q) => onChange({ ville, quartier: q })}
          disabled={disabled}
          className="w-full"
          popupMatchSelectWidth
          notFoundContent={
            quartier.trim().length >= 2 && !rechercheQuartiers && !chargementQuartiers ? (
              <span className="text-xs text-slate-400">Quartier introuvable : il sera enregistré tel quel.</span>
            ) : null
          }
        >
          <Input
            size="large"
            placeholder={ville ? "Choisir ou saisir un quartier" : "Choisissez d'abord la ville"}
            maxLength={80}
            allowClear
          />
        </AutoComplete>
        {aideQuartier && <p className="mt-1 text-xs text-slate-500">{aideQuartier}</p>}
      </div>
    </div>
  );
};

export default VilleQuartier;
