// // ClientsTable.jsx
// import React, { useState } from 'react';
// import { Table, Input, Button, Avatar, Typography, Card } from 'antd';
// import { SearchOutlined, DownloadOutlined, FilterOutlined } from '@ant-design/icons';

// const { Title, Text } = Typography;

// const getColorForInitial = (initial) => {
//   const colors = {
//     'SA': 'bg-green-200 text-green-700',
//     'KS': 'bg-orange-200 text-orange-700',
//     'SD': 'bg-blue-200 text-blue-700',
//     'JR': 'bg-gray-200 text-gray-700',
//     'JP': 'bg-slate-200 text-[#1E293B]',
//     'SP': 'bg-yellow-200 text-yellow-700',
//     'BA': 'bg-indigo-200 text-indigo-700',
//     'JS': 'bg-pink-200 text-pink-700',
//   };
  
//   return colors[initial] || 'bg-blue-200 text-blue-700';
// };

// const ClientsTable = () => {
//   const [searchText, setSearchText] = useState('');
  
//   const clientsData = [
//     {
//       key: '1',
//       id: 'CUS22DS',
//       name: 'Steve Adam',
//       initials: 'SA',
//       phone: '+237675600611',
//       location: 'Bonaberi, Douala',
//       orders: 10,
//       amount: '350,000 cfa'
//     },
//     {
//       key: '2',
//       id: 'CUS22DS',
//       name: 'Kenne Stephan',
//       initials: 'KS',
//       phone: '+237675600611',
//       location: 'Bonaberi, Douala',
//       orders: 10,
//       amount: '350,000 cfa'
//     },
//     {
//       key: '3',
//       id: 'CUS22DS',
//       name: 'Samuel Dikongue',
//       initials: 'SD',
//       phone: '+237675600611',
//       location: 'Bonaberi, Douala',
//       orders: 10,
//       amount: '350,000 cfa'
//     },
//     {
//       key: '4',
//       id: 'CUS22DS',
//       name: 'Robert John',
//       initials: 'JR',
//       phone: '+237675600611',
//       location: 'Bonaberi, Douala',
//       orders: 10,
//       amount: '350,000 cfa'
//     },
//     {
//       key: '5',
//       id: 'CUS22DS',
//       name: 'Jean Pierre',
//       initials: 'JP',
//       phone: '+237675600611',
//       location: 'Bonaberi, Douala',
//       orders: 10,
//       amount: '350,000 cfa'
//     },
//     {
//       key: '6',
//       id: 'CUS22DS',
//       name: 'Serge Patrick',
//       initials: 'SP',
//       phone: '+237675600611',
//       location: 'Bonaberi, Douala',
//       orders: 10,
//       amount: '350,000 cfa'
//     },
//     {
//       key: '7',
//       id: 'CUS22DS',
//       name: 'Borel Arol',
//       initials: 'BA',
//       phone: '+237675600611',
//       location: 'Bonaberi, Douala',
//       orders: 10,
//       amount: '350,000 cfa'
//     }
//   ];

//   const columns = [
//     {
//       title: 'ID',
//       dataIndex: 'id',
//       key: 'id',
//       sorter: (a, b) => a.id.localeCompare(b.id),
//     },
//     {
//       title: 'Nom du client',
//       dataIndex: 'name',
//       key: 'name',
//       sorter: (a, b) => a.name.localeCompare(b.name),
//       render: (text, record) => (
//         <div className="flex items-center">
//           <Avatar 
//             size={34} 
//             className={`flex items-center justify-center font-medium ${getColorForInitial(record.initials)}`}
//           >
//             {record.initials}
//           </Avatar>
//           <span className="ml-3">{text}</span>
//         </div>
//       ),
//     },
//     {
//       title: 'Numéro',
//       dataIndex: 'phone',
//       key: 'phone',
//       sorter: (a, b) => a.phone.localeCompare(b.phone),
//     },
//     {
//       title: 'Emplacement',
//       dataIndex: 'location',
//       key: 'location',
//       sorter: (a, b) => a.location.localeCompare(b.location),
//     },
//     {
//       title: 'Commande',
//       dataIndex: 'orders',
//       key: 'orders',
//       sorter: (a, b) => a.orders - b.orders,
//       render: text => <Text>{text}</Text>,
//     },
//     {
//       title: 'Montant dépensé',
//       dataIndex: 'amount',
//       key: 'amount',
//       sorter: (a, b) => {
//         const valueA = parseFloat(a.amount.replace(/[^\d]/g, ''));
//         const valueB = parseFloat(b.amount.replace(/[^\d]/g, ''));
//         return valueA - valueB;
//       },
//       render: text => <Text className="font-medium">{text}</Text>,
//     },
//   ];

//   const handleSearch = e => {
//     setSearchText(e.target.value);
//   };

//   return (
//     <div className="p-6 bg-gray-50 min-h-screen">
//       <Title level={2} className="mb-6">Clients</Title>
      
//       <Card className="shadow-sm">
//         <div className="mb-6 flex justify-between items-center">
//           <div className="relative w-96">
//             <Input
//               placeholder="Rechercher"
//               prefix={<SearchOutlined className="text-gray-400" />}
//               value={searchText}
//               onChange={handleSearch}
//               className="rounded-md pl-10 border-gray-200"
//             />
//           </div>
          
//           <div className="flex space-x-3">
//             <Button 
//               type="default"
//               icon={<DownloadOutlined />} 
//               className="flex items-center"
//             >
//               Export
//             </Button>
//             <Button 
//               type="default" 
//               icon={<FilterOutlined />}
//               className="flex items-center"
//             >
//               Filtre
//             </Button>
//           </div>
//         </div>
        
//         <Table
//           columns={columns}
//           dataSource={clientsData.filter(item => 
//             item.name.toLowerCase().includes(searchText.toLowerCase()) ||
//             item.id.toLowerCase().includes(searchText.toLowerCase()) ||
//             item.phone.includes(searchText) ||
//             item.location.toLowerCase().includes(searchText.toLowerCase())
//           )}
//           pagination={{ 
//             pageSize: 10,
//             showSizeChanger: false,
//             showTotal: (total, range) => `${range[0]}-${range[1]} sur ${total} clients` 
//           }}
//           className="client-table"
//           size="middle"
//           rowKey="key"
//         />
//       </Card>
//     </div>
//   );
// };

// export default ClientsTable;



