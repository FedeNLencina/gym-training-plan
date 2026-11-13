import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { Rutas } from '../App';
import { crearSemilla } from '../datos/semilla';
import type { Datos } from '../dominio/modelos';
import { ProveedorApp } from '../estado/ContextoApp';
import { guardarDatos } from '../infra/almacen';

type Opciones = {
  /** Correo de la cuenta de la semilla con la que arranca la sesión. */
  sesion?: string;
  /** Ajuste de los datos iniciales antes de montar. */
  preparar?: (datos: Datos) => void;
};

/** Monta la app completa en `ruta`, sobre los datos de la semilla. */
export function montarApp(ruta: string, { sesion, preparar }: Opciones = {}): void {
  const datos = crearSemilla();
  if (sesion !== undefined) {
    datos.idSesion = datos.cuentas.find((c) => c.correo === sesion)?.id ?? null;
  }
  preparar?.(datos);
  guardarDatos(datos);

  render(
    <ProveedorApp>
      <MemoryRouter initialEntries={[ruta]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Rutas />
      </MemoryRouter>
    </ProveedorApp>,
  );
}

export const DIEGO = 'diego@atlasgym.com'; // sin plan
export const ANA = 'ana@atlasgym.com'; // plan intermedio activo
export const BRUNO = 'bruno@atlasgym.com'; // plan básico activo, avanzado solicitado
export const ADMIN = 'admin@atlasgym.com';
