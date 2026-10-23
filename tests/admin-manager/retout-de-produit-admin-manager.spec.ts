import { test } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('http://localhost:5173/');
  await page.getByRole('textbox', { name: 'Email' }).click();
  await page.getByRole('textbox', { name: 'Email' }).fill('ansevernel@gmail.com');
  await page.getByRole('textbox', { name: 'Mot de passe' }).click();
  await page.getByRole('textbox', { name: 'Mot de passe' }).fill('123456');
  await page.getByRole('button', { name: 'Connectez-vous' }).click();
  await page.getByRole('button', { name: 'Tableau de bord' }).click();
  await page.getByRole('button', { name: 'Livraison' }).click();
  await page.locator('tr:nth-child(2) > .px-1.py-1.relative > .text-gray-500').click();
  await page.getByRole('button', { name: 'Effectuer un retour' }).click();
  await page.getByRole('button', { name: '+' }).click();
  await page.getByRole('textbox', { name: 'Décrivez la raison du retour' }).click();
  await page.getByRole('textbox', { name: 'Décrivez la raison du retour' }).fill('le produit est de mauvais qualité');
  await page.getByRole('button', { name: 'Confirmer le retour' }).click();
});