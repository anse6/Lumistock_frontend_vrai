import { test } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('http://localhost:5173/');
  await page.getByRole('textbox', { name: 'Email' }).click();
  await page.getByRole('textbox', { name: 'Email' }).fill('ansevernel@gmail.com');
  await page.getByRole('textbox', { name: 'Mot de passe' }).click();
  await page.getByRole('textbox', { name: 'Mot de passe' }).fill('123456');
  await page.getByRole('button', { name: 'Connectez-vous' }).click();
  await page.getByRole('button', { name: 'Produits' }).click();
  await page.getByRole('row', { name: '68624974e14e1e5c02c63a9a' }).getByRole('button').click();
  await page.getByRole('link', { name: 'Voir détails' }).click();
  await page.getByRole('main').getByRole('link', { name: 'Produits' }).click();
});