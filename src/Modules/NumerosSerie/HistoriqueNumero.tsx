// Historique d'une unité (traçabilité) : chaque événement, du plus ancien au plus récent.
import { Timeline } from "antd";
import dayjs from "dayjs";
import type { EvenementSerie } from "./api";

const COULEURS: Record<string, string> = {
  entree: "green", vente: "purple", restauration: "purple", avarie: "red",
  annulation: "blue", retour: "blue", modification: "blue", suivi_arrete: "gray",
};

const argent = (n?: number) => (n == null ? "" : `${Math.round(n).toLocaleString("fr-FR")} CFA`);

const HistoriqueNumero = ({ historique }: { historique: EvenementSerie[] }) => (
  <Timeline
    className="!mt-2"
    items={historique.map((e) => ({
      color: COULEURS[e.type] || "gray",
      children: (
        <div className="text-xs">
          <div className="font-semibold text-slate-800">{e.libelle}</div>
          <div className="text-slate-500">
            {[
              e.date ? dayjs(e.date).format("DD/MM/YYYY HH:mm") : "",
              e.client_nom ? `Client : ${e.client_nom}` : "",
              e.prix != null ? `Prix : ${argent(e.prix)}` : "",
              e.origine ? `Origine : ${e.origine}` : "",
              e.motif ? `Motif : ${e.motif}` : "",
              e.par_nom ? `Par : ${e.par_nom}` : "",
            ].filter(Boolean).join(" · ")}
          </div>
        </div>
      ),
    }))}
  />
);

export default HistoriqueNumero;
