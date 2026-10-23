// DashboardStatsGrid.jsx
import { useState, useEffect } from 'react';
import { Carousel } from 'antd';
import DashboardCard from './DashboardCard';
import { 
  DollarOutlined, 
  CarOutlined,
  TeamOutlined,
  AppstoreOutlined
} from '@ant-design/icons';

const DashboardStatsGrid = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const cardsData = [
    {
      title: "Chiffre d'affaires total",
      value: "952.6k cfa",
      percentage: "+8.5%",
      description: "Par rapport au mois dernier",
      isPositive: true,
      icon: <DollarOutlined />,
      iconBackground: "bg-green-50",
      iconColor: "text-green-500",
      indicatorColor: "bg-green-500"
    },
    {
      title: "Livraisons totales",
      value: "1,245",
      percentage: "-12.4%",
      description: "Par rapport au mois dernier",
      isPositive: false,
      icon: <CarOutlined />,
      iconBackground: "bg-blue-50",
      iconColor: "text-blue-500",
      indicatorColor: "bg-blue-500"
    },
    {
      title: "Clients Total",
      value: "450",
      percentage: "+3.2%",
      description: "Par rapport au mois dernier",
      isPositive: true,
      icon: <TeamOutlined />,
      iconBackground: "bg-amber-50",
      iconColor: "text-amber-500",
      indicatorColor: "bg-amber-500"
    },
    {
      title: "Produits Total",
      value: "450",
      percentage: "-3.2%",
      description: "Par rapport au mois dernier",
      isPositive: false,
      icon: <AppstoreOutlined />,
      iconBackground: "bg-amber-50",
      iconColor: "text-amber-500",
      indicatorColor: "bg-amber-500"
    }
  ];

  return (
    <div className="w-full">
      {isMobile ? (
        <Carousel 
          dots={true} 
          dotPosition="bottom"
          className="px-4 py-2"
        >
          {cardsData.map((card, index) => (
            <div key={index} className="px-2">
              <DashboardCard {...card} />
            </div>
          ))}
        </Carousel>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {cardsData.map((card, index) => (
            <DashboardCard key={index} {...card} />
          ))}
        </div>
      )}
    </div>
  );
};

export default DashboardStatsGrid;


