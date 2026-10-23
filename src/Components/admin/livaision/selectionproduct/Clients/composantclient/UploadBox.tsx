// src/components/composantclient/UploadBox.tsx
import React, { useState } from 'react';
import { Upload, message } from 'antd';
import type { TFunction } from 'i18next';
import { PlusOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { UploadChangeParam } from 'antd/es/upload';
import type { RcFile, UploadFile, UploadProps } from 'antd/es/upload/interface';

interface UploadBoxProps {
  onFileSelected: (file: File | null) => void;
}

const getBase64 = (img: RcFile, callback: (url: string) => void) => {
  const reader = new FileReader();
  reader.addEventListener('load', () => callback(reader.result as string));
  reader.readAsDataURL(img);
};

// Fichier refusé : LIST_IGNORE empêche qu'il soit quand même retenu et envoyé.
const beforeUpload = (file: RcFile, t: TFunction) => {
  const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
  if (!isJpgOrPng) {
    message.error(t('admin.deliveries.config.client.form.errorFileType'));
  }
  const isLt2M = file.size / 1024 / 1024 < 2;
  if (!isLt2M) {
    message.error(t('admin.deliveries.config.client.form.errorFileSize'));
  }
  return (isJpgOrPng && isLt2M) || Upload.LIST_IGNORE;
};

const UploadBox: React.FC<UploadBoxProps> = ({ onFileSelected }) => {
  const { t } = useTranslation();
  const [_loading, _setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>();

  const handleChange: UploadProps['onChange'] = (info: UploadChangeParam<UploadFile>) => {
    // on l'affiche seulement (preview local) et on l'envoie au parent
    if (info.file.originFileObj) {
        getBase64(info.file.originFileObj as RcFile, (url) => {
            setImageUrl(url);
        });
        onFileSelected(info.file.originFileObj as File);
    }
  };

  const dummyRequest = ({ onSuccess }: any) => {
    setTimeout(() => {
      onSuccess("ok");
    }, 0);
  };

  const uploadButton = (
    <div style={{ color: '#3b0764' }}>
      <PlusOutlined />
      <div style={{ marginTop: 8, fontSize: 12, padding: '0 8px' }}>{t('admin.deliveries.config.client.form.uploadPrompt')}</div>
    </div>
  );

  return (
    <div className="mb-6 flex justify-center">
      <Upload
        name="avatar"
        listType="picture-circle"
        className="avatar-uploader"
        showUploadList={false}
        customRequest={dummyRequest}
        beforeUpload={(file) => beforeUpload(file, t)}
        onChange={handleChange}
      >
        {imageUrl ? <img src={imageUrl} alt="avatar" style={{ width: '100%', borderRadius: '50%' }} /> : uploadButton}
      </Upload>
    </div>
  );
};

export default UploadBox;


