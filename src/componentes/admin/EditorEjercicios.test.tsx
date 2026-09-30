/**
 * Tests de EditorEjercicios.
 *
 * El editor es un componente controlado: recibe la lista de Ejercicios y avisa
 * cada cambio a través de `onChange`. Presenta, por cada Ejercicio, los campos
 * nombre, series, repeticiones y descanso con etiquetas accesibles numeradas, y
 * permite agregar y quitar Ejercicios. Los mensajes de validación por campo se
 * asocian al control correspondiente vía `aria-describedby` (7.4).
 *
 * Consultas sólo por rol, etiqueta accesible o texto; una sola interacción por
 * test.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { crearEjercicio, type Ejercicio } from '../../dominio/modelos';
import EditorEjercicios, {
  ETIQUETA_AGREGAR,
} from './EditorEjercicios';

function ejercicios(cantidad: number): Ejercicio[] {
  return Array.from({ length: cantidad }, (_, i) =>
    crearEjercicio({ id: `ej${i + 1}`, nombre: `Ejercicio ${i + 1}` }),
  );
}

describe('EditorEjercicios', () => {
  it('Dado una lista con un Ejercicio Cuando se presenta Entonces presenta sus campos nombre, series, repeticiones y descanso', () => {
    // Cubre: 7.4
    render(
      <EditorEjercicios ejercicios={ejercicios(1)} errores={[]} onChange={vi.fn()} />,
    );

    expect(screen.getByLabelText('Nombre del ejercicio 1')).toBeInTheDocument();
    expect(screen.getByLabelText('Series del ejercicio 1')).toBeInTheDocument();
    expect(
      screen.getByLabelText('Repeticiones del ejercicio 1'),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText('Descanso del ejercicio 1 (segundos)'),
    ).toBeInTheDocument();
  });

  it('Dado el editor Cuando el Administrador agrega un Ejercicio Entonces avisa una lista con un Ejercicio más', async () => {
    // Cubre: 7.4
    const usuario = userEvent.setup();
    const alCambiar = vi.fn();
    render(
      <EditorEjercicios ejercicios={ejercicios(1)} errores={[]} onChange={alCambiar} />,
    );

    await usuario.click(screen.getByRole('button', { name: ETIQUETA_AGREGAR }));

    expect(alCambiar).toHaveBeenCalledTimes(1);
    expect(alCambiar.mock.calls[0][0]).toHaveLength(2);
  });

  it('Dado un editor con dos Ejercicios Cuando el Administrador quita el primero Entonces avisa una lista sin ese Ejercicio', async () => {
    // Cubre: 7.4
    const usuario = userEvent.setup();
    const alCambiar = vi.fn();
    render(
      <EditorEjercicios ejercicios={ejercicios(2)} errores={[]} onChange={alCambiar} />,
    );

    await usuario.click(screen.getByRole('button', { name: 'Quitar ejercicio 1' }));

    expect(alCambiar).toHaveBeenCalledTimes(1);
    const nuevos = alCambiar.mock.calls[0][0] as Ejercicio[];
    expect(nuevos).toHaveLength(1);
    expect(nuevos.map((e) => e.id)).not.toContain('ej1');
  });

  it('Dado el editor Cuando el Administrador edita el nombre del primer Ejercicio Entonces avisa ese Ejercicio con el nuevo nombre', async () => {
    // Cubre: 7.4
    const usuario = userEvent.setup();
    const alCambiar = vi.fn();
    render(
      <EditorEjercicios
        ejercicios={[crearEjercicio({ id: 'ej1', nombre: '' })]}
        errores={[]}
        onChange={alCambiar}
      />,
    );

    await usuario.type(screen.getByLabelText('Nombre del ejercicio 1'), 'S');

    const nuevos = alCambiar.mock.calls[0][0] as Ejercicio[];
    expect(nuevos[0].nombre).toBe('S');
  });

  it('Dado un error en el nombre del primer Ejercicio Cuando se presenta Entonces asocia el mensaje al campo mediante aria-describedby', () => {
    // Cubre: 7.4
    render(
      <EditorEjercicios
        ejercicios={ejercicios(1)}
        errores={[{ nombre: 'Ingresá un nombre de 3 a 60 caracteres' }]}
        onChange={vi.fn()}
      />,
    );

    const campo = screen.getByLabelText('Nombre del ejercicio 1');
    const idMensaje = campo.getAttribute('aria-describedby');
    expect(idMensaje).not.toBeNull();
    const mensaje = document.getElementById(idMensaje ?? '');
    expect(mensaje?.textContent ?? '').toMatch(/nombre/i);
  });
});
