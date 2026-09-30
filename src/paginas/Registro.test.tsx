/**
 * Tests de la vista de Registro.
 *
 * La vista se monta bajo un `MemoryRouter` con la ruta de entrada que interesa
 * (`/registro`, o `/registro?plan=…` para el caso del plan elegido) y bajo un
 * `ProveedorSesion` con el `ServicioAutenticacion` real montado sobre un
 * almacenamiento en memoria: así se ejercita el registro de punta a punta sin
 * dobles del contexto ni de la persistencia del navegador.
 *
 * Un `Enrutador` de prueba compuesto por dos rutas (`/registro` y
 * `/entrenamientos`) permite observar la navegación efectiva a
 * `/entrenamientos` tras un registro válido sin inspeccionar el enrutador.
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
import Registro from './Registro';

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

function renderizarRegistro(
  direccion = '/registro',
  servicio = crearServicio(),
): ReturnType<typeof crearServicioAutenticacion> {
  render(
    <MemoryRouter initialEntries={[direccion]}>
      <ProveedorSesion servicio={servicio}>
        <Routes>
          <Route path="/registro" element={<Registro />} />
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

async function completarRegistro(
  usuario: ReturnType<typeof userEvent.setup>,
  datos: { nombre: string; correo: string; contrasenia: string },
): Promise<void> {
  await usuario.type(screen.getByLabelText('Nombre'), datos.nombre);
  await usuario.type(screen.getByLabelText('Correo'), datos.correo);
  await usuario.type(screen.getByLabelText('Contraseña'), datos.contrasenia);
}

const REGISTRO_VALIDO = Object.freeze({
  nombre: 'Ana Pérez',
  correo: 'ana@atlasgym.com',
  contrasenia: 'contrasenia1',
});

describe('Vista de Registro', () => {
  it('Dado un formulario con datos válidos, Cuando el visitante se registra, Entonces navega al catálogo de entrenamientos', async () => {
    // Cubre: 4.1, 4.2
    const usuario = userEvent.setup();
    renderizarRegistro();
    await completarRegistro(usuario, REGISTRO_VALIDO);

    await usuario.click(screen.getByRole('button', { name: 'Registrarme' }));

    expect(
      await screen.findByRole('heading', {
        name: 'Catálogo de entrenamientos',
      }),
    ).toBeInTheDocument();
  });

  it('Dado un correo ya registrado, Cuando el visitante se registra con ese correo, Entonces muestra que el correo ya está registrado y conserva los valores', async () => {
    // Cubre: 4.3
    const usuario = userEvent.setup();
    const servicio = crearServicio();
    await servicio.registrar(REGISTRO_VALIDO);
    await servicio.cerrarSesion();
    renderizarRegistro('/registro', servicio);
    await completarRegistro(usuario, { ...REGISTRO_VALIDO, nombre: 'Otra Ana' });

    await usuario.click(screen.getByRole('button', { name: 'Registrarme' }));

    expect(
      await screen.findByText('El correo ya está registrado'),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Correo')).toHaveValue(REGISTRO_VALIDO.correo);
    expect(screen.getByLabelText('Nombre')).toHaveValue('Otra Ana');
  });

  it('Dado un correo con formato inválido, Cuando el visitante se registra, Entonces señala el campo correo con un mensaje asociado y conserva el nombre', async () => {
    // Cubre: 4.4
    const usuario = userEvent.setup();
    renderizarRegistro();
    await completarRegistro(usuario, {
      ...REGISTRO_VALIDO,
      correo: 'ana-arroba-atlas',
    });

    await usuario.click(screen.getByRole('button', { name: 'Registrarme' }));

    const correo = await screen.findByLabelText('Correo');
    const idMensaje = correo.getAttribute('aria-describedby');
    expect(idMensaje).not.toBeNull();
    const mensaje = document.getElementById(idMensaje ?? '');
    expect(mensaje?.textContent ?? '').toMatch(/correo válido/i);
    expect(screen.getByLabelText('Nombre')).toHaveValue(REGISTRO_VALIDO.nombre);
  });

  it('Dado un formulario con datos inválidos, Cuando el visitante se registra, Entonces no crea la cuenta y permanece en el registro', async () => {
    // Cubre: 4.4
    const usuario = userEvent.setup();
    const servicio = renderizarRegistro();
    await completarRegistro(usuario, {
      nombre: 'A',
      correo: REGISTRO_VALIDO.correo,
      contrasenia: 'corta',
    });

    await usuario.click(screen.getByRole('button', { name: 'Registrarme' }));

    expect(
      screen.getByRole('heading', { name: 'Registro' }),
    ).toBeInTheDocument();
    expect(servicio.cuentaDe(REGISTRO_VALIDO.correo)).toBeNull();
  });

  it('Dado el registro con un plan elegido en la dirección, Cuando el visitante se registra, Entonces la cuenta queda asociada a ese plan', async () => {
    // Cubre: 4.5
    const usuario = userEvent.setup();
    const servicio = renderizarRegistro(
      '/registro?plan=plan-elite',
      crearServicio(),
    );
    await completarRegistro(usuario, REGISTRO_VALIDO);

    await usuario.click(screen.getByRole('button', { name: 'Registrarme' }));

    expect(
      await screen.findByRole('heading', {
        name: 'Catálogo de entrenamientos',
      }),
    ).toBeInTheDocument();
    expect(servicio.cuentaDe(REGISTRO_VALIDO.correo)?.idPlan).toBe('plan-elite');
  });
});
