import React, { Dispatch, SetStateAction } from 'react';
import { Form } from 'antd';
import { UserPlus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import image from './../../../../../Modules/Delivery/images/cameroun.png';
import UploadBox from './composantclient/UploadBox';
import InputField from './composantclient/InputField';
import PhoneInput from './composantclient/PhoneInput';
import LocationInputs from './composantclient/LocationInputs';
import FormActions from './composantclient/FormActions';

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
    montantCaisse: string;
    setMontantCaisse: Dispatch<SetStateAction<string>>;
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
    montantCaisse,
    setMontantCaisse,
    onAdd,
    onCancel,
    isLoading,
    onFileSelected
}) => {
    const { t } = useTranslation();

    return (
        <div className="rounded-xl border border-purple-100 border-t-[3px] border-t-purple-950 bg-purple-50/40 p-4 sm:p-6">
            <div className="mb-5 flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-950 text-white">
                    <UserPlus size={18} />
                </span>
                <div>
                    <h3 className="text-base font-bold text-purple-950">{t('admin.deliveries.client.form.title')}</h3>
                    <p className="text-xs text-slate-500">Seul le nom est obligatoire.</p>
                </div>
            </div>

            <Form layout="vertical">
                <UploadBox onFileSelected={onFileSelected} />

                <InputField
                    label={t('admin.deliveries.client.form.name')}
                    required
                    value={clientName}
                    onChange={setClientName}
                    placeholder={t('admin.deliveries.client.form.namePlaceholder')}
                />

                <InputField
                    label={t('admin.deliveries.client.form.email')}
                    value={email}
                    onChange={setEmail}
                    placeholder={t('admin.deliveries.client.form.emailPlaceholder')}
                />

                <PhoneInput
                    phone={phone}
                    onChange={setPhone}
                    selectedCountry={selectedCountry}
                />

                <InputField
                    label={t('admin.deliveries.client.form.initialAmount')}
                    value={montantCaisse}
                    onChange={setMontantCaisse}
                    placeholder="ex: 50000"
                    type="number"
                    min={0}
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
            </Form>
        </div>
    );
};

export default AddClientForm;


