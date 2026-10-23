// Fichier: src/components/composantclient/InputField.tsx
import React from 'react';

type InputFieldProps = {
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  required?: boolean;
};

const InputField: React.FC<InputFieldProps> = ({ label, value, onChange, placeholder, required }) => (
  <div className="mb-4">
    <label className="block text-sm font-medium mb-1">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full p-3 border border-gray-300 rounded-md bg-white"
    />
  </div>
);

export default InputField;


