// Articles › Fournisseurs : liste des fournisseurs du magasin, avec le nombre
// de produits qu'ils fournissent ; création, modification et suppression.
import React, { useState } from "react";
import { App, Button, ConfigProvider, Form, Input, Modal, Popconfirm, Table, Tag, Tooltip } from "antd";
import type { ColumnsType } from "antd/es/table";
import { Pencil, Plus, Trash2, Truck } from "lucide-react";
import dayjs from "dayjs";
import PageTitle from "../../Components/PageTitle";
import useCompteConnecte from "../../hooks/useCompteConnecte";
import { messageErreur } from "../../api/client";
import Entete from "./Entete";
import AvatarWithPopover from "../../Components/super-admin/users.tsx/components/AvatarWithPopover";
import { THEME_PAGE } from "./theme";
import {
  useEnregistrerFournisseur,
  useFournisseurs,
  useSupprimerFournisseur,
  type Fournisseur,
  type FournisseurSaisi,
} from "./api";

const correspond = (f: Fournisseur, q: string) =>
  !q || [f.nom, f.telephone, f.email, f.ville, f.pays].some((v) => (v || "").toLowerCase().includes(q));

const PageFournisseurs: React.FC = () => {
  const { message } = App.useApp();
  const { peut } = useCompteConnecte();
  const peutModifier = peut("produits.modifier");
  const peutCreer = peutModifier || peut("produits.creer");
  const { data: fournisseurs = [], isLoading, isError, refetch } = useFournisseurs();
  const enregistrer = useEnregistrerFournisseur();
  const supprimer = useSupprimerFournisseur();
  const [recherche, setRecherche] = useState("");
  const [edition, setEdition] = useState<Fournisseur | "nouveau" | null>(null);
  const [form] = Form.useForm<FournisseurSaisi>();

  const q = recherche.trim().toLowerCase();
  const liste = fournisseurs.filter((f) => correspond(f, q));

  const ouvrir = (f: Fournisseur | "nouveau") => {
    setEdition(f);
    form.setFieldsValue(
      f === "nouveau"
        ? { nom: "", telephone: "", email: "", pays: "", ville: "", adresse: "" }
        : { nom: f.nom, telephone: f.telephone, email: f.email, pays: f.pays, ville: f.ville, adresse: f.adresse },
    );
  };

  const valider = async () => {
    const valeurs = await form.validateFields();
    // Un champ vidé est envoyé vide (il est effacé), sauf l'email : le
    // serveur refuse une adresse vide.
    const donnees = Object.fromEntries(
      Object.entries(valeurs).map(([k, v]) => [k, typeof v === "string" ? v.trim() : ""]),
    ) as FournisseurSaisi;
    if (!donnees.email) delete donnees.email;
    try {
      await enregistrer.mutateAsync({ id: edition === "nouveau" ? undefined : edition?._id, donnees });
      message.success(edition === "nouveau" ? "Fournisseur ajouté." : "Fournisseur modifié.");
      setEdition(null);
    } catch (err) {
      message.error(messageErreur(err, "Le fournisseur n'a pas pu être enregistré."));
    }
  };

  const retirer = async (f: Fournisseur) => {
    try {
      await supprimer.mutateAsync(f._id);
      message.success("Fournisseur supprimé.");
    } catch (err) {
      message.error(messageErreur(err, "Le fournisseur n'a pas pu être supprimé."));
    }
  };

  const colonnes: ColumnsType<Fournisseur> = [
    {
      title: "Fournisseur",
      dataIndex: "nom",
      sorter: (a, b) => a.nom.localeCompare(b.nom),
      defaultSortOrder: "ascend",
      render: (nom: string, f) => (
        <div className="flex items-center gap-3">
          {/* Même avatar que les utilisateurs : initiales, couleur du nom, e-mail au survol. */}
          <AvatarWithPopover name={nom} email={f.email} size={36} />
          <div className="min-w-0">
            <div className="font-semibold text-slate-800">{nom}</div>
            {f.adresse && <div className="text-xs text-slate-400">{f.adresse}</div>}
          </div>
        </div>
      ),
    },
    {
      title: "Contact",
      key: "contact",
      render: (_, f) =>
        f.telephone || f.email ? (
          <div className="text-sm">
            {f.telephone && <div>{f.telephone}</div>}
            {f.email && <div className="text-xs text-slate-500">{f.email}</div>}
          </div>
        ) : (
          <span className="text-slate-300">—</span>
        ),
    },
    {
      title: "Ville",
      key: "lieu",
      render: (_, f) => [f.ville, f.pays].filter(Boolean).join(", ") || <span className="text-slate-300">—</span>,
    },
    {
      title: "Articles",
      dataIndex: "nb_produits",
      align: "center",
      sorter: (a, b) => a.nb_produits - b.nb_produits,
      render: (n: number) => <Tag color={n ? "purple" : "default"}>{n}</Tag>,
    },
    {
      title: "Ajouté le",
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
            render: (_: unknown, f: Fournisseur) => (
              <div className="flex justify-end gap-1">
                <Tooltip title="Modifier">
                  <Button type="text" icon={<Pencil size={16} />} onClick={() => ouvrir(f)} aria-label="Modifier" />
                </Tooltip>
                {f.nb_produits > 0 ? (
                  <Tooltip title={`Fournit ${f.nb_produits} article(s) : il ne peut pas être supprimé.`}>
                    <Button type="text" disabled icon={<Trash2 size={16} />} aria-label="Supprimer" />
                  </Tooltip>
                ) : (
                  <Popconfirm
                    title={`Supprimer « ${f.nom} » ?`}
                    okText="Supprimer"
                    cancelText="Annuler"
                    okButtonProps={{ danger: true }}
                    onConfirm={() => retirer(f)}
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
      <PageTitle>Fournisseurs</PageTitle>
      <div className="min-h-screen bg-white pb-16">
        <Entete
          titre="Fournisseurs"
          description="Les fournisseurs de votre magasin et le nombre d'articles que chacun vous fournit."
          icone={<Truck size={28} />}
          chiffres={[
            { libelle: "Fournisseurs", valeur: fournisseurs.length },
            { libelle: "Sans article", valeur: fournisseurs.filter((f) => !f.nb_produits).length },
          ]}
          actions={
            peutCreer && (
              <Button type="primary" icon={<Plus size={16} />} onClick={() => ouvrir("nouveau")}>
                Nouveau fournisseur
              </Button>
            )
          }
        />

        <div className="px-4 sm:px-6">
          <Input.Search
            allowClear
            className="mb-3 max-w-md"
            placeholder="Rechercher un fournisseur, un téléphone, une ville…"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
          />
          {isError ? (
            <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
              Les fournisseurs n'ont pas pu être chargés.{" "}
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
                showTotal: (total, [debut, fin]) => `${debut}-${fin} sur ${total} fournisseurs`,
              }}
              scroll={{ x: 640 }}
              locale={{ emptyText: q ? "Aucun fournisseur ne correspond à la recherche." : "Aucun fournisseur pour l'instant." }}
            />
          )}
        </div>
      </div>

      <Modal
        open={edition !== null}
        title={edition === "nouveau" ? "Nouveau fournisseur" : "Modifier le fournisseur"}
        okText="Enregistrer"
        cancelText="Annuler"
        confirmLoading={enregistrer.isPending}
        onOk={valider}
        onCancel={() => setEdition(null)}
        forceRender
      >
        <Form form={form} layout="vertical" requiredMark={false}>
          <Form.Item name="nom" label="Nom" rules={[{ required: true, whitespace: true, message: "Indiquez le nom du fournisseur." }]}>
            <Input autoFocus maxLength={120} />
          </Form.Item>
          <div className="grid grid-cols-1 gap-x-3 sm:grid-cols-2">
            <Form.Item name="telephone" label="Téléphone">
              <Input maxLength={30} />
            </Form.Item>
            <Form.Item name="email" label="Email" rules={[{ type: "email", message: "Adresse email invalide." }]}>
              <Input maxLength={120} />
            </Form.Item>
            <Form.Item name="ville" label="Ville">
              <Input maxLength={80} />
            </Form.Item>
            <Form.Item name="pays" label="Pays">
              <Input maxLength={80} />
            </Form.Item>
          </div>
          <Form.Item name="adresse" label="Adresse">
            <Input maxLength={200} />
          </Form.Item>
        </Form>
      </Modal>
    </ConfigProvider>
  );
};

export default PageFournisseurs;
