import { useState } from 'react';
import { Table, Tag, Avatar, Button, Input, Dropdown, Space, Modal } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { MoreVertical, Eye, Edit, Trash2, Search, Download, Filter, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface User {
  id: string;
  initials: string;
  name: string;
  email: string;
  address: string;
  role: string;
  phone: string;
  createdAt: string;
  status: 'Actif' | 'Inactif';
  bgColor?: string;
}

export default function UserTable() {
  const { t } = useTranslation();
  const [searchText, setSearchText] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  
  const users: User[] = [
    { 
      id: "UTI22D8", 
      initials: "SA", 
      name: "Steve Adam", 
      email: "steveadam@gmail.com", 
      address: "Bonaberi, Douala", 
      role: "Livreur", 
      phone: "+237 675000811", 
      createdAt: "17 mars 2023", 
      status: "Actif",
      bgColor: "#dcfce7" // light green
    },
    { 
      id: "UTI22D9", 
      initials: "KS", 
      name: "Kenne Stephan", 
      email: "kennestephan@gmail.com", 
      address: "Bonaberi, Douala", 
      role: "Livreur", 
      phone: "+237 675000811", 
      createdAt: "17 mars 2023", 
      status: "Actif",
      bgColor: "#ffedd5" // light orange
    },
    { 
      id: "UTI22E1", 
      initials: "SD", 
      name: "Samuel Dikongue", 
      email: "samueldikongue@gmail.com", 
      address: "Bonaberi, Douala", 
      role: "Livreur", 
      phone: "+237 675000811", 
      createdAt: "17 mars 2023", 
      status: "Inactif",
      bgColor: "#cffafe" // light cyan
    },
    { 
      id: "UTI22E2", 
      initials: "JR", 
      name: "Robert John", 
      email: "robertjohn@gmail.com", 
      address: "Bonaberi, Douala", 
      role: "Manageur", 
      phone: "+237 675000811", 
      createdAt: "17 mars 2023", 
      status: "Actif",
      bgColor: "#e5e7eb" // light gray
    },
    { 
      id: "UTI22E3", 
      initials: "JP", 
      name: "Jean Pierre", 
      email: "jeanpierre@gmail.com", 
      address: "Bonaberi, Douala", 
      role: "Livreur", 
      phone: "+237 675000811", 
      createdAt: "17 mars 2023", 
      status: "Actif",
      bgColor: "#e0e7ff" // light indigo
    },
    { 
      id: "UTI22E4", 
      initials: "SP", 
      name: "Serge Patrick", 
      email: "sergepatrick@gmail.com", 
      address: "Bonaberi, Douala", 
      role: "Livreur", 
      phone: "+237 675000811", 
      createdAt: "17 mars 2023", 
      status: "Actif",
      bgColor: "#fef9c3" // light yellow
    },
    { 
      id: "UTI22E5", 
      initials: "BA", 
      name: "Borel Axel", 
      email: "borelaxel@gmail.com", 
      address: "Bonaberi, Douala", 
      role: "Livreur", 
      phone: "+237 675000811", 
      createdAt: "17 mars 2023", 
      status: "Actif",
      bgColor: "#dbeafe" // light blue
    },
    { 
      id: "UTI22E6", 
      initials: "JS", 
      name: "Junior Stephen", 
      email: "juniorstephen@gmail.com", 
      address: "Bonaberi, Douala", 
      role: "Livreur", 
      phone: "+237 675000811", 
      createdAt: "17 mars 2023", 
      status: "Actif",
      bgColor: "#f1f5f9" // light slate
    },
    { 
      id: "UTI22E7", 
      initials: "LM", 
      name: "Loic Mildrel", 
      email: "loicmildrel@gmail.com", 
      address: "Bonaberi, Douala", 
      role: "Livreur", 
      phone: "+237 675000811", 
      createdAt: "17 mars 2023", 
      status: "Inactif",
      bgColor: "#fce7f3" // light pink
    },
    { 
      id: "UTI22E8", 
      initials: "AC", 
      name: "Asaf Collins", 
      email: "asafcollins@gmail.com", 
      address: "Bonaberi, Douala", 
      role: "Livreur", 
      phone: "+237 675000811", 
      createdAt: "17 mars 2023", 
      status: "Actif",
      bgColor: "#fee2e2" // light red
    }
  ];

  const handleDeleteClick = (user: User) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = () => {
    console.log("Suppression de l'utilisateur:", userToDelete?.id);
    setShowDeleteModal(false);
    setUserToDelete(null);
  };

  const columns: ColumnsType<User> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      responsive: ['sm'],
    },
    {
      title: t('users.table.name'),
      dataIndex: 'name',
      key: 'name',
      render: (_, record) => (
        <Space>
          <Avatar 
            style={{ backgroundColor: record.bgColor, color: '#374151', fontSize: '12px', fontWeight: 500 }}
            shape="square"
            size="small"
          >
            {record.initials}
          </Avatar>
          <span className="font-medium">{record.name}</span>
        </Space>
      ),
    },
    {
      title: t('users.table.email'),
      dataIndex: 'email',
      key: 'email',
      responsive: ['md'],
    },
    {
      title: t('users.table.address'),
      dataIndex: 'address',
      key: 'address',
      responsive: ['lg'],
    },
    {
      title: t('users.table.role'),
      dataIndex: 'role',
      key: 'role',
      render: (role) => (
        <Tag color={role === "Manageur" ? "blue" : "default"}>
          {role}
        </Tag>
      ),
    },
    {
      title: t('users.table.phone'),
      dataIndex: 'phone',
      key: 'phone',
      responsive: ['md'],
    },
    {
      title: t('users.table.createdAt'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      responsive: ['md'],
    },
    {
      title: t('users.table.status'),
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === "Actif" ? "green" : "red"}>
          {status}
        </Tag>
      ),
    },
    {
      title: t('users.table.action'),
      key: 'action',
      render: (_, record) => (
        <Dropdown
          menu={{
            items: [
              {
                key: 'details',
                label: t('users.actions.viewDetails'),
                icon: <Eye size={16} />,
                onClick: () => console.log("Détails", record.id),
              },
              {
                key: 'edit',
                label: t('users.actions.edit'),
                icon: <Edit size={16} />,
                onClick: () => console.log("Modifier", record.id),
              },
              {
                key: 'delete',
                label: t('users.actions.delete'),
                icon: <Trash2 size={16} />,
                danger: true,
                onClick: () => handleDeleteClick(record),
              },
            ],
          }}
          trigger={['click']}
        >
          <Button type="text" icon={<MoreVertical size={20} className="text-gray-500" />} />
        </Dropdown>
      ),
    },
  ];
  
  return (
    <div className="bg-gray-50 p-4 md:p-6 rounded-xl shadow-sm">
      <div className="flex flex-col md:flex-row md:justify-between mb-6 gap-4">
        <div className="relative w-full md:w-72">
          <Input
            placeholder={t('users.searchPlaceholder')}
            prefix={<Search size={18} className="text-gray-400" />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="rounded-lg border-gray-200"
          />
        </div>
        
        <div className="flex flex-wrap gap-3">
          <Button icon={<Download size={18} />} className="flex items-center gap-2">
            {t('users.exportBtn')}
          </Button>
          <Button icon={<Filter size={18} />} className="flex items-center gap-2">
            {t('users.filterBtn')}
          </Button>
          <Button 
            type="primary" 
            icon={<Plus size={18} />} 
            className="bg-[#0F172A] hover:bg-[#1E293B] border-none font-bold"
          >
            {t('users.addBtn')}
          </Button>
        </div>
      </div>
      
      <Table 
        columns={columns} 
        dataSource={users.filter(u => u.name.toLowerCase().includes(searchText.toLowerCase()))}
        rowKey="id"
        pagination={{
            pageSize: 10,
            showTotal: (total, range) => t('users.paginationInfo', { start: range[0], end: range[1], total }),
        }}
        scroll={{ x: 'max-content' }}
        className="custom-antd-table"
      />

      <Modal
        title={t('users.deleteModal.title')}
        open={showDeleteModal}
        onOk={handleDeleteConfirm}
        onCancel={() => setShowDeleteModal(false)}
        okText={t('users.deleteModal.deleteBtn')}
        cancelText={t('users.deleteModal.cancelBtn')}
        okButtonProps={{ danger: true }}
      >
        <p className="text-center py-4 text-gray-600">
          {t('users.deleteModal.message')}
        </p>
      </Modal>
    </div>
  );
}


