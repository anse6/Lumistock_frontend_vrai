import React, { useState, useEffect } from "react";
import {
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Button,
  Divider,
  ConfigProvider,
} from "antd";
import {
  PlusOutlined,
  UserOutlined,
  ShoppingCartOutlined,
} from "@ant-design/icons";
import { getUrlServer } from "../../../configServer";
import axios from "axios";
import InlineSupplierForm from "../proapprov/product/parts/InlineSupplierForm";

const { Option } = Select;
const APP_COLOR = "#3b1558";

interface Fournisseur {
  _id: string;
  nom: string;
  ville?: string;
}

interface SupplyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (quantity: number, amount: number, fournisseurId?: string) => void;
  productId?: string;
  productName?: string;
  supplyName: string;
  setSupplyName: (name: string) => void;
}

const SupplyModal: React.FC<SupplyModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  productName,
  supplyName,
  setSupplyName,
}) => {
  const [form] = Form.useForm();

  const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>([]);
  const [loadingFournisseurs, setLoadingFournisseurs] = useState(false);

  // Inline nouveau fournisseur
  const [showNewFournisseur, setShowNewFournisseur] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchFournisseurs();
      form.resetFields();
      setShowNewFournisseur(false);
    }
  }, [isOpen]);

  const fetchFournisseurs = async () => {
    setLoadingFournisseurs(true);
    try {
      const token = localStorage.getItem("access_token");
      const res = await axios.get(`${getUrlServer()}/fournisseurs`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFournisseurs(res.data);
    } catch (err) {
      console.error("Erreur chargement fournisseurs:", err);
    } finally {
      setLoadingFournisseurs(false);
    }
  };


  const handleOk = () => {
    form
      .validateFields()
      .then((values) => {
        setSupplyName(values.delivererName || "");
        onConfirm(values.quantity, values.amount ?? 0, values.fournisseur_id);
        form.resetFields();
        onClose();
      })
      .catch(() => {});
  };

  return (
    <ConfigProvider theme={{ token: { colorPrimary: APP_COLOR, borderRadius: 8 } }}>
      <Modal
        open={isOpen}
        onCancel={() => { form.resetFields(); onClose(); }}
        onOk={handleOk}
        title={
          <div className="flex items-center gap-3 py-1">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${APP_COLOR}15` }}>
              <ShoppingCartOutlined style={{ color: APP_COLOR, fontSize: 18 }} />
            </div>
            <div>
              <p className="font-bold text-base text-gray-900 mb-0">Ajouter un Approvisionnement</p>
              {productName && <p className="text-xs text-gray-400 font-normal">{productName}</p>}
            </div>
          </div>
        }
        okText="Confirmer l'approvisionnement"
        cancelText="Annuler"
        okButtonProps={{
          style: { backgroundColor: APP_COLOR, borderColor: APP_COLOR },
          className: "font-semibold h-9",
        }}
        cancelButtonProps={{
          className: "!bg-gray-100 !text-gray-700 !border-none font-semibold h-9 hover:!bg-gray-200",
        }}
        width={520}
        destroyOnClose
      >
        <div className="pt-4 pb-2">
          <Form form={form} layout="vertical" requiredMark={false}>
            {/* Fournisseur */}
            <Form.Item
              name="fournisseur_id"
              label={
                <span className="font-semibold text-gray-700">
                  Fournisseur <span className="text-red-500">*</span>
                </span>
              }
              rules={[{ required: true, message: "Veuillez sélectionner un fournisseur" }]}
              className="!mb-2"
            >
              <Select
                placeholder="Sélectionner un fournisseur existant"
                showSearch
                optionFilterProp="children"
                loading={loadingFournisseurs}
                suffixIcon={<UserOutlined className="text-gray-400" />}
                dropdownRender={(menu) => (
                  <>
                    {menu}
                    <Divider style={{ margin: "8px 0" }} />
                    <Button
                      type="text"
                      block
                      icon={<PlusOutlined />}
                      style={{ color: APP_COLOR }}
                      className="font-medium"
                      onClick={() => {
                        setShowNewFournisseur(!showNewFournisseur);
                        const el = document.activeElement as HTMLElement;
                        if (el) el.blur();
                      }}
                    >
                      Nouveau fournisseur
                    </Button>
                  </>
                )}
              >
                {fournisseurs.map((f) => (
                  <Option key={f._id} value={f._id}>
                    <span className="font-medium">{f.nom}</span>
                    {f.ville && <span className="text-gray-400 text-xs ml-2">— {f.ville}</span>}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            {showNewFournisseur && (
              <InlineSupplierForm
                appColor={APP_COLOR}
                onCancel={() => setShowNewFournisseur(false)}
                onSuccess={async (newId) => {
                  await fetchFournisseurs();
                  form.setFieldsValue({ supplierId: newId });
                  setShowNewFournisseur(false);
                }}
              />
            )}

            {/* Livreur / Responsable */}
            <Form.Item
              name="delivererName"
              label={
                <span className="font-semibold text-gray-700">
                  Nom du livreur / responsable <span className="text-gray-400 text-xs font-normal">(optionnel)</span>
                </span>
              }
            >
              <Input
                placeholder="Ex: Jean Michel"
                value={supplyName}
                onChange={(e) => setSupplyName(e.target.value)}
                prefix={<UserOutlined className="text-gray-400" />}
              />
            </Form.Item>

            <div className="grid grid-cols-2 gap-4">
              <Form.Item
                name="quantity"
                label={
                  <span className="font-semibold text-gray-700">
                    Quantité <span className="text-red-500">*</span>
                  </span>
                }
                rules={[{ required: true, message: "Requis" }, { type: "number", min: 1, message: "Min 1" }]}
              >
                <InputNumber
                  min={1}
                  placeholder="0"
                  className="w-full"
                  style={{ width: "100%" }}
                />
              </Form.Item>

              <Form.Item
                name="amount"
                label={
                  <span className="font-semibold text-gray-700">
                    Montant <span className="text-gray-400 text-xs font-normal">(optionnel)</span>
                  </span>
                }
              >
                <InputNumber
                  min={0}
                  placeholder="0"
                  className="w-full"
                  style={{ width: "100%" }}
                  formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, " ")}
                  parser={(value) => value!.replace(/\s?/g, "") as any}
                />
              </Form.Item>
            </div>

            <Form.Item
              name="note"
              label={
                <span className="font-semibold text-gray-700">
                  Note <span className="text-gray-400 text-xs font-normal">(optionnel)</span>
                </span>
              }
            >
              <Input.TextArea rows={2} placeholder="Remarques ou informations supplémentaires..." />
            </Form.Item>
          </Form>
        </div>
      </Modal>
    </ConfigProvider>
  );
};

export default SupplyModal;
