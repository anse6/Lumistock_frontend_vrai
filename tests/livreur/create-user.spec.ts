import { test } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('http://localhost:5173/');
  await page.getByRole('textbox', { name: 'Email' }).click();
  await page.getByRole('textbox', { name: 'Email' }).fill('ansenana3@gmail.com');
  await page.getByRole('textbox', { name: 'Mot de passe' }).click();
  await page.getByRole('textbox', { name: 'Mot de passe' }).fill('123456789');
  await page.getByRole('button', { name: 'Connectez-vous' }).click();
  await page.getByRole('button', { name: 'Tableau de bord' }).click();
  await page.getByRole('button', { name: 'Clients' }).click();
  await page.getByRole('link', { name: 'Ajouter un client' }).click();
  await page.getByRole('textbox', { name: 'Entrer le nom complet ici' }).click();
  await page.getByRole('textbox', { name: 'Entrer le nom complet ici' }).fill('po');
  await page.getByRole('textbox', { name: 'Entrer l\'email' }).click();
  await page.getByRole('textbox', { name: 'Entrer l\'email' }).fill('po@gmail.com');
  await page.getByRole('textbox', { name: '741 852' }).click();
  await page.getByRole('textbox', { name: '741 852' }).fill('652021435');
  await page.getByRole('textbox', { name: 'Ville' }).click();
  await page.getByRole('textbox', { name: 'Ville' }).fill('enama');
  await page.getByRole('textbox', { name: 'Quartier' }).click();
  await page.getByRole('textbox', { name: 'Quartier' }).fill('pep');
  await page.getByRole('button', { name: 'Enregistrer' }).click();
});