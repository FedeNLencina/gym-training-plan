import type { ReactElement } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';

import { usarApp } from '../estado/ContextoApp';
import { RUTAS } from '../rutas/rutas';

function Navbar(): ReactElement {
  const { cuenta, cerrarSesion } = usarApp();
  const navegar = useNavigate();

  const salir = (): void => {
    navegar(RUTAS.inicio);
    cerrarSesion();
  };

  return (
    <header className="barra">
      <div className="contenedor barra__interior">
        <Link to={RUTAS.inicio} className="marca" aria-label="Atlas Training, inicio">
          Atlas<span className="marca__acento">Training</span>
        </Link>

        <nav className="barra__nav" aria-label="Principal">
          <NavLink to={RUTAS.inicio} end className="barra__enlace">
            Inicio
          </NavLink>
          <NavLink to={RUTAS.planes} className="barra__enlace">
            Planes
          </NavLink>
          <NavLink to={RUTAS.entrenamientos} className="barra__enlace">
            Entrenamientos
          </NavLink>
          {cuenta?.rol === 'administrador' && (
            <NavLink to={RUTAS.admin} className="barra__enlace">
              Administración
            </NavLink>
          )}
        </nav>

        <div className="barra__cuenta">
          {cuenta === null ? (
            <>
              <Link to={RUTAS.ingresar} className="boton-secundario boton--compacto">
                Iniciar sesión
              </Link>
              <Link to={RUTAS.registro} className="boton-primario boton--compacto">
                Registrarme
              </Link>
            </>
          ) : (
            <>
              <span className="barra__nombre" title="Sesión iniciada">
                {cuenta.nombre}
              </span>
              <button type="button" className="boton-secundario boton--compacto" onClick={salir}>
                Cerrar sesión
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

function PieDePagina(): ReactElement {
  return (
    <footer className="pie">
      <div className="contenedor pie__interior">
        <div>
          <p className="marca">
            Atlas<span className="marca__acento">Training</span>
          </p>
          <p className="pie__texto">Planes de entrenamiento en video, ordenados por nivel.</p>
        </div>
        <nav className="pie__nav" aria-label="Pie de página">
          <Link to={RUTAS.inicio}>Inicio</Link>
          <Link to={RUTAS.planes}>Planes</Link>
          <Link to={RUTAS.entrenamientos}>Entrenamientos</Link>
        </nav>
        <p className="pie__texto">© {new Date().getFullYear()} Atlas Gym</p>
      </div>
    </footer>
  );
}

export default function Layout(): ReactElement {
  return (
    <div className="armazon">
      <Navbar />
      <main className="armazon__principal">
        <Outlet />
      </main>
      <PieDePagina />
    </div>
  );
}
