export type Product = {
    stock: number;
    id: string;
    image: string;
    name: string;
    description: string;
    category: string;
    quantity: number;
    quantityRemaining: number;
    price: string;
    prix_achat?: number;
    status: 'En stock' | 'En rupture';
  };