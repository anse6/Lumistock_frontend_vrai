// Page d'accueil de l'admin / du manager : première page après la connexion.
// Couleurs unies (pas de dégradé) : purple-950 pour la marque, teintes franches pour les accents.
import React from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import {
  ArrowRight, Banknote, Boxes, BookOpenCheck, Building2, Calculator, Check, CircleAlert, Coins, FileBarChart,
  Globe2, HandCoins, LayoutDashboard, Lock, Mail, MapPin, MessageSquareText, PackagePlus, Pencil, Phone, Receipt,
  ShoppingBag, ShoppingCart, Smartphone, Sparkles, TrendingUp, Truck, UserPlus, Users, UsersRound,
} from "lucide-react";
import { getUrlServer } from "../../configServer";
import { fetchVueMagasin, type VueMagasin } from "../../Components/admin/Dashboard/api";
import { Alertes } from "../../Components/admin/Dashboard/Synthese";
import { VentesRecentesCard } from "../../Components/admin/Dashboard/Cartes";
import { formatMontant, formatNombre, montantEnParties } from "../../Components/dashboard/theme";
import { useTextesAccueil } from "../../Components/admin/Accueil/textes";

/* ------------------------------------------------------------------ */
/* Données                                                              */
/* ------------------------------------------------------------------ */

interface Moi { first_name?: string; email?: string; role?: string }

interface Profil {
  identite: {
    denomination: string; raison_sociale: string | null; forme_juridique: string | null; rccm: string | null; niu: string | null;
    activite: string | null; adresse: string | null; ville: string | null; pays: string | null; code_pays: string | null;
    telephone: string | null; email: string | null; site_web: string | null; logo: string | null; cree_le: string | null;
  };
  conformite: {
    membre_ohada: boolean; zone: string | null; referentiel: string; taux_tva: number | null; devise: string;
    valorisation: string; exercice_en_cours: number;
    derniere_cloture: { exercice: number; date_fin: string; resultat: number } | null;
  };
  licence: { managers: number; max_managers: number | null; gerants: number; max_gerants: number | null; caissiers?: number; max_caissiers?: number | null };
  champs_manquants: string[];
  pays_ohada: { zone: string; pays: { code: string; nom: string }[] }[];
  pays_tva: number;
}

const entetes = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` } });
const fetchMoi = async (): Promise<Moi> => (await axios.get(`${getUrlServer()}/users/me`, entetes())).data;
const fetchProfil = async (): Promise<Profil> => (await axios.get(`${getUrlServer()}/managers/magasin/profil`, entetes())).data;

/** Nombre de points « À traiter » (mêmes règles que le bandeau d'alertes). */
const nombreAlertes = (d: VueMagasin) =>
  [
    d.kpis.creances.en_retard > 0, d.stock.ruptures > 0, d.stock.perimes > 0, d.kpis.resultat.valeur < 0,
    d.stock.stock_bas > 0, d.stock.bientot_perimes > 0,
    (d.paiements.statuts.find((s) => s.statut === "non payé")?.nombre ?? 0) > 0,
  ].filter(Boolean).length;

const Montant: React.FC<{ valeur: number; devise: string }> = ({ valeur, devise }) => {
  const p = montantEnParties(valeur, devise);
  return (
    <>
      <span className="whitespace-nowrap">{p.nombre}</span>{" "}
      <span className="whitespace-nowrap text-xs font-semibold text-purple-200">{p.devise}</span>
    </>
  );
};

const Logo: React.FC<{ url?: string | null; nom: string; taille?: string }> = ({ url, nom, taille = "h-11 w-11" }) => (
  <span className={`flex ${taille} shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white p-1 shadow-sm`}>
    {url ? (
      <img src={url} alt="" className="h-full w-full object-contain" onError={(e) => { e.currentTarget.style.display = "none"; }} />
    ) : (
      <span className="text-lg font-bold text-purple-950">{nom.charAt(0).toUpperCase()}</span>
    )}
  </span>
);

/* ------------------------------------------------------------------ */
/* Bandeau d'accueil (fond uni purple-950)                              */
/* ------------------------------------------------------------------ */

const Bandeau: React.FC<{ moi?: Moi; data?: VueMagasin; profil?: Profil; chargement: boolean; erreur: boolean }> = ({ moi, data, profil, chargement, erreur }) => {
  const { t, locale } = useTextesAccueil();
  const maintenant = new Date();
  const prenom = (moi?.first_name || "").trim();
  const nomAffiche = prenom ? prenom.charAt(0).toUpperCase() + prenom.slice(1) : (localStorage.getItem("email") || "").split("@")[0];
  const magasin = profil?.identite.denomination || data?.magasin.denomination || localStorage.getItem("denomination_magasin") || "Lumistock";
  const role = moi?.role || localStorage.getItem("role") || "admin";
  const date = maintenant.toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  const actions = [
    { libelle: t.actions.vente, lien: "/admin/dashboard/deliverys/develive", icone: <ShoppingCart size={17} />, principale: true },
    { libelle: t.actions.produit, lien: "/admin/dashboard/produits_approvisionnements/add_product", icone: <PackagePlus size={17} /> },
    { libelle: t.actions.client, lien: "/admin/dashboard/customers/addusers", icone: <UserPlus size={17} /> },
    { libelle: t.actions.appro, lien: "/admin/dashboard/produits_approvisionnements/productselect", icone: <Truck size={17} /> },
  ];

  const k = data?.kpis;
  const chiffres = k && data
    ? [
        { libelle: t.chiffres.ca, valeur: <Montant valeur={k.chiffre_affaires.valeur} devise={data.magasin.devise} />, icone: <TrendingUp size={16} />, accent: "bg-fuchsia-400" },
        { libelle: t.chiffres.ventes, valeur: formatNombre(k.ventes.valeur), icone: <ShoppingBag size={16} />, accent: "bg-amber-400" },
        { libelle: t.chiffres.encaisse, valeur: <Montant valeur={k.encaisse.valeur} devise={data.magasin.devise} />, icone: <Banknote size={16} />, accent: "bg-emerald-400" },
        { libelle: t.chiffres.creances, valeur: <Montant valeur={k.creances.valeur} devise={data.magasin.devise} />, icone: <HandCoins size={16} />, accent: "bg-sky-400" },
      ]
    : [];

  return (
    <section className="relative overflow-hidden rounded-3xl bg-purple-950 p-5 text-white shadow-lg shadow-purple-950/15 sm:p-7 lg:p-9">
      {/* Une seule forme décorative unie, dans le coin, derrière aucun contenu */}
      <div className="pointer-events-none absolute -right-24 -top-28 h-56 w-56 rounded-full bg-purple-900/70" />

      <div className="relative">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="mb-4 flex items-center gap-3">
              <Logo url={profil?.identite.logo} nom={magasin} />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">{magasin}</p>
                <p className="text-xs text-purple-200">{t.roles[role] ?? role}</p>
              </div>
            </div>
            <h1 className="text-2xl font-bold leading-tight sm:text-3xl lg:text-4xl">
              {t.salutation(maintenant.getHours())}{nomAffiche ? `, ${nomAffiche}` : ""} 👋
            </h1>
            <p className="mt-2 text-sm text-purple-100 sm:text-base">
              {date.charAt(0).toUpperCase() + date.slice(1)} · {t.sousTitre}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:flex lg:max-w-md lg:flex-wrap lg:justify-end">
            {actions.map((a) => (
              <Link
                key={a.libelle}
                to={a.lien}
                className={`inline-flex items-center justify-center rounded-xl font-semibold transition-all hover:-translate-y-0.5 ${
                  a.principale
                    ? "col-span-3 gap-2 px-3.5 py-2.5 text-sm !bg-white !text-purple-950 shadow-md hover:!bg-purple-50 sm:col-span-1 sm:px-2 sm:text-[13px] lg:px-3.5 lg:text-sm"
                    : "flex-col gap-1 border border-white/20 px-1 py-2 text-center text-[10.5px] leading-tight !bg-white/10 !text-white hover:!bg-white/20 sm:flex-row sm:gap-1.5 sm:px-2 sm:py-2.5 sm:text-[13px] lg:px-3.5 lg:text-sm"
                }`}
              >
                {a.icone} {a.libelle}
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-6 sm:mt-8">
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-purple-200">{t.septJours}</p>
          {erreur && !data ? (
            <p className="rounded-xl bg-white/10 px-4 py-3 text-sm text-purple-100">{t.erreur}</p>
          ) : (
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
              {(chargement || !data ? Array.from({ length: 4 }, () => null) : chiffres).map((c, i) => (
                <div key={c?.libelle ?? i} className="relative min-w-0 overflow-hidden rounded-2xl bg-white/[0.08] p-3 ring-1 ring-white/15 sm:p-4">
                  {c ? (
                    <>
                      <span className={`absolute left-0 top-3 h-8 w-1 rounded-r-full ${c.accent}`} />
                      <p className="flex items-center gap-1.5 text-[11px] text-purple-100 sm:text-xs">{c.icone} {c.libelle}</p>
                      <p className="mt-1.5 text-lg font-bold leading-tight sm:text-2xl">{c.valeur}</p>
                    </>
                  ) : (
                    <div className="space-y-2" aria-label={t.chargement}>
                      <div className="h-3 w-2/3 animate-pulse rounded bg-white/20" />
                      <div className="h-6 w-1/2 animate-pulse rounded bg-white/20" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

/* ------------------------------------------------------------------ */
/* Fiche de l'entreprise                                                */
/* ------------------------------------------------------------------ */

const Info: React.FC<{ icone: React.ReactNode; libelle: string; valeur: React.ReactNode; vide: string }> = ({ icone, libelle, valeur, vide }) => (
  <div className="flex min-w-0 items-start gap-3">
    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-500">{icone}</span>
    <div className="min-w-0">
      <dt className="text-xs text-slate-500">{libelle}</dt>
      <dd className={`break-words text-sm font-medium ${valeur ? "text-slate-900" : "italic text-slate-400"}`}>{valeur || vide}</dd>
    </div>
  </div>
);

const Pastille: React.FC<{ icone: React.ReactNode; texte: string; ton: "vert" | "violet" | "bleu" | "ambre" | "gris" }> = ({ icone, texte, ton }) => {
  const tons = {
    vert: "bg-emerald-50 text-emerald-800 ring-emerald-200",
    violet: "bg-purple-50 text-purple-950 ring-purple-200",
    bleu: "bg-sky-50 text-sky-900 ring-sky-200",
    ambre: "bg-amber-50 text-amber-900 ring-amber-200",
    gris: "bg-slate-50 text-slate-700 ring-slate-200",
  };
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ring-1 ${tons[ton]}`}>{icone}{texte}</span>;
};

const Quota: React.FC<{ libelle: string; utilise: number; max: number | null }> = ({ libelle, utilise, max }) => (
  <div>
    <div className="flex justify-between text-xs"><span className="text-slate-600">{libelle}</span>
      <span className="font-semibold tabular-nums text-slate-900">{utilise} / {max ?? "∞"}</span></div>
    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
      <div className="h-full rounded-full bg-purple-700" style={{ width: `${max ? Math.min((utilise / max) * 100, 100) : 0}%` }} />
    </div>
  </div>
);

const FicheEntreprise: React.FC<{ profil: Profil }> = ({ profil }) => {
  const { t, locale } = useTextesAccueil();
  const f = t.fiche;
  const { identite: id, conformite: c, licence: l } = profil;
  const site = id.site_web ? <a href={id.site_web} target="_blank" rel="noreferrer" className="!text-purple-800 hover:underline">{id.site_web.replace(/^https?:\/\//, "")}</a> : null;

  return (
    <section className="rounded-2xl border border-purple-100/70 bg-white shadow-sm">
      <div className="flex flex-col gap-4 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex min-w-0 items-center gap-4">
          <Logo url={id.logo} nom={id.denomination} taille="h-14 w-14 ring-1 ring-slate-200" />
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">{f.titre}</p>
            <h2 className="truncate text-lg font-bold text-purple-950 sm:text-xl">{id.raison_sociale || id.denomination}</h2>
            <p className="text-sm text-slate-500">
              {[id.denomination !== id.raison_sociale ? id.denomination : null, id.forme_juridique, id.activite].filter(Boolean).join(" · ")}
            </p>
          </div>
        </div>
        <Link to="/admin/dashboard/parameter" className="inline-flex w-fit items-center gap-2 rounded-xl border border-purple-200 px-3.5 py-2 text-sm font-semibold !text-purple-950 hover:!bg-purple-50">
          <Pencil size={15} /> {f.modifier}
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 p-4 sm:p-6 lg:grid-cols-5">
        {/* Identité légale */}
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-3">
          <Info icone={<BookOpenCheck size={16} />} libelle={f.rccm} valeur={id.rccm} vide={f.nonRenseigne} />
          <Info icone={<Receipt size={16} />} libelle={f.niu} valeur={id.niu} vide={f.nonRenseigne} />
          <Info icone={<MapPin size={16} />} libelle={f.adresse} valeur={id.adresse} vide={f.nonRenseigne} />
          <Info icone={<Phone size={16} />} libelle={f.telephone} valeur={id.telephone} vide={f.nonRenseigne} />
          <Info icone={<Mail size={16} />} libelle={f.email} valeur={id.email} vide={f.nonRenseigne} />
          <Info icone={<Globe2 size={16} />} libelle={f.site} valeur={site} vide={f.nonRenseigne} />
          <Info icone={<Building2 size={16} />} libelle={f.creeLe}
            valeur={id.cree_le ? new Date(id.cree_le).toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" }) : null} vide={f.nonRenseigne} />
        </dl>

        {/* Conformité et licence */}
        <div className="space-y-5 lg:col-span-2 lg:border-l lg:border-slate-100 lg:pl-6">
          <div>
            <p className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-slate-500">{f.conformite}</p>
            <div className="flex flex-wrap gap-2">
              {c.membre_ohada
                ? <Pastille ton="vert" icone={<Check size={13} />} texte={f.membreOhada(c.zone ?? "")} />
                : <Pastille ton="gris" icone={<Globe2 size={13} />} texte={f.horsOhada} />}
              <Pastille ton="violet" icone={<BookOpenCheck size={13} />} texte={c.referentiel} />
              {c.taux_tva !== null
                ? <Pastille ton="bleu" icone={<Receipt size={13} />} texte={f.tva(c.taux_tva.toLocaleString(locale))} />
                : <Pastille ton="ambre" icone={<CircleAlert size={13} />} texte={f.tvaInconnue} />}
              <Pastille ton="bleu" icone={<Coins size={13} />} texte={f.devise(c.devise)} />
              <Pastille ton="violet" icone={<Boxes size={13} />} texte={c.valorisation} />
              <Pastille ton="gris" icone={<Lock size={13} />}
                texte={c.derniere_cloture ? `${f.derniereCloture(c.derniere_cloture.exercice)} · ${f.exercice(c.exercice_en_cours)}` : f.exercice(c.exercice_en_cours)} />
            </div>
          </div>
          <div>
            <p className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-slate-500">{f.licence}</p>
            <div className="space-y-3">
              <Quota libelle={f.managers} utilise={l.managers} max={l.max_managers} />
              <Quota libelle={f.gerants} utilise={l.gerants} max={l.max_gerants} />
              <Quota libelle="Caissiers" utilise={l.caissiers ?? 0} max={l.max_caissiers ?? null} />
            </div>
          </div>
        </div>
      </div>

      {profil.champs_manquants.length > 0 && (
        <div className="mx-4 mb-4 flex flex-col gap-3 rounded-xl bg-amber-50 p-3.5 text-sm text-amber-900 ring-1 ring-amber-200 sm:mx-6 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-start gap-2">
            <CircleAlert size={17} className="mt-0.5 shrink-0" />
            <span>{f.manquants} <strong>{profil.champs_manquants.join(", ")}</strong></span>
          </p>
          <Link to="/admin/dashboard/parameter" className="shrink-0 font-semibold !text-amber-900 underline">{f.completer}</Link>
        </div>
      )}
    </section>
  );
};

/* ------------------------------------------------------------------ */
/* Espace OHADA                                                         */
/* ------------------------------------------------------------------ */

const ICONES_PILIERS = [
  { icone: <BookOpenCheck size={20} />, teinte: "bg-purple-100 text-purple-950" },
  { icone: <Receipt size={20} />, teinte: "bg-sky-100 text-sky-900" },
  { icone: <Coins size={20} />, teinte: "bg-amber-100 text-amber-900" },
  { icone: <Smartphone size={20} />, teinte: "bg-orange-100 text-orange-800" },
  { icone: <Boxes size={20} />, teinte: "bg-emerald-100 text-emerald-900" },
  { icone: <Lock size={20} />, teinte: "bg-rose-100 text-rose-800" },
];

const EspaceOhada: React.FC<{ profil: Profil }> = ({ profil }) => {
  const { t } = useTextesAccueil();
  const o = t.ohada;
  const monPays = profil.identite.code_pays;
  return (
    <section className="overflow-hidden rounded-2xl border border-purple-100/70 bg-white shadow-sm">
      <div className="grid grid-cols-1 lg:grid-cols-5">
        {/* Présentation + pays membres */}
        <div className="bg-purple-50/60 p-5 sm:p-7 lg:col-span-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-950 px-3 py-1 text-xs font-semibold text-white">
            <Globe2 size={13} /> {o.badge}
          </span>
          <h2 className="mt-4 text-xl font-bold leading-tight text-purple-950 sm:text-2xl">{o.titre}</h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">{o.intro(profil.pays_tva)}</p>

          <p className="mb-3 mt-6 text-xs font-semibold uppercase tracking-wider text-slate-500">{o.pays}</p>
          <div className="space-y-3">
            {profil.pays_ohada.map((groupe) => (
              <div key={groupe.zone}>
                <p className="mb-1.5 text-xs font-medium text-slate-500">{groupe.zone}</p>
                <div className="flex flex-wrap gap-1.5">
                  {groupe.pays.map((p) => {
                    const actif = p.code === monPays;
                    return (
                      <span key={p.code} title={actif ? o.votrePays : undefined}
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${actif ? "bg-purple-950 text-white ring-2 ring-fuchsia-300" : "bg-white text-slate-700 ring-1 ring-slate-200"}`}>
                        {actif && "● "}{p.nom}
                      </span>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Ce que l'application fait concrètement */}
        <div className="grid grid-cols-1 gap-px bg-slate-100 sm:grid-cols-2 lg:col-span-3">
          {o.piliers.map((p, i) => (
            <div key={p.titre} className="bg-white p-5 sm:p-6">
              <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${ICONES_PILIERS[i].teinte}`}>{ICONES_PILIERS[i].icone}</span>
              <h3 className="mt-3 text-sm font-semibold text-slate-900 sm:text-base">{p.titre}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{p.texte}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

/* ------------------------------------------------------------------ */
/* Votre espace : accès aux modules                                     */
/* ------------------------------------------------------------------ */

interface Module { cle: string; titre: string; desc: string; lien: string; icone: React.ReactNode; teinte: string; trait: string; info?: string }

const Espace: React.FC<{ data?: VueMagasin }> = ({ data }) => {
  const { t } = useTextesAccueil();
  const m = t.modules;
  const modules: Module[] = [
    { cle: "dashboard", ...m.dashboard, lien: "/admin/dashboard/home", icone: <LayoutDashboard size={22} />, teinte: "bg-purple-100 text-purple-950", trait: "bg-purple-700",
      info: data ? t.infos.dashboard(nombreAlertes(data)) : undefined },
    { cle: "ventes", ...m.ventes, lien: "/admin/dashboard/deliverys", icone: <ShoppingBag size={22} />, teinte: "bg-orange-100 text-orange-700", trait: "bg-orange-500",
      info: data ? t.infos.ventes(data.kpis.ventes.valeur) : undefined },
    { cle: "produits", ...m.produits, lien: "/admin/dashboard/produits_approvisionnements", icone: <Boxes size={22} />, teinte: "bg-emerald-100 text-emerald-800", trait: "bg-emerald-500",
      info: data ? t.infos.produits(data.stock.produits, data.stock.ruptures) : undefined },
    { cle: "clients", ...m.clients, lien: "/admin/dashboard/customers", icone: <Users size={22} />, teinte: "bg-sky-100 text-sky-800", trait: "bg-sky-500",
      info: data ? t.infos.clients(data.kpis.creances.clients) : undefined },
    { cle: "equipe", ...m.equipe, lien: "/admin/dashboard/users", icone: <UsersRound size={22} />, teinte: "bg-indigo-100 text-indigo-800", trait: "bg-indigo-500",
      info: data ? t.infos.equipe(data.vendeurs.length) : undefined },
    { cle: "messages", ...m.messages, lien: "/admin/dashboard/messages", icone: <MessageSquareText size={22} />, teinte: "bg-rose-100 text-rose-700", trait: "bg-rose-500", info: t.infos.messages },
    { cle: "finances", ...m.finances, lien: "/admin/dashboard/finance", icone: <Calculator size={22} />, teinte: "bg-teal-100 text-teal-800", trait: "bg-teal-500",
      info: data ? `${t.infos.finances} : ${formatMontant(data.kpis.resultat.valeur, data.magasin.devise)}` : undefined },
    { cle: "rapports", ...m.rapports, lien: "/admin/dashboard/reports", icone: <FileBarChart size={22} />, teinte: "bg-amber-100 text-amber-800", trait: "bg-amber-500", info: t.infos.rapports },
  ];

  return (
    <section>
      <div className="mb-4 sm:mb-5">
        <h2 className="text-xl font-bold text-purple-950 sm:text-2xl">{t.votreEspace}</h2>
        <p className="mt-1 text-sm text-slate-500">{t.votreEspaceSous}</p>
      </div>
      {/* 2 cartes par ligne sur mobile, 2 sur tablette, 4 sur grand écran */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-4 xl:grid-cols-4">
        {modules.map((mod) => (
          <Link key={mod.cle} to={mod.lien}
            className="group relative flex min-w-0 flex-col overflow-hidden rounded-2xl border border-purple-100/70 !bg-white p-3 !text-slate-900 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-purple-200 hover:shadow-md sm:p-5">
            {/* Trait de couleur unie qui apparaît au survol */}
            <span className={`absolute inset-x-0 top-0 h-1 ${mod.trait} opacity-0 transition-opacity group-hover:opacity-100`} />
            <div className="flex shrink-0 items-start justify-between gap-3">
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl sm:h-11 sm:w-11 ${mod.teinte}`}>{mod.icone}</span>
              <span className="hidden h-8 w-8 items-center justify-center rounded-full bg-slate-50 text-slate-400 transition-colors group-hover:bg-purple-950 group-hover:text-white sm:flex">
                <ArrowRight size={16} />
              </span>
            </div>
            <div className="flex min-w-0 flex-1 flex-col">
              <h3 className="mt-2.5 text-sm font-semibold leading-snug text-slate-900 sm:mt-4 sm:text-base">{mod.titre}</h3>
              <p className="mt-1 hidden text-sm leading-snug text-slate-500 sm:block">{mod.desc}</p>
              {mod.info && (
                <p className="mt-auto pt-2 text-[11px] font-medium leading-snug text-slate-600 sm:pt-3 sm:text-xs">
                  <span className="sm:inline-flex sm:rounded-full sm:bg-slate-50 sm:px-2.5 sm:py-1">{mod.info}</span>
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};

/* ------------------------------------------------------------------ */
/* Assistant IA (fond uni indigo profond)                               */
/* ------------------------------------------------------------------ */

const BlocIA: React.FC = () => {
  const { t } = useTextesAccueil();
  return (
    <section className="relative flex h-full flex-col overflow-hidden rounded-2xl bg-[#1e1b4b] p-5 text-white shadow-sm sm:p-6">
      <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-indigo-900" />
      <div className="relative flex flex-1 flex-col">
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-fuchsia-500 px-2.5 py-1 text-xs font-semibold text-white">
          <Sparkles size={13} /> {t.ia.badge}
        </span>
        <h2 className="mt-4 text-xl font-bold sm:text-2xl">{t.ia.titre}</h2>
        <p className="mt-2 text-sm leading-relaxed text-indigo-100">{t.ia.desc}</p>
        <ul className="mt-4 space-y-2">
          {t.ia.exemples.map((e) => (
            <li key={e} className="rounded-xl bg-white/[0.07] px-3 py-2 text-sm text-indigo-50 ring-1 ring-white/10">« {e} »</li>
          ))}
        </ul>
        <Link to="/admin/dashboard/ia"
          className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl !bg-white px-4 py-2.5 text-sm font-semibold !text-[#1e1b4b] shadow-md transition-colors hover:!bg-indigo-50 sm:w-fit lg:mt-auto">
          <Sparkles size={16} /> {t.ia.bouton}
        </Link>
      </div>
    </section>
  );
};

/* ------------------------------------------------------------------ */
/* Page                                                                 */
/* ------------------------------------------------------------------ */

const AccueilAdmin: React.FC = () => {
  const { t } = useTextesAccueil();
  const moi = useQuery({ queryKey: ["moi"], queryFn: fetchMoi, staleTime: 5 * 60 * 1000 });
  const profil = useQuery({ queryKey: ["profil-magasin"], queryFn: fetchProfil, staleTime: 5 * 60 * 1000 });
  const vue = useQuery({ queryKey: ["admin-vue-ensemble", 7], queryFn: () => fetchVueMagasin(7) });
  const data = vue.data;

  return (
    <div className="mx-auto flex w-full min-w-0 max-w-[1500px] flex-col gap-5 sm:gap-6">
      <Bandeau moi={moi.data} data={data} profil={profil.data} chargement={vue.isLoading} erreur={vue.isError} />
      {data && <Alertes data={data} />}
      {profil.data && <FicheEntreprise profil={profil.data} />}
      <Espace data={data} />
      {profil.data && <EspaceOhada profil={profil.data} />}
      <div className="grid grid-cols-1 gap-5 sm:gap-6 lg:grid-cols-5">
        {data && <div className="min-w-0 lg:col-span-3"><VentesRecentesCard data={data} /></div>}
        <div className={`min-w-0 ${data ? "lg:col-span-2" : "lg:col-span-5"}`}><BlocIA /></div>
      </div>
      <footer className="flex flex-col items-center justify-between gap-2 border-t border-purple-100 pt-4 text-xs text-slate-400 sm:flex-row">
        <span>{t.pied}</span>
        <span>© {new Date().getFullYear()}</span>
      </footer>
    </div>
  );
};

export default AccueilAdmin;
