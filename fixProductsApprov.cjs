const fs = require('fs');

const frPath = 'src/locales/fr/translation.json';
const enPath = 'src/locales/en/translation.json';

const fr = JSON.parse(fs.readFileSync(frPath, 'utf8'));
const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));

if (!fr.admin.products.form) fr.admin.products.form = {};
if (!en.admin.products.form) en.admin.products.form = {};

// FR
fr.admin.products.form.placeholder_name = "Ex: Sac de Riz 50kg";
fr.admin.products.form.placeholder_desc = "Détails du produit, caractéristiques...";
fr.admin.products.form.choose_category = "Choisir une catégorie";
fr.admin.products.form.new_category = "Nouvelle catégorie";
fr.admin.products.form.bag = "Sac";
fr.admin.products.form.kilogram = "Kilogramme (kg)";
fr.admin.products.form.carton = "Carton";
fr.admin.products.form.bottle = "Bouteille";
fr.admin.products.form.liter = "Litre (L)";
fr.admin.products.form.gram = "Gramme (g)";
fr.admin.products.form.packet = "Paquet";
fr.admin.products.form.placeholder_carton = "Ex: Carton";
fr.admin.products.form.placeholder_cat_name = "Alimentation, Boissons...";
fr.admin.products.image.tooltip_suggestions = "Images souvent utilisées pour ce type de produit";
fr.admin.products.code_id = "Code ID";

if (!fr.admin.supplies.units) fr.admin.supplies.units = {};
fr.admin.supplies.units.simple = "Unités simples:";
fr.admin.supplies.units.total = "Total:";
if (!fr.admin.supplies.filters) fr.admin.supplies.filters = {};
fr.admin.supplies.filters.less_than_100k = "Moins de 100.000";
fr.admin.supplies.filters.between_100k_500k = "100.000 - 500.000";
fr.admin.supplies.filters.more_than_500k = "Plus de 500.000";

// EN
en.admin.products.form.placeholder_name = "Ex: 50kg Rice Bag";
en.admin.products.form.placeholder_desc = "Product details, technical specifications...";
en.admin.products.form.choose_category = "Choose a category";
en.admin.products.form.new_category = "New category";
en.admin.products.form.bag = "Bag";
en.admin.products.form.kilogram = "Kilogram (kg)";
en.admin.products.form.carton = "Carton";
en.admin.products.form.bottle = "Bottle";
en.admin.products.form.liter = "Liter (L)";
en.admin.products.form.gram = "Gram (g)";
en.admin.products.form.packet = "Packet";
en.admin.products.form.placeholder_carton = "Ex: Carton";
en.admin.products.form.placeholder_cat_name = "Food, Beverages...";
if(!en.admin.products.image) en.admin.products.image = {};
en.admin.products.image.tooltip_suggestions = "Images often used for this type of product";
en.admin.products.code_id = "Code ID";

if (!en.admin.supplies.units) en.admin.supplies.units = {};
en.admin.supplies.units.simple = "Simple units:";
en.admin.supplies.units.total = "Total:";
if (!en.admin.supplies.filters) en.admin.supplies.filters = {};
en.admin.supplies.filters.less_than_100k = "Less than 100,000";
en.admin.supplies.filters.between_100k_500k = "100,000 - 500,000";
en.admin.supplies.filters.more_than_500k = "More than 500,000";

fs.writeFileSync(frPath, JSON.stringify(fr, null, 4));
fs.writeFileSync(enPath, JSON.stringify(en, null, 4));

const replaceInFile = (path, replacements) => {
    let content = fs.readFileSync(path, 'utf8');
    replacements.forEach(r => {
        content = content.replace(r.from, r.to);
    });
    fs.writeFileSync(path, content, 'utf8');
}

replaceInFile('src/Components/admin/proapprov/product/addproduct.tsx', [
    { from: /"Ex: Sac de Riz 50kg"/g, to: "{t('admin.products.form.placeholder_name')}" },
    { from: /"Détails du produit, caractéristiques\.\.\."/g, to: "{t('admin.products.form.placeholder_desc')}" },
    { from: />Sac</g, to: ">{t('admin.products.form.bag')}<" },
    { from: />Kilogramme \(kg\)</g, to: ">{t('admin.products.form.kilogram')}<" },
    { from: />Carton</g, to: ">{t('admin.products.form.carton')}<" },
    { from: />Bouteille</g, to: ">{t('admin.products.form.bottle')}<" },
    { from: />Litre \(L\)</g, to: ">{t('admin.products.form.liter')}<" },
    { from: />Gramme \(g\)</g, to: ">{t('admin.products.form.gram')}<" },
    { from: />Paquet</g, to: ">{t('admin.products.form.packet')}<" },
    { from: /"Ex: Carton"/g, to: "{t('admin.products.form.placeholder_carton')}" },
    { from: /title="Images souvent utilisées for ce type de produit"/g, to: "title={t('admin.products.image.tooltip_suggestions')}" }
]);

replaceInFile('src/Components/admin/Produits/EditModal.tsx', [
    { from: /"Ex: Sac de Riz 50kg"/g, to: "{t('admin.products.form.placeholder_name')}" },
    { from: /"Détails du produit\.\.\."/g, to: "{t('admin.products.form.placeholder_desc')}" },
    { from: /"Choisir une catégorie"/g, to: "{t('admin.products.form.choose_category')}" },
    { from: />\s*Nouvelle catégorie\s*</g, to: ">{t('admin.products.form.new_category')}<" },
    { from: />Sac</g, to: ">{t('admin.products.form.bag')}<" },
    { from: />Kilogramme \(kg\)</g, to: ">{t('admin.products.form.kilogram')}<" },
    { from: />Carton</g, to: ">{t('admin.products.form.carton')}<" },
    { from: />Bouteille</g, to: ">{t('admin.products.form.bottle')}<" },
    { from: />Litre \(L\)</g, to: ">{t('admin.products.form.liter')}<" },
    { from: />Gramme \(g\)</g, to: ">{t('admin.products.form.gram')}<" },
    { from: />Paquet</g, to: ">{t('admin.products.form.packet')}<" },
    { from: /"Alimentation, Boissons\.\.\."/g, to: "{t('admin.products.form.placeholder_cat_name')}" },
    { from: /"Ex: Carton"/g, to: "{t('admin.products.form.placeholder_carton')}" }
]);

replaceInFile('src/Components/admin/approvisonnement/ProductSelect .tsx', [
    { from: /Unités simples:/g, to: "{t('admin.supplies.units.simple')}" },
    { from: /Total:/g, to: "{t('admin.supplies.units.total')}" },
    { from: /submitError === 'Veuillez sélectionner un client'/g, to: "submitError === t('admin.supplies.select_deliverer')" }
]);

replaceInFile('src/Components/admin/proapprov/product/produictdetail.tsx', [
    { from: /label="Code ID"/g, to: "label={t('admin.products.code_id')}" }
]);

replaceInFile('src/Components/admin/Produiapprivisionnements.tsx', [
    { from: /Moins de 100\.000/g, to: "{t('admin.supplies.filters.less_than_100k')}" },
    { from: /100\.000 - 500\.000/g, to: "{t('admin.supplies.filters.between_100k_500k')}" },
    { from: /Plus de 500\.000/g, to: "{t('admin.supplies.filters.more_than_500k')}" }
]);

console.log("Translation done");
