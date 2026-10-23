import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Select, Tooltip } from "antd";
import { Minus, Plus, Trash2, Pencil, Package } from "lucide-react";
import defaultImage from "./riz.png";
import { useProductStore, Conditioning } from "./api/useProductStore";
import { getConditioningId } from "../../../approvisonnement/conditioning";
import { estCaissier } from "../../venteRole";

interface ProductItemProps {
  id: string;
  image: string | null;
  title: string;
  price: number;
  quantity: number;
  quantite_magasin_initiale: number;
  total: number;
  conditionnements?: Conditioning[];
  conditionconfig: {
    selectedConditioning: Conditioning;
    conditionedQuantity: number;
    quantity: number;
  }[];
}

const formatCFA = (value: number) => `${Math.round(value || 0).toLocaleString("fr-FR")} CFA`;

// Ligne d'article de la vente : prix modifiable, quantité, conditionnements.
export const ProductItem: React.FC<ProductItemProps> = ({
  id,
  image,
  title,
  price,
  quantity,
  quantite_magasin_initiale,
  total,
  conditionnements = [],
  conditionconfig,
}) => {
  const { t } = useTranslation();
  const { updateUnitQuantity, removeProduct, addConditioning, updateConditionedQuantity, removeConditioning, updatePrice } =
    useProductStore();

  const [conditioningToAdd, setConditioningToAdd] = useState<string | null>(null);
  const [conditioningQty, setConditioningQty] = useState("1");
  const [qtyInput, setQtyInput] = useState(String(quantity ?? 0));
  const [editingPrice, setEditingPrice] = useState(false);
  const [priceInput, setPriceInput] = useState(String(price || 0));

  useEffect(() => setQtyInput(String(quantity ?? 0)), [quantity]);

  const stock = Number(quantite_magasin_initiale) || 0;
  const unitsInConditionings = (conditionconfig ?? []).reduce(
    (sum, c) => sum + (Number(c.conditionedQuantity) || 0) * (c.selectedConditioning?.facteur || 1),
    0,
  );
  const totalUnits = unitsInConditionings + (quantity || 0);
  const maxUnits = Math.max(stock - unitsInConditionings, 0);
  const stockLow = stock > 0 && stock - totalUnits <= Math.max(2, stock * 0.1);

  const setUnits = (value: number) => {
    const safe = Math.max(0, Math.min(value, maxUnits));
    updateUnitQuantity(id, safe);
    setQtyInput(String(safe));
  };

  const commitPrice = () => {
    const value = parseFloat(priceInput);
    if (!isNaN(value) && value >= 0) updatePrice(id, value);
    else setPriceInput(String(price || 0));
    setEditingPrice(false);
  };

  const handleAddConditioning = () => {
    if (!conditioningToAdd) return;
    addConditioning(id, conditioningToAdd, parseInt(conditioningQty) || 1);
    setConditioningToAdd(null);
    setConditioningQty("1");
  };

  const changeConditioned = (condId: string, delta: number) => {
    const config = conditionconfig.find((c) => getConditioningId(c.selectedConditioning._id) === condId);
    if (!config) return;
    updateConditionedQuantity(id, condId, Math.max(0, config.conditionedQuantity + delta));
  };

  const imageSrc = image ? (image.startsWith("http") ? image : defaultImage) : defaultImage;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 transition-shadow hover:shadow-sm">
      <div className="flex flex-wrap items-center gap-3 sm:flex-nowrap">
        {/* Produit (toute la largeur sur mobile ; quantité et total passent dessous) */}
        <div className="flex w-full min-w-0 items-center gap-3 sm:w-auto sm:flex-1">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-purple-50">
            <img src={imageSrc} alt="" className="max-h-10 max-w-10 object-contain"
              onError={(e) => { (e.currentTarget as HTMLImageElement).src = defaultImage; }} />
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-slate-800" title={title}>
              {title || t("admin.deliveries.product.unknown")}
            </div>
            <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500">
              {estCaissier() ? (
                // Caissier : le prix du catalogue s'applique toujours.
                <span className="font-medium text-purple-950">{formatCFA(price)} / unité</span>
              ) : editingPrice ? (
                <input
                  type="number"
                  min={0}
                  value={priceInput}
                  onChange={(e) => setPriceInput(e.target.value)}
                  onBlur={commitPrice}
                  onKeyDown={(e) => e.key === "Enter" && commitPrice()}
                  autoFocus
                  className="w-24 rounded border border-purple-300 px-1.5 py-0.5 text-xs outline-none focus:ring-1 focus:ring-purple-950"
                />
              ) : (
                <Tooltip title="Modifier le prix de vente pour cette vente">
                  <button
                    type="button"
                    onClick={() => { setPriceInput(String(price || 0)); setEditingPrice(true); }}
                    className="flex items-center gap-1 font-medium text-purple-950 hover:underline"
                  >
                    {formatCFA(price)} / unité <Pencil size={11} />
                  </button>
                </Tooltip>
              )}
              <span className="text-slate-300">•</span>
              <span className={stockLow ? "font-semibold text-amber-600" : ""}>Stock : {stock}</span>
            </div>
          </div>
        </div>

        {/* Quantité et total : une ligne commune sous le produit sur mobile */}
        <div className="flex w-full items-center justify-between gap-3 sm:w-auto sm:justify-end">
        <div className="flex items-center overflow-hidden rounded-lg border border-slate-200">
          <button type="button" onClick={() => setUnits((quantity || 0) - 1)} disabled={(quantity || 0) <= 0}
            className="flex h-8 w-8 items-center justify-center bg-orange-500 text-white transition hover:bg-orange-600 disabled:opacity-40"
            aria-label="Diminuer">
            <Minus size={14} />
          </button>
          <input
            type="number"
            min={0}
            value={qtyInput}
            onChange={(e) => setQtyInput(e.target.value)}
            onBlur={() => { const v = parseInt(qtyInput); if (isNaN(v)) setQtyInput(String(quantity)); else setUnits(v); }}
            onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
            className="h-8 w-12 bg-white text-center text-sm font-semibold text-slate-800 outline-none"
            aria-label="Quantité"
          />
          <button type="button" onClick={() => setUnits((quantity || 0) + 1)} disabled={totalUnits >= stock}
            className="flex h-8 w-8 items-center justify-center bg-emerald-600 text-white transition hover:bg-emerald-700 disabled:opacity-40"
            aria-label="Augmenter">
            <Plus size={14} />
          </button>
        </div>

        {/* Total de la ligne */}
        <div className="flex items-center gap-2">
          <div className="min-w-[110px] text-right text-sm font-bold text-purple-950">{formatCFA(total)}</div>
          <Tooltip title={t("admin.deliveries.product.remove")}>
            <button type="button" onClick={() => removeProduct(id)}
              className="rounded-lg bg-red-50 p-2 text-red-600 transition hover:bg-red-600 hover:text-white" aria-label="Retirer">
              <Trash2 size={16} />
            </button>
          </Tooltip>
        </div>
        </div>
      </div>

      {/* Conditionnements */}
      {(conditionnements.length > 0 || conditionconfig.length > 0) && (
        <div className="mt-3 border-t border-dashed border-slate-200 pt-3">
          {conditionconfig.map((config) => {
            const condId = getConditioningId(config.selectedConditioning._id);
            return (
              <div key={condId} className="mb-2 flex items-center justify-between gap-2 rounded-lg bg-purple-50 px-3 py-1.5 text-xs">
                <span className="flex min-w-0 items-center gap-1.5 text-slate-700">
                  <Package size={13} className="shrink-0 text-purple-950" />
                  <span className="truncate font-semibold">{config.selectedConditioning.nom}</span>
                  <span className="text-slate-400">× {config.selectedConditioning.facteur}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <button type="button" onClick={() => changeConditioned(condId, -1)}
                    className="rounded bg-orange-500 px-1.5 text-white hover:bg-orange-600">−</button>
                  <span className="w-6 text-center font-semibold">{config.conditionedQuantity}</span>
                  <button type="button" onClick={() => changeConditioned(condId, 1)}
                    disabled={totalUnits + config.selectedConditioning.facteur > stock}
                    className="rounded bg-emerald-600 px-1.5 text-white hover:bg-emerald-700 disabled:opacity-40">+</button>
                  <button type="button" onClick={() => removeConditioning(id, condId)}
                    className="ml-1 rounded p-0.5 text-red-600 hover:bg-red-600 hover:text-white" aria-label="Retirer le conditionnement">
                    <Trash2 size={13} />
                  </button>
                </span>
              </div>
            );
          })}
          {conditionnements.length > 0 && (
            <div className="flex items-center gap-2">
              <Select
                value={conditioningToAdd}
                onChange={(val) => { setConditioningToAdd(val); setConditioningQty("1"); }}
                placeholder={t("admin.deliveries.product.addConditioning")}
                className="flex-1"
                size="small"
                options={conditionnements.map((c) => ({
                  label: `${c.nom} (× ${c.facteur}) — ${formatCFA(c.prix_conditionnement)}`,
                  value: getConditioningId(c._id),
                }))}
              />
              {conditioningToAdd && (
                <>
                  <input type="number" min={1} value={conditioningQty} onChange={(e) => setConditioningQty(e.target.value)}
                    className="h-6 w-14 rounded border border-slate-300 px-1 text-xs" />
                  <button type="button" onClick={handleAddConditioning}
                    className="flex h-6 items-center gap-1 rounded bg-purple-950 px-2 text-xs font-semibold text-white hover:bg-purple-900">
                    <Plus size={12} /> {t("admin.deliveries.product.add")}
                  </button>
                </>
              )}
            </div>
          )}
          {totalUnits > stock && (
            <p className="mt-1 text-xs text-red-500">{t("admin.deliveries.product.insufficientStock")}</p>
          )}
        </div>
      )}
    </div>
  );
};
