
import { ArrowUpOutlined } from '@ant-design/icons';


const CardHeader = ({ 
  title = 'Chiffre d\'affaires total', 
  icon = <ArrowUpOutlined />, 
  iconBackground = 'bg-green-50',
  iconColor = 'text-green-500'
}) => {
  return (
    <div className="flex justify-between items-start mb-4">
      {/* Titre de la carte */}
      <div className="text-sm text-gray-600 font-medium">{title}</div>

      {/* Conteneur de l'icône avec fond et bord arrondi */}
      <div className={`p-2 rounded-full ${iconBackground}`}>
        <span className={iconColor}>{icon}</span>
      </div>
    </div>
  );
};

export default CardHeader;



