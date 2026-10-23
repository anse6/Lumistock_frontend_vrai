import React, { useMemo, useState } from "react";
import {
  Form,
  Input,
  Select,
  Button,
  Upload,
  Row,
  Col,
  App,
  InputNumber,
  AutoComplete,
  DatePicker,
  Radio,
  ConfigProvider,
} from "antd";
import {
  PictureOutlined,
  ArrowLeftOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { isValidPhoneNumber, type Country } from "react-phone-number-input";
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

const NouveauMagasin: React.FC = () => {
  const navigate = useNavigate();
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const selectedCountryCode = Form.useWatch("country_code", form);
  const selectedCity = Form.useWatch("ville", form);
  const selectedCountry = findCountryOption(selectedCountryCode);
  const phonePrefix = selectedCountry
    ? `${selectedCountry.flag} ${selectedCountry.callingCode}`
    : "🇨🇲 +237";
  const phonePlaceholder =
    selectedCountryCode === "CM" || !selectedCountryCode
      ? "Ex. 6 12 34 56 78"
      : "Numéro national";

  const { cities, isLoading: isLoadingCities } =
    useCitiesForCountry(selectedCountryCode);
  const { neighborhoods, isLoading: isLoadingNeighborhoods } =
    useNeighborhoodsForCity(selectedCountryCode, selectedCity);

  const neighborhoodOptions = useMemo(
    () => neighborhoods.map((name) => ({ value: name, label: name })),
    [neighborhoods],
  );

  const validatePhone = (_: unknown, value?: string) => {
    const digits = String(value || "").replace(/\D/g, "");
    if (!digits) return Promise.resolve();
    if ((selectedCountryCode || "CM") === "CM" && digits.length !== 9) {
      return Promise.reject(
        new Error(
          "Au Cameroun, le numéro doit contenir exactement 9 chiffres.",
        ),
      );
    }
    if (!isValidPhoneNumber(digits, (selectedCountryCode || "CM") as Country)) {
      return Promise.reject(
        new Error("Le numéro n’est pas valide pour le pays sélectionné."),
      );
    }
    return Promise.resolve();
  };

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("access_token");
      if (!token) throw new Error("Non authentifié");

      const formDataToSend = new FormData();

      formDataToSend.append("denomination", values.denomination);
      formDataToSend.append("pays", selectedCountry?.name || "");
      formDataToSend.append("country_code", values.country_code);
      formDataToSend.append("ville", values.ville);
      formDataToSend.append("quartier", values.quartier);
      formDataToSend.append("email", values.email);
      formDataToSend.append("activité", values.activite);
      formDataToSend.append(
        "telephone",
        `${selectedCountry?.callingCode || "+237"}${values.telephone.replace(/\D/g, "")}`,
      );

      const optionalFields = [
        "raison_sociale",
        "forme_juridique",
        "region",
        "adresse_ligne_1",
        "adresse_ligne_2",
        "code_postal",
        "site_web",
        "numero_immatriculation",
        "numero_fiscal",
        "devise",
      ];

      optionalFields.forEach((field) => {
        if (values[field]) formDataToSend.append(field, values[field]);
      });

      formDataToSend.append("nombre_manager", values.nombre_manager.toString());
      formDataToSend.append("nombre_livreur", values.nombre_livreur.toString());
      formDataToSend.append("nombre_caissier", String(values.nombre_caissier ?? 2));

      const adminData = {
        name: values.admin_name,
        first_name: values.admin_first_name,
        email: values.admin_email,
        sexe: values.admin_sexe || "Homme",
        date_naissance: values.admin_date_naissance?.format("YYYY-MM-DD"),
        telephone: values.admin_telephone
          ? `${selectedCountry?.callingCode || "+237"}${values.admin_telephone.replace(/\D/g, "")}`
          : undefined,
        fonction: values.admin_fonction,
      };

      formDataToSend.append("admin", JSON.stringify(adminData));

      if (fileList.length > 0 && fileList[0].originFileObj) {
        formDataToSend.append("image", fileList[0].originFileObj);
      }

      const response = await fetch(`${getUrlServer()}/magasin/create`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formDataToSend,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          getApiErrorMessage(errorData, "Erreur lors de la création du magasin"),
        );
      }

      const result = await response.json().catch(() => null);
      if (result?.invitation_envoyee === false) {
        message.warning(result.message);
      } else {
        message.success("Magasin créé. L'administrateur a reçu un lien pour choisir son mot de passe.");
      }
      navigate("/superadmin/dashboard/magasin");
    } catch (err: any) {
      message.error(
        err.message || "Une erreur est survenue lors de la création.",
      );
    } finally {
      setLoading(false);
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
    } else {
      setPreviewImage(null);
    }
  };

  const uploadProps: UploadProps = {
    onRemove: () => {
      setFileList([]);
      setPreviewImage(null);
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
                <h1 className="truncate text-xl font-bold text-purple-950 sm:text-2xl">Ouvrir un nouveau magasin</h1>
                <p className="mt-0.5 text-sm text-slate-500">Le magasin, son administrateur et sa licence. L'administrateur reçoit un email pour choisir son mot de passe.</p>
              </div>
            </div>

            <Form
              form={form}
              layout="vertical"
              onFinish={onFinish}
              initialValues={{
                country_code: "CM",
                nombre_manager: 1,
                nombre_livreur: 2,
                nombre_caissier: 2,
                admin_sexe: "Homme",
              }}
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
                            message: "Veuillez entrer la dénomination",
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
                              {
                                required: true,
                                message: "Veuillez sélectionner le pays",
                              },
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
                                message: "Veuillez sélectionner la ville",
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
                                Quartier <span className="text-red-500">*</span>
                              </span>
                            }
                            name="quartier"
                            rules={[
                              {
                                required: true,
                                message:
                                  "Veuillez sélectionner ou saisir le quartier",
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
                                Email de contact{" "}
                                <span className="text-red-500">*</span>
                              </span>
                            }
                            name="email"
                            rules={[
                              {
                                required: true,
                                type: "email",
                                message: "Veuillez entrer un email valide",
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

                      <Row gutter={16}>
                        <Col xs={24} sm={12}>
                          <Form.Item
                            label={
                              <span className="font-semibold text-slate-700 text-sm">
                                Téléphone professionnel{" "}
                                <span className="text-red-500">*</span>
                              </span>
                            }
                            name="telephone"
                            rules={[
                              {
                                required: true,
                                message:
                                  "Veuillez entrer un numéro de téléphone",
                              },
                              {
                                pattern: /^[0-9 ()-]+$/,
                                message:
                                  "Le numéro contient des caractères non valides",
                              },
                              { validator: validatePhone },
                            ]}
                          >
                            <Input
                              addonBefore={
                                <span className="text-slate-600">
                                  {phonePrefix}
                                </span>
                              }
                              placeholder={phonePlaceholder}
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
                            <Input
                              placeholder="https://lumistock.com"
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
                        name="activite"
                        rules={[
                          {
                            required: true,
                            message: "Veuillez décrire l'activité",
                          },
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

                  {/* SECTION 3: Admin Card */}
                  <div className="min-w-0 rounded-2xl border border-purple-100/70 bg-white shadow-sm mb-6">
                    <div className="p-5 border-b border-gray-100">
                      <div className="text-base font-bold text-slate-800">
                        Compte administrateur
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        Détails de connexion du compte principal.
                      </div>
                    </div>

                    <div className="p-5">
                      <Row gutter={16}>
                        <Col xs={24} sm={12}>
                          <Form.Item
                            label={
                              <span className="font-semibold text-slate-700 text-sm">
                                Nom <span className="text-red-500">*</span>
                              </span>
                            }
                            name="admin_name"
                            rules={[{ required: true, message: "Requis" }]}
                          >
                            <Input
                              placeholder="Entrer le nom"
                              className="h-10"
                            />
                          </Form.Item>
                        </Col>
                        <Col xs={24} sm={12}>
                          <Form.Item
                            label={
                              <span className="font-semibold text-slate-700 text-sm">
                                Prénom <span className="text-red-500">*</span>
                              </span>
                            }
                            name="admin_first_name"
                            rules={[{ required: true, message: "Requis" }]}
                          >
                            <Input
                              placeholder="Entrer le prénom"
                              className="h-10"
                            />
                          </Form.Item>
                        </Col>
                      </Row>

                      <Form.Item
                        label={
                          <span className="font-semibold text-slate-700 text-sm">
                            Email de connexion{" "}
                            <span className="text-red-500">*</span>
                          </span>
                        }
                        name="admin_email"
                        rules={[
                          {
                            required: true,
                            type: "email",
                            message: "Email valide requis",
                          },
                        ]}
                      >
                        <Input placeholder="Entrer l'email" className="h-10" />
                      </Form.Item>

                      {/* Pas de mot de passe : l'admin reçoit un lien d'invitation
                          par email et choisit lui-même son mot de passe. */}
                      <p className="text-xs text-slate-500 mb-4">
                        L'administrateur recevra par email un lien sécurisé pour choisir son mot de passe.
                      </p>

                      <Row gutter={16}>
                        <Col xs={24}>
                          <Form.Item
                            label={
                              <span className="font-semibold text-slate-700 text-sm">
                                Téléphone personnel
                              </span>
                            }
                            name="admin_telephone"
                            rules={[{ validator: validatePhone }]}
                          >
                            <Input
                              addonBefore={
                                <span className="text-slate-600">
                                  {phonePrefix}
                                </span>
                              }
                              placeholder={phonePlaceholder}
                              className="h-10"
                              maxLength={9}
                              onChange={(e) => {
                                const digits = e.target.value.replace(
                                  /\D/g,
                                  "",
                                );
                                if (digits.length <= 9)
                                  form.setFieldValue("admin_telephone", digits);
                              }}
                            />
                          </Form.Item>
                        </Col>
                      </Row>
                      <Row gutter={16}>
                        <Col xs={24} sm={12}>
                          <Form.Item
                            label={
                              <span className="font-semibold text-slate-700 text-sm">
                                Sexe
                              </span>
                            }
                            name="admin_sexe"
                            initialValue="Homme"
                          >
                            <Radio.Group buttonStyle="solid">
                              <Radio.Button value="Homme">Homme</Radio.Button>
                              <Radio.Button value="Femme">Femme</Radio.Button>
                            </Radio.Group>
                          </Form.Item>
                        </Col>
                      </Row>
                      <Form.Item
                        label={
                          <span className="font-semibold text-slate-700 text-sm">
                            Date de naissance
                          </span>
                        }
                        name="admin_date_naissance"
                        className="mb-0"
                      >
                        <DatePicker
                          className="w-full h-10"
                          format="DD/MM/YYYY"
                          placeholder="Sélectionner la date"
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
                                N° d’immatriculation
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
                              {fileList[0]?.name || "Logo sélectionné"}
                            </span>
                          </div>
                          <Button
                            type="text"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => {
                              setFileList([]);
                              setPreviewImage(null);
                            }}
                            size="small"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* SECTION 4: Licence */}
                  <div className="min-w-0 rounded-2xl border border-purple-100/70 bg-white shadow-sm">
                    <div className="p-5 border-b border-gray-100">
                      <div className="flex justify-between items-center">
                        <div className="text-base font-bold text-slate-800">
                          Licence
                        </div>
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
                            name="nombre_manager"
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
                            name="nombre_livreur"
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
                            name="nombre_caissier"
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
                  loading={loading}
                  className="h-10 !bg-purple-950 font-semibold hover:!bg-purple-900 sm:min-w-[200px]"
                >
                  Créer le magasin
                </Button>
              </div>
            </Form>
          </div>
        </div>
      </ConfigProvider>
    </>
  );
};

export default NouveauMagasin;
