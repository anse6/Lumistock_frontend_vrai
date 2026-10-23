// import { useState } from 'react';
// import { Search } from 'lucide-react';

// // Définition des types
// type Product = {
//   id: number;
//   name: string;
//   weight: string;
//   price: number;
//   quantity: number;
//   image: string;
// };

// type Category = {
//   name: string;
//   count: number;
//   selected: boolean;
// };

// export default function LivraisonApp() {
//   // État pour les catégories
//   const [categories, setCategories] = useState<Category[]>([
//     { name: 'Tous les produits', count: 77, selected: true },
//     { name: 'Épicerie', count: 10, selected: false },
//     { name: 'Boissons', count: 30, selected: false },
//     { name: 'Produits Ménagers', count: 9, selected: false },
//     { name: 'Produits Laitiers', count: 0, selected: false },
//     { name: 'Produits Surgelés', count: 16, selected: false },
//     { name: 'Fruits', count: 12, selected: false },
//   ]);

//   // État pour les produits
//   const [products] = useState<Product[]>([
//     {
//       id: 1,
//       name: 'Sac de riz Bijou de 25kg',
//       weight: '25kg',
//       price: 25000,
//       quantity: 4,
//       image: '/api/placeholder/80/80',
//     },
//     {
//       id: 2,
//       name: 'Sac de riz Bijou de 50kg',
//       weight: '50kg',
//       price: 50000,
//       quantity: 6,
//       image: '/api/placeholder/80/80',
//     },
//   ]);

//   // Fonction pour sélectionner une catégorie
//   const selectCategory = (index: number) => {
//     const updatedCategories = categories.map((cat, i) => ({
//       ...cat,
//       selected: i === index,
//     }));
//     setCategories(updatedCategories);
//   };

//   return (
//     <div className="max-w-4xl mx-auto bg-gray-50 p-6 rounded-lg">
//       <div className="text-sm text-[#1E293B] mb-2">
//         <span>Livraison</span> &gt; <span className="text-gray-600">Sélectionner les produits</span>
//       </div>
      
//       <h1 className="text-2xl font-bold mb-6">Sélectionner les produits de la livraison</h1>
      
//       {/* Catégories */}
//       <div className="relative overflow-x-auto mb-6">
//         <div className="flex space-x-4">
//           {categories.map((category, index) => (
//             <div 
//               key={index}
//               onClick={() => selectCategory(index)}
//               className={`flex flex-col justify-center items-center p-4 rounded-lg cursor-pointer min-w-24 ${
//                 category.selected ? 'bg-slate-100' : 'bg-gray-100'
//               }`}
//             >
//               <span className="text-sm font-medium">{category.name}</span>
//               <span className="text-md mt-1">{category.count} articles</span>
//             </div>
//           ))}
//         </div>
//         <button className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-white p-2 rounded-full shadow-md">
//           <span className="text-gray-700">&gt;</span>
//         </button>
//       </div>
      
//       {/* Barre de recherche */}
//       <div className="flex mb-6">
//         <div className="relative flex-grow">
//           <input 
//             type="text" 
//             placeholder="Rechercher" 
//             className="w-full border border-gray-200 rounded-lg p-3 pl-10"
//           />
//           <Search className="absolute left-3 top-3 text-gray-400 h-5 w-5" />
//         </div>
//         <button className="ml-4 bg-gray-200 text-gray-500 px-8 py-3 rounded-lg font-medium">
//           Continuer
//         </button>
//       </div>
      
//       {/* Liste des produits */}
//       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//         {products.map((product) => (
//           <div key={product.id} className="flex items-center p-4 bg-white rounded-lg border border-gray-100">
//             <div className="bg-red-50 p-2 rounded-lg mr-4">
//               <img src={product.image} alt={product.name} className="w-16 h-16 object-contain" />
//             </div>
//             <div className="flex-grow">
//               <h3 className="font-medium text-sm">{product.name}</h3>
//             </div>
//             <div className="flex items-center">
//               <span className="text-[#1E293B] font-medium mr-4">{product.quantity}</span>
//               <span className="font-bold">{product.price.toLocaleString()}cfa</span>
//             </div>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }


