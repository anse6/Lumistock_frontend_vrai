import React, { useEffect, useState } from "react";
import ProduitApprovisionnement from "./ProduitApprovisionnement";
import { Produit, Approvisionnement } from "./types";
import PageTitle from "../../PageTitle";
import { getUrlServer } from "../../../configServer";

const ProduitApprovisionnementPage: React.FC = () => {
  const [produits, setProduits] = useState<Produit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Données mock pour approvisionnement (non modifiées)
  const approvisionnements: Approvisionnement[] = [
    {
      id: "APR2158",
      deliveryPerson: "Jean Michel",
      productQuantity: "150",
      remainingQuantity: "50",
      amount: "250,000cfa",
      date: "2025-05-14",
      status: "En cours",
    },
    {
      id: "APR2158",
      deliveryPerson: "Jean Michel",
      productQuantity: "150",
      remainingQuantity: "50",
      amount: "250,000cfa",
      date: "2025-05-14",
      status: "En cours",
    },
    {
      id: "APR2158",
      deliveryPerson: "Jean Michel",
      productQuantity: "150",
      remainingQuantity: "50",
      amount: "250,000cfa",
      date: "2025-05-14",
      status: "En cours",
    },
    {
      id: "APR2158",
      deliveryPerson: "Jean Michel",
      productQuantity: "150",
      remainingQuantity: "50",
      amount: "250,000cfa",
      date: "2025-05-14",
      status: "En cours",
    },
    {
      id: "APR2158",
      deliveryPerson: "Jean Michel",
      productQuantity: "150",
      remainingQuantity: "50",
      amount: "250,000cfa",
      date: "2025-05-14",
      status: "En cours",
    },
    {
      id: "APR2158",
      deliveryPerson: "Jean Michel",
      productQuantity: "150",
      remainingQuantity: "50",
      amount: "250,000cfa",
      date: "2025-05-14",
      status: "En cours",
    },
    {
      id: "APR2158",
      deliveryPerson: "Jean Michel",
      productQuantity: "150",
      remainingQuantity: "50",
      amount: "250,000cfa",
      date: "2025-05-14",
      status: "En cours",
    },
    {
      id: "APR2158",
      deliveryPerson: "Jean Michel",
      productQuantity: "150",
      remainingQuantity: "50",
      amount: "250,000cfa",
      date: "2025-05-14",
      status: "En cours",
    },
  ];

  useEffect(() => {
    const fetchProduits = async () => {
      try {
        const token = localStorage.getItem("access_token");
        if (!token) {
          throw new Error("Non authentifié");
        }

        const response = await fetch(`${getUrlServer()}/produits`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`Erreur HTTP: ${response.status}`);
        }

        const data = await response.json();

        // Transformation des données de l'API vers notre interface Produit
        type ApiProduit = {
          _id: string;
          nom: string;
          description: string;
          categorie_nom: string;
          quantite_initiale: number;
          quantite: number;
          prix: number;
          etat: string;
          image: string;
          unite: string;
        };

        const formattedProduits: Produit[] = (data as ApiProduit[]).map(
          (produit) => ({
            id: produit._id,
            produit_id: produit._id,
            name: produit.nom,
            nom: produit.nom,
            description: produit.description,
            category: produit.categorie_nom,
            quantity: produit.quantite_initiale,
            quantite: produit.quantite,
            remaining: produit.quantite,
            price: produit.prix,
            prix: produit.prix,
            status: produit.etat === "en stock" ? "En stock" : "En rupture",
            image: produit.image,
            unite: produit.unite,
            quantite_par_conditionnement: 1,
            conditionnement_id: null,
            conditionnement_nom: "",
            facteur: 1,
            is_conditionne: false,
          }),
        );

        setProduits(formattedProduits);
        formattedProduits.forEach((p) => {
          console.log(`Image URL for ${p.name}: ${p.image}`);
          console.log("Produits récupérés :", formattedProduits);
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur inconnue");
      } finally {
        setLoading(false);
      }
    };

    fetchProduits();
  }, []);

  if (loading) {
    return <div className="text-center py-8">Chargement des produits...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-500">Erreur: {error}</div>;
  }

  return (
    <>
      <PageTitle>Produits</PageTitle>
      <ProduitApprovisionnement
        produits={produits}
        approvisionnements={approvisionnements}
      />
    </>
  );
};

export default ProduitApprovisionnementPage;
