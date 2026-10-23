import { test, expect } from '@playwright/test';

test('supprimer le premier magasin', async ({ page }) => {
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

  // 4️⃣ Cliquer sur "Supprimer"
  const deleteButton = page.getByRole('button', { name: 'Supprimer' });
  await deleteButton.waitFor({ state: 'visible', timeout: 10000 });
  await deleteButton.click();

  // 5️⃣ Confirmer la suppression
  const confirmButton = page.getByRole('button', { name: 'Supprimer' }).last();
  await confirmButton.waitFor({ state: 'visible', timeout: 10000 });
  await confirmButton.click();

  // 6️⃣ Vérification optionnelle : s'assurer que l'élément a été supprimé
  await expect(page.locator('table tbody tr').first()).not.toHaveText(/684836da/);
});
