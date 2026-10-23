import { test } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('http://localhost:5173/');
  await page.getByRole('textbox', { name: 'Email' }).click();
  await page.getByRole('textbox', { name: 'Email' }).fill('ansevernel@gmail.com');
  await page.getByRole('textbox', { name: 'Mot de passe' }).click();
  await page.getByRole('textbox', { name: 'Mot de passe' }).fill('123456');
  await page.getByRole('button', { name: 'Connectez-vous' }).click();
  await page.getByRole('button', { name: 'Tableau de bord' }).click();
  await page.getByRole('button', { name: 'Jour' }).first().click();
  await page.getByRole('button', { name: 'Semaine' }).first().click();
  await page.getByRole('button', { name: 'Mois' }).first().click();
  await page.getByRole('button', { name: 'Annee' }).first().click();
  await page.getByRole('button', { name: 'Suivant' }).first().click();
  await page.getByRole('button', { name: 'Suivant' }).first().click();
  await page.getByRole('button', { name: 'Précédent' }).first().click();
  await page.getByRole('button', { name: 'Précédent' }).first().click();
  await page.getByRole('combobox').first().selectOption('686798f1dc868ac9c683907a');
  await page.getByRole('combobox').first().selectOption('Tous');
});