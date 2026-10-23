import { test } from '@playwright/test';
import { fileURLToPath } from 'url';
import path from 'path';

// Convertir import.meta.url en chemin fichier
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test('ajout d’une image utilisateur', async ({ page }) => {
  test.setTimeout(90000);

  // Connexion
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  await page.getByRole('textbox', { name: 'Email' }).fill('marius@gmail.com');
  await page.getByRole('textbox', { name: 'Mot de passe' }).fill('pass123');
  await page.getByRole('button', { name: 'Connectez-vous' }).click();

  // Navigation vers gestion des images
  await page.getByRole('button', { name: 'Tableau de bord' }).click();
  await page.getByRole('button', { name: 'utilisateurs' }).click();
  await page.getByRole('button', { name: 'Gestion d\'images' }).click();

  // Ajouter une image
  await page.getByRole('link', { name: 'Ajouter une image' }).click();

  // Upload d'image
 const fileInput = page.locator('input[type="file"]');
 await fileInput.setInputFiles(path.resolve(__dirname, 'assets/7.png'));

  // Remplissage des champs
  await page.getByRole('textbox', { name: 'Ex: Produits, Logos, Bannières' }).fill('pep');
  await page.getByRole('textbox', { name: 'Ajoutez une description dé' }).fill('jdjdjdjdjdj');

  // Soumettre
  await page.getByRole('button', { name: 'Ajouter l\'image' }).click();


});
