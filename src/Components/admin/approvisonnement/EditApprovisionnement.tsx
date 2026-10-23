import React from "react";
import { useParams } from "react-router-dom";
import ProductSelect from "./ProductSelect";

// La modification réutilise la page de sélection des produits en mode édition :
// même mise en page, mêmes contrôles de quantité, et le stock déjà remis au
// gérant reste disponible pour cet approvisionnement.
const EditApprovisionnement: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  return <ProductSelect approvisionnementId={id} />;
};

export default EditApprovisionnement;
