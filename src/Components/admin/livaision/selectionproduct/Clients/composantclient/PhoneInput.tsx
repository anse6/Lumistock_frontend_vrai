import React from 'react';
import { Input, Form } from 'antd';
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
    <Form.Item label={t('admin.deliveries.config.client.form.phone')} style={{ marginBottom: '16px' }}>
      <Input
        value={phone}
        onChange={(e) => {
          // Optionnel : s'assurer qu'on n'entre que des chiffres
          const value = e.target.value.replace(/\D/g, '');
          if (value.length <= 9) {
            onChange(value);
          }
        }}
        placeholder="698 743 562"
        size="large"
        maxLength={9}
        prefix={
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginRight: '8px', borderRight: '1px solid #d9d9d9', paddingRight: '12px' }}>
            <img
              src={selectedCountry.flagUrl}
              alt={t('reports.table.client')}
              style={{ width: '24px', height: '16px', objectFit: 'cover' }}
            />
            <span style={{ fontSize: '14px', color: '#595959' }}>{selectedCountry.prefix}</span>
          </div>
        }
      />
    </Form.Item>
  );
};

export default PhoneInput;


