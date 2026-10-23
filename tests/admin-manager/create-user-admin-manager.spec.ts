import { test } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('http://localhost:5173/');
  await page.getByRole('textbox', { name: 'Email' }).click();
  await page.getByRole('textbox', { name: 'Email' }).fill('ansevernel@gmail.com');
  await page.getByRole('textbox', { name: 'Mot de passe' }).click();
  await page.getByRole('textbox', { name: 'Mot de passe' }).fill('123456');
  await page.getByRole('button', { name: 'Connectez-vous' }).click();
  await page.getByRole('button', { name: 'Tableau de bord' }).click();
  await page.getByRole('button', { name: 'Utilisateurs' }).click();
  await page.getByRole('link', { name: 'Ajouter utilisateur' }).click();
  await page.getByRole('textbox', { name: 'Nom *', exact: true }).click();
  await page.getByRole('textbox', { name: 'Nom *', exact: true }).fill('epe');
  await page.getByRole('textbox', { name: 'Prénom *' }).click();
  await page.getByRole('textbox', { name: 'Prénom *' }).fill('ici');
  await page.getByRole('textbox', { name: 'Adresse mail *' }).click();
  await page.getByRole('textbox', { name: 'Adresse mail *' }).fill('epeici@gmail.com');
  await page.getByRole('textbox', { name: 'Mot de passe *' }).click();
  await page.getByRole('textbox', { name: 'Mot de passe *' }).fill('123456789');
  await page.getByRole('button', { name: 'Sélectionner un rôle' }).click();
  await page.getByText('Manager').click();
  await page.getByRole('button', { name: 'Enregistrer' }).click();
});