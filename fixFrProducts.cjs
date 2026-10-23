const fs = require('fs');

const frPath = 'src/locales/fr/translation.json';
const fr = JSON.parse(fs.readFileSync(frPath, 'utf8'));

// If customers is mistakenly inside products, extract it
let customersData = null;
if (fr.admin && fr.admin.products && fr.admin.products.customers) {
    customersData = fr.admin.products.customers;
    delete fr.admin.products.customers;
}

// Reset products in French
fr.admin.products = {
  "title": "Produits",
  "new_product": "Nouveau Produit",
  "edit_product": "Modifier Produit",
  "product_name": "Nom du Produit",
  "description": "Description",
  "category": "Catégorie",
  "supplier": "Fournisseur",
  "unit": "Unité de vente",
  "initial_quantity": "Quantité Initiale",
  "quantity_instore": "Quantité en stock",
  "unit_price": "Prix Unitaire",
  "purchase_price": "Prix d'Achat",
  "stock_value": "Valeur du Stock",
  "total_products": "Total Produits",
  "purchase_value": "Valeur d'Achats Globale",
  "sale_value": "Valeur de Vente Globale",
  "different_references": "références différentes",
  "search_placeholder": "Rechercher un produit...",
  "create_btn": "Créer un produit",
  "import_excel": "Import Excel",
  "export_excel": "Export Excel",
  "trash": "Corbeille",
  "filters": "Filtres",
  "status": {
    "all": "Tous les états",
    "in_stock": "En stock",
    "out_of_stock": "En rupture"
  },
  "categories": {
    "all": "Toutes les catégories",
    "new": "Nouvelle catégorie"
  },
  "packaging": {
    "title": "Conditionnements",
    "add_btn": "Ajouter un conditionnement",
    "name": "Nom du conditionnement",
    "factor": "Nombre d'unités",
    "total_price": "Prix total",
    "none": "Aucun conditionnement ajouté"
  },
  "image": {
    "title": "Image du Produit",
    "upload_btn": "Cliquer pour Uploader",
    "suggestions": "Suggestions",
    "none_suggestion": "Aucune suggestion",
    "required": "Une image est requise",
    "tooltip_suggestions": "Images souvent utilisées pour ce type de produit"
  },
  "delete_modal": {
    "title": "Supprimer le produit",
    "warning": "Voulez-vous vraiment supprimer ce produit ?"
  },
  "reports": {
    "table": {
      "total": "Total"
    }
  },
  "form": {
    "placeholder_name": "Ex: Sac de Riz 50kg",
    "placeholder_desc": "Détails du produit, caractéristiques...",
    "choose_category": "Choisir une catégorie",
    "new_category": "Nouvelle catégorie",
    "bag": "Sac",
    "kilogram": "Kilogramme (kg)",
    "carton": "Carton",
    "bottle": "Bouteille",
    "liter": "Litre (L)",
    "gram": "Gramme (g)",
    "packet": "Paquet",
    "placeholder_carton": "Ex: Carton",
    "placeholder_cat_name": "Alimentation, Boissons..."
  },
  "code_id": "Code ID"
};

// If we had customers saved, put it back (Wait, if customers was inside products, it's better to move it to admin.customers where it belongs. Let's just keep it in products if that's what was there, to avoid breaking other files temporarily).
if (customersData) {
    fr.admin.customers = customersData; // the codebase uses admin.customers. So it's best to put it there.
}

// Translate customers as well if it's currently English
if (fr.admin.customers && fr.admin.customers.title === "Customers") {
    fr.admin.customers.title = "Clients";
    if (fr.admin.customers.tabs) {
        fr.admin.customers.tabs = {
            "active": "Clients Actifs",
            "inactive": "Clients Inactifs",
            "debts": "Dettes Clients"
        };
    }
    // minimal fix for customers just in case
}

// Reset supplies in French
fr.admin.supplies = {
  "title": "Approvisionnements",
  "total_quantity": "Quantité Totale",
  "items_entered": "Articles Entrés",
  "total_amount": "Montant Total",
  "budget_invested": "Budget Investi",
  "select_products": "Sélectionner des Produits",
  "deliverer": "Livreur",
  "select_deliverer": "Sélectionner un Livreur",
  "new_supply": "Nouvel Approvisionnement",
  "success": "Approvisionnement réussi",
  "error": "Erreur lors de l'approvisionnement",
  "confirm_title": "Confirmer l'Approvisionnement",
  "summary": "Résumé de l'Approvisionnement",
  "units": {
    "simple": "Unités simples:",
    "total": "Total:"
  },
  "filters": {
    "less_than_100k": "Moins de 100.000",
    "between_100k_500k": "100.000 - 500.000",
    "more_than_500k": "Plus de 500.000"
  }
};

fs.writeFileSync(frPath, JSON.stringify(fr, null, 4));
console.log('French translation replaced for products and supplies.');
