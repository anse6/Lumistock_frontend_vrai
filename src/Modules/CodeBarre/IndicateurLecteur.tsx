// Pastille d'état du lecteur, affichée sur les écrans de vente et de codes-barres.
import React from "react";
import { Tooltip } from "antd";
import { ScanBarcode } from "lucide-react";
import { useLecteurCodeBarre } from "./LecteurCodeBarre";

const IndicateurLecteur: React.FC<{ className?: string }> = ({ className = "" }) => {
  const { etat, nom, dernierCode } = useLecteurCodeBarre();
  const connecte = etat === "connecte";
  const libelle = connecte ? "Lecteur connecté" : etat === "deconnecte" ? "Lecteur débranché" : "Lecteur en attente";
  const aide = connecte
    ? `${nom ? `${nom} — ` : ""}Scannez un article : il est ajouté à la vente. Scannez-le encore pour augmenter la quantité.${
        dernierCode ? ` Dernier code lu : ${dernierCode}.` : ""
      }`
    : "Branchez le lecteur USB puis scannez un article : la connexion sera confirmée au premier scan.";
  const couleur = connecte
    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
    : etat === "deconnecte"
      ? "border-amber-200 bg-amber-50 text-amber-800"
      : "border-slate-200 bg-white text-slate-600";
  const point = connecte ? "bg-emerald-500" : etat === "deconnecte" ? "bg-amber-500" : "bg-slate-300";

  return (
    <Tooltip title={aide}>
      <span
        className={`inline-flex shrink-0 items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold ${couleur} ${className}`}
        aria-live="polite"
      >
        <span className={`h-2 w-2 rounded-full ${point}`} />
        <ScanBarcode size={15} />
        {libelle}
      </span>
    </Tooltip>
  );
};

export default IndicateurLecteur;
