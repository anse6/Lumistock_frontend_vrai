// Impression d'étiquettes code-barres : planches A4 autocollantes ou rouleau
// d'imprimante d'étiquettes. Les étiquettes à imprimer sont rendues dans un bloc
// placé directement dans <body> ; à l'impression, seul ce bloc est affiché.
import React, { useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import JsBarcode from "jsbarcode";

export interface FormatEtiquette {
  id: string;
  libelle: string;
  /** Page imprimée (mm). */
  page: { largeur: number; hauteur: number };
  colonnes: number;
  lignes: number;
  /** Taille d'une étiquette (mm). */
  largeur: number;
  hauteur: number;
}

export const FORMATS: FormatEtiquette[] = [
  { id: "a4-24", libelle: "Planche A4 — 24 étiquettes (3 × 8, 70 × 37 mm)", page: { largeur: 210, hauteur: 297 }, colonnes: 3, lignes: 8, largeur: 70, hauteur: 37.1 },
  { id: "a4-40", libelle: "Planche A4 — 40 étiquettes (4 × 10, 52 × 29 mm)", page: { largeur: 210, hauteur: 297 }, colonnes: 4, lignes: 10, largeur: 52.5, hauteur: 29.7 },
  { id: "rouleau-50x30", libelle: "Rouleau 50 × 30 mm (imprimante d'étiquettes)", page: { largeur: 50, hauteur: 30 }, colonnes: 1, lignes: 1, largeur: 50, hauteur: 30 },
];

export interface Etiquette {
  cle: string;
  nom: string;
  prix?: number | null;
  code: string;
}

const cleEan = (douze: string) =>
  String((10 - ([...douze].reduce((s, c, i) => s + Number(c) * (i % 2 ? 3 : 1), 0) % 10)) % 10);

/** Symbologie adaptée au code : EAN-13 / EAN-8 / UPC si le code est valide, sinon Code 128. */
export const symbologie = (code: string) => {
  if (/^\d{13}$/.test(code) && cleEan(code.slice(0, 12)) === code[12]) return "EAN13";
  if (/^\d{8}$/.test(code) && cleEan(`00000${code.slice(0, 7)}`) === code[7]) return "EAN8";
  if (/^\d{12}$/.test(code) && cleEan(`0${code.slice(0, 11)}`) === code[11]) return "UPC";
  return "CODE128";
};

export const CodeBarreSvg: React.FC<{ code: string; hauteur?: number; className?: string; style?: React.CSSProperties }> = ({
  code,
  hauteur = 40,
  className,
  style,
}) => {
  const ref = useRef<SVGSVGElement>(null);
  useEffect(() => {
    const svg = ref.current;
    if (!svg) return;
    try {
      JsBarcode(svg, code, {
        format: symbologie(code),
        height: hauteur,
        width: 2,
        fontSize: 16,
        // Marge blanche de 12 modules de chaque côté (norme EAN : 11 à gauche, 7 à droite) :
        // indispensable pour que le lecteur trouve le début du code ; le 1er chiffre d'un EAN-13 s'y écrit.
        margin: 0,
        marginLeft: 24,
        marginRight: 24,
        textMargin: 1,
        displayValue: true,
        background: "#ffffff",
      });
      // JsBarcode fixe une taille en pixels : le dessin s'adapte plutôt à son cadre, sans être coupé.
      svg.setAttribute("width", "100%");
      svg.setAttribute("height", "100%");
      svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
      svg.removeAttribute("style");
    } catch {
      svg.innerHTML = "";
    }
  }, [code, hauteur]);
  return (
    <div className={className} style={{ display: "flex", ...style }}>
      <svg ref={ref} style={{ display: "block" }} />
    </div>
  );
};

const prixTexte = (prix?: number | null) =>
  prix === null || prix === undefined ? "" : `${Math.round(prix).toLocaleString("fr-FR")} FCFA`;

const UneEtiquette: React.FC<{ e: Etiquette; format: FormatEtiquette; magasin?: string; avecPrix: boolean }> = ({
  e,
  format,
  magasin,
  avecPrix,
}) => {
  const petite = format.hauteur < 32;
  return (
    <div
      style={{
        width: `${format.largeur}mm`,
        height: `${format.hauteur}mm`,
        padding: petite ? "1.5mm 2mm" : "2.5mm 3mm",
        boxSizing: "border-box",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        alignItems: "center",
        color: "#000",
        background: "#fff",
        fontFamily: "Arial, Helvetica, sans-serif",
      }}
    >
      {magasin && !petite && (
        <div style={{ fontSize: "6.5pt", lineHeight: 1.1, width: "100%", textAlign: "center", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {magasin}
        </div>
      )}
      <div
        style={{
          fontSize: petite ? "7pt" : "8.5pt",
          fontWeight: 700,
          lineHeight: 1.15,
          width: "100%",
          textAlign: "center",
          display: "-webkit-box",
          WebkitLineClamp: petite ? 1 : 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {e.nom}
      </div>
      {avecPrix && e.prix !== null && e.prix !== undefined && (
        <div style={{ fontSize: petite ? "8pt" : "10pt", fontWeight: 700, lineHeight: 1.1 }}>{prixTexte(e.prix)}</div>
      )}
      <CodeBarreSvg
        code={e.code}
        hauteur={petite ? 28 : 40}
        style={{ width: "100%", flex: "1 1 0", minHeight: 0, marginTop: "1mm" }}
      />
    </div>
  );
};

/** Découpe les étiquettes en pages. */
const enPages = (etiquettes: Etiquette[], format: FormatEtiquette) => {
  const parPage = format.colonnes * format.lignes;
  const pages: Etiquette[][] = [];
  for (let i = 0; i < etiquettes.length; i += parPage) pages.push(etiquettes.slice(i, i + parPage));
  return pages;
};

const Page: React.FC<{ etiquettes: Etiquette[]; format: FormatEtiquette; magasin?: string; avecPrix: boolean; apercu?: boolean }> = ({
  etiquettes,
  format,
  magasin,
  avecPrix,
  apercu,
}) => {
  const margeX = (format.page.largeur - format.colonnes * format.largeur) / 2;
  const margeY = (format.page.hauteur - format.lignes * format.hauteur) / 2;
  return (
    <div
      className="page-etiquettes"
      style={{
        width: `${format.page.largeur}mm`,
        height: `${format.page.hauteur}mm`,
        padding: `${Math.max(margeY, 0)}mm ${Math.max(margeX, 0)}mm`,
        boxSizing: "border-box",
        display: "grid",
        gridTemplateColumns: `repeat(${format.colonnes}, ${format.largeur}mm)`,
        gridAutoRows: `${format.hauteur}mm`,
        background: "#fff",
        breakAfter: "page",
        pageBreakAfter: "always",
        overflow: "hidden",
        ...(apercu ? { boxShadow: "0 1px 4px rgba(15,23,42,.18)", outline: "1px solid #e2e8f0" } : {}),
      }}
    >
      {etiquettes.map((e) => (
        <div key={e.cle} style={apercu ? { outline: "1px dashed #cbd5e1", outlineOffset: "-1px" } : undefined}>
          <UneEtiquette e={e} format={format} magasin={magasin} avecPrix={avecPrix} />
        </div>
      ))}
    </div>
  );
};

interface Props {
  etiquettes: Etiquette[];
  format: FormatEtiquette;
  magasin?: string;
  avecPrix: boolean;
}

/** Aperçu à l'écran (réduit) des pages qui seront imprimées. */
export const ApercuEtiquettes: React.FC<Props> = ({ etiquettes, format, magasin, avecPrix }) => {
  const pages = useMemo(() => enPages(etiquettes, format), [etiquettes, format]);
  const echelle = format.page.largeur > 100 ? 0.62 : 1.6;
  return (
    <div className="flex flex-col items-center gap-6 overflow-x-auto rounded-xl bg-slate-100 p-4">
      {pages.slice(0, 3).map((page, i) => (
        <div
          key={i}
          style={{ zoom: echelle } as React.CSSProperties}
        >
          <Page etiquettes={page} format={format} magasin={magasin} avecPrix={avecPrix} apercu />
        </div>
      ))}
      {pages.length > 3 && <div className="text-xs text-slate-500">… et {pages.length - 3} autre(s) page(s)</div>}
    </div>
  );
};

/** Bloc réellement imprimé (invisible à l'écran). */
export const ZoneImpressionEtiquettes: React.FC<Props> = ({ etiquettes, format, magasin, avecPrix }) => {
  const pages = useMemo(() => enPages(etiquettes, format), [etiquettes, format]);
  const css = `
    .zone-impression-etiquettes { display: none; }
    @media print {
      body > *:not(.zone-impression-etiquettes) { display: none !important; }
      html, body { background: #fff !important; height: auto !important; overflow: visible !important; }
      .zone-impression-etiquettes { display: block !important; }
      .zone-impression-etiquettes .page-etiquettes:last-child { break-after: auto; page-break-after: auto; }
      @page { size: ${format.page.largeur}mm ${format.page.hauteur}mm; margin: 0; }
    }`;
  return createPortal(
    <div className="zone-impression-etiquettes">
      <style>{css}</style>
      {pages.map((page, i) => (
        <Page key={i} etiquettes={page} format={format} magasin={magasin} avecPrix={avecPrix} />
      ))}
    </div>,
    document.body,
  );
};
