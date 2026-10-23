// PaymentDonutChart.jsx

// Importation des bibliothèques nécessaires et des composants
import { Card, Typography } from 'antd';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';
import CustomLegend from './CustomLegend'; // Composant Légende personnalisé

const { Title } = Typography;

// Données par défaut pour le graphique en donut
const defaultData = [
  { name: 'Payé Entièrement', value: 65, color: '#8B5CF6' },
  { name: 'Pas totalement payé', value: 30, color: '#DDD6FE' },
  { name: 'Non payé', value: 5, color: '#FBCFE8' },
];

/**
 * Composant `PaymentDonutChart`
 * 
 * Ce composant affiche un graphique en donut représentant les statistiques de paiement.
 * Les différentes catégories de paiement sont visualisées avec des portions colorées et les 
 * pourcentages sont affichés sur le graphique. Il inclut également une légende personnalisée.
 * 
 * Props :
 * - title : le titre du graphique (par défaut 'Statistiques de paiement').
 * - data : les données à afficher sur le graphique (par défaut, un jeu de données préconfiguré).
 * - className : une classe CSS optionnelle pour le style supplémentaire.
 */
const PaymentDonutChart = ({
  title = 'Statistiques de paiement',
  data = defaultData,
  className = '',
}) => {
  return (
    <Card className={`shadow-sm ${className}`} bodyStyle={{ padding: '20px' }}>
      {/* Titre du graphique */}
      <Title level={4} className="mb-6 font-medium">{title}</Title>
      
      <div className="h-64 relative">
        {/* Conteneur pour le graphique responsive */}
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            {/* Graphique en donut */}
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              dataKey="value"
              stroke="none"
              paddingAngle={2}
            >
              {/* Dessin des segments du donut avec les couleurs définies */}
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            {/* Légende personnalisée */}
            <Legend 
              content={<CustomLegend />} 
              layout="horizontal"
              verticalAlign="bottom"
              align="center"
            />
          </PieChart>
        </ResponsiveContainer>
        
        {/* Labels affichés au centre des segments du donut */}
        {data.map((entry, index) => {
          // Positionner les labels des pourcentages
          let x, y;
          switch(index) {
            case 0: // Payé entièrement (65%)
              x = '75%';
              y = '35%';
              break;
            case 1: // Pas totalement payé (30%)
              x = '32%';
              y = '70%';
              break;
            case 2: // Non payé (5%)
              x = '58%';
              y = '58%';
              break;
            default:
              x = '50%';
              y = '50%';
          }
          
          return (
            <div 
              key={`label-${index}`}
              className="absolute bg-gray-100 bg-opacity-80 rounded-md px-2 py-1 text-xs"
              style={{
                left: x,
                top: y,
                transform: 'translate(-50%, -50%)',
              }}
            >
              {`${entry.value}%`}
            </div>
          );
        })}
      </div>
    </Card>
  );
};

export default PaymentDonutChart;



