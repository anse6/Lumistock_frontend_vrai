import { test, expect } from '@playwright/test';

test('connexion utilisateur', async ({ page }) => {
  // Va directement à l'URL complète
  await page.goto('http://localhost:5173/', );

  // Remplir le formulaire
  await page.getByRole('textbox', { name: 'Email' }).fill('ansevernel@gmail.com');
  await page.getByRole('textbox', { name: 'Mot de passe' }).fill('123456');

  // Cliquer sur le bouton
  await page.getByRole('button', { name: 'Connectez-vous' }).click();

  // Vérifier qu’on est bien sur le dashboard
  await expect(page).toHaveURL('http://localhost:5173/admin/dashboard/home');
});
