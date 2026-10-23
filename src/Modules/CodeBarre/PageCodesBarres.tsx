// Articles › Codes-barres : associer les codes lus sur les emballages, générer
// des codes internes pour les articles qui n'en ont pas, imprimer les étiquettes.
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Alert,
  App,
  Button,
  Checkbox,
  ConfigProvider,
  Empty,
  Input,
  InputNumber,
  Popconfirm,
  Segmented,
  Select,
  Table,
  Tabs,
  Tag,
  Tooltip,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { Barcode, Printer, ScanBarcode, Sparkles, X } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import PageTitle from "../../Components/PageTitle";
import useCompteConnecte from "../../hooks/useCompteConnecte";
import { getConditioningId } from "../../Components/admin/approvisonnement/conditioning";
import IndicateurLecteur from "./IndicateurLecteur";
import { useScanCodeBarre } from "./LecteurCodeBarre";
import { variantesSaisie, type ScanDetecte } from "./detecteur";
import { CLE_CATALOGUE, useCatalogue, type ProduitCatalogue } from "./AssocierCodeModal";
import { associerCode, chercherParCode, genererCodesManquants, messageErreur } from "./api";
import { bipErreur, bipOk } from "./sons";
import { ApercuEtiquettes, CodeBarreSvg, FORMATS, ZoneImpressionEtiquettes, type Etiquette } from "./Etiquettes";

const PURPLE_950 = "#3b0764";
const prix = (n: number) => `${Math.round(n || 0).toLocaleString("fr-FR")} FCFA`;
const correspond = (p: ProduitCatalogue, q: string) =>
  !q ||
  p.nom.toLowerCase().includes(q) ||
  (p.code_barre || "").toLowerCase().includes(q) ||
  (p.categorie_nom || "").toLowerCase().includes(q);

// ---------------------------------------------------------------- Associer
type Cible = { produitId: string; condId: string | null };

const OngletAssocier: React.FC<{ produits: ProduitCatalogue[]; chargement: boolean }> = ({ produits, chargement }) => {
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const [filtre, setFiltre] = useState<"sans" | "tous">("sans");
  const [recherche, setRecherche] = useState("");
  const [cible, setCible] = useState<Cible | null>(null);
  const [saisie, setSaisie] = useState("");
  const [enCours, setEnCours] = useState(false);

  const q = recherche.trim().toLowerCase();
  const sansCode = produits.filter((p) => !p.code_barre);
  // Tout le catalogue a déjà un code : on montre directement tous les articles.
  const [filtreChoisi, setFiltreChoisi] = useState(false);
  useEffect(() => {
    if (!chargement && !filtreChoisi && produits.length > 0 && sansCode.length === 0) setFiltre("tous");
  }, [chargement, filtreChoisi, produits.length, sansCode.length]);
  const liste = produits.filter((p) => (filtre === "tous" || !p.code_barre) && correspond(p, q));
  const produitCible = cible ? produits.find((p) => p._id === cible.produitId) : undefined;
  const cartonCible = cible?.condId ? produitCible?.conditionnements?.find((c) => getConditioningId(c._id) === cible.condId) : undefined;

  const rafraichir = () => queryClient.invalidateQueries({ queryKey: CLE_CATALOGUE });

  // Après un code enregistré, on passe à l'article suivant sans code de la liste.
  const suivant = (apres: string) => {
    const i = liste.findIndex((p) => p._id === apres);
    const prochain = liste.slice(i + 1).find((p) => !p.code_barre && p._id !== apres);
    setCible(prochain ? { produitId: prochain._id, condId: null } : null);
  };

  const enregistrer = async (code: string) => {
    if (!cible || !produitCible || enCours) return;
    setEnCours(true);
    try {
      await associerCode(cible.produitId, code, cible.condId);
      bipOk();
      message.success(`${produitCible.nom}${cartonCible ? ` (${cartonCible.nom})` : ""} : code ${code} enregistré.`);
      await rafraichir();
      if (cible.condId) setCible(null);
      else suivant(cible.produitId);
    } catch (err) {
      bipErreur();
      message.error(messageErreur(err, "Le code n'a pas pu être enregistré."));
    } finally {
      setEnCours(false);
      setSaisie("");
    }
  };

  const verifier = async (scan: ScanDetecte) => {
    try {
      const trouve = await chercherParCode(scan.variantes);
      if (trouve) {
        bipOk();
        const carton = trouve.produit.conditionnement_scanne;
        message.info(`Code ${trouve.code} : ${trouve.produit.nom}${carton ? ` (${carton.nom})` : ""}.`, 4);
      } else {
        bipErreur();
        message.warning(`Code ${scan.code} : aucun article. Cliquez sur « Scanner » sur la ligne d'un article pour le lui associer.`, 5);
      }
    } catch {
      message.error("Pas de connexion au serveur.");
    }
  };

  useScanCodeBarre((scan) => (cible ? enregistrer(scan.code) : verifier(scan)));

  const retirer = async (p: ProduitCatalogue, condId: string | null = null) => {
    try {
      await associerCode(p._id, "", condId);
      message.success("Code retiré.");
      rafraichir();
    } catch (err) {
      message.error(messageErreur(err, "Le code n'a pas pu être retiré."));
    }
  };

  const genererPour = async (ids: string[]) => {
    try {
      const { generes } = await genererCodesManquants(ids);
      message.success(
        generes.length
          ? `${generes.length} code(s) généré(s). Imprimez maintenant leurs étiquettes (onglet « Imprimer des étiquettes »).`
          : "Aucun code à générer.",
        5,
      );
      rafraichir();
    } catch (err) {
      message.error(messageErreur(err, "La génération a échoué."));
    }
  };

  const colonnes: ColumnsType<ProduitCatalogue> = [
    {
      title: "Article",
      key: "nom",
      render: (_, p) => (
        <div>
          <div className="font-semibold text-slate-900">{p.nom}</div>
          <div className="text-xs text-slate-500">
            {p.categorie_nom} · {prix(p.prix)} · {p.quantite} {p.unite} en stock
          </div>
        </div>
      ),
    },
    {
      title: "Code-barre",
      key: "code",
      width: 230,
      render: (_, p) =>
        p.code_barre ? (
          <Tag className="!font-mono !text-sm">{p.code_barre}</Tag>
        ) : (
          <span className="text-xs text-slate-400">Aucun code</span>
        ),
    },
    {
      title: "",
      key: "actions",
      width: 290,
      align: "right",
      render: (_, p) => {
        const actif = cible?.produitId === p._id && !cible.condId;
        return (
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              size="small"
              type={actif ? "primary" : "default"}
              icon={<ScanBarcode size={14} />}
              onClick={() => setCible(actif ? null : { produitId: p._id, condId: null })}
            >
              {actif ? "En attente du scan…" : p.code_barre ? "Rescanner" : "Scanner"}
            </Button>
            {!p.code_barre ? (
              <Tooltip title="Pour un article sans code imprimé : un code interne est créé, à imprimer sur une étiquette.">
                <Button size="small" icon={<Sparkles size={14} />} onClick={() => genererPour([p._id])}>
                  Générer
                </Button>
              </Tooltip>
            ) : (
              <Popconfirm title="Retirer le code de cet article ?" okText="Retirer" cancelText="Annuler" onConfirm={() => retirer(p)}>
                <Button size="small" danger type="text" icon={<X size={14} />}>
                  Retirer
                </Button>
              </Popconfirm>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      <Alert
        type="info"
        showIcon
        message="Comment faire"
        description={
          <ol className="!mb-0 list-decimal pl-4 text-sm">
            <li>Cliquez sur « Scanner » sur la ligne d'un article.</li>
            <li>Scannez le code imprimé sur son emballage : il est enregistré, et l'article sans code suivant est proposé automatiquement.</li>
            <li>Article sans code imprimé (vrac, produit local) : cliquez sur « Générer », puis imprimez son étiquette.</li>
          </ol>
        }
      />

      {cible && produitCible && (
        <div className="flex flex-col gap-3 rounded-2xl border-2 border-emerald-300 bg-emerald-50 p-4 sm:flex-row sm:items-center">
          <ScanBarcode className="hidden shrink-0 text-emerald-700 sm:block" size={28} />
          <div className="flex-1">
            <div className="text-sm font-bold text-emerald-900">
              Scannez maintenant le code de « {produitCible.nom}
              {cartonCible ? ` — ${cartonCible.nom}` : ""} »
            </div>
            <div className="text-xs text-emerald-800">Ou tapez le code puis Entrée.</div>
          </div>
          <div data-saisie-code-barre className="w-full sm:w-64">
            <Input
              autoFocus
              value={saisie}
              onChange={(e) => setSaisie(e.target.value)}
              onPressEnter={() => {
                const v = variantesSaisie(saisie);
                if (v.length) enregistrer(v[0]);
              }}
              placeholder="Code-barre"
              disabled={enCours}
            />
          </div>
          <Button onClick={() => setCible(null)}>Annuler</Button>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Segmented
          value={filtre}
          onChange={(v) => {
            setFiltreChoisi(true);
            setFiltre(v as "sans" | "tous");
          }}
          options={[
            { value: "sans", label: `Sans code (${sansCode.length})` },
            { value: "tous", label: `Tous les articles (${produits.length})` },
          ]}
        />
        <Input.Search
          allowClear
          placeholder="Rechercher un article, une catégorie, un code"
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          className="max-w-sm"
        />
        <div className="flex-1" />
        {sansCode.length > 0 && (
          <Popconfirm
            title={`Générer un code interne pour les ${sansCode.length} article(s) sans code ?`}
            description="À faire seulement pour les articles qui n'ont pas de code imprimé sur l'emballage."
            okText="Générer"
            cancelText="Annuler"
            onConfirm={() => genererPour(sansCode.map((p) => p._id))}
          >
            <Button icon={<Sparkles size={15} />}>Générer pour tous les articles sans code</Button>
          </Popconfirm>
        )}
      </div>

      <Table
        rowKey="_id"
        size="middle"
        loading={chargement}
        columns={colonnes}
        dataSource={liste}
        pagination={{ pageSize: 20, showSizeChanger: false }}
        rowClassName={(p) => (cible?.produitId === p._id ? "!bg-emerald-50" : "")}
        locale={{ emptyText: <Empty description={filtre === "sans" ? "Tous les articles ont un code-barre." : "Aucun article."} /> }}
        expandable={{
          rowExpandable: (p) => (p.conditionnements?.length ?? 0) > 0,
          expandedRowRender: (p) => (
            <div className="space-y-2 py-1">
              <div className="text-xs font-semibold text-slate-600">
                Cartons et paquets : leur code ajoute directement un carton à la vente.
              </div>
              {p.conditionnements!.map((c) => {
                const id = getConditioningId(c._id);
                const actif = cible?.produitId === p._id && cible.condId === id;
                return (
                  <div key={id} className="flex flex-wrap items-center gap-3 rounded-lg bg-slate-50 px-3 py-2">
                    <span className="min-w-40 text-sm font-medium">
                      {c.nom} ({c.facteur} unités)
                    </span>
                    {c.code_barre ? (
                      <Tag className="!font-mono">{c.code_barre}</Tag>
                    ) : (
                      <span className="text-xs text-slate-400">Aucun code</span>
                    )}
                    <div className="flex-1" />
                    <Button
                      size="small"
                      type={actif ? "primary" : "default"}
                      icon={<ScanBarcode size={14} />}
                      onClick={() => setCible(actif ? null : { produitId: p._id, condId: id })}
                    >
                      {actif ? "En attente du scan…" : c.code_barre ? "Rescanner" : "Scanner"}
                    </Button>
                    {c.code_barre && (
                      <Button size="small" danger type="text" icon={<X size={14} />} onClick={() => retirer(p, id)}>
                        Retirer
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          ),
        }}
      />
    </div>
  );
};

// ---------------------------------------------------------------- Étiquettes
const OngletEtiquettes: React.FC<{ produits: ProduitCatalogue[]; chargement: boolean; magasin?: string }> = ({
  produits,
  chargement,
  magasin,
}) => {
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const [nombres, setNombres] = useState<Record<string, number>>({});
  const [recherche, setRecherche] = useState("");
  const [formatId, setFormatId] = useState(FORMATS[0].id);
  const [avecPrix, setAvecPrix] = useState(true);
  const [avecMagasin, setAvecMagasin] = useState(true);
  const format = FORMATS.find((f) => f.id === formatId)!;

  const q = recherche.trim().toLowerCase();
  const liste = produits.filter((p) => correspond(p, q));
  const choisis = produits.filter((p) => nombres[p._id] > 0);
  const choisisSansCode = choisis.filter((p) => !p.code_barre);

  const etiquettes: Etiquette[] = useMemo(
    () =>
      choisis
        .filter((p) => p.code_barre)
        .flatMap((p) =>
          Array.from({ length: Math.min(nombres[p._id] || 0, 500) }, (_, i) => ({
            cle: `${p._id}-${i}`,
            nom: p.nom,
            prix: p.prix,
            code: p.code_barre!,
          })),
        ),
    [choisis, nombres],
  );

  const definir = (id: string, n: number | null) => setNombres((prev) => ({ ...prev, [id]: Math.max(0, Math.floor(n || 0)) }));

  const genererManquants = async () => {
    try {
      const { generes } = await genererCodesManquants(choisisSansCode.map((p) => p._id));
      message.success(`${generes.length} code(s) généré(s).`);
      queryClient.invalidateQueries({ queryKey: CLE_CATALOGUE });
    } catch (err) {
      message.error(messageErreur(err, "La génération a échoué."));
    }
  };

  const colonnes: ColumnsType<ProduitCatalogue> = [
    {
      title: "Article",
      key: "nom",
      render: (_, p) => (
        <div>
          <div className="font-semibold text-slate-900">{p.nom}</div>
          <div className="text-xs text-slate-500">
            {prix(p.prix)} · {p.quantite} en stock
          </div>
        </div>
      ),
    },
    {
      title: "Code",
      key: "code",
      width: 190,
      render: (_, p) =>
        p.code_barre ? (
          <CodeBarreSvg code={p.code_barre} hauteur={26} style={{ height: 34, width: 150 }} />
        ) : (
          <span className="text-xs text-amber-700">Pas de code</span>
        ),
    },
    {
      title: "Étiquettes",
      key: "nombre",
      width: 230,
      render: (_, p) => (
        <div className="flex items-center gap-2">
          <InputNumber min={0} max={500} value={nombres[p._id] || 0} onChange={(v) => definir(p._id, v)} className="w-20" />
          <Tooltip title="Une étiquette par unité en stock">
            <Button size="small" type="link" onClick={() => definir(p._id, Math.min(p.quantite, 500))}>
              = stock
            </Button>
          </Tooltip>
        </div>
      ),
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-5">
      <div className="space-y-3 xl:col-span-3">
        <Input.Search
          allowClear
          placeholder="Rechercher un article"
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          className="max-w-sm"
        />
        <Table
          rowKey="_id"
          size="small"
          loading={chargement}
          columns={colonnes}
          dataSource={liste}
          pagination={{ pageSize: 12, showSizeChanger: false }}
          rowClassName={(p) => (nombres[p._id] > 0 ? "!bg-purple-50" : "")}
        />
      </div>

      <div className="space-y-3 xl:col-span-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="mb-3 text-sm font-bold text-slate-900">Mise en page</div>
          <Select className="mb-3 w-full" value={formatId} onChange={setFormatId} options={FORMATS.map((f) => ({ value: f.id, label: f.libelle }))} />
          <div className="flex flex-wrap gap-4">
            <Checkbox checked={avecPrix} onChange={(e) => setAvecPrix(e.target.checked)}>
              Afficher le prix
            </Checkbox>
            <Checkbox checked={avecMagasin} onChange={(e) => setAvecMagasin(e.target.checked)}>
              Nom du magasin
            </Checkbox>
          </div>
          <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
            <div className="text-sm text-slate-600">
              <b>{etiquettes.length}</b> étiquette(s)
              {etiquettes.length > 0 && format.colonnes * format.lignes > 1
                ? ` · ${Math.ceil(etiquettes.length / (format.colonnes * format.lignes))} page(s)`
                : ""}
            </div>
            <div className="flex gap-2">
              {choisis.length > 0 && (
                <Button onClick={() => setNombres({})}>Tout vider</Button>
              )}
              <Button type="primary" icon={<Printer size={15} />} disabled={!etiquettes.length} onClick={() => window.print()}>
                Imprimer
              </Button>
            </div>
          </div>
        </div>

        {choisisSansCode.length > 0 && (
          <Alert
            type="warning"
            showIcon
            message={`${choisisSansCode.length} article(s) choisi(s) sans code-barre : ${choisisSansCode.map((p) => p.nom).join(", ")}.`}
            action={
              <Button size="small" onClick={genererManquants}>
                Générer leurs codes
              </Button>
            }
          />
        )}

        {etiquettes.length > 0 ? (
          <ApercuEtiquettes etiquettes={etiquettes} format={format} magasin={avecMagasin ? magasin : undefined} avecPrix={avecPrix} />
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
            Indiquez combien d'étiquettes imprimer pour chaque article : l'aperçu s'affiche ici.
          </div>
        )}
        <div className="text-xs text-slate-500">
          À l'impression, choisissez « Taille réelle / 100 % » (pas « Ajuster à la page ») et des marges à zéro pour que les
          étiquettes tombent bien sur la planche.
        </div>
      </div>

      <ZoneImpressionEtiquettes etiquettes={etiquettes} format={format} magasin={avecMagasin ? magasin : undefined} avecPrix={avecPrix} />
    </div>
  );
};

// ---------------------------------------------------------------- Page
const PageCodesBarres: React.FC = () => {
  const { magasin, peut, role } = useCompteConnecte();
  const { data: produits = [], isLoading } = useCatalogue();
  const [onglet, setOnglet] = useState("associer");
  const autorise = role === "admin" || (role === "manager" && peut("produits.modifier"));

  return (
    <ConfigProvider theme={{ token: { colorPrimary: PURPLE_950, borderRadius: 10 } }}>
      <PageTitle>Codes-barres</PageTitle>
      <div className="min-h-screen bg-white pb-16">
        <div className="flex flex-wrap items-center gap-2 px-4 pt-4 pb-3 text-sm font-medium sm:px-6">
          <Link
            to="/admin/dashboard/produits_approvisionnements"
            style={{ backgroundColor: PURPLE_950 }}
            className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold !text-white shadow-sm hover:opacity-90"
          >
            <ArrowLeftOutlined className="text-xs" />
            Articles
          </Link>
          <span className="font-bold text-gray-300">›</span>
          <span className="rounded-xl bg-gray-100 px-3 py-1.5 text-xs text-gray-500">Codes-barres</span>
        </div>

        <div className="mx-4 mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-purple-100 bg-gradient-to-br from-purple-50 to-white p-4 shadow-sm sm:mx-6">
          <div className="flex items-center gap-3">
            <Barcode className="text-purple-950" size={28} />
            <div>
              <h1 className="text-lg font-bold text-purple-950">Codes-barres</h1>
              <p className="text-xs text-slate-500">
                Associez les codes des emballages à vos articles et imprimez les étiquettes de ceux qui n'en ont pas.
              </p>
            </div>
          </div>
          <IndicateurLecteur />
        </div>

        <div className="px-4 sm:px-6">
          {!autorise ? (
            <Alert type="warning" showIcon message="Vous n'avez pas le droit de modifier les articles." />
          ) : (
            <Tabs
              activeKey={onglet}
              onChange={setOnglet}
              destroyInactiveTabPane
              items={[
                {
                  key: "associer",
                  label: "Associer les codes",
                  children: <OngletAssocier produits={produits} chargement={isLoading} />,
                },
                {
                  key: "etiquettes",
                  label: "Imprimer des étiquettes",
                  children: <OngletEtiquettes produits={produits} chargement={isLoading} magasin={magasin?.denomination} />,
                },
              ]}
            />
          )}
        </div>
      </div>
    </ConfigProvider>
  );
};

export default PageCodesBarres;
