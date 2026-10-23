// DetailApproModal.tsx
import React from 'react';

interface DetailApproModalProps {
  isOpen: boolean;
  onClose: () => void;
  approvisionnementId?: number;
}

const DetailApproModal: React.FC<DetailApproModalProps> = ({ 
  isOpen, 
  onClose,
  approvisionnementId 
}) => {
  if (!isOpen) return null;

  const tableData = [
    { id: 1, date: '17 mars 2025', delai: '7 jour', quantiteProduit: 150, quantiteRestant: 150, montant: '350,000 cfa', status: 'En cours' },
    { id: 2, date: '17 mars 2025', delai: '7 jour', quantiteProduit: 150, quantiteRestant: 150, montant: '350,000 cfa', status: 'En retard' },
    { id: 3, date: '17 mars 2025', delai: '7 jour', quantiteProduit: 150, quantiteRestant: 150, montant: '350,000 cfa', status: 'En cours' },
    { id: 4, date: '17 mars 2025', delai: '7 jour', quantiteProduit: 150, quantiteRestant: 150, montant: '350,000 cfa', status: 'En cours' },
    { id: 5, date: '17 mars 2025', delai: '7 jour', quantiteProduit: 150, quantiteRestant: 150, montant: '350,000 cfa', status: 'En cours' },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <div className="min-h-screen bg-gray-50 p-6">
          <div className="max-w-7xl mx-auto bg-white rounded-lg shadow-sm">
            <div className="p-4 text-sm">
              <span className="text-[#0F172A]">Approvisionnement</span>
              <span className="mx-1 text-gray-500">&gt;</span>
              <span className="text-gray-700">Jean Francis (ID: {approvisionnementId})</span>
            </div>

            <div className="px-4 pb-4">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded-full bg-pink-100 flex items-center justify-center text-xl font-semibold text-pink-800">
                    JF
                  </div>
                  <div className="ml-3 font-medium">Jean Francis</div>
                </div>

                <div className="bg-slate-50 rounded-md py-2 px-4 text-sm">
                  <span className="font-medium">Quantités Total: </span>
                  <span>2300</span>
                </div>
                <div className="bg-pink-50 rounded-md py-2 px-4 text-sm">
                  <span className="font-medium">Quantités restant: </span>
                  <span>549</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-4 px-4 py-3 border-t border-gray-100">
              <div>
                <div className="text-sm text-gray-500 mb-1">Status</div>
                <div className="bg-blue-50 text-blue-600 text-xs rounded-md py-1 px-3 inline-block">En cours</div>
              </div>
              <div>
                <div className="text-sm text-gray-500 mb-1">Montant</div>
                <div className="font-medium">1,763,800 cfa</div>
              </div>
              <div>
                <div className="text-sm text-gray-500 mb-1">Crée le</div>
                <div>17 mars 2025</div>
              </div>
              <div>
                <div className="text-sm text-gray-500 mb-1">Modifier le</div>
                <div>23 avril 2025</div>
              </div>
            </div>

            <div className="px-4 py-4 overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="text-left text-sm text-gray-500">
                    <th className="py-3 pr-4">Date</th>
                    <th className="py-3 px-4">Délai</th>
                    <th className="py-3 px-4">Quantité de produit</th>
                    <th className="py-3 px-4">Quantité restant</th>
                    <th className="py-3 px-4">Montant</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {tableData.map((row) => (
                    <tr key={row.id} className="border-t border-gray-100">
                      <td className="py-3 pr-4 text-sm">{row.date}</td>
                      <td className="py-3 px-4 text-sm">{row.delai}</td>
                      <td className="py-3 px-4 text-sm">{row.quantiteProduit}</td>
                      <td className="py-3 px-4 text-sm">{row.quantiteRestant}</td>
                      <td className="py-3 px-4 text-sm">{row.montant}</td>
                      <td className="py-3 px-4">
                        <span className={`text-xs px-3 py-1 rounded-md ${
                          row.status === 'En cours' 
                            ? 'bg-blue-50 text-blue-600' 
                            : 'bg-red-50 text-red-600'
                        }`}>
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-4 flex justify-end">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
                className="px-4 py-2 bg-[#0F172A] text-white rounded-md hover:bg-[#1E293B]"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailApproModal;


