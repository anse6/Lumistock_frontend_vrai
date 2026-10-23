// CustomTooltip.jsx

/**
 * Composant `CustomTooltip`
 * 
 * Ce composant affiche un tooltip personnalisé pour un graphique, généralement utilisé dans
 * des bibliothèques comme Recharts. Le tooltip s'affiche lorsque l'utilisateur survole un élément du graphique.
 * 
 * Il affiche :
 * - un titre (par exemple "Revenu"),
 * - la valeur associée au point de données (formatée avec des séparateurs de milliers),
 * - une date (par défaut, la date affichée est "22 Sep").
 * 
 * Props :
 * - active : détermine si le tooltip est actif ou non (s'il doit être affiché).
 * - payload : tableau contenant les données associées au point de données du graphique.
 * - label : étiquette associée au point de données (souvent la date ou la catégorie).
 * 
 * Le tooltip ne s'affiche que lorsque `active` est vrai et que `payload` contient des données.
 */
const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: any[]; label?: string }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 shadow-md rounded-md border border-gray-100">
          {/* Titre du tooltip */}
          <p className="text-[#0F172A] font-medium">Revenu</p>
          
          {/* Valeur du tooltip avec formatage */}
          <p className="text-[#0F172A] font-medium text-lg">{`${payload[0].value.toLocaleString()} cfa`}</p>
          
          {/* Label (ex. date) */}
          <p className="text-gray-500 text-sm">{`${label}, 22 Sep`}</p>
        </div>
      );
    }
    return null;
  };
  
  export default CustomTooltip;
  


