import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  App as AntdApp,
  Button,
  Card,
  ConfigProvider,
  Empty,
  Form,
  Image,
  Input,
  Modal,
  Popconfirm,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
  Upload as AntUpload,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { UploadFile, UploadProps } from 'antd';
import {
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  InboxOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import PageTitle from '../../PageTitle';
import axios from 'axios';
import { getUrlServer } from '../../../configServer';

const { Title, Text } = Typography;
const { Dragger } = AntUpload;
const MAX_FILES = 10;
const MAX_FILE_SIZE_MB = 5;

interface ImageData {
  _id: string;
  filename: string;
  nom: string;
  description: string;
  tags: string[];
}

interface ImageFormValues {
  nom: string;
  description?: string;
}

const ImageManagement = () => {
  const { message: messageApi } = AntdApp.useApp();
  const [images, setImages] = useState<ImageData[]>([]);
  const [filteredImages, setFilteredImages] = useState<ImageData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingImage, setEditingImage] = useState<ImageData | null>(null);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});
  const previewUrlsRef = useRef<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [imageForm] = Form.useForm<ImageFormValues>();

  const fetchImages = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const accessToken = localStorage.getItem('access_token');
      if (!accessToken) throw new Error('Token d’authentification non trouvé. Veuillez vous reconnecter.');

      const response = await axios.get<{ images: ImageData[] }>(`${getUrlServer()}/produits/suggestions`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const nextImages = Array.isArray(response.data?.images) ? response.data.images : [];
      setImages(nextImages);
      setFilteredImages(nextImages);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.response?.data?.error || err?.message || 'Une erreur est survenue lors du chargement des images.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchImages();
    return () => Object.values(previewUrlsRef.current).forEach((url) => URL.revokeObjectURL(url));
  }, []);

  useEffect(() => {
    const search = searchTerm.trim().toLocaleLowerCase('fr');
    setFilteredImages(images.filter((image) => !search || [image.nom, image.description, ...(image.tags || [])].some((value) => value?.toLocaleLowerCase('fr').includes(search))));
  }, [searchTerm, images]);

  const clearSelectedFiles = () => {
    Object.values(previewUrlsRef.current).forEach((url) => URL.revokeObjectURL(url));
    previewUrlsRef.current = {};
    setPreviewUrls({});
    setFileList([]);
  };

  const closeModal = () => {
    clearSelectedFiles();
    imageForm.resetFields();
    setEditingImage(null);
    setIsModalOpen(false);
  };

  const openCreateModal = () => {
    clearSelectedFiles();
    imageForm.resetFields();
    setEditingImage(null);
    setIsModalOpen(true);
  };

  const openEditModal = (image: ImageData) => {
    clearSelectedFiles();
    imageForm.setFieldsValue({ nom: image.nom, description: image.description || '' });
    setEditingImage(image);
    setIsModalOpen(true);
  };

  const addFiles = (incoming: File[]) => {
    const availableSlots = editingImage ? 1 : MAX_FILES - fileList.length;
    if (availableSlots <= 0) {
      messageApi.warning(`Vous pouvez sélectionner jusqu'à ${MAX_FILES} images.`);
      return;
    }

    const accepted = incoming.slice(0, availableSlots).filter((file) => {
      if (!file.type.startsWith('image/')) {
        messageApi.error(`${file.name} n'est pas une image valide.`);
        return false;
      }
      if (file.size / 1024 / 1024 > MAX_FILE_SIZE_MB) {
        messageApi.error(`${file.name} dépasse la limite de ${MAX_FILE_SIZE_MB} Mo.`);
        return false;
      }
      if (!editingImage && fileList.some((current) => current.name === file.name && current.size === file.size)) {
        messageApi.warning(`${file.name} est déjà sélectionnée.`);
        return false;
      }
      return true;
    });

    if (!accepted.length) return;
    if (editingImage) clearSelectedFiles();

    const nextFiles = accepted.map((file) => ({
      uid: `${file.name}-${file.size}-${file.lastModified}`,
      name: file.name,
      size: file.size,
      type: file.type,
      status: 'done' as const,
      originFileObj: file as UploadFile['originFileObj'],
    }));
    const nextPreviews = Object.fromEntries(nextFiles.map((file, index) => [file.uid, URL.createObjectURL(accepted[index])]));
    previewUrlsRef.current = { ...previewUrlsRef.current, ...nextPreviews };
    setFileList((current) => editingImage ? nextFiles : [...current, ...nextFiles]);
    setPreviewUrls((current) => editingImage ? nextPreviews : { ...current, ...nextPreviews });
  };

  const uploadProps: UploadProps = {
    accept: 'image/png,image/jpeg,image/webp,image/gif',
    multiple: !editingImage,
    showUploadList: false,
    beforeUpload: (file) => {
      addFiles([file as unknown as File]);
      return AntUpload.LIST_IGNORE;
    },
  };

  const removeFile = (uid: string) => {
    if (previewUrls[uid]) URL.revokeObjectURL(previewUrls[uid]);
    const nextPreviews = { ...previewUrls };
    delete nextPreviews[uid];
    delete previewUrlsRef.current[uid];
    setPreviewUrls(nextPreviews);
    setFileList((current) => current.filter((file) => file.uid !== uid));
  };

  const handleDelete = async (id: string) => {
    try {
      const accessToken = localStorage.getItem('access_token');
      const response = await axios.delete<{ message?: string }>(`${getUrlServer()}/staff/images/${id}`, { headers: { Authorization: `Bearer ${accessToken}` } });
      messageApi.success(response.data?.message || 'Image supprimée avec succès.');
      await fetchImages();
    } catch (err: any) {
      messageApi.error(err?.response?.data?.message || err?.response?.data?.error || 'Erreur lors de la suppression de l’image.');
    }
  };

  const handleSubmit = async (values: ImageFormValues) => {
    const accessToken = localStorage.getItem('access_token');
    if (!accessToken) {
      messageApi.error('Token d’authentification non trouvé. Veuillez vous reconnecter.');
      return;
    }
    if (!editingImage && !fileList.length) {
      messageApi.error('Veuillez sélectionner au moins une image.');
      return;
    }

    setIsSaving(true);
    try {
      if (editingImage) {
        const data = new FormData();
        data.append('nom', values.nom);
        data.append('description', values.description || '');
        const originFile = fileList[0]?.originFileObj as File | undefined;
        if (originFile) data.append('file', originFile);

        const response = await axios.patch<{ message?: string }>(`${getUrlServer()}/staff/images/${editingImage._id}`, data, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        messageApi.success(response.data?.message || 'Image modifiée avec succès.');
      } else {
        let successMessage = `${fileList.length} image${fileList.length > 1 ? 's' : ''} ajoutée${fileList.length > 1 ? 's' : ''} avec succès.`;
        for (const [index, file] of fileList.entries()) {
          const originFile = file.originFileObj as File | undefined;
          if (!originFile) continue;
          const data = new FormData();
          data.append('file', originFile);
          data.append('nom', fileList.length > 1 ? `${values.nom} - ${index + 1}` : values.nom);
          data.append('description', values.description || '');
          const response = await axios.post<{ message?: string }>(`${getUrlServer()}/staff/images/upload`, data, {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          successMessage = response.data?.message || successMessage;
        }
        messageApi.success(successMessage);
      }
      closeModal();
      await fetchImages();
    } catch (err: any) {
      messageApi.error(err?.response?.data?.message || err?.response?.data?.error || 'Une erreur est survenue lors de l’enregistrement.');
    } finally {
      setIsSaving(false);
    }
  };

  const taggedImageCount = useMemo(() => images.filter((image) => image.tags?.length).length, [images]);

  const columns: ColumnsType<ImageData> = [
    {
      title: 'Aperçu',
      dataIndex: 'filename',
      key: 'preview',
      width: 100,
      render: (filename: string, record) => (
        <div className="flex h-14 w-20 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
          <Image src={filename} alt={record.nom} width={80} height={56} className="!object-cover" preview={{ mask: <EyeOutlined /> }} />
        </div>
      ),
    },
    {
      title: 'Image',
      dataIndex: 'nom',
      key: 'nom',
      sorter: (a, b) => a.nom.localeCompare(b.nom),
      render: (nom: string, record) => (
        <div className="min-w-[180px]">
          <Text strong className="block !text-sm !text-slate-900">{nom || 'Image sans nom'}</Text>
          <Text type="secondary" className="block max-w-[260px] truncate !text-xs">{record.description || 'Aucune description'}</Text>
        </div>
      ),
    },
    {
      title: 'Tags',
      dataIndex: 'tags',
      key: 'tags',
      responsive: ['lg'],
      render: (tags: string[]) => (
        <Space size={[0, 4]} wrap>
          {tags?.length ? tags.slice(0, 3).map((tag) => <Tag key={tag} className="!m-0 !rounded-full !border-slate-200 !bg-slate-50 !text-xs !text-slate-600">{tag}</Tag>) : <Text type="secondary" className="!text-xs">Aucun tag</Text>}
          {tags && tags.length > 3 && <Tooltip title={tags.slice(3).join(', ')}><Tag className="!m-0 !rounded-full !border-purple-200 !text-purple-700">+{tags.length - 3}</Tag></Tooltip>}
        </Space>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 110,
      fixed: 'right',
      align: 'right',
      render: (_, record) => (
        <Space size={2}>
          <Tooltip title="Modifier">
            <Button type="text" size="small" aria-label="Modifier" icon={<EditOutlined />} onClick={() => openEditModal(record)} className="!text-purple-700 hover:!bg-purple-50" />
          </Tooltip>
          <Popconfirm title="Supprimer cette image ?" description="Cette action est irréversible." onConfirm={() => handleDelete(record._id)} okText="Supprimer" cancelText="Annuler" okButtonProps={{ danger: true }}>
            <Tooltip title="Supprimer"><Button type="text" size="small" danger aria-label="Supprimer" icon={<DeleteOutlined />} /></Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <PageTitle>Gestion des images</PageTitle>
      <ConfigProvider theme={{ token: { colorPrimary: '#6b21a8', borderRadius: 10 }, components: { Table: { headerBg: '#faf5ff', headerColor: '#111827', rowHoverBg: '#fdf4ff' }, Pagination: { itemActiveBg: '#f3e8ff' } } }}>
        <main className="min-h-screen bg-white px-4 py-5 md:px-8 md:py-7">
          <div className="mx-auto max-w-[1500px]">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div><Title level={2} className="!mb-1 !text-2xl !font-bold !text-slate-900">Galerie d’images</Title><Text className="text-sm text-slate-500">Centralisez, recherchez et organisez les visuels de votre application.</Text></div>
              <div className="flex gap-2"><Button icon={<ReloadOutlined />} onClick={fetchImages} loading={isLoading} className="h-10 !rounded-lg !border-purple-200 !text-purple-800 hover:!border-purple-800">Actualiser</Button><Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal} className="h-10 !rounded-lg !bg-purple-800 !px-5 hover:!bg-purple-900">Ajouter une image</Button></div>
            </div>

            <Card variant="borderless" className="!rounded-2xl !border !border-purple-100 !shadow-[0_8px_30px_rgba(15,23,42,0.05)]" styles={{ body: { padding: 0 } }}>
              <div className="grid grid-cols-1 border-b border-purple-100 sm:grid-cols-3">
                <div className="border-b border-purple-100 px-5 py-4 sm:border-b-0 sm:border-r"><Text className="block text-[11px] font-semibold uppercase tracking-wider text-purple-500">Total images</Text><strong className="text-2xl text-slate-900">{images.length}</strong></div>
                <div className="border-b border-purple-100 px-5 py-4 sm:border-b-0 sm:border-r"><Text className="block text-[11px] font-semibold uppercase tracking-wider text-purple-500">Images avec tags</Text><strong className="text-2xl text-slate-900">{taggedImageCount}</strong></div>
                <div className="px-5 py-4"><Text className="block text-[11px] font-semibold uppercase tracking-wider text-purple-500">Résultats affichés</Text><strong className="text-2xl text-slate-900">{filteredImages.length}</strong></div>
              </div>
              <div className="border-b border-purple-100 p-5"><Input allowClear prefix={<SearchOutlined className="text-purple-700" />} placeholder="Rechercher par nom, description ou tag…" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} className="h-10 w-full md:max-w-[520px]" /></div>

              {error ? <div className="p-6"><Alert type="error" showIcon message="Impossible de charger les images" description={error} /></div> : <Table columns={columns} dataSource={filteredImages} rowKey="_id" loading={isLoading} pagination={{ pageSize: 10, showSizeChanger: true, showQuickJumper: true, showTotal: (total, range) => `${range[0]}-${range[1]} sur ${total} images`, pageSizeOptions: ['5', '10', '20', '50'], className: '!px-5 !py-4' }} scroll={{ x: 800 }} locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Aucune image trouvée" className="py-10" /> }} className="image-management-table" />}
            </Card>
          </div>
        </main>
      </ConfigProvider>

      <Modal
        open={isModalOpen}
        title={<div><div className="text-lg font-semibold text-slate-900">{editingImage ? 'Modifier l’image' : 'Ajouter des images'}</div><div className="mt-1 text-sm font-normal text-slate-500">{editingImage ? 'Mettez à jour les informations ou remplacez le fichier.' : 'Sélectionnez un ou plusieurs visuels à intégrer dans la galerie.'}</div></div>}
        onCancel={closeModal}
        footer={null}
        width={620}
        destroyOnHidden
      >
        <Form form={imageForm} layout="vertical" onFinish={handleSubmit} className="pt-6">
          <Form.Item label="Fichier image" required={!editingImage}>
            <Dragger {...uploadProps} className="!rounded-xl !border-purple-200 !bg-purple-50/40 hover:!border-purple-500">
              <p className="ant-upload-drag-icon !mb-3"><InboxOutlined className="!text-4xl !text-purple-700" /></p>
              <p className="!mb-1 !font-semibold !text-slate-800">{editingImage ? 'Cliquez ou déposez une nouvelle image' : 'Cliquez ou déposez vos images ici'}</p>
              <p className="!text-xs !text-slate-500">PNG, JPG, WEBP ou GIF · 5 Mo maximum par fichier{!editingImage && ` · ${MAX_FILES} fichiers maximum`}</p>
            </Dragger>
          </Form.Item>

          {editingImage && !fileList.length && <div className="mb-5 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3"><Image src={editingImage.filename} alt={editingImage.nom} width={68} height={52} className="!rounded-lg !object-cover" preview={false} /><div><Text className="block !text-xs !font-semibold !text-slate-700">Fichier actuel</Text><Text className="!text-xs !text-slate-500">Déposez une nouvelle image pour le remplacer.</Text></div></div>}

          {!!fileList.length && <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {fileList.map((file) => <div key={file.uid} className="group relative overflow-hidden rounded-xl border border-purple-100 bg-slate-50"><Image src={previewUrls[file.uid]} alt={file.name} width="100%" height={112} className="!object-cover" preview={false} /><div className="truncate px-2 py-2 text-xs text-slate-600">{file.name}</div><Button type="text" size="small" icon={<DeleteOutlined />} aria-label={`Retirer ${file.name}`} onClick={() => removeFile(file.uid)} className="!absolute !right-1 !top-1 !bg-white/90 !text-slate-600 hover:!text-red-600" /></div>)}
          </div>}

          <Form.Item name="nom" label="Nom de l’image" rules={[{ required: true, message: 'Veuillez entrer un nom' }, { min: 3, message: 'Minimum 3 caractères' }]}>
            <Input placeholder="Ex. Bannière de présentation" className="h-10 !rounded-lg" />
          </Form.Item>
          <Form.Item name="description" label="Description (facultatif)">
            <Input.TextArea placeholder="Ajoutez quelques détails sur ce visuel…" rows={3} maxLength={500} showCount className="!rounded-lg !resize-none" />
          </Form.Item>
          <div className="mt-7 flex justify-end gap-3 border-t border-slate-100 pt-6 pb-1">
            <Button onClick={closeModal} disabled={isSaving} className="h-10 !rounded-lg !px-5">Annuler</Button>
            <Button type="primary" htmlType="submit" loading={isSaving} icon={editingImage ? <EditOutlined /> : <PlusOutlined />} className="h-10 !rounded-lg !bg-purple-800 !px-6 hover:!bg-purple-900">{editingImage ? 'Enregistrer les modifications' : 'Ajouter à la galerie'}</Button>
          </div>
        </Form>
      </Modal>
    </>
  );
};

export default ImageManagement;
