const fs = require('fs');
let code = fs.readFileSync('src/Modules/Charges/ChargeModal.tsx', 'utf8');

if (!code.includes('useTranslation')) {
  code = code.replace(`from 'react';`, `from 'react';\nimport { useTranslation } from 'react-i18next';`);
}

code = code.replace(`const [form] = Form.useForm();`, `const [form] = Form.useForm();\n  const { t } = useTranslation();`);

// Simple text replacements in JSX
code = code.replace(`title={initialValues ? "Modifier la charge" : "Enregistrer des charges"}`, 
  `title={initialValues ? t('admin.charges.modal.titleEdit') : t('admin.charges.modal.titleAdd')}`);
  
code = code.replace(`okText={initialValues ? "Enregistrer" : "Valider"}`, 
  `okText={initialValues ? t('admin.charges.modal.save') : t('admin.charges.modal.validate')}`);

code = code.replace(`cancelText="Annuler"`, `cancelText={t('admin.charges.modal.cancel')}`);

// Regex or targeted replacing for fields
code = code.replace(/message: 'Requis'/g, `message: t('admin.charges.modal.required')`);
code = code.replace(/message: 'Nom requis'/g, `message: t('admin.charges.modal.nameRequired')`);
code = code.replace(/message: 'Montant requis'/g, `message: t('admin.charges.modal.amountRequired')`);

code = code.replace(/label="Nom"/g, `label={t('admin.charges.modal.name')}`);
code = code.replace(/placeholder="Ex: Loyer Magasin"/g, `placeholder={t('admin.charges.modal.namePlaceholder')}`);
code = code.replace(/placeholder="Ex: Salaire"/g, `placeholder={t('admin.charges.modal.namePlaceholder')}`);

code = code.replace(/label="Montant"/g, `label={t('admin.charges.modal.amount')}`);
code = code.replace(/placeholder="Prix"/g, `placeholder={t('admin.charges.modal.amountPlaceholder')}`);

code = code.replace(/label="Catégorie"/g, `label={t('admin.charges.modal.category')}`);
code = code.replace(/placeholder="Catégorie"/g, `placeholder={t('admin.charges.modal.categoryPlaceholder')}`);

code = code.replace(/label="Date"/g, `label={t('admin.charges.modal.date')}`);

code = code.replace(/label="Description"/g, `label={t('admin.charges.modal.description')}`);
code = code.replace(/placeholder="Détails \(Optionnel\)"/g, `placeholder={t('admin.charges.modal.descPlaceholder')}`);

code = code.replace(/Ajouter une autre ligne de charge/g, `{t('admin.charges.modal.addAnother')}`);

// For Category map:
code = code.replace(
  `const CATEGORIES: { label: string; value: ChargeCategory }[] = [`, 
  `const getCategories = (t: any): { label: string; value: ChargeCategory }[] => [`
).replace(
  `{ label: 'Salaire', value: 'salaire' },\n  { label: 'Loyer', value: 'loyer' },\n  { label: 'Électricité', value: 'electricite' },\n  { label: 'Transport', value: 'transport' },\n  { label: 'Autre', value: 'autre' },\n];`,
  `{ label: t('admin.charges.categories.salaire'), value: 'salaire' },\n  { label: t('admin.charges.categories.loyer'), value: 'loyer' },\n  { label: t('admin.charges.categories.electricite'), value: 'electricite' },\n  { label: t('admin.charges.categories.transport'), value: 'transport' },\n  { label: t('admin.charges.categories.autre'), value: 'autre' },\n];`
);

code = code.replace(/<Select options=\{CATEGORIES\}/g, `<Select options={getCategories(t)}`);
code = code.replace(/<Select options=\{CATEGORIES\} placeholder/g, `<Select options={getCategories(t)} placeholder`);

fs.writeFileSync('src/Modules/Charges/ChargeModal.tsx', code);
console.log('ChargeModal localized');
