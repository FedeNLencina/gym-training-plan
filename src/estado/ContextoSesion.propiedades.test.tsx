/**
 * Test de propiedad del ContextoSesion: ida y vuelta de autenticación.
 *
 * A diferencia de `ContextoSesion.test.tsx`, acá no hay doble del servicio: el
 * proveedor se monta sobre el `crearServicioAutenticacion` real apoyado en el
 * adaptador `crearAlmacenamientoLocal` y en un medio clave/valor en memoria. Sólo
 * así la "recarga de la Plataforma" del enunciado es observable: se desmonta el
 * proveedor y se vuelve a montar con un servicio nuevo sobre el mismo medio, que
 * es exactamente lo que ocurre cuando el navegador recarga el documento.
 *
 * Los valores de la sesión se presentan en campos de sólo lectura con etiqueta
 * accesible, no como texto libre, porque los nombres generados incluyen espacios
 * y caracteres no ASCII cuya comparación como texto del DOM quedaría sujeta a la
 * normalización de espacios.
 *
 * Cubre: 9.2
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fc from 'fast-check';
import type { ReactElement } from 'react';
import { describe, expect, it } from 'vitest';

import {
  CLAVES_ALMACENAMIENTO,
  crearAlmacenamientoLocal,
  type MedioClaveValor,
} from '../infra/almacenamientoLocal';
import { arbCuenta } from '../tests/generadores/generadoresDominio';
import {
  CREDENCIALES_ADMINISTRADOR,
  crearServicioAutenticacion,
  type Credenciales,
  type ServicioAutenticacion,
} from '../servicios/servicioAutenticacion';
import { ProveedorSesion, usarSesion } from './ContextoSesion';

const CONFIGURACION = { numRuns: 100, seed: 1 };

// 100 corridas de render + userEvent + relectura del medio superan el límite por
// defecto de 5000 ms de Vitest; se eleva sólo el tope de este test para que las
// 100 corridas mandadas por el plan (numRuns:100, seed:1) completen sin bajar.
const TIEMPO_MAXIMO_MS = 30000;

/** Medio clave/valor en memoria: sobrevive al desmontaje, como el navegador. */
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

/**
 * Cuenta registrable: datos válidos, rol Usuario, nombre que no queda por debajo
 * del mínimo al recortarlo y correo distinto del Administrador sembrado.
 */
const arbCuentaRegistrable = arbCuenta({ rol: 'usuario' }).filter(
  (cuenta) =>
    cuenta.nombre.trim().length >= 2 &&
    cuenta.correo !== CREDENCIALES_ADMINISTRADOR.correo,
);

// --- Componente de observación ----------------------------------------------

const ETIQUETAS = Object.freeze({
  estado: 'Estado de la sesión',
  correo: 'Correo de la sesión',
  nombre: 'Nombre de la sesión',
  rol: 'Rol de la sesión',
});

const SIN_VALOR = '';

/**
 * Expone el valor del contexto en campos de sólo lectura con etiqueta accesible
 * y ofrece la única interacción del test: iniciar sesión con las credenciales
 * recibidas.
 */
function Observador({
  credenciales,
}: {
  credenciales: Credenciales;
}): ReactElement {
  const { estado, sesion, ingresar } = usarSesion();

  return (
    <div>
      <label>
        {ETIQUETAS.estado}
        <input readOnly value={estado} />
      </label>
      <label>
        {ETIQUETAS.correo}
        <input readOnly value={sesion?.correo ?? SIN_VALOR} />
      </label>
      <label>
        {ETIQUETAS.nombre}
        <input readOnly value={sesion?.nombre ?? SIN_VALOR} />
      </label>
      <label>
        {ETIQUETAS.rol}
        <input readOnly value={sesion?.rol ?? SIN_VALOR} />
      </label>
      <button
        type="button"
        onClick={() => {
          void ingresar(credenciales).catch(() => undefined);
        }}
      >
        Iniciar sesión
      </button>
    </div>
  );
}

describe('ContextoSesion (propiedades)', () => {
  // Feature: training-platform-landing, Property 14: Ida y vuelta de autenticación
  it('Dada una cuenta creada con datos válidos, Cuando se ingresa con sus credenciales exactas, Entonces la sesión tiene su correo, nombre y rol, y recargar la Plataforma restaura esa misma sesión', async () => {
    // Cubre: 9.2
    await fc.assert(
      fc.asyncProperty(arbCuentaRegistrable, async (cuenta) => {
        const medio = crearMedioEnMemoria();
        const crearServicio = (): ServicioAutenticacion =>
          crearServicioAutenticacion({
            almacenamiento: crearAlmacenamientoLocal({ medio }),
          });

        // Dado: la cuenta ya existe y nadie tiene la sesión abierta.
        const servicio = crearServicio();
        const creada = await servicio.registrar({
          nombre: cuenta.nombre,
          correo: cuenta.correo,
          contrasenia: cuenta.contrasenia,
          idPlan: cuenta.idPlan,
        });
        expect(creada).toEqual({
          correo: cuenta.correo,
          nombre: cuenta.nombre,
          rol: 'usuario',
        });
        await servicio.cerrarSesion();

        const vista = render(
          <ProveedorSesion servicio={servicio}>
            <Observador
              credenciales={{
                correo: cuenta.correo,
                contrasenia: cuenta.contrasenia,
              }}
            />
          </ProveedorSesion>,
        );
        await waitFor(() => {
          expect(screen.getByLabelText(ETIQUETAS.estado)).toHaveValue('lista');
        });
        expect(screen.getByLabelText(ETIQUETAS.correo)).toHaveValue(SIN_VALOR);

        // Cuando: ingresa con las credenciales exactas de esa cuenta.
        await userEvent.click(
          screen.getByRole('button', { name: 'Iniciar sesión' }),
        );

        // Entonces: la sesión lleva el correo, el nombre y el rol registrados.
        await waitFor(() => {
          expect(screen.getByLabelText(ETIQUETAS.correo)).toHaveValue(
            cuenta.correo,
          );
        });
        expect(screen.getByLabelText(ETIQUETAS.nombre)).toHaveValue(
          cuenta.nombre,
        );
        expect(screen.getByLabelText(ETIQUETAS.rol)).toHaveValue('usuario');

        // Y recargar la Plataforma restaura la misma sesión desde el navegador:
        // proveedor desmontado y servicio nuevo sobre el mismo medio.
        vista.unmount();
        const recarga = render(
          <ProveedorSesion servicio={crearServicio()}>
            <Observador
              credenciales={{
                correo: cuenta.correo,
                contrasenia: cuenta.contrasenia,
              }}
            />
          </ProveedorSesion>,
        );
        await waitFor(() => {
          expect(screen.getByLabelText(ETIQUETAS.estado)).toHaveValue('lista');
        });
        expect(screen.getByLabelText(ETIQUETAS.correo)).toHaveValue(
          cuenta.correo,
        );
        expect(screen.getByLabelText(ETIQUETAS.nombre)).toHaveValue(
          cuenta.nombre,
        );
        expect(screen.getByLabelText(ETIQUETAS.rol)).toHaveValue('usuario');
        expect(medio.getItem(CLAVES_ALMACENAMIENTO.sesion)).not.toBeNull();

        recarga.unmount();
      }),
      CONFIGURACION,
    );
  }, TIEMPO_MAXIMO_MS);
});
