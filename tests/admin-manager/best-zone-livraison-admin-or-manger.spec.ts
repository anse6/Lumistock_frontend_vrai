import { test } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('http://localhost:5173/');
  await page.getByRole('textbox', { name: 'Email' }).click();
  await page.getByRole('textbox', { name: 'Email' }).fill('ansevernel@gmail.com');
  await page.getByRole('textbox', { name: 'Mot de passe' }).click();
  await page.getByRole('textbox', { name: 'Mot de passe' }).fill('123456');
  await page.getByRole('button', { name: 'Connectez-vous' }).click();
  await page.getByRole('button', { name: 'Tableau de bord' }).click();
  await page.getByText('Toutes').nth(1).click();
  await page.getByTitle('yaounde').locator('div').click();
  await page.locator('#root').getByTitle('yaounde').click();
  await page.getByTitle('MBOUDA').locator('div').click();
  await page.locator('#root').getByTitle('MBOUDA').click();
  await page.getByText('Toutes').nth(1).click();
});