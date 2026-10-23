import { test } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('http://localhost:5173/');
  await page.getByRole('textbox', { name: 'Email' }).click();
  await page.getByRole('textbox', { name: 'Email' }).fill('marius@gmail.com');
  await page.getByRole('textbox', { name: 'Mot de passe' }).click();
  await page.getByRole('textbox', { name: 'Mot de passe' }).fill('pass123');
  await page.getByRole('button', { name: 'Connectez-vous' }).click();
  await page.getByRole('button', { name: 'Tableau de bord' }).click();
  await page.getByRole('button', { name: 'utilisateurs' }).click();
  await page.getByRole('row', { name: '684849749f73b1c61881d051 TA' }).getByRole('button').nth(1).click();
  await page.getByRole('textbox', { name: 'Nouveau mot de passe' }).click();
  await page.getByRole('textbox', { name: 'Nouveau mot de passe' }).fill('123456');
  await page.getByRole('button', { name: 'Valider' }).click();
});