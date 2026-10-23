import React, { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { getUrlServer } from '../../../configServer';

interface Livreur {
  id: string;
  name: string;
  first_name: string;
}

interface LivreurFormProps {
  onSubmit?: (livreur: string, delai: number) => void;
}

const LivreurForm: React.FC<LivreurFormProps> = () => {
  const [selectedLivreur, setSelectedLivreur] = useState<string>('');
  const [livreurs, setLivreurs] = useState<Livreur[]>([]);
  const [delai, setDelai] = useState<number>(0);
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Récupérer les livreurs depuis l'API
  useEffect(() => {
    const fetchLivreurs = async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (!token) {
          throw new Error('Non authentifié');
        }

        const response = await fetch(`${getUrlServer()}/users/livreurs`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`Erreur HTTP: ${response.status}`);
        }

        const data = await response.json();
        setLivreurs(data.livreurs || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
      } finally {
        setLoading(false);
      }
    };

    fetchLivreurs();
  }, []);

  const handleLivreurChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedLivreur(e.target.value);
  };

  const handleDelaiChange = (value: number) => {
    setDelai(value);
    setIsDropdownOpen(false);
  };

  if (loading) {
    return <div className="text-center py-4">Chargement des livreurs...</div>;
  }

  if (error) {
    return <div className="text-center py-4 text-red-500">Erreur: {error}</div>;
  }

  return (
    <div className="w-full max-w-4xl">
      <div className="flex flex-row gap-4 items-end">
        {/* Champ Livreurs - maintenant une combobox */}
        <div className="flex-1">
          <label className="block text-sm font-medium mb-1">
            Livreurs <span className="text-red-500">*</span>
          </label>
          <select
            value={selectedLivreur}
            onChange={handleLivreurChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
          >
            <option value="">Sélectionnez un livreur</option>
            {livreurs.map((livreur) => (
              <option 
                key={livreur.id} 
                value={`${livreur.first_name} ${livreur.name}`}
              >
                {livreur.first_name} {livreur.name}
              </option>
            ))}
          </select>
        </div>

        {/* Champ Délai */}
        <div className="w-48">
          <label className="block text-sm font-medium mb-1">
            Délai
          </label>
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full flex justify-between items-center px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <span>{delai > 0 ? `${delai} Jours` : 'Jours'}</span>
              <ChevronDown size={16} />
            </button>

            {isDropdownOpen && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
                {[1, 2, 3, 5, 7, 10, 14, 21, 30].map((days) => (
                  <div
                    key={days}
                    onClick={() => handleDelaiChange(days)}
                    className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                  >
                    {days} Jours
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LivreurForm;


