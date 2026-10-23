import React from 'react';
import { useTranslation } from 'react-i18next';

type LocationInputsProps = {
  city: string;
  district: string;
  onCityChange: (val: string) => void;
  onDistrictChange: (val: string) => void;
};

const LocationInputs: React.FC<LocationInputsProps> = ({
  city,
  district,
  onCityChange,
  onDistrictChange
}) => {
  const { t } = useTranslation();
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
      <div>
        <label className="block text-sm font-medium mb-1">{t('delivery.deliveryConfig.locationCity')}</label>
        <input
          type="text"
          value={city}
          onChange={(e) => onCityChange(e.target.value)}
          placeholder={t('delivery.deliveryConfig.locationCityPlaceholder')}
          className="w-full p-3 border border-gray-300 rounded-md bg-white"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">{t('delivery.deliveryConfig.locationDistrict')}</label>
        <input
          type="text"
          value={district}
          onChange={(e) => onDistrictChange(e.target.value)}
          placeholder={t('delivery.deliveryConfig.locationDistrictPlaceholder')}
          className="w-full p-3 border border-gray-300 rounded-md bg-white"
        />
      </div>
    </div>
  );
};

export default LocationInputs;



