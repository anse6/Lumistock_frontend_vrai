import { test } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('http://localhost:5173/');
  await page.getByRole('textbox', { name: 'Email' }).click();
  await page.getByRole('textbox', { name: 'Email' }).fill('marius@gmail.com');
  await page.locator('div').filter({ hasText: /^Mot de passe$/ }).click();
  await page.getByRole('textbox', { name: 'Mot de passe' }).fill('pass123');
  await page.getByRole('button', { name: 'Connectez-vous' }).click();
  await page.getByRole('button', { name: 'Tableau de bord' }).click();
  await page.getByRole('button', { name: 'utilisateurs' }).click();
  await page.getByRole('row', { name: '686798f1dc868ac9c683907a AP' }).getByRole('button').nth(2).click();
  await page.getByRole('row', { name: '686798f1dc868ac9c683907a AP' }).getByRole('button').nth(2).click();
});