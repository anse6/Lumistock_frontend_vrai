import { test } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('http://localhost:5173/');
  await page.getByRole('textbox', { name: 'Email' }).click();
  await page.getByRole('textbox', { name: 'Email' }).fill('ansevernel@gmail.com');
  await page.getByRole('textbox', { name: 'Mot de passe' }).click();
  await page.getByRole('textbox', { name: 'Mot de passe' }).fill('123456');
  await page.getByRole('button', { name: 'Connectez-vous' }).click();
  await page.getByRole('button', { name: 'Tableau de bord' }).click();
  await page.getByRole('button', { name: 'Livraison' }).click();
  
  // Sélectionner spécifiquement le 2ème élément du tableau (index 1)
  await page.locator('.text-gray-500').nth(1).click();
  
  await page.getByRole('button', { name: 'Finaliser paiement' }).click();
  await page.getByRole('button', { name: 'Confirmer le paiement' }).click();
});