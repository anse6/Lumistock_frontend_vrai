import React from 'react';
import { useTranslation } from 'react-i18next';

type PhoneInputProps = {
  phone: string;
  onChange: (val: string) => void;
  selectedCountry: {
    prefix: string;
    flagUrl: string;
    name: string;
  };
};

const PhoneInput: React.FC<PhoneInputProps> = ({ phone, onChange, selectedCountry }) => {
  const { t } = useTranslation();
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium mb-1">{t('delivery.deliveryConfig.phoneLabel')}</label>
      <div className="flex items-center border border-gray-300 rounded-md bg-white overflow-hidden">
        <div className="flex items-center px-2 gap-1">
          <img
            src={selectedCountry.flagUrl}
            alt={`Drapeau ${selectedCountry.name}`}
            className="w-6 h-4 object-cover"
          />
          <span className="text-sm text-gray-600">{selectedCountry.prefix}</span>
        </div>
        <input
          type="tel"
          value={phone}
          onChange={(e) => onChange(e.target.value)}
          placeholder="698 743 562"
          className="flex-grow p-3 pl-4 border-l border-gray-300 focus:outline-none"
        />
      </div>
    </div>
  );
};

export default PhoneInput;


