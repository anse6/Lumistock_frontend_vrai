import { test } from '@playwright/test';
import { fileURLToPath } from 'url';
import path from 'path';

// Convertir import.meta.url en chemin fichier
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test('création complète d’un magasin', async ({ page }) => {
  test.setTimeout(90000);

  // Connexion
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  await page.getByRole('textbox', { name: 'Email' }).fill('marius@gmail.com');
  await page.getByRole('textbox', { name: 'Mot de passe' }).fill('pass123');
  await page.getByRole('button', { name: 'Connectez-vous' }).click();

  // Navigation vers Magasins
  await page.getByRole('button', { name: 'Tableau de bord' }).click();
  await page.getByRole('button', { name: 'magasin' }).click();

  // Ajouter un magasin
  const addButton = page.getByRole('button', { name: 'Ajouter un magasin' });
  await addButton.waitFor({ state: 'visible', timeout: 10000 });
  await addButton.click();

  // Upload d'image
  const uploadButton = page.getByRole('button', { name: 'Choose File' });
  await uploadButton.setInputFiles(path.resolve(__dirname, 'assets/7.png'));

  // Remplissage formulaire
  await page.locator('input[name="denomination"]').fill('anse');
  await page.locator('select[name="pays"]').selectOption('Sénégal');
  await page.locator('input[name="ville"]').fill('toto');
  await page.locator('input[name="quartier"]').fill('pepe');
  await page.locator('input[name="email"]').fill('pep@gmail.com');
  await page.locator('input[name="activite"]').fill('vente');
  await page.locator('select[name="nombre_manager"]').selectOption('4');
  await page.locator('select[name="nombre_livreur"]').selectOption('9');
  await page.locator('input[name="admin_name"]').fill('pe');
  await page.locator('input[name="admin_first_name"]').fill('anse');
  await page.locator('input[name="admin_email"]').fill('peanse@gmail.com');
  await page.getByRole('textbox', { name: 'Minimum 6 caractères' }).fill('123456');

  // Soumettre
  await page.getByRole('button', { name: 'Enregistrer' }).click();

  // Vérification
  await page.goto('http://localhost:5173/superadmin/dashboard/magasin');
  
});
