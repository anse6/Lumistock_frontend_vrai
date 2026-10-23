import { test} from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('http://localhost:5173/');
  await page.getByRole('textbox', { name: 'Email' }).click();
  await page.getByRole('textbox', { name: 'Email' }).fill('ansevernel@gmail.com');
  await page.getByRole('textbox', { name: 'Mot de passe' }).click();
  await page.getByRole('textbox', { name: 'Mot de passe' }).fill('123456');
  await page.getByRole('button', { name: 'Connectez-vous' }).click();
  await page.getByRole('button', { name: 'Tableau de bord' }).click();
  await page.getByRole('button', { name: 'Produits' }).click();
  await page.getByRole('button', { name: 'Approvisionnement' }).click();
  await page.getByRole('link', { name: 'Approvisionner' }).click();
  await page.getByRole('combobox').selectOption('686b8a4624a86a9ac21216ed');
  await page.locator('.absolute.right-2').first().click();
  await page.locator('.bg-gray-300 > .lucide').first().click();
  await page.getByRole('button', { name: 'Approvisionner' }).click();
  await page.getByRole('button', { name: 'Confirmer' }).click();
});