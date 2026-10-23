// AddClientForm.tsx
import React, { Dispatch, SetStateAction } from 'react';
import image from "../images/cameroun.png";
import UploadBox from './composantclient/UploadBox';
import InputField from './composantclient/InputField';
import PhoneInput from './composantclient/PhoneInput';
import LocationInputs from './composantclient/LocationInputs';
import FormActions from './composantclient/FormActions';
import { useTranslation } from 'react-i18next';

type ClientFormProps = {
  clientName: string;
  setClientName: Dispatch<SetStateAction<string>>;
  city: string;
  setCity: Dispatch<SetStateAction<string>>;
  phone: string;
  setPhone: Dispatch<SetStateAction<string>>;
  district: string;
  setDistrict: Dispatch<SetStateAction<string>>;
  email: string;
  setEmail: Dispatch<SetStateAction<string>>;
  onAdd: () => void;
  onCancel: () => void;
  isLoading: boolean;
  onFileSelected: (file: File | null) => void;
};

const selectedCountry = {
  code: 'CM',
  name: 'Cameroun',
  prefix: '+237',
  flagUrl: image
};

const AddClientForm: React.FC<ClientFormProps> = ({
  clientName,
  setClientName,
  city,
  setCity,
  phone,
  setPhone,
  district,
  setDistrict,
  email,
  setEmail,
  onAdd,
  onCancel,
  isLoading,
  onFileSelected
}) => {
  const { t } = useTranslation();
  return (
    <div className="p-6 rounded-[10px] border-t-[3px] border-[#B4B4B4] bg-[#F5F5F5]">
      <h2 className="text-xl font-medium mb-4">{t('delivery.deliveryConfig.clientProfileTitle')}</h2>

      <UploadBox onFileSelected={onFileSelected} />

      <InputField
        label={t('delivery.deliveryConfig.clientNameLabel')}
        required
        value={clientName}
        onChange={setClientName}
        placeholder={t('delivery.deliveryConfig.clientNamePlaceholder')}
      />

      <InputField
        label={t('delivery.deliveryConfig.clientEmailLabel')}
        required
        value={email}
        onChange={setEmail}
        placeholder={t('delivery.deliveryConfig.clientEmailPlaceholder')}
      />

      <PhoneInput
        phone={phone}
        onChange={setPhone}
        selectedCountry={selectedCountry}
      />

      <LocationInputs
        city={city}
        district={district}
        onCityChange={setCity}
        onDistrictChange={setDistrict}
      />

      <FormActions 
        onAdd={onAdd} 
        onCancel={onCancel}
        isLoading={isLoading}
      />
    </div>
  );
};

export default AddClientForm;


