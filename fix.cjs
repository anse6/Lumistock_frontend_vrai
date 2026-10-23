const fs = require('fs');
const enPath = 'src/locales/en/translation.json';
const frPath = 'src/locales/fr/translation.json';

let en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
let fr = JSON.parse(fs.readFileSync(frPath, 'utf8'));

// 1. Move customers and reports in EN out of products
if (en.admin && en.admin.products) {
  if (en.admin.products.customers) {
    en.admin.customers = en.admin.products.customers;
    delete en.admin.products.customers;
  }
  if (en.admin.products.reports) {
    en.admin.reports = en.admin.products.reports;
    delete en.admin.products.reports;
  }
}

if (!fr.admin) fr.admin = {};
fr.admin.reports = { table: { total: "Total" } };
fr.admin.customers = {
  title: "Clients",
  tabs: {
    active: "Clients Actifs",
    inactive: "Clients Inactifs",
    debts: "Dettes Clients"
  },
  header: {
    searchPlaceholder: "Rechercher par nom, téléphone, quartier...",
    filter: "Filtrer",
    trash: "Corbeille",
    addClient: "Ajouter un Client",
    advancedFilters: "Filtres Avancés",
    city: "Ville",
    district: "Quartier",
    minAmount: "Montant Min (CFA)",
    maxAmount: "Montant Max (CFA)",
    minDeliveries: "Livraisons Min",
    maxDeliveries: "Livraisons Max",
    startDate: "Date de début",
    endDate: "Date de fin",
    clearFilters: "Effacer les Filtres",
    apply: "Appliquer"
  },
  table: {
    name: "Nom",
    phone: "Téléphone",
    address: "Adresse",
    cashAmount: "Montant en Caisse",
    createdAt: "Date de création",
    action: "Action",
    edit: "Modifier",
    addToCash: "Ajouter à la Caisse",
    clientDetails: "Détails du client",
    delete: "Supprimer",
    restore: "Restaurer",
    noData: "Aucun utilisateur trouvé",
    inactiveList: "Liste des Clients",
    pagination: {
      info: "Affichage de {{start}} à {{end}} sur {{total}} éléments",
      previous: "Précédent",
      next: "Suivant"
    },
    columns: {
      id: "ID Client",
      name: "Nom",
      phone: "Téléphone",
      address: "Adresse",
      deliveries: "Livraisons",
      amount: "Montant",
      date: "Date",
      actions: "Actions"
    }
  },
  details: {
    title: "Détails du Client",
    history: "Historique des Livraisons",
    noDeliveries: "Aucune livraison enregistrée pour ce client",
    totalSpent: "Total Dépensé",
    cash: "Caisse en main",
    numDeliveries: "Nombre de livraisons",
    date: "Date",
    products: "Produits",
    amount: "Montant",
    status: "Statut",
    delivered: "LIVRÉ",
    inProgress: "EN COURS",
    paid: "PAYÉ",
    unpaid: "NON PAYÉ",
    total: "total"
  },
  trash: {
    title: "Corbeille Clients",
    description: "Les clients supprimés seront définitivement effacés après 30 jours.",
    empty: "La corbeille des clients est vide",
    restore: "Restaurer",
    location: "Emplacement",
    client: "Client"
  },
  add: {
    breadcrumb: "Nouveau Client",
    title: "Nouveau Client",
    profileSection: "Profil Client",
    uploadBtn: "Enregistrer",
    uploadPrompt: "Ajouter un profil client",
    fullName: "Nom Complet",
    email: "Adresse Email",
    phone: "Numéro",
    cashAmount: "Montant en caisse",
    city: "Ville",
    district: "Quartier",
    cancel: "Annuler",
    save: "Enregistrer",
    placeholders: {
      fullName: "Le nom ici",
      email: "Email",
      phone: "xx xx xx xx",
      cashAmount: "0000",
      city: "Ville",
      district: "Quartier"
    },
    validation: {
      nameRequired: "Veuillez remplir ce champ avec le nom du client",
      invalidEmail: "Le format de l'email est invalide",
      phonePattern: "Le numéro doit comporter 8 chiffres après le '6' initial (9 chiffres au total)",
      tokenMissing: "Jeton d'authentification manquant",
      authRequired: "Vous devez être connecté pour accéder à cette page",
      error: "Une erreur s'est produite"
    },
    messages: {
      success: "Le client a été créé avec succès.",
      successTitle: "Succès !"
    }
  },
  modals: {
    edit: {
      title: "Modifier Client",
      success: "Mise à jour réussie",
      successMsg: "Les informations du client ont été mises à jour",
      close: "Fermer",
      submitting: "Mise à jour...",
      update: "Mettre à jour"
    },
    delete: {
      title: "Supprimer Client",
      confirm: "Êtes-vous sûr de vouloir supprimer ce client ?",
      success: "Client supprimé avec succès",
      error: "Erreur lors de la suppression"
    },
    restore: {
      title: "Restaurer Client",
      confirm: "Voulez-vous restaurer ce client ?",
      success: "Client restauré avec succès",
      error: "Erreur lors de la restauration"
    },
    addToCash: {
      title: "Ajouter à la Caisse",
      amount: "Montant à ajouter",
      success: "Montant ajouté avec succès",
      error: "Erreur lors de l'ajout"
    }
  }
};

fs.writeFileSync(enPath, JSON.stringify(en, null, 2));
fs.writeFileSync(frPath, JSON.stringify(fr, null, 4));
console.log('Customers structure repaired and translated');
