import React from "react";
import { Check } from "lucide-react";
import defaultImage from "./../../../../Modules/Delivery/images/riz.png";
import type { Conditioning } from "../index/NewDeliveryadmin";

interface Product {
  id: string;
  name: string;
  size: string;
  price: number;
  quantite_magasin: number;
  selected: boolean;
  image?: string | null;
  conditionnements?: Conditioning[];
}

interface ProductGridProps {
  products: Product[];
  selectedProducts: string[];
  toggleProductSelection: (productId: string) => void;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  itemsPerPage: number;
}

// Grille compacte de sélection des produits d'une vente (même charte que
// l'approvisionnement). Les quantités se règlent à l'étape suivante.
const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  selectedProducts,
  toggleProductSelection,
  currentPage,
  setCurrentPage,
  itemsPerPage,
}) => {
  const totalPages = Math.ceil(products.length / itemsPerPage);
  // Garde-fou : ne jamais afficher une page vide si la liste rétrécit.
  const page = Math.min(Math.max(currentPage, 1), Math.max(totalPages, 1));
  const paginated = products.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  return (
    <div className="w-full">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 items-start gap-2.5 py-3">
        {paginated.map((product) => {
          const isOutOfStock = product.quantite_magasin <= 0;
          const isSelected = selectedProducts.includes(product.id);
          return (
            <button
              type="button"
              key={product.id}
              onClick={() => !isOutOfStock && toggleProductSelection(product.id)}
              disabled={isOutOfStock}
              aria-pressed={isSelected}
              title={isOutOfStock ? "Rupture de stock" : product.name}
              className={`relative flex flex-col overflow-hidden rounded-xl bg-white text-left transition-all duration-200 min-w-0 ${
                isOutOfStock ? "cursor-not-allowed opacity-55" : "cursor-pointer hover:-translate-y-0.5 hover:shadow-md"
              } ${isSelected ? "border-2 border-purple-950 shadow-[0_2px_14px_rgba(59,7,100,0.18)]" : "border border-slate-200"}`}
            >
              <span
                className={`absolute right-1.5 top-1.5 z-10 flex h-4 w-4 items-center justify-center rounded-full shadow ${
                  isSelected ? "bg-purple-950" : "bg-slate-300"
                }`}
              >
                <Check size={10} className="text-white" />
              </span>
              <span className={`flex h-[60px] w-full items-center justify-center ${isSelected ? "bg-purple-50" : "bg-slate-50"}`}>
                <img
                  src={product.image && product.image.startsWith("http") ? product.image : defaultImage}
                  alt=""
                  onError={(e) => { (e.currentTarget as HTMLImageElement).src = defaultImage; }}
                  className="max-h-[46px] max-w-[70%] object-contain"
                />
              </span>
              <span className="flex flex-1 flex-col gap-1 p-2 min-w-0">
                <span className="line-clamp-2 min-h-[2.2em] text-[11px] font-semibold leading-tight text-slate-800">
                  {product.name}
                </span>
                <span className="flex items-center justify-between gap-1">
                  <span className="truncate text-[11px] text-slate-400">{product.size}</span>
                  <span className="shrink-0 text-[11px] font-bold text-purple-950">
                    {product.price.toLocaleString("fr-FR")} CFA
                  </span>
                </span>
                <span
                  className={`w-fit rounded-md px-1.5 py-px text-[10px] font-semibold ${
                    isOutOfStock ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-700"
                  }`}
                >
                  {isOutOfStock ? "Rupture" : `Stock : ${product.quantite_magasin}`}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-center gap-2 py-4">
          <button
            type="button"
            onClick={() => setCurrentPage(Math.max(page - 1, 1))}
            disabled={page === 1}
            className="rounded-lg bg-purple-950 px-4 py-2 text-sm font-semibold text-white transition disabled:opacity-40"
          >
            ← Précédent
          </button>
          <span className="px-3 text-sm font-medium text-slate-600">
            Page {page} / {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setCurrentPage(Math.min(page + 1, totalPages))}
            disabled={page === totalPages}
            className="rounded-lg bg-purple-950 px-4 py-2 text-sm font-semibold text-white transition disabled:opacity-40"
          >
            Suivant →
          </button>
        </div>
      )}
    </div>
  );
};

export default ProductGrid;
