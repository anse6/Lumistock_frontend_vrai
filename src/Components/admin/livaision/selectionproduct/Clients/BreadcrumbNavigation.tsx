import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

type BreadcrumbNavigationProps = {
  paths: string[];
};

export const BreadcrumbNavigation: React.FC<BreadcrumbNavigationProps> = ({ paths }) => {
  const { t } = useTranslation();
  
  return (
    <div className="text-sm text-[#0F172A] mb-4 flex items-center space-x-2">
      <Link to="/admin/dashboard/deliverys" className="hover:underline">
        {paths && paths[0] ? paths[0] : t('sidebar.delivery')}
      </Link>
      <span>&gt;</span>
      <Link to="/admin/dashboard/deliverys/develive" className="hover:underline text-[#0F172A]">
        {paths && paths[1] ? paths[1] : t('admin.deliveries.new.breadcrumb')}
      </Link>
      <span>&gt;</span>
      <span className="text-black">{paths && paths[2] ? paths[2] : t('admin.deliveries.config.breadcrumb')}</span>
    </div>
  );
};



