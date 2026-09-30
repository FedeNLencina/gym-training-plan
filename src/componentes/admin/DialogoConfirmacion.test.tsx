/**
 * Tests de DialogoConfirmacion.
 *
 * Diálogo de confirmación accesible reutilizable: expone un `role="dialog"` con
 * nombre accesible (su título), un cuerpo de mensaje y dos acciones —confirmar y
 * cancelar—. Delega la decisión en dos callbacks: confirmar invoca `onConfirmar`
 * y cancelar invoca `onCancelar`. Es un componente de presentación puro: no
 * conoce el Repositorio_Datos ni qué se confirma; el flujo de eliminación de
 * Entrenamientos (7.6, 7.9) lo compone el Panel_Admin sobre este diálogo.
 *
 * Consultas sólo por rol, texto o etiqueta accesible; una sola interacción por
 * test.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import DialogoConfirmacion from './DialogoConfirmacion';

describe('DialogoConfirmacion', () => {
  it('Dado un diálogo de confirmación Cuando se presenta Entonces expone un diálogo con su título como nombre accesible y el mensaje', () => {
    // Cubre: 7.6
    render(
      <DialogoConfirmacion
        titulo="Eliminar entrenamiento"
        mensaje="¿Seguro que querés eliminar «Fuerza total»?"
        etiquetaConfirmar="Eliminar"
        onConfirmar={vi.fn()}
        onCancelar={vi.fn()}
      />,
    );

    expect(
      screen.getByRole('dialog', { name: 'Eliminar entrenamiento' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('¿Seguro que querés eliminar «Fuerza total»?'),
    ).toBeInTheDocument();
  });

  it('Dado un diálogo de confirmación Cuando se activa la acción de confirmar Entonces invoca onConfirmar sin invocar onCancelar', async () => {
    // Cubre: 7.6
    const usuario = userEvent.setup();
    const onConfirmar = vi.fn();
    const onCancelar = vi.fn();
    render(
      <DialogoConfirmacion
        titulo="Eliminar entrenamiento"
        mensaje="¿Seguro que querés eliminar «Fuerza total»?"
        etiquetaConfirmar="Eliminar"
        onConfirmar={onConfirmar}
        onCancelar={onCancelar}
      />,
    );

    await usuario.click(screen.getByRole('button', { name: 'Eliminar' }));

    expect(onConfirmar).toHaveBeenCalledTimes(1);
    expect(onCancelar).not.toHaveBeenCalled();
  });

  it('Dado un diálogo de confirmación Cuando se activa la acción de cancelar Entonces invoca onCancelar sin invocar onConfirmar', async () => {
    // Cubre: 7.9
    const usuario = userEvent.setup();
    const onConfirmar = vi.fn();
    const onCancelar = vi.fn();
    render(
      <DialogoConfirmacion
        titulo="Eliminar entrenamiento"
        mensaje="¿Seguro que querés eliminar «Fuerza total»?"
        etiquetaConfirmar="Eliminar"
        onConfirmar={onConfirmar}
        onCancelar={onCancelar}
      />,
    );

    await usuario.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(onCancelar).toHaveBeenCalledTimes(1);
    expect(onConfirmar).not.toHaveBeenCalled();
  });
});
