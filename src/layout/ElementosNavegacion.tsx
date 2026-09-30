/**
 * ElementosNavegacion: los elementos de navegación y las acciones de cuenta de
 * la Navbar, compartidos por la presentación de escritorio y por el menú móvil.
 *
 * Presenta, en este orden, "Inicio", "Entrenamientos" y "Planes" (2.1).
 * "Inicio" y "Planes" combinan navegación con desplazamiento a través de
 * `useNavegacionLanding` (2.2, 2.3, 2.5, 2.9); "Entrenamientos" es un enlace
 * simple a `/entrenamientos` (2.4). Todos son `<Link>` (elementos `a`), de modo
 * que Enter los activa nativamente (2.11).
 *
 * `aria-current="page"` se calcula con `useMatch` por ruta, de modo que
 * exactamente un elemento queda marcado como la página actual (2.6). "Planes"
 * apunta a un ancla dentro de la raíz y nunca marca página actual.
 *
 * Las acciones de cuenta dependen de la sesión: con sesión activa presenta el
 * nombre de la cuenta y "Cerrar sesión" (4.8), con rol administrador añade
 * "Panel de administración" hacia `/admin` (7.1), y sin sesión presenta
 * "Iniciar sesión" y "Registrarme" (4.9). Cerrar sesión finaliza la sesión y
 * navega a `/` (4.10).
 *
 * `alNavegar` permite que el menú móvil se cierre al activar cualquier elemento
 * (2.8).
 *
 * Cubre: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.11, 4.8, 4.9, 4.10, 7.1
 */
import { type MouseEvent, type ReactElement } from 'react';
import { Link, useMatch, useNavigate } from 'react-router-dom';

import { usarSesion } from '../estado/ContextoSesion';
import { useNavegacionLanding } from './useNavegacionLanding';

export function ElementosNavegacion({
  alNavegar,
}: {
  alNavegar?: () => void;
}): ReactElement {
  const { irAInicio, irAPlanes } = useNavegacionLanding();
  const { sesion, cerrarSesion } = usarSesion();
  const navegar = useNavigate();

  const enInicio = useMatch('/') !== null;
  const enEntrenamientos = useMatch('/entrenamientos') !== null;

  const activar = (accion: () => void) => (evento: MouseEvent) => {
    evento.preventDefault();
    accion();
    alNavegar?.();
  };

  const cerrar = async (): Promise<void> => {
    alNavegar?.();
    await cerrarSesion();
    navegar('/');
  };

  return (
    <>
      <Link
        to="/"
        className="navbar__enlace"
        aria-current={enInicio ? 'page' : undefined}
        onClick={activar(irAInicio)}
      >
        Inicio
      </Link>
      <Link
        to="/entrenamientos"
        className="navbar__enlace"
        aria-current={enEntrenamientos ? 'page' : undefined}
        onClick={() => alNavegar?.()}
      >
        Entrenamientos
      </Link>
      <Link
        to="/#planes"
        className="navbar__enlace"
        onClick={activar(irAPlanes)}
      >
        Planes
      </Link>

      {sesion !== null && sesion.rol === 'administrador' ? (
        <Link
          to="/admin"
          className="navbar__enlace"
          onClick={() => alNavegar?.()}
        >
          Panel de administración
        </Link>
      ) : null}

      {sesion === null ? (
        <>
          <Link
            to="/ingresar"
            className="navbar__enlace"
            onClick={() => alNavegar?.()}
          >
            Iniciar sesión
          </Link>
          <Link
            to="/registro"
            className="navbar__enlace"
            onClick={() => alNavegar?.()}
          >
            Registrarme
          </Link>
        </>
      ) : (
        <>
          <span>{sesion.nombre}</span>
          <button
            type="button"
            className="navbar__enlace"
            onClick={() => {
              void cerrar();
            }}
          >
            Cerrar sesión
          </button>
        </>
      )}
    </>
  );
}
