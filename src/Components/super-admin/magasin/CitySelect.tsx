import React, { useMemo, useState } from 'react';
import { Select } from 'antd';

interface CitySelectProps {
  /** Fourni par Form.Item : relie le libellé « Ville » au champ. */
  id?: string;
  value?: string;
  onChange?: (value?: string) => void;
  /** Appelé quand l'utilisateur change de ville (ex. pour vider le quartier). */
  onCityChange?: (value?: string) => void;
  cities: string[];
  loading?: boolean;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

// Liste de villes avec recherche. Si la ville tapée n'existe pas dans la
// liste du pays, l'utilisateur peut quand même la choisir : la sélection
// n'est jamais bloquée, même pour un pays peu référencé.
const CitySelect: React.FC<CitySelectProps> = ({
  id, value, onChange, onCityChange, cities, loading, disabled, placeholder, className,
}) => {
  const [search, setSearch] = useState('');

  const options = useMemo(() => {
    const list = cities.map((city) => ({ value: city, label: city }));
    const typed = search.trim();
    const exists = typed && cities.some((city) => city.localeCompare(typed, 'fr', { sensitivity: 'base' }) === 0);
    if (typed && !exists) {
      list.unshift({ value: typed, label: `Utiliser « ${typed} »` });
    }
    // Une ville enregistrée hors liste doit rester affichée en modification.
    if (value && !list.some((option) => option.value === value)) {
      list.unshift({ value, label: value });
    }
    return list;
  }, [cities, search, value]);

  return (
    <Select
      id={id}
      showSearch
      allowClear
      value={value}
      placeholder={placeholder}
      disabled={disabled}
      loading={loading}
      options={options}
      optionFilterProp="label"
      filterOption={(input, option) =>
        option?.value === input.trim() ||
        String(option?.label ?? '').toLowerCase().includes(input.trim().toLowerCase())
      }
      onSearch={setSearch}
      onChange={(next?: string) => {
        setSearch('');
        onChange?.(next);
        onCityChange?.(next);
      }}
      notFoundContent={loading ? 'Chargement des villes…' : 'Tapez le nom de la ville'}
      className={className}
    />
  );
};

export default CitySelect;
