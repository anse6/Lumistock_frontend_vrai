// Vente au scan : chaque scan ajoute l'article au panier de la vente (étape 2),
// un nouveau scan du même article augmente sa quantité de 1. Le code d'un carton
// (conditionnement) ajoute un carton.
import { useCallback, useState } from "react";
import { App } from "antd";
import axios from "axios";
import { create } from "zustand";
import { useProductStore } from "./selectionproduct/Clients/api/useProductStore";
import { getConditioningId } from "../approvisonnement/conditioning";
import { chercherParCode, type ProduitScanne } from "../../../Modules/CodeBarre/api";
import { bipErreur, bipOk } from "../../../Modules/CodeBarre/sons";
import { useScanCodeBarre } from "../../../Modules/CodeBarre/LecteurCodeBarre";
import type { ScanDetecte } from "../../../Modules/CodeBarre/detecteur";
import useCompteConnecte from "../../../hooks/useCompteConnecte";

/** Dernière ligne ajoutée par scan : la ligne clignote et vient à l'écran. */
export const useDernierScan = create<{ id: string | null; tic: number; marquer: (id: string) => void }>((set) => ({
  id: null,
  tic: 0,
  marquer: (id) => set((s) => ({ id, tic: s.tic + 1 })),
}));

type Resultat = { ok: true; texte: string } | { ok: false; texte: string };

const formatQte = (n: number) => n.toLocaleString("fr-FR");

/** Ajoute l'article scanné au panier (ou augmente sa quantité). */
export const ajouterAuPanier = (produit: ProduitScanne): Resultat => {
  const store = useProductStore.getState();
  const stock = Number(produit.quantite) || 0;
  let ligne = store.selectedProducts.find((p) => p.id === produit._id);

  if (!ligne) {
    if (stock <= 0) return { ok: false, texte: `${produit.nom} : plus de stock.` };
    store.addProduct({
      id: produit._id,
      name: produit.nom,
      price: Number(produit.prix) || 0,
      image: produit.image_url || null,
      size: produit.unite,
      quantite_magasin_initiale: stock,
      conditionnements: produit.conditionnements || [],
    });
    ligne = useProductStore.getState().selectedProducts.find((p) => p.id === produit._id);
    if (!ligne) return { ok: false, texte: "Impossible d'ajouter l'article." };
  }

  const stockLigne = Number(ligne.quantite_magasin_initiale) || stock;
  const unitesCartons = ligne.conditionconfig.reduce(
    (s, c) => s + (Number(c.conditionedQuantity) || 0) * (Number(c.selectedConditioning?.facteur) || 1),
    0,
  );
  const unitesUtilisees = unitesCartons + (Number(ligne.quantity) || 0);
  const carton = produit.conditionnement_scanne;

  if (carton) {
    const condId = getConditioningId(carton._id);
    const facteur = Number(carton.facteur) || 1;
    if (unitesUtilisees + facteur > stockLigne) {
      return { ok: false, texte: `${produit.nom} : stock insuffisant pour un ${carton.nom} de plus (${formatQte(stockLigne - unitesUtilisees)} unité(s) restante(s)).` };
    }
    const existante = ligne.conditionconfig.find((c) => getConditioningId(c.selectedConditioning._id) === condId);
    if (existante) store.updateConditionedQuantity(produit._id, condId, existante.conditionedQuantity + 1);
    else store.addConditioning(produit._id, condId, 1);
    const n = existante ? existante.conditionedQuantity + 1 : 1;
    return { ok: true, texte: `${produit.nom} — ${carton.nom} × ${formatQte(n)}` };
  }

  if (unitesUtilisees + 1 > stockLigne) {
    return { ok: false, texte: `${produit.nom} : stock épuisé (${formatQte(stockLigne)} en stock, tout est déjà dans la vente).` };
  }
  const quantite = (Number(ligne.quantity) || 0) + 1;
  store.updateUnitQuantity(produit._id, quantite);
  return { ok: true, texte: `${produit.nom} × ${formatQte(quantite)}` };
};

interface Options {
  /** Appelé avant l'ajout (étape 1 : enregistrer les produits cochés à la main). */
  avantAjout?: () => void;
  /** Appelé après un ajout réussi (étape 1 : passer à l'étape 2). */
  apresAjout?: (produitId: string) => void;
  /** false : les scans sont ignorés (caisse pas encore ouverte). */
  actif?: boolean;
}

/** Branche le lecteur sur la vente. Renvoie de quoi gérer un code inconnu. */
export const useScanVente = ({ avantAjout, apresAjout, actif = true }: Options = {}) => {
  const { message } = App.useApp();
  const { role, peut } = useCompteConnecte();
  const peutAssocier = (role === "admin" || role === "manager") && peut("produits.modifier");
  const [codeInconnu, setCodeInconnu] = useState<string | null>(null);
  const marquer = useDernierScan((s) => s.marquer);

  const ajouterProduit = useCallback(
    (produit: ProduitScanne) => {
      avantAjout?.();
      const r = ajouterAuPanier(produit);
      if (r.ok) {
        bipOk();
        marquer(produit._id);
        message.success({ content: r.texte, key: "scan-vente", duration: 1.5 });
        apresAjout?.(produit._id);
      } else {
        bipErreur();
        message.warning({ content: r.texte, key: "scan-vente", duration: 3 });
      }
    },
    [avantAjout, apresAjout, marquer, message],
  );

  const traiterScan = useCallback(
    async (scan: ScanDetecte) => {
      if (codeInconnu) return; // fenêtre « code inconnu » ouverte : on attend la réponse
      try {
        const trouve = await chercherParCode(scan.variantes);
        if (trouve) {
          ajouterProduit(trouve.produit);
          return;
        }
        bipErreur();
        if (peutAssocier) setCodeInconnu(scan.code);
        else
          message.error({
            content: `Code ${scan.code} inconnu. Demandez à un responsable de l'associer à un article.`,
            key: "scan-vente",
            duration: 4,
          });
      } catch (err) {
        bipErreur();
        const status = axios.isAxiosError(err) ? err.response?.status : undefined;
        message.error({
          content: status ? "Erreur du serveur pendant la recherche de l'article." : "Pas de connexion au serveur : article non ajouté.",
          key: "scan-vente",
        });
      }
    },
    [ajouterProduit, codeInconnu, message, peutAssocier],
  );

  useScanCodeBarre(traiterScan, actif);

  return {
    traiterScan,
    codeInconnu,
    fermerCodeInconnu: () => setCodeInconnu(null),
    /** Après association du code : l'article est ajouté directement. */
    ajouterProduit,
  };
};
