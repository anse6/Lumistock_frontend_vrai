import axios from 'axios';
import { getUrlServer } from '../../configServer';
import type {
  Asset,
  Charge,
  ChargeCategory,
  CompteBancaire,
  CreateAssetDto,
  CreateChargeDto,
  EtatClotures,
  EtatRapprochement,
  FactureFournisseur,
  Financements,
  JournalComptable,
  OperationFiscale,
  OperationFinancement,
  ParametresFiscaux,
  SituationFiscale,
  TypeFinancement,
  TypeOperationFiscale,
  NouvelleFacture,
  ParametresCompta,
  Recurrence,
  SyntheseFinance,
} from './types';

const getHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('access_token')}`,
  'Content-Type': 'application/json',
});

/** Message lisible d'une erreur d'API (texte, ou erreurs de validation par champ). */
export const messageErreur = (err: unknown, defaut = 'Opération impossible.') => {
  const data = (err as { response?: { data?: { error?: unknown; message?: string } } })?.response?.data;
  const erreur = data?.error ?? data?.message;
  if (typeof erreur === 'string') return erreur;
  if (erreur && typeof erreur === 'object') return Object.values(erreur).flat().join(' ');
  return defaut;
};

// ---------------------------------------------------------------- référentiels
/** Catégories de charges et leur compte SYSCOHADA (identiques au serveur). */
export const CATEGORIES_CHARGES: { value: ChargeCategory; label: string; compte: string; couleur: string }[] = [
  { value: 'achats_fournitures', label: 'Fournitures et petits achats', compte: '605', couleur: 'geekblue' },
  { value: 'electricite', label: 'Électricité et eau', compte: '605', couleur: 'gold' },
  { value: 'transport', label: 'Transport et carburant', compte: '618', couleur: 'cyan' },
  { value: 'loyer', label: 'Loyer et charges locatives', compte: '622', couleur: 'purple' },
  { value: 'entretien', label: 'Entretien et réparations', compte: '624', couleur: 'orange' },
  { value: 'assurance', label: 'Assurances', compte: '625', couleur: 'lime' },
  { value: 'publicite', label: 'Publicité et marketing', compte: '627', couleur: 'magenta' },
  { value: 'telecom', label: 'Téléphone et internet', compte: '628', couleur: 'blue' },
  { value: 'frais_bancaires', label: 'Frais bancaires et mobile money', compte: '631', couleur: 'volcano' },
  { value: 'honoraires', label: 'Honoraires et prestataires', compte: '632', couleur: 'geekblue' },
  { value: 'impots', label: 'Impôts et taxes (patente…)', compte: '641', couleur: 'red' },
  { value: 'salaire', label: 'Salaires', compte: '661', couleur: 'green' },
  { value: 'charges_sociales', label: 'Charges sociales (CNSS…)', compte: '664', couleur: 'green' },
  { value: 'interets', label: "Intérêts d'emprunt", compte: '671', couleur: 'volcano' },
  { value: 'autre', label: 'Autres charges', compte: '658', couleur: 'default' },
];

export const categorieDe = (cle?: string) =>
  CATEGORIES_CHARGES.find((c) => c.value === cle) || CATEGORIES_CHARGES[CATEGORIES_CHARGES.length - 1];

export const MODES_REGLEMENT = [
  { value: 'cash', label: 'Espèces' },
  { value: 'om', label: 'Orange Money' },
  { value: 'momo', label: 'MTN MoMo' },
  { value: 'bancaire', label: 'Banque (virement, carte)' },
  { value: 'cheque', label: 'Chèque' },
];

export const libelleMode = (mode?: string | null) => MODES_REGLEMENT.find((m) => m.value === mode)?.label || mode || '—';

export const RECURRENCES: { value: Recurrence; label: string }[] = [
  { value: 'aucune', label: 'Ponctuelle' },
  { value: 'mensuelle', label: 'Tous les mois' },
  { value: 'trimestrielle', label: 'Tous les trimestres' },
  { value: 'annuelle', label: 'Tous les ans' },
];

// ---------------------------------------------------------------- charges
export const getCharges = async (): Promise<Charge[]> => {
  const response = await axios.get(`${getUrlServer()}/charges/`, { headers: getHeaders() });
  return response.data;
};

export const createCharge = async (data: CreateChargeDto): Promise<string> => {
  const response = await axios.post(`${getUrlServer()}/charges/`, data, { headers: getHeaders() });
  return response.data.charge_id;
};

export const updateCharge = async (id: string, data: Partial<CreateChargeDto>): Promise<Charge> => {
  const response = await axios.put(`${getUrlServer()}/charges/${id}`, data, { headers: getHeaders() });
  return response.data.charge;
};

export const payerCharge = async (id: string, mode_paiement: string, date_paiement?: string): Promise<Charge> => {
  const response = await axios.post(
    `${getUrlServer()}/charges/${id}/payer`,
    { mode_paiement, date_paiement },
    { headers: getHeaders() },
  );
  return response.data.charge;
};

export const genererChargesRecurrentes = async (mois?: string): Promise<{ message: string; charges: string[] }> => {
  const response = await axios.post(`${getUrlServer()}/charges/recurrentes/generer`, { mois }, { headers: getHeaders() });
  return response.data;
};

export const deleteCharge = async (id: string): Promise<void> => {
  await axios.delete(`${getUrlServer()}/charges/${id}`, { headers: getHeaders() });
};

// ---------------------------------------------------------------- immobilisations
export const getAssets = async (): Promise<Asset[]> => {
  const response = await axios.get(`${getUrlServer()}/assets/`, { headers: getHeaders() });
  return response.data;
};

export const createAsset = async (data: CreateAssetDto): Promise<string> => {
  const response = await axios.post(`${getUrlServer()}/assets/`, data, { headers: getHeaders() });
  return response.data.asset_id;
};

export const updateAsset = async (id: string, data: Partial<CreateAssetDto>): Promise<Asset> => {
  const response = await axios.put(`${getUrlServer()}/assets/${id}`, data, { headers: getHeaders() });
  return response.data.asset;
};

export const deleteAsset = async (id: string): Promise<void> => {
  await axios.delete(`${getUrlServer()}/assets/${id}`, { headers: getHeaders() });
};

// ---------------------------------------------------------------- comptabilité
export const getSynthese = async (debut: string, fin: string, signal?: AbortSignal): Promise<SyntheseFinance> => {
  const response = await axios.get(`${getUrlServer()}/compta/synthese`, { headers: getHeaders(), params: { debut, fin }, signal });
  return response.data;
};

export const getJournal = async (debut: string, fin: string, signal?: AbortSignal): Promise<JournalComptable> => {
  const response = await axios.get(`${getUrlServer()}/compta/journal`, { headers: getHeaders(), params: { debut, fin }, signal });
  return response.data;
};

export const enregistrerParametres = async (
  solde_ouverture: number,
  date_ouverture: string,
  soldes_ouverture?: Record<'571' | '521' | '552', number>,
): Promise<ParametresCompta> => {
  const response = await axios.put(
    `${getUrlServer()}/compta/parametres`,
    { solde_ouverture, date_ouverture, soldes_ouverture },
    { headers: getHeaders() },
  );
  return response.data;
};

// ---------------------------------------------------------------- impôts et taxes
/** Catégories de charges portant normalement une TVA récupérable (comme le serveur). */
export const CATEGORIES_AVEC_TVA = new Set<ChargeCategory>([
  'achats_fournitures', 'electricite', 'transport', 'loyer', 'entretien', 'publicite', 'telecom', 'frais_bancaires',
  'honoraires', 'autre',
]);

/** TVA comprise dans un montant TTC, arrondie à l'unité (franc CFA). */
export const tvaDansTtc = (ttc: number, taux: number | null | undefined) =>
  !taux || !ttc || ttc <= 0 ? 0 : Math.round((ttc * taux) / (100 + taux));

/** TVA sur un montant hors taxe, arrondie à l'unité. */
export const tvaSurHt = (ht: number, taux: number | null | undefined) =>
  !taux || !ht || ht <= 0 ? 0 : Math.round((ht * taux) / 100);

export const getFiscalite = async (): Promise<ParametresFiscaux> =>
  (await axios.get(`${getUrlServer()}/compta/fiscalite`, { headers: getHeaders() })).data;

export const enregistrerFiscalite = async (data: Partial<ParametresFiscaux>): Promise<ParametresFiscaux> =>
  (await axios.put(`${getUrlServer()}/compta/fiscalite`, data, { headers: getHeaders() })).data;

export const getImpots = async (annee: number, signal?: AbortSignal): Promise<SituationFiscale> =>
  (await axios.get(`${getUrlServer()}/compta/impots`, { headers: getHeaders(), params: { annee }, signal })).data;

export const payerImpot = async (data: {
  type: TypeOperationFiscale;
  periode: string;
  montant: number;
  date?: string;
  mode_paiement?: string;
  reference?: string;
}): Promise<OperationFiscale> => (await axios.post(`${getUrlServer()}/compta/impots/paiements`, data, { headers: getHeaders() })).data;

export const supprimerPaiementImpot = async (id: string) =>
  axios.delete(`${getUrlServer()}/compta/impots/paiements/${id}`, { headers: getHeaders() });

// ---------------------------------------------------------------- capital et emprunts
export const getFinancements = async (): Promise<Financements> =>
  (await axios.get(`${getUrlServer()}/compta/financements`, { headers: getHeaders() })).data;

export const creerFinancement = async (data: {
  type: TypeFinancement;
  montant: number;
  interets?: number;
  emprunt_id?: string;
  date?: string;
  mode_paiement?: string;
  tiers?: string;
  libelle?: string;
  duree_mois?: number;
  taux?: number;
  note?: string;
}): Promise<OperationFinancement> => (await axios.post(`${getUrlServer()}/compta/financements`, data, { headers: getHeaders() })).data;

export const supprimerFinancement = async (id: string) =>
  axios.delete(`${getUrlServer()}/compta/financements/${id}`, { headers: getHeaders() });

// ---------------------------------------------------------------- immobilisations
export const cederAsset = async (id: string, data: { date_cession: string; prix_cession: number; mode_paiement?: string; acheteur?: string }) =>
  (await axios.post(`${getUrlServer()}/assets/${id}/cession`, data, { headers: getHeaders() })).data.asset as Asset;

export const annulerCession = async (id: string) =>
  (await axios.delete(`${getUrlServer()}/assets/${id}/cession`, { headers: getHeaders() })).data.asset as Asset;

// ---------------------------------------------------------------- pièces jointes
/** Charges (`charges`) et factures fournisseurs (`factures-fournisseurs`). */
export type Justifiable = 'charges' | 'factures-fournisseurs';

const urlPieces = (type: Justifiable, id: string) =>
  type === 'charges' ? `${getUrlServer()}/charges/${id}/pieces` : `${getUrlServer()}/factures-fournisseurs/${id}/pieces`;

export const ajouterPiece = async (type: Justifiable, id: string, fichier: File) => {
  const data = new FormData();
  data.append('fichier', fichier);
  await axios.post(urlPieces(type, id), data, {
    headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
  });
};

export const supprimerPiece = async (type: Justifiable, id: string, pieceId: string) => {
  await axios.delete(`${urlPieces(type, id)}/${pieceId}`, { headers: getHeaders() });
};

/** Ouvre la pièce dans un nouvel onglet (la route demande le jeton : lecture en blob). */
export const ouvrirPiece = async (type: Justifiable, id: string, pieceId: string, telecharger = false, nom = 'piece') => {
  const fenetre = telecharger ? null : window.open('', '_blank');
  const response = await axios.get(`${urlPieces(type, id)}/${pieceId}`, { headers: getHeaders(), responseType: 'blob' });
  const url = URL.createObjectURL(response.data);
  if (telecharger) {
    const lien = document.createElement('a');
    lien.href = url;
    lien.download = nom;
    lien.click();
  } else if (fenetre) {
    fenetre.location.href = url;
  } else {
    window.open(url, '_blank');
  }
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
};

// ---------------------------------------------------------------- factures fournisseurs
export const getFactures = async (): Promise<FactureFournisseur[]> =>
  (await axios.get(`${getUrlServer()}/factures-fournisseurs`, { headers: getHeaders() })).data;

export const creerFacture = async (data: NouvelleFacture): Promise<FactureFournisseur> =>
  (await axios.post(`${getUrlServer()}/factures-fournisseurs`, data, { headers: getHeaders() })).data;

export const modifierFacture = async (id: string, data: Partial<Pick<FactureFournisseur, 'numero' | 'date_echeance' | 'note' | 'montant_tva'>>) =>
  (await axios.put(`${getUrlServer()}/factures-fournisseurs/${id}`, data, { headers: getHeaders() })).data as FactureFournisseur;

export const reglerFacture = async (
  id: string,
  data: { montant: number; mode: string; date: string; reference?: string; type?: 'reglement' | 'remboursement' },
) =>
  (await axios.post(`${getUrlServer()}/factures-fournisseurs/${id}/paiements`, data, { headers: getHeaders() })).data as FactureFournisseur;

export const annulerReglement = async (id: string, paiementId: string) =>
  (await axios.delete(`${getUrlServer()}/factures-fournisseurs/${id}/paiements/${paiementId}`, { headers: getHeaders() }))
    .data as FactureFournisseur;

/** Avoir : articles rendus au fournisseur ; sans lignes, annulation de toute la facture. */
export const creerAvoir = async (id: string, data: { motif: string; lignes?: { produit_id: string; quantite: number }[] }) =>
  (await axios.post(`${getUrlServer()}/factures-fournisseurs/${id}/avoirs`, data, { headers: getHeaders() })).data as FactureFournisseur;

export const getPolitiqueRetour = async (): Promise<number> =>
  Number((await axios.get(`${getUrlServer()}/compta/politique-retour`, { headers: getHeaders() })).data.retenue_pourcentage) || 0;

export const setPolitiqueRetour = async (retenue_pourcentage: number): Promise<number> =>
  Number(
    (await axios.put(`${getUrlServer()}/compta/politique-retour`, { retenue_pourcentage }, { headers: getHeaders() })).data
      .retenue_pourcentage,
  ) || 0;

export const getFournisseurs = async (): Promise<{ _id: string; nom: string }[]> =>
  (await axios.get(`${getUrlServer()}/fournisseurs`, { headers: getHeaders() })).data;

// ---------------------------------------------------------------- rapprochement bancaire
export const COMPTES_BANCAIRES: { value: CompteBancaire; label: string }[] = [
  { value: '521', label: '521 · Banque' },
  { value: '552', label: '552 · Mobile money' },
];

export const getRapprochement = async (compte: CompteBancaire, debut: string, fin: string, signal?: AbortSignal) =>
  (await axios.get(`${getUrlServer()}/compta/rapprochement`, { headers: getHeaders(), params: { compte, debut, fin }, signal }))
    .data as EtatRapprochement;

export const importerReleve = async (compte: CompteBancaire, fichier: File) => {
  const data = new FormData();
  data.append('compte', compte);
  data.append('fichier', fichier);
  return (
    await axios.post(`${getUrlServer()}/compta/rapprochement/releve`, data, {
      headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
    })
  ).data as { ajoutees: number; doublons: number; erreurs: string[] };
};

export const ajouterLigneReleve = async (compte: CompteBancaire, ligne: { date: string; libelle: string; montant: number; reference?: string }) =>
  (await axios.post(`${getUrlServer()}/compta/rapprochement/releve`, { compte, lignes: [ligne] }, { headers: getHeaders() }))
    .data as { ajoutees: number; doublons: number };

export const rapprocherAuto = async (compte: CompteBancaire, debut: string, fin: string) =>
  (await axios.post(`${getUrlServer()}/compta/rapprochement/auto`, { compte, debut, fin }, { headers: getHeaders() }))
    .data as { rapprochees: number };

export const rapprocherLigne = async (ligneId: string, refs: string[]) =>
  axios.put(`${getUrlServer()}/compta/rapprochement/lignes/${ligneId}`, { refs }, { headers: getHeaders() });

export const supprimerLigneReleve = async (ligneId: string) =>
  axios.delete(`${getUrlServer()}/compta/rapprochement/lignes/${ligneId}`, { headers: getHeaders() });

export const chargeDepuisReleve = async (ligneId: string, categorie: string, nom?: string) =>
  axios.post(`${getUrlServer()}/compta/rapprochement/lignes/${ligneId}/charge`, { categorie, nom }, { headers: getHeaders() });

// ---------------------------------------------------------------- clôture
export const getClotures = async (): Promise<EtatClotures> =>
  (await axios.get(`${getUrlServer()}/compta/clotures`, { headers: getHeaders() })).data;

export const verrouiller = async (date: string | null): Promise<EtatClotures> =>
  (await axios.put(`${getUrlServer()}/compta/verrouillage`, { date }, { headers: getHeaders() })).data;

export const cloturerExercice = async (exercice: number): Promise<EtatClotures> =>
  (await axios.post(`${getUrlServer()}/compta/clotures`, { exercice }, { headers: getHeaders() })).data;

export const rouvrirExercice = async (exercice: number): Promise<EtatClotures> =>
  (await axios.delete(`${getUrlServer()}/compta/clotures/${exercice}`, { headers: getHeaders() })).data;
