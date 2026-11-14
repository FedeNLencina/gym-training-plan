import { Menu, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { ReactElement } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';

import { usarApp } from '../estado/ContextoApp';
import { RUTAS } from '../rutas/rutas';

function Navbar(): ReactElement {
  const { cuenta, cerrarSesion } = usarApp();
  const navegar = useNavigate();
  const ubicacion = useLocation();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const botonAbrir = useRef<HTMLButtonElement>(null);
  const botonCerrar = useRef<HTMLButtonElement>(null);

  const salir = (): void => {
    navegar(RUTAS.inicio);
    cerrarSesion();
  };

  // Toda navegación cierra el menú, también la que vuelve a la misma página.
  useEffect(() => {
    setMenuAbierto(false);
  }, [ubicacion.key]);

  // Con el menú abierto: la página de atrás no se desplaza, el foco entra al
  // panel y Escape lo cierra devolviendo el foco al botón que lo abrió.
  useEffect(() => {
    if (!menuAbierto) return undefined;
    const raiz = document.documentElement;
    raiz.classList.add('menu-abierto');
    botonCerrar.current?.focus();
    const alPulsar = (evento: KeyboardEvent): void => {
      if (evento.key === 'Escape') {
        setMenuAbierto(false);
        botonAbrir.current?.focus();
      }
    };
    document.addEventListener('keydown', alPulsar);
    return () => {
      raiz.classList.remove('menu-abierto');
      document.removeEventListener('keydown', alPulsar);
    };
  }, [menuAbierto]);

  return (
    <header className="barra">
      <div className="contenedor barra__interior">
        <Link to={RUTAS.inicio} className="marca" aria-label="Atlas Training, inicio">
          Atlas<span className="marca__acento">Training</span>
        </Link>

        <button
          ref={botonAbrir}
          type="button"
          className="barra__hamburguesa"
          aria-label="Abrir menú"
          aria-expanded={menuAbierto}
          aria-controls="menu-principal"
          onClick={() => setMenuAbierto(true)}
        >
          <Menu size={24} aria-hidden="true" />
        </button>

        <div
          className={`barra__velo${menuAbierto ? ' barra__velo--visible' : ''}`}
          aria-hidden="true"
          onClick={() => setMenuAbierto(false)}
        />

        <div
          id="menu-principal"
          className={`barra__panel${menuAbierto ? ' barra__panel--abierto' : ''}`}
        >
          <button
            ref={botonCerrar}
            type="button"
            className="barra__cerrar"
            aria-label="Cerrar menú"
            onClick={() => {
              setMenuAbierto(false);
              botonAbrir.current?.focus();
            }}
          >
            <X size={24} aria-hidden="true" />
          </button>

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

const REBOTE: Keyframe[] = [
  { transform: 'translateY(56px)' },
  { transform: 'translateY(-12px)', offset: 0.55 },
  { transform: 'translateY(5px)', offset: 0.8 },
  { transform: 'translateY(0)' },
];

export default function Layout(): ReactElement {
  const ubicacion = useLocation();
  const principal = useRef<HTMLElement>(null);
  const claveAnterior = useRef(ubicacion.key);

  // Cada navegación vuelve al tope de la vista y el contenido entra con un
  // rebote hacia arriba. Los anclajes (#seccion) conservan su destino.
  useEffect(() => {
    if (claveAnterior.current === ubicacion.key) return;
    claveAnterior.current = ubicacion.key;
    if (ubicacion.hash !== '') return;

    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });

    const nodo = principal.current;
    const sinMovimiento =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (nodo === null || sinMovimiento || typeof nodo.animate !== 'function') return;
    nodo.animate(REBOTE, { duration: 520, easing: 'ease-out' });
  }, [ubicacion.key, ubicacion.hash]);

  return (
    <div className="armazon">
      <Navbar />
      <main ref={principal} className="armazon__principal">
        <Outlet />
      </main>
      <PieDePagina />
    </div>
  );
}
