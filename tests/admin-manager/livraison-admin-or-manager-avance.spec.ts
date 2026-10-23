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
  await page.getByRole('button', { name: 'Commencer une livraison' }).click();
  await page.getByText('ppp').click();
  await page.getByRole('button', { name: 'Continuer' }).click();
  await page.getByRole('combobox').first().selectOption('684aebe25578ad0e8acbd185');
  await page.getByRole('button').filter({ hasText: /^$/ }).nth(2).click();
  await page.getByLabel('Statut du paiement').selectOption('partiellement payé');
  await page.getByRole('checkbox', { name: 'cochez' }).check();
  await page.getByPlaceholder('Montant avancé').click();
  await page.getByPlaceholder('Montant avancé').fill('100');
  await page.getByRole('button', { name: 'Enregistrer la livraison' }).click();
});



