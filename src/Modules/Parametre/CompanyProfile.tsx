import React, { useEffect, useState } from 'react';
import {
  Card,
  Descriptions,
  Avatar,
  Button,
  Tag,
  Typography,
  Spin,
  Modal,
  Form,
  Input,
  message,
  Space,
  Divider,
  Switch
} from 'antd';
import {
  User,
  ShieldCheck,
  Mail,
  Calendar,
  Lock,
  ArrowLeft,
  Briefcase,
  Globe,
  Scan
} from 'lucide-react';
import { getUrlServer } from './../../configServer';
import PageTitle from '../../Components/PageTitle';
import { useTranslation } from 'react-i18next';
import { LANGUES, langueDe } from "../../langues";
import { changerLangue } from "../../i18n";
import { enregistrerTokens } from '../Authentification/services/session';
import DeuxFacteurs from "../../Components/Securite/DeuxFacteurs";

const { Title, Text } = Typography;

interface UserInfo {
  status: string;
  nom: string;
  prenom: string;
  email: string;
  role: string;
  creeLe: string;
  isActive: boolean;
  barcodeMode: boolean;
}

interface ApiResponse {
  _id: string;
  name: string;
  first_name: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at: {
    $date: string;
  };
  barcode_mode: boolean;
}

const UserProfile: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm] = Form.useForm();
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (!token) return;

        const response = await fetch(`${getUrlServer()}/users/me`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) throw new Error(`Erreur: ${response.status}`);

        const data: ApiResponse = await response.json();

        setUserInfo({
          status: data.is_active ? t('profile.statusActive') : t('profile.statusInactive'),
          nom: data.name,
          prenom: data.first_name,
          email: data.email,
          role: data.role,
          isActive: data.is_active,
          creeLe: new Date(data.created_at.$date).toLocaleDateString('fr-FR', {
            day: 'numeric', month: 'long', year: 'numeric'
          }),
          barcodeMode: data.barcode_mode || false
        });

        const storedLogo = localStorage.getItem("logo_magasin");
        if (storedLogo) {
          setLogoUrl(storedLogo.startsWith("http") ? storedLogo : `${getUrlServer()}/uploads/images/${storedLogo}`);
        }
      } catch (err) {
        console.error(err);
        message.error(t('profile.errorLoad'));
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [t]);

  const handlePasswordChange = async (values: any) => {
    setPasswordLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${getUrlServer()}/auth/change_password`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(values)
      });

      const res = await response.json().catch(() => ({}));
      if (response.ok) {
        // Les autres sessions sont fermées ; celle-ci reçoit de nouveaux tokens.
        enregistrerTokens(res);
        message.success(t('profile.passwordSuccess'));
        setShowPasswordModal(false);
        passwordForm.resetFields();
      } else {
        message.error(res.error || res.message || t('profile.errorValidation'));
      }
    } catch {
      message.error(t('profile.errorConnection'));
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleToggleBarcodeMode = async (checked: boolean) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${getUrlServer()}/users/settings/barcode`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ barcode_mode: checked })
      });

      if (response.ok) {
        setUserInfo(prev => prev ? { ...prev, barcodeMode: checked } : null);
        message.success(t('admin.parameters.customization.success'));
      } else {
        message.error(t('profile.errorValidation'));
      }
    } catch {
      message.error(t('profile.errorConnection'));
    }
  };

  const getRoleDisplayName = (role: string) => {
    if (!role) return '';
    const r = role.toLowerCase();
    return t(`common.roles.${r}`, { defaultValue: role });
  };

  if (loading) return <div className="flex justify-center items-center h-screen"><Spin size="large" /></div>;

  return (
    <>
      <PageTitle>{t('profile.pageTitle')}</PageTitle>
      <div className="p-4 md:p-8 bg-white min-h-screen">
        <div className="w-full">
          <div className="mb-8 flex items-center justify-between">
            <Button icon={<ArrowLeft size={16} />} onClick={() => window.history.back()}>{t('profile.back')}</Button>
          </div>

          <Card className="shadow-sm border-none mb-6">
            <div className="flex flex-col md:flex-row items-center gap-6 p-2">
              <Avatar
                size={90}
                src={logoUrl}
                className="shadow-md border-2 border-white ring-2 ring-indigo-50"
                icon={<User size={40} />}
              />
              <div className="text-center md:text-left flex-1">
                <Title level={2} className="!mb-1">
                  {userInfo?.prenom.toUpperCase()} {userInfo?.nom.toUpperCase()}
                </Title>
                <Space direction="vertical" size={2}>
                  <Text type="secondary" className="font-medium flex items-center gap-2">
                    <Briefcase size={14} className="text-indigo-400" />
                    {getRoleDisplayName(userInfo?.role || '')}
                  </Text>
                  <Tag color={userInfo?.status === t('profile.statusActive') ? "green" : "red"} className="mt-2">
                    {t('profile.accountLabel')} {userInfo?.status}
                  </Tag>
                </Space>
              </div>
              <Button
                type="primary"
                shape="round"
                icon={<Lock size={16} />}
                onClick={() => setShowPasswordModal(true)}
              >
                {t('profile.securityBtn')}
              </Button>
            </div>
          </Card>

          <div className="mb-6">
            <DeuxFacteurs />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <Card className="shadow-sm border-none h-full" title={<span className="flex items-center gap-2"><Globe size={18} className="text-indigo-500" /> {t('profile.language')}</span>}>
              <div className="flex flex-col gap-4">
                <Text type="secondary" className="text-sm">
                  {t('profile.languageDesc')}
                </Text>
                <div className="flex flex-wrap gap-2">
                  {LANGUES.map((l) => (
                    <button
                      key={l.code}
                      type="button"
                      lang={l.code}
                      onClick={() => changerLangue(l.code)}
                      className={`cursor-pointer transition-all duration-300 hover:scale-105 px-4 py-2 rounded-xl flex items-center gap-2 border ${langueDe(i18n.language).code === l.code ? 'bg-indigo-600 border-indigo-600 shadow-lg text-white' : 'bg-white border-gray-100 opacity-60 grayscale hover:opacity-100 hover:grayscale-0'}`}
                    >
                      {l.drapeau ? (
                        <img src={`https://flagcdn.com/${l.drapeau}.svg`} width="20" alt="" className="rounded-sm" />
                      ) : (
                        <span aria-hidden className="flex h-[15px] w-5 items-center justify-center rounded-sm bg-emerald-700 text-[10px] text-white">ع</span>
                      )}
                      <span className="font-bold tracking-tight text-[11px]">{l.nom}</span>
                    </button>
                  ))}
                </div>
              </div>
            </Card>

            <Card className="shadow-sm border-none h-full" title={<span className="flex items-center gap-2"><Scan size={18} className="text-indigo-500" /> {t('profile.barcodeMode')}</span>}>
              <div className="flex flex-col gap-4">
                <Text type="secondary" className="text-sm">
                  {t('profile.barcodeModeDesc')}
                </Text>
                <div className="flex items-center justify-between p-3 bg-indigo-50 rounded-xl border border-indigo-100 mb-2">
                  <Text strong className="text-indigo-900">{t('profile.barcodeMode')}</Text>
                  <Switch
                    checked={userInfo?.barcodeMode}
                    onChange={handleToggleBarcodeMode}
                    className="bg-gray-200"
                  />
                </div>
                <div className="flex items-center justify-between p-3 bg-amber-50 rounded-xl border border-amber-100">
                  <Text strong className="text-amber-900">{t('admin.parameters.customization.showOldDebt')}</Text>
                  <Switch
                    checked={localStorage.getItem('show_old_debt') !== 'false'}
                    onChange={(checked) => {
                      localStorage.setItem('show_old_debt', checked ? 'true' : 'false');
                      window.dispatchEvent(new Event('oldDebtSettingChange'));
                      message.success(t('admin.parameters.customization.success'));
                      setUserInfo(prev => prev ? { ...prev } : null);
                    }}
                    className="bg-gray-200"
                  />
                </div>
              </div>
            </Card>
          </div>

          <Card className="shadow-sm border-none" title={<span className="flex items-center gap-2"><User size={18} className="text-indigo-500" /> {t('profile.accountDetails')}</span>}>
            <Descriptions column={{ xxl: 2, xl: 2, lg: 2, md: 1, sm: 1, xs: 1 }} bordered>
              <Descriptions.Item label={t('profile.firstName')}>{userInfo?.prenom}</Descriptions.Item>
              <Descriptions.Item label={t('profile.lastName')}>{userInfo?.nom}</Descriptions.Item>
              <Descriptions.Item label={t('profile.emailLabel')} span={2}>
                <Space><Mail size={14} className="text-gray-400" /> {userInfo?.email}</Space>
              </Descriptions.Item>
              <Descriptions.Item label={t('profile.assignedRole')}>{getRoleDisplayName(userInfo?.role || '')}</Descriptions.Item>
              <Descriptions.Item label={t('profile.registrationDate')}>
                <Space><Calendar size={14} className="text-gray-400" /> {userInfo?.creeLe}</Space>
              </Descriptions.Item>
            </Descriptions>

            <Divider />

            <div className="p-4 bg-indigo-50 rounded-xl">
              <Text type="secondary" className="text-xs italic">
                {t('profile.errorInfoNote')}
              </Text>
            </div>
          </Card>
        </div>

        <Modal
          title={t('profile.passwordModalTitle')}
          open={showPasswordModal}
          onCancel={() => setShowPasswordModal(false)}
          footer={null}
          centered
        >
          <Form
            form={passwordForm}
            layout="vertical"
            onFinish={handlePasswordChange}
            className="mt-6"
          >
            <Form.Item
              label={t('profile.oldPassword')}
              name="old_password"
              rules={[{ required: true, message: t('profile.requiredField') }]}
            >
              <Input.Password prefix={<Lock size={14} className="text-gray-400" />} placeholder="••••••••" />
            </Form.Item>

            <Divider plain className="!my-4 text-xs">{t('profile.newCredentials')}</Divider>

            <Form.Item
              label={t('profile.newPassword')}
              name="new_password"
              rules={[
                { required: true, message: t('profile.newPasswordRequired') },
                { pattern: /^(?=.*[A-Za-zÀ-ÿ])(?=.*\d).{8,128}$/, message: t('profile.passwordMinLength') }
              ]}
            >
              <Input.Password prefix={<ShieldCheck size={14} className="text-gray-400" />} placeholder={t('profile.passwordMinPlaceholder')} />
            </Form.Item>

            <Form.Item
              label={t('profile.confirmPassword')}
              name="confirm_password"
              dependencies={['new_password']}
              rules={[
                { required: true, message: t('profile.confirmationRequired') },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('new_password') === value) return Promise.resolve();
                    return Promise.reject(new Error(t('profile.passwordMismatch')));
                  },
                }),
              ]}
            >
              <Input.Password prefix={<ShieldCheck size={14} className="text-gray-400" />} placeholder={t('profile.confirmPlaceholder')} />
            </Form.Item>

            <Form.Item className="mb-0 text-right mt-8">
              <Space>
                <Button onClick={() => setShowPasswordModal(false)}>{t('profile.cancelBtn')}</Button>
                <Button type="primary" htmlType="submit" loading={passwordLoading} className="px-8">
                  {t('profile.submitBtn')}
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </>
  );
};

export default UserProfile;
