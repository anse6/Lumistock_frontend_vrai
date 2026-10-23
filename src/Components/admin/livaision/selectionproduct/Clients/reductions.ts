// Réductions commerciales d'une vente (miroir de backend/services/reductions_service.py).
// Elles s'appliquent en cascade : rabais, puis remise, puis ristourne,
// chacune sur le montant restant après la précédente.
import { useProductStore } from "./api/useProductStore";
import { useDeliveryStore } from "../../newdelivery/deliveryStore";
import { arrondirMontant, calculerTva, useTvaMagasin } from "./tva";

export type TypeReduction = "rabais" | "remise" | "ristourne";
export type ModeReduction = "pourcentage" | "montant";

export interface Reduction {
  type: TypeReduction;
  mode: ModeReduction;
  valeur: number;
  motif?: string;
}

export interface ReductionCalculee extends Reduction {
  libelle: string;
  base: number;
  montant: number;
}

export const TYPES_REDUCTION: { type: TypeReduction; libelle: string; aide: string; exemple: string }[] = [
  {
    type: "rabais",
    libelle: "Rabais",
    aide: "Réduction exceptionnelle pour un défaut : produit abîmé, non conforme, livraison en retard…",
    exemple: "Ex. : sacs déchirés",
  },
  {
    type: "remise",
    libelle: "Remise",
    aide: "Réduction habituelle accordée au client : achat en grande quantité, client fidèle, promotion…",
    exemple: "Ex. : achat en gros",
  },
  {
    type: "ristourne",
    libelle: "Ristourne",
    aide: "Réduction calculée sur le volume d'achats du client sur une période (mois, trimestre, année).",
    exemple: "Ex. : objectif annuel atteint",
  },
];

const arrondi = (n: number) => Math.round(n * 100) / 100;

export const appliquerReductions = (reductions: Reduction[], montantBrut: number, decimales = 2) => {
  let base = Math.max(Number(montantBrut) || 0, 0);
  const detail: ReductionCalculee[] = [];
  let total = 0;
  for (const { type, libelle } of TYPES_REDUCTION) {
    const r = reductions.find((x) => x.type === type);
    const valeur = Number(r?.valeur) || 0;
    if (!r || valeur <= 0) continue;
    const brut = r.mode === "pourcentage" ? (base * Math.min(valeur, 100)) / 100 : valeur;
    const montant = arrondirMontant(Math.min(brut, base), decimales);
    detail.push({ ...r, valeur, libelle, base: arrondi(base), montant });
    total += montant;
    base -= montant;
  }
  return { detail, total: arrondi(total) };
};

// Montants de la vente en cours : brut, réductions, net HT, TVA, dette et total à payer.
export const useMontantsVente = () => {
  const totalAmount = useProductStore((s) => s.totalAmount);
  const reductions = useDeliveryStore((s) => s.reductions);
  const detteAncienne = useDeliveryStore((s) => s.dette_ancienne);
  const detteActive = useDeliveryStore((s) => s.is_dette_ancienne_active);
  const tvaDemandee = useDeliveryStore((s) => s.appliquer_tva);
  const tauxVente = useDeliveryStore((s) => s.taux_tva_vente);
  const { tva: tvaMagasin } = useTvaMagasin();

  // Montants au franc près (pas de centimes en CFA), comme le serveur.
  const decimales = tvaMagasin?.decimales ?? 0;
  const brut = Number(totalAmount) || 0;
  const { detail, total: totalReductions } = appliquerReductions(reductions, brut, decimales);
  const net = arrondirMontant(brut - totalReductions, decimales);
  const dette = detteActive ? Number(detteAncienne) || 0 : 0;
  // TVA sur le net (jamais sur la dette) ; une vente modifiée garde son taux.
  const tauxTva = tauxVente ?? tvaMagasin?.taux ?? null;
  const appliquerTva = tvaDemandee && tauxTva != null;
  const montantTva = appliquerTva ? calculerTva(net, tauxTva, decimales) : 0;
  // Un reste abandonné n'est pas retiré ici : une fois validé, il fait partie
  // des réductions (type « ristourne ») ; en attente, le client le doit encore.
  const totalAPayer = Math.max(arrondirMontant(net + montantTva + dette, decimales), 0);
  return { brut, detail, totalReductions, net, dette, totalAPayer, appliquerTva, tauxTva, montantTva, decimales };
};
