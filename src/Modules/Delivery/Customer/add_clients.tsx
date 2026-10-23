import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Form, Input, InputNumber, Button, Upload, message } from 'antd';
import { UserOutlined, MailOutlined, EnvironmentOutlined, PlusOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { getUrlServer } from './../../../configServer';
import PageTitle from '../../../Components/PageTitle';
import cameroonFlag from './../../../Modules/Delivery/images/cameroun.png';

interface AddClientProps {
  onSubmit?: (clientData: ClientFormData) => void;
  onCancel: () => void;
}

interface ClientFormData {
  fullName: string;
  email: string;
  city: string;
  district: string;
  phoneNumber: string;
  profilePicture?: File;
  detteOuverture?: number;
}

const AddClientlivreur: React.FC<AddClientProps> = ({ onSubmit, onCancel }) => {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [profilePreview, setProfilePreview] = useState<string | null>(null);
  const [profileFile, setProfileFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedToken = localStorage.getItem('access_token');
    if (!storedToken) {
      message.error(t('admin.customers.add.validation.authRequired'));
      navigate('/login');
    } else {
      setToken(storedToken);
    }
  }, [navigate]);

  const handleProfileUpload = (file: File) => {
    setProfileFile(file);
    const reader = new FileReader();
    reader.onload = event => {
      if (event.target?.result) {
        setProfilePreview(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
    return false; // Empêche l'upload automatique d'Ant Design
  };

  const handleSubmit = async (values: ClientFormData) => {
    if (!token) {
      message.error(t('admin.customers.add.validation.tokenMissing'));
      return;
    }

    setIsSubmitting(true);

    const formPayload = new FormData();
    formPayload.append('nom', values.fullName);
    if (values.email) formPayload.append('email', values.email);
    if (values.city) formPayload.append('ville', values.city);
    if (values.district) formPayload.append('quartier', values.district);
    if (values.phoneNumber) formPayload.append('telephone', values.phoneNumber);
    if (values.detteOuverture) formPayload.append('dette_ouverture', String(values.detteOuverture));
    if (profileFile) formPayload.append('image', profileFile);

    try {
      const response = await fetch(`${getUrlServer()}/clients/create`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formPayload,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || t('admin.customers.add.validation.error'));
      }

      const data = await response.json();
      console.log('Client créé avec succès:', data);

      message.success(t('admin.customers.add.messages.success'));
      if (onSubmit) onSubmit(values);

      setTimeout(() => {
        navigate('/dashboard/clients');
      }, 2000);
    } catch (err) {
      console.error('Erreur:', err);
      message.error(err instanceof Error ? err.message : t('admin.customers.add.validation.error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const phonePrefix = (
    <div className="flex items-center gap-1">
      <img src={cameroonFlag} alt="Cameroun" className="h-4 w-6" />
      <span className="text-sm text-gray-600">+237</span>
    </div>
  );

  return (
    <>
      <PageTitle>{t('admin.customers.title')}</PageTitle>

      <div className="w-full min-h-screen p-6 bg-white">
        <div className="mb-6 flex items-center gap-2 text-sm font-medium animate-in fade-in slide-in-from-top-2 duration-300">
          <Link 
            to="/dashboard/clients" 
            className="text-blue-600 hover:text-blue-800 transition-all duration-200 flex items-center gap-2 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 rounded-lg shadow-sm border border-blue-100/50"
          >
            <ArrowLeftOutlined className="text-xs" />
            {t('admin.customers.title')}
          </Link>
          <span className="text-blue-300 font-bold px-1">{'>'}</span>
          <span className="text-gray-600 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-lg shadow-sm">
            {t('admin.customers.add.breadcrumb')}
          </span>
        </div>

        <h1 className="text-2xl font-semibold mb-6">{t('admin.customers.add.title')}</h1>

        {/* Photo de profil */}
        <div className="mb-6">
          <h2 className="text-base font-medium mb-3">{t('admin.customers.add.profileSection')}</h2>
          <div className="border border-gray-200 rounded p-4 flex items-center justify-center">
            <Upload
              showUploadList={false}
              beforeUpload={handleProfileUpload}
              accept="image/*"
            >
              {profilePreview ? (
                <div className="flex flex-col items-center cursor-pointer">
                  <img
                    src={profilePreview}
                    alt="Profil"
                    className="w-24 h-24 rounded-full object-cover mb-2"
                  />
                  <span className="text-[#0F172A] text-sm font-bold">{t('admin.customers.add.changePhoto')}</span>
                </div>
              ) : (
                <div className="flex flex-col items-center text-gray-400 cursor-pointer">
                  <PlusOutlined className="text-xl mb-1" />
                  <span>{t('admin.customers.add.uploadPrompt')}</span>
                </div>
              )}
            </Upload>
          </div>
        </div>

        {/* Formulaire Ant Design */}
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          requiredMark={false}
        >
          {/* Nom complet — OBLIGATOIRE */}
          <Form.Item
            label={<span className="font-medium">{t('admin.customers.add.fullName')} <span className="text-red-500">*</span></span>}
            name="fullName"
            rules={[{ required: true, message: t('admin.customers.add.validation.nameRequired') }]}
          >
            <Input
              prefix={<UserOutlined className="text-gray-400" />}
              placeholder={t('admin.customers.add.placeholders.fullName')}
              className="rounded"
            />
          </Form.Item>

          {/* Email — facultatif */}
          <Form.Item
            label={<span className="font-medium">{t('admin.customers.add.email')}</span>}
            name="email"
            rules={[{ type: 'email', message: t('admin.customers.add.validation.invalidEmail') }]}
          >
            <Input
              prefix={<MailOutlined className="text-gray-400" />}
              placeholder={t('admin.customers.add.placeholders.email')}
              className="rounded"
            />
          </Form.Item>

          {/* Téléphone — facultatif */}
          <Form.Item
            label={<span className="font-medium">{t('admin.customers.add.phone')}</span>}
            name="phoneNumber"
            rules={[
              {
                pattern: /^6\d{8}$/,
                message: t('admin.customers.add.validation.phonePattern'),
              },
            ]}
            normalize={(value: string) => value.replace(/\D/g, '').slice(0, 9)}
          >
            <Input
              addonBefore={phonePrefix}
              placeholder="699 741 852"
              maxLength={9}
              className="rounded"
            />
          </Form.Item>

          {/* Ville & Quartier — facultatifs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Form.Item
              label={<span className="font-medium">{t('admin.customers.add.city')}</span>}
              name="city"
            >
              <Input
                prefix={<EnvironmentOutlined className="text-gray-400" />}
                placeholder={t('admin.customers.add.placeholders.city')}
                className="rounded"
              />
            </Form.Item>

            <Form.Item
              label={<span className="font-medium">{t('admin.customers.add.district')}</span>}
              name="district"
            >
              <Input
                prefix={<EnvironmentOutlined className="text-gray-400" />}
                placeholder={t('admin.customers.add.placeholders.district')}
                className="rounded"
              />
            </Form.Item>
          </div>

          {/* Dette d'avant Lumistock (cahier de crédit) — facultative */}
          <Form.Item
            label={<span className="font-medium">Dette d'avant Lumistock</span>}
            name="detteOuverture"
            extra="Facultatif · ce que le client devait déjà. Saisie une seule fois, elle sera soldée par ses règlements."
          >
            <InputNumber<number>
              className="w-full"
              min={0}
              placeholder="0"
              formatter={(v) => `${v ?? ''}`.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}
              parser={(v) => Number((v || '').replace(/\s|CFA/g, ''))}
              addonAfter="CFA"
            />
          </Form.Item>

          {/* Boutons */}
          <Form.Item className="mb-0">
            <div className="flex justify-end gap-2">
              <Button
                onClick={onCancel}
                disabled={isSubmitting}
                className="px-6 border-gray-300 text-gray-700"
              >
                {t('admin.customers.add.cancel')}
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={isSubmitting}
                className="px-6 bg-[#0F172A] hover:bg-[#1E293B] border-none font-bold rounded-lg shadow-md"
              >
                {isSubmitting ? t('admin.customers.modals.edit.submitting') : t('admin.customers.add.save')}
              </Button>
            </div>
          </Form.Item>
        </Form>
      </div>
    </>
  );
};

export default AddClientlivreur;