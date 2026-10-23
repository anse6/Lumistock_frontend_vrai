import React from 'react';
import { Modal, Form, Input, Button } from 'antd';

const { TextArea } = Input;

interface CategoryFormProps {
  open: boolean;
  onCancel: () => void;
  onSuccess: (category: any) => void;
  loading: boolean;
}

const CategoryForm: React.FC<CategoryFormProps> = ({ open, onCancel, onSuccess, loading }) => {
  const [form] = Form.useForm();

  const handleFinish = (values: any) => {
    onSuccess(values);
    form.resetFields();
  };

  return (
    <Modal
      title="Nouvelle catégorie"
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
          name="nom"
          label="Nom"
          rules={[{ required: true, message: 'Le nom de la catégorie est requis' }]}
        >
          <Input placeholder="Alimentation, Boissons..." />
        </Form.Item>
        <Form.Item name="description" label="Description">
          <TextArea rows={3} placeholder="Description optionnelle..." />
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

export default CategoryForm;
