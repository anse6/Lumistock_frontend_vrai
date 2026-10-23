import React from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import images from "../../assets/no_data.png";
import {
  Document,
  Page,
  View,
  StyleSheet,
  PDFDownloadLink,
} from '@react-pdf/renderer';
import { getUrlServer } from "../../configServer";
import { Card, Result, Spin, Space, Typography } from 'antd';
import { StarOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

const { Title, Text } = Typography;
const API_URL = getUrlServer();

type Product = {
  id: string;
  name: string;
  salesPercentage?: number;
};

const DownloadIcon: React.FC<{ className?: string }> = ({ className = "" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const styles = StyleSheet.create({
  page: { padding: 20, fontSize: 12, fontFamily: 'Helvetica' },
  header: { fontSize: 20, marginBottom: 20, textAlign: 'center', color: '#6B46C1', fontWeight: 'bold' },
  tableHeader: { flexDirection: 'row', borderBottomWidth: 2, borderBottomColor: '#6B46C1', paddingBottom: 8 },
  tableHeaderItem: { width: '50%', fontWeight: 'bold' },
  tableRow: { flexDirection: 'row', paddingVertical: 8, borderBottomColor: '#eee', borderBottomWidth: 1 },
  tableRowItem: { width: '50%' }
});

const BestSellingProducts: React.FC = () => {
  const { t } = useTranslation();

  const ProductsPDF: React.FC<{ products: Product[] }> = ({ products }) => (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.header}>{t('admin.dashboard.top_products')}</Text>
        <View style={styles.tableHeader}>
          <Text style={styles.tableHeaderItem}>{t('admin.dashboard.pdf_col_product')}</Text>
          <Text style={styles.tableHeaderItem}>{t('admin.dashboard.pdf_col_sales')}</Text>
        </View>
        {products.map((product) => (
          <View style={styles.tableRow} key={product.id}>
            <Text style={styles.tableRowItem}>{product.name}</Text>
            <Text style={styles.tableRowItem}>{product.salesPercentage?.toFixed(2)}%</Text>
          </View>
        ))}
      </Page>
    </Document>
  );

  const fetchProducts = async (): Promise<Product[]> => {
    const token = localStorage.getItem('access_token');
    if (!token) throw new Error(t('admin.dashboard.error'));
    const response = await axios.get(`${API_URL}/produits/best/livreur/`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.map((item: any) => ({
      id: item.produit_id,
      name: item.nom,
      salesPercentage: item.pourcentage_montant
    }));
  };

  const { data: products, isLoading, error } = useQuery<Product[]>({
    queryKey: ['bestSellingLiv'],
    queryFn: fetchProducts,
  });

  if (isLoading) {
    return (
      <Card style={{ borderRadius: '12px', height: '100%' }} bodyStyle={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Spin size="large" tip={t('common.loading')} />
      </Card>
    );
  }

  if (error) {
    return (
      <Card style={{ borderRadius: '12px', height: '100%' }}>
        <Result status="error" title={t('common.error')} subTitle={(error as Error).message} />
      </Card>
    );
  }

  const limitedProducts = products?.slice(0, 5) || [];

  return (
    <Card
      title={
        <Space>
          <StarOutlined style={{ color: '#1677ff', fontSize: '20px' }} />
          <Title level={5} style={{ margin: 0 }}>{t('admin.dashboard.top_products')}</Title>
        </Space>
      }
      extra={
        limitedProducts.length > 0 && (
          <PDFDownloadLink document={<ProductsPDF products={limitedProducts} />} fileName="produits.pdf">
            {({ loading }) => (
              <button disabled={loading} className="text-gray-400 hover:text-blue-500">
                {loading ? <Spin size="small" /> : <DownloadIcon className="w-5 h-5" />}
              </button>
            )}
          </PDFDownloadLink>
        )
      }
      style={{ borderRadius: '12px', border: '1px solid #f0f0f0', height: '100%' }}
      bodyStyle={{ padding: '24px' }}
      hoverable
    >
      <div className="space-y-4">
        {limitedProducts.length > 0 ? limitedProducts.map((product, index) => (
          <div key={product.id} className="flex items-center justify-between p-2 border-b border-gray-100 pb-3 hover:bg-gray-50 rounded-lg transition-colors">
            <div className="flex items-center w-full">
              <div className="w-8 flex-shrink-0 text-gray-400 font-bold">#{index + 1}</div>
              <div className="flex-1 min-w-0 pr-4">
                <p className="font-medium text-gray-800 truncate">{product.name}</p>
                <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                  <div
                    className="bg-blue-500 h-1.5 rounded-full"
                    style={{ width: `${Math.min(product.salesPercentage ?? 0, 100)}%` }}
                  ></div>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                  {product.salesPercentage?.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        )) : (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              minHeight: '200px',
              textAlign: 'center'
            }}
          >
            <img src={images} alt="Logo" className="w-16 h-16" />
            <Text type="secondary">
              {t('admin.dashboard.no_products_sold')}
            </Text>
          </div>
        )}
      </div>
    </Card>
  );
};
export default BestSellingProducts;
