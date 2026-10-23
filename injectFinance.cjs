const fs = require('fs');
const enPath = 'src/locales/en/translation.json';
const frPath = 'src/locales/fr/translation.json';

let en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
let fr = JSON.parse(fs.readFileSync(frPath, 'utf8'));

if (!en.finance) en.finance = {};
if (!fr.finance) fr.finance = {};

const financePayloadEN = {
  pageTitle: "Financial Management",
  header: {
    title: "Finance Dashboard",
    subtitle: "Analyze and manage your financial resources"
  },
  tabs: {
    profitLoss: "P&L Analysis",
    reporting: "Cash Flow",
    assets: "Assets"
  },
  profitloss: {
    revenue: "Revenue",
    totalSales: "Total sales",
    totalCharges: "Total Charges",
    cumulativeExpenses: "Cumulative expenses",
    netProfit: "Net Profit",
    netProfitability: "Net profitability",
    margin: "margin",
    financialDistribution: "Financial Distribution",
    marginAnalysis: "Margin Analysis",
    revenueComposition: "Revenue Composition",
    totalPurchaseCost: "Purchase Cost (Total)",
    grossProfit: "Gross Profit",
    grossMarginPercent: "Gross Margin %"
  },
  reporting: {
    reportPeriod: "Report Period",
    initialBalance: "Initial Balance (Cash)",
    generateReports: "Generate Reports",
    pnlTitle: "Profit & Loss (PnL)",
    pnlSubtitle: "Gross economic performance",
    netProfitPeriod: "Net Profit Period",
    financialDetails: "Financial Details",
    sales: "Sales",
    stockPurchases: "Stock Purchases",
    expenses: "Expenses (Charges)",
    depreciation: "Depreciation",
    cashFlowTitle: "Cash Flow",
    cashFlowSubtitle: "Real liquidity management",
    openingBalance: "Opening Balance",
    netEntries: "Net Entries",
    totalExits: "Total Exits",
    projectedClosing: "Projected Closing Balance",
    action: "Action"
  },
  assets: {
    totalAssets: "Fixed Assets",
    totalAcquisition: "Total acquisition value",
    monthlyDepreciation: "Monthly Depreciation",
    estimatedDepreciation: "Estimated monthly depreciation",
    assetRegister: "Asset Register",
    assetTracking: "Tracking fixed assets and depreciation",
    newAsset: "New Asset",
    columns: {
      equipmentName: "Equipment Name",
      purchaseValue: "Purchase Value",
      lifespan: "Lifespan (Years)",
      monthlyDeprec: "Monthly Deprec.",
      purchaseDate: "Purchase Date",
      actions: "Actions",
      years: "years"
    },
    confirmDelete: "Delete this asset?",
    delete: "Delete",
    cancel: "Cancel",
    modal: {
      editTitle: "Edit Asset",
      addTitle: "Register New Equipment",
      save: "Save",
      name: "Equipment Name",
      namePlaceholder: "Ex: Dell XPS Computer",
      purchaseValue: "Purchase Value",
      lifespan: "Lifespan (years)",
      category: "Category",
      categoryPlaceholder: "Select a category",
      date: "Purchase Date",
      required: "Required"
    },
    categories: {
      informatique: "IT",
      mobilier: "Furniture",
      vehicule: "Vehicle",
      equipement: "Equipment",
      autre: "Other"
    },
    messages: {
      errorLoading: "Failed to load assets",
      successUpdate: "Asset updated",
      successCreate: "Asset registered",
      actionFailed: "Action failed",
      successDelete: "Asset deleted",
      errorDelete: "Failed to delete asset",
      error: "Error",
      success: "Success"
    }
  }
};

const financePayloadFR = {
  pageTitle: "Gestion Financière",
  header: {
    title: "Tableau de Bord Financier",
    subtitle: "Consultez et gérez vos ressources financières"
  },
  tabs: {
    profitLoss: "Analyse P&L",
    reporting: "Trésorerie",
    assets: "Immobilisations"
  },
  profitloss: {
    revenue: "Chiffre d'Affaires",
    totalSales: "Ventes totales",
    totalCharges: "Charges Totales",
    cumulativeExpenses: "Dépenses cumulées",
    netProfit: "Bénéfice Net",
    netProfitability: "Rentabilité nette",
    margin: "marge",
    financialDistribution: "Répartition Financière",
    marginAnalysis: "Analyse de la Marge",
    revenueComposition: "Composition du C.A.",
    totalPurchaseCost: "Coût Achat (Total)",
    grossProfit: "Bénéfice Brut",
    grossMarginPercent: "Marge Brute %"
  },
  reporting: {
    reportPeriod: "Période du Rapport",
    initialBalance: "Solde Initial (Caisse)",
    generateReports: "Générer les Rapports",
    pnlTitle: "Compte de Résultat (PnL)",
    pnlSubtitle: "Performance économique brute",
    netProfitPeriod: "Bénéfice Net Période",
    financialDetails: "Détails Financiers",
    sales: "Ventes",
    stockPurchases: "Achats Stock",
    expenses: "Dépenses (Charges)",
    depreciation: "Amortissements",
    cashFlowTitle: "Flux de Trésorerie (Cash Flow)",
    cashFlowSubtitle: "Gestion des liquidités réelles",
    openingBalance: "Solde Ouverture",
    netEntries: "Entrées Nettes",
    totalExits: "Sorties Totales",
    projectedClosing: "Solde Prévisionnel Clôture",
    action: "Action"
  },
  assets: {
    totalAssets: "Patrimoine Immobilisé",
    totalAcquisition: "Valeur d'acquisition totale",
    monthlyDepreciation: "Amortissement Mensuel",
    estimatedDepreciation: "Dépréciation mensuelle estimée",
    assetRegister: "Registre des Actifs",
    assetTracking: "Suivi des immobilisations et amortissements",
    newAsset: "Nouvel Actif",
    columns: {
      equipmentName: "Nom de l'Équipement",
      purchaseValue: "Valeur d'Achat",
      lifespan: "Durée (Ans)",
      monthlyDeprec: "Amort. Mensuel",
      purchaseDate: "Date d'Achat",
      actions: "Actions",
      years: "ans"
    },
    confirmDelete: "Supprimer cet actif ?",
    delete: "Supprimer",
    cancel: "Annuler",
    modal: {
      editTitle: "Modifier l'Actif",
      addTitle: "Enregistrer un Nouvel Équipement",
      save: "Enregistrer",
      name: "Nom de l'équipement",
      namePlaceholder: "Ex: Ordinateur Dell XPS",
      purchaseValue: "Valeur d'achat",
      lifespan: "Durée de vie (ans)",
      category: "Catégorie",
      categoryPlaceholder: "Choisir une catégorie",
      date: "Date d'achat",
      required: "Requis"
    },
    categories: {
      informatique: "Informatique",
      mobilier: "Mobilier",
      vehicule: "Véhicule",
      equipement: "Équipement",
      autre: "Autre"
    },
    messages: {
      errorLoading: "Impossible de charger les actifs",
      successUpdate: "Actif mis à jour",
      successCreate: "Actif enregistré",
      actionFailed: "Action échouée",
      successDelete: "Actif supprimé",
      errorDelete: "Impossible de supprimer l'actif",
      error: "Erreur",
      success: "Succès"
    }
  }
};

// Deep assign
function deepMerge(target, source) {
  for (const key in source) {
    if (source[key] instanceof Object && key in target) {
      Object.assign(source[key], deepMerge(target[key], source[key]));
    }
  }
  Object.assign(target || {}, source);
  return target;
}

en.finance = financePayloadEN; // Set strictly
fr.finance = financePayloadFR; // Set strictly

fs.writeFileSync(enPath, JSON.stringify(en, null, 2));
fs.writeFileSync(frPath, JSON.stringify(fr, null, 4));
console.log('Finance JSON structure written successfully!');
