// Traduction des textes d'interface écrits en français dans le code.
//
// Beaucoup d'écrans affichent des textes français écrits en dur (hors t()). Ce module
// les traduit à l'affichage : chaque texte français connu est remplacé par sa traduction
// (dictionnaire src/locales/<langue>/interface.json, généré à partir du code source).
//
// - Seuls les textes affichés sont touchés : nœuds texte et attributs placeholder,
//   title, aria-label, alt. Les valeurs saisies (input, textarea) ne le sont jamais.
// - Les textes avec une partie variable (« {0} vente(s) sur 7 jours ») sont reconnus
//   par gabarit ; la partie variable est elle-même traduite si elle est connue.
// - Une zone marquée translate="no" ou .notranslate n'est pas traduite.
// - En français, rien n'est modifié. En changeant de langue, les textes d'origine
//   sont retrouvés puis traduits dans la nouvelle langue.
import i18n from "../i18n";
import { langueDe } from "../langues";

type Dico = Record<string, string>;
interface Gabarit {
  /** Texte fixe entre les parties variables (un de plus que de {n}), sans espaces autour. */
  morceaux: string[];
  /** Un espace séparait ce morceau de la partie variable voisine (avant / après). */
  espaceAvant: boolean[];
  espaceApres: boolean[];
  vers: string;
  morceau: string;
  fixe: number;
}

const CHARGEURS: Record<string, () => Promise<{ default: Dico }>> = {
  en: () => import("../locales/en/interface.json"),
  es: () => import("../locales/es/interface.json"),
  de: () => import("../locales/de/interface.json"),
  zh: () => import("../locales/zh/interface.json"),
  ar: () => import("../locales/ar/interface.json"),
};

const ATTRIBUTS = ["placeholder", "title", "aria-label", "alt"];
const EXCLUS = 'script,style,textarea,code,pre,[translate="no"],.notranslate,[contenteditable="true"]';
const EXCLUS_ATTR = 'script,style,code,pre,[translate="no"],.notranslate';

let langue = "fr";
let dico: Dico | null = null;
// Même dictionnaire en majuscules (titres de colonnes des PDF écrits en capitales).
let dicoMaj: Dico = {};
let gabarits: Gabarit[] = [];

// Texte français d'origine et dernier texte écrit par ce module, par nœud.
const originaux = new WeakMap<Node, string>();
const appliques = new WeakMap<Node, string>();
const attrOriginaux = new WeakMap<Element, Record<string, string>>();
const attrAppliques = new WeakMap<Element, Record<string, string>>();

const normaliser = (s: string) => s.replace(/[\s\u00a0\u202f]+/g, " ").trim();

const preparer = (d: Dico) => {
  dico = d;
  dicoMaj = {};
  for (const [fr, vers] of Object.entries(d)) if (!/\{\d+\}/.test(fr)) dicoMaj[fr.toUpperCase()] ??= vers.toUpperCase();
  gabarits = Object.entries(d)
    .filter(([fr]) => /\{\d+\}/.test(fr))
    .map(([fr, vers]) => {
      const bruts = fr.split(/\{\d+\}/);
      const morceaux = bruts.map((m) => m.trim());
      // L'ordre des {n} dans la source donne l'ordre des valeurs capturées.
      const ordre = [...fr.matchAll(/\{(\d+)\}/g)].map((m) => Number(m[1]));
      const versOrdonne = vers.replace(/\{(\d+)\}/g, (_, i) => `{${ordre.indexOf(Number(i))}}`);
      const fixe = morceaux.reduce((t, m) => t + m.length, 0);
      const plusLong = [...morceaux].sort((x, y) => y.length - x.length)[0] || "";
      return {
        morceaux,
        espaceAvant: bruts.map((m) => /^\s/.test(m)),
        espaceApres: bruts.map((m) => /\s$/.test(m)),
        vers: versOrdonne,
        morceau: plusLong,
        fixe,
      };
    })
    .filter((g) => g.morceau.length >= 2)
    // Les gabarits les plus précis (plus de texte fixe) passent en premier.
    .sort((a, b) => b.fixe - a.fixe);
};

const LETTRE = /[A-Za-zÀ-ÿ]/;
// Un morceau qui touchait une partie variable par un espace ne doit pas se coller à un mot :
// « Vente {0} » ne correspond pas à « Ventes du jour ».
const limiteOk = (texte: string, i: number, espace: boolean) =>
  !espace || i <= 0 || i >= texte.length || !LETTRE.test(texte[i - 1]) || !LETTRE.test(texte[i]);

/** Découpe le texte selon le gabarit, en temps linéaire (pas d'expression régulière). */
const correspondre = (g: Gabarit, n: string): string[] | null => {
  const m = g.morceaux;
  const dernier = m.length - 1;
  if (!n.startsWith(m[0]) || !limiteOk(n, m[0].length, g.espaceApres[0])) return null;
  if (!n.endsWith(m[dernier])) return null;
  const fin = n.length - m[dernier].length;
  if (!limiteOk(n, fin, g.espaceAvant[dernier])) return null;
  const valeurs: string[] = [];
  let pos = m[0].length;
  for (let i = 1; i < dernier; i++) {
    if (!m[i]) {
      valeurs.push(""); // deux parties variables collées : tout va dans la première
      continue;
    }
    let j = n.indexOf(m[i], pos + 1);
    while (j >= 0 && j + m[i].length <= fin && !(limiteOk(n, j, g.espaceAvant[i]) && limiteOk(n, j + m[i].length, g.espaceApres[i])))
      j = n.indexOf(m[i], j + 1);
    if (j < 0 || j + m[i].length > fin) return null;
    valeurs.push(n.slice(pos, j));
    pos = j + m[i].length;
  }
  if (pos > fin) return null;
  valeurs.push(n.slice(pos, fin));
  // Les valeurs vides de deux {n} collés : la première prend tout le texte.
  const res: string[] = [];
  for (let i = 0; i < valeurs.length; i++) {
    if (i + 1 < valeurs.length && m[i + 1] === "") {
      res.push((valeurs[i] + valeurs[i + 1]).trim());
      res.push("");
      i++;
    } else res.push(valeurs[i].trim());
  }
  return res.some((v, i) => !v && !(i > 0 && m[i] === "")) ? null : res;
};

// Une partie variable qui commence ou finit, côté texte fixe, par un petit mot français
// (« des », « les », « sur »…) n'est acceptée que si elle se traduit elle-même : sinon
// « {0} produits » s'appliquerait à « Créer des produits ». Un nom propre (« Le Palmier »)
// garde sa majuscule et passe.
const PETITS_MOTS = "le|la|les|des|du|de|d'|l'|un|une|sur|pour|avec|dans|par|et|ou|au|aux|à|en|ce|cette|ces|vos|votre|son|sa|ses|leur|leurs|cliquez|voir|pas|plus|qui|que";
const DEBUT_FR = new RegExp(`^(${PETITS_MOTS})(?=[\\s'’]|$)`);
const FIN_FR = new RegExp(`(^|[\\s'’])(${PETITS_MOTS})$`);

/** Traduit un texte français connu dans la langue courante (sinon le rend tel quel). */
export const traduireTexte = (texte: string, profondeur = 0): string => {
  if (!dico || langue === "fr" || !texte) return texte;
  const n = normaliser(texte);
  if (!n || !/[A-Za-zÀ-ÿ]/.test(n)) return texte;
  const avant = texte.match(/^[\s\u00a0]*/)?.[0] ?? "";
  const apres = texte.match(/[\s\u00a0]*$/)?.[0] ?? "";
  const exact = dico[n] ?? (n === n.toUpperCase() ? dicoMaj[n] : undefined);
  if (exact !== undefined) return avant + exact + apres;
  if (profondeur < 2) {
    for (const g of gabarits) {
      if (!n.includes(g.morceau)) continue;
      const m = correspondre(g, n);
      if (!m) continue;
      const valeurs = m.map((v, i) => {
        if (!v) return v;
        const t = traduireTexte(v, profondeur + 1);
        if (t !== v) return t;
        const douteux = (g.morceaux[i] && DEBUT_FR.test(v)) || (g.morceaux[i + 1] && FIN_FR.test(v));
        return douteux ? null : t;
      });
      if (valeurs.some((v) => v === null)) continue;
      return avant + g.vers.replace(/\{(\d+)\}/g, (_, i) => valeurs[Number(i)] ?? "") + apres;
    }
  }
  // « Alimentation générale · Yaoundé » : chaque partie est traduite séparément.
  for (const sep of [" · ", " — "]) {
    if (profondeur > 2 || !n.includes(sep)) continue;
    const parties = n.split(sep);
    const trad = parties.map((p) => traduireTexte(p, profondeur + 1));
    if (trad.some((t, i) => t !== parties[i])) return avant + trad.join(sep) + apres;
  }
  return texte;
};

const exclu = (el: Element | null) => !el || !!el.closest(EXCLUS);

// React écrit « Entre {a} h et {b} h. » en plusieurs nœuds texte voisins : on traduit
// la phrase entière (dans le premier nœud) quand elle est connue.
const phrases = new WeakSet<Node>();
const estTexte = (n: Node | null): n is Text => !!n && n.nodeType === Node.TEXT_NODE;
const traiterPhrase = (noeud: Text): boolean => {
  let debut: Node = noeud;
  while (estTexte(debut.previousSibling)) debut = debut.previousSibling;
  const noeuds: Text[] = [];
  for (let n: Node | null = debut; estTexte(n); n = n.nextSibling) noeuds.push(n);
  if (noeuds.length < 2) return false;
  const tete = noeuds[0];
  const origines = noeuds.map((n) => {
    const v = n.nodeValue ?? "";
    return appliques.get(n) === v ? (originaux.get(n) ?? v) : v;
  });
  const complet = origines.join("");
  const traduit = traduireTexte(complet);
  if (traduit === complet) {
    if (!phrases.has(tete)) return false;
    // Phrase traduite d'un bloc mais plus reconnue (une valeur a changé) : on remet les morceaux.
    phrases.delete(tete);
    noeuds.forEach((n, i) => {
      if (appliques.get(n) === n.nodeValue && originaux.get(n) !== undefined) {
        appliques.delete(n);
        n.nodeValue = origines[i];
      }
    });
    return false;
  }
  phrases.add(tete);
  noeuds.forEach((n, i) => {
    originaux.set(n, origines[i]);
    const v = i === 0 ? traduit : "";
    appliques.set(n, v);
    if (n.nodeValue !== v) n.nodeValue = v;
  });
  return true;
};

// Garde-fou : un composant qui réécrit sans cesse son texte (mesure, animation…) n'est
// plus retouché après 30 passages en 2 secondes, pour ne jamais créer de boucle.
const passages = new WeakMap<Node, { n: number; t: number }>();
const tropDePassages = (noeud: Node) => {
  const maintenant = Date.now();
  const p = passages.get(noeud);
  if (!p || maintenant - p.t > 2000) {
    passages.set(noeud, { n: 1, t: maintenant });
    return false;
  }
  p.n++;
  return p.n > 30;
};

const traiterTexte = (noeud: Text) => {
  if (exclu(noeud.parentElement)) return;
  const actuel = noeud.nodeValue ?? "";
  if (appliques.get(noeud) === actuel) return; // déjà traduit par nous
  if (tropDePassages(noeud)) return;
  if (traiterPhrase(noeud)) return;
  originaux.set(noeud, actuel);
  const traduit = traduireTexte(actuel);
  if (traduit !== actuel) {
    appliques.set(noeud, traduit);
    noeud.nodeValue = traduit;
  } else appliques.delete(noeud);
};

const traiterAttribut = (el: Element, nom: string) => {
  const actuel = el.getAttribute(nom);
  if (actuel === null || el.closest(EXCLUS_ATTR)) return;
  const ap = attrAppliques.get(el) ?? {};
  if (ap[nom] === actuel) return;
  const or = attrOriginaux.get(el) ?? {};
  or[nom] = actuel;
  attrOriginaux.set(el, or);
  const traduit = traduireTexte(actuel);
  if (traduit !== actuel) {
    ap[nom] = traduit;
    attrAppliques.set(el, ap);
    el.setAttribute(nom, traduit);
  }
};

/** Traduit tout un sous-arbre (page, fenêtre, ou document d'un cadre d'impression). */
export const traduireArbre = (racine: Node) => {
  if (langue === "fr" || !dico) return;
  if (racine.nodeType === Node.TEXT_NODE) return traiterTexte(racine as Text);
  if (racine.nodeType !== Node.ELEMENT_NODE && racine.nodeType !== Node.DOCUMENT_NODE) return;
  const doc = racine.ownerDocument ?? (racine as Document);
  const parcours = doc.createTreeWalker(racine, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
  for (let n: Node | null = racine; n; n = parcours.nextNode()) {
    if (n.nodeType === Node.TEXT_NODE) traiterTexte(n as Text);
    else if (n.nodeType === Node.ELEMENT_NODE) for (const a of ATTRIBUTS) if ((n as Element).hasAttribute(a)) traiterAttribut(n as Element, a);
  }
};

/** Remet les textes d'origine puis traduit dans la langue courante (changement de langue). */
const retraduireTout = () => {
  const parcours = document.createTreeWalker(document.documentElement, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
  for (let n: Node | null = parcours.currentNode; n; n = parcours.nextNode()) {
    if (n.nodeType === Node.TEXT_NODE) {
      const t = n as Text;
      const origine = originaux.get(t);
      if (origine !== undefined && appliques.get(t) === t.nodeValue) {
        appliques.delete(t);
        t.nodeValue = origine;
      }
    } else if (n.nodeType === Node.ELEMENT_NODE) {
      const el = n as Element;
      const or = attrOriginaux.get(el);
      const ap = attrAppliques.get(el);
      if (or && ap) for (const a of Object.keys(ap)) if (el.getAttribute(a) === ap[a]) el.setAttribute(a, or[a]);
      attrAppliques.delete(el);
    }
  }
  traduireArbre(document.documentElement);
};

const changerDico = async (code: string) => {
  langue = langueDe(code).code;
  if (langue === "fr") {
    dico = null;
    dicoMaj = {};
    gabarits = [];
    retraduireTout(); // remet le français
    return;
  }
  try {
    const module = await CHARGEURS[langue]();
    if (langueDe(i18n.language).code !== langue) return; // langue changée entre-temps
    preparer(module.default);
  } catch {
    dico = null;
    gabarits = [];
  }
  retraduireTout();
};

let installe = false;

/** À appeler une fois au démarrage (main.tsx). */
export const installerTraductionInterface = () => {
  if (installe) return;
  installe = true;
  new MutationObserver((mutations) => {
    if (langue === "fr" || !dico) return;
    for (const m of mutations) {
      if (m.type === "childList") m.addedNodes.forEach((n) => traduireArbre(n));
      else if (m.type === "characterData") traiterTexte(m.target as Text);
      else if (m.type === "attributes" && m.attributeName) traiterAttribut(m.target as Element, m.attributeName);
    }
  }).observe(document.documentElement, {
    subtree: true,
    childList: true,
    characterData: true,
    attributes: true,
    attributeFilter: ATTRIBUTS,
  });
  void changerDico(i18n.language);
  i18n.on("languageChanged", (code) => void changerDico(code));
  // Boîtes de dialogue natives éventuelles.
  const confirmer = window.confirm.bind(window);
  const alerter = window.alert.bind(window);
  window.confirm = (m?: string) => confirmer(m === undefined ? m : traduireTexte(String(m)));
  window.alert = (m?: unknown) => alerter(m === undefined ? m : traduireTexte(String(m)));
};

/** jsPDF : les textes écrits dans les PDF (factures, rapports) sont traduits aussi. */
export const traduirePdf = <T extends { text: (...a: never[]) => unknown; splitTextToSize: (...a: never[]) => unknown }>(pdf: T): T => {
  if (langue === "fr" || !dico) return pdf;
  const p = pdf as unknown as {
    text: (t: unknown, ...r: unknown[]) => unknown;
    splitTextToSize: (t: unknown, ...r: unknown[]) => unknown;
  };
  const texte = p.text.bind(pdf);
  const couper = p.splitTextToSize.bind(pdf);
  const trad = (t: unknown): unknown => (typeof t === "string" ? traduireTexte(t) : Array.isArray(t) ? t.map(trad) : t);
  p.text = (t, ...r) => texte(trad(t), ...r);
  p.splitTextToSize = (t, ...r) => couper(trad(t), ...r);
  return pdf;
};
