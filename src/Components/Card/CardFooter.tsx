// CardFooter.jsx

import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';

const CardFooter = ({ 
  percentage = '+8.5%', 
  description = 'Rapport de semaines dernières',
  isPositive = true
}) => {
  // Détermine la couleur du pourcentage en fonction de la valeur
  const percentageColor = isPositive ? 'text-green-500' : 'text-red-500';

  // Sélectionne l'icône (flèche vers le haut ou vers le bas)
  const IconComponent = isPositive ? ArrowUpOutlined : ArrowDownOutlined;

  return (
    <div className="flex items-center text-xs">
      {/* Icône directionnelle avec couleur et marge */}
      <IconComponent className={`mr-1 ${percentageColor}`} />

      {/* Pourcentage avec même couleur */}
      <span className={`font-medium ${percentageColor}`}>{percentage}</span>

      {/* Description complémentaire en gris */}
      <span className="text-gray-500 ml-2">{description}</span>
    </div>
  );
};

export default CardFooter;


