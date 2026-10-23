import { test, expect } from '@playwright/test';

test('test export produits', async ({ page }) => {
  await page.goto('http://localhost:5173/');

  await page.getByRole('textbox', { name: 'Email' }).fill('ansevernel@gmail.com');
  await page.getByRole('textbox', { name: 'Mot de passe' }).fill('123456');
  await page.getByRole('button', { name: 'Connectez-vous' }).click();

  await page.getByRole('button', { name: 'Tableau de bord' }).click();
  await page.getByRole('button', { name: 'Livraison' }).click();
  await page.getByRole('button', { name: 'Produits' }).click();

  // Attente du téléchargement
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export' }).click();
  const download = await downloadPromise;

  // Vérifier que le téléchargement a bien été déclenché
  expect(download).toBeTruthy();
  expect(download.suggestedFilename()).toBeTruthy();
});