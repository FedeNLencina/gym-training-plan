/**
 * RutaProtegida: guarda de acceso por sesión, por rol y por existencia del
 * Entrenamiento solicitado.
 *
 * La guarda concentra en un único punto las cuatro decisiones de acceso que fija
 * el diseño:
 *
 * - Sin sesión sobre una ruta protegida (`/entrenamientos/:id` o `/admin`):
 *   redirige a `/ingresar` con `replace` y el aviso "Iniciá sesión para
 *   continuar" (2.13, 6.8, 7.8).
 * - Sesión con rol insuficiente sobre una ruta que exige otro rol (típicamente
 *   `/admin` con rol Usuario): redirige a `/entrenamientos` con `replace`, sin
 *   tocar la sesión, y el aviso "No tenés permisos para esta sección" (7.2).
 * - Sesión activa pero `:id` que no figura entre los publicados: redirige a
 *   `/entrenamientos` con `replace` y el aviso "El entrenamiento solicitado no
 *   existe" (2.14).
 * - Sesión restaurándose desde el navegador: no decide. Presenta un indicador de
 *   carga sin redirigir, porque redirigir antes de terminar de restaurar
 *   expulsaría a un usuario legítimo que recarga la ruta (4.11).
 *
 * El aviso se publica antes de navegar, de modo que la región `aria-live` lo
 * presente en la ruta de destino y no se pierda con el cambio de ruta. La
 * redirección se hace siempre con `replace` para no dejar la ruta protegida en
 * el historial.
 *
 * El conjunto de identificadores publicados se recibe como propiedad para
 * mantener el acoplamiento mínimo y la guarda comprobable con dobles: la vista
 * que monta `RutaProtegida` es la que conoce el catálogo publicado (vía
 * `useEntrenamientos` u otro origen) y se lo entrega. Cuando no se entrega
 * `idsPublicados`, la guarda no verifica la existencia del `:id` (útil para
 * rutas protegidas sin segmento dinámico, como `/admin`).
 *
 * Cubre: 2.13, 2.14, 6.8, 7.2, 7.8
 */

import { useEffect, type ReactElement, type ReactNode } from 'react';
import { Navigate, useParams } from 'react-router-dom';

import type { Rol } from '../dominio/modelos';
import { useAvisos } from '../estado/ContextoAvisos';
import { usarSesion } from '../estado/ContextoSesion';
import { RUTAS } from './definicionRutas';

const AVISO_SIN_SESION = 'Iniciá sesión para continuar';
const AVISO_SIN_PERMISOS = 'No tenés permisos para esta sección';
const AVISO_ENTRENAMIENTO_INEXISTENTE = 'El entrenamiento solicitado no existe';

export type PropiedadesRutaProtegida = {
  /** Vista protegida que se presenta cuando el acceso está permitido. */
  children: ReactNode;
  /** Rol exigido para acceder. Si se omite, basta con tener sesión activa. */
  rolRequerido?: Rol;
  /**
   * Identificadores de los Entrenamientos publicados. Si se entrega y la ruta
   * lleva un `:id` ausente de la lista, la guarda devuelve al catálogo (2.14).
   */
  idsPublicados?: readonly string[];
};

/**
 * Publica un aviso y redirige con `replace`. El aviso se publica en un efecto
 * (no durante el render) para no mutar el estado del proveedor de avisos
 * mientras React está renderizando este componente.
 */
function RedirigirConAviso({
  destino,
  aviso,
  tipo,
}: {
  destino: string;
  aviso: string;
  tipo: 'informacion' | 'error';
}): ReactElement {
  const { publicarAviso } = useAvisos();
  useEffect(() => {
    publicarAviso(aviso, tipo);
  }, [publicarAviso, aviso, tipo]);
  return <Navigate to={destino} replace />;
}

/** Indicador de carga presentado mientras la sesión se restaura (4.11). */
function IndicadorRestaurando(): ReactElement {
  return (
    <div role="status" aria-live="polite">
      Cargando…
    </div>
  );
}

export function RutaProtegida({
  children,
  rolRequerido,
  idsPublicados,
}: PropiedadesRutaProtegida): ReactElement {
  const { estado, sesion } = usarSesion();
  const { id } = useParams();

  // Mientras la sesión se restaura no se decide nada: redirigir aquí expulsaría
  // a un usuario legítimo que recarga la ruta (4.11).
  if (estado === 'restaurando') {
    return <IndicadorRestaurando />;
  }

  // Sin sesión: a iniciar sesión (2.13, 6.8, 7.8).
  if (sesion === null) {
    return (
      <RedirigirConAviso
        destino={RUTAS.ingresar}
        aviso={AVISO_SIN_SESION}
        tipo="informacion"
      />
    );
  }

  // Rol insuficiente: al catálogo, sin tocar la sesión (7.2).
  if (rolRequerido !== undefined && sesion.rol !== rolRequerido) {
    return (
      <RedirigirConAviso
        destino={RUTAS.entrenamientos}
        aviso={AVISO_SIN_PERMISOS}
        tipo="error"
      />
    );
  }

  // Identificador inexistente entre los publicados: al catálogo (2.14).
  if (
    idsPublicados !== undefined &&
    id !== undefined &&
    !idsPublicados.includes(id)
  ) {
    return (
      <RedirigirConAviso
        destino={RUTAS.entrenamientos}
        aviso={AVISO_ENTRENAMIENTO_INEXISTENTE}
        tipo="error"
      />
    );
  }

  return <>{children}</>;
}
