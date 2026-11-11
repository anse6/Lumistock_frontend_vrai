// Fichier: components/OrderTableHead.tsx
import React from 'react';
import { TableHeader } from './TableHeader';

export const OrderTableHead: React.FC = () => (
  <thead className="bg-white">
    <tr className="flex w-full">
      <TableHeader title="Commande ID" />
      <TableHeader title=" Nom du Client " />
      <TableHeader title="Quantité d'articles" />
      <TableHeader title="Statut de paiement" />
      <TableHeader title="Montant" />
      <TableHeader title="Date" />
      <TableHeader title="Status" />
      <TableHeader title="Action" withSorting={false} />
    </tr>
  </thead>
);


