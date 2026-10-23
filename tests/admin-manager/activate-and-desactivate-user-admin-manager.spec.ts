import { test } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('http://localhost:5173/');
  await page.getByRole('textbox', { name: 'Email' }).click();
  await page.getByRole('textbox', { name: 'Email' }).fill('ansevernel@gmail.com');
  await page.locator('div').filter({ hasText: /^Mot de passe$/ }).click();
  await page.getByRole('textbox', { name: 'Mot de passe' }).fill('123456');
  await page.getByRole('button', { name: 'Connectez-vous' }).click();
  await page.getByRole('button', { name: 'Tableau de bord' }).click();
  await page.getByRole('button', { name: 'utilisateurs' }).click();
  await page.getByRole('row', { name: '686798f1dc868ac9c683907a AP' }).getByRole('button').nth(2).click();
  await page.getByRole('row', { name: '686798f1dc868ac9c683907a AP' }).getByRole('button').nth(2).click();
});