import type { ReactElement } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { usarApp } from '../estado/ContextoApp';
import { RUTAS } from './rutas';

/**
 * Deja pasar sólo con sesión abierta (y, con `soloAdmin`, sólo al
 * administrador). Sin sesión manda a Ingresar recordando de dónde venía, para
 * volver ahí después de iniciar sesión.
 */
export default function RutaProtegida({ soloAdmin = false }: { soloAdmin?: boolean }): ReactElement {
  const { cuenta } = usarApp();
  const ubicacion = useLocation();

  if (cuenta === null) {
    return <Navigate to={RUTAS.ingresar} state={{ desde: ubicacion.pathname }} replace />;
  }
  if (soloAdmin && cuenta.rol !== 'administrador') {
    return <Navigate to={RUTAS.inicio} replace />;
  }
  return <Outlet />;
}
