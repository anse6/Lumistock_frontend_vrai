// Lecteur de code-barres : écoute globale du clavier, état de connexion et
// distribution des scans à l'écran ouvert (vente, codes-barres, fiche produit…).
//
// - Un écran s'abonne avec useScanCodeBarre(gestionnaire) ; le dernier abonné reçoit le scan.
// - Un champ marqué data-saisie-code-barre garde la frappe pour lui (formulaire produit,
//   saisie manuelle) : le scan y est tapé normalement, sans être intercepté.
// - Si le scan arrive dans un autre champ (recherche client, quantité…), les caractères
//   tapés par le lecteur sont retirés du champ : le code ne « pollue » pas la saisie.
//
// Connexion : un lecteur se présente comme un clavier, une page web ne voit donc pas
// son branchement. Le message « Lecteur connecté » s'affiche au premier scan reconnu.
// Dans l'application de bureau (Electron), le branchement USB est signalé par le pont
// window.lumistockBureau (ou l'évènement window « lumistock:lecteur ») : voir electron/lecteur-usb.cjs.
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { App } from "antd";
import { DetecteurScan, estToucheDeCode, type ScanDetecte } from "./detecteur";

export type EtatLecteur = "attente" | "connecte" | "deconnecte";
export type GestionnaireScan = (scan: ScanDetecte) => void;

interface ContexteLecteur {
  etat: EtatLecteur;
  nom: string | null;
  dernierCode: string | null;
  abonner: (gestionnaire: GestionnaireScan) => () => void;
}

const Contexte = createContext<ContexteLecteur | null>(null);
const CLE_SESSION = "lecteur_code_barre_connecte";
const ATTENTE_MAX_MS = 2500;
export const EVENEMENT_LECTEUR = "lumistock:lecteur";

interface DetailLecteur {
  connecte: boolean;
  nom?: string;
}
interface PontBureau {
  etatLecteur?: () => Promise<DetailLecteur | null>;
  surLecteur?: (rappel: (detail: DetailLecteur) => void) => void | (() => void);
}

const lireSession = () => {
  try {
    return sessionStorage.getItem(CLE_SESSION) === "1";
  } catch {
    return false;
  }
};
const ecrireSession = (connecte: boolean) => {
  try {
    if (connecte) sessionStorage.setItem(CLE_SESSION, "1");
    else sessionStorage.removeItem(CLE_SESSION);
  } catch {
    /* stockage indisponible */
  }
};

type ChampTexte = HTMLInputElement | HTMLTextAreaElement;
const estChampTexte = (el: EventTarget | null): el is ChampTexte =>
  (el instanceof HTMLInputElement && !["checkbox", "radio", "button", "submit", "file"].includes(el.type)) ||
  el instanceof HTMLTextAreaElement;

const champReserve = (el: EventTarget | null) =>
  el instanceof Element && !!el.closest("[data-saisie-code-barre]");

// Remet la valeur d'un champ contrôlé par React (le setter natif + évènement input).
const remettreValeur = (champ: ChampTexte, valeur: string) => {
  const proto = champ instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, "value")?.set?.call(champ, valeur);
  champ.dispatchEvent(new Event("input", { bubbles: true }));
};

export const LecteurCodeBarreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { notification, message } = App.useApp();
  const [etat, setEtat] = useState<EtatLecteur>(() => (lireSession() ? "connecte" : "attente"));
  const [nom, setNom] = useState<string | null>(null);
  const [dernierCode, setDernierCode] = useState<string | null>(null);
  const abonnes = useRef<GestionnaireScan[]>([]);
  const enAttente = useRef<ScanDetecte[]>([]);
  const etatRef = useRef(etat);
  etatRef.current = etat;

  const annoncerConnexion = useCallback(
    (nomLecteur?: string | null) => {
      if (etatRef.current !== "connecte") {
        notification.success({
          key: "lecteur-code-barre",
          message: "Lecteur de code-barre connecté avec succès",
          description: nomLecteur
            ? `${nomLecteur} est prêt. Scannez un article pour l'ajouter à la vente.`
            : "Scannez un article pour l'ajouter à la vente.",
          placement: "topRight",
          duration: 4,
        });
      }
      ecrireSession(true);
      setEtat("connecte");
      if (nomLecteur) setNom(nomLecteur);
    },
    [notification],
  );

  // Application de bureau : branchement / débranchement USB.
  useEffect(() => {
    const traiter = (detail?: DetailLecteur | null) => {
      if (!detail) return;
      if (detail.connecte) annoncerConnexion(detail.nom ?? null);
      else {
        ecrireSession(false);
        setEtat("deconnecte");
        notification.warning({
          key: "lecteur-code-barre",
          message: "Lecteur de code-barre déconnecté",
          description: "Rebranchez le câble USB du lecteur pour continuer à scanner.",
          placement: "topRight",
          duration: 6,
        });
      }
    };
    const surEvenement = (e: Event) => traiter((e as CustomEvent<DetailLecteur>).detail);
    window.addEventListener(EVENEMENT_LECTEUR, surEvenement);
    // Pont exposé par le preload Electron (electron/lecteur-usb.cjs).
    const pont = (window as unknown as { lumistockBureau?: PontBureau }).lumistockBureau;
    let actif = true;
    pont?.etatLecteur?.().then((d) => actif && d?.connecte && traiter(d)).catch(() => undefined);
    const arreter = pont?.surLecteur?.((d) => actif && traiter(d));
    return () => {
      actif = false;
      window.removeEventListener(EVENEMENT_LECTEUR, surEvenement);
      if (typeof arreter === "function") arreter();
    };
  }, [annoncerConnexion, notification]);

  // Écoute du clavier (phase de capture : avant les champs et les formulaires).
  useEffect(() => {
    const detecteur = new DetecteurScan();
    let champ: ChampTexte | null = null;
    let valeurAvant = "";
    let minuteur: number | undefined;

    const livrer = (scan: ScanDetecte, cible: EventTarget | null) => {
      setDernierCode(scan.code);
      annoncerConnexion();
      if (champReserve(cible)) return; // le champ traite lui-même la saisie
      if (champ && champ === cible && estChampTexte(champ)) remettreValeur(champ, valeurAvant);
      const gestionnaire = abonnes.current[abonnes.current.length - 1];
      if (gestionnaire) {
        gestionnaire(scan);
        return;
      }
      // Personne n'écoute (changement de page en cours, ex. étape 1 → étape 2) :
      // le scan attend un peu l'écran suivant au lieu d'être perdu.
      enAttente.current.push(scan);
      window.setTimeout(() => {
        const i = enAttente.current.indexOf(scan);
        if (i === -1) return;
        enAttente.current.splice(i, 1);
        if (!estChampTexte(cible)) message.info(`Code lu : ${scan.code}. Ouvrez « Nouvelle vente » pour vendre cet article.`);
      }, ATTENTE_MAX_MS);
    };

    const surTouche = (e: KeyboardEvent) => {
      if (e.isComposing || e.ctrlKey || e.altKey || e.metaKey) {
        detecteur.vider();
        return;
      }
      const maintenant = performance.now();
      if (e.key === "Enter" || e.key === "Tab") {
        window.clearTimeout(minuteur);
        const scan = detecteur.terminer(maintenant);
        if (!scan) return;
        if (!champReserve(e.target)) {
          // Le scan ne doit ni valider un formulaire ni déplacer le curseur.
          e.preventDefault();
          e.stopPropagation();
        }
        livrer(scan, e.target);
        return;
      }
      if (!estToucheDeCode(e.key, e.code)) return;
      const nouvelle = detecteur.ajouter({ key: e.key, code: e.code, shift: e.shiftKey, t: maintenant });
      if (nouvelle) {
        champ = estChampTexte(e.target) ? e.target : null;
        valeurAvant = champ?.value ?? "";
      }
      const cible = e.target;
      window.clearTimeout(minuteur);
      minuteur = window.setTimeout(() => {
        const scan = detecteur.terminerParDelai(performance.now());
        if (scan) livrer(scan, cible);
      }, 120);
    };

    window.addEventListener("keydown", surTouche, true);
    return () => {
      window.clearTimeout(minuteur);
      window.removeEventListener("keydown", surTouche, true);
    };
  }, [annoncerConnexion, message]);

  const abonner = useCallback((gestionnaire: GestionnaireScan) => {
    abonnes.current.push(gestionnaire);
    // Scans arrivés pendant le changement de page : livrés dans l'ordre.
    const enRetard = enAttente.current.splice(0);
    enRetard.forEach((scan) => gestionnaire(scan));
    return () => {
      abonnes.current = abonnes.current.filter((g) => g !== gestionnaire);
    };
  }, []);

  const valeur = useMemo(() => ({ etat, nom, dernierCode, abonner }), [etat, nom, dernierCode, abonner]);
  return <Contexte.Provider value={valeur}>{children}</Contexte.Provider>;
};

/** État du lecteur (connecté, nom, dernier code lu). */
export const useLecteurCodeBarre = () => {
  const ctx = useContext(Contexte);
  return ctx ?? { etat: "attente" as EtatLecteur, nom: null, dernierCode: null, abonner: () => () => undefined };
};

/** Reçoit les scans tant que l'écran est affiché (et que actif vaut true). */
export const useScanCodeBarre = (gestionnaire: GestionnaireScan, actif = true) => {
  const { abonner } = useLecteurCodeBarre();
  const ref = useRef(gestionnaire);
  ref.current = gestionnaire;
  useEffect(() => {
    if (!actif) return;
    return abonner((scan) => ref.current(scan));
  }, [abonner, actif]);
};
