const fs = require('fs');

let debtAdmin = fs.readFileSync('src/Components/admin/clients/ClientDebtAdmin.tsx', 'utf8');
if (!debtAdmin.includes('useTranslation')) {
  debtAdmin = debtAdmin.replace(`import { Link } from 'react-router-dom';`, `import { Link } from 'react-router-dom';\nimport { useTranslation } from 'react-i18next';`);
}
debtAdmin = debtAdmin.replace(/const { notification } = App.useApp\(\);/, `const { notification } = App.useApp();\n  const { t } = useTranslation();`);

debtAdmin = debtAdmin.replace(/>Dettes Clients</, `>{t('admin.customers.debt.pageTitle')}<`);
// Breadcrumb
debtAdmin = debtAdmin.replace(/>Tableau de bord</, `>{t('admin.customers.debt.breadcrumb.0')}<`);
debtAdmin = debtAdmin.replace(/'Gestion des dettes'/, `t('admin.customers.debt.breadcrumb.1')`);

// Header
debtAdmin = debtAdmin.replace(/Suivi des Dettes Clients/, `{t('admin.customers.debt.header.title')}`);
debtAdmin = debtAdmin.replace(/>Consultez et gérez les encours de paiement par client</, `>{t('admin.customers.debt.header.subtitle')}<`);

// Stats
debtAdmin = debtAdmin.replace(/>Total des Dettes</, `>{t('admin.customers.debt.stats.totalDebt')}<`);
debtAdmin = debtAdmin.replace(/>Montant global restant à payer</, `>{t('admin.customers.debt.stats.totalDebtDesc')}<`);
debtAdmin = debtAdmin.replace(/>Nombre de Clients débiteurs</, `>{t('admin.customers.debt.stats.debtorsCount')}<`);
debtAdmin = debtAdmin.replace(/>Personnes avec factures impayées</, `>{t('admin.customers.debt.stats.debtorsCountDesc')}<`);
debtAdmin = debtAdmin.replace(/\} clients</, `} {t('admin.customers.debt.stats.clients')}<`);

// Filters
debtAdmin = debtAdmin.replace(/"Rechercher un client..."/, `t('admin.customers.debt.filters.searchPlaceholder')`);
debtAdmin = debtAdmin.replace(/"Toutes les villes"/, `t('admin.customers.debt.filters.allCities')`);
debtAdmin = debtAdmin.replace(/"Tous les livreurs"/, `t('admin.customers.debt.filters.allDeliveryPersons')`);

// Table Section
debtAdmin = debtAdmin.replace(/tip="Chargement des données..."/, `tip={t('admin.customers.debt.modal.loading')}`);
debtAdmin = debtAdmin.replace(/>Liste des clients débiteurs</, `>{t('admin.customers.debt.table.listTitle')}<`);
debtAdmin = debtAdmin.replace(/\} résultats trouvés</, `} {t('admin.customers.debt.table.resultsFound')}<`);

// Notification
debtAdmin = debtAdmin.replace(/'Erreur de chargement'/, `t('admin.customers.debt.messages.loadErrorTitle')`);
debtAdmin = debtAdmin.replace(/'Impossible de récupérer les données de dettes clients.'/, `t('admin.customers.debt.messages.loadErrorDesc')`);

fs.writeFileSync('src/Components/admin/clients/ClientDebtAdmin.tsx', debtAdmin);
console.log('ClientDebtAdmin converted');
