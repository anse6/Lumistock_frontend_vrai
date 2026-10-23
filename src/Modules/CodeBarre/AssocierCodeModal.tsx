// Fenêtre « Code inconnu » : associer le code scanné à un article (ou à l'un de ses cartons).
import React, { useEffect, useMemo, useState } from "react";
import { Alert, App, Modal, Radio, Select, Space, Typography } from "antd";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { getUrlServer } from "../../configServer";
import { associerCode, chercherParCode, messageErreur, type ConditionnementScanne, type ProduitScanne } from "./api";
import { getConditioningId } from "../../Components/admin/approvisonnement/conditioning";

export interface ProduitCatalogue {
  _id: string;
  nom: string;
  prix: number;
  quantite: number;
  unite: string;
  image?: string | null;
  code_barre?: string | null;
  categorie_nom?: string;
  conditionnements?: ConditionnementScanne[];
}

export const CLE_CATALOGUE = ["codes-barres", "catalogue"];

/** Tous les articles du magasin (y compris ceux sans catégorie), pour les écrans de codes-barres. */
export const useCatalogue = (actif = true) =>
  useQuery<ProduitCatalogue[]>({
    queryKey: CLE_CATALOGUE,
    enabled: actif,
    queryFn: async () => {
      const { data } = await axios.get(`${getUrlServer()}/produits`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` },
      });
      return (data as ProduitCatalogue[])
        .map((p) => ({ ...p, categorie_nom: p.categorie_nom === "Inconnu" ? "Sans catégorie" : p.categorie_nom }))
        .sort((a, b) => a.nom.localeCompare(b.nom, "fr"));
    },
  });

interface Props {
  code: string | null;
  onFermer: () => void;
  /** Code associé : le produit tel que le scan le renvoie maintenant. */
  onAssocie: (produit: ProduitScanne) => void;
}

const AssocierCodeModal: React.FC<Props> = ({ code, onFermer, onAssocie }) => {
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const { data: produits = [], isLoading } = useCatalogue(!!code);
  const [produitId, setProduitId] = useState<string | null>(null);
  const [cible, setCible] = useState<string>("unite");
  const [enCours, setEnCours] = useState(false);

  useEffect(() => {
    if (code) {
      setProduitId(null);
      setCible("unite");
    }
  }, [code]);

  const produit = useMemo(() => produits.find((p) => p._id === produitId) || null, [produits, produitId]);
  const carton = produit?.conditionnements?.find((c) => getConditioningId(c._id) === cible) || null;
  const codeActuel = cible === "unite" ? produit?.code_barre : carton?.code_barre;

  const valider = async () => {
    if (!code || !produit) return;
    setEnCours(true);
    try {
      await associerCode(produit._id, code, cible === "unite" ? null : cible);
      queryClient.invalidateQueries({ queryKey: CLE_CATALOGUE });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      message.success(`Code ${code} associé à ${produit.nom}${carton ? ` (${carton.nom})` : ""}.`);
      const trouve = await chercherParCode([code]);
      onFermer();
      if (trouve) onAssocie(trouve.produit);
    } catch (err) {
      message.error(messageErreur(err, "Le code n'a pas pu être associé."));
    } finally {
      setEnCours(false);
    }
  };

  return (
    <Modal
      open={!!code}
      title="Code-barre inconnu"
      okText="Associer et ajouter à la vente"
      cancelText="Annuler"
      onOk={valider}
      onCancel={onFermer}
      okButtonProps={{ disabled: !produit, loading: enCours }}
      destroyOnClose
    >
      <Space direction="vertical" size="middle" className="w-full">
        <Typography.Paragraph className="!mb-0">
          Aucun article ne porte le code <Typography.Text code>{code}</Typography.Text>. Choisissez l'article
          correspondant : le code lui sera associé et les prochains scans l'ajouteront directement.
        </Typography.Paragraph>
        <Select
          showSearch
          autoFocus
          className="w-full"
          size="large"
          placeholder="Rechercher l'article…"
          loading={isLoading}
          value={produitId ?? undefined}
          onChange={(v) => {
            setProduitId(v);
            setCible("unite");
          }}
          optionFilterProp="label"
          options={produits.map((p) => ({
            value: p._id,
            label: `${p.nom}${p.code_barre ? ` — code actuel ${p.code_barre}` : ""}`,
          }))}
        />
        {produit && (produit.conditionnements?.length ?? 0) > 0 && (
          <div>
            <div className="mb-1 text-xs font-semibold text-slate-600">Ce code est imprimé sur :</div>
            <Radio.Group value={cible} onChange={(e) => setCible(e.target.value)}>
              <Space direction="vertical">
                <Radio value="unite">L'article à l'unité ({produit.unite})</Radio>
                {produit.conditionnements!.map((c) => (
                  <Radio key={getConditioningId(c._id)} value={getConditioningId(c._id)}>
                    Le {c.nom} ({c.facteur} unités) — un scan ajoutera un {c.nom}
                  </Radio>
                ))}
              </Space>
            </Radio.Group>
          </div>
        )}
        {produit && codeActuel && (
          <Alert type="warning" showIcon message={`Le code actuel ${codeActuel} sera remplacé.`} />
        )}
      </Space>
    </Modal>
  );
};

export default AssocierCodeModal;
