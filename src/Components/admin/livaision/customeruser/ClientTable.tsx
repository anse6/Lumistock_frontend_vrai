import React from 'react';
import TableHeader from './TableHeader';
import ClientRow from './ClientRow';

interface User {
  id: string;
  initials: string;
  name: string;
  registeredBy: string;
  registeredByName: string;
  number: string;
  location: string;
  order: string;
  amount: string;
  date: string;
}

interface ClientTableProps {
  userData: User[];
  sortColumn: string | null;
  sortDirection: 'asc' | 'desc';
  handleSort: (column: string) => void;
}

const UserTable: React.FC<ClientTableProps> = ({ 
 userData, 
  sortColumn, 
  sortDirection, 
  handleSort 
}) => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <TableHeader 
          sortColumn={sortColumn} 
          sortDirection={sortDirection} 
          handleSort={handleSort} 
        />
        <tbody className="bg-white divide-y divide-gray-200">
          {userData.map((user, index) => (
            <ClientRow key={index} user={user} index={index} />
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default UserTable;


