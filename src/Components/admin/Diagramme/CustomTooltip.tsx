// CustomTooltip.tsx - Composant pour l'infobulle

import { formatNumber } from './utils';

export const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-4 rounded shadow-md">
        <p className="text-gray-600">Revenu</p>
        <p className="text-[#0F172A] text-2xl font-medium">{formatNumber(payload[0].value)} cfa</p>
        <p className="text-gray-400">Vendredi, 22 Sep</p>
      </div>
    );
  }
  return null;
};


