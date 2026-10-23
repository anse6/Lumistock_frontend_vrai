
const CardValue = ({ 
  value = '952.6k cfa', 
  indicatorColor = 'bg-green-400',
  valueClassName = 'text-3xl font-bold' 
}) => {
  return (
    <div className="flex items-center mb-3">
      {/* Indicateur coloré vertical */}
      <div className={`w-1 h-12 rounded-full mr-3 ${indicatorColor}`}></div>

      {/* Valeur affichée */}
      <div className={valueClassName}>{value}</div>
    </div>
  );
};

export default CardValue;



