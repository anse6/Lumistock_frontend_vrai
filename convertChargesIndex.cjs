const fs = require('fs');
let code = fs.readFileSync('src/Modules/Charges/index.tsx', 'utf8');

if (!code.includes('useTranslation')) {
  code = code.replace(`from 'react';`, `from 'react';\nimport { useTranslation } from 'react-i18next';`);
}

code = code.replace(`const { notification } = App.useApp();`, `const { notification } = App.useApp();\n  const { t } = useTranslation();`);

// Messages
code = code.replace(`{ message: 'Erreur', description: 'Impossible de charger les charges' }`, `{ message: t('admin.charges.messages.error'), description: t('admin.charges.messages.errorLoading') }`);
code = code.replace(`{ message: 'Succès', description: 'Charge mise à jour' }`, `{ message: t('admin.charges.messages.success'), description: t('admin.charges.messages.successUpdate') }`);
code = code.replace(`\`\${items.length} charge(s) enregistrée(s)\``, `t('admin.charges.messages.successCreate', { count: items.length })`);
code = code.replace(`{ message: 'Erreur', description: 'Action échouée' }`, `{ message: t('admin.charges.messages.error'), description: t('admin.charges.messages.actionFailed') }`);
code = code.replace(`{ message: 'Succès', description: 'Charge supprimée' }`, `{ message: t('admin.charges.messages.success'), description: t('admin.charges.messages.successDelete') }`);
code = code.replace(`{ message: 'Erreur', description: 'Impossible de supprimer la charge' }`, `{ message: t('admin.charges.messages.error'), description: t('admin.charges.messages.errorDelete') }`);

// Modal texts and confirm
code = code.replace(`title="Supprimer cette charge ?"`, `title={t('admin.charges.confirmDelete')}`);
code = code.replace(`okText="Oui"`, `okText={t('admin.charges.yes')}`);
code = code.replace(`cancelText="Non"`, `cancelText={t('admin.charges.no')}`);

// Titles and static labels
code = code.replace(/<PageTitle>Journal des Charges<\/PageTitle>/g, `<PageTitle>{t('admin.charges.title')}<\/PageTitle>`);
code = code.replace(/Journal des Charges/g, `{t('admin.charges.title')}`);
code = code.replace(/Consultez et gérez vos dépenses courantes/g, `{t('admin.charges.subtitle')}`);
code = code.replace(/Rechercher une charge\.\.\./g, `searchPlaceholder`);
code = code.replace(/placeholder="searchPlaceholder"/g, `placeholder={t('admin.charges.searchPlaceholder')}`);

code = code.replace(/Nouv\. Dépense/g, `{t('admin.charges.newExpense')}`);
code = code.replace(/Dépenses Filtrées/g, `{t('admin.charges.filteredExpenses')}`);
code = code.replace(/opérations trouvées/g, `{t('admin.charges.operationsFound')}`);

code = code.replace(/>Catégorie<\/Text>/g, `>{t('admin.charges.category')}<\/Text>`);
code = code.replace(/placeholder="Filtrer"/g, `placeholder={t('admin.charges.category')}`);
code = code.replace(/>Période<\/Text>/g, `>{t('admin.charges.period')}<\/Text>`);
code = code.replace(/Réinitialiser/g, `{t('admin.charges.reset')}`);

// Columns
code = code.replace(/title: 'Désignation'/g, `title: t('admin.charges.columns.designation')`);
code = code.replace(/title: 'Catégorie'/g, `title: t('admin.charges.columns.category')`);
code = code.replace(/title: 'Montant'/g, `title: t('admin.charges.columns.amount')`);
code = code.replace(/title: 'Date'/g, `title: t('admin.charges.columns.date')`);
code = code.replace(/title: 'Actions'/g, `title: t('admin.charges.columns.actions')`);

// Table total
code = code.replace(/Total \{total\} charges<\/span>/g, `{t('admin.charges.totalCharges', { total })}<\/span>`);

// Select options
code = code.replace(
  `{ label: 'Salaire', value: 'salaire' },\n                        { label: 'Loyer', value: 'loyer' },\n                        { label: 'Électricité', value: 'electricite' },\n                        { label: 'Transport', value: 'transport' },\n                        { label: 'Autre', value: 'autre' },`,
  `{ label: t('admin.charges.categories.salaire'), value: 'salaire' },\n                        { label: t('admin.charges.categories.loyer'), value: 'loyer' },\n                        { label: t('admin.charges.categories.electricite'), value: 'electricite' },\n                        { label: t('admin.charges.categories.transport'), value: 'transport' },\n                        { label: t('admin.charges.categories.autre'), value: 'autre' },`
);

fs.writeFileSync('src/Modules/Charges/index.tsx', code);
console.log('Charges/index.tsx localized');
