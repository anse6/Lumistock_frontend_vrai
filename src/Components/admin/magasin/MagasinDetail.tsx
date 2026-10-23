import React, { useState } from 'react';
import { 
  BuildingStorefrontIcon, 
  MapPinIcon, 
  EnvelopeIcon, 
  CheckBadgeIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { Tag, Avatar, Table, Progress, Card, Descriptions, Badge } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { UserOutlined, ShopOutlined } from '@ant-design/icons';

// --- Interfaces based on provided JSON ---
interface User {
  _id: string;
  name: string;
  first_name: string;
  email: string;
  role: 'admin' | 'livreur' | 'gerant' | 'manager' | string;
  is_active: boolean;
  created_at: { $date: string };
  // photo_profil? : string; // If available in future
}

interface Licence {
  max_managers: number;
  max_livreurs: number;
}

interface Magasin {
  _id: string;
  denomination: string;
  pays: string;
  ville: string;
  quartier: string;
  email: string;
  activite: string;
  logo: string;
  licence: Licence;
  created_by_staff: boolean;
  is_active: boolean;
  created_at: { $date: string };
  utilisateurs: User[];
}

// --- Mock Data for Development ---
const MOCK_DATA = {
  "magasin": {
      "_id": "6984889b095f5d0c964c7ca5",
      "denomination": "Three/Three",
      "pays": "Cameroun",
      "ville": "Yaoundé",
      "quartier": "mokolo",
      "email": "33@gmail.com",
      "activite": "commerce",
      "logo": `${import.meta.env.VITE_BACKEND_URL}/uploads/images/WhatsApp_Image_2026-01-10_at_19.46.09.jpeg`,
      "licence": {
          "max_managers": 1,
          "max_livreurs": 2
      },
      "created_by_staff": true,
      "is_active": true,
      "created_at": {
          "$date": "2026-02-05T12:10:03.708Z"
      },
      "utilisateurs": [
          {
              "_id": "6984889c095f5d0c964c7ca6",
              "name": "euloge",
              "first_name": "talla",
              "email": "fouhjeanne@gmail.com",
              "magasin_id": "6984889b095f5d0c964c7ca5",
              "role": "admin",
              "is_active": true,
              "created_at": {
                  "$date": "2026-02-05T12:10:04.010Z"
              },
              "updated_at": {
                  "$date": "2026-02-05T12:10:04.010Z"
              }
          },
          {
              "_id": "69848cdd095f5d0c964c7cb1",
              "name": "pep",
              "first_name": "paul",
              "email": "anse.tchio@klivar.com",
              "role": "livreur",
              "magasin_id": "6984889b095f5d0c964c7ca5",
              "is_active": true,
              "created_at": {
                  "$date": "2026-02-05T12:28:13.454Z"
              }
          },
          {
              "_id": "69887b1636840f148fe1cae0",
              "name": "tony",
              "first_name": "ANSE",
              "email": "tchiovernel@gmail.com",
              "role": "livreur",
              "magasin_id": "6984889b095f5d0c964c7ca5",
              "is_active": true,
              "created_at": {
                  "$date": "2026-02-08T12:01:26.877Z"
              }
          }
      ]
  }
};


const MagasinDetail: React.FC = () => {
    // In real usage, fetch data based on ID from params
    // const { id } = useParams<{ id: string }>();
    const magasin = MOCK_DATA.magasin as unknown as Magasin;
    const [activeTab, setActiveTab] = useState<'overview' | 'team'>('overview');

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    // --- Table Columns ---
    const userColumns: ColumnsType<User> = [
        {
            title: 'Utilisateur',
            key: 'user',
            render: (_, record) => (
                <div className="flex items-center space-x-3">
                    <Avatar icon={<UserOutlined />} className="bg-blue-100 text-blue-600" />
                    <div>
                        <div className="font-medium text-gray-900 capitalize">{record.name} {record.first_name}</div>
                        <div className="text-xs text-gray-500">{record.email}</div>
                    </div>
                </div>
            ),
        },
        {
            title: 'Rôle',
            dataIndex: 'role',
            key: 'role',
            render: (role) => {
                let color = 'blue';
                if (role === 'admin') color = 'purple';
                if (role === 'livreur' || role === 'gerant') color = 'green';
                if (role === 'manager') color = 'orange';
                return (
                    <Tag color={color} className="capitalize">
                        {role === 'livreur' || role === 'gerant' ? 'gérant' : role}
                    </Tag>
                );
            },
        },
        {
            title: 'Statut',
            dataIndex: 'is_active',
            key: 'status',
            render: (isActive) => (
                <Badge status={isActive ? 'success' : 'error'} text={isActive ? 'Actif' : 'Inactif'} />
            ),
        },
        {
            title: 'Date création',
            dataIndex: ['created_at', '$date'],
            key: 'created_at',
            render: (date) => <span className="text-gray-500">{formatDate(date)}</span>,
        },
    ];

    // Calculate Stats
    const totalUsers = magasin.utilisateurs.length;
    const totalAdmins = magasin.utilisateurs.filter(u => u.role === 'admin').length;
    const totalLivreurs = magasin.utilisateurs.filter(u => u.role === 'livreur' || u.role === 'gerant').length;

    return (
        <div className="min-h-screen bg-gray-50/50 p-6 space-y-6">
            
            {/* Header Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <ShopOutlined style={{ fontSize: '150px' }} />
                </div>
                
                <div className="flex flex-col md:flex-row items-center md:items-start gap-6 relative z-10">
                    <div className="relative">
                       <img 
                         src={magasin.logo || "https://via.placeholder.com/150"} 
                         alt={magasin.denomination}
                         className="w-24 h-24 md:w-32 md:h-32 rounded-xl object-cover border-4 border-white shadow-lg bg-gray-100"
                       />
                       <div className={`absolute -bottom-2 -right-2 w-6 h-6 rounded-full border-2 border-white ${magasin.is_active ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    </div>

                    <div className="flex-1 text-center md:text-left space-y-2">
                        <div className="flex flex-col md:flex-row items-center gap-3">
                            <h1 className="text-3xl font-bold text-gray-800 m-0">{magasin.denomination}</h1>
                            {magasin.is_active ? (
                                <Tag color="success" className="rounded-full px-3 m-0">Actif</Tag>
                            ) : (
                                <Tag color="error" className="rounded-full px-3 m-0">Inactif</Tag>
                            )}
                        </div>
                        
                        <div className="flex flex-wrap justify-center md:justify-start gap-4 text-gray-500 text-sm mt-2">
                            <div className="flex items-center gap-1.5">
                                <MapPinIcon className="w-4 h-4" />
                                <span>{magasin.ville}, {magasin.pays} ({magasin.quartier})</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <EnvelopeIcon className="w-4 h-4" />
                                <span>{magasin.email}</span>
                            </div>
                             <div className="flex items-center gap-1.5">
                                <BuildingStorefrontIcon className="w-4 h-4" />
                                <span className="capitalize">{magasin.activite}</span>
                            </div>
                        </div>
                        
                        <div className="flex items-center justify-center md:justify-start gap-2 text-xs text-gray-400 mt-2">
                            <ClockIcon className="w-4 h-4" />
                            <span>Créé le {formatDate(magasin.created_at.$date)}</span>
                            {magasin.created_by_staff && <Tag className="ml-2 text-xs">Créé par Staff</Tag>}
                        </div>
                    </div>

                    {/* Quick Stats on Header */}
                    <div className="flex gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="text-center px-4 border-r border-gray-200">
                            <div className="text-2xl font-bold text-gray-900">{totalUsers}</div>
                            <div className="text-xs text-gray-500 uppercase tracking-wide">Utilisateurs</div>
                        </div>
                        <div className="text-center px-4">
                            <div className="text-2xl font-bold text-blue-600">{magasin.licence.max_livreurs}</div>
                            <div className="text-xs text-gray-500 uppercase tracking-wide">Licence Magasiniers</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-6 border-b border-gray-200 px-2">
                <button 
                  onClick={() => setActiveTab('overview')}
                  className={`pb-3 font-medium text-sm transition-colors relative ${activeTab === 'overview' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Vue d'ensemble
                  {activeTab === 'overview' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-t-full"></div>}
                </button>
                <button 
                  onClick={() => setActiveTab('team')}
                  className={`pb-3 font-medium text-sm transition-colors relative ${activeTab === 'team' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Équipe & Utilisateurs
                  <span className="ml-2 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">{totalUsers}</span>
                  {activeTab === 'team' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-t-full"></div>}
                </button>
            </div>

            {/* Content Area */}
            {activeTab === 'overview' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column: Details */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card title="Informations Générales" className="shadow-sm rounded-xl border-gray-100" bordered={false}>
                            <Descriptions column={{ xs: 1, sm: 2 }} layout="vertical">
                                <Descriptions.Item label="Dénomination">{magasin.denomination}</Descriptions.Item>
                                <Descriptions.Item label="Email de contact">
                                    <a href={`mailto:${magasin.email}`} className="text-blue-600 hover:underline">{magasin.email}</a>
                                </Descriptions.Item>
                                <Descriptions.Item label="Pays">{magasin.pays}</Descriptions.Item>
                                <Descriptions.Item label="Ville">{magasin.ville}</Descriptions.Item>
                                <Descriptions.Item label="Quartier">{magasin.quartier}</Descriptions.Item>
                                <Descriptions.Item label="Secteur d'activité">
                                    <span className="capitalize">{magasin.activite}</span>
                                </Descriptions.Item>
                            </Descriptions>
                        </Card>
                    </div>

                    {/* Right Column: License & Status */}
                    <div className="space-y-6">
                        <Card title="État de la Licence" className="shadow-sm rounded-xl border-gray-100" bordered={false}>
                            <div className="space-y-6">
                                <div>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-gray-600">Magasiniers Utilisés</span>
                                        <span className="font-medium">{totalLivreurs} / {magasin.licence.max_livreurs}</span>
                                    </div>
                                    <Progress 
                                      percent={(totalLivreurs / magasin.licence.max_livreurs) * 100} 
                                      status={totalLivreurs > magasin.licence.max_livreurs ? 'exception' : 'active'}
                                      strokeColor={{ '0%': '#108ee9', '100%': '#87d068' }}
                                    />
                                </div>
                                <div>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-gray-600">Managers Utilisés</span>
                                        {/* Assuming admins count towards manager limit for now, or use a separate count if available */}
                                        <span className="font-medium">{totalAdmins} / {magasin.licence.max_managers}</span>
                                    </div>
                                     <Progress 
                                      percent={(totalAdmins / magasin.licence.max_managers) * 100} 
                                      status={totalAdmins > magasin.licence.max_managers ? 'exception' : 'active'}
                                    />
                                </div>
                                <div className="mt-4 p-3 bg-blue-50 text-blue-700 text-xs rounded-lg">
                                    <CheckBadgeIcon className="w-4 h-4 inline mr-1" />
                                    Licence active. Renouvellement automatique activé.
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            )}

            {activeTab === 'team' && (
                <div className="space-y-6">
                    <Card className="shadow-sm rounded-xl border-gray-100" bordered={false}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-gray-800">Membres de l'équipe</h3>
                            {/* Add filters or actions here */}
                        </div>
                        <Table 
                            columns={userColumns} 
                            dataSource={magasin.utilisateurs} 
                            rowKey="_id" 
                            pagination={{ pageSize: 5 }}
                        />
                    </Card>
                </div>
            )}

        </div>
    );
};

export default MagasinDetail;
