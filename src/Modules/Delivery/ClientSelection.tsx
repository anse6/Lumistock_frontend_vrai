import React from 'react';
import { BreadcrumbNavigation } from './Clients/BreadcrumbNavigation';
import { ClientSection } from './Clients/ClientSection';
import { ProductsSection } from './Clients/ProductsSection';
import { PaymentStatusSection } from './Clients/PaymentStatusSection';
import { TotalSection } from './Clients/TotalSection';
import { ActionsSection } from './Clients/ActionsSection';
import { useProductStore } from '../../Components/componentproduitselection/stores/useProductStore';
import PageTitle from '../../Components/PageTitle';
import { useTranslation } from 'react-i18next';

const ConfigurationApp: React.FC = () => {
  useProductStore();
  const { t } = useTranslation();

  return (
    <>
      <PageTitle>{t('delivery.deliveryConfig.pageTitleNew')}</PageTitle>

      <div className="p-6 bg-white min-h-screen">
        <BreadcrumbNavigation paths={[t('delivery.deliveryConfig.breadcrumbDelivery'), t('delivery.deliveryConfig.breadcrumbSelect'), t('delivery.deliveryConfig.breadcrumbConfig')]} />

        <div className="flex justify-between items-center mb-6">
          <PageTitle>{t('delivery.deliveryConfig.titleNew')}</PageTitle>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content - Left Column (2 spans) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-lg">
              <ClientSection />
            </div>

            <div className="bg-white p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-4 text-[#0F172A]">{t('delivery.deliveryConfig.sectionProducts')}</h3>
              <ProductsSection />
            </div>

            <div className="bg-white p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-4 text-[#0F172A]">{t('delivery.deliveryConfig.sectionPayment')}</h3>
              <PaymentStatusSection />
            </div>
          </div>

          {/* Sidebar - Right Column (1 span) - Sticky */}
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-lg sticky top-6">
              <h3 className="text-lg font-semibold mb-4 text-[#0F172A]">{t('delivery.deliveryConfig.sectionSummary')}</h3>
              <div className="mb-6">
                <TotalSection />
              </div>
              <div className="pt-4 border-t border-gray-100">
                <ActionsSection />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ConfigurationApp;
