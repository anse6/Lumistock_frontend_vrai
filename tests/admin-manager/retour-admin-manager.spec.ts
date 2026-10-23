import { test } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('http://localhost:5173/');
  await page.getByRole('textbox', { name: 'Email' }).click();
  await page.getByRole('textbox', { name: 'Email' }).fill('ansevernel@gmail.com');
  await page.getByRole('textbox', { name: 'Mot de passe' }).click();
  await page.getByRole('textbox', { name: 'Mot de passe' }).fill('123456');
  await page.getByRole('button', { name: 'Connectez-vous' }).click();
  await page.getByRole('button', { name: 'Tableau de bord' }).click();
  await page.getByRole('button', { name: 'Semaine' }).nth(2).click();
  await page.getByRole('button', { name: 'Mois' }).nth(2).click();
  await page.getByRole('button', { name: 'Annee' }).nth(2).click();
  await page.getByRole('button', { name: 'Jour' }).nth(2).click();
  await page.getByRole('button', { name: 'Suivant' }).nth(2).click();
  await page.getByRole('button', { name: 'Suivant' }).nth(2).click();
  await page.getByRole('button', { name: 'Précédent' }).nth(2).click();
  await page.getByRole('button', { name: 'Précédent' }).nth(2).click();
  await page.getByRole('combobox').nth(2).selectOption('686b8a4624a86a9ac21216ed');
  await page.getByRole('combobox').nth(2).selectOption('Tous');
});