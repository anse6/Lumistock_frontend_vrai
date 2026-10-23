import React, { useState } from 'react';
import { Check, Trash2, Minus, Plus, Edit3, Package } from 'lucide-react';
import { Tag, Tooltip, App } from 'antd';
import defaultImage from '../../../Modules/Delivery/images/riz.png';
import { getConditioningId, type ConditioningId } from './conditioning';

const APP_COLOR = '#3b1558';
const MIN_TOTAL_MESSAGE = 'La quantité totale doit être d\'au moins 1. Retirez le produit pour l\'enlever de la sélection.';

interface Conditioning {
  _id: ConditioningId;
  nom: string;
  facteur: number;
  prix_conditionnement: number;
  prix_reference: number;
  economie: number;
}

interface Product {
  id: string;
  name: string;
  size: string;
  price: number;
  quantite_livreur: number;
  selected: boolean;
  image?: string | null;
  quantity: number;
  conditionnements: Conditioning[];
  conditionconfig: { conditioningId: string; conditionedQuantity: number }[];
}

interface ProductGridProps {
  products: Product[];
  selectedProducts: string[];
  toggleProductSelection: (productId: string) => void;
  productQuantities: Record<string, { quantity: number; conditionconfig: { conditioningId: string; conditionedQuantity: number }[] }>;
  setProductQuantities: React.Dispatch<React.SetStateAction<Record<string, { quantity: number; conditionconfig: { conditioningId: string; conditionedQuantity: number }[] }>>>;
  currentPage: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  itemsPerPage: number;
}

const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  selectedProducts,
  toggleProductSelection,
  productQuantities,
  setProductQuantities,
  currentPage,
  setCurrentPage,
  itemsPerPage,
}) => {
  const { message: msg } = App.useApp();
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [tempQuantity, setTempQuantity] = useState<string>('');
  const [selectedConditioningId, setSelectedConditioningId] = useState<Record<string, string | null>>({});
  const [tempConditionedQuantity, setTempConditionedQuantity] = useState<Record<string, string>>({});
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});

  const totalPages = Math.ceil(products.length / itemsPerPage);
  // Garde-fou : si la liste filtrée rétrécit, ne jamais afficher une page vide.
  const page = Math.min(Math.max(currentPage, 1), Math.max(totalPages, 1));
  const startIndex = (page - 1) * itemsPerPage;
  const paginatedProducts = products.slice(startIndex, startIndex + itemsPerPage);

  // Unités restantes si l'on retirait entièrement un conditionnement.
  const unitsWithoutConditioning = (productId: string, conditioningId: string) => {
    const product = products.find((p) => p.id === productId);
    const config = productQuantities[productId];
    if (!product || !config) return 0;
    const line = config.conditionconfig.find((c) => c.conditioningId === conditioningId);
    const facteur = product.conditionnements.find((c) => getConditioningId(c._id) === conditioningId)?.facteur || 1;
    return getTotalUsedUnits(productId) - (line ? line.conditionedQuantity * facteur : 0);
  };

  const getTotalUsedUnits = (productId: string) => {
    const config = productQuantities[productId] || { quantity: 0, conditionconfig: [] };
    const product = products.find((p) => p.id === productId);
    if (!product) return 0;
    return config.quantity + config.conditionconfig.reduce(
      (sum, c) => sum + c.conditionedQuantity * (product.conditionnements.find((cond) => getConditioningId(cond._id) === c.conditioningId)?.facteur || 1), 0
    );
  };

  const handleProductClick = (product: Product) => {
    if (product.quantite_livreur === 0) { msg.warning(`Stock épuisé pour "${product.name}"`); return; }
    toggleProductSelection(product.id);
    if (!selectedProducts.includes(product.id) && !productQuantities[product.id]) {
      setProductQuantities((prev) => ({ ...prev, [product.id]: { quantity: 1, conditionconfig: [] } }));
    }
  };

  const incrementQuantity = (productId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const product = products.find((p) => p.id === productId);
    if (!product) return;
    if (getTotalUsedUnits(productId) >= product.quantite_livreur) { msg.warning(`Max disponible : ${product.quantite_livreur}`); return; }
    setProductQuantities((prev) => ({ ...prev, [productId]: { ...prev[productId], quantity: (prev[productId]?.quantity || 0) + 1 } }));
  };

  const decrementQuantity = (productId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const config = productQuantities[productId] || { quantity: 0, conditionconfig: [] };
    if (config.quantity <= 0) return;
    if (getTotalUsedUnits(productId) <= 1) { msg.warning(MIN_TOTAL_MESSAGE); return; }
    setProductQuantities((prev) => ({ ...prev, [productId]: { ...prev[productId], quantity: config.quantity - 1 } }));
  };

  const startEditing = (productId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const config = productQuantities[productId] || { quantity: 0, conditionconfig: [] };
    setEditingProduct(productId);
    setTempQuantity(config.quantity.toString());
  };

  const saveQuantity = (productId: string, e?: React.MouseEvent | React.KeyboardEvent) => {
    if (e) e.stopPropagation();
    const product = products.find((p) => p.id === productId);
    if (!product) return;
    const newQty = parseInt(tempQuantity) || 0;
    const otherUnits = getTotalUsedUnits(productId) - (productQuantities[productId]?.quantity || 0);
    if (otherUnits + newQty > product.quantite_livreur) { msg.warning(`Max : ${product.quantite_livreur}`); return; }
    if (otherUnits + newQty < 1) { msg.warning(MIN_TOTAL_MESSAGE); return; }
    setProductQuantities((prev) => ({ ...prev, [productId]: { ...prev[productId], quantity: newQty } }));
    setEditingProduct(null);
    setTempQuantity('');
  };

  const cancelEditing = (e?: React.MouseEvent | React.KeyboardEvent) => {
    if (e) e.stopPropagation();
    setEditingProduct(null);
    setTempQuantity('');
  };

  const addConditioning = (productId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const product = products.find((p) => p.id === productId);
    if (!product || !selectedConditioningId[productId]) return;
    const cond = product.conditionnements.find((c) => getConditioningId(c._id) === selectedConditioningId[productId]);
    if (!cond) return;
    const qty = parseInt(tempConditionedQuantity[productId] || '1') || 1;
    if (getTotalUsedUnits(productId) + qty * cond.facteur > product.quantite_livreur) { msg.warning(`Max : ${product.quantite_livreur}`); return; }
    setProductQuantities((prev) => ({ ...prev, [productId]: { ...prev[productId], conditionconfig: [...(prev[productId]?.conditionconfig || []), { conditioningId: selectedConditioningId[productId]!, conditionedQuantity: qty }] } }));
    setSelectedConditioningId((prev) => ({ ...prev, [productId]: null }));
    setTempConditionedQuantity((prev) => ({ ...prev, [productId]: '1' }));
  };

  const removeConditioning = (productId: string, conditioningId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (unitsWithoutConditioning(productId, conditioningId) < 1) { msg.warning(MIN_TOTAL_MESSAGE); return; }
    setProductQuantities((prev) => ({ ...prev, [productId]: { ...prev[productId], conditionconfig: prev[productId].conditionconfig.filter((c) => c.conditioningId !== conditioningId) } }));
  };

  const incrementConditioned = (productId: string, condId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const product = products.find((p) => p.id === productId);
    if (!product) return;
    const config = productQuantities[productId] || { quantity: 0, conditionconfig: [] };
    const cond = product.conditionnements.find((c) => getConditioningId(c._id) === condId);
    if (!cond) return;
    if (getTotalUsedUnits(productId) + cond.facteur > product.quantite_livreur) { msg.warning(`Max atteint`); return; }
    setProductQuantities((prev) => ({ ...prev, [productId]: { ...prev[productId], conditionconfig: config.conditionconfig.map((c) => c.conditioningId === condId ? { ...c, conditionedQuantity: c.conditionedQuantity + 1 } : c) } }));
  };

  const decrementConditioned = (productId: string, condId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const product = products.find((p) => p.id === productId);
    const facteur = product?.conditionnements.find((c) => getConditioningId(c._id) === condId)?.facteur || 1;
    if (getTotalUsedUnits(productId) - facteur < 1) { msg.warning(MIN_TOTAL_MESSAGE); return; }
    const config = productQuantities[productId] || { quantity: 0, conditionconfig: [] };
    setProductQuantities((prev) => ({ ...prev, [productId]: { ...prev[productId], conditionconfig: config.conditionconfig.map((c) => c.conditioningId === condId ? { ...c, conditionedQuantity: c.conditionedQuantity - 1 } : c).filter((c) => c.conditionedQuantity > 0) } }));
  };

  const removeProduct = (productId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedProducts.includes(productId)) toggleProductSelection(productId);
    setProductQuantities((prev) => { const u = { ...prev }; delete u[productId]; return u; });
    if (editingProduct === productId) { setEditingProduct(null); setTempQuantity(''); }
  };

  return (
    <div className="w-full">
      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 items-start gap-2.5 px-4 sm:px-6 py-3">
        {paginatedProducts.map((product) => {
          const isSelected = selectedProducts.includes(product.id);
          const config = productQuantities[product.id] || { quantity: 0, conditionconfig: [] };
          const isEditing = editingProduct === product.id;
          const totalUsedUnits = getTotalUsedUnits(product.id);
          const isOutOfStock = product.quantite_livreur === 0;
          const imgSrc = imgErrors[product.id] || !product.image ? defaultImage : product.image;

          return (
            <div
              key={product.id}
              onClick={() => !isEditing && !isOutOfStock && handleProductClick(product)}
              className={`relative flex flex-col rounded-xl overflow-hidden transition-all duration-200 min-w-0 ${isOutOfStock ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
              style={{
                border: isSelected ? `2px solid ${APP_COLOR}` : '1px solid #e5e7eb',
                boxShadow: isSelected ? `0 2px 16px ${APP_COLOR}22` : '0 1px 4px rgba(0,0,0,0.06)',
              }}
            >
              {/* Check badge */}
              <div className="absolute top-1.5 right-1.5 z-10">
                <div className="w-4 h-4 rounded-full flex items-center justify-center shadow"
                  style={{ backgroundColor: isSelected ? APP_COLOR : isOutOfStock ? '#9ca3af' : '#d1d5db' }}>
                  <Check size={10} className="text-white" />
                </div>
              </div>

              {/* Image */}
              <div className="w-full flex items-center justify-center"
                style={{ height: 60, background: isSelected ? `${APP_COLOR}10` : '#f8f5ff' }}>
                <img
                  src={imgSrc}
                  alt={product.name}
                  onError={() => setImgErrors((prev) => ({ ...prev, [product.id]: true }))}
                  style={{ maxHeight: 46, maxWidth: '70%', objectFit: 'contain' }}
                />
              </div>

              {/* Info */}
              <div className="flex flex-col flex-1 p-2 bg-white min-w-0">
                <div className="flex items-start justify-between gap-1 mb-1 min-w-0">
                  <span title={product.name} className="font-semibold text-[11px] text-gray-800 leading-tight line-clamp-2 min-h-[2.2em] flex-1 min-w-0">{product.name}</span>
                  {isOutOfStock
                    ? <Tag color="error" className="text-xs shrink-0 !px-1 !py-0">0</Tag>
                    : <Tag color="success" className="text-xs shrink-0 !px-1 !py-0">{product.quantite_livreur}</Tag>
                  }
                </div>

                <div className="flex items-center justify-between min-w-0">
                  <span className="text-[11px] text-gray-400 truncate">{product.size}</span>
                  <span className="font-bold text-[11px] shrink-0 ml-1" style={{ color: APP_COLOR }}>
                    {product.price.toLocaleString()} CFA
                  </span>
                </div>

                {/* Controls when selected */}
                {isSelected && !isOutOfStock && (
                  <div className="flex flex-col gap-1.5 border-t pt-2 mt-2 min-w-0" style={{ borderColor: `${APP_COLOR}20` }}>

                    {/* Qty */}
                    <div>
                      <label className="text-xs font-semibold block mb-1" style={{ color: APP_COLOR }}>Qté unitaire</label>
                      <div className="flex items-center rounded-lg overflow-hidden border" style={{ borderColor: `${APP_COLOR}30` }}>
                        <button onClick={(e) => decrementQuantity(product.id, e)} disabled={config.quantity <= 0 || totalUsedUnits <= 1 || isEditing}
                          className="px-2 py-1 text-white text-xs disabled:opacity-40" style={{ backgroundColor: APP_COLOR }}>
                          <Minus size={12} />
                        </button>
                        <div className="flex-1 min-w-0">
                          {isEditing ? (
                            <input type="text" value={tempQuantity}
                              onChange={(e) => { if (e.target.value === '' || /^\d+$/.test(e.target.value)) setTempQuantity(e.target.value); }}
                              onKeyDown={(e) => { if (e.key === 'Enter') saveQuantity(product.id, e); else if (e.key === 'Escape') cancelEditing(e); }}
                              onBlur={() => saveQuantity(product.id)}
                              onClick={(e) => e.stopPropagation()}
                              autoFocus
                              className="w-full text-center text-xs font-semibold py-1 outline-none bg-purple-50"
                            />
                          ) : (
                            <Tooltip title="Cliquer pour modifier">
                              <div className="text-center text-xs font-semibold py-1 cursor-pointer hover:bg-purple-50 relative group"
                                onClick={(e) => startEditing(product.id, e)}>
                                {config.quantity}
                                <Edit3 size={9} className="absolute top-0.5 right-0.5 text-gray-400 opacity-0 group-hover:opacity-100" />
                              </div>
                            </Tooltip>
                          )}
                        </div>
                        <button onClick={(e) => incrementQuantity(product.id, e)} disabled={totalUsedUnits >= product.quantite_livreur || isEditing}
                          className="px-2 py-1 text-white text-xs disabled:opacity-40" style={{ backgroundColor: APP_COLOR }}>
                          <Plus size={12} />
                        </button>
                      </div>
                    </div>

                    {/* Conditionnements */}
                    {product.conditionnements.length > 0 && (
                      <div className="min-w-0">
                        <label className="text-xs font-semibold block mb-1" style={{ color: APP_COLOR }}>Conditionnement</label>
                        <div className="flex gap-1 min-w-0">
                          <select
                            value={selectedConditioningId[product.id] || ''}
                            onChange={(e) => { setSelectedConditioningId((prev) => ({ ...prev, [product.id]: e.target.value })); setTempConditionedQuantity((prev) => ({ ...prev, [product.id]: '1' })); }}
                            onClick={(e) => e.stopPropagation()}
                            className="flex-1 text-xs border rounded py-1 px-1 outline-none min-w-0"
                            style={{ borderColor: `${APP_COLOR}40`, maxWidth: '100%' }}
                          >
                            <option value="">Choisir…</option>
                            {product.conditionnements.map((cond) => (
                              <option key={getConditioningId(cond._id)} value={getConditioningId(cond._id)}>{cond.nom} ×{cond.facteur}</option>
                            ))}
                          </select>
                          <input type="text" value={tempConditionedQuantity[product.id] || '1'}
                            onChange={(e) => { if (/^\d*$/.test(e.target.value)) setTempConditionedQuantity((prev) => ({ ...prev, [product.id]: e.target.value })); }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-8 text-center text-xs border rounded py-1 outline-none shrink-0"
                            style={{ borderColor: `${APP_COLOR}40` }}
                          />
                          <button onClick={(e) => addConditioning(product.id, e)} disabled={!selectedConditioningId[product.id]}
                            className="px-1.5 text-white text-xs rounded disabled:opacity-40 shrink-0" style={{ backgroundColor: APP_COLOR }}>
                            +
                          </button>
                        </div>

                        {config.conditionconfig.map((cond) => {
                          const condD = product.conditionnements.find((c) => getConditioningId(c._id) === cond.conditioningId);
                          return (
                            <div key={cond.conditioningId} className="flex items-center justify-between mt-1 rounded px-1.5 py-1 text-xs min-w-0"
                              style={{ backgroundColor: `${APP_COLOR}0d` }}>
                              <span className="text-gray-600 truncate flex-1 min-w-0">{condD?.nom}: {cond.conditionedQuantity}×{condD?.facteur}</span>
                              <div className="flex items-center gap-0.5 shrink-0 ml-1">
                                <button onClick={(e) => decrementConditioned(product.id, cond.conditioningId, e)} className="p-0.5 text-white rounded" style={{ backgroundColor: APP_COLOR }}><Minus size={9} /></button>
                                <span className="w-4 text-center font-semibold">{cond.conditionedQuantity}</span>
                                <button onClick={(e) => incrementConditioned(product.id, cond.conditioningId, e)} disabled={totalUsedUnits >= product.quantite_livreur} className="p-0.5 text-white rounded disabled:opacity-40" style={{ backgroundColor: APP_COLOR }}><Plus size={9} /></button>
                                <button onClick={(e) => removeConditioning(product.id, cond.conditioningId, e)} className="p-0.5 text-red-400 hover:text-red-600"><Trash2 size={9} /></button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Total */}
                    <div className="flex items-center justify-between text-xs font-semibold rounded px-2 py-1"
                      style={{ backgroundColor: `${APP_COLOR}0d`, color: APP_COLOR }}>
                      <span className="flex items-center gap-1"><Package size={10} />Total</span>
                      <span>{totalUsedUnits} {product.size}</span>
                    </div>

                    {totalUsedUnits > product.quantite_livreur && (
                      <div className="text-xs text-red-500">⚠ Dépasse le stock !</div>
                    )}
                  </div>
                )}

                {/* Retirer de la sélection (seulement pour un produit sélectionné) */}
                {isSelected && (
                  <button onClick={(e) => removeProduct(product.id, e)}
                    className="mt-1.5 self-end flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-medium text-red-500 hover:bg-red-50 transition-colors">
                    <Trash2 size={11} /> Retirer
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination simple */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 py-4 flex-wrap px-4">
          <button
            onClick={() => setCurrentPage(Math.max(page - 1, 1))}
            disabled={page === 1}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-40 transition"
            style={{ backgroundColor: APP_COLOR }}
          >
            ← Précédent
          </button>

          <span className="text-sm font-medium text-gray-600 px-3">
            Page {page} / {totalPages}
          </span>

          <button
            onClick={() => setCurrentPage(Math.min(page + 1, totalPages))}
            disabled={page === totalPages}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-40 transition"
            style={{ backgroundColor: APP_COLOR }}
          >
            Suivant →
          </button>
        </div>
      )}
    </div>
  );
};

export default ProductGrid;
