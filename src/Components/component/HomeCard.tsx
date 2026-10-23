import React from 'react';

interface HomeCardProps {
    title: string;
    children: React.ReactNode;
    className?: string;
    bodyClassName?: string;
}

const HomeCard: React.FC<HomeCardProps> = ({ title, children, className = "", bodyClassName = "" }) => (
  <div
    className={`px-4 pt-4 pb-2 border rounded-custom shadow-sm  ${className}`}
  >
    <h3 className="text-lg font-semibold text-primary">{title}</h3>
    <div className={`mt-2 h-full ${bodyClassName}`}>{children}</div>
  </div>
);

export default HomeCard;
