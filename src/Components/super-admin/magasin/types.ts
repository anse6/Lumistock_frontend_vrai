// types.ts
export interface Store {
  magasin?: string;
  id?: string;
  _id: string;
  denomination: string;
  pays: string;
  country_code?: string;
  region?: string;
  ville: string;
  quartier: string;
  adresse_ligne_1?: string;
  adresse_ligne_2?: string;
  code_postal?: string;
  email: string;
  telephone?: string;
  site_web?: string;
  raison_sociale?: string;
  forme_juridique?: string;
  nom_contact?: string;
  prenom_contact?: string;
  fonction_contact?: string;
  numero_immatriculation?: string;
  numero_fiscal?: string;
  devise?: string;
  activité: string;
  licence: {
    max_managers: number;
    max_livreurs: number;
    max_caissiers?: number;
  };
  logo?: string | null;
  is_active: boolean;
  is_archived?: boolean;
  created_at: string | { $date: string } | Date;
  utilisateurs: Array<{
    _id: string;
    name: string;
    first_name: string;
    email: string;
    role: string;
    is_active: boolean;
  }>;
}
