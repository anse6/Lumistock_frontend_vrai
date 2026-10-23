import { test, expect } from '@playwright/test';

test('mettre à jour le premier magasin', async ({ page }) => {
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

  // 4️⃣ Cliquer sur "Modifier"
  const editButton = page.getByRole('button', { name: 'Modifier' });
  await editButton.waitFor({ state: 'visible', timeout: 10000 });
  await editButton.click();

  // 5️⃣ Mettre à jour la ville
  const cityInput = page.getByRole('textbox', { name: 'Entrez la ville' });
  await cityInput.fill('yaounde');

  // 6️⃣ Enregistrer les modifications
  const saveButton = page.getByRole('button', { name: 'Enregistrer les modifications' });
  await saveButton.click();

  // 7️⃣ Vérification optionnelle : la ville mise à jour apparaît dans la liste
  const updatedCity = page.locator('table tbody tr').first().locator('td').nth(4); // index selon colonne "ville"
  await expect(updatedCity).toHaveText('yaounde');
});
