import React from 'react';
import { Modal } from 'antd';
import InlineSupplierForm from './InlineSupplierForm';

interface SupplierFormProps {
  open: boolean;
  onCancel: () => void;
  onSuccess: (supplierId: string) => void;
  loading?: boolean;
}

const SupplierForm: React.FC<SupplierFormProps> = ({ open, onCancel, onSuccess }) => {
  return (
    <Modal
      title="Nouveau fournisseur"
      open={open}
      onCancel={onCancel}
      footer={null}
      destroyOnClose
      width={500}
    >
      <div className="pt-4">
        <InlineSupplierForm 
          onCancel={onCancel} 
          onSuccess={(id) => {
            onSuccess(id);
            onCancel();
          }}
          isModalStyle={true} 
        />
      </div>
    </Modal>
  );
};

export default SupplierForm;
