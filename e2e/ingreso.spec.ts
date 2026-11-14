import { expect, test } from '@playwright/test';

import { CONTRASENIA_PRUEBA } from '../src/datos/semilla';

test.describe('Ingreso', () => {
  test('una usuaria con plan ingresa y llega a sus entrenamientos', async ({ page }) => {
    await page.goto('/ingresar');

    await page.getByLabel('Correo', { exact: true }).fill('ana@atlasgym.com');
    await page.getByLabel('Contraseña', { exact: true }).fill(CONTRASENIA_PRUEBA);
    await page.getByRole('button', { name: 'Iniciar sesión' }).click();

    await expect(page).toHaveURL(/\/entrenamientos$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Entrenamientos' })).toBeVisible();
  });

  test('una contraseña incorrecta muestra un aviso y conserva el correo', async ({ page }) => {
    await page.goto('/ingresar');

    await page.getByLabel('Correo', { exact: true }).fill('ana@atlasgym.com');
    await page.getByLabel('Contraseña', { exact: true }).fill('clave-equivocada');
    await page.getByRole('button', { name: 'Iniciar sesión' }).click();

    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page.getByLabel('Correo', { exact: true })).toHaveValue('ana@atlasgym.com');
    await expect(page.getByLabel('Contraseña', { exact: true })).toHaveValue('');
  });
});
