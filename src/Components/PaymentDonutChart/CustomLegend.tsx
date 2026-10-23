// CustomLegend.jsx

/**
 * Composant `CustomLegend`
 * 
 * Ce composant génère une légende personnalisée pour un graphique.
 * Chaque élément de la légende est représenté par :
 * - un petit cercle coloré (correspondant à la couleur de la série du graphique),
 * - un libellé (nom de la série).
 * 
 * Ce composant est souvent utilisé avec des bibliothèques comme Recharts,
 * où `payload` est un tableau contenant les métadonnées des séries à afficher dans la légende.
 * 
 * Props :
 * - payload : tableau d’objets représentant les éléments à afficher dans la légende.
 *   Chaque objet contient au moins :
 *     - `color` : la couleur à afficher dans le cercle
 *     - `value` : le texte à afficher à côté du cercle
 */
const CustomLegend = ({ payload = [] }: { payload?: Array<{ color: string; value: string }> }) => {
    return (
      <div className="flex justify-between mt-4">
        {payload.map((entry: { color: string; value: string }, index: number) => (
          <div key={`legend-item-${index}`} className="flex items-center">
            {/* Cercle coloré représentant la série */}
            <div 
              className="w-3 h-3 rounded-full mr-2" 
              style={{ backgroundColor: entry.color }}
            />
            {/* Libellé de la série */}
            <span className="text-xs text-gray-500">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  };
  
  export default CustomLegend;
  


