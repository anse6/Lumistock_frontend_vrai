// src/Components/admin/Produits/ExpiredProductModal.tsx
import React, { useState } from "react";
import {
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Result,
  ConfigProvider,
  message,
  Tag,
} from "antd";
import {
  ExclamationCircleOutlined,
  CheckCircleFilled,
  InboxOutlined,
} from "@ant-design/icons";
import { getUrlServer } from "../../../configServer";

const { Option } = Select;
const { TextArea } = Input;

const APP_COLOR = "#3b1558";
const APP_COLOR_LIGHT = "#f5f0fa";

const AVARIE_TYPES = [
  { value: "perime", label: "Produit périmé" },
  { value: "casse", label: "Casse / bris" },
  { value: "vol", label: "Vol / perte" },
  { value: "deteriore", label: "Détérioration / avarie" },
  { value: "autre", label: "Autre motif" },
];

interface ExpiredProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  productId: string;
  productName: string;
  currentStock?: number;
}

const ExpiredProductModal: React.FC<ExpiredProductModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  productId,
  productName,
  currentStock,
}) => {
  const [messageApi, contextHolder] = message.useMessage();
  const [form] = Form.useForm();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleClose = () => {
    form.resetFields();
    setIsSuccess(false);
    onClose();
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      // Validation frontend : quantité > stock actuel
      if (currentStock !== undefined && values.quantity > currentStock) {
        messageApi.error(
          `La quantité (${values.quantity}) dépasse le stock actuel (${currentStock}).`,
        );
        return;
      }

      const accessToken = localStorage.getItem("access_token");
      if (!accessToken) {
        messageApi.error("Authentification requise.");
        return;
      }

      setIsLoading(true);

      const payload: Record<string, any> = {
        quantite: values.quantity,
      };
      if (values.avarie_type) payload.type_avarie = values.avarie_type;
      if (values.description) payload.description = values.description;
      if (values.responsable) payload.responsable = values.responsable;

      const response = await fetch(
        `${getUrlServer()}/produits/${productId}/perime`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify(payload),
        },
      );

      if (response.ok) {
        setIsSuccess(true);
        onSuccess();
        setTimeout(() => {
          handleClose();
        }, 2200);
      } else {
        const data = await response.json();
        messageApi.error(data.error || data.message || "Une erreur est survenue.");
      }
    } catch (err: any) {
      if (err?.errorFields) return;
      messageApi.error("Impossible de contacter le serveur.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: APP_COLOR,
          borderRadius: 10,
        },
      }}
    >
      {contextHolder}
      <Modal
        open={isOpen}
        onCancel={handleClose}
        onOk={isSuccess ? handleClose : handleSubmit}
        confirmLoading={isLoading}
        title={
          <div className="flex items-center gap-3 pt-1 pb-2">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: APP_COLOR_LIGHT }}
            >
              <ExclamationCircleOutlined
                style={{ color: APP_COLOR, fontSize: 20 }}
              />
            </div>
            <div>
              <p className="font-bold text-gray-900 text-base mb-0">
                Signaler une Avarie
              </p>
              <p className="text-xs text-gray-400 font-normal mb-0 truncate max-w-xs">
                Retrait du stock · {productName}
              </p>
            </div>
          </div>
        }
        okText={isSuccess ? "Fermer" : "Enregistrer l'avarie"}
        cancelText="Annuler"
        okButtonProps={{
          style: { backgroundColor: APP_COLOR, borderColor: APP_COLOR },
          className: "font-semibold h-9",
        }}
        cancelButtonProps={{
          className:
            "!bg-gray-100 !text-gray-700 !border-none font-semibold h-9 hover:!bg-gray-200",
          disabled: isSuccess,
        }}
        width={560}
        destroyOnClose
      >
        {isSuccess ? (
          <div className="py-4">
            <Result
              icon={
                <CheckCircleFilled
                  style={{ color: "#22c55e", fontSize: 60 }}
                />
              }
              title={
                <span className="font-bold text-gray-800 text-lg">
                  Avarie enregistrée !
                </span>
              }
              subTitle={
                <span className="text-gray-500">
                  Le stock a été mis à jour et le mouvement a été tracé.
                </span>
              }
            />
          </div>
        ) : (
          <div className="pt-3 pb-1">
            {/* Encart article */}
            <div
              className="flex items-center gap-3 px-4 py-3 rounded-xl mb-5"
              style={{ backgroundColor: APP_COLOR_LIGHT }}
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${APP_COLOR}20` }}
              >
                <InboxOutlined style={{ color: APP_COLOR, fontSize: 18 }} />
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-0">Article concerné</p>
                <p className="font-semibold text-gray-800 mb-0 text-sm">
                  {productName}
                </p>
              </div>
            </div>

            <Form form={form} layout="vertical" requiredMark={false}>
              <div className="grid grid-cols-2 gap-4">
                {/* Type d'avarie */}
                <Form.Item
                  name="avarie_type"
                  label={
                    <span className="font-semibold text-gray-700 text-sm">
                      Type d'avarie{" "}
                      <span className="text-red-500 font-bold">*</span>
                    </span>
                  }
                  rules={[
                    {
                      required: true,
                      message: "Veuillez sélectionner le type",
                    },
                  ]}
                  className="!mb-3"
                >
                  <Select placeholder="Sélectionner...">
                    {AVARIE_TYPES.map((t) => (
                      <Option key={t.value} value={t.value}>
                        <span>{t.label}</span>
                      </Option>
                    ))}
                  </Select>
                </Form.Item>

                {/* Quantité */}
                <Form.Item
                  name="quantity"
                  label={
                    <span style={{ display: "block" }}>
                      <span className="font-semibold text-gray-700 text-sm">
                        Quantité retirée{" "}
                        <span className="text-red-500 font-bold">*</span>
                      </span>
                      {currentStock !== undefined && (
                        <span
                          className="text-xs font-medium ml-2 px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: "#f5f0fa", color: "#3b1558" }}
                        >
                          Stock : {currentStock}
                        </span>
                      )}
                    </span>
                  }
                  rules={[
                    { required: true, message: "Requis" },
                    { type: "number", min: 1, message: "Minimum 1" },
                    {
                      type: "number",
                      max: currentStock ?? Infinity,
                      message: `Ne peut pas dépasser le stock actuel (${currentStock})`,
                    },
                  ]}
                  className="!mb-3"
                >
                  <InputNumber
                    min={1}
                    max={currentStock ?? undefined}
                    placeholder="Ex: 5"
                    className="w-full"
                    style={{ width: "100%" }}
                    autoFocus
                  />
                </Form.Item>
              </div>

              {/* Description */}
              <Form.Item
                name="description"
                label={
                  <span className="font-semibold text-gray-700 text-sm">
                    Description{" "}
                    <Tag
                      bordered={false}
                      className="!text-xs !font-normal ml-1"
                      style={{ color: "#9ca3af", backgroundColor: "#f3f4f6" }}
                    >
                      optionnel
                    </Tag>
                  </span>
                }
                className="!mb-3"
              >
                <TextArea
                  rows={2}
                  placeholder="Décrivez les circonstances de l'avarie..."
                  className="resize-none"
                />
              </Form.Item>

              {/* Responsable */}
              <Form.Item
                name="responsable"
                label={
                  <span className="font-semibold text-gray-700 text-sm">
                    Signalé par{" "}
                    <Tag
                      bordered={false}
                      className="!text-xs !font-normal ml-1"
                      style={{ color: "#9ca3af", backgroundColor: "#f3f4f6" }}
                    >
                      optionnel
                    </Tag>
                  </span>
                }
                className="!mb-1"
              >
                <Input placeholder="Nom de la personne qui signale..." />
              </Form.Item>
            </Form>

            {/* Légende */}
            <div className="mt-3 px-1 flex items-center gap-1 text-xs text-gray-400">
              <span className="text-red-500 font-bold">*</span>
              <span>Champ obligatoire · Les autres champs sont optionnels</span>
            </div>
          </div>
        )}
      </Modal>
    </ConfigProvider>
  );
};

export default ExpiredProductModal;
