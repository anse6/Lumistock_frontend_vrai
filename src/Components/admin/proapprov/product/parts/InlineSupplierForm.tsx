import React, { useState } from 'react';
import { Input, Button, Select, Form, App } from 'antd';
import axios from 'axios';
import { getUrlServer } from '../../../../../configServer';
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { Country } from 'country-state-city';

const { Option } = Select;

interface InlineSupplierFormProps {
  onCancel: () => void;
  onSuccess: (newSupplierId: string) => void;
  appColor?: string;
  isModalStyle?: boolean;
}

const InlineSupplierForm: React.FC<InlineSupplierFormProps> = ({
  onCancel,
  onSuccess,
  appColor = "#3b1558",
  isModalStyle = false
}) => {
  const [form] = Form.useForm();
  const { message: msg } = App.useApp();
  const [loading, setLoading] = useState(false);
  const countries = Country.getAllCountries();

  const handleFinish = async (values: any) => {
    // Validation du numéro de téléphone s'il est fourni
    if (values.telephone && !isValidPhoneNumber(values.telephone)) {
      msg.error("Le numéro de téléphone est invalide pour ce pays.");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("access_token");
      const res = await axios.post(
        `${getUrlServer()}/fournisseurs`,
        {
          nom: values.nom,
          pays: values.pays,
          ville: values.ville,
          telephone: values.telephone,
          email: values.email
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      const newId = res.data._id || res.data.id || res.data.fournisseur_id;
      msg.success("Fournisseur créé avec succès");
      form.resetFields();
      onSuccess(newId);
    } catch (err: any) {
      msg.error(err.response?.data?.error || err.response?.data?.message || "Erreur lors de la création du fournisseur");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={isModalStyle ? "" : `p-4 mb-4 rounded-xl border border-purple-100 animate-in fade-in zoom-in-95 duration-200`}
      style={isModalStyle ? {} : { backgroundColor: `${appColor}08` }}
    >
      {!isModalStyle && (
        <p className="text-sm font-bold mb-3" style={{ color: appColor }}>
          Nouveau fournisseur
        </p>
      )}
      
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        requiredMark={false}
        initialValues={{ pays: 'Cameroon' }}
        component={false}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-0">
          <Form.Item
            name="nom"
            label={<span className="font-semibold text-gray-700 text-xs">Nom du fournisseur <span className="text-red-500">*</span></span>}
            rules={[{ required: true, message: 'Requis' }]}
            className="!mb-3"
          >
            <Input placeholder="Nom de l'entreprise" size="middle" />
          </Form.Item>

          <Form.Item
            name="pays"
            label={<span className="font-semibold text-gray-700 text-xs">Pays <span className="text-red-500">*</span></span>}
            rules={[{ required: true, message: 'Requis' }]}
            className="!mb-3"
          >
            <Select
              showSearch
              placeholder="Sélectionner un pays"
              optionFilterProp="children"
              size="middle"
            >
              {countries.map((c) => (
                <Option key={c.isoCode} value={c.name}>
                  {c.flag} {c.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="ville"
            label={<span className="font-semibold text-gray-700 text-xs">Ville <span className="text-gray-400 font-normal">(optionnel)</span></span>}
            className="!mb-3"
          >
            <Input placeholder="Ville du siège" size="middle" />
          </Form.Item>

          <Form.Item
            name="telephone"
            label={<span className="font-semibold text-gray-700 text-xs">Téléphone <span className="text-gray-400 font-normal">(optionnel)</span></span>}
            className="!mb-3"
          >
            <div className="custom-phone-input">
              <PhoneInput
                defaultCountry="CM"
                international
                countryCallingCodeEditable={false}
                placeholder="Numéro de téléphone"
                className="ant-input css-dev-only-do-not-override ant-input-outlined p-0 px-3 flex items-center h-[32px] rounded-md border border-gray-300"
                value={form.getFieldValue('telephone')}
                onChange={(val) => form.setFieldsValue({ telephone: val })}
              />
            </div>
          </Form.Item>

          <Form.Item
            name="email"
            label={<span className="font-semibold text-gray-700 text-xs">Adresse Email <span className="text-gray-400 font-normal">(optionnel)</span></span>}
            rules={[
              { type: 'email', message: 'Email invalide' }
            ]}
            className="!mb-3 md:col-span-2"
          >
            <Input placeholder="contact@entreprise.com" size="middle" />
          </Form.Item>
        </div>

        <div className="flex justify-end gap-2 mt-2">
          <Button
            size="middle"
            className="!bg-gray-200 !text-gray-600 !border-none font-semibold hover:!bg-gray-300"
            onClick={(e) => { e.preventDefault(); onCancel(); }}
          >
            Annuler
          </Button>
          <Button
            size="middle"
            type="primary"
            loading={loading}
            style={{ backgroundColor: appColor }}
            className="font-semibold"
            onClick={(e) => {
              e.preventDefault();
              form.submit();
            }}
          >
            Ajouter
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default InlineSupplierForm;
