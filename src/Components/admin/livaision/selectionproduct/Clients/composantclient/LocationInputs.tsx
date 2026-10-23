// Fichier: src/components/composantclient/LocationInputs.tsx
import React from 'react';
import { Input, Form, Row, Col } from 'antd';
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
    <Row gutter={16} style={{ marginBottom: '16px' }}>
      <Col xs={24} sm={12}>
        <Form.Item label={t('admin.deliveries.config.client.form.city')} style={{ marginBottom: 0 }}>
          <Input
            value={city}
            onChange={(e) => onCityChange(e.target.value)}
            placeholder={t('admin.deliveries.config.client.form.city')}
            size="large"
          />
        </Form.Item>
      </Col>
      <Col xs={24} sm={12}>
        <Form.Item label={t('admin.deliveries.config.client.form.district')} style={{ marginBottom: 0 }}>
          <Input
            value={district}
            onChange={(e) => onDistrictChange(e.target.value)}
            placeholder={t('admin.deliveries.config.client.form.district')}
            size="large"
          />
        </Form.Item>
      </Col>
    </Row>
  );
};

export default LocationInputs;



