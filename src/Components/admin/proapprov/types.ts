import { ReactNode } from 'react';

export type TabType = 'produits' | 'approvisionnement';

export interface Produit {
  quantite_par_conditionnement: number;
  conditionnement_id: any;
  conditionnement_nom: string;
  facteur: ReactNode;
  is_conditionne: any;
  produit_id: any;
  prix: any;
  quantite: any;
  nom: string | undefined;
  id: string;
  name: string;
  description: string;
  category: string;
  quantity: number;
  remaining: number;
  price: number;
  status: string;
  image: string | null;
  unite: string;
}

export interface Approvisionnement {
  id: string;
  deliveryPerson: string;
  productQuantity: string;
  remainingQuantity: string;
  amount: string;
  date: string;
  status: string;
}