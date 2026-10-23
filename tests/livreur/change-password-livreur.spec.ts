import { test } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('http://localhost:5173/');
  await page.getByRole('textbox', { name: 'Email' }).click();
  await page.getByRole('textbox', { name: 'Email' }).fill('ansenana3@gmail.com');
  await page.getByRole('textbox', { name: 'Mot de passe' }).click();
  await page.getByRole('textbox', { name: 'Mot de passe' }).fill('123456789');
  await page.getByRole('button', { name: 'Connectez-vous' }).click();
  await page.getByRole('button', { name: 'Tableau de bord' }).click();
  await page.getByRole('button', { name: 'Livraison' }).click();
  await page.getByRole('button', { name: 'Produits' }).click();
  await page.getByRole('button', { name: 'Produits' }).click();
  await page.getByRole('button', { name: 'Clients' }).click();
  await page.getByRole('button', { name: 'Paramètre' }).click();
  await page.getByRole('button', { name: 'Modifier votre mot de passe' }).click();
  await page.locator('input[name="old_password"]').click();
  await page.locator('input[name="old_password"]').fill('123456789');
  await page.locator('input[name="new_password"]').click();
  await page.locator('input[name="new_password"]').fill('12345678');
  await page.locator('input[name="confirm_password"]').click();
  await page.locator('input[name="confirm_password"]').fill('12345678');
  await page.getByRole('button', { name: 'Changer' }).click();
});