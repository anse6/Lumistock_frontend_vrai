// Onglet « Valorisation » de la fiche article : méthode du magasin, coût
// d'achat calculé, valeur du stock et détail des lots d'achat.
import { Alert, Empty, Spin, Statistic, Table, Tag } from "antd";
import dayjs from "dayjs";
import { formatMontant, useValorisation, type Lot } from "./api";

const EXPLICATION = {
  CMUP: "Le coût d'achat est la moyenne pondérée de tous les lots en stock. Il est recalculé à chaque approvisionnement ; une vente ne le change pas.",
  FIFO: "Premier entré, premier sorti : chaque vente consomme d'abord les lots les plus anciens. Le coût d'achat est celui des lots qui restent.",
  LIFO: "Dernier entré, premier sorti : chaque vente consomme d'abord les lots les plus récents. Le coût d'achat est celui des lots qui restent.",
};

const ValorisationArticle = ({ articleId, devise = "FCFA" }: { articleId: string; devise?: string }) => {
  const { data: v, isLoading, isError } = useValorisation(articleId);
  if (isLoading) return <div className="py-10 text-center"><Spin /></div>;
  if (isError || !v) return <Empty description="Valorisation indisponible" />;

  const colonnes = [
    { title: "Date d'entrée", dataIndex: "date", key: "date",
      render: (d: string) => (d ? dayjs(d).format("DD/MM/YYYY HH:mm") : "—") },
    { title: "Origine", dataIndex: "origine", key: "origine",
      render: (o: string) => <span className="capitalize">{o}</span> },
    { title: "Qté reçue", dataIndex: "quantite_initiale", key: "qi", align: "right" as const },
    { title: "Qté restante", dataIndex: "quantite_restante", key: "qr", align: "right" as const,
      render: (q: number) => (q > 0 ? <b>{q}</b> : <Tag>Épuisé</Tag>) },
    { title: "Coût unitaire", dataIndex: "prix_unitaire", key: "pu", align: "right" as const,
      render: (p: number) => `${formatMontant(p)} ${devise}` },
    { title: "Valeur restante", key: "valeur", align: "right" as const,
      render: (_: unknown, l: Lot) => `${formatMontant(l.quantite_restante * l.prix_unitaire)} ${devise}` },
  ];

  return (
    <div className="py-2 space-y-4">
      <Alert type="info" showIcon message={v.methode_nom} description={EXPLICATION[v.methode]} />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Statistic title="Coût d'achat" value={formatMontant(v.cout_achat)} suffix={devise} />
        <Statistic title="Valeur du stock" value={formatMontant(v.valeur_stock)} suffix={devise} />
        <Statistic title="Coût de la prochaine vente" value={formatMontant(v.cout_prochaine_sortie)} suffix={devise} />
        <Statistic title="Dernier prix payé" value={formatMontant(v.dernier_prix_achat)} suffix={devise} />
      </div>
      <Table
        dataSource={v.lots}
        columns={colonnes}
        rowKey="id"
        size="small"
        pagination={{ pageSize: 10 }}
        scroll={{ x: "max-content" }}
        rowClassName={(l: Lot) => (l.quantite_restante > 0 ? "" : "opacity-50")}
      />
    </div>
  );
};

export default ValorisationArticle;
