import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Form,
  Input,
  Select,
  Button,
  Row,
  Col,
  App,
  InputNumber,
  Spin,
  Alert,
  Upload,
  AutoComplete,
  ConfigProvider,
} from "antd";
import {
  ArrowLeftOutlined,
  PictureOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { useParams, useNavigate } from "react-router-dom";
import { Store } from "./types";
import { getUrlServer } from "./../../../configServer";
import type { UploadFile, UploadProps } from "antd";
import {
  countryOptions,
  findCountryOption,
  legalEntityOptions,
  useCitiesForCountry,
  useNeighborhoodsForCity,
} from "./locationData";
import { getApiErrorMessage } from "./apiErrors";
import CitySelect from "./CitySelect";
import { currencyOptions } from "./storeOptions";

const { Dragger } = Upload;

type StoreFormValues = {
  denomination: string;
  country_code: string;
  ville: string;
  quartier: string;
  email: string;
  telephone?: string;
  activité: string;
  max_managers: number;
  max_livreurs: number;
  max_caissiers: number;
  [key: string]: string | number | undefined;
};

const EditMagasin: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { message } = App.useApp();
  const [form] = Form.useForm();

  const selectedCountryCode = Form.useWatch("country_code", form);
  const selectedCity = Form.useWatch("ville", form);
  const selectedCountry = findCountryOption(selectedCountryCode);
  const { cities, isLoading: isLoadingCities } =
    useCitiesForCountry(selectedCountryCode);
  const { neighborhoods, isLoading: isLoadingNeighborhoods } =
    useNeighborhoodsForCity(selectedCountryCode, selectedCity);

  const neighborhoodOptions = useMemo(
    () => neighborhoods.map((name) => ({ value: name, label: name })),
    [neighborhoods],
  );

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [store, setStore] = useState<Store | null>(null);

  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const fetchStore = useCallback(async () => {
    if (!id) {
      setError("ID du magasin non fourni");
      setIsLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(`${getUrlServer()}/magasin/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok)
        throw new Error("Erreur lors du chargement du magasin.");

      const data = await response.json();
      const storeData = data.magasin || data.data || data;

      if (storeData) {
        const countryCode =
          storeData.country_code ||
          countryOptions.find((country) => country.name === storeData.pays)
            ?.code ||
          "CM";
        const callingCode = findCountryOption(countryCode)?.callingCode || "";
        const telephone = storeData.telephone?.startsWith(callingCode)
          ? storeData.telephone.slice(callingCode.length)
          : storeData.telephone || "";

        const formattedStore: Store = {
          _id: storeData._id || "",
          id: storeData._id || "",
          magasin: storeData.denomination || "",
          denomination: storeData.denomination || "",
          pays: storeData.pays || "",
          country_code: countryCode,
          region: storeData.region || "",
          ville: storeData.ville || "",
          quartier: storeData.quartier || "",
          adresse_ligne_1: storeData.adresse_ligne_1 || "",
          adresse_ligne_2: storeData.adresse_ligne_2 || "",
          code_postal: storeData.code_postal || "",
          email: storeData.email || "",
          telephone,
          site_web: storeData.site_web || "",
          raison_sociale: storeData.raison_sociale || "",
          forme_juridique: storeData.forme_juridique || "",
          numero_immatriculation: storeData.numero_immatriculation || "",
          numero_fiscal: storeData.numero_fiscal || "",
          devise: storeData.devise || "",
          activité: storeData.activité || "",
          licence: {
            max_managers: storeData.licence?.max_managers || 1,
            max_livreurs: storeData.licence?.max_livreurs || 2,
            max_caissiers: storeData.licence?.max_caissiers ?? 2,
          },
          logo: storeData.logo || "",
          is_active: storeData.is_active !== false,
          created_at: storeData.created_at || "",
          utilisateurs: storeData.utilisateurs || [],
        };

        setStore(formattedStore);
        setPreviewImage(formattedStore.logo || null);

        form.setFieldsValue({
          ...formattedStore,
          max_managers: formattedStore.licence.max_managers,
          max_livreurs: formattedStore.licence.max_livreurs,
          max_caissiers: formattedStore.licence.max_caissiers,
        });
      } else {
        throw new Error("Données du magasin introuvables");
      }
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue.");
    } finally {
      setIsLoading(false);
    }
  }, [id, form]);

  useEffect(() => {
    fetchStore();
  }, [fetchStore]);

  const onFinish = async (values: StoreFormValues) => {
    setSubmitting(true);
    try {
      const token = localStorage.getItem("access_token");
      const formData = new FormData();
      const country = findCountryOption(values.country_code);

      const fields = [
        "denomination",
        "country_code",
        "ville",
        "quartier",
        "email",
        "activité",
        "raison_sociale",
        "forme_juridique",
        // "region" n'a pas de champ dans ce formulaire : ne jamais l'envoyer,
        // sinon la valeur enregistrée serait effacée.
        "adresse_ligne_1",
        "adresse_ligne_2",
        "code_postal",
        "site_web",
        "numero_immatriculation",
        "numero_fiscal",
        "devise",
      ];

      // Un champ facultatif vidé (ou effacé via allowClear) est envoyé comme "" :
      // le backend l'efface au lieu de rejeter la requête (devise, site web...).
      fields.forEach((field) => {
        const value = values[field];
        formData.append(field, value == null ? "" : String(value).trim());
      });

      formData.append("pays", country?.name || "");
      if (values.telephone) {
        formData.append(
          "telephone",
          `${country?.callingCode || ""}${values.telephone.replace(/\D/g, "")}`,
        );
      }

      formData.append(
        "licence",
        JSON.stringify({
          max_managers: Number(values.max_managers),
          max_livreurs: Number(values.max_livreurs),
          max_caissiers: Number(values.max_caissiers ?? 2),
        }),
      );

      if (fileList[0]?.originFileObj)
        formData.append("image", fileList[0].originFileObj);

      const response = await fetch(`${getUrlServer()}/magasin/update/${id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(getApiErrorMessage(data, "Erreur lors de la mise à jour."));
      }

      message.success("Magasin mis à jour avec succès.");
      navigate("/superadmin/dashboard/magasin");
    } catch (err: unknown) {
      message.error(
        err instanceof Error ? err.message : "Une erreur est survenue.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogoChange: UploadProps["onChange"] = ({
    fileList: newFileList,
  }) => {
    setFileList(newFileList);
    if (newFileList.length > 0) {
      const file = newFileList[0].originFileObj;
      if (file) {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => setPreviewImage(reader.result as string);
      }
    }
  };

  const uploadProps: UploadProps = {
    onRemove: () => {
      setFileList([]);
      setPreviewImage(store?.logo || null);
    },
    beforeUpload: (file) => {
      const isSupportedImage = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
      ].includes(file.type);
      if (!isSupportedImage) {
        message.error(
          "Seuls les fichiers JPG, PNG, GIF ou WEBP sont acceptés.",
        );
        return Upload.LIST_IGNORE;
      }
      const isLt5M = file.size / 1024 / 1024 < 5;
      if (!isLt5M) {
        message.error("L’image doit être inférieure à 5 Mo.");
        return Upload.LIST_IGNORE;
      }
      return false;
    },
    onChange: handleLogoChange,
    fileList,
    showUploadList: false,
  };

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-[#f8f9fa]">
        <Spin size="large" />
      </div>
    );
  }

  if (error || !store) {
    return (
      <div className="p-6 bg-[#f8f9fa] min-h-screen flex items-center justify-center">
        <div className="w-full max-w-md min-w-0 rounded-2xl border border-purple-100/70 bg-white shadow-sm p-6 text-center">
          <Alert
            message="Erreur"
            description={error || "Magasin non trouvé"}
            type="error"
            showIcon
            className="mb-4 text-left"
          />
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate("/superadmin/dashboard/magasin")}
          >
            Retour
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <ConfigProvider
        theme={{
          token: {
            colorPrimary: "#3b0764", // purple-950 (couleur de la marque)
            borderRadius: 8,
            fontFamily: "'Poppins', sans-serif",
            colorBorder: "#e5e7eb", // gray-200
            controlHeight: 40,
          },
        }}
      >
        <div className="mx-auto w-full min-w-0 max-w-[1400px]">
          <div className="flex flex-col">
            {/* Header Section */}
            <div className="mb-5 flex items-center gap-2 sm:gap-3">
              <Button
                type="text"
                shape="circle"
                aria-label="Retour aux magasins"
                icon={<ArrowLeftOutlined style={{ fontSize: 20 }} />}
                onClick={() => navigate("/superadmin/dashboard/magasin")}
                className="!h-11 !w-11 !min-w-11 !p-0 shrink-0 !text-purple-950 hover:!bg-purple-50 hover:!text-purple-950"
              />
              <div className="min-w-0">
                <h1 className="truncate text-xl font-bold text-purple-950 sm:text-2xl">Modifier {store.denomination}</h1>
                <p className="mt-0.5 text-sm text-slate-500">Informations, logo et licence du magasin.</p>
              </div>
            </div>

            <Form
              form={form}
              layout="vertical"
              onFinish={onFinish}
              requiredMark={false}
            >
              <Row gutter={24}>
                <Col xs={24} xl={16}>
                  {/* SECTION 1: Informations Générales */}
                  <div className="min-w-0 rounded-2xl border border-purple-100/70 bg-white shadow-sm mb-6">
                    <div className="p-5 border-b border-gray-100">
                      <div className="text-base font-bold text-slate-800">
                        Informations Générales
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        Les détails principaux de l'établissement.
                      </div>
                    </div>

                    <div className="p-5">
                      <Form.Item
                        label={
                          <span className="font-semibold text-slate-700 text-sm">
                            Dénomination du magasin{" "}
                            <span className="text-red-500">*</span>
                          </span>
                        }
                        name="denomination"
                        rules={[
                          {
                            required: true,
                            message: "La dénomination est requise",
                          },
                        ]}
                      >
                        <Input
                          placeholder="Entrer la dénomination"
                          className="h-10"
                        />
                      </Form.Item>

                      <Row gutter={16}>
                        <Col xs={24} sm={12}>
                          <Form.Item
                            label={
                              <span className="font-semibold text-slate-700 text-sm">
                                Pays <span className="text-red-500">*</span>
                              </span>
                            }
                            name="country_code"
                            rules={[
                              { required: true, message: "Le pays est requis" },
                            ]}
                          >
                            <Select
                              showSearch
                              optionFilterProp="label"
                              options={countryOptions.map((country) => ({
                                value: country.code,
                                label: `${country.flag} ${country.name} (${country.callingCode})`,
                              }))}
                              onChange={() =>
                                form.setFieldsValue({
                                  ville: undefined,
                                  quartier: undefined,
                                })
                              }
                              className="h-10"
                            />
                          </Form.Item>
                        </Col>
                        <Col xs={24} sm={12}>
                          <Form.Item
                            label={
                              <span className="font-semibold text-slate-700 text-sm">
                                Ville <span className="text-red-500">*</span>
                              </span>
                            }
                            name="ville"
                            rules={[
                              {
                                required: true,
                                message: "La ville est requise",
                              },
                            ]}
                          >
                            <CitySelect
                              placeholder="Choisir ou saisir la ville"
                              disabled={!selectedCountryCode}
                              loading={isLoadingCities}
                              cities={cities}
                              onCityChange={() =>
                                form.setFieldValue("quartier", undefined)
                              }
                              className="h-10"
                            />
                          </Form.Item>
                        </Col>
                      </Row>

                      <Row gutter={16}>
                        <Col xs={24} sm={12}>
                          <Form.Item
                            label={
                              <span className="font-semibold text-slate-700 text-sm">
                                Téléphone professionnel
                              </span>
                            }
                            name="telephone"
                            rules={[
                              {
                                pattern: /^[0-9 ()-]+$/,
                                message: "Caractères non valides",
                              },
                            ]}
                          >
                            <Input
                              addonBefore={
                                <span className="text-slate-600">
                                  {selectedCountry
                                    ? `${selectedCountry.flag} ${selectedCountry.callingCode}`
                                    : "+"}
                                </span>
                              }
                              className="h-10"
                              maxLength={9}
                              onChange={(e) => {
                                const digits = e.target.value
                                  .replace(/\D/g, "")
                                  .slice(0, 9);
                                form.setFieldValue("telephone", digits);
                              }}
                            />
                          </Form.Item>
                        </Col>
                        <Col xs={24} sm={12}>
                          <Form.Item
                            label={
                              <span className="font-semibold text-slate-700 text-sm">
                                Site web
                              </span>
                            }
                            name="site_web"
                            rules={[{ type: "url", message: "URL invalide" }]}
                          >
                            <Input placeholder="https://" className="h-10" />
                          </Form.Item>
                        </Col>
                      </Row>

                      <Row gutter={16}>
                        <Col xs={24} sm={12}>
                          <Form.Item
                            label={
                              <span className="font-semibold text-slate-700 text-sm">
                                Quartier <span className="text-red-500">*</span>
                              </span>
                            }
                            name="quartier"
                            rules={[
                              {
                                required: true,
                                message: "Le quartier est requis",
                              },
                            ]}
                          >
                            <AutoComplete
                              allowClear
                              options={neighborhoodOptions}
                              placeholder={
                                selectedCity
                                  ? "Choisir ou saisir le quartier"
                                  : "Saisir le quartier manuellement"
                              }
                              disabled={!selectedCountryCode}
                              notFoundContent={
                                isLoadingNeighborhoods
                                  ? "Chargement…"
                                  : "Aucun quartier référencé : saisissez-le manuellement"
                              }
                            >
                              <Input className="h-10" />
                            </AutoComplete>
                          </Form.Item>
                        </Col>
                        <Col xs={24} sm={12}>
                          <Form.Item
                            label={
                              <span className="font-semibold text-slate-700 text-sm">
                                Email <span className="text-red-500">*</span>
                              </span>
                            }
                            name="email"
                            rules={[
                              {
                                required: true,
                                type: "email",
                                message: "Email valide requis",
                              },
                            ]}
                          >
                            <Input
                              placeholder="Entrer l'email"
                              className="h-10"
                            />
                          </Form.Item>
                        </Col>
                      </Row>

                      <Form.Item
                        label={
                          <span className="font-semibold text-slate-700 text-sm">
                            Activité principale{" "}
                            <span className="text-red-500">*</span>
                          </span>
                        }
                        name="activité"
                        rules={[
                          { required: true, message: "L'activité est requise" },
                        ]}
                        className="mb-0"
                      >
                        <Input.TextArea
                          rows={4}
                          placeholder="Entrer une brève description de l'activité..."
                          className="py-2"
                        />
                      </Form.Item>
                    </div>
                  </div>

                  {/* SECTION 2: Informations Légales */}
                  <div className="min-w-0 rounded-2xl border border-purple-100/70 bg-white shadow-sm mb-6">
                    <div className="p-5 border-b border-gray-100">
                      <div className="text-base font-bold text-slate-800">
                        Informations légales et paramètres
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        Les informations utiles pour les documents, la
                        facturation et les notifications.
                      </div>
                    </div>

                    <div className="p-5">
                      <Row gutter={16}>
                        <Col xs={24} sm={12}>
                          <Form.Item
                            label={
                              <span className="font-semibold text-slate-700 text-sm">
                                Raison sociale
                              </span>
                            }
                            name="raison_sociale"
                          >
                            <Input
                              placeholder="Entrer la raison sociale"
                              className="h-10"
                            />
                          </Form.Item>
                        </Col>
                        <Col xs={24} sm={12}>
                          <Form.Item
                            label={
                              <span className="font-semibold text-slate-700 text-sm">
                                Forme juridique
                              </span>
                            }
                            name="forme_juridique"
                          >
                            <Select
                              showSearch
                              optionFilterProp="label"
                              placeholder="Sélectionner..."
                              options={legalEntityOptions}
                              className="h-10"
                            />
                          </Form.Item>
                        </Col>
                        <Col xs={24} sm={12}>
                          <Form.Item
                            label={
                              <span className="font-semibold text-slate-700 text-sm">
                                N° d'immatriculation
                              </span>
                            }
                            name="numero_immatriculation"
                            className="mb-0 sm:mb-6"
                          >
                            <Input
                              placeholder="Entrer le numéro d'immatriculation"
                              className="h-10"
                            />
                          </Form.Item>
                        </Col>
                        <Col xs={24} sm={12}>
                          <Form.Item
                            label={
                              <span className="font-semibold text-slate-700 text-sm">
                                Numéro fiscal (NIU)
                              </span>
                            }
                            name="numero_fiscal"
                            className="mb-6"
                          >
                            <Input
                              placeholder="Entrer le numéro fiscal"
                              className="h-10"
                            />
                          </Form.Item>
                        </Col>
                      </Row>

                      <Row gutter={16}>
                        <Col xs={24} sm={12}>
                          <Form.Item
                            label={
                              <span className="font-semibold text-slate-700 text-sm">
                                Adresse / rue
                              </span>
                            }
                            name="adresse_ligne_1"
                          >
                            <Input
                              placeholder="Ex. avenue de la République"
                              className="h-10"
                            />
                          </Form.Item>
                        </Col>
                        <Col xs={24} sm={12}>
                          <Form.Item
                            label={
                              <span className="font-semibold text-slate-700 text-sm">
                                Complément d’adresse
                              </span>
                            }
                            name="adresse_ligne_2"
                          >
                            <Input
                              placeholder="Immeuble, porte, repère…"
                              className="h-10"
                            />
                          </Form.Item>
                        </Col>
                        <Col xs={24} sm={12}>
                          <Form.Item
                            label={
                              <span className="font-semibold text-slate-700 text-sm">
                                Code postal
                              </span>
                            }
                            name="code_postal"
                          >
                            <Input
                              placeholder="Code postal (facultatif)"
                              className="h-10"
                            />
                          </Form.Item>
                        </Col>
                        <Col xs={24} sm={12}>
                          <Form.Item
                            label={
                              <span className="font-semibold text-slate-700 text-sm">
                                Devise utilisée
                              </span>
                            }
                            name="devise"
                          >
                            <Select
                              showSearch
                              optionFilterProp="label"
                              placeholder="Choisir une devise"
                              options={currencyOptions}
                              className="h-10"
                            />
                          </Form.Item>
                        </Col>
                      </Row>
                    </div>
                  </div>
                </Col>

                <Col xs={24} xl={8}>
                  {/* Logo Upload Card */}
                  <div className="min-w-0 rounded-2xl border border-purple-100/70 bg-white shadow-sm mb-6">
                    <div className="p-5 border-b border-gray-100">
                      <div className="text-base font-bold text-slate-800">
                        Logo du magasin
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        Ajoutez le logo qui représentera ce magasin.
                      </div>
                    </div>
                    <div className="p-5">
                      <Dragger
                        {...uploadProps}
                        className="bg-[#f8f9fa] border-gray-200 hover:border-purple-800 transition-colors"
                      >
                        <p className="ant-upload-drag-icon">
                          <PictureOutlined className="text-gray-400 text-3xl" />
                        </p>
                        <p className="ant-upload-text text-sm font-medium text-slate-700">
                          Déposez le logo ici
                        </p>
                        <p className="ant-upload-hint text-xs text-slate-500">
                          ou cliquez pour parcourir les fichiers (JPG, PNG, WEBP
                          — 5 Mo max)
                        </p>
                      </Dragger>

                      {previewImage && (
                        <div className="mt-4 p-2 border border-gray-200 rounded-md flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <img
                              src={previewImage}
                              alt="Aperçu du logo"
                              className="w-10 h-10 object-cover rounded"
                            />
                            <span className="text-sm text-slate-600 truncate max-w-[150px]">
                              {fileList[0]?.name || "Logo actuel"}
                            </span>
                          </div>
                          {fileList.length > 0 && (
                            <Button
                              type="text"
                              danger
                              icon={<DeleteOutlined />}
                              onClick={() => {
                                setFileList([]);
                                setPreviewImage(store?.logo || null);
                              }}
                              size="small"
                            />
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Status Card */}
                  <div className="min-w-0 rounded-2xl border border-purple-100/70 bg-white shadow-sm mb-6">
                    <div className="p-5 border-b border-gray-100">
                      <div className="text-base font-bold text-slate-800">
                        Statut du magasin
                      </div>
                    </div>
                    <div className="p-5">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          store.is_active ? "bg-green-50 text-green-800" : "bg-red-50 text-red-700"
                        }`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${store.is_active ? "bg-green-600" : "bg-red-500"}`} />
                        {store.is_active ? "Actif" : "Désactivé"}
                      </span>
                      <p className="mt-2 text-xs text-slate-500">
                        Pour activer ou désactiver le magasin, utilisez le menu ⋮ de la liste des magasins.
                      </p>
                    </div>
                  </div>

                  {/* Licence Card */}
                  <div className="min-w-0 rounded-2xl border border-purple-100/70 bg-white shadow-sm">
                    <div className="p-5 border-b border-gray-100">
                      <div className="text-base font-bold text-slate-800">
                        Licence
                      </div>
                    </div>
                    <div className="p-5">
                      <Row gutter={16}>
                        <Col xs={12} xl={24}>
                          <Form.Item
                            label={
                              <span className="font-semibold text-slate-700 text-sm">
                                Managers (max){" "}
                                <span className="text-red-500">*</span>
                              </span>
                            }
                            name="max_managers"
                            rules={[{ required: true }]}
                          >
                            <InputNumber
                              min={1}
                              max={10}
                              className="!w-full h-10"
                            />
                          </Form.Item>
                        </Col>
                        <Col xs={12} xl={24}>
                          <Form.Item
                            label={
                              <span className="font-semibold text-slate-700 text-sm">
                                Gérants (max){" "}
                                <span className="text-red-500">*</span>
                              </span>
                            }
                            name="max_livreurs"
                            rules={[{ required: true }]}
                          >
                            <InputNumber
                              min={1}
                              max={20}
                              className="!w-full h-10"
                            />
                          </Form.Item>
                        </Col>
                        <Col xs={12} xl={24}>
                          <Form.Item
                            label={
                              <span className="font-semibold text-slate-700 text-sm">
                                Caissiers (max)
                              </span>
                            }
                            name="max_caissiers"
                            rules={[{ required: true }]}
                            extra="Vente au comptoir depuis le stock du magasin"
                          >
                            <InputNumber
                              min={0}
                              max={50}
                              className="!w-full h-10"
                            />
                          </Form.Item>
                        </Col>
                      </Row>
                    </div>
                  </div>
                </Col>
              </Row>
              {/* Barre d'actions : reste visible en bas de l'écran pendant la saisie */}
              <div className="sticky bottom-0 z-10 -mx-4 mt-2 flex flex-col-reverse gap-2 border-t border-purple-100 bg-white/95 px-4 py-3 backdrop-blur sm:mx-0 sm:flex-row sm:items-center sm:justify-end sm:rounded-2xl sm:border sm:shadow-lg">
                <Button
                  onClick={() => navigate("/superadmin/dashboard/magasin")}
                  className="h-10 sm:min-w-[120px]"
                >
                  Annuler
                </Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={submitting}
                  className="h-10 !bg-purple-950 font-semibold hover:!bg-purple-900 sm:min-w-[200px]"
                >
                  Enregistrer les modifications
                </Button>
              </div>
            </Form>
          </div>
        </div>
      </ConfigProvider>
    </>
  );
};

export default EditMagasin;
