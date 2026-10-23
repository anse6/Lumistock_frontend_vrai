import React from 'react';

type Client = {
  id: number;
  name: string;
  initials: string;
  purchaseAmount: string;
  value: number;
  avatarColor: string;
};

const TopClients: React.FC = () => {
  const clients: Client[] = [
    { id: 1, name: 'Jean Pierre', initials: 'JP', purchaseAmount: '332,000 cfa', value: 35, avatarColor: 'bg-slate-100 text-[#0F172A]' },
    { id: 2, name: 'Steve Adam', initials: 'SA', purchaseAmount: '289,000 cfa', value: 20, avatarColor: 'bg-green-100 text-green-500' },
    { id: 3, name: 'Kenne Stephan', initials: 'KS', purchaseAmount: '137,000 cfa', value: 12, avatarColor: 'bg-red-50 text-red-400' },
    { id: 4, name: 'Samuel Dikongue', initials: 'SD', purchaseAmount: '111,500 cfa', value: 9, avatarColor: 'bg-blue-50 text-blue-400' },
    { id: 5, name: 'Robert John', initials: 'JR', purchaseAmount: '92,000 cfa', value: 35, avatarColor: 'bg-gray-200 text-gray-700' }
  ];

  return (
    <div className="bg-white rounded-lg p-4 sm:p-5 md:p-6 shadow-sm w-full max-w-4xl mx-auto font-lora">
      <div className="flex justify-between items-center mb-4 sm:mb-5 md:mb-6">
        <h1 className="text-base sm:text-lg md:text-1xl font-bold">Meilleurs Clients</h1>
        <button className="text-gray-400">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      <div className="space-y-2 sm:space-y-3 md:space-y-4">
        {clients.map((client) => (
          <div key={client.id} className="flex items-center justify-between">
            <div className="flex items-center">
              <div className={`w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-lg flex items-center justify-center ${client.avatarColor} mr-2 sm:mr-3 md:mr-4`}>
                <span className="text-xs sm:text-sm md:text-base font-semibold">{client.initials}</span>
              </div>
              <div>
                <p className="text-[10px] sm:text-xs md:text-sm text-gray-600">{client.name}</p>
                <p className="text-base sm:text-lg md:text-xl font-bold">{client.value}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs sm:text-sm md:text-base font-medium">{client.purchaseAmount}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TopClients;



