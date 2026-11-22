// Image d'un article. Sans image, ou si elle ne se charge pas, une icône de
// carton discrète la remplace (plus de photo « par défaut » trompeuse, comme
// l'ancien sac de riz affiché pour tous les articles sans image).
import React, { useEffect, useState } from "react";
import { Package } from "lucide-react";

interface Props {
  src?: string | null;
  alt?: string;
  /** Classes de l'image (taille, arrondi, ajustement). */
  className?: string;
  /** Taille de l'icône de remplacement, en pixels. */
  tailleIcone?: number;
  /** Classes du bloc de remplacement (par défaut : celles de l'image). */
  classeVide?: string;
}

const ImageArticle: React.FC<Props> = ({ src, alt = "", className = "", tailleIcone = 22, classeVide }) => {
  const [echec, setEchec] = useState(false);
  useEffect(() => setEchec(false), [src]);

  if (!src || echec) {
    return (
      <span
        role="img"
        aria-label={alt ? `${alt} (sans image)` : "Article sans image"}
        className={`flex items-center justify-center text-purple-300 ${classeVide ?? className}`}
      >
        <Package size={tailleIcone} strokeWidth={1.6} aria-hidden="true" />
      </span>
    );
  }
  return <img src={src} alt={alt} className={className} onError={() => setEchec(true)} />;
};

export default ImageArticle;

/** Même icône de carton, en image (pour l'option `fallback` de l'Image d'antd). */
export const IMAGE_ARTICLE_VIDE =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="-12 -12 48 48" fill="none" stroke="#d8b4fe" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z"/>' +
      '<path d="M12 22V12"/><path d="m3.3 7 7.703 4.734a2 2 0 0 0 1.994 0L20.7 7"/><path d="m7.5 4.27 9 5.15"/></svg>',
  );
