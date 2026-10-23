import React from 'react';
import { useTranslation } from 'react-i18next';

type FormActionsProps = {
  onAdd: () => void;
  onCancel: () => void;
  isLoading?: boolean;
};

const FormActions: React.FC<FormActionsProps> = ({ onAdd, onCancel, isLoading }) => {
  const { t } = useTranslation();
  return (
    <div className="flex justify-end gap-3 mt-6">
      <button
        onClick={onCancel}
        className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
      >
        {t('delivery.deliveryConfig.formActionCancel')}
      </button>
      <button
        onClick={onAdd}
        disabled={isLoading}
        className={`px-4 py-2 rounded-md text-white ${isLoading ? 'bg-slate-400' : 'bg-[#0F172A] hover:bg-[#1E293B]'}`}
      >
        {isLoading ? t('delivery.deliveryConfig.formActionSaving') : t('delivery.deliveryConfig.formActionSave')}
      </button>
    </div>
  );
};

export default FormActions;


