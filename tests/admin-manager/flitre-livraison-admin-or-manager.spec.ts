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
  await page.getByRole('button', { name: 'Filtre' }).click();
  await page.locator('div').filter({ hasText: /^Statut paiementTous les statutsPayéNon payéPartiellement$/ }).getByRole('combobox').selectOption('payé');
  await page.locator('div').filter({ hasText: /^Statut livraisonTous les statutsEn coursLivrée$/ }).getByRole('combobox').selectOption('en cours');
  await page.getByRole('button', { name: 'Réinitialiser' }).click();
});