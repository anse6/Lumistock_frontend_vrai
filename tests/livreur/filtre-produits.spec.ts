import { test } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('http://localhost:5173/');
  await page.getByRole('textbox', { name: 'Email' }).click();
  await page.getByRole('textbox', { name: 'Email' }).fill('ansenana3@gmail.com');
  await page.getByRole('textbox', { name: 'Mot de passe' }).click();
  await page.getByRole('textbox', { name: 'Mot de passe' }).fill('123456789');
  await page.getByRole('button', { name: 'Connectez-vous' }).click();
  await page.getByRole('button', { name: 'Tableau de bord' }).click();
  await page.getByRole('button', { name: 'Produits' }).click();
  await page.getByRole('button', { name: 'Filtre' }).click();
  await page.locator('div').filter({ hasText: /^DisponibilitéTous les produitsEn stockRupture de stock$/ }).getByRole('combobox').selectOption('true');
  await page.getByRole('button', { name: 'Appliquer les filtres' }).click();
});