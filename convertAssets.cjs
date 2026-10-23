const fs = require('fs');
let code = fs.readFileSync('src/Modules/Charges/AssetManagement.tsx', 'utf8');

if (!code.includes('useTranslation')) {
  code = code.replace(`from 'react';`, `from 'react';\nimport { useTranslation } from 'react-i18next';`);
}
code = code.replace(`const [form] = Form.useForm();`, `const [form] = Form.useForm();\n  const { t } = useTranslation();`);

// Simple text replacements in JSX
code = code.replace(/>Patrimoine Immobilisé</g, `>{t('finance.assets.totalAssets')}<`);
code = code.replace(/>Valeur d'acquisition totale</g, `>{t('finance.assets.totalAcquisition')}<`);
code = code.replace(/>Amortissement Mensuel</g, `>{t('finance.assets.monthlyDepreciation')}<`);
code = code.replace(/>Dépréciation mensuelle estimée</g, `>{t('finance.assets.estimatedDepreciation')}<`);
code = code.replace(/>Registre des Actifs</g, `>{t('finance.assets.assetRegister')}<`);
code = code.replace(/>Suivi des immobilisations et amortissements</g, `>{t('finance.assets.assetTracking')}<`);
code = code.replace(/>Nouvel Actif</g, `>{t('finance.assets.newAsset')}<`);

// Columns
code = code.replace(/title: 'Nom de l\\'Équipement'/g, `title: t('finance.assets.columns.equipmentName')`);
code = code.replace(/title: 'Valeur d\\'Achat'/g, `title: t('finance.assets.columns.purchaseValue')`);
code = code.replace(/title: 'Durée \(Ans\)'/g, `title: t('finance.assets.columns.lifespan')`);
code = code.replace(/title: 'Amort. Mensuel'/g, `title: t('finance.assets.columns.monthlyDeprec')`);
code = code.replace(/title: 'Date d\\'Achat'/g, `title: t('finance.assets.columns.purchaseDate')`);
code = code.replace(/title: 'Actions'/g, `title: t('finance.assets.columns.actions')`);

code = code.replace(/>\{years\} ans<\/Tag>/g, `>{years} {t('finance.assets.columns.years')}</Tag>`);
code = code.replace(/title="Supprimer cet actif \?"/g, `title={t('finance.assets.confirmDelete')}`);

// Modal Texts
code = code.replace(`title={editingAsset ? "Modifier l'Actif" : "Enregistrer un Nouvel Équipement"}`, `title={editingAsset ? t('finance.assets.modal.editTitle') : t('finance.assets.modal.addTitle')}`);
code = code.replace(`label="Nom de l'équipement"`, `label={t('finance.assets.modal.name')}`);
code = code.replace(`placeholder="Ex: Ordinateur Dell XPS"`, `placeholder={t('finance.assets.modal.namePlaceholder')}`);
code = code.replace(`label="Valeur d'achat"`, `label={t('finance.assets.modal.purchaseValue')}`);
code = code.replace(`label="Durée de vie (ans)"`, `label={t('finance.assets.modal.lifespan')}`);
code = code.replace(`addonAfter="ans"`, `addonAfter={t('finance.assets.columns.years')}`);
code = code.replace(/label="Catégorie"/g, `label={t('finance.assets.modal.category')}`);
code = code.replace(`placeholder="Choisir une catégorie"`, `placeholder={t('finance.assets.modal.categoryPlaceholder')}`);
code = code.replace(`label="Date d'achat"`, `label={t('finance.assets.modal.date')}`);
code = code.replace(/message: 'Requis'/g, `message: t('finance.assets.modal.required')`);

code = code.replace(`okText="Enregistrer"`, `okText={t('finance.assets.modal.save')}`);
code = code.replace(/cancelText="Annuler"/g, `cancelText={t('finance.assets.cancel')}`);
code = code.replace(/okText="Supprimer"/g, `okText={t('finance.assets.delete')}`);

// Messages
code = code.replace(`{ message: 'Erreur', description: 'Impossible de charger les actifs' }`, `{ message: t('finance.assets.messages.error'), description: t('finance.assets.messages.errorLoading') }`);
code = code.replace(`{ message: 'Succès', description: 'Actif mis à jour' }`, `{ message: t('finance.assets.messages.success'), description: t('finance.assets.messages.successUpdate') }`);
code = code.replace(`{ message: 'Succès', description: 'Actif enregistré' }`, `{ message: t('finance.assets.messages.success'), description: t('finance.assets.messages.successCreate') }`);
code = code.replace(`{ message: 'Erreur', description: 'Action échouée' }`, `{ message: t('finance.assets.messages.error'), description: t('finance.assets.messages.actionFailed') }`);
code = code.replace(`{ message: 'Succès', description: 'Actif supprimé' }`, `{ message: t('finance.assets.messages.success'), description: t('finance.assets.messages.successDelete') }`);
code = code.replace(`{ message: 'Erreur', description: 'Impossible de supprimer l\\'actif' }`, `{ message: t('finance.assets.messages.error'), description: t('finance.assets.messages.errorDelete') }`);

code = code.replace(
  `const ASSET_CATEGORIES: { label: string; value: AssetCategory; icon: React.ReactNode }[] = [`, 
  `const getAssetCategories = (t: any): { label: string; value: AssetCategory; icon: React.ReactNode }[] => [`
).replace(
  `{ label: 'Informatique', value: 'informatique', icon: <Monitor size={14} /> },\n  { label: 'Mobilier', value: 'mobilier', icon: <Armchair size={14} /> },\n  { label: 'Véhicule', value: 'vehicule', icon: <Truck size={14} /> },\n  { label: 'Équipement', value: 'equipement', icon: <Package size={14} /> },\n  { label: 'Autre', value: 'autre', icon: <Layers size={14} /> },\n];`,
  `{ label: t('finance.assets.categories.informatique'), value: 'informatique', icon: <Monitor size={14} /> },\n  { label: t('finance.assets.categories.mobilier'), value: 'mobilier', icon: <Armchair size={14} /> },\n  { label: t('finance.assets.categories.vehicule'), value: 'vehicule', icon: <Truck size={14} /> },\n  { label: t('finance.assets.categories.equipement'), value: 'equipement', icon: <Package size={14} /> },\n  { label: t('finance.assets.categories.autre'), value: 'autre', icon: <Layers size={14} /> },\n];`
);

code = code.replace(/ASSET_CATEGORIES\.map/g, `getAssetCategories(t).map`);

fs.writeFileSync('src/Modules/Charges/AssetManagement.tsx', code);
console.log('AssetManagement localized');
