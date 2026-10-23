import { test, expect } from '@playwright/test';

test('afficher le premier magasin', async ({ page }) => {
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

  // 3️⃣ Cliquer sur le premier magasin
  const firstRowButton = page.locator('table tbody tr').first().getByRole('button');
  await firstRowButton.waitFor({ state: 'visible', timeout: 10000 });
  await firstRowButton.click();

  // 4️⃣ Cliquer sur "Voir détails"
  const detailsButton = page.getByRole('button', { name: 'Voir détails' });
  await detailsButton.waitFor({ state: 'visible', timeout: 10000 });
  await detailsButton.click();

  // 5️⃣ Cliquer sur "Retour"
  const backButton = page.getByRole('button', { name: 'Retour' });
  await backButton.waitFor({ state: 'visible', timeout: 10000 });
  await backButton.click();

  // 6️⃣ Vérification optionnelle : le bouton "Ajouter un magasin" est visible après retour
  await expect(page.getByRole('button', { name: 'Ajouter un magasin' })).toBeVisible();
});
