/**
 * CatalogoEntrenamientos: vista del catálogo público de Entrenamientos.
 *
 * Presenta los Entrenamientos publicados (`soloPublicados`, 5.1) y los filtra
 * por categoría y nivel de forma conjuntiva con `filtrarEntrenamientos`,
 * mostrando el recuento del conjunto presentado (5.2, 5.3, 5.9). Los datos
 * llegan de `useEntrenamientos`, alimentado por el ContextoServicios; la
 * presencia de sesión llega del ContextoSesion y decide la forma de cada
 * TarjetaEntrenamiento (5.8, 6.1).
 *
 * La vista deriva su presentación del estado de la carga:
 *
 * - **Cargando** (5.5): indicador de carga (`role="status"`) y controles de
 *   filtro deshabilitados. Los filtros se muestran para que su estado
 *   deshabilitado sea observable, pero no restringen nada todavía.
 * - **Error** (5.6, 5.10): mensaje "No pudimos cargar los entrenamientos" y
 *   acción "Reintentar" que vuelve a solicitar la lista con `recargar` (5.7)
 *   conservando los filtros seleccionados, porque el estado de filtros vive en
 *   esta vista y no se reinicia entre intentos. El vencimiento del plazo de 5
 *   segundos ya deriva en el estado `error` dentro del hook (5.10).
 * - **Listo, publicados vacíos y sin filtros** (5.11): mensaje "Todavía no hay
 *   entrenamientos publicados" y ningún control de filtro, porque no hay nada
 *   que filtrar.
 * - **Listo con filtros que no coinciden** (5.4): mensaje "No encontramos
 *   entrenamientos con esos filtros" y acción "Quitar filtros" que restablece
 *   ambos filtros al valor neutro "Todos".
 * - **Listo con resultados**: la grilla de TarjetaEntrenamiento y el recuento.
 *
 * Las opciones de categoría se derivan de las categorías presentes en los
 * Entrenamientos publicados; las de nivel, de la constante `NIVELES`.
 *
 * Cubre: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9, 5.10, 5.11
 */
import { useMemo, useState, type ReactElement } from 'react';

import {
  FILTRO_TODOS,
  filtrarEntrenamientos,
  soloPublicados,
  type FiltrosCatalogo as Filtros,
} from '../dominio/filtros';
import { NIVELES } from '../dominio/modelos';
import { usarServicios } from '../estado/ContextoServicios';
import { usarSesion } from '../estado/ContextoSesion';
import { useEntrenamientos } from '../estado/useEntrenamientos';
import FiltrosCatalogo from '../componentes/catalogo/FiltrosCatalogo';
import TarjetaEntrenamiento from '../componentes/catalogo/TarjetaEntrenamiento';

export const TITULO_CATALOGO = 'Catálogo de entrenamientos';
export const MENSAJE_CARGANDO = 'Cargando entrenamientos';
export const MENSAJE_SIN_COINCIDENCIAS =
  'No encontramos entrenamientos con esos filtros';
export const MENSAJE_SIN_PUBLICADOS =
  'Todavía no hay entrenamientos publicados';

/** Estado de filtros de la vista: valores controlados de los selectores. */
type EstadoFiltros = { categoria: string; nivel: string };

const FILTROS_INICIALES: EstadoFiltros = {
  categoria: FILTRO_TODOS,
  nivel: FILTRO_TODOS,
};

/** Recuento presentado, con concordancia de número. */
function textoRecuento(cantidad: number): string {
  return cantidad === 1 ? '1 entrenamiento' : `${cantidad} entrenamientos`;
}

/** Envoltura de la vista: fija el encabezado accesible del catálogo. */
function Vista({ children }: { children: ReactElement }): ReactElement {
  return (
    <section className="seccion" aria-labelledby="catalogo-titulo">
      <div className="contenedor">
        <div className="seccion__encabezado">
          <h1 id="catalogo-titulo">{TITULO_CATALOGO}</h1>
        </div>
        {children}
      </div>
    </section>
  );
}

export default function CatalogoEntrenamientos(): ReactElement {
  const { repositorio, reloj } = usarServicios();
  const { sesion } = usarSesion();
  const { estado, datos, error, recargar } = useEntrenamientos({
    repositorio,
    reloj,
  });

  const [filtros, setFiltros] = useState<EstadoFiltros>(FILTROS_INICIALES);
  const haySesion = sesion !== null;

  const publicados = useMemo(() => soloPublicados(datos), [datos]);

  const categorias = useMemo(
    () =>
      Array.from(new Set(publicados.map((e) => e.categoria))).sort((a, b) =>
        a.localeCompare(b),
      ),
    [publicados],
  );

  const presentados = useMemo(
    () => filtrarEntrenamientos(publicados, filtros as Filtros),
    [publicados, filtros],
  );

  const aplicarFiltros = (parcial: Filtros): void => {
    setFiltros((previos) => ({
      categoria: parcial.categoria ?? previos.categoria,
      nivel: parcial.nivel ?? previos.nivel,
    }));
  };

  const quitarFiltros = (): void => setFiltros(FILTROS_INICIALES);

  // Cargando: indicador y filtros deshabilitados (5.5).
  if (estado === 'cargando') {
    return (
      <Vista>
        <>
          <FiltrosCatalogo
            categoria={filtros.categoria}
            nivel={filtros.nivel}
            categorias={categorias}
            niveles={NIVELES}
            deshabilitado
            alCambiarFiltros={aplicarFiltros}
          />
          <p className="seccion__bajada" role="status">
            {MENSAJE_CARGANDO}
          </p>
        </>
      </Vista>
    );
  }

  // Error: mensaje y reintento que conserva los filtros (5.6, 5.7, 5.10).
  if (estado === 'error') {
    return (
      <Vista>
        <div className="seccion__estado">
          <p className="seccion__bajada">
            {error?.message ?? 'No pudimos cargar los entrenamientos'}
          </p>
          <button type="button" className="boton" onClick={recargar}>
            Reintentar
          </button>
        </div>
      </Vista>
    );
  }

  // Publicados vacíos y sin filtros: sin controles de filtro (5.11).
  if (publicados.length === 0) {
    return (
      <Vista>
        <p className="seccion__bajada">{MENSAJE_SIN_PUBLICADOS}</p>
      </Vista>
    );
  }

  return (
    <Vista>
      <>
        <FiltrosCatalogo
          categoria={filtros.categoria}
          nivel={filtros.nivel}
          categorias={categorias}
          niveles={NIVELES}
          deshabilitado={false}
          alCambiarFiltros={aplicarFiltros}
        />
        <p className="catalogo__recuento">{textoRecuento(presentados.length)}</p>
        {presentados.length === 0 ? (
          <div className="seccion__estado">
            <p className="seccion__bajada">{MENSAJE_SIN_COINCIDENCIAS}</p>
            <button type="button" className="boton" onClick={quitarFiltros}>
              Quitar filtros
            </button>
          </div>
        ) : (
          <ul className="grilla grilla--cuatro">
            {presentados.map((entrenamiento) => (
              <TarjetaEntrenamiento
                key={entrenamiento.id}
                entrenamiento={entrenamiento}
                haySesion={haySesion}
              />
            ))}
          </ul>
        )}
      </>
    </Vista>
  );
}
