// Fichier: components/OrderTableRow.tsx (modifié)
import React from 'react';
import { MoreVertical } from 'lucide-react';
import { Order } from './types';
import { ClientCell } from './ClientCell';
import { StatusBadge } from './StatusBadge';
import { ActionMenu } from './ActionMenu';

interface OrderTableRowProps {
  order: Order;
  activeMenu: string | null;
  onToggleMenu: (orderId: string) => void;
  onAction: (action: string, orderId: string) => void;
}

export const OrderTableRow: React.FC<OrderTableRowProps> = ({ 
  order, 
  activeMenu, 
  onToggleMenu, 
  onAction 
}) => (
  <tr className="flex w-full hover:bg-gray-50">
    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 flex-1">
      {order.id.substring(0, 28)}
    </td>
    <td className="px-6 py-4 whitespace-nowrap flex-1">
      <ClientCell initials={order.client.initials} name={order.client.name} />
    </td>
    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 flex-1">
      {order.quantity}
    </td>
    <td className="px-6 py-4 whitespace-nowrap flex-1">
      <StatusBadge status={order.paymentStatus} type="payment" />
    </td>
    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 flex-1">
      {order.amount}
    </td>
    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 flex-1">
      {order.date}
    </td>
    <td className="px-6 py-4 whitespace-nowrap flex-1">
      <StatusBadge status={order.status} type="order" />
    </td>
    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium relative flex-1">
      <div className="relative flex justify-end">
        <button 
          onClick={() => onToggleMenu(order.id)} 
          className="text-gray-500 hover:text-gray-700 focus:outline-none"
          aria-label="Options"
        >
          <MoreVertical size={20} />
        </button>
        <ActionMenu 
          orderId={order.id} 
          isOpen={activeMenu === order.id} 
          onAction={onAction} 
        />
      </div>
    </td>
  </tr>
);



