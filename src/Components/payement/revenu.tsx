// RevenueLineChart.jsx

// Importation des bibliothèques nécessaires et des composants
import { useState } from 'react';
import { Card, Radio, Typography } from 'antd';
import type { RadioChangeEvent } from 'antd';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { CaretUpOutlined } from '@ant-design/icons';; // Composant Tooltip personnalisé

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: any[]; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-4 shadow-md rounded-md border border-gray-100">
        <p className="text-[#0F172A] font-medium">Revenu</p>
        <p className="text-[#0F172A] font-medium text-lg">{`${payload[0].value.toLocaleString()} cfa`}</p>
        <p className="text-gray-500 text-sm">{label}</p>
      </div>
    );
  }
  return null;
};

const { Title, Text } = Typography;

// Données par défaut pour le graphique (jour et revenu)
const data = [
  { name: 'Lundi', value: 10000 },
  { name: 'Mardi', value: 48000 },
  { name: 'Mercredi', value: 62000 },
  { name: 'Jeudi', value: 53000 },
  { name: 'Vendredi', value: 55642 },
  { name: 'Samedi', value: 22000 },
  { name: 'Dimanche', value: 68000 },
];

/**
 * Composant `RevenueLineChart`
 * 
 * Ce composant affiche un graphique en ligne représentant l'évolution des revenus au cours de la semaine.
 * Il permet à l'utilisateur de sélectionner différents intervalles de temps (jour, semaine, mois, année) pour
 * visualiser les revenus selon l'intervalle sélectionné. Le graphique est accompagné d'une légende affichant
 * les informations principales (revenu total, pourcentage de croissance, etc.).
 * 
 * Props :
 * - title : le titre du graphique (par défaut 'Revenue').
 * - totalRevenue : le revenu total à afficher (par défaut '91,642 cfa').
 * - growthPercentage : le pourcentage de croissance par rapport à la période précédente (par défaut '+3.4%').
 * - growthLabel : le libellé associé à la croissance (par défaut 'from last period').
 * - timeRanges : tableau contenant les différentes options d'intervalle de temps (par défaut ['Jour', 'Semaine', 'Mois', 'Année']).
 * - defaultTimeRange : l'intervalle de temps sélectionné par défaut (par défaut 'Semaine').
 * - chartData : les données à afficher sur le graphique (par défaut les données de la semaine).
 * - highlightedDay : jour à mettre en surbrillance dans le graphique (par défaut 'Vendredi').
 * - className : une classe CSS optionnelle pour le style supplémentaire.
 */
const RevenueLineChart = ({
  title = 'Revenueyt',
  totalRevenue = '91,642 cfa',
  growthPercentage = '+3.4%',
  growthLabel = 'from last period',
  timeRanges = ['Jour', 'Semaine', 'Mois', 'Année'],
  defaultTimeRange = 'Semaine',
  chartData = data,
  highlightedDay = 'Vendredi',
  className = '',
}) => {
  // État pour gérer l'intervalle de temps sélectionné
  const [selectedTimeRange, setSelectedTimeRange] = useState(defaultTimeRange);

  // Fonction pour gérer le changement d'intervalle de temps
  const handleTimeRangeChange = (e: RadioChangeEvent) => {
    setSelectedTimeRange(e.target.value);
  };

  // Trouver l'index du jour mis en surbrillance
  const highlightIndex = chartData.findIndex(item => item.name === highlightedDay);

  return (
    <Card className={`shadow-sm ${className}`} bodyStyle={{ padding: '20px' }}>
      <div className="flex justify-between items-center mb-4">
        <div>
          {/* Titre et revenu total */}
          <div className="flex items-center mb-1">
            <Text className="text-gray-500">{title}</Text>
            <span className="ml-2 text-gray-400">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                <path d="M7 10l5 5 5-5z" />
              </svg>
            </span>
          </div>
          <Title level={3} className="m-0 font-bold">{totalRevenue}</Title>
          <div className="flex items-center mt-1">
            {/* Icône de croissance */}
            <CaretUpOutlined className="text-green-500" />
            <Text className="text-green-500 mr-1">{growthPercentage}</Text>
            <Text className="text-gray-400 text-sm">{growthLabel}</Text>
          </div>
        </div>

        {/* Sélecteur d'intervalle de temps */}
        <Radio.Group 
          value={selectedTimeRange} 
          onChange={handleTimeRangeChange}
          optionType="button"
          buttonStyle="solid"
          className="custom-radio-group"
        >
          {timeRanges.map(range => (
            <Radio.Button 
              key={range} 
              value={range}
              className={`${
                selectedTimeRange === range 
                  ? 'bg-slate-100 text-[#0F172A] border-slate-200' 
                  : 'text-gray-500 border-gray-200'
              }`}
            >
              {range}
            </Radio.Button>
          ))}
        </Radio.Group>
      </div>

      {/* Conteneur du graphique */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
          >
            {/* Définition des couleurs et du dégradé */}
            <defs>
              <linearGradient id="colorRevenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
              </linearGradient>
            </defs>
            {/* Grille du graphique */}
            <CartesianGrid vertical={false} stroke="#f0f0f0" />
            {/* Axe X (jours) */}
            <XAxis 
              dataKey="name" 
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#6B7280', fontSize: 12 }}
            />
            {/* Axe Y (valeurs de revenu) */}
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#6B7280', fontSize: 12 }}
              tickFormatter={(value) => `${value / 1000}k`}
              domain={[0, 100000]}
              ticks={[0, 20000, 50000, 70000, 100000]}
            />
            {/* Tooltip personnalisé */}
            <Tooltip content={(props) => <CustomTooltip {...props} />} />
            {/* Ligne représentant les valeurs de revenu */}
            <Line
              type="monotone"
              dataKey="value"
              stroke="#8B5CF6"
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 8, fill: '#8B5CF6', stroke: '#fff', strokeWidth: 2 }}
              fill="url(#colorRevenueGradient)"
            />
            {/* Affichage d'un point mis en surbrillance pour un jour spécifique */}
            {highlightIndex >= 0 && (
              <Line
                data={[chartData[highlightIndex]]}
                dataKey="value"
                stroke="transparent"
                dot={{
                  r: 6,
                  fill: '#8B5CF6',
                  stroke: '#fff',
                  strokeWidth: 2,
                }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

export default RevenueLineChart;



