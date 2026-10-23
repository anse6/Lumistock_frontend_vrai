import { test } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('http://localhost:5173/');
  await page.getByRole('textbox', { name: 'Email' }).click();
  await page.getByRole('textbox', { name: 'Email' }).fill('ansevernel@gmail.com');
  await page.getByRole('textbox', { name: 'Mot de passe' }).click();
  await page.getByRole('textbox', { name: 'Mot de passe' }).fill('123456');
  await page.getByRole('button', { name: 'Connectez-vous' }).click();
  await page.getByRole('button', { name: 'Tableau de bord' }).click();
  await page.getByRole('button', { name: 'Produits' }).click();
  await page.getByRole('row', { name: '68678854dc868ac9c6839075' }).getByRole('button').click();
  await page.getByRole('button', { name: 'Approvisionner' }).click();
  await page.getByRole('spinbutton', { name: 'Quantité:' }).click();
  await page.getByRole('spinbutton', { name: 'Quantité:' }).fill('2000');
  await page.getByRole('button', { name: 'Approvisionner' }).nth(1).click();
});