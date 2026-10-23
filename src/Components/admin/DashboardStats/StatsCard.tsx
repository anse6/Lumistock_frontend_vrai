import React, { useState } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

export type StatCardProps = {
  title: string;
  value: string;
  change: number;
  icon: React.ReactNode;
  barColor: string;
  period: string;
};

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  change,
  icon,
  barColor,
  period,
}) => {
  const isPositive = change >= 0;
  const [showTooltip, setShowTooltip] = useState(false);

  // Fonction pour tronquer le texte et gérer l'affichage
  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  // Fonction pour déterminer si le texte doit être tronqué
  const shouldTruncate = (text: string, isMobile: boolean) => {
    const maxLength = isMobile ? 8 : 12;
    return text.length > maxLength;
  };

  return (
    <div className="bg-white rounded-md xs:rounded-lg shadow-sm p-1.5 xs:p-2 sm:p-3 md:p-4 relative overflow-hidden flex flex-col h-full min-h-[80px] xs:min-h-[90px] sm:min-h-[110px]">
      {/* Barre de couleur verticale ultra-fine sur mobile */}
      <div className={`absolute left-1 xs:left-1.5 sm:left-2 md:left-3 top-1.5 xs:top-2 sm:top-3 md:top-4 bottom-1.5 xs:bottom-2 sm:bottom-3 md:bottom-4 w-0.5 xs:w-1 ${barColor} rounded-full`}></div>

      {/* Contenu de la carte */}
      <div className="pl-2 xs:pl-3 sm:pl-4 md:pl-5">
        <div className="flex justify-between items-start mb-0.5 xs:mb-1 sm:mb-2">
          <div 
            className="relative"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
          >
            <p className="text-[10px] xs:text-xs sm:text-sm text-gray-500 leading-tight">
              <span className="sm:hidden">
                {truncateText(title, 12)}
              </span>
              <span className="hidden sm:inline">
                {title}
              </span>
            </p>
            
            {/* Tooltip pour le titre complet sur mobile */}
            {showTooltip && shouldTruncate(title, true) && (
              <div className="absolute top-full left-0 mt-1 z-50 bg-gray-800 text-white text-[10px] px-2 py-1 rounded shadow-lg whitespace-nowrap sm:hidden">
                {title}
              </div>
            )}
          </div>
          <div className="text-gray-400 flex-shrink-0">{icon}</div>
        </div>

        <div 
          className="relative mb-0.5 xs:mb-1 sm:mb-2"
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          <h2 className="text-sm xs:text-base sm:text-xl md:text-2xl font-bold leading-tight">
            <span className="sm:hidden">
              {shouldTruncate(value, true) ? truncateText(value, 8) : value}
            </span>
            <span className="hidden sm:inline">
              {value}
            </span>
          </h2>
          
          {/* Tooltip pour la valeur complète sur mobile */}
          {showTooltip && shouldTruncate(value, true) && (
            <div className="absolute top-full left-0 mt-1 z-50 bg-gray-800 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap sm:hidden">
              {value}
            </div>
          )}
        </div>

        <div className="flex items-center text-[8px] xs:text-[9px] sm:text-xs leading-tight">
          <div className={`flex items-center ${isPositive ? 'text-green-500' : 'text-red-500'} mr-1 xs:mr-1.5 sm:mr-2`}>
            {isPositive ? (
              <TrendingUp size={8} className="xs:w-3 xs:h-3 sm:w-4 sm:h-4 mr-0.5 xs:mr-1" />
            ) : (
              <TrendingDown size={8} className="xs:w-3 xs:h-3 sm:w-4 sm:h-4 mr-0.5 xs:mr-1" />
            )}
            <span className="font-medium">{Math.abs(change).toFixed(1)}%</span>
          </div>
          <span className="text-gray-500 text-[7px] xs:text-[8px] sm:text-xs truncate">
            <span className="sm:hidden">/ sem.</span>
            <span className="hidden sm:inline">/ {period}</span>
          </span>
        </div>
      </div>
    </div>
  );
};

export default StatCard;


