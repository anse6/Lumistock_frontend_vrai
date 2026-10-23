import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Table, 
  Tag, 
  Space, 
  Button, 
  Input, 
  Modal, 
  Form, 
  Typography, 
  App, 
  Dropdown,
  Grid,
  DatePicker,
  Switch,
  Descriptions
} from 'antd';
import { 
  SearchOutlined, 
  EditOutlined, 
  EyeOutlined,
  DeleteOutlined, 
  MailOutlined,
  UserOutlined,
  MoreOutlined,
  StopOutlined,
  CheckCircleOutlined,
  PhoneOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import type { MenuProps } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { getUrlServer } from './../../../configServer';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import AvatarWithPopover from './components/AvatarWithPopover';
import StatusToggle from './components/StatusToggle';
import UserFilters from './components/UserFilters';
import UserCards from './components/UserCards';

const { Title, Text } = Typography;

interface User {
  _id: string;
  name: string;
  first_name: string;
  email: string;
  role: string;
  is_active?: boolean;
  magasin_id?: string;
  magasin_nom?: string;
  nom_boutique?: string;
  barcode_mode?: boolean;
  sexe?: 'Homme' | 'Femme';
  date_naissance?: string;
  telephone?: string;
  fonction?: string;
  created_at?: string | { $date?: string };
  updated_at?: string | { $date?: string };
}

const roleDisplay = (role: string) => {
  const roles = {
    admin: { label: 'Administrateur', className: '!border-purple-200 !bg-purple-50 !text-purple-900' },
    manager: { label: 'Manager', className: '!border-blue-200 !bg-blue-50 !text-blue-800' },
    gerant: { label: 'Gérant', className: '!border-amber-200 !bg-amber-50 !text-amber-800' },
    livreur: { label: 'Gérant', className: '!border-amber-200 !bg-amber-50 !text-amber-800' },
    staff: { label: 'Staff', className: '!border-slate-200 !bg-slate-50 !text-slate-700' },
  } as const;
  return roles[role as keyof typeof roles] || { label: role, className: '!border-slate-200 !bg-slate-50 !text-slate-700' };
};

const getStoreLabel = (user: User) => user.magasin_nom || user.nom_boutique || (user.magasin_id ? `ID: ${user.magasin_id.slice(-6)}` : 'Plateforme');

const RecentStaffpapa: React.FC = () => {
  const { message } = App.useApp();
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.md;
  // Sous 1024 px, le tableau n'a pas la place : on affiche toujours les cartes.
  const petitEcran = !screens.lg;
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string | undefined>();
  const [statusFilter, setStatusFilter] = useState<'active' | 'inactive' | undefined>();
  const [storeFilter, setStoreFilter] = useState<string | undefined>();
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Modals state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userDetails, setUserDetails] = useState<User | null>(null);
  const [statusUserToConfirm, setStatusUserToConfirm] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isStatusChanging, setIsStatusChanging] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      if (!token) throw new Error('Non authentifié');

      const response = await fetch(`${getUrlServer()}/users/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data?.message || 'Impossible de charger les utilisateurs');
      setUsers(Array.isArray(data.users) ? data.users : []);
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Impossible de charger les utilisateurs');
    } finally {
      setLoading(false);
    }
  }, [message]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleDelete = async (user: User) => {
    try {
      setIsDeleting(true);
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${getUrlServer()}/users/${user._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.message || 'Erreur lors de la suppression');

      setUsers(prev => prev.filter(u => u._id !== user._id));
      setUserToDelete(null);
      message.success(data?.message || 'Utilisateur supprimé avec succès');
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Erreur lors de la suppression');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleStatusChange = async (user: User) => {
    const activating = user.is_active === false;
    const endpoint = activating ? 'activate-user' : 'deactivate-user';
    try {
      setIsStatusChanging(true);
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${getUrlServer()}/users/${endpoint}/${user._id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.message || 'Impossible de modifier le statut');
      setUsers((previous) => previous.map((item) => item._id === user._id ? { ...item, is_active: activating } : item));
      setStatusUserToConfirm(null);
      message.success(data?.message || (activating ? 'Utilisateur activé avec succès' : 'Utilisateur désactivé avec succès'));
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Impossible de modifier le statut');
    } finally {
      setIsStatusChanging(false);
    }
  };

  const confirmStatusChange = (user: User) => setStatusUserToConfirm(user);

  const handleEditSubmit = async (values: any) => {
    if (!selectedUser) return;
    const payload = {
      ...values,
      sexe: values.is_female ? 'Femme' : 'Homme',
      date_naissance: values.date_naissance?.format('YYYY-MM-DD'),
    };
    delete payload.is_female;
    try {
      setSubmitting(true);
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${getUrlServer()}/users/${selectedUser._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.message || 'Erreur lors de la mise à jour');

      setUsers(prev => prev.map(u => u._id === selectedUser._id ? { ...u, ...payload } : u));
      setIsEditModalOpen(false);
      message.success(data?.message || 'Utilisateur modifié avec succès');
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Erreur lors de la mise à jour');
    } finally {
      setSubmitting(false);
    }
  };

  const getActionMenuItems = (record: User): MenuProps['items'] => [
    {
      key: 'edit',
      label: 'Modifier',
      icon: <EditOutlined className="text-indigo-600" />,
      onClick: () => {
        setSelectedUser(record);
        form.setFieldsValue({
          ...record,
          is_female: record.sexe === 'Femme',
          date_naissance: record.date_naissance ? dayjs(record.date_naissance) : null,
        });
        setIsEditModalOpen(true);
      },
    },
    {
      key: 'status',
      label: record.is_active === false ? 'Activer' : 'Désactiver',
      icon: record.is_active === false ? <CheckCircleOutlined className="text-green-600" /> : <StopOutlined className="text-red-600" />,
      onClick: () => confirmStatusChange(record),
    },
    { type: 'divider' },
    {
      key: 'delete',
      label: 'Supprimer',
      danger: true,
      icon: <DeleteOutlined />,
      onClick: () => setUserToDelete(record),
    },
  ];

  const openEditModal = (record: User) => {
    setSelectedUser(record);
    form.setFieldsValue({
      ...record,
      is_female: record.sexe === 'Femme',
      date_naissance: record.date_naissance ? dayjs(record.date_naissance) : null,
    });
    setIsEditModalOpen(true);
  };

  const roleOptions = useMemo(() => Array.from(new Set(users.map((user) => user.role))).sort().map((role) => ({ value: role, label: roleDisplay(role).label })), [users]);
  const storeOptions = useMemo(() => Array.from(new Map(users.map((user) => [getStoreLabel(user), { value: getStoreLabel(user), label: getStoreLabel(user) }])).values()).sort((a, b) => a.label.localeCompare(b.label, 'fr')), [users]);

  const columns: ColumnsType<User> = [
    {
      title: 'Utilisateur',
      key: 'user',
      width: 300,
      render: (_: unknown, record: User) => (
        <div className="flex min-w-0 items-center gap-3">
          <AvatarWithPopover name={`${record.name || ''} ${record.first_name || ''}`.trim()} email={record.email} />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold capitalize text-slate-800" title={`${record.name} ${record.first_name}`}>
              {record.name} {record.first_name}
            </p>
            <p className="truncate text-xs text-slate-500" title={record.email}>{record.email}</p>
          </div>
        </div>
      ),
    },
    {
      title: 'Rôle',
      dataIndex: 'role',
      key: 'role',
      width: 140,
      render: (role: string) => {
        const display = roleDisplay(role);
        return <Tag className={`!m-0 !rounded-full !border !px-3 !py-0.5 !text-[11px] !font-semibold ${display.className}`}>{display.label}</Tag>;
      }
    },
    {
      title: 'Magasin',
      key: 'store',
      ellipsis: true,
      render: (_: unknown, record: User) => <Text className="text-sm text-slate-600">{getStoreLabel(record)}</Text>,
    },
    {
      title: 'Téléphone',
      dataIndex: 'telephone',
      key: 'telephone',
      width: 160,
      responsive: ['xl'],
      render: (telephone: string | undefined) => <Text className="whitespace-nowrap text-sm text-slate-600">{telephone || '—'}</Text>,
    },
    {
      title: 'Statut',
      key: 'status',
      width: 120,
      render: (_: unknown, record: User) => (
        <StatusToggle
          userId={record._id}
          initialStatus={record.is_active !== false}
          onStatusChange={(isActive) => setUsers((previous) => previous.map((user) => user._id === record._id ? { ...user, is_active: isActive } : user))}
        />
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      align: 'right' as const,
      render: (_: unknown, record: User) => (
        <Space size={2}>
          <Button
            type="text"
            icon={<EyeOutlined className="text-purple-800" />}
            onClick={() => setUserDetails(record)}
            title="Voir les détails"
            aria-label="Voir les détails"
            className="flex h-8 w-8 items-center justify-center rounded-lg hover:!bg-purple-50"
          />
          <Dropdown menu={{ items: getActionMenuItems(record) }} trigger={['click']} placement="bottomRight">
            <Button
              type="text"
              aria-label="Plus d'actions"
              icon={<MoreOutlined className="text-lg text-slate-500" />}
              className="flex h-8 w-8 items-center justify-center rounded-lg hover:!bg-purple-50"
            />
          </Dropdown>
        </Space>
      )
    }
  ];

  // Chiffres affichés en haut de la page (sur tous les utilisateurs, pas seulement le filtre).
  const resume = useMemo(() => {
    const role = (r: string) => users.filter((u) => (u.role === 'livreur' ? 'gerant' : u.role) === r).length;
    const actifs = users.filter((u) => u.is_active !== false).length;
    return [
      { libelle: 'Utilisateurs', valeur: users.length },
      { libelle: 'Actifs', valeur: actifs },
      { libelle: 'Inactifs', valeur: users.length - actifs },
      { libelle: 'Administrateurs', valeur: role('admin') },
      { libelle: 'Managers', valeur: role('manager') },
      { libelle: 'Gérants', valeur: role('gerant') },
    ];
  }, [users]);

  const filteredData = useMemo(() => users.filter((user) => {
    const search = searchTerm.trim().toLocaleLowerCase('fr');
    const matchesSearch = !search || [user.name, user.first_name, user.email, user.role, user.nom_boutique, user.magasin_nom]
      .some((value) => value?.toLocaleLowerCase('fr').includes(search));
    const matchesRole = !roleFilter || user.role === roleFilter;
    const matchesStatus = !statusFilter || (statusFilter === 'active' ? user.is_active !== false : user.is_active === false);
    const matchesStore = !storeFilter || getStoreLabel(user) === storeFilter;
    return matchesSearch && matchesRole && matchesStatus && matchesStore;
  }), [users, searchTerm, roleFilter, statusFilter, storeFilter]);

  const resetFilters = () => {
    setSearchTerm('');
    setRoleFilter(undefined);
    setStatusFilter(undefined);
    setStoreFilter(undefined);
    setCurrentPage(1);
  };
  const hasActiveFilters = Boolean(searchTerm || roleFilter || statusFilter || storeFilter);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, roleFilter, statusFilter, storeFilter]);

  return (
    <div className="mx-auto flex w-full min-w-0 max-w-[1600px] flex-col gap-4">
        {/* En-tête de page */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-purple-950">Utilisateurs</h1>
            <p className="mt-1 text-sm text-slate-500">Comptes des magasins : administrateurs, managers et gérants.</p>
          </div>
          <Link
            to="/superadmin/dashboard/recentansevernel/utilisateur"
            className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl !bg-purple-950 px-4 text-sm font-semibold !text-white shadow-sm transition-colors hover:!bg-purple-900"
          >
            <Plus size={18} /> Nouvel utilisateur
          </Link>
        </div>

        {/* Résumé */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3 lg:grid-cols-6">
          {resume.map((item) => (
            <div key={item.libelle} className="min-w-0 rounded-xl border border-purple-100/70 bg-white px-3 py-2.5 shadow-sm">
              <p className="truncate text-[11px] text-slate-500 sm:text-xs">{item.libelle}</p>
              <p className="text-lg font-bold text-purple-950 sm:text-xl">{loading ? '…' : item.valeur}</p>
            </div>
          ))}
        </div>

        <div className="min-w-0 rounded-2xl border border-purple-100/70 bg-white shadow-sm">
        <div className="flex flex-col gap-4 p-4 md:p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <Title level={5} className="!mb-0 shrink-0 whitespace-nowrap !text-slate-900">Liste des utilisateurs</Title>
            <Input
              allowClear
              value={searchTerm}
              placeholder="Rechercher (nom, email, magasin…)"
              prefix={<SearchOutlined className="text-purple-700" />}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="h-10 w-full min-w-0 md:w-80"
            />
          </div>
          <UserFilters
            roleOptions={roleOptions}
            storeOptions={storeOptions}
            roleFilter={roleFilter}
            storeFilter={storeFilter}
            statusFilter={statusFilter}
            setRoleFilter={setRoleFilter}
            setStoreFilter={setStoreFilter}
            setStatusFilter={setStatusFilter}
            onReset={resetFilters}
            hasActiveFilters={hasActiveFilters}
            resultCount={filteredData.length}
            viewMode={viewMode}
            setViewMode={setViewMode}
            showViewToggle={!petitEcran}
          />
        </div>

        <div className="min-w-0 overflow-hidden rounded-b-2xl border-t border-purple-100">
          {viewMode === 'table' && !petitEcran ? (
            <Table
              columns={columns}
              dataSource={filteredData}
              rowKey="_id"
              loading={loading}
              pagination={{
                pageSize: 10,
                className: "!px-4 !py-3",
                simple: isMobile,
                showSizeChanger: false,
                showTotal: (total) => `Total ${total} membres`
              }}
              className="staff-table"
              size="middle"
              tableLayout="fixed"
              locale={{ emptyText: 'Aucun utilisateur ne correspond aux filtres' }}
            />
          ) : (
            <UserCards
              users={filteredData}
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              itemsPerPage={itemsPerPage}
              onView={(user) => setUserDetails(user as User)}
              onEdit={(user) => openEditModal(user as User)}
              onStatusChange={(userId, isActive) => setUsers((previous) => previous.map((user) => user._id === userId ? { ...user, is_active: isActive } : user))}
              loading={loading}
            />
          )}
        </div>
        </div>
     

      {/* Edit Modal */}
      <Modal
        title={
          <Space className="pt-2">
            <EditOutlined className="text-purple-800" />
            <span>Modifier l'utilisateur</span>
          </Space>
        }
        open={isEditModalOpen}
        onCancel={() => setIsEditModalOpen(false)}
        footer={null}
        destroyOnHidden
        className="rounded-2xl"
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleEditSubmit}
          initialValues={selectedUser || {}}
          className="pt-4"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Form.Item 
              name="name" 
              label="Nom" 
              rules={[{ required: true, message: 'Requis' }]}
            >
              <Input prefix={<UserOutlined className="text-gray-300" />} className="rounded-lg h-10" />
            </Form.Item>
            <Form.Item 
              name="first_name" 
              label="Prénom" 
              rules={[{ required: true, message: 'Requis' }]}
            >
              <Input prefix={<UserOutlined className="text-gray-300" />} className="rounded-lg h-10" />
            </Form.Item>
          </div>
          
          <Form.Item 
            name="email" 
            label="Adresse Email" 
            rules={[{ required: true, type: 'email', message: 'Email valide requis' }]}
          >
            <Input prefix={<MailOutlined className="text-gray-300" />} className="rounded-lg h-10" />
          </Form.Item>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Form.Item name="is_female" label="Sexe" valuePropName="checked" extra="Homme à gauche · Femme à droite">
              <Switch checkedChildren="Femme" unCheckedChildren="Homme" className="!bg-purple-800" />
            </Form.Item>
            <Form.Item name="date_naissance" label="Date de naissance">
              <DatePicker format="DD/MM/YYYY" placeholder="Sélectionner une date" className="h-10 w-full" />
            </Form.Item>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Form.Item name="telephone" label="Téléphone personnel">
              <Input prefix={<PhoneOutlined className="text-gray-300" />} className="h-10 rounded-lg" />
            </Form.Item>
            <Form.Item name="fonction" label="Fonction">
              <Input placeholder="Ex. Directeur général" className="h-10 rounded-lg" />
            </Form.Item>
          </div>

          <div className="flex justify-end gap-3 mt-8 border-t pt-6">
            <Button onClick={() => setIsEditModalOpen(false)} className="rounded-lg h-10 px-6">Annuler</Button>
            <Button 
               type="primary" 
               htmlType="submit" 
               loading={submitting} 
               className="h-10 rounded-lg !bg-purple-800 px-8 hover:!bg-purple-900"
            >
              Enregistrer
            </Button>
          </div>
        </Form>
      </Modal>

      <Modal
        title="Détails de l’utilisateur"
        open={Boolean(userDetails)}
        onCancel={() => setUserDetails(null)}
        footer={<Button onClick={() => setUserDetails(null)} className="border-purple-200 text-purple-800 hover:!border-purple-800 hover:!text-purple-900">Fermer</Button>}
        width={680}
      >
        {userDetails && (
          <div className="pt-2">
            <div className="mb-6 flex items-center gap-3 rounded-xl bg-purple-50 p-4">
              <AvatarWithPopover name={`${userDetails.name} ${userDetails.first_name}`.trim()} email={userDetails.email} size={48} />
              <div className="min-w-0">
                <Text strong className="block !text-base !text-black">{userDetails.name} {userDetails.first_name}</Text>
                <Text type="secondary">{userDetails.email}</Text>
              </div>
            </div>
            <Descriptions column={{ xs: 1, sm: 2 }} size="small" labelStyle={{ color: '#475569', fontWeight: 600 }} contentStyle={{ color: '#111827' }}>
              <Descriptions.Item label="Rôle"><Tag className={`!m-0 !rounded-full !border !px-3 !py-0.5 !text-[11px] !font-semibold ${roleDisplay(userDetails.role).className}`}>{roleDisplay(userDetails.role).label}</Tag></Descriptions.Item>
              <Descriptions.Item label="Statut"><Tag color={userDetails.is_active !== false ? 'success' : 'error'} className="!m-0 !rounded-full">{userDetails.is_active !== false ? 'Actif' : 'Inactif'}</Tag></Descriptions.Item>
              <Descriptions.Item label="Magasin">{getStoreLabel(userDetails)}</Descriptions.Item>
              <Descriptions.Item label="Mode scan">{userDetails.barcode_mode ? 'Activé' : 'Désactivé'}</Descriptions.Item>
              <Descriptions.Item label="Sexe">{userDetails.sexe || '—'}</Descriptions.Item>
              <Descriptions.Item label="Date de naissance">{userDetails.date_naissance || '—'}</Descriptions.Item>
              <Descriptions.Item label="Téléphone">{userDetails.telephone || '—'}</Descriptions.Item>
              <Descriptions.Item label="Fonction">{userDetails.fonction || '—'}</Descriptions.Item>
              <Descriptions.Item label="Identifiant" span={2}><Text copyable className="text-xs">{userDetails._id}</Text></Descriptions.Item>
            </Descriptions>
          </div>
        )}
      </Modal>

      <Modal
        title={statusUserToConfirm?.is_active === false ? 'Activer cet utilisateur ?' : 'Désactiver cet utilisateur ?'}
        open={Boolean(statusUserToConfirm)}
        onCancel={() => setStatusUserToConfirm(null)}
        onOk={() => statusUserToConfirm && handleStatusChange(statusUserToConfirm)}
        confirmLoading={isStatusChanging}
        okText={statusUserToConfirm?.is_active === false ? 'Activer' : 'Désactiver'}
        cancelText="Annuler"
        okButtonProps={statusUserToConfirm?.is_active === false ? { className: '!bg-purple-800 hover:!bg-purple-900' } : { danger: true }}
      >
        <p className="py-3 text-slate-600">
          {statusUserToConfirm?.is_active === false
            ? 'Cet utilisateur pourra à nouveau se connecter au tableau de bord.'
            : 'Cet utilisateur ne pourra plus se connecter au tableau de bord.'}
        </p>
      </Modal>

      <Modal
        title="Supprimer cet utilisateur ?"
        open={Boolean(userToDelete)}
        onCancel={() => setUserToDelete(null)}
        onOk={() => userToDelete && handleDelete(userToDelete)}
        confirmLoading={isDeleting}
        okText="Supprimer"
        cancelText="Annuler"
        okButtonProps={{ danger: true }}
      >
        <p className="py-3 text-slate-600">
          Voulez-vous vraiment supprimer <strong>{userToDelete?.name} {userToDelete?.first_name}</strong> ? Cette action est irréversible.
        </p>
      </Modal>

    </div>
  );
};

export default RecentStaffpapa;
