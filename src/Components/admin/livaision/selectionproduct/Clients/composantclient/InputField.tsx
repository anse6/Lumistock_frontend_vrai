// Fichier: src/components/composantclient/InputField.tsx
import React from 'react';
import { Input, Form } from 'antd';

type InputFieldProps = {
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  required?: boolean;
  type?: string;
  min?: number;
};

const InputField: React.FC<InputFieldProps> = ({ label, value, onChange, placeholder, required, type = "text", min }) => (
  <Form.Item 
    label={label} 
    required={required}
    style={{ marginBottom: '16px' }}
  >
    <Input
      type={type}
      min={min}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      size="large"
    />
  </Form.Item>
);

export default InputField;


