// Onglets du tableau de bord admin.
import type { Onglets } from "./api";

export type CleOnglet = "apercu" | keyof Onglets;
export const CLES_ONGLETS: CleOnglet[] = ["apercu", "ventes", "stock", "clients", "finances", "equipe"];
