// src/Components/admin/Produits/SoldeAvarieModal.tsx
// Mise en solde d'unités avariées : elles entrent dans un produit lié
// « Nom (soldé) », vendu au prix soldé (coût 0, la perte étant déjà comptée).
import React, { useEffect, useState } from "react";
import {
  Alert,
  ConfigProvider,
  Form,
  Input,
  InputNumber,
  Modal,
  Result,
  message,
} from "antd";
import { CheckCircleFilled, TagOutlined } from "@ant-design/icons";
import { getUrlServer } from "../../../configServer";

const APP_COLOR = "#3b1558";
const APP_COLOR_LIGHT = "#f5f0fa";
const REMISE_PAR_DEFAUT = 0.5;

interface SoldeAvarieModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  productId: string;
  productName: string;
  /** Prix de vente normal du produit. */
  price: number;
  /** Unités avariées (hors vols) pas encore mises en solde. */
  soldable: number;
  /** Une partie des avaries est due à la péremption. */
  contientPerimes?: boolean;
}

const nombre = (valeur: number) => Math.round(valeur).toLocaleString("fr-FR");

const SoldeAvarieModal: React.FC<SoldeAvarieModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  productId,
  productName,
  price,
  soldable,
  contientPerimes = false,
}) => {
  const [messageApi, contextHolder] = message.useMessage();
  const [form] = Form.useForm();
  const [isLoading, setIsLoading] = useState(false);
  const [resultat, setResultat] = useState<string | null>(null);

  const quantite: number = Form.useWatch("quantite", form) ?? 0;
  const prixSolde: number = Form.useWatch("prix_solde", form) ?? 0;
  const remise = price > 0 ? Math.round((1 - prixSolde / price) * 100) : 0;

  useEffect(() => {
    if (isOpen) {
      form.setFieldsValue({
        quantite: soldable,
        prix_solde: Math.round(price * REMISE_PAR_DEFAUT),
      });
    }
  }, [isOpen, soldable, price, form]);

  const handleClose = () => {
    form.resetFields();
    setResultat(null);
    onClose();
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const accessToken = localStorage.getItem("access_token");
      if (!accessToken) {
        messageApi.error("Authentification requise.");
        return;
      }
      setIsLoading(true);
      const response = await fetch(`${getUrlServer()}/produits/${productId}/solder`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          quantite: values.quantite,
          prix_solde: values.prix_solde,
          ...(values.note ? { note: values.note } : {}),
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (response.ok) {
        setResultat(data.message ?? "Unités mises en solde.");
        onSuccess();
      } else {
        messageApi.error(data.error || data.message || "Une erreur est survenue.");
      }
    } catch (err: any) {
      if (err?.errorFields) return;
      messageApi.error("Impossible de contacter le serveur.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ConfigProvider theme={{ token: { colorPrimary: APP_COLOR, borderRadius: 10 } }}>
      {contextHolder}
      <Modal
        open={isOpen}
        onCancel={handleClose}
        onOk={resultat ? handleClose : handleSubmit}
        confirmLoading={isLoading}
        title={
          <div className="flex items-center gap-3 pt-1 pb-2">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: APP_COLOR_LIGHT }}
            >
              <TagOutlined style={{ color: APP_COLOR, fontSize: 20 }} />
            </div>
            <div>
              <p className="font-bold text-gray-900 text-base mb-0">Mettre en solde</p>
              <p className="text-xs text-gray-400 font-normal mb-0 truncate max-w-xs">
                Unités avariées · {productName}
              </p>
            </div>
          </div>
        }
        okText={resultat ? "Fermer" : "Mettre en solde"}
        cancelText="Annuler"
        okButtonProps={{
          style: { backgroundColor: APP_COLOR, borderColor: APP_COLOR },
          className: "font-semibold h-9",
          disabled: !resultat && soldable < 1,
        }}
        cancelButtonProps={{
          className: "!bg-gray-100 !text-gray-700 !border-none font-semibold h-9 hover:!bg-gray-200",
          disabled: !!resultat,
        }}
        width={560}
        destroyOnClose
      >
        {resultat ? (
          <Result
            icon={<CheckCircleFilled style={{ color: "#22c55e", fontSize: 60 }} />}
            title={<span className="font-bold text-gray-800 text-lg">Mise en solde enregistrée</span>}
            subTitle={<span className="text-gray-500">{resultat}</span>}
          />
        ) : (
          <div className="pt-3 pb-1">
            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="px-4 py-3 rounded-xl" style={{ backgroundColor: APP_COLOR_LIGHT }}>
                <p className="text-xs text-gray-500 mb-0">Unités à solder</p>
                <p className="font-bold mb-0 text-lg" style={{ color: APP_COLOR }}>
                  {soldable}
                </p>
              </div>
              <div className="px-4 py-3 rounded-xl bg-gray-50">
                <p className="text-xs text-gray-500 mb-0">Prix normal</p>
                <p className="font-bold mb-0 text-lg text-gray-800">{nombre(price)} CFA</p>
              </div>
            </div>

            {contientPerimes && (
              <Alert
                type="warning"
                showIcon
                className="!mb-4"
                message="Certaines unités sont déclarées périmées"
                description="Vérifiez que la réglementation vous autorise à les revendre avant de les mettre en solde."
              />
            )}

            <Form form={form} layout="vertical" requiredMark={false}>
              <div className="grid grid-cols-2 gap-4">
                <Form.Item
                  name="quantite"
                  label={<span className="font-semibold text-gray-700 text-sm">Quantité</span>}
                  rules={[
                    { required: true, message: "Requis" },
                    { type: "number", min: 1, message: "Minimum 1" },
                    { type: "number", max: soldable, message: `Maximum ${soldable}` },
                  ]}
                  className="!mb-3"
                >
                  <InputNumber min={1} max={soldable} precision={0} style={{ width: "100%" }} />
                </Form.Item>

                <Form.Item
                  name="prix_solde"
                  label={<span className="font-semibold text-gray-700 text-sm">Prix soldé (unité)</span>}
                  tooltip="S'applique à toutes les unités du produit soldé, y compris celles déjà en solde."
                  rules={[
                    { required: true, message: "Requis" },
                    { type: "number", min: 0, message: "Le prix ne peut pas être négatif" },
                    {
                      validator: (_, value) =>
                        price > 0 && value >= price
                          ? Promise.reject(new Error("Doit être inférieur au prix normal"))
                          : Promise.resolve(),
                    },
                  ]}
                  className="!mb-3"
                >
                  <InputNumber
                    min={0}
                    style={{ width: "100%" }}
                    addonAfter="CFA"
                    formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, " ")}
                    parser={(value) => value!.replace(/\s?/g, "") as any}
                  />
                </Form.Item>
              </div>

              {quantite > 0 && prixSolde >= 0 && prixSolde < price && (
                <div className="mb-4 flex items-center justify-between rounded-xl border border-purple-100 px-4 py-3 text-sm">
                  <span className="text-gray-600">
                    Remise <span className="font-semibold text-purple-950">−{remise} %</span>
                  </span>
                  <span className="text-gray-600">
                    Recette attendue{" "}
                    <span className="font-semibold text-purple-950">{nombre(quantite * prixSolde)} CFA</span>
                  </span>
                </div>
              )}

              <Form.Item
                name="note"
                label={
                  <span className="font-semibold text-gray-700 text-sm">
                    Note <span className="text-gray-400 text-xs font-normal">(optionnel)</span>
                  </span>
                }
                rules={[{ max: 200, message: "200 caractères maximum" }]}
                className="!mb-1"
              >
                <Input.TextArea rows={2} placeholder="État des articles, emballage abîmé…" className="resize-none" />
              </Form.Item>
            </Form>

            <p className="mt-3 mb-0 text-xs text-gray-400">
              Les unités sont mises en vente sous « {productName} (soldé) », visible en caisse et dans les
              ventes. Leur coût est déjà compté en perte : chaque vente soldée est une recette en plus.
            </p>
          </div>
        )}
      </Modal>
    </ConfigProvider>
  );
};

export default SoldeAvarieModal;
