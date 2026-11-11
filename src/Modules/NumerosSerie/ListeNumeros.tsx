// Liste des unités d'un article (ou du magasin) avec leur état et leur historique.
import { useState } from "react";
import { Input, Select, Table, Tag } from "antd";
import dayjs from "dayjs";
import { useNumeros, type NumeroSerie } from "./api";
import HistoriqueNumero from "./HistoriqueNumero";

export const TEINTE: Record<string, string> = { en_stock: "green", vendu: "purple", avarie: "red", retire: "default" };

const ListeNumeros = ({ articleId, avecArticle = false }: { articleId?: string; avecArticle?: boolean }) => {
  const [statut, setStatut] = useState<string | undefined>();
  const [q, setQ] = useState("");
  const { data = [], isLoading } = useNumeros({ produit_id: articleId, statut, q: q || undefined });

  const colonnes = [
    { title: "Numéro de série", dataIndex: "numero_serie", key: "n", render: (n: string) => <b className="font-mono">{n}</b> },
    ...(avecArticle ? [{ title: "Article", dataIndex: "produit", key: "a" }] : []),
    { title: "État", dataIndex: "statut", key: "s",
      render: (s: string, n: NumeroSerie) => <Tag color={TEINTE[s]}>{n.statut_libelle}</Tag> },
    { title: "Entré le", dataIndex: "date_entree", key: "e",
      render: (d?: string) => (d ? dayjs(d).format("DD/MM/YYYY") : "—") },
    { title: "Sorti le", dataIndex: "date_sortie", key: "o",
      render: (d?: string | null) => (d ? dayjs(d).format("DD/MM/YYYY") : "—") },
  ];

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-2">
        <Input.Search
          allowClear
          placeholder="Rechercher un numéro de série…"
          onSearch={setQ}
          onChange={(e) => !e.target.value && setQ("")}
          className="w-full sm:w-72"
          data-saisie-code-barre
        />
        <Select
          allowClear
          placeholder="Tous les états"
          value={statut}
          onChange={setStatut}
          className="w-full sm:w-48"
          options={[
            { value: "en_stock", label: "En stock" },
            { value: "vendu", label: "Vendu" },
            { value: "avarie", label: "Avarié" },
            { value: "retire", label: "Suivi arrêté" },
          ]}
        />
      </div>
      <Table
        rowKey="_id"
        size="small"
        loading={isLoading}
        dataSource={data}
        columns={colonnes}
        pagination={{ pageSize: 10, showSizeChanger: true, pageSizeOptions: [10, 20, 50, 100],
          showTotal: (t, r) => `${r[0]}-${r[1]} sur ${t} unités` }}
        expandable={{ expandedRowRender: (n: NumeroSerie) => <HistoriqueNumero historique={n.historique} /> }}
        scroll={{ x: "max-content" }}
        locale={{ emptyText: "Aucun numéro de série" }}
      />
    </div>
  );
};

export default ListeNumeros;
