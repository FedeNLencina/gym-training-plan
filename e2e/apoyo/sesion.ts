import { expect, type Page } from '@playwright/test';

import { CONTRASENIA_PRUEBA } from '../../src/datos/semilla';

/**
 * Completa el formulario de /ingresar (la página ya tiene que estar abierta) y espera
 * el destino por defecto. No sirve cuando se llega a /ingresar desde una ruta que
 * pide volver (p. ej. el enlace de una tarjeta de plan): ahí el destino es otro.
 */
export async function ingresar(page: Page, correo: string): Promise<void> {
  await page.getByLabel('Correo', { exact: true }).fill(correo);
  await page.getByLabel('Contraseña', { exact: true }).fill(CONTRASENIA_PRUEBA);
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await expect(page).toHaveURL(/\/entrenamientos$/);
}

/**
 * Cierra la sesión desde /planes y abre /ingresar para el siguiente usuario.
 * Siempre desde /planes: cerrar sesión en una ruta protegida deja guardado ese
 * destino y el siguiente ingreso intenta volver a él.
 */
export async function cambiarDeUsuario(page: Page, correo: string): Promise<void> {
  await page.getByRole('navigation', { name: 'Principal' }).getByRole('link', { name: 'Planes' }).click();
  await expect(page).toHaveURL(/\/planes$/);
  await page.getByRole('button', { name: 'Cerrar sesión' }).click();
  await expect(page).toHaveURL(/\/$/);

  await page.getByRole('link', { name: 'Iniciar sesión' }).click();
  await expect(page).toHaveURL(/\/ingresar$/);
  await ingresar(page, correo);
}
