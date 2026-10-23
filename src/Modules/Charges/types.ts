export type ChargeCategory =
  | 'achats_fournitures'
  | 'electricite'
  | 'transport'
  | 'loyer'
  | 'entretien'
  | 'assurance'
  | 'publicite'
  | 'telecom'
  | 'frais_bancaires'
  | 'honoraires'
  | 'impots'
  | 'salaire'
  | 'charges_sociales'
  | 'interets'
  | 'autre';
export type StatutCharge = 'payee' | 'a_payer';
export type Recurrence = 'aucune' | 'mensuelle' | 'trimestrielle' | 'annuelle';
export type AssetCategory = 'informatique' | 'mobilier' | 'vehicule' | 'equipement' | 'autre';

export interface Charge {
  _id: string;
  nom: string;
  /** Montant TTC */
  montant: number;
  /** TVA récupérable comprise dans le montant */
  montant_tva: number;
  categorie: ChargeCategory;
  /** Compte SYSCOHADA de la catégorie */
  compte: string;
  description: string;
  fournisseur: string;
  reference: string;
  statut: StatutCharge;
  date_charge: string;
  date_paiement: string | null;
  date_echeance: string | null;
  mode_paiement: string | null;
  recurrence: Recurrence;
  pieces_jointes: PieceJointe[];
  magasin_id: string;
  created_at: string;
  updated_at: string;
}

export interface CreateChargeDto {
  nom: string;
  montant: number;
  montant_tva?: number;
  categorie: ChargeCategory;
  description?: string;
  fournisseur?: string;
  reference?: string;
  statut?: StatutCharge;
  date_charge?: string;
  date_paiement?: string | null;
  date_echeance?: string | null;
  mode_paiement?: string | null;
  recurrence?: Recurrence;
}

export interface Asset {
  _id: string;
  nom: string;
  valeur_achat: number;
  valeur_residuelle: number;
  duree_vie_annees: number;
  categorie: AssetCategory;
  date_achat: string;
  description?: string;
  mode_paiement?: string;
  amortissement_mensuel: number;
  amortissement_annuel: number;
  amortissements_cumules: number;
  valeur_nette: number;
  /** TVA récupérable payée à l'achat (la valeur d'achat est hors taxe). */
  montant_tva: number;
  /** Valeur résiduelle calculée d'après la catégorie. */
  residuelle_auto: boolean;
  taux_residuel: number;
  fournisseur?: string;
  reference?: string;
  cession: CessionAsset | null;
}

export interface CessionAsset {
  date: string;
  prix: number;
  mode_paiement: string;
  acheteur: string;
  valeur_nette: number;
  plus_value: number;
}

export interface CreateAssetDto {
  nom: string;
  valeur_achat: number;
  valeur_residuelle?: number;
  duree_vie_annees: number;
  categorie: AssetCategory;
  date_achat?: string;
  description?: string;
  mode_paiement?: string;
  montant_tva?: number;
  residuelle_auto?: boolean;
  fournisseur?: string;
  reference?: string;
}

// ---------------------------------------------------------------- comptabilité
export interface LigneResultat {
  cle: string;
  libelle: string;
  compte: string;
  type: 'produit' | 'charge' | 'detail' | 'total' | 'resultat';
  niveau: number;
  montant: number;
  precedent: number;
}

export interface Montant {
  libelle: string;
  montant: number;
  cle?: string;
}

/** Poste du bilan (les clôtures anciennes n'ont que libelle et montant). */
export interface PosteBilan extends Montant {
  rubrique?: string;
  compte?: string;
  brut?: number;
  amortissements?: number;
  calcule?: boolean;
}

export interface Bilan {
  actif: PosteBilan[];
  passif: PosteBilan[];
  total: number;
  total_actif?: number;
  total_passif?: number;
  ouverture?: number;
  rubriques?: { actif: { cle: string; libelle: string; total: number }[]; passif: { cle: string; libelle: string; total: number }[] };
  ratios?: { fonds_roulement: number; liquidite: number | null; endettement: number | null };
  position_tva?: number;
  position_is?: number;
}

export interface SyntheseFinance {
  periode: { debut: string; fin: string; jours: number };
  precedente: { debut: string; fin: string };
  compte_resultat: LigneResultat[];
  indicateurs: {
    chiffre_affaires: number;
    chiffre_affaires_precedent: number;
    marge: number;
    marge_precedente: number;
    taux_marge: number;
    ebe: number;
    resultat_net: number;
    resultat_net_precedent: number;
    resultat_avant_impot: number;
    impot_resultat: number;
    taux_resultat: number;
    charges: number;
    charges_precedentes: number;
    charges_fixes: number;
    seuil_rentabilite: number | null;
    point_mort_jours: number | null;
    ventes: number;
  };
  evolution: { annee: number; mois: { mois: number; ca: number; marge: number; charges: number; resultat: number }[] };
  tresorerie: {
    solde_debut: number;
    solde_fin: number;
    configure: boolean;
    solde_ouverture: number;
    soldes_ouverture: Record<'571' | '521' | '552', number>;
    date_ouverture: string | null;
    soldes_fin: { compte: string; libelle: string; solde: number }[];
    entrees: Montant[];
    sorties: Montant[];
    total_entrees: number;
    total_sorties: number;
    net: number;
    par_compte: { compte: string; libelle: string; entrees: number; sorties: number; net: number }[];
  };
  tva: {
    collectee: number;
    deductible: number;
    deductible_charges: number;
    deductible_achats: number;
    deductible_immobilisations: number;
    a_reverser: number;
    taux: number | null;
    assujetti: boolean;
  };
  impot: {
    regime: RegimeFiscal;
    taux_is: number;
    taux_minimum: number;
    resultat_avant_impot: number;
    theorique: number;
    minimum: number;
    du: number;
  };
  bilan: Bilan;
  a_payer: {
    nombre: number;
    montant: number;
    factures: number;
    montant_factures: number;
    en_retard: number;
    montant_en_retard: number;
  };
  creances: number;
}

export interface LigneEcriture {
  compte: string;
  intitule: string;
  debit: number;
  credit: number;
}

export interface Ecriture {
  date: string;
  journal: 'VT' | 'AC' | 'CA' | 'BQ' | 'MM' | 'OD';
  piece: string;
  ref: string | null;
  libelle: string;
  lignes: LigneEcriture[];
}

export interface JournalComptable {
  periode: { debut: string; fin: string };
  ecritures: Ecriture[];
  totaux: { debit: number; credit: number; ecritures: number; resultat?: number };
  balance: { compte: string; intitule: string; debit: number; credit: number; solde: number }[];
}

export interface ParametresCompta {
  solde_ouverture: number;
  date_ouverture: string | null;
  configure: boolean;
}

// ---------------------------------------------------------------- pièces jointes
export interface PieceJointe {
  id: string;
  nom: string;
  type: string;
  taille: number;
  date: string;
}

// ---------------------------------------------------------------- factures fournisseurs
export type StatutFacture = 'a_payer' | 'partielle' | 'payee' | 'annulee';

export interface LigneFacture {
  produit_id: string;
  nom: string;
  quantite: number;
  prix_achat: number;
  total: number;
}

export interface ReglementFournisseur {
  id: string;
  date: string;
  montant: number;
  mode: string;
  reference: string;
}

export interface AvoirFournisseur {
  id: string;
  date: string;
  lignes: LigneFacture[];
  montant_ht: number;
  montant_tva: number;
  montant_ttc: number;
  motif: string;
}

export interface FactureFournisseur {
  _id: string;
  numero: string;
  fournisseur_id: string | null;
  fournisseur_nom: string;
  date_facture: string;
  date_echeance: string | null;
  lignes: LigneFacture[];
  montant_ht: number;
  montant_tva: number;
  montant_ttc: number;
  montant_avoirs: number;
  montant_net: number;
  montant_paye: number;
  reste: number;
  /** Payé au-delà du montant dû après avoir : à récupérer auprès du fournisseur. */
  a_recevoir: number;
  statut: StatutFacture;
  avoirs: AvoirFournisseur[];
  /** Quantités déjà rendues au fournisseur, par produit. */
  rendu: Record<string, number>;
  en_retard: boolean;
  paiements: ReglementFournisseur[];
  pieces_jointes: PieceJointe[];
  note: string;
}

export interface NouvelleFacture {
  fournisseur_id?: string;
  fournisseur_nom?: string;
  numero?: string;
  date_facture: string;
  date_echeance?: string | null;
  montant_tva?: number;
  note?: string;
  lignes: { produit_id: string; quantite: number; prix_achat: number }[];
  paiement?: { montant: number; mode: string };
}

// ---------------------------------------------------------------- rapprochement
export type CompteBancaire = '521' | '552';

export interface OperationCompte {
  ref: string;
  date?: string;
  libelle: string;
  piece?: string;
  montant: number | null;
}

export interface LigneReleve {
  id: string;
  date: string;
  libelle: string;
  reference: string;
  montant: number;
  statut: 'rapproche' | 'non_rapproche';
  operations: OperationCompte[];
}

export interface EtatRapprochement {
  compte: CompteBancaire;
  libelle: string;
  lignes: LigneReleve[];
  en_attente: OperationCompte[];
  totaux: {
    releve: number;
    application: number;
    rapproche: number;
    lignes_non_rapprochees: number;
    ecart_releve: number;
    ecart_application: number;
  };
}

// ---------------------------------------------------------------- clôture
export interface Cloture {
  id: string;
  exercice: number;
  date_debut: string;
  date_fin: string;
  resultat: number;
  cloture_par: string | null;
  cloture_le: string | null;
  compte_resultat: LigneResultat[];
  bilan: Bilan;
}

export interface EtatClotures {
  date_verrouillage: string | null;
  clotures: Cloture[];
}

// ---------------------------------------------------------------- impôts et taxes
export type RegimeFiscal = 'reel' | 'simplifie' | 'forfait';

export interface ParametresFiscaux {
  pays: string | null;
  code_pays: string | null;
  taux_tva: number | null;
  assujetti_tva: boolean;
  regime: RegimeFiscal;
  regimes: { value: RegimeFiscal; label: string }[];
  taux_is: number;
  taux_minimum: number;
  taux_is_defaut: number | null;
  taux_minimum_defaut: number;
  capital_social: number;
  personnalise: boolean;
}

export type StatutTva = 'a_venir' | 'en_cours' | 'a_payer' | 'en_retard' | 'paye' | 'credit' | 'neant';

export interface MoisTva {
  mois: number;
  periode: string;
  echeance: string;
  statut: StatutTva;
  collectee: number;
  deductible: number;
  deductible_charges: number;
  deductible_achats: number;
  deductible_immobilisations: number;
  credit_reporte: number;
  a_payer: number;
  paye: number;
  reste: number;
  credit_suivant: number;
  rembourse: number;
  chiffre_affaires: number;
  acompte_is: number;
}

export type TypeOperationFiscale = 'tva' | 'remboursement_tva' | 'is';

export interface OperationFiscale {
  _id: string;
  type: TypeOperationFiscale;
  libelle_type: string;
  periode: string;
  montant: number;
  date: string;
  mode_paiement: string;
  reference: string;
  note: string;
}

export interface SituationFiscale {
  annee: number;
  parametres: ParametresFiscaux;
  mois: MoisTva[];
  totaux: { collectee: number; deductible: number; a_payer: number; paye: number; reste: number; credit_fin: number; acomptes_is: number };
  impot_resultat: {
    exercice: number;
    chiffre_affaires: number;
    resultat_avant_impot: number;
    theorique: number;
    minimum: number;
    du: number;
    verse: number;
    reste: number;
    base: 'minimum' | 'benefice';
    provisoire: boolean;
  };
  autres_taxes: { total: number; a_payer: number; lignes: { id: string; nom: string; montant: number; date: string; statut: string }[] };
  operations: OperationFiscale[];
  annees: number[];
}

// ---------------------------------------------------------------- capital et emprunts
export type TypeFinancement = 'apport_capital' | 'apport' | 'retrait' | 'emprunt' | 'remboursement';

export interface OperationFinancement {
  _id: string;
  type: TypeFinancement;
  libelle_type: string;
  libelle: string;
  tiers: string;
  montant: number;
  interets: number;
  date: string;
  mode_paiement: string;
  emprunt_id: string | null;
  duree_mois: number | null;
  taux: number | null;
  note: string;
}

export interface Emprunt extends OperationFinancement {
  restant_du: number;
  rembourse: number;
  interets_payes: number;
  remboursements: OperationFinancement[];
}

export interface Financements {
  operations: OperationFinancement[];
  emprunts: Emprunt[];
  totaux: { capital: number; apports: number; retraits: number; emprunte: number; restant_du: number };
}
