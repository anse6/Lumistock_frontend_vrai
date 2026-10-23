import { test } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('http://localhost:5173/');
  await page.getByRole('textbox', { name: 'Email' }).click();
  await page.getByRole('textbox', { name: 'Email' }).fill('ansenana3@gmail.com');
  await page.getByRole('textbox', { name: 'Mot de passe' }).click();
  await page.getByRole('textbox', { name: 'Mot de passe' }).fill('123456789');
  await page.getByRole('button', { name: 'Connectez-vous' }).click();
  await page.getByRole('button', { name: 'Livraison' }).click();
  await page.getByRole('button', { name: 'Livraison', exact: true }).click();
  await page.getByRole('button', { name: 'Produits' }).click();
  await page.getByRole('row', { name: '68614afbe28c4ca207bc4824 anse' }).getByRole('button').click();
  await page.getByRole('button', { name: 'Voir les détails' }).click();
  await page.getByRole('button', { name: 'Fermer' }).click();
});