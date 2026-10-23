// src/components/composantclient/UploadBox.tsx
import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface UploadBoxProps {
  onFileSelected: (file: File | null) => void;
}

const UploadBox: React.FC<UploadBoxProps> = ({ onFileSelected }) => {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPreviewUrl(null);
    }
    
    onFileSelected(file);
  };

  return (
    <div className="mb-6">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />
      
      <div 
        onClick={handleClick}
        className="p-4 border-2 border-gray-300 border-dashed rounded-md flex items-center justify-center cursor-pointer hover:bg-gray-50"
      >
        {previewUrl ? (
          <div className="flex flex-col items-center">
            <img 
              src={previewUrl} 
              alt={t('delivery.deliveryConfig.uploadPreviewAlt')} 
              className="w-24 h-24 rounded-full object-cover mb-2"
            />
            <span className="text-sm text-blue-500">{t('delivery.deliveryConfig.uploadChangeImage')}</span>
          </div>
        ) : (
          <div className="flex items-center text-gray-400">
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24">
              <path d="M12 4v12M12 16l-4-4M12 16l4-4M6 20h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-gray-400">{t('delivery.deliveryConfig.uploadAddProfile')}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadBox;


