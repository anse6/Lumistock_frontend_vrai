// Reconnaît un lecteur de code-barres « clavier » (USB, sans pilote).
//
// Un lecteur tape le code beaucoup plus vite qu'un humain (quelques ms par
// caractère) puis envoie Entrée. On garde donc les touches qui arrivent à moins
// de SEUIL_MS l'une de l'autre ; une touche plus lente recommence la saisie.
//
// Piège des claviers AZERTY : un lecteur réglé en QWERTY (réglage d'usine) qui
// « tape » 6001234 sur un PC AZERTY produit « §àà&é"' ». On garde aussi la
// position physique des touches (event.code) pour retrouver le vrai code.

export interface ToucheLue {
  key: string;
  code: string;
  shift: boolean;
  t: number;
}

export interface ScanDetecte {
  /** Code tel qu'il a été reçu (ou reconstitué s'il était déformé). */
  code: string;
  /** Écritures possibles du code, à essayer dans l'ordre. */
  variantes: string[];
}

export const SEUIL_MS = 50;
const LONGUEUR_MIN = 4; // avec Entrée à la fin
const LONGUEUR_MIN_SANS_ENTREE = 6; // lecteurs réglés sans suffixe
const DELAI_ENTREE_MS = 120;

// Caractère produit par chaque touche sur un clavier QWERTY : [normal, Maj].
const QWERTY: Record<string, [string, string]> = {
  Digit1: ["1", "!"], Digit2: ["2", "@"], Digit3: ["3", "#"], Digit4: ["4", "$"], Digit5: ["5", "%"],
  Digit6: ["6", "^"], Digit7: ["7", "&"], Digit8: ["8", "*"], Digit9: ["9", "("], Digit0: ["0", ")"],
  Minus: ["-", "_"], Equal: ["=", "+"], BracketLeft: ["[", "{"], BracketRight: ["]", "}"],
  Semicolon: [";", ":"], Quote: ["'", '"'], Backquote: ["`", "~"], Backslash: ["\\", "|"],
  Comma: [",", "<"], Period: [".", ">"], Slash: ["/", "?"], Space: [" ", " "],
  Numpad0: ["0", "0"], Numpad1: ["1", "1"], Numpad2: ["2", "2"], Numpad3: ["3", "3"], Numpad4: ["4", "4"],
  Numpad5: ["5", "5"], Numpad6: ["6", "6"], Numpad7: ["7", "7"], Numpad8: ["8", "8"], Numpad9: ["9", "9"],
  NumpadSubtract: ["-", "-"], NumpadAdd: ["+", "+"], NumpadDecimal: [".", "."], NumpadDivide: ["/", "/"],
  NumpadMultiply: ["*", "*"],
};
for (const lettre of "ABCDEFGHIJKLMNOPQRSTUVWXYZ") QWERTY[`Key${lettre}`] = [lettre.toLowerCase(), lettre];

const caractereQwerty = (t: ToucheLue) => {
  const paire = QWERTY[t.code];
  return paire ? paire[t.shift ? 1 : 0] : t.key;
};

const chiffreDeLaTouche = (code: string) => {
  const m = /^(?:Digit|Numpad)(\d)$/.exec(code);
  return m ? m[1] : null;
};

/** Écritures possibles d'un code lu touche par touche. */
export const variantesDepuisTouches = (touches: ToucheLue[]): string[] => {
  const parCaractere = touches.map((t) => t.key).join("");
  const parPosition = touches.map(caractereQwerty).join("");
  const chiffres = touches.map((t) => chiffreDeLaTouche(t.code));
  const toutEnChiffres = chiffres.every((c) => c !== null) ? chiffres.join("") : null;
  const liste = [parCaractere, toutEnChiffres, parPosition].filter((v): v is string => !!v && v.trim().length > 0);
  // Si le code reçu a été déformé par le clavier, l'écriture reconstituée passe devant.
  if (toutEnChiffres && !/^\d+$/.test(parCaractere)) liste.unshift(toutEnChiffres);
  return [...new Set(liste.map((v) => v.trim()))];
};

/** Touche qui peut faire partie d'un code (les touches mortes comme ^ comprises). */
export const estToucheDeCode = (key: string, code: string) =>
  key.length === 1 || (key === "Dead" && code in QWERTY);

/** Variantes d'un code saisi à la main (ou collé). */
export const variantesSaisie = (texte: string): string[] => {
  const code = texte.trim();
  if (!code) return [];
  // Chiffres tapés sans Maj sur un clavier AZERTY : &é"'(-è_çà → 1234567890.
  const azerty: Record<string, string> = { "&": "1", "é": "2", '"': "3", "'": "4", "(": "5", "-": "6", "è": "7", "_": "8", "ç": "9", "à": "0" };
  const reconstitue = [...code].map((c) => azerty[c] ?? c).join("");
  return /^\d+$/.test(reconstitue) && reconstitue !== code ? [code, reconstitue] : [code];
};

/** Accumule les touches et dit quand elles forment un scan. */
export class DetecteurScan {
  private touches: ToucheLue[] = [];

  get enCours() {
    return this.touches.length;
  }

  /** Touche imprimable. Renvoie true si elle commence une nouvelle saisie. */
  ajouter(touche: ToucheLue): boolean {
    const derniere = this.touches[this.touches.length - 1];
    const nouvelle = !derniere || touche.t - derniere.t > SEUIL_MS;
    if (nouvelle) this.touches = [];
    this.touches.push(touche);
    return nouvelle;
  }

  /** Entrée ou Tab reçue : renvoie le scan, ou null si c'était une frappe humaine. */
  terminer(t: number): ScanDetecte | null {
    const derniere = this.touches[this.touches.length - 1];
    const ok = this.touches.length >= LONGUEUR_MIN && !!derniere && t - derniere.t <= DELAI_ENTREE_MS;
    const scan = ok ? this.scan() : null;
    this.touches = [];
    return scan;
  }

  /** Plus rien depuis un moment : scan sans Entrée finale, si le code est assez long. */
  terminerParDelai(t: number): ScanDetecte | null {
    const derniere = this.touches[this.touches.length - 1];
    if (!derniere || t - derniere.t < SEUIL_MS) return null;
    const scan = this.touches.length >= LONGUEUR_MIN_SANS_ENTREE ? this.scan() : null;
    this.touches = [];
    return scan;
  }

  vider() {
    this.touches = [];
  }

  private scan(): ScanDetecte | null {
    const variantes = variantesDepuisTouches(this.touches);
    return variantes.length ? { code: variantes[0], variantes } : null;
  }
}
