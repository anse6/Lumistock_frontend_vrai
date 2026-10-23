import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { 
  Spin, 
  Card, 
  Row, 
  Col, 
  Typography, 
  Tag, 
  Tabs, 
  Table, 
  Statistic, 
  Descriptions, 
  Image, 
  Breadcrumb, 
  Button, 
  App,
  Divider,
  Empty,
  Space
} from 'antd';
import { 
  ArrowLeftOutlined, 
  HistoryOutlined, 
  InfoCircleOutlined, 
  ArrowUpOutlined, 
  ArrowDownOutlined,
  ShoppingOutlined,
  ContainerOutlined,
  ClockCircleOutlined,
  UserOutlined,
  WalletOutlined
} from '@ant-design/icons';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { getUrlServer } from './../../configServer';
import PageTitle from '../../Components/PageTitle';
import defaultimage from './../../Modules/Delivery/images/riz.png';
import axios from 'axios';
import { useTranslation } from 'react-i18next';

const { Title, Text, Paragraph } = Typography;

interface Conditionnement {
  nom: string;
  facteur: number;
  prix_conditionnement: number;
  prix_reference: number;
  economie: number;
}

interface MouvementStock {
  type: string;
  quantite: number;
  date: string | { $date: string };
  acteur?: { admin_id: string };
  conditionnement?: Conditionnement;
}

interface Produit {
  _id: string;
  nom: string;
  description: string;
  image: string;
  prix: number;
  unite: string;
  quantite_livreur: number;
  quantite_initiale: number;
  etat: string;
  categorie_id: string;
  magasin_id: string;
  mouvements_stock: MouvementStock[];
  conditionnements: Conditionnement[];
  created_at: string | { $date: string };
}

interface Magasin {
  _id: string;
  denomination: string;
}

interface Categorie {
  _id: string;
  nom: string;
}

interface User {
  _id: string;
  name: string;
}

const ProductDetailLivreur: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { notification } = App.useApp();
  const { t, i18n } = useTranslation();
  
  const [produit, setProduit] = useState<Produit | null>(null);
  const [magasin, setMagasin] = useState<Magasin | null>(null);
  const [categorie, setCategorie] = useState<Categorie | null>(null);
  const [users, setUsers] = useState<{ [key: string]: User }>({});
  const [loading, setLoading] = useState(true);

  // Current User ID for filtering
  const currentUserId = localStorage.getItem('user_id');

  const extractDate = (dateValue: string | { $date: string }): string => {
    if (typeof dateValue === 'string') return dateValue;
    return dateValue?.$date || '';
  };

  const getImageUrl = (imagePath: string): string => {
    if (!imagePath) return defaultimage;
    if (imagePath.startsWith('http')) return imagePath;
    const cleanPath = imagePath.startsWith('uploads') ? imagePath : `uploads/images/${imagePath}`;
    return `${getUrlServer()}/${cleanPath}`;
  };

  const fetchData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const headers = { Authorization: `Bearer ${token}` };
      
      const prodRes = await axios.get(`${getUrlServer()}/produits/${id}`, { headers });
      const data = prodRes.data;
      setProduit(data);
      
      const promises = [];
      if (data.magasin_id) {
        promises.push(axios.get(`${getUrlServer()}/magasin/${data.magasin_id}`, { headers })
          .then(res => setMagasin(res.data.magasin || res.data))
          .catch(() => {})
        );
      }
      if (data.categorie_id) {
        promises.push(axios.get(`${getUrlServer()}/categorie/${data.categorie_id}`, { headers })
          .then(res => setCategorie(res.data.categorie || res.data))
          .catch(() => {})
        );
      }
      
      if (data.mouvements_stock?.length > 0) {
        const actorIds = [...new Set(data.mouvements_stock.map((m: any) => m.acteur?.admin_id).filter(Boolean))];
        actorIds.forEach((uid: any) => {
          promises.push(axios.get(`${getUrlServer()}/users/${uid}`, { headers })
            .then(res => {
              const u = res.data.user || res.data;
              setUsers(prev => ({ ...prev, [uid]: u }));
            })
            .catch(() => {})
          );
        });
      }
      
      await Promise.all(promises);
    } catch (_err) {
      notification.error({ 
        message: t('inventory.details.error'), 
        description: t('inventory.details.loadingErrorDesc') 
      });
    } finally {
      setLoading(false);
    }
  }, [id, notification, t]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filtering Logic: Only "sa vente" (their sales) and "sorties" (outputs)
  const filteredMouvements = useMemo(() => {
    if (!produit?.mouvements_stock) return [];
    
    return produit.mouvements_stock
      .filter((m: MouvementStock) => {
        const type = m.type.toLowerCase();
        const isSelf = m.acteur?.admin_id === currentUserId;
        const isOutput = type.includes('vente') || type.includes('sortie') || type.includes('consignation') || m.quantite < 0;
        
        // Show if it's their own action OR if it's a general output/sale relevant to them
        return isSelf || (isOutput && m.acteur?.admin_id === currentUserId);
      })
      .sort((a, b) => new Date(extractDate(b.date)).getTime() - new Date(extractDate(a.date)).getTime());
  }, [produit, currentUserId]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spin size="large" tip={t('inventory.details.loading')} />
      </div>
    );
  }

  if (!produit) {
    return (
      <div className="p-8">
        <Empty description={t('inventory.details.notFound')} />
        <div className="text-center mt-4">
          <Button onClick={() => navigate(-1)}>{t('inventory.details.back')}</Button>
        </div>
      </div>
    );
  }

  const columns = [
    {
      title: t('inventory.details.history.columns.date'),
      dataIndex: 'date',
      key: 'date',
      render: (date: any) => (
        <Space direction="vertical" size={0}>
          <Text strong>{new Date(extractDate(date)).toLocaleDateString(i18n.language === 'fr' ? 'fr-FR' : 'en-US')}</Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {new Date(extractDate(date)).toLocaleTimeString(i18n.language === 'fr' ? 'fr-FR' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </Space>
      ),
    },
    {
      title: t('inventory.details.history.columns.movement'),
      key: 'mouvement',
      render: (record: MouvementStock) => {
        const isEntry = record.quantite > 0;
        return (
          <Tag icon={isEntry ? <ArrowUpOutlined /> : <ArrowDownOutlined />} color={isEntry ? 'success' : 'error'}>
            {record.type.toUpperCase()}
          </Tag>
        );
      }
    },
    {
      title: t('inventory.details.history.columns.quantity'),
      dataIndex: 'quantite',
      key: 'quantite',
      render: (qty: number, record: MouvementStock) => (
        <Text strong className={qty >= 0 ? 'text-green-600' : 'text-red-600'}>
          {qty >= 0 ? '+' : ''}{qty} {produit.unite}
          {record.conditionnement && (
            <div style={{ fontSize: '11px', fontWeight: 'normal', color: 'gray' }}>
              ({record.conditionnement.nom})
            </div>
          )}
        </Text>
      )
    },
    {
      title: t('inventory.details.history.columns.author'),
      key: 'acteur',
      render: (record: MouvementStock) => (
        <Space>
          <UserOutlined style={{ color: '#1677ff' }} />
          <Text>{users[record.acteur?.admin_id || '']?.name || t('inventory.details.history.me')}</Text>
        </Space>
      )
    }
  ];

  return (
    <>
      <PageTitle>{produit.nom} - {t('inventory.details.livreurTitle')}</PageTitle>
      <div className="p-4 sm:p-6 bg-white min-h-screen font-['Laura']">
        <Breadcrumb
          items={[
            { title: <Link to="/dashboard/products">{t('inventory.details.breadcrumb')}</Link> },
            { title: produit.nom }
          ]}
          className="mb-6"
        />

        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-8">
          <div>
            <Title level={2} style={{ marginBottom: 4 }}>{produit.nom}</Title>
            <Space split={<Divider type="vertical" />}>
              <Text type="secondary"><ShoppingOutlined /> {categorie?.nom || t('inventory.details.info.noCategory')}</Text>
              <Text type="secondary"><ClockCircleOutlined /> {t('inventory.details.info.created')} {new Date(extractDate(produit.created_at)).toLocaleDateString()}</Text>
            </Space>
          </div>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>{t('inventory.details.back')}</Button>
        </div>

        <Row gutter={[24, 24]}>
          {/* Main Info */}
          <Col xs={24} lg={8}>
            <Card className="overflow-hidden border-0 shadow-sm rounded-xl">
              <div className="p-2 bg-gray-50 rounded-xl mb-6">
                <Image
                  src={getImageUrl(produit.image)}
                  fallback={defaultimage}
                  className="w-full aspect-square object-contain rounded-lg"
                  preview={{ mask: <div className="flex items-center gap-2"><InfoCircleOutlined /> {t('inventory.details.info.zoom')}</div> }}
                />
              </div>
              
              <div className="space-y-4">
                <Statistic 
                  title={t('inventory.details.info.price')} 
                  value={produit.prix} 
                  suffix="FCFA" 
                  valueStyle={{ color: '#059669', fontWeight: 'bold' }} 
                />
                <Divider style={{ margin: '12px 0' }} />
                <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 flex items-center justify-between">
                   <div>
                      <p className="text-xs text-indigo-600 font-medium mb-1">{t('inventory.details.info.stock')}</p>
                      <h4 className="text-2xl font-bold text-indigo-900">{produit.quantite_livreur} {produit.unite}</h4>
                   </div>
                   <div className="bg-indigo-100 p-2 rounded-full">
                      <ContainerOutlined className="text-indigo-600" />
                   </div>
                </div>
                <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 flex items-center justify-between mt-4">
                   <div>
                      <p className="text-xs text-emerald-600 font-medium mb-1">{t('inventory.details.info.value')}</p>
                      <h4 className="text-2xl font-bold text-emerald-900">
                        {(produit.prix * (produit.quantite_livreur || 0)).toLocaleString(i18n.language === 'fr' ? 'fr-FR' : 'en-US')} FCFA
                      </h4>
                   </div>
                   <div className="bg-emerald-100 p-2 rounded-full">
                      <WalletOutlined className="text-emerald-600" />
                   </div>
                </div>
              </div>
            </Card>
          </Col>

          {/* Details & History Tabs */}
          <Col xs={24} lg={16}>
            <Card className="border-0 shadow-sm h-full rounded-xl">
              <Tabs
                defaultActiveKey="1"
                size="large"
                items={[
                  {
                    key: '1',
                    label: <span><InfoCircleOutlined /> {t('inventory.details.tabs.info')}</span>,
                    children: (
                      <div className="py-2">
                        <Descriptions bordered column={{ xxl: 1, xl: 1, lg: 1, md: 1, sm: 1, xs: 1 }} className="custom-descriptions">
                          <Descriptions.Item label={t('inventory.details.info.id')}>{produit._id}</Descriptions.Item>
                          <Descriptions.Item label={t('inventory.details.info.status')}>
                            <Tag color={produit.quantite_livreur > 0 ? 'success' : 'error'}>
                              {produit.quantite_livreur > 0 ? t('inventory.details.info.available') : t('inventory.details.info.outOfStock')}
                            </Tag>
                          </Descriptions.Item>
                          <Descriptions.Item label={t('inventory.details.info.store')}>{magasin?.denomination || 'N/A'}</Descriptions.Item>
                          <Descriptions.Item label={t('inventory.details.info.unit')}>{produit.unite}</Descriptions.Item>
                        </Descriptions>
                        
                        <div className="mt-8">
                          <Title level={4}><ContainerOutlined /> {t('inventory.details.info.description')}</Title>
                          <Paragraph className="text-gray-600 leading-relaxed">
                            {produit.description || t('inventory.details.info.noDesc')}
                          </Paragraph>
                        </div>

                        {produit.conditionnements?.length > 0 && (
                          <div className="mt-8">
                            <Title level={4}><ShoppingOutlined /> {t('inventory.details.info.pricingByPack')}</Title>
                            <Row gutter={[16, 16]}>
                              {produit.conditionnements.map((c, i) => (
                                <Col xs={24} sm={12} key={i}>
                                  <Card size="small" className="bg-slate-50 border-slate-100 hover:border-indigo-200 transition-colors">
                                    <div className="flex justify-between items-center">
                                      <Text strong>{c.nom}</Text>
                                      <Tag color="blue">{c.facteur} {produit.unite}</Tag>
                                    </div>
                                    <div className="mt-2 flex justify-between">
                                      <Text type="secondary">{t('inventory.details.info.price')}:</Text>
                                      <Text strong className="text-indigo-600">{c.prix_conditionnement?.toLocaleString()} FCFA</Text>
                                    </div>
                                  </Card>
                                </Col>
                              ))}
                            </Row>
                          </div>
                        )}
                      </div>
                    )
                  },
                  {
                    key: '2',
                    label: <span><HistoryOutlined /> {t('inventory.details.tabs.history')}</span>,
                    children: (
                      <div className="py-2">
                        <Table 
                          dataSource={filteredMouvements} 
                          columns={columns} 
                          pagination={{ pageSize: 5 }}
                          rowKey={(_, index) => index?.toString() || ''}
                          scroll={{ x: 'max-content' }}
                          locale={{ emptyText: t('inventory.details.history.empty') }}
                        />
                      </div>
                    )
                  }
                ]}
              />
            </Card>
          </Col>
        </Row>
      </div>
    </>
  );
};

export default ProductDetailLivreur;
