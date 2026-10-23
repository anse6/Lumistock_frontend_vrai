// DashboardCard.jsx

// Importation de l'icône depuis Ant Design
import { AreaChartOutlined } from '@ant-design/icons';

// Importation des composants personnalisés
import CardContainer from './CardContainer';
import CardHeader from './CardHeader';
import CardValue from './CardValue';
import CardFooter from './CardFooter';


const DashboardCard = ({
  title = 'Chiffre d\'affaires total',
  value = '952.6k cfa',
  percentage = '+8.5%',
  description = 'Rapport de semaines dernières',
  isPositive = true,
  icon = <AreaChartOutlined />,
  iconBackground = 'bg-green-50',
  iconColor = 'text-green-500',
  indicatorColor = 'bg-green-500',
  className = '',
}) => {
  return (
    <CardContainer className={className}>
      {/* En-tête avec titre et icône */}
      <CardHeader 
        title={title} 
        icon={icon} 
        iconBackground={iconBackground}
        iconColor={iconColor}
      />
      
      {/* Valeur principale avec indicateur coloré */}
      <CardValue 
        value={value} 
        indicatorColor={indicatorColor} 
      />
      
      {/* Pied de carte avec pourcentage et description */}
      <CardFooter 
        percentage={percentage} 
        description={description}
        isPositive={isPositive}
      />
    </CardContainer>
  );
};

export default DashboardCard;



