import React, { useState } from 'react';
import { Table, Tag, Button, Dropdown, Modal, InputNumber, Avatar, message, Tooltip, ConfigProvider, Space, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { MoreVertical, AlertTriangle, CheckCircle, Eye, RotateCcw, Box } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import defaultImage from './../Delivery/images/riz.png';
import { getUrlServer } from './../../configServer';
import { Product } from './types';
import { retourStockMagasin } from './productService';
import images from '@/assets/no_data.png';
import { useTranslation } from 'react-i18next';

const { Text, Title } = Typography;

interface ProductsTableProps {
  products: Product[];
  loading?: boolean;
  onRefresh?: () => void;
}

const ProductsTable: React.FC<ProductsTableProps> = ({ products, loading, onRefresh }) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [isReturnModalVisible, setIsReturnModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [returnQuantity, setReturnQuantity] = useState<number>(1);
  const [isSubmittingReturn, setIsSubmittingReturn] = useState(false);

  const getImageSrc = (imageUrl: string) => {
    if (imageUrl && imageUrl.trim() !== "") {
      if (imageUrl.startsWith("http")) return imageUrl;
      const cleanedPath = imageUrl.replace(/^\/?uploads/i, 'uploads');
      return `${getUrlServer()}/${cleanedPath}`;
    }
    return defaultImage;
  };

  const showReturnModal = (product: Product) => {
    setSelectedProduct(product);
    setReturnQuantity(1);
    setIsReturnModalVisible(true);
  };

  const closeReturnModal = () => {
    setIsReturnModalVisible(false);
    setSelectedProduct(null);
  };

  const handleReturnSubmit = async () => {
    if (!selectedProduct || returnQuantity <= 0) return;

    if (returnQuantity > selectedProduct.quantityRemaining) {
      message.error(t('inventory.returnModal.errorRange'));
      return;
    }

    setIsSubmittingReturn(true);
    try {
      const success = await retourStockMagasin([{
        produit_id: selectedProduct.id,
        quantite: returnQuantity
      }]);

      if (success) {
        message.success(t('inventory.returnModal.success', { count: returnQuantity, name: selectedProduct.name }));
        closeReturnModal();
        if (onRefresh) onRefresh();
      } else {
        message.error(t('inventory.returnModal.errorGeneric'));
      }
    } catch (error) {
      console.error("Erreur lors du retour de stock:", error);
      message.error(t('inventory.messages.unexpectedError'));
    } finally {
      setIsSubmittingReturn(false);
    }
  };

  const columns: ColumnsType<Product> = [
    {
      title: t('inventory.table.columns.alert'),
      key: 'alert',
      width: 130,
      render: (_, record) => (
        record.quantityRemaining < 30 ? (
          <Tooltip title={t('inventory.table.alerts.lowStockTooltip')}>
            <Tag color="error" icon={<AlertTriangle size={14} />} className="rounded-full">{t('inventory.table.alerts.lowStock')}</Tag>
          </Tooltip>
        ) : (
          <Tooltip title={t('inventory.table.alerts.stockOkTooltip')}>
            <Tag color="success" icon={<CheckCircle size={14} />} className="rounded-full">{t('inventory.table.alerts.stockOk')}</Tag>
          </Tooltip>
        )
      ),
    },
    {
      title: t('inventory.table.columns.image'),
      dataIndex: 'image',
      key: 'image',
      width: 70,
      render: (image) => (
        <Avatar
          src={getImageSrc(image)}
          shape="square"
          size={40}
          icon={<Box />}
          style={{ backgroundColor: '#f0f2f5', borderRadius: '8px' }}
        />
      ),
    },
    {
      title: t('inventory.table.columns.name'),
      dataIndex: 'name',
      key: 'name',
      ellipsis: true,
      render: (name) => <Text strong className="text-sm">{name}</Text>,
    },
    {
      title: t('inventory.table.columns.category'),
      dataIndex: 'category',
      key: 'category',
      width: 120,
      render: (category) => (
        <Tag color="blue" className="rounded-md border-0 bg-blue-50 text-blue-600 font-medium">{category}</Tag>
      ),
    },
    {
      title: t('inventory.table.columns.initialQty'),
      dataIndex: 'quantity',
      key: 'quantity',
      width: 100,
      align: 'center',
    },
    {
      title: t('inventory.table.columns.currentQty'),
      dataIndex: 'quantityRemaining',
      key: 'quantityRemaining',
      width: 100,
      align: 'center',
      sorter: (a, b) => a.quantityRemaining - b.quantityRemaining,
      render: (val) => (
        <Text strong className={val < 10 ? 'text-red-500' : 'text-green-600'}>
          {val}
        </Text>
      )
    },
    {
      title: t('inventory.table.columns.priceUnit'),
      dataIndex: 'price',
      key: 'price',
      width: 120,
      render: (price) => {
        const numericPrice = typeof price === 'string' ? parseFloat(price.replace(/[^\d.]/g, '')) : price;
        return <Text strong className="text-gray-800">{numericPrice?.toLocaleString(i18n.language === 'fr' ? 'fr-FR' : 'en-US')} FCFA</Text>;
      },
    },
    {
      title: t('inventory.table.columns.status'),
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => (
        <Tag color={status === 'En stock' ? 'success' : 'error'} className="rounded-full border-0">
          {(status === 'En stock' ? t('inventory.filters.inStock') : t('inventory.filters.outOfStock'))}
        </Tag>
      ),
    },
    {
      title: t('inventory.table.columns.actions'),
      key: 'action',
      width: 80,
      fixed: 'right',
      render: (_, record) => {
        const items = [
          {
            key: 'details',
            label: t('inventory.table.actionLabels.details'),
            icon: <Eye size={16} />,
            onClick: () => navigate(`/dashboard/products/details/${record.id}`),
          },
          {
            key: 'return',
            label: t('inventory.table.actionLabels.return'),
            icon: <RotateCcw size={16} />,
            onClick: () => showReturnModal(record),
            danger: true,
          },
        ];

        return (
          <Dropdown menu={{ items: items as any }} trigger={['click']} placement="bottomRight">
            <Button type="text" icon={<MoreVertical size={20} className="text-gray-400 hover:text-gray-600" />} />
          </Dropdown>
        );
      },
    },
  ];

  return (
    <>
      <ConfigProvider
        theme={{
          components: {
            Table: {
              headerBg: '#f8fafc',
              headerColor: '#64748b',
              headerBorderRadius: 12,
              rowHoverBg: '#f1f5f9',
            },
          },
        }}
      >
        <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm">
          <Table
            columns={columns}
            dataSource={products}
            rowKey="id"
            loading={loading}
            scroll={{ x: 'max-content' }}
            pagination={{
              pageSize: 10,
              showSizeChanger: false,
              className: 'px-4 py-4 border-t border-gray-50'
            }}
            locale={{
              emptyText: (
                <div className="flex flex-col justify-center items-center py-16">
                  <img src={images} alt="No Data" className="h-24 w-24 object-contain mb-3 opacity-60" />
                  <Text type="secondary">{t('inventory.table.emptyInventory')}</Text>
                </div>
              )
            }}
          />
        </div>
      </ConfigProvider>

      {/* Modal pour le retour de stock */}
      <Modal
        title={
          <Space>
            <RotateCcw className="text-orange-500" size={20} />
            <span>{t('inventory.returnModal.title')}</span>
          </Space>
        }
        open={isReturnModalVisible}
        onCancel={closeReturnModal}
        footer={[
          <Button key="cancel" onClick={closeReturnModal} className="rounded-lg">
            {t('inventory.returnModal.cancel')}
          </Button>,
          <Button
            key="submit"
            type="primary"
            danger
            loading={isSubmittingReturn}
            onClick={handleReturnSubmit}
            icon={<RotateCcw size={16} />}
            className="rounded-lg bg-orange-500 border-orange-500 hover:bg-orange-600"
          >
            {t('inventory.returnModal.confirm')}
          </Button>
        ]}
        centered
        className="font-['Laura']"
      >
        {selectedProduct && (
          <div className="py-4">
            <div className="flex items-center gap-4 mb-6 p-4 bg-orange-50 rounded-xl border border-orange-100">
              <Avatar
                src={getImageSrc(selectedProduct.image)}
                shape="square"
                size={54}
                className="flex-shrink-0 bg-white shadow-sm"
              />
              <div>
                <Title level={5} className="!m-0 text-gray-800">{selectedProduct.name}</Title>
                <Tag color="orange" className="mt-1">{t('inventory.returnModal.currentStock', { count: selectedProduct.quantityRemaining })}</Tag>
              </div>
            </div>

            <div className="space-y-2">
              <Text strong className="text-gray-700 block mb-2">{t('inventory.returnModal.qtyLabel')}</Text>
              <InputNumber
                min={1}
                max={selectedProduct.quantityRemaining}
                value={returnQuantity}
                onChange={(val) => setReturnQuantity(val || 0)}
                className="w-full h-12 flex items-center rounded-lg border-2"
                placeholder={t('inventory.returnModal.placeholder')}
                autoFocus
              />
              <Text type="secondary" className="text-xs italic block mt-2">
                {t('inventory.returnModal.note')}
              </Text>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};

export default ProductsTable;
