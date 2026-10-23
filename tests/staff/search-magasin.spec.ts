import { test } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('http://localhost:5173/');
  await page.getByRole('textbox', { name: 'Email' }).click();
  await page.getByRole('textbox', { name: 'Email' }).fill('marius@gmail.com');
  await page.getByRole('textbox', { name: 'Mot de passe' }).click();
  await page.getByRole('textbox', { name: 'Mot de passe' }).fill('pass12');
  await page.getByRole('button', { name: 'Connectez-vous' }).click();
  await page.getByRole('textbox', { name: 'Mot de passe' }).click();
  await page.getByRole('textbox', { name: 'Mot de passe' }).fill('pass123');
  await page.getByRole('button', { name: 'Connectez-vous' }).click();
  await page.getByRole('button', { name: 'utilisateurs' }).click();
  await page.getByRole('button', { name: 'magasin' }).click();
  await page.getByRole('textbox', { name: 'Rechercher...' }).click();
  await page.getByRole('textbox', { name: 'Rechercher...' }).fill('kliva');
});