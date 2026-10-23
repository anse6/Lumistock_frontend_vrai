// src/components/PageTitle.tsx (ou dans un dossier de ton choix)
import React from 'react';

interface PageTitleProps {
  children: React.ReactNode;
}

const PageTitle: React.FC<PageTitleProps> = ({ children }) => {
  return (
    <h1 className="text-2xl font-bold mb-6" style={{ fontFamily: 'Poppins, sans-serif' }}>
      {children}
    </h1>
  );
};

export default PageTitle;



