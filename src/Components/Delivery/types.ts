// Fichier: types.ts
export interface Order {
    id: string;
    client: {
      initials: string;
      name: string;
    };
    quantity: number;
    paymentStatus: 'Payé' | 'Non payé' | 'Pas totalement';
    amount: string;
    date: string;
    status: string;
  }
  
  export interface ActionMenuProps {
    orderId: string;
    isOpen: boolean;
    onAction: (action: string, orderId: string) => void;
  }
  
  export interface TableHeaderProps {
    title: string;
    withSorting?: boolean;
  }
  
  export interface ClientCellProps {
    initials: string;
    name: string;
  }
  
  export interface StatusBadgeProps {
    status: string;
    type: 'payment' | 'order';
  }
  
  export interface PaginationProps {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    onPageChange: (page: number) => void;
  }