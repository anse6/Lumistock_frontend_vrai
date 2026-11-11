// Articles › Catégories : catégories de produits du magasin, avec le nombre
// de produits rangés dans chacune ; création, modification et suppression.
import React, { useState } from "react";
import { App, Button, ConfigProvider, Form, Input, Modal, Popconfirm, Table, Tag, Tooltip } from "antd";
import type { ColumnsType } from "antd/es/table";
import { FolderTree, Pencil, Plus, Trash2 } from "lucide-react";
import dayjs from "dayjs";
import PageTitle from "../../Components/PageTitle";
import useCompteConnecte from "../../hooks/useCompteConnecte";
import { messageErreur } from "../../api/client";
import Entete from "./Entete";
import { THEME_PAGE } from "./theme";
import {
  useCategories,
  useEnregistrerCategorie,
  useSupprimerCategorie,
  type Categorie,
  type CategorieSaisie,
} from "./api";

const PageCategories: React.FC = () => {
  const { message } = App.useApp();
  const { peut } = useCompteConnecte();
  const peutModifier = peut("produits.modifier");
  const peutCreer = peutModifier || peut("produits.creer");
  const { data: categories = [], isLoading, isError, refetch } = useCategories();
  const enregistrer = useEnregistrerCategorie();
  const supprimer = useSupprimerCategorie();
  const [recherche, setRecherche] = useState("");
  const [edition, setEdition] = useState<Categorie | "nouvelle" | null>(null);
  const [form] = Form.useForm<CategorieSaisie>();

  const q = recherche.trim().toLowerCase();
  const liste = categories.filter(
    (c) => !q || c.nom.toLowerCase().includes(q) || (c.description || "").toLowerCase().includes(q),
  );
  const totalProduits = categories.reduce((s, c) => s + (c.nb_produits || 0), 0);

  const ouvrir = (c: Categorie | "nouvelle") => {
    setEdition(c);
    form.setFieldsValue(c === "nouvelle" ? { nom: "", description: "" } : { nom: c.nom, description: c.description || "" });
  };

  const valider = async () => {
    const valeurs = await form.validateFields();
    const donnees = { nom: valeurs.nom.trim(), description: (valeurs.description || "").trim() };
    try {
      await enregistrer.mutateAsync({ id: edition === "nouvelle" ? undefined : edition?._id, donnees });
      message.success(edition === "nouvelle" ? "Catégorie ajoutée." : "Catégorie modifiée.");
      setEdition(null);
    } catch (err) {
      message.error(messageErreur(err, "La catégorie n'a pas pu être enregistrée."));
    }
  };

  const retirer = async (c: Categorie) => {
    try {
      await supprimer.mutateAsync(c._id);
      message.success("Catégorie supprimée.");
    } catch (err) {
      message.error(messageErreur(err, "La catégorie n'a pas pu être supprimée."));
    }
  };

  const colonnes: ColumnsType<Categorie> = [
    {
      title: "Catégorie",
      dataIndex: "nom",
      sorter: (a, b) => a.nom.localeCompare(b.nom),
      defaultSortOrder: "ascend",
      render: (nom: string) => <span className="font-semibold text-slate-800">{nom}</span>,
    },
    {
      title: "Description",
      dataIndex: "description",
      render: (d?: string) => d || <span className="text-slate-300">—</span>,
    },
    {
      title: "Articles",
      dataIndex: "nb_produits",
      align: "center",
      sorter: (a, b) => a.nb_produits - b.nb_produits,
      render: (n: number) => <Tag color={n ? "purple" : "default"}>{n}</Tag>,
    },
    {
      title: "Créée le",
      dataIndex: "created_at",
      responsive: ["md"],
      render: (d?: string) => (d ? dayjs(d).format("DD/MM/YYYY") : "—"),
    },
    ...(peutModifier
      ? [
          {
            title: "",
            key: "actions",
            align: "right" as const,
            render: (_: unknown, c: Categorie) => (
              <div className="flex justify-end gap-1">
                <Tooltip title="Modifier">
                  <Button type="text" icon={<Pencil size={16} />} onClick={() => ouvrir(c)} aria-label="Modifier" />
                </Tooltip>
                {c.nb_produits > 0 ? (
                  <Tooltip title={`Contient ${c.nb_produits} article(s) : déplacez-les avant de la supprimer.`}>
                    <Button type="text" disabled icon={<Trash2 size={16} />} aria-label="Supprimer" />
                  </Tooltip>
                ) : (
                  <Popconfirm
                    title={`Supprimer « ${c.nom} » ?`}
                    okText="Supprimer"
                    cancelText="Annuler"
                    okButtonProps={{ danger: true }}
                    onConfirm={() => retirer(c)}
                  >
                    <Button type="text" danger icon={<Trash2 size={16} />} aria-label="Supprimer" />
                  </Popconfirm>
                )}
              </div>
            ),
          },
        ]
      : []),
  ];

  return (
    <ConfigProvider theme={THEME_PAGE}>
      <PageTitle>Catégories</PageTitle>
      <div className="min-h-screen bg-white pb-16">
        <Entete
          titre="Catégories"
          description="Les catégories d'articles de votre magasin et le nombre d'articles rangés dans chacune."
          icone={<FolderTree size={28} />}
          chiffres={[
            { libelle: "Catégories", valeur: categories.length },
            { libelle: "Articles classés", valeur: totalProduits },
          ]}
          actions={
            peutCreer && (
              <Button type="primary" icon={<Plus size={16} />} onClick={() => ouvrir("nouvelle")}>
                Nouvelle catégorie
              </Button>
            )
          }
        />

        <div className="px-4 sm:px-6">
          <Input.Search
            allowClear
            className="mb-3 max-w-md"
            placeholder="Rechercher une catégorie…"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
          />
          {isError ? (
            <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
              Les catégories n'ont pas pu être chargées.{" "}
              <Button size="small" onClick={() => refetch()}>
                Réessayer
              </Button>
            </div>
          ) : (
            <Table
              rowKey="_id"
              columns={colonnes}
              dataSource={liste}
              loading={isLoading}
              pagination={{
                defaultPageSize: 10,
                showSizeChanger: true,
                pageSizeOptions: [10, 20, 50, 100],
                showTotal: (total, [debut, fin]) => `${debut}-${fin} sur ${total} catégories`,
              }}
              scroll={{ x: 560 }}
              locale={{ emptyText: q ? "Aucune catégorie ne correspond à la recherche." : "Aucune catégorie pour l'instant." }}
            />
          )}
        </div>
      </div>

      <Modal
        open={edition !== null}
        title={edition === "nouvelle" ? "Nouvelle catégorie" : "Modifier la catégorie"}
        okText="Enregistrer"
        cancelText="Annuler"
        confirmLoading={enregistrer.isPending}
        onOk={valider}
        onCancel={() => setEdition(null)}
        forceRender
      >
        <Form form={form} layout="vertical" requiredMark={false}>
          <Form.Item name="nom" label="Nom" rules={[{ required: true, whitespace: true, message: "Indiquez le nom de la catégorie." }]}>
            <Input autoFocus maxLength={80} />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={3} maxLength={300} />
          </Form.Item>
        </Form>
      </Modal>
    </ConfigProvider>
  );
};

export default PageCategories;
