// Rapport « Numéros de série » : quelles unités sont sorties, quand et pour
// qui (ventes, avaries), et recherche de l'historique complet d'une unité.
import { useState } from "react";
import { App, Button, Segmented, Table, Tag } from "antd";
import { Download, Hash } from "lucide-react";
import { Link } from "react-router-dom";
import { BarreFiltres, ChoixPeriode, EnteteRapport, argent, dateHeure, paramsPeriode, periodeDe } from "../Reports/ReportUi";
import { messageErreur } from "../../api/client";
import { exporterSorties, useSorties, type SortieSerie } from "./api";
import ListeNumeros from "./ListeNumeros";

const RapportNumerosSerie = ({ devise }: { devise: string }) => {
  const { message } = App.useApp();
  const [vue, setVue] = useState<"sorties" | "recherche">("sorties");
  const [preset, setPreset] = useState("mois");
  const [periode, setPeriode] = useState(periodeDe("mois"));
  const { debut, fin } = paramsPeriode(periode);
  const { data = [], isLoading } = useSorties(debut, fin);
  const [export_, setExport] = useState(false);

  const exporter = async () => {
    setExport(true);
    try {
      await exporterSorties(debut, fin);
    } catch (err) {
      message.error(messageErreur(err, "L'export n'a pas pu être fait."));
    } finally {
      setExport(false);
    }
  };

  const colonnes = [
    { title: "Date", dataIndex: "date", key: "d", render: (d: string) => dateHeure(d) },
    { title: "Numéro de série", dataIndex: "numero_serie", key: "n", render: (n: string) => <b className="font-mono">{n}</b> },
    { title: "Article", dataIndex: "produit", key: "a" },
    { title: "Sortie", dataIndex: "libelle", key: "t",
      render: (l: string, s: SortieSerie) => <Tag color={s.type === "avarie" ? "red" : "purple"}>{l}</Tag> },
    { title: "Client", dataIndex: "client_nom", key: "c", render: (c?: string) => c || "—" },
    { title: "Par", dataIndex: "par_nom", key: "p", render: (p?: string) => p || "—" },
    { title: "Prix", dataIndex: "prix", key: "x", align: "right" as const,
      render: (p?: number) => (p == null ? "—" : argent(p, devise)) },
    { title: "Ensuite", key: "r",
      render: (_: unknown, s: SortieSerie) =>
        s.revenu ? <Tag color="blue">{s.revenu_libelle}</Tag> : <span className="text-slate-400">—</span> },
    { title: "Vente", dataIndex: "vente_id", key: "v",
      render: (v?: string) => (v ? <Link to={`/admin/dashboard/deliverys/detaillivrason/${v}`}>Voir</Link> : "—") },
  ];

  return (
    <div>
      <EnteteRapport
        icone={<Hash size={20} />}
        titre="Numéros de série"
        description="Quelle unité est sortie, quand, pour quel client — et l'historique complet de chaque numéro."
        actions={
          <Segmented
            value={vue}
            onChange={(v) => setVue(v as typeof vue)}
            options={[{ value: "sorties", label: "Unités sorties" }, { value: "recherche", label: "Recherche et historique" }]}
          />
        }
      />
      {vue === "sorties" ? (
        <>
          <BarreFiltres>
            <ChoixPeriode preset={preset} periode={periode} onChange={(p, v) => { setPreset(p); setPeriode(v); }} />
            <Button className="ml-auto" icon={<Download size={14} />} loading={export_} onClick={exporter}
              disabled={!data.length}>
              Excel
            </Button>
          </BarreFiltres>
          <Table
            rowKey={(s: SortieSerie) => `${s.numero_serie}-${s.date}`}
            size="small"
            loading={isLoading}
            dataSource={data}
            columns={colonnes}
            pagination={{ pageSize: 15, showSizeChanger: true, pageSizeOptions: [10, 20, 50, 100],
              showTotal: (t, r) => `${r[0]}-${r[1]} sur ${t} sorties` }}
            scroll={{ x: "max-content" }}
            locale={{ emptyText: "Aucune unité suivie n'est sortie sur cette période" }}
          />
        </>
      ) : (
        <ListeNumeros avecArticle />
      )}
    </div>
  );
};

export default RapportNumerosSerie;
