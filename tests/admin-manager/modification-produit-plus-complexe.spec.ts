import { test } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('http://localhost:5173/');
  await page.getByRole('textbox', { name: 'Email' }).click();
  await page.getByRole('textbox', { name: 'Email' }).fill('ansevernel@gmail.com');
  await page.getByRole('textbox', { name: 'Mot de passe' }).click();
  await page.getByRole('textbox', { name: 'Mot de passe' }).fill('123456');
  await page.getByRole('button', { name: 'Connectez-vous' }).click();
  await page.getByRole('button', { name: 'Tableau de bord' }).click();
  await page.getByRole('button', { name: 'Produits' }).click();
  await page.getByRole('row', { name: '686285b9ca238769b41d259b' }).getByRole('button').click();
  await page.getByRole('link', { name: 'Modifier' }).click();
  await page.getByRole('button', { name: 'Gérer les conditionnements' }).click();
  await page.getByRole('textbox', { name: 'Ex: Carton, Palette, etc.' }).click();
  await page.getByRole('textbox', { name: 'Ex: Carton, Palette, etc.' }).fill('carton');
  await page.getByPlaceholder('Ex: 24, 60, etc.').click();
  await page.getByPlaceholder('Ex: 24, 60, etc.').fill('10');
  await page.getByPlaceholder('Prix total').click();
  await page.getByPlaceholder('Prix total').fill('900');
  await page.getByRole('button', { name: 'Ajouter' }).click();
  await page.getByRole('button', { name: 'Enregistrer les modifications' }).click();
});