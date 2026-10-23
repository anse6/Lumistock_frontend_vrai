import React from 'react';
import { Modal, Form, Input, Button } from 'antd';

interface UnitFormProps {
  open: boolean;
  onCancel: () => void;
  onSuccess: (unit: any) => void;
  loading: boolean;
}

const UnitForm: React.FC<UnitFormProps> = ({ open, onCancel, onSuccess, loading }) => {
  const [form] = Form.useForm();

  const handleFinish = (values: any) => {
    onSuccess(values);
    form.resetFields();
  };

  return (
    <Modal
      title="Nouvelle unité"
      open={open}
      onCancel={onCancel}
      footer={null}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
      >
        <Form.Item
          name="unite"
          label="Unité"
          rules={[{ required: true, message: "Le nom de l'unité est requis" }]}
        >
          <Input placeholder="Nom de l'unité (ex: Carton)" />
        </Form.Item>
        <div className="flex justify-end gap-2">
          <Button onClick={onCancel}>Annuler</Button>
          <Button type="primary" htmlType="submit" loading={loading} className="bg-indigo-600">
            Enregistrer
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default UnitForm;
