/**
 * Tests de CampoEnlaceVideo.
 *
 * El campo de Enlace_Video del Panel_Admin es obligatorio cuando la
 * Fuente_Video es "enlace" (7.12). Presenta el valor actual, notifica cada
 * cambio de texto y, cuando recibe un mensaje de validación, lo asocia al
 * control mediante `aria-describedby` (7.10).
 *
 * Consultas sólo por rol, texto o etiqueta accesible; una sola interacción por
 * test.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import CampoEnlaceVideo from './CampoEnlaceVideo';

describe('CampoEnlaceVideo', () => {
  it('Dado el campo con un valor previo Cuando el Administrador lo observa Entonces presenta ese Enlace_Video', () => {
    // Cubre: 7.12
    render(
      <CampoEnlaceVideo
        valor="https://youtu.be/abc"
        error={null}
        onCambio={vi.fn()}
      />,
    );

    expect(screen.getByLabelText('Dirección del video')).toHaveValue(
      'https://youtu.be/abc',
    );
  });

  it('Dado el campo vacío Cuando el Administrador escribe un enlace Entonces notifica el texto ingresado', async () => {
    // Cubre: 7.12
    const usuario = userEvent.setup();
    const onCambio = vi.fn();
    render(<CampoEnlaceVideo valor="" error={null} onCambio={onCambio} />);

    await usuario.type(screen.getByLabelText('Dirección del video'), 'h');

    expect(onCambio).toHaveBeenCalledWith('h');
  });

  it('Dado un enlace inválido rechazado Cuando el campo presenta el error Entonces asocia el mensaje al control', () => {
    // Cubre: 7.10
    render(
      <CampoEnlaceVideo
        valor="no-es-un-enlace"
        error="Ingresá un enlace de video válido"
        onCambio={vi.fn()}
      />,
    );

    const control = screen.getByLabelText('Dirección del video');
    const idMensaje = control.getAttribute('aria-describedby');
    expect(idMensaje).not.toBeNull();
    const mensaje = document.getElementById(idMensaje ?? '');
    expect(mensaje?.textContent ?? '').toBe('Ingresá un enlace de video válido');
  });
});
