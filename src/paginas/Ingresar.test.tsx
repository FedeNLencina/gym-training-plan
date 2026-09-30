/**
 * Tests de la vista de Ingresar.
 *
 * La vista se monta bajo un `MemoryRouter` con `/ingresar` como entrada y bajo
 * un `ProveedorSesion` con el `ServicioAutenticacion` real sobre almacenamiento
 * en memoria. Una ruta `/entrenamientos` de prueba permite observar la
 * navegación efectiva tras un ingreso válido sin inspeccionar el enrutador.
 *
 * Consultas sólo por rol, etiqueta accesible o texto; una sola interacción por
 * test.
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { ProveedorSesion } from '../estado/ContextoSesion';
import {
  crearAlmacenamientoLocal,
  type MedioClaveValor,
} from '../infra/almacenamientoLocal';
import { crearServicioAutenticacion } from '../servicios/servicioAutenticacion';
import Ingresar from './Ingresar';

function crearMedioEnMemoria(): MedioClaveValor {
  const datos = new Map<string, string>();
  return {
    getItem: (clave) => datos.get(clave) ?? null,
    setItem: (clave, valor) => {
      datos.set(clave, valor);
    },
    removeItem: (clave) => {
      datos.delete(clave);
    },
  };
}

function crearServicio(): ReturnType<typeof crearServicioAutenticacion> {
  return crearServicioAutenticacion({
    almacenamiento: crearAlmacenamientoLocal({ medio: crearMedioEnMemoria() }),
  });
}

function renderizarIngresar(
  servicio = crearServicio(),
): ReturnType<typeof crearServicioAutenticacion> {
  render(
    <MemoryRouter initialEntries={['/ingresar']}>
      <ProveedorSesion servicio={servicio}>
        <Routes>
          <Route path="/ingresar" element={<Ingresar />} />
          <Route
            path="/entrenamientos"
            element={<h1>Catálogo de entrenamientos</h1>}
          />
        </Routes>
      </ProveedorSesion>
    </MemoryRouter>,
  );
  return servicio;
}

const CUENTA = Object.freeze({
  nombre: 'Ana Pérez',
  correo: 'ana@atlasgym.com',
  contrasenia: 'contrasenia1',
});

describe('Vista de Ingresar', () => {
  it('Dado una cuenta existente, Cuando ingresa con sus credenciales, Entonces navega al catálogo de entrenamientos', async () => {
    // Cubre: 4.6
    const usuario = userEvent.setup();
    const servicio = crearServicio();
    await servicio.registrar(CUENTA);
    await servicio.cerrarSesion();
    renderizarIngresar(servicio);
    await usuario.type(screen.getByLabelText('Correo'), CUENTA.correo);
    await usuario.type(screen.getByLabelText('Contraseña'), CUENTA.contrasenia);

    await usuario.click(screen.getByRole('button', { name: 'Iniciar sesión' }));

    expect(
      await screen.findByRole('heading', {
        name: 'Catálogo de entrenamientos',
      }),
    ).toBeInTheDocument();
  });

  it('Dado una cuenta existente, Cuando ingresa con la contraseña equivocada, Entonces muestra credenciales incorrectas, conserva el correo y vacía la contraseña', async () => {
    // Cubre: 4.7
    const usuario = userEvent.setup();
    const servicio = crearServicio();
    await servicio.registrar(CUENTA);
    await servicio.cerrarSesion();
    renderizarIngresar(servicio);
    await usuario.type(screen.getByLabelText('Correo'), CUENTA.correo);
    await usuario.type(screen.getByLabelText('Contraseña'), 'contrasenia2');

    await usuario.click(screen.getByRole('button', { name: 'Iniciar sesión' }));

    expect(
      await screen.findByText('Credenciales incorrectas'),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Correo')).toHaveValue(CUENTA.correo);
    expect(screen.getByLabelText('Contraseña')).toHaveValue('');
  });
});
