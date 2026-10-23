// Langues de l'application : code i18next, nom dans la langue elle-même,
// drapeau (flagcdn), sens d'écriture et formats (antd, dayjs, Intl).
export type CodeLangue = "fr" | "en" | "es" | "de" | "zh" | "ar";

export interface Langue {
  code: CodeLangue;
  nom: string;
  /** Code pays du drapeau (flagcdn.com) ; null : pas de drapeau (langue de plusieurs pays). */
  drapeau: string | null;
  rtl: boolean;
  /** Locale Intl pour les nombres et les dates. */
  intl: string;
  /** Locale dayjs. */
  dayjs: string;
}

export const LANGUES: Langue[] = [
  { code: "fr", nom: "Français", drapeau: "fr", rtl: false, intl: "fr-FR", dayjs: "fr" },
  { code: "en", nom: "English", drapeau: "gb", rtl: false, intl: "en-GB", dayjs: "en" },
  { code: "es", nom: "Español", drapeau: "es", rtl: false, intl: "es-ES", dayjs: "es" },
  { code: "de", nom: "Deutsch", drapeau: "de", rtl: false, intl: "de-DE", dayjs: "de" },
  { code: "zh", nom: "中文", drapeau: "cn", rtl: false, intl: "zh-CN", dayjs: "zh-cn" },
  // ar-ma : noms des mois en arabe, chiffres occidentaux (ceux des montants FCFA).
  { code: "ar", nom: "العربية", drapeau: null, rtl: true, intl: "ar", dayjs: "ar-ma" },
];

/** Langue connue la plus proche d'un code i18next (ex. « zh-CN » → zh, inconnu → fr). */
export const langueDe = (code?: string | null): Langue =>
  LANGUES.find((l) => l.code === (code || "").slice(0, 2).toLowerCase()) ?? LANGUES[0];
