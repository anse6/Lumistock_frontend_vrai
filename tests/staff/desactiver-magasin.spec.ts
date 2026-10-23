import { test } from '@playwright/test';

test('désactiver et réactiver le premier magasin', async ({ page }) => {
  test.setTimeout(60000); // Timeout étendu

  // 1️⃣ Connexion
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  await page.getByRole('textbox', { name: 'Email' }).fill('marius@gmail.com');
  await page.getByRole('textbox', { name: 'Mot de passe' }).fill('pass123');
  await page.getByRole('button', { name: 'Connectez-vous' }).click();

  // 2️⃣ Navigation vers Magasins
  const magasinButton = page.getByRole('button', { name: 'magasin' });
  await magasinButton.waitFor({ state: 'visible', timeout: 10000 });
  await magasinButton.click();

  // 3️⃣ Sélection du premier magasin
  const firstRowButton = page.locator('table tbody tr').first().getByRole('button');
  await firstRowButton.waitFor({ state: 'visible', timeout: 10000 });
  await firstRowButton.click();

  // 4️⃣ Désactiver le magasin
  const deactivateButton = page.getByRole('button', { name: 'Désactiver' });
  await deactivateButton.waitFor({ state: 'visible', timeout: 5000 });
  await deactivateButton.click();
  await deactivateButton.click(); // confirmer si une modale apparaît

  // 5️⃣ Réactiver le même magasin
  await firstRowButton.click(); // rouvrir le menu actions du premier magasin
  const activateButton = page.getByRole('button', { name: 'Activer' });
  await activateButton.waitFor({ state: 'visible', timeout: 5000 });
  await activateButton.click();
  await activateButton.click(); // confirmer si nécessaire

  // 6️⃣ Retour au tableau de bord
  const dashboardButton = page.getByRole('button', { name: 'Tableau de bord' });
  await dashboardButton.click();
});
