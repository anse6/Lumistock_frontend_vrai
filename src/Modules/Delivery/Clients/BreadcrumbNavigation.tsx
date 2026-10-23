import React from 'react';
import { Link } from 'react-router-dom';

type BreadcrumbNavigationProps = {
  paths: string[];
};

export const BreadcrumbNavigation: React.FC<BreadcrumbNavigationProps> = ({ paths }) => {
  return (
    <div className="text-sm text-[#0F172A] mb-4 flex items-center space-x-2">
      <Link to="/dashboard/delivery" className="hover:underline">
        {paths[0]}
      </Link>
      <span>&gt;</span>
      <Link to="/dashboard/delivery/new-delivery" className="hover:underline text-[#0F172A]">
        {paths[1]}
      </Link>
      <span>&gt;</span>
      <span className="text-black">{paths[2]}</span>
    </div>
  );
};



