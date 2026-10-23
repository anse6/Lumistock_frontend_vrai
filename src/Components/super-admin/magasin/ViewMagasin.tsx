import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Alert,
  Button,
  Card,
  ConfigProvider,
  Descriptions,
  Divider,
  Empty,
  Modal,
  Space,
  Spin,
  Tag,
  Typography,
  message,
} from 'antd';
import {
  ArrowLeftOutlined,
  BankOutlined,
  CalendarOutlined,
  CopyOutlined,
  EditOutlined,
  EnvironmentOutlined,
  GlobalOutlined,
  IdcardOutlined,
  InboxOutlined,
  SyncOutlined,
  MailOutlined,
  PhoneOutlined,
  SafetyCertificateOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { getUrlServer } from './../../../configServer';
import { Store } from './types';
import AvatarWithPopover from '../users.tsx/components/AvatarWithPopover';
import StatusToggle from '../users.tsx/components/StatusToggle';

const { Title, Text } = Typography;

type StoreUser = Store['utilisateurs'][number] & {
  barcode_mode?: boolean;
  date_naissance?: string;
  sexe?: string;
  telephone?: string;
  updated_at?: string | { $date?: string };
};

const formatDate = (value?: Store['created_at'] | string) => {
  if (!value) return '—';
  const raw = typeof value === 'object' && '$date' in value ? value.$date : value;
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
};

const getUserName = (user: StoreUser) => `${user.first_name || ''} ${user.name || ''}`.trim() || 'Utilisateur';

const valueOrDash = (value?: React.ReactNode) => value || <span className="text-slate-400">Non renseigné</span>;

const SectionTitle: React.FC<{ icon: React.ReactNode; title: string; description?: string }> = ({ icon, title, description }) => (
  <div className="mb-6 flex items-start gap-3">
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-700">{icon}</div>
    <div>
      <Title level={4} className="!mb-0 !text-[17px] !font-bold !text-slate-900">{title}</Title>
      {description && <Text className="text-xs text-slate-500">{description}</Text>}
    </div>
  </div>
);

const DetailItem: React.FC<{ label: string; value?: React.ReactNode; className?: string }> = ({ label, value, className = '' }) => (
  <div className={className}>
    <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">{label}</p>
    <div className="break-words text-sm font-medium text-slate-800">{valueOrDash(value)}</div>
  </div>
);

const ViewMagasin: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<StoreUser | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    const fetchStoreDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem('access_token');
        if (!token) throw new Error('Authentification requise');

        const response = await fetch(`${getUrlServer()}/magasin/${id}`, {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          signal: controller.signal,
        });
        const data = await response.json().catch(() => null);
        if (!response.ok) throw new Error(data?.message || 'Impossible de récupérer les détails du magasin');

        const storeData = data?.magasin || data?.data || data;
        setStore({
          ...storeData,
          licence: {
            max_managers: storeData?.licence?.max_managers ?? 0,
            max_livreurs: storeData?.licence?.max_livreurs ?? 0,
            max_caissiers: storeData?.licence?.max_caissiers ?? 2,
          },
          utilisateurs: Array.isArray(storeData?.utilisateurs) ? storeData.utilisateurs : [],
        });
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    if (id) fetchStoreDetails();
    return () => controller.abort();
  }, [id]);

  const users = useMemo<StoreUser[]>(() => (store?.utilisateurs || []) as StoreUser[], [store]);
  const usage = useMemo(() => {
    const actifs = users.filter((u) => u.is_active !== false);
    return {
      managers: actifs.filter((u) => u.role === 'manager').length,
      gerants: actifs.filter((u) => u.role === 'gerant' || u.role === 'livreur').length,
      caissiers: actifs.filter((u) => u.role === 'caissier').length,
    };
  }, [users]);

  const updateUserStatus = (userId: string, isActive: boolean) => {
    setStore((current) => current ? {
      ...current,
      utilisateurs: current.utilisateurs.map((user) => user._id === userId ? { ...user, is_active: isActive } : user),
    } : current);
    setSelectedUser((current) => current?._id === userId ? { ...current, is_active: isActive } : current);
  };

  /** Étiquette colorée du rôle (avec son libellé). */
  const roleTag = (role: string) => {
    const roleLabels: Record<string, string> = { admin: 'Administrateur', manager: 'Manager', gerant: 'Gérant', livreur: 'Gérant', staff: 'Staff' };
    const roleClasses: Record<string, string> = {
      admin: '!border-purple-200 !bg-purple-50 !text-purple-900',
      manager: '!border-blue-200 !bg-blue-50 !text-blue-800',
      gerant: '!border-amber-200 !bg-amber-50 !text-amber-800',
      livreur: '!border-amber-200 !bg-amber-50 !text-amber-800',
    };
    return <Tag className={`!m-0 !rounded-full !px-3 !py-0.5 !text-[11px] !font-semibold ${roleClasses[role] || '!border-slate-200 !bg-slate-50 !text-slate-700'}`}>{roleLabels[role] || role || '—'}</Tag>;
  };

  if (loading) {
    return <div className="flex min-h-[70vh] items-center justify-center"><Space direction="vertical" align="center"><Spin size="large" /><Text className="text-sm text-slate-500">Chargement des détails du magasin…</Text></Space></div>;
  }

  if (error || !store) {
    return <div className="p-6"><Alert message="Impossible de charger le magasin" description={error || 'Magasin non trouvé'} type="error" showIcon /><Button className="mt-4" onClick={() => navigate('/superadmin/dashboard/magasin')}>Retour aux magasins</Button></div>;
  }

  const storeId = store._id || store.id || '';
  const fullAddress = [store.adresse_ligne_1, store.adresse_ligne_2, store.quartier, store.code_postal, store.ville, store.pays].filter(Boolean).join(', ');

  return (
    <>
      <ConfigProvider theme={{ token: { colorPrimary: '#3b0764', borderRadius: 10 } }}>
        <div className="mx-auto w-full min-w-0 max-w-[1400px]">
          <div>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate('/superadmin/dashboard/magasin')} className="w-fit !px-0 !font-medium !text-slate-500 hover:!text-purple-700">Retour aux magasins</Button>
              {store.is_archived ? (
                <Tag icon={<InboxOutlined />} color="purple" className="!m-0 w-fit !rounded-full !px-3 !py-1 !text-xs !font-semibold">Magasin archivé — consultation seule</Tag>
              ) : (
                <Button type="primary" icon={<EditOutlined />} onClick={() => navigate(`/superadmin/dashboard/magasin/update/${storeId}`)} className="h-10 w-fit !rounded-xl !bg-purple-950 !px-5 shadow-sm hover:!bg-purple-900">Modifier</Button>
              )}
            </div>

            <section className="min-w-0 rounded-2xl border border-purple-100/70 bg-white shadow-sm">
              <div className="flex flex-col gap-5 p-4 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex min-w-0 items-center gap-4">
                  <div className="flex h-16 w-16 shrink-0 sm:h-24 sm:w-24 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                    {store.logo ? <img src={store.logo} alt={`Logo ${store.denomination}`} className="h-full w-full object-contain p-2" onError={(event) => { event.currentTarget.style.display = 'none'; }} /> : <BankOutlined className="text-4xl text-purple-300" />}
                  </div>
                  <div className="min-w-0">
                    <div className="mb-2 flex flex-wrap items-center gap-3">
                      <h1 className="min-w-0 break-words text-xl font-bold text-purple-950 sm:text-2xl md:text-3xl">{store.denomination}</h1>
                      {store.is_archived ? (
                        <Tag icon={<InboxOutlined />} className="!m-0 !rounded-full !border !border-purple-200 !bg-purple-50 !px-3 !py-1 !text-xs !font-semibold !text-purple-700">Archivé</Tag>
                      ) : (
                        <Tag icon={store.is_active !== false ? <SyncOutlined spin /> : undefined} className={`!m-0 !rounded-full !border !px-3 !py-1 !text-xs !font-semibold ${store.is_active !== false ? '!border-emerald-200 !bg-emerald-50 !text-emerald-700' : '!border-red-200 !bg-red-50 !text-red-700'}`}>{store.is_active !== false ? 'Actif' : 'Inactif'}</Tag>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-slate-500 sm:text-sm">
                      <span className="flex items-center gap-1.5"><EnvironmentOutlined /> {store.ville || 'Ville non renseignée'}{store.pays ? `, ${store.pays}` : ''}</span>
                      <span className="flex items-center gap-1.5"><BankOutlined /> {store.activité || 'Activité non renseignée'}</span>
                      <span className="flex items-center gap-1.5"><CalendarOutlined /> Créé le {formatDate(store.created_at)}</span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 lg:min-w-[330px]">
                  <div className="rounded-xl bg-slate-50 px-4 py-3"><span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400">Membres</span><strong className="text-2xl text-slate-900">{users.length}</strong></div>
                  <div className="rounded-xl bg-purple-50 px-4 py-3"><span className="block text-[11px] font-semibold uppercase tracking-wider text-purple-700">Devise</span><strong className="text-2xl text-purple-950">{store.devise || '—'}</strong></div>
                </div>
              </div>
              <div className="grid grid-cols-1 border-t border-slate-100 sm:grid-cols-3">
                <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4 sm:border-b-0 sm:border-r"><MailOutlined className="text-purple-700" /><div className="min-w-0"><span className="block text-[11px] uppercase tracking-wider text-slate-400">Email</span><span className="block truncate text-sm font-medium text-slate-700">{store.email || '—'}</span></div></div>
                <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4 sm:border-b-0 sm:border-r"><PhoneOutlined className="text-purple-700" /><div><span className="block text-[11px] uppercase tracking-wider text-slate-400">Téléphone</span><span className="text-sm font-medium text-slate-700">{store.telephone || '—'}</span></div></div>
                <div className="flex items-center gap-3 px-5 py-4"><GlobalOutlined className="text-purple-700" /><div className="min-w-0"><span className="block text-[11px] uppercase tracking-wider text-slate-400">Site web</span>{store.site_web ? <a href={store.site_web} target="_blank" rel="noreferrer" className="block truncate text-sm font-medium text-purple-700 hover:underline">{store.site_web}</a> : <span className="text-sm font-medium text-slate-700">—</span>}</div></div>
              </div>
            </section>

            <div className="mt-4 grid grid-cols-1 gap-4 sm:mt-5 sm:gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
              <div className="flex min-w-0 flex-col gap-4 sm:gap-5">
                <Card variant="borderless" className="!rounded-2xl !border !border-purple-100/70 !shadow-sm [&_.ant-card-body]:!p-4 sm:[&_.ant-card-body]:!p-6">
                  <SectionTitle icon={<EnvironmentOutlined />} title="Coordonnées et localisation" description="L’adresse officielle du magasin" />
                  <div className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
                    <DetailItem label="Pays" value={store.pays} /><DetailItem label="Ville" value={store.ville} />
                    <DetailItem label="Quartier" value={store.quartier} /><DetailItem label="Code postal" value={store.code_postal} />
                    <DetailItem label="Adresse ligne 1" value={store.adresse_ligne_1} /><DetailItem label="Adresse ligne 2" value={store.adresse_ligne_2} />
                    <DetailItem label="Adresse complète" value={fullAddress} className="sm:col-span-2" />
                  </div>
                </Card>

                <Card variant="borderless" className="!rounded-2xl !border !border-purple-100/70 !shadow-sm [&_.ant-card-body]:!p-4 sm:[&_.ant-card-body]:!p-6">
                  <SectionTitle icon={<IdcardOutlined />} title="Informations légales" description="Identité administrative et forme juridique" />
                  <div className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
                    <DetailItem label="Raison sociale" value={store.raison_sociale} /><DetailItem label="Dénomination" value={store.denomination} />
                    <DetailItem label="Forme juridique" value={store.forme_juridique} /><DetailItem label="Activité" value={store.activité} />
                    <DetailItem label="N° d’immatriculation" value={store.numero_immatriculation} /><DetailItem label="N° fiscal" value={store.numero_fiscal} />
                  </div>
                </Card>

                <Card variant="borderless" className="!rounded-2xl !border !border-purple-100/70 !shadow-sm [&_.ant-card-body]:!p-4 sm:[&_.ant-card-body]:!p-6">
                  <div className="mb-5 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <SectionTitle icon={<TeamOutlined />} title="Utilisateurs du magasin" description="Comptes rattachés à ce magasin" />
                    <Tag className="!m-0 !w-fit !rounded-full !border-slate-200 !bg-slate-50 !px-3 !text-slate-600">{users.length} membre{users.length > 1 ? 's' : ''}</Tag>
                  </div>
                  {users.length === 0 ? (
                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Aucun utilisateur rattaché" />
                  ) : (
                    // Liste plutôt que tableau : lisible de 375 px au grand écran.
                    <ul className="divide-y divide-slate-100">
                      {users.map((user) => (
                        <li key={user._id} className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center">
                          <div className="flex min-w-0 flex-1 items-center gap-3">
                            <AvatarWithPopover name={getUserName(user)} email={user.email || '—'} />
                            <div className="min-w-0">
                              <button type="button" onClick={() => setSelectedUser(user)} className="block max-w-full truncate text-left text-sm font-semibold text-slate-800 hover:text-purple-800">{getUserName(user)}</button>
                              <p className="flex min-w-0 items-center gap-1.5 text-xs text-slate-500"><MailOutlined className="shrink-0 text-slate-400" /><span className="truncate">{user.email || '—'}</span></p>
                              <p className="flex items-center gap-1.5 text-xs text-slate-500"><PhoneOutlined className="text-slate-400" />{user.telephone || '—'}</p>
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 pl-[52px] sm:pl-0">
                            {roleTag(user.role)}
                            <StatusToggle userId={user._id} initialStatus={user.is_active !== false} onStatusChange={(isActive) => updateUserStatus(user._id, isActive)} />
                            <Button type="text" size="small" onClick={() => setSelectedUser(user)} className="!px-2 !text-xs !font-semibold !text-purple-800 hover:!bg-purple-50">Voir la fiche</Button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </Card>
              </div>

              <aside className="flex flex-col gap-6">
                <Card variant="borderless" className="!rounded-2xl !border !border-purple-200 !bg-purple-50/60 !shadow-none">
                  <SectionTitle icon={<SafetyCertificateOutlined />} title="Licence du magasin" description="Comptes actifs utilisés / autorisés" />
                  <div className="space-y-3">
                    {[
                      { libelle: 'Managers', icone: <UserOutlined />, utilises: usage.managers, max: store.licence?.max_managers ?? 0 },
                      { libelle: 'Gérants', icone: <TeamOutlined />, utilises: usage.gerants, max: store.licence?.max_livreurs ?? 0 },
                      { libelle: 'Caissiers', icone: <TeamOutlined />, utilises: usage.caissiers, max: store.licence?.max_caissiers ?? 2 },
                    ].map((q) => (
                      <div key={q.libelle} className="rounded-xl border border-white bg-white px-4 py-3">
                        <div className="flex items-center justify-between gap-3">
                          <span className="flex items-center gap-3 text-sm font-medium text-slate-700">
                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 text-purple-950">{q.icone}</span>
                            {q.libelle}
                          </span>
                          <span className="text-sm tabular-nums text-slate-500"><strong className="text-lg text-slate-900">{q.utilises}</strong> / {q.max}</span>
                        </div>
                        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-purple-100/60">
                          <div className="h-full rounded-full bg-purple-700" style={{ width: `${q.max ? Math.min((q.utilises / q.max) * 100, 100) : 0}%` }} />
                        </div>
                        {q.max > 0 && q.utilises >= q.max && <p className="mt-1.5 text-[11px] font-medium text-purple-950">Limite atteinte</p>}
                      </div>
                    ))}
                  </div>
                </Card>

                <Card variant="borderless" className="!rounded-2xl !border !border-purple-100/70 !shadow-sm [&_.ant-card-body]:!p-4 sm:[&_.ant-card-body]:!p-6">
                  <SectionTitle icon={<BankOutlined />} title="Paramètres" description="Configuration générale du magasin" />
                  <div className="space-y-4">
                    <DetailItem label="Devise" value={store.devise} /><Divider className="!my-0 !border-slate-100" />
                    <DetailItem label="Pays (code)" value={store.country_code ? `${store.pays || '—'} (${store.country_code})` : store.pays} /><Divider className="!my-0 !border-slate-100" />
                    <DetailItem label="Identifiant magasin" value={<span className="inline-flex items-center gap-2 text-xs"><span className="break-all">{storeId}</span><Button type="text" size="small" icon={<CopyOutlined />} className="!text-purple-700" onClick={() => { navigator.clipboard?.writeText(storeId); message.success('Identifiant copié'); }} /></span>} /><Divider className="!my-0 !border-slate-100" />
                    <DetailItem label="Créé le" value={formatDate(store.created_at)} />
                  </div>
                </Card>
              </aside>
            </div>
          </div>
        </div>
      </ConfigProvider>

      {selectedUser && (
        <Modal
          open
          onCancel={() => setSelectedUser(null)}
          footer={null}
          width={680}
          title={<div className="flex items-center gap-3"><AvatarWithPopover name={getUserName(selectedUser)} email={selectedUser.email || '—'} size={44} /><div><Title level={5} className="!mb-0 !text-slate-900">{getUserName(selectedUser)}</Title><Text className="text-sm font-normal text-slate-500">{selectedUser.email || 'Email non renseigné'}</Text></div></div>}
        >
          <div className="border-t border-slate-100 pt-5"><Descriptions column={{ xs: 1, sm: 2 }} size="small" styles={{ label: { color: '#64748b', fontWeight: 600 }, content: { color: '#0f172a' } }}>
            <Descriptions.Item label="Rôle">{roleTag(selectedUser.role)}</Descriptions.Item>
            <Descriptions.Item label="Statut"><StatusToggle userId={selectedUser._id} initialStatus={selectedUser.is_active !== false} onStatusChange={(isActive) => updateUserStatus(selectedUser._id, isActive)} /></Descriptions.Item>
            <Descriptions.Item label="Téléphone">{selectedUser.telephone || '—'}</Descriptions.Item><Descriptions.Item label="Sexe">{selectedUser.sexe || '—'}</Descriptions.Item>
            <Descriptions.Item label="Date de naissance">{selectedUser.date_naissance || '—'}</Descriptions.Item><Descriptions.Item label="Mode scan">{selectedUser.barcode_mode ? 'Activé' : 'Désactivé'}</Descriptions.Item>
            <Descriptions.Item label="Identifiant"><Text copyable className="text-xs">{selectedUser._id}</Text></Descriptions.Item>
          </Descriptions></div>
        </Modal>
      )}
    </>
  );
};

export default ViewMagasin;
