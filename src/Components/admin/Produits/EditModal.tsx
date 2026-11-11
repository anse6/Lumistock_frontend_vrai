import React, { useState, useEffect, useCallback } from "react";
import { useScanCodeBarre } from "../../../Modules/CodeBarre/LecteurCodeBarre";
import {
  ConfigProvider,
  Form,
  Input,
  InputNumber,
  Select,
  Button,
  Card,
  Space,
  Typography,
  Divider,
  App,
  Upload,
  Spin,
  Tooltip,
  DatePicker,
  Switch,
} from "antd";
import SaisieNumeros from "../../../Modules/NumerosSerie/SaisieNumeros";
import { useSuiviSerieActif } from "../../../Modules/NumerosSerie/api";
import {
  PlusOutlined,
  DeleteOutlined,
  ShoppingOutlined,
  ArrowLeftOutlined,
  CloudUploadOutlined,
  CheckCircleFilled,
  InfoCircleOutlined,
  BarcodeOutlined,
} from "@ant-design/icons";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getUrlServer } from "../../../configServer";
import axios from "axios";
import PageTitle from "../../PageTitle";
import dayjs from "dayjs";
import InlineSupplierForm from "../proapprov/product/parts/InlineSupplierForm";
import { useValorisation } from "../../../Modules/Valorisation/api";
import ConditionnementsEditor, { type ConditionnementSaisi } from "./ConditionnementsEditor";

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const APP_COLOR = "#3b1558";

interface Category {
  _id: string;
  nom: string;
}

type Conditionnement = ConditionnementSaisi;

interface ApiImage {
  _id: string;
  filename: string;
  nom: string;
  description: string;
  categorie: string;
  tags: string[];
}

interface Fournisseur {
  _id: string;
  nom: string;
  ville: string;
}

interface Unite {
  _id: string;
  unite: string;
}

const EditProduct: React.FC = () => {
  const { message: msg } = App.useApp();
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  // Coût d'achat calculé par la valorisation : modifiable seulement tant que
  // l'article n'a reçu qu'un seul lot (correction d'une erreur de saisie).
  const { data: valorisation } = useValorisation(id);
  const coutVerrouille = valorisation ? !valorisation.cout_modifiable : false;
  // Suivi par numéro de série : l'activer demande les numéros du stock actuel.
  const optionSerie = useSuiviSerieActif();
  const [suiviInitial, setSuiviInitial] = useState(false);
  const [stockInitial, setStockInitial] = useState(0);
  const suiviSerie = Form.useWatch("suivi_serie", form);
  const prixSaisi = Form.useWatch("price", form);
  const coutSaisi = Form.useWatch("purchasePrice", form);
  const uniteSaisie = Form.useWatch("unit", form);
  const activationSerie = Boolean(suiviSerie) && !suiviInitial;

  // States
  const [categories, setCategories] = useState<Category[]>([]);
  const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>([]);
  const [unites, setUnites] = useState<Unite[]>([]);
  const [availableImages, setAvailableImages] = useState<ApiImage[]>([]);
  const [barcodeMode, setBarcodeMode] = useState(false);

  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const [conditionnements, setConditionnements] = useState<Conditionnement[]>([]);

  // Loading states
  const [loading, setLoading] = useState(false);
  const [entityLoading, setEntityLoading] = useState(false);
  const [imagesLoading, setImagesLoading] = useState(true);
  const [isDownloadingImage, setIsDownloadingImage] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Inline forms visibility & data
  const [showCategoryInline, setShowCategoryInline] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  const [showFournisseurInline, setShowFournisseurInline] = useState(false);

  const [showUnitInline, setShowUnitInline] = useState(false);
  const [newUnitName, setNewUnitName] = useState("");


  const getImageUrl = (imagePath: string): string => {
    if (!imagePath) return "";
    if (imagePath.startsWith("http")) return imagePath;
    return `${getUrlServer()}/${imagePath.startsWith("uploads") ? imagePath : `uploads/images/${imagePath}`}`;
  };

  const fetchData = useCallback(async () => {
    setInitialLoading(true);
    try {
      const token = localStorage.getItem("access_token");
      if (!token || !id) return;

      const headers = { Authorization: `Bearer ${token}` };

      // Fetch user info for barcode mode
      axios.get(`${getUrlServer()}/users/me`, { headers }).then(res => {
        setBarcodeMode(res.data.barcode_mode || false);
      }).catch(err => console.error("Erreur info utilisateur:", err));

      const [catRes, imgRes, prodRes, unitRes, fourRes] = await Promise.all([
        axios.get(`${getUrlServer()}/categorie/`, { headers }),
        axios.get(`${getUrlServer()}/produits/suggestions`, { headers }),
        axios.get(`${getUrlServer()}/produits/${id}`, { headers }),
        axios.get(`${getUrlServer()}/unites/`, { headers }),
        axios.get(`${getUrlServer()}/fournisseurs`, { headers }),
      ]);

      setCategories(catRes.data);
      setUnites(unitRes.data);
      setAvailableImages(imgRes.data.images || []);
      setFournisseurs(fourRes.data);

      const prod = prodRes.data;
      form.setFieldsValue({
        productName: prod.nom,
        description: prod.description,
        category: prod.categorie_id,
        fournisseur: prod.fournisseur_id,
        unit: prod.unite,
        quantity: prod.quantite,
        price: prod.prix,
        purchasePrice: prod.prix_achat,
        suivi_serie: Boolean(prod.suivi_serie),
        code_barre: prod.code_barre,
        date_peremption: prod.date_peremption ? dayjs(prod.date_peremption) : undefined,
        seuil_alerte: prod.seuil_alerte,
        reference_fournisseur: prod.reference_fournisseur,
      });

      setConditionnements(prod.conditionnements || []);
      setSuiviInitial(Boolean(prod.suivi_serie));
      setStockInitial(Number(prod.quantite) || 0);
      if (prod.image) {
        setSelectedImageUrl(getImageUrl(prod.image));
      }
    } catch (err) {
      console.error("Erreur initialisation:", err);
      msg.error("Impossible de charger les données de l'article");
    } finally {
      setInitialLoading(false);
      setImagesLoading(false);
    }
  }, [id, form, msg]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const downloadImageAsFile = async (imageUrl: string, imageName: string): Promise<File> => {
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    const extension = imageUrl.split(".").pop()?.split("?")[0] || "jpg";
    const fileName = `${imageName.replace(/[^a-zA-Z0-9]/g, "_")}.${extension}`;
    return new File([blob], fileName, { type: blob.type });
  };

  const handleSelectSuggestedImage = async (image: ApiImage) => {
    setIsDownloadingImage(true);
    try {
      const file = await downloadImageAsFile(image.filename, image.nom);
      setSelectedImageFile(file);
      setSelectedImageUrl(URL.createObjectURL(file));
      msg.info(`Image sélectionnée : ${image.nom}`);
    } catch (_error) {
      msg.error("Impossible de charger l'image suggérée");
    } finally {
      setIsDownloadingImage(false);
    }
  };

  const handleCustomUpload = (file: any) => {
    setSelectedImageFile(file);
    setSelectedImageUrl(URL.createObjectURL(file));
    return false;
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    setEntityLoading(true);
    try {
      const token = localStorage.getItem("access_token");
      const response = await axios.post(
        `${getUrlServer()}/categorie/create`,
        { nom: newCategoryName },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      
      const newCatRes = await axios.get(`${getUrlServer()}/categorie/`, { headers: { Authorization: `Bearer ${token}` }});
      setCategories(newCatRes.data);
      
      form.setFieldsValue({ category: response.data._id || response.data.id });
      msg.success("Catégorie créée");
      setShowCategoryInline(false);
      setNewCategoryName("");
    } catch (err: any) {
      msg.error(err.response?.data?.message || "Action échouée");
    } finally {
      setEntityLoading(false);
    }
  };


  const handleCreateUnite = async () => {
    if (!newUnitName.trim()) return;
    setEntityLoading(true);
    try {
      const token = localStorage.getItem("access_token");
      await axios.post(`${getUrlServer()}/unites/`, { unite: newUnitName }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const newUnitRes = await axios.get(`${getUrlServer()}/unites/`, { headers: { Authorization: `Bearer ${token}` }});
      setUnites(newUnitRes.data);

      form.setFieldsValue({ unit: newUnitName });
      msg.success("Succès");
      setShowUnitInline(false);
      setNewUnitName("");
    } catch (err: any) {
      msg.error(err.response?.data?.message || "Action échouée");
    } finally {
      setEntityLoading(false);
    }
  };


  // Un scan fait n'importe où sur la page remplit le champ code-barre.
  useScanCodeBarre((scan) => {
    form.setFieldsValue({ code_barre: scan.code });
    msg.success(`Code-barre lu : ${scan.code}`);
  }, barcodeMode);

  const handleGenerateBarcode = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const response = await axios.get(
        `${getUrlServer()}/produits/generate-barcode`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      form.setFieldsValue({ code_barre: response.data.code_barre });
      msg.success("Succès");
    } catch (err) {
      msg.error("Erreur");
    }
  };

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("access_token");
      const formData = new FormData();
      formData.append("nom", values.productName);
      formData.append("description", values.description || "");
      formData.append("prix", values.price.toString());
      if (values.purchasePrice !== undefined && values.purchasePrice !== null) {
        formData.append("prix_achat", values.purchasePrice.toString());
      }
      formData.append("quantite", values.quantity.toString());
      if (optionSerie || suiviInitial) {
        formData.append("suivi_serie", values.suivi_serie ? "true" : "false");
        if (values.suivi_serie && !suiviInitial) {
          formData.append("numeros_serie", JSON.stringify(values.numeros_serie || []));
        }
      }
      formData.append("categorie_id", values.category);
      if (values.fournisseur) {
        formData.append("fournisseur_id", values.fournisseur);
      }
      formData.append("unite", values.unit);
      
      if (values.date_peremption) {
        formData.append("date_peremption", values.date_peremption.format("YYYY-MM-DD"));
      }
      if (values.seuil_alerte !== undefined && values.seuil_alerte !== null) {
        formData.append("seuil_alerte", values.seuil_alerte.toString());
      }
      if (values.reference_fournisseur) {
        formData.append("reference_fournisseur", values.reference_fournisseur);
      }

      if (selectedImageFile) {
        formData.append("image", selectedImageFile);
      }
      if (values.code_barre) {
        formData.append("code_barre", values.code_barre);
      }
      
      const sanitizedConditionnements = conditionnements.map((c) => ({
        ...(c._id ? { _id: c._id } : {}),
        nom: c.nom,
        facteur: c.facteur,
        prix_conditionnement: c.prix_conditionnement,
        // Palette = 84 packs : le serveur recalcule le nombre d'unités.
        ...(c.contenu_nom ? { contenu_nom: c.contenu_nom, contenu_nombre: c.contenu_nombre } : {}),
      }));
      formData.append(
        "conditionnements",
        JSON.stringify(sanitizedConditionnements),
      );

      await axios.put(`${getUrlServer()}/produits/${id}`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      msg.success("Article mis à jour avec succès.");
      navigate("/admin/dashboard/produits_approvisionnements");
    } catch (err: any) {
      msg.error(
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Une erreur est survenue lors de la mise à jour de l'article."
      );
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spin tip="Chargement de l'article..." />
      </div>
    );
  }

  return (
    <ConfigProvider theme={{ token: { colorPrimary: APP_COLOR, borderRadius: 8 } }}>
      <>
        <PageTitle>Modifier l'article</PageTitle>

      <div className="p-4 sm:p-6 bg-white min-h-screen">
        <div className="w-full">
          <div className="mb-6 flex items-center gap-2 text-sm font-medium animate-in fade-in slide-in-from-top-2 duration-300">
            <Link
              to="/admin/dashboard/produits_approvisionnements"
              className="transition-all duration-200 flex items-center gap-2 px-3 py-1.5 rounded-lg shadow-sm !text-white hover:!text-white hover:opacity-90"
              style={{ backgroundColor: APP_COLOR }}
            >
              <ArrowLeftOutlined className="text-xs" />
              Articles
            </Link>
            <span style={{ color: APP_COLOR }} className="font-bold px-1 opacity-50">{">"}</span>
            <span className="!text-white px-3 py-1.5 rounded-lg shadow-sm" style={{ backgroundColor: APP_COLOR }}>
              Modifier l'article
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <Title level={2} className="!mb-1 flex items-center gap-3">
                <ShoppingOutlined style={{ color: APP_COLOR }} />
                Modifier l'article
              </Title>
              <Text type="secondary">Modifier les informations de l'article</Text>
            </div>
            <Button className="!bg-gray-200 !text-gray-700 hover:!bg-gray-300 !border-none" icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
              Annuler
            </Button>
          </div>

          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            onFinishFailed={({ errorFields }) => {
              // Sinon rien ne se passe en apparence : on dit ce qui bloque.
              const premiere = errorFields[0]?.errors[0];
              msg.error(premiere ? `Modification non enregistrée : ${premiere}` : "Vérifiez les champs signalés en rouge.");
            }}
            scrollToFirstError={{ behavior: "smooth", block: "center" }}
            size="large"
            requiredMark="optional"
          >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <Card title="Informations de l'article" className="!rounded-xl shadow-sm border-gray-100">
                  <Form.Item
                    name="productName"
                    label="Nom de l'article"
                    rules={[{ required: true, message: "Le nom de l'article est requis" }]}
                  >
                    <Input placeholder="Ex: Ciment, Chocolat, Lait..." />
                  </Form.Item>

                  <Form.Item name="description" label="Description">
                    <TextArea rows={4} placeholder="Description détaillée..." />
                  </Form.Item>

                  {/* Champ affiché seulement si « Lecteur de code-barre » est activé dans Paramètres. */}
                  {barcodeMode && (
                    <div data-saisie-code-barre>
                      <Form.Item
                        name="code_barre"
                        label="Code-barre"
                        rules={[{ required: true, message: "Code-barre requis (mode Lecteur activé)" }]}
                        extra="Scannez le code imprimé sur l'emballage. Si l'article n'en a pas, cliquez sur « Générer » puis imprimez l'étiquette (Articles › Codes-barres)."
                      >
                        <Input
                          placeholder="Scanner ou saisir le code-barre"
                          prefix={<BarcodeOutlined className="text-gray-400" />}
                          onKeyDown={(e) => {
                            // Le lecteur termine par Entrée : ne pas enregistrer le formulaire.
                            if (e.key === "Enter") e.preventDefault();
                          }}
                          allowClear
                          suffix={
                            <Button
                              type="text"
                              size="small"
                              onClick={handleGenerateBarcode}
                              style={{ color: APP_COLOR }}
                              className="font-medium hover:bg-purple-50"
                            >
                              Générer
                            </Button>
                          }
                        />
                      </Form.Item>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col">
                      <Form.Item name="category" label="Catégorie" className="!mb-2">
                        <Select
                          placeholder="Sélectionner une catégorie"
                          showSearch
                          optionFilterProp="children"
                          popupRender={(menu) => (
                            <>
                              {menu}
                              <Divider style={{ margin: "8px 0" }} />
                              <Button
                                type="text"
                                block
                                icon={<PlusOutlined />}
                                onClick={() => {
                                  setShowCategoryInline(!showCategoryInline);
                                  const el = document.activeElement as HTMLElement;
                                  if (el) el.blur();
                                }}
                                style={{ color: APP_COLOR }}
                                className="font-medium"
                              >
                                Nouvelle catégorie
                              </Button>
                            </>
                          )}
                        >
                          {categories.map((c) => (
                            <Option key={c._id} value={c._id}>{c.nom}</Option>
                          ))}
                        </Select>
                      </Form.Item>
                      {showCategoryInline && (
                        <div className="p-3 bg-purple-50 border border-purple-100 rounded-lg flex flex-col gap-2 mb-4 animate-in fade-in zoom-in-95 duration-200">
                          <Input size="middle" placeholder="Nom de la catégorie" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} />
                          <div className="flex justify-end gap-2">
                            <Button size="middle" className="!bg-gray-200 !text-gray-700 hover:!bg-gray-300 !border-none" onClick={() => setShowCategoryInline(false)}>Annuler</Button>
                            <Button size="middle" type="primary" style={{ backgroundColor: APP_COLOR }} loading={entityLoading} onClick={handleCreateCategory}>Ajouter</Button>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col">
                      <Form.Item name="fournisseur" label="Fournisseur" rules={[{ required: true, message: "Requis" }]} className="!mb-2">
                        <Select
                          placeholder="Sélectionner un fournisseur"
                          showSearch
                          optionFilterProp="children"
                          popupRender={(menu) => (
                            <>
                              {menu}
                              <Divider style={{ margin: "8px 0" }} />
                              <Button
                                type="text"
                                block
                                icon={<PlusOutlined />}
                                onClick={() => {
                                  setShowFournisseurInline(!showFournisseurInline);
                                  const el = document.activeElement as HTMLElement;
                                  if (el) el.blur();
                                }}
                                style={{ color: APP_COLOR }}
                                className="font-medium"
                              >
                                Nouveau fournisseur
                              </Button>
                            </>
                          )}
                        >
                          {fournisseurs.map((f) => (
                            <Option key={f._id} value={f._id}>{f.nom}</Option>
                          ))}
                        </Select>
                      </Form.Item>
                      {showFournisseurInline && (
                        <InlineSupplierForm
                          appColor={APP_COLOR}
                          onCancel={() => setShowFournisseurInline(false)}
                          onSuccess={async (newId) => {
                            const fourRes = await axios.get(`${getUrlServer()}/fournisseurs`, {
                              headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` },
                            });
                            setFournisseurs(fourRes.data);
                            form.setFieldsValue({ fournisseur: newId });
                            setShowFournisseurInline(false);
                          }}
                        />
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Form.Item name="date_peremption" label="Date de péremption">
                       <DatePicker className="w-full" format="YYYY-MM-DD" placeholder="Sélectionner une date" />
                    </Form.Item>
                    
                    <Form.Item name="seuil_alerte" label="Seuil d'alerte (Stock min)" tooltip="Alerte lorsque le stock descend sous ce seuil">
                       <InputNumber className="w-full" min={0} placeholder="Ex: 10" style={{ width: '100%' }} />
                    </Form.Item>

                    <Form.Item name="reference_fournisseur" label="Référence Fournisseur" className="md:col-span-2">
                       <Input placeholder="Code ou référence chez le fournisseur" />
                    </Form.Item>
                  </div>
                </Card>

                <Card title="Prix & Stock Initial" className="!rounded-xl shadow-sm border-gray-100">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
                    <div className="flex flex-col">
                      <Form.Item name="unit" label="Unité de mesure" rules={[{ required: true }]} className="!mb-2">
                        <Select
                          placeholder="Sélectionner"
                          showSearch
                          optionFilterProp="children"
                          popupRender={(menu) => (
                            <>
                              {menu}
                              <Divider style={{ margin: "8px 0" }} />
                              <Button
                                type="text"
                                block
                                icon={<PlusOutlined />}
                                onClick={() => {
                                  setShowUnitInline(!showUnitInline);
                                  const el = document.activeElement as HTMLElement;
                                  if (el) el.blur();
                                }}
                                style={{ color: APP_COLOR }}
                                className="font-medium"
                              >
                                Nouvelle unité
                              </Button>
                            </>
                          )}
                        >
                          {unites.map((u) => (
                            <Option key={u._id || u.unite} value={u.unite}>{u.unite}</Option>
                          ))}
                        </Select>
                      </Form.Item>
                      {showUnitInline && (
                        <div className="p-3 bg-purple-50 border border-purple-100 rounded-lg flex flex-col gap-2 mb-4 animate-in fade-in zoom-in-95 duration-200">
                          <Input size="middle" placeholder="Unité (ex: Sac)" value={newUnitName} onChange={(e) => setNewUnitName(e.target.value)} />
                          <div className="flex justify-end gap-2">
                            <Button size="middle" className="!bg-gray-200 !text-gray-700 hover:!bg-gray-300 !border-none" onClick={() => setShowUnitInline(false)}>Annuler</Button>
                            <Button size="middle" type="primary" style={{ backgroundColor: APP_COLOR }} loading={entityLoading} onClick={handleCreateUnite}>Ajouter</Button>
                          </div>
                        </div>
                      )}
                    </div>

                    <Form.Item
                      name="quantity"
                      label="Quantité (Stock)"
                      rules={[{ required: true }]}
                      extra={suiviSerie ? "Article suivi par numéro de série : le stock change par un approvisionnement ou une avarie." : undefined}
                    >
                      <InputNumber className="w-full" min={0} placeholder="0" style={{ width: '100%' }} disabled={Boolean(suiviSerie)} />
                    </Form.Item>

                    {(optionSerie || suiviInitial) && (
                      <div className="md:col-span-2 rounded-lg border border-purple-100 bg-purple-50/50 p-3">
                        <Form.Item
                          name="suivi_serie"
                          valuePropName="checked"
                          label="Suivi par numéro de série"
                          tooltip="Chaque unité a un numéro unique, enregistré à l'arrivée et désigné à chaque vente. Arrêter le suivi conserve l'historique des numéros."
                          className="!mb-2"
                        >
                          <Switch disabled={!optionSerie && !suiviInitial} />
                        </Form.Item>
                        {activationSerie && stockInitial > 0 && (
                          <Form.Item
                            name="numeros_serie"
                            label={`Numéros de série des ${stockInitial} unité(s) en stock`}
                            className="!mb-0"
                            rules={[{
                              validator: (_, v: string[] = []) => v.length === stockInitial
                                ? Promise.resolve()
                                : Promise.reject(new Error(`Saisissez ${stockInitial} numéro(s) : un par unité en stock.`)),
                            }]}
                          >
                            <SaisieNumeros attendu={stockInitial} />
                          </Form.Item>
                        )}
                        {suiviInitial && !suiviSerie && (
                          <p className="text-xs text-amber-700">
                            Le suivi sera arrêté : les unités en stock ne seront plus désignées à la vente (leur historique est conservé).
                          </p>
                        )}
                      </div>
                    )}

                    <Form.Item
                      name="purchasePrice"
                      label={valorisation ? `Coût d'achat unitaire (${valorisation.methode})` : "Coût d'achat unitaire"}
                      className="md:col-span-2"
                      extra={coutVerrouille
                        ? "Calculé automatiquement à partir des approvisionnements, selon la méthode de valorisation du magasin."
                        : undefined}
                    >
                      <InputNumber
                        className="w-full"
                        style={{ width: '100%' }}
                        min={0}
                        disabled={coutVerrouille}
                        formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, " ")}
                        parser={(value) => value!.replace(/\s?/g, "") as any}
                        placeholder="0"
                      />
                    </Form.Item>

                    <Form.Item name="price" label="Prix de vente unitaire" className="md:col-span-2" rules={[{ required: true }]}>
                      <InputNumber
                        className="w-full"
                        style={{ width: '100%' }}
                        min={0}
                        formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, " ")}
                        parser={(value) => value!.replace(/\s?/g, "") as any}
                        placeholder="0"
                      />
                    </Form.Item>
                  </div>
                </Card>

                {!suiviSerie && (
                  <ConditionnementsEditor
                    value={conditionnements}
                    onChange={setConditionnements}
                    prixUnitaire={Number(prixSaisi) || 0}
                    coutUnitaire={Number(coutSaisi) || 0}
                    unite={typeof uniteSaisie === "string" ? uniteSaisie : undefined}
                    onError={(texte) => msg.error(texte)}
                  />
                )}
              </div>

              <div className="space-y-6">
                <Card title="Image de l'article" className="!rounded-xl shadow-sm border-gray-100">
                  <div className="flex flex-col items-center">
                    <div className="w-full aspect-square bg-gray-50 rounded-xl border-2 border-dashed flex items-center justify-center overflow-hidden relative group transition-colors border-gray-300">
                      {selectedImageUrl ? (
                        <>
                          <img src={selectedImageUrl} alt="Preview" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Button danger icon={<DeleteOutlined />} onClick={() => { setSelectedImageUrl(null); setSelectedImageFile(null); }}>
                              Retirer
                            </Button>
                          </div>
                        </>
                      ) : (
                        <div className="text-center p-6">
                          <CloudUploadOutlined className="text-4xl text-gray-300 mb-2" />
                          <Paragraph className="text-gray-400 text-sm">Importer une image</Paragraph>
                        </div>
                      )}
                      {isDownloadingImage && (
                        <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                          <Spin tip="Préparation..." />
                        </div>
                      )}
                    </div>
                    <Upload beforeUpload={handleCustomUpload} showUploadList={false} className="w-full mt-4">
                      <Button block icon={<CloudUploadOutlined />}>Parcourir</Button>
                    </Upload>
                  </div>

                  <Divider />

                  <div className="flex items-center justify-between mb-3">
                    <Text strong>Suggestions d'images</Text>
                    <Tooltip title="Images suggérées selon les catégories">
                      <InfoCircleOutlined className="text-gray-400" />
                    </Tooltip>
                  </div>

                  <div className="grid grid-cols-3 gap-2 max-h-60 overflow-y-auto pr-1">
                    {imagesLoading ? (
                      <div className="col-span-3 py-6 text-center"><Spin /></div>
                    ) : availableImages.length > 0 ? (
                      availableImages.map((img) => (
                        <div
                          key={img._id}
                          className={`relative aspect-square rounded-lg border-2 cursor-pointer transition-all overflow-hidden ${selectedImageUrl === img.filename ? "border-[#3b1558]" : "border-transparent hover:border-gray-200"}`}
                          onClick={() => handleSelectSuggestedImage(img)}
                        >
                          <img src={img.filename} alt={img.nom} className="w-full h-full object-cover" />
                          {selectedImageUrl === img.filename && (
                            <div className="absolute inset-0 bg-[#3b1558]/20 flex items-center justify-center text-white">
                              <CheckCircleFilled className="text-xl" />
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="col-span-3 text-center py-4">
                        <Text type="secondary">Aucune suggestion</Text>
                      </div>
                    )}
                  </div>
                </Card>

                <div className="sticky top-6">
                  <Card className="border-l-4 border-l-[#3b1558] shadow-md">
                    <Paragraph className="text-gray-500 text-sm mb-6">
                      Assurez-vous d'avoir bien vérifié les informations avant de valider.
                    </Paragraph>
                    <Space direction="vertical" className="w-full">
                      <Button
                        type="primary"
                        size="large"
                        block
                        htmlType="submit"
                        loading={loading}
                        style={{ backgroundColor: APP_COLOR, borderColor: APP_COLOR }}
                        className="h-12 text-lg font-semibold"
                      >
                        Enregistrer les modifications
                      </Button>
                      <Button size="large" block className="!bg-gray-200 !text-gray-700 hover:!bg-gray-300 !border-none" onClick={() => navigate(-1)}>
                        Annuler
                      </Button>
                    </Space>
                  </Card>
                </div>
              </div>
            </div>
          </Form>
        </div>
      </div>
      </>
    </ConfigProvider>
  );
};

export default EditProduct;
