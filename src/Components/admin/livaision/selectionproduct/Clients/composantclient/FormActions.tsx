import React from 'react';
import { Button, Space } from 'antd';
import { useTranslation } from 'react-i18next';

type FormActionsProps = {
  onAdd: () => void;
  onCancel: () => void;
  isLoading?: boolean;
};

const FormActions: React.FC<FormActionsProps> = ({ onAdd, onCancel, isLoading }) => {
  const { t } = useTranslation();
  return (
    <div className="flex justify-end mt-6">
      <Space>
        <Button
          onClick={onCancel}
          size="large"
          disabled={isLoading}
          style={{ borderColor: '#3b0764', color: '#3b0764' }}
        >
          {t('admin.deliveries.config.client.form.cancel')}
        </Button>
        <Button 
          type="primary" 
          onClick={onAdd}
          loading={isLoading}
          size="large"
          style={{ backgroundColor: '#3b0764' }}
        >
          {t('admin.deliveries.config.client.form.submit')}
        </Button>
      </Space>
    </div>
  );
};

export default FormActions;


