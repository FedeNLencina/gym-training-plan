/**
 * Tests de SelectorFuenteVideo.
 *
 * El selector de Fuente_Video del Panel_Admin presenta exactamente dos opciones
 * rotuladas "Enlace de video" y "Subir video", con "Enlace de video"
 * seleccionada de manera inicial (7.11), y notifica el cambio de fuente al
 * elegir la otra opción (7.12, 7.13).
 *
 * Consultas sólo por rol, texto o etiqueta accesible; una sola interacción por
 * test.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import SelectorFuenteVideo from './SelectorFuenteVideo';

describe('SelectorFuenteVideo', () => {
  it('Dado el selector recién presentado Cuando el Administrador lo observa Entonces la opción "Enlace de video" está seleccionada de manera inicial', () => {
    // Cubre: 7.11
    render(<SelectorFuenteVideo valor="enlace" onCambio={vi.fn()} />);

    expect(
      screen.getByRole('radio', { name: 'Enlace de video' }),
    ).toBeChecked();
  });

  it('Dado el selector recién presentado Cuando el Administrador lo observa Entonces presenta la opción "Subir video" sin seleccionar', () => {
    // Cubre: 7.11
    render(<SelectorFuenteVideo valor="enlace" onCambio={vi.fn()} />);

    expect(screen.getByRole('radio', { name: 'Subir video' })).not.toBeChecked();
  });

  it('Dado el selector en "Enlace de video" Cuando el Administrador elige "Subir video" Entonces notifica el cambio a la fuente archivo', async () => {
    // Cubre: 7.13
    const usuario = userEvent.setup();
    const onCambio = vi.fn();
    render(<SelectorFuenteVideo valor="enlace" onCambio={onCambio} />);

    await usuario.click(screen.getByRole('radio', { name: 'Subir video' }));

    expect(onCambio).toHaveBeenCalledWith('archivo');
  });

  it('Dado el selector en "Subir video" Cuando el Administrador elige "Enlace de video" Entonces notifica el cambio a la fuente enlace', async () => {
    // Cubre: 7.12
    const usuario = userEvent.setup();
    const onCambio = vi.fn();
    render(<SelectorFuenteVideo valor="archivo" onCambio={onCambio} />);

    await usuario.click(screen.getByRole('radio', { name: 'Enlace de video' }));

    expect(onCambio).toHaveBeenCalledWith('enlace');
  });
});
