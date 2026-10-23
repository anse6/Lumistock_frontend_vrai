import React, { useEffect, useMemo, useState } from 'react';
import dayjs, { type Dayjs } from 'dayjs';
import {
  Alert,
  App as AntdApp,
  Button,
  Card,
  ConfigProvider,
  DatePicker,
  Descriptions,
  Divider,
  Form,
  type FormInstance,
  Input,
  Modal,
  Select,
  Skeleton,
  Tabs,
  Tag,
  Typography,
} from 'antd';
import {
  CalendarOutlined,
  CheckCircleOutlined,
  EditOutlined,
  KeyOutlined,
  LockOutlined,
  MailOutlined,
  PhoneOutlined,
  SaveOutlined,
  SafetyCertificateOutlined,
  UserOutlined,
} from '@ant-design/icons';
import PageTitle from '../../PageTitle';
import AvatarWithPopover from '../users.tsx/components/AvatarWithPopover';
import StatusToggle from '../users.tsx/components/StatusToggle';
import { getUrlServer } from '../../../configServer';
import { enregistrerTokens } from '../../../Modules/Authentification/services/session';
import DeuxFacteurs from "../../Securite/DeuxFacteurs";

const { Title, Text } = Typography;
const PURPLE_900 = '#581c87';

interface UserRecord {
  _id: string;
  name: string;
  first_name: string;
  email: string;
  role: string;
  is_active?: boolean;
  telephone?: string;
  date_naissance?: string;
  sexe?: string;
  fonction?: string;
  created_at?: string | { $date?: string };
}

interface ProfileValues {
  date_naissance: Dayjs;
  telephone: string;
  sexe?: string;
  fonction?: string;
}

interface PasswordValues {
  old_password: string;
  new_password: string;
  confirm_password: string;
}

const getApiError = (data: any, fallback: string) => data?.message || data?.error || fallback;

const getLocalPhone = (telephone?: string) => {
  const digits = String(telephone || '').replace(/\D/g, '');
  return digits.startsWith('237') ? digits.slice(3, 12) : digits.slice(-9);
};

const formatPhone = (telephone?: string) => {
  const localPhone = getLocalPhone(telephone);
  if (!localPhone) return 'Non renseigné';
  return `+237 ${localPhone.slice(0, 1)} ${localPhone.slice(1, 3)} ${localPhone.slice(3, 5)} ${localPhone.slice(5, 7)} ${localPhone.slice(7, 9)}`;
};

const formatDate = (value?: string | { $date?: string }) => {
  const raw = typeof value === 'string' ? value : value?.$date;
  if (!raw) return 'Non renseignée';
  const date = dayjs(raw);
  return date.isValid() ? date.format('DD/MM/YYYY') : 'Non renseignée';
};

const getRoleLabel = (role?: string) => {
  const roles: Record<string, string> = {
    staff: 'Staff',
    admin: 'Administrateur',
    manager: 'Manager',
    gerant: 'Gérant',
    livreur: 'Gérant',
  };
  return roles[role || ''] || role || 'Utilisateur';
};

const isProfileComplete = (user?: UserRecord | null) => Boolean(user?.date_naissance && user?.telephone);

const StaffProfile: React.FC = () => {
  const { message } = AntdApp.useApp();
  const [user, setUser] = useState<UserRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [completionOpen, setCompletionOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [profileForm] = Form.useForm<ProfileValues>();
  const [completionForm] = Form.useForm<ProfileValues>();
  const [passwordForm] = Form.useForm<PasswordValues>();

  const fullName = useMemo(() => `${user?.first_name || ''} ${user?.name || ''}`.trim() || 'Administrateur', [user]);

  const applyUserToForms = (nextUser: UserRecord) => {
    const values = {
      date_naissance: nextUser.date_naissance ? dayjs(nextUser.date_naissance) : undefined,
      telephone: getLocalPhone(nextUser.telephone),
      sexe: nextUser.sexe || undefined,
      fonction: nextUser.fonction || undefined,
    } as ProfileValues;
    profileForm.setFieldsValue(values);
    completionForm.setFieldsValue(values);
  };

  const fetchUser = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      if (!token) throw new Error('Session non trouvée. Veuillez vous reconnecter.');
      const response = await fetch(`${getUrlServer()}/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(getApiError(data, 'Impossible de charger votre profil.'));
      setUser(data);
      applyUserToForms(data);
      setCompletionOpen(!isProfileComplete(data));
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Impossible de charger votre profil.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const buildProfilePayload = (values: ProfileValues) => {
    const phone = String(values.telephone || '').replace(/\D/g, '');
    return {
      date_naissance: values.date_naissance.format('YYYY-MM-DD'),
      telephone: `+237${phone}`,
      sexe: values.sexe || '',
      fonction: values.fonction?.trim() || '',
    };
  };

  const saveProfile = async (values: ProfileValues, fromCompletion = false) => {
    if (!user?._id) return;
    setProfileLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${getUrlServer()}/users/${user._id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(buildProfilePayload(values)),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(getApiError(data, 'Impossible de mettre à jour votre profil.'));

      const payload = buildProfilePayload(values);
      const nextUser = { ...user, ...payload };
      setUser(nextUser);
      applyUserToForms(nextUser);
      setCompletionOpen(false);
      message.success(fromCompletion ? 'Informations personnelles complétées avec succès.' : data?.message || 'Informations personnelles enregistrées avec succès.');
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Impossible de mettre à jour votre profil.');
    } finally {
      setProfileLoading(false);
    }
  };

  const changePassword = async (values: PasswordValues) => {
    if (values.new_password !== values.confirm_password) {
      passwordForm.setFields([{ name: 'confirm_password', errors: ['Les mots de passe ne correspondent pas.'] }]);
      return;
    }
    setPasswordLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${getUrlServer()}/auth/change_password`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(getApiError(data, 'Impossible de modifier le mot de passe.'));
      // Les autres sessions sont fermées ; celle-ci reçoit de nouveaux tokens.
      enregistrerTokens(data);
      passwordForm.resetFields();
      message.success(data?.message || 'Mot de passe modifié avec succès.');
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Impossible de modifier le mot de passe.');
    } finally {
      setPasswordLoading(false);
    }
  };

  const phoneRules = [
    { required: true, message: 'Le numéro de téléphone est obligatoire.' },
    { pattern: /^6\d{8}$/, message: 'Entrez un numéro camerounais de 9 chiffres commençant par 6.' },
  ];

  const profileFormContent = (form: FormInstance<ProfileValues>, completion = false) => (
    <Form form={form} layout="vertical" requiredMark={false} onFinish={(values) => saveProfile(values, completion)}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Form.Item name="date_naissance" label="Date de naissance" rules={[{ required: true, message: 'La date de naissance est obligatoire.' }]}>
          <DatePicker className="h-11 w-full !rounded-lg" format="DD/MM/YYYY" placeholder="JJ/MM/AAAA" disabledDate={(date) => date.isAfter(dayjs(), 'day')} suffixIcon={<CalendarOutlined />} />
        </Form.Item>
        <Form.Item name="telephone" label="Numéro de téléphone" rules={phoneRules}>
          <Input addonBefore={<span className="inline-flex items-center gap-1 whitespace-nowrap font-semibold text-slate-700">🇨🇲 +237</span>} maxLength={9} inputMode="numeric" placeholder="6 95 68 34 85" className="h-11 !rounded-lg" onChange={(event) => form.setFieldValue('telephone', event.target.value.replace(/\D/g, '').slice(0, 9))} />
        </Form.Item>
        <Form.Item name="sexe" label="Sexe (facultatif)">
          <Select className="h-11" placeholder="Sélectionner" options={[{ value: 'Homme', label: 'Homme' }, { value: 'Femme', label: 'Femme' }]} />
        </Form.Item>
        <Form.Item name="fonction" label="Fonction (facultatif)">
          <Input prefix={<UserOutlined className="text-slate-400" />} placeholder="Ex. Administrateur" className="h-11 !rounded-lg" />
        </Form.Item>
      </div>
      <div className="mt-3 flex justify-end border-t border-slate-100 pt-5">
        <Button type="primary" htmlType="submit" loading={profileLoading} icon={<SaveOutlined />} className="h-11 !rounded-lg !bg-purple-900 !px-6 hover:!bg-purple-800">Enregistrer les informations</Button>
      </div>
    </Form>
  );

  if (loading) {
    return <><PageTitle>Paramètres</PageTitle><main className="min-h-screen bg-white px-4 py-6 md:px-8"><div className="mx-auto max-w-6xl"><Skeleton active paragraph={{ rows: 10 }} /></div></main></>;
  }

  if (!user) {
    return <><PageTitle>Paramètres</PageTitle><main className="min-h-screen bg-white px-4 py-6 md:px-8"><div className="mx-auto max-w-6xl"><Alert type="error" showIcon message="Profil indisponible" description="Impossible de récupérer les informations de votre compte." /></div></main></>;
  }

  const tabItems = [
    {
      key: 'profile',
      label: <span className="flex items-center gap-2"><UserOutlined /> Profil</span>,
      children: <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_330px]">
        <Card className="!rounded-2xl !border-slate-200 !shadow-sm" title={<div><Title level={4} className="!mb-1 !text-slate-900">Informations personnelles</Title><Text className="text-sm text-slate-500">Gardez vos coordonnées à jour pour sécuriser votre compte.</Text></div>}>
          {profileFormContent(profileForm)}
        </Card>
        <Card className="!rounded-2xl !border-slate-200 !shadow-sm" title={<span className="text-base font-semibold text-slate-900">Résumé du compte</span>}>
          <Descriptions column={1} size="small" colon={false} labelStyle={{ color: '#64748b', fontSize: 12 }} contentStyle={{ color: PURPLE_900, fontWeight: 600, fontSize: 13 }}>
            <Descriptions.Item label="E-mail"><span className="break-all">{user.email || 'Non renseigné'}</span></Descriptions.Item>
            <Descriptions.Item label="Rôle"><Tag className="!m-0 !rounded-full !border-purple-200 !bg-purple-50 !text-purple-900">{getRoleLabel(user.role)}</Tag></Descriptions.Item>
            <Descriptions.Item label="Téléphone">{formatPhone(user.telephone)}</Descriptions.Item>
            <Descriptions.Item label="Naissance">{formatDate(user.date_naissance)}</Descriptions.Item>
            <Descriptions.Item label="Compte créé le">{formatDate(user.created_at)}</Descriptions.Item>
          </Descriptions>
        </Card>
      </div>,
    },
    {
      key: 'security',
      label: <span className="flex items-center gap-2"><SafetyCertificateOutlined /> Sécurité</span>,
      children: <div className="flex max-w-2xl flex-col gap-5"><Card className="!rounded-2xl !border-slate-200 !shadow-sm" title={<div><Title level={4} className="!mb-1 !text-slate-900">Modifier le mot de passe</Title><Text className="text-sm text-slate-500">Au moins 8 caractères, avec au moins une lettre et un chiffre.</Text></div>}>
        <Form form={passwordForm} layout="vertical" requiredMark={false} onFinish={changePassword}>
          <Form.Item name="old_password" label="Mot de passe actuel" rules={[{ required: true, message: 'Entrez votre mot de passe actuel.' }]}><Input.Password prefix={<LockOutlined className="text-slate-400" />} className="h-11 !rounded-lg" /></Form.Item>
          <Form.Item name="new_password" label="Nouveau mot de passe" rules={[{ required: true, message: 'Entrez un nouveau mot de passe.' }, { pattern: /^(?=.*[A-Za-zÀ-ÿ])(?=.*\d).{8,128}$/, message: 'Au moins 8 caractères, dont une lettre et un chiffre.' }]}><Input.Password prefix={<KeyOutlined className="text-slate-400" />} className="h-11 !rounded-lg" /></Form.Item>
          <Form.Item name="confirm_password" label="Confirmer le nouveau mot de passe" rules={[{ required: true, message: 'Confirmez le nouveau mot de passe.' }]}><Input.Password prefix={<CheckCircleOutlined className="text-slate-400" />} className="h-11 !rounded-lg" /></Form.Item>
          <Button type="primary" htmlType="submit" loading={passwordLoading} icon={<SaveOutlined />} className="h-11 !rounded-lg !bg-purple-900 !px-6 hover:!bg-purple-800">Modifier le mot de passe</Button>
        </Form>
      </Card><DeuxFacteurs /></div>,
    },
  ];

  return (
    <ConfigProvider theme={{ token: { colorPrimary: PURPLE_900, borderRadius: 10 } }}>
      <>
      <PageTitle>Paramètres</PageTitle>
      <main className="min-h-screen bg-white px-4 py-6 md:px-8 md:py-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-7 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div><Title level={2} className="!mb-1 !text-2xl !font-bold !text-slate-900">Paramètres du compte</Title><Text className="text-sm text-slate-500">Gérez vos informations personnelles et la sécurité de votre accès.</Text></div>
            <StatusToggle userId={user._id} initialStatus={Boolean(user.is_active)} onStatusChange={(isActive) => setUser((current) => current ? { ...current, is_active: isActive } : current)} />
          </div>

          <Card className="mb-6 !rounded-2xl !border-purple-100 !bg-gradient-to-r !from-purple-50 !to-white !shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <AvatarWithPopover name={fullName} email={user.email || '—'} size={72} />
              <div className="min-w-0"><Title level={3} className="!mb-1 !text-slate-900">{fullName}</Title><div className="flex flex-wrap items-center gap-2"><Tag className="!m-0 !rounded-full !border-purple-200 !bg-white !text-purple-900">{getRoleLabel(user.role)}</Tag>{user.fonction && <Text className="text-sm text-slate-500">{user.fonction}</Text>}</div></div>
              <div className="sm:ml-auto"><Button icon={<EditOutlined />} onClick={() => { setActiveTab('profile'); window.setTimeout(() => profileForm.scrollToField('date_naissance'), 0); }} className="!rounded-lg !border-purple-200 !text-purple-900 hover:!border-purple-900 hover:!text-purple-900">Modifier mes informations</Button></div>
            </div>
            <Divider className="!my-5 !border-purple-100" />
            <div className="grid grid-cols-1 gap-3 text-sm text-slate-600 sm:grid-cols-3"><div className="flex items-center gap-2"><MailOutlined className="text-purple-800" /><span className="truncate">{user.email || 'E-mail non renseigné'}</span></div><div className="flex items-center gap-2"><PhoneOutlined className="text-purple-800" /><span>{formatPhone(user.telephone)}</span></div><div className="flex items-center gap-2"><CalendarOutlined className="text-purple-800" /><span>{formatDate(user.date_naissance)}</span></div></div>
          </Card>

          <Card className="!rounded-2xl !border-slate-200 !shadow-sm" styles={{ body: { padding: '0 24px 28px' } }}><Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} size="large" /></Card>
        </div>
      </main>

      <Modal open={completionOpen} title={<div><div className="text-lg font-bold text-slate-900">Complétez vos informations</div><div className="mt-1 text-sm font-normal text-slate-500">Ces informations sont nécessaires pour finaliser votre profil administrateur.</div></div>} closable={false} maskClosable={false} keyboard={false} footer={null} width={620}>
        <div className="mb-5 mt-5 rounded-xl border border-purple-100 bg-purple-50 p-4"><div className="flex gap-3"><SafetyCertificateOutlined className="mt-0.5 text-xl text-purple-900" /><Text className="text-sm text-purple-950">Renseignez au minimum votre date de naissance et votre numéro de téléphone camerounais.</Text></div></div>
        {profileFormContent(completionForm, true)}
      </Modal>
      </>
    </ConfigProvider>
  );
};

export default StaffProfile;
