/**
 * MiProgreso: acumulado e historial de entrenamientos de la cuenta activa.
 *
 * Es la vista donde el aislamiento entre Usuarios se vuelve visible: todo lo
 * que presenta se pide al ServicioProgreso con el correo de la sesión activa y
 * de ninguna otra cuenta. El acceso lo resuelve `RutaProtegida`, que exige
 * sesión sin exigir un rol concreto: un Administrador también entrena.
 *
 * El cálculo del acumulado no vive acá sino en `dominio/historial`
 * (`calcularEstadisticas`), y el servicio ya devuelve el historial ordenado de
 * la sesión más reciente a la más antigua. La vista sólo presenta.
 *
 * El estado vacío no es un mensaje seco: ofrece el camino al catálogo, porque
 * una cuenta sin progreso es justamente la que necesita empezar a entrenar.
 */
import { useCallback, useEffect, useState, type ReactElement } from 'react';
import { Link } from 'react-router-dom';

import {
  HISTORIAL_VACIO,
  formatearFechaCorta,
  type EstadisticasHistorial,
} from '../dominio/historial';
import type { SesionCompletada } from '../dominio/modelos';
import { usarServicios } from '../estado/ContextoServicios';
import { usarSesion } from '../estado/ContextoSesion';
import { RUTAS } from '../rutas/definicionRutas';

export const TITULO_MI_PROGRESO = 'Mi progreso';
export const MENSAJE_CARGANDO = 'Cargando tu progreso';
export const MENSAJE_ERROR = 'No pudimos cargar tu progreso';
export const MENSAJE_SIN_PROGRESO =
  'Todavía no completaste ningún entrenamiento';
export const MENSAJE_SIN_SERVICIO =
  'El seguimiento de progreso no está disponible en este entorno';

type EstadoCarga = 'cargando' | 'listo' | 'error';

/** Envoltura de la vista: fija el encabezado accesible. */
function Vista({ children }: { children: ReactElement }): ReactElement {
  return (
    <section className="seccion" aria-labelledby="mi-progreso-titulo">
      <div className="contenedor">
        <div className="seccion__encabezado">
          <h1 id="mi-progreso-titulo">{TITULO_MI_PROGRESO}</h1>
        </div>
        {children}
      </div>
    </section>
  );
}

/**
 * Tarjeta de una métrica. El `aria-label` lleva la etiqueta para que cada
 * tarjeta tenga nombre accesible propio y se pueda localizar por lo que mide y
 * no por su posición en la grilla.
 */
function Estadistica({
  etiqueta,
  valor,
}: {
  etiqueta: string;
  valor: string;
}): ReactElement {
  return (
    <li className="estadistica" aria-label={etiqueta}>
      <span className="estadistica__valor">{valor}</span>
      <span className="estadistica__etiqueta">{etiqueta}</span>
    </li>
  );
}

export default function MiProgreso(): ReactElement {
  const { servicioProgreso } = usarServicios();
  const { sesion, estado: estadoSesion } = usarSesion();
  const correo = sesion?.correo ?? null;

  const [estado, setEstado] = useState<EstadoCarga>('cargando');
  const [estadisticas, setEstadisticas] =
    useState<EstadisticasHistorial>(HISTORIAL_VACIO);
  const [historial, setHistorial] = useState<SesionCompletada[]>([]);

  const cargar = useCallback(async (): Promise<void> => {
    // Mientras la sesión se restaura no se sabe de quién es el progreso: la
    // vista sigue cargando en lugar de rendirse, igual que `RutaProtegida`
    // espera antes de decidir un acceso (4.11).
    if (estadoSesion === 'restaurando') {
      setEstado('cargando');
      return;
    }

    if (servicioProgreso === null || correo === null) {
      setEstado('error');
      return;
    }
    setEstado('cargando');
    try {
      // Las dos lecturas van juntas: presentar el acumulado sin el historial
      // dejaría la vista a medias.
      const [leidas, leido] = await Promise.all([
        servicioProgreso.obtenerEstadisticas(correo),
        servicioProgreso.obtenerHistorial(correo),
      ]);
      setEstadisticas(leidas);
      setHistorial(leido);
      setEstado('listo');
    } catch {
      setEstado('error');
    }
  }, [servicioProgreso, correo, estadoSesion]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  if (servicioProgreso === null) {
    return (
      <Vista>
        <p className="seccion__bajada">{MENSAJE_SIN_SERVICIO}</p>
      </Vista>
    );
  }

  if (estado === 'cargando') {
    return (
      <Vista>
        <p className="seccion__bajada" role="status">
          {MENSAJE_CARGANDO}
        </p>
      </Vista>
    );
  }

  if (estado === 'error') {
    return (
      <Vista>
        <div className="seccion__estado">
          <p className="seccion__bajada">{MENSAJE_ERROR}</p>
          <button
            type="button"
            className="boton"
            onClick={() => {
              void cargar();
            }}
          >
            Reintentar
          </button>
        </div>
      </Vista>
    );
  }

  return (
    <Vista>
      <>
        <ul className="estadisticas">
          <Estadistica
            etiqueta="Sesiones completadas"
            valor={String(estadisticas.sesionesCompletadas)}
          />
          <Estadistica
            etiqueta="Ejercicios completados"
            valor={String(estadisticas.ejerciciosCompletados)}
          />
          <Estadistica
            etiqueta="Entrenamientos distintos"
            valor={String(estadisticas.entrenamientosDistintos)}
          />
          <Estadistica
            etiqueta="Última sesión"
            valor={formatearFechaCorta(estadisticas.ultimaSesionEn)}
          />
        </ul>

        {historial.length === 0 ? (
          <div className="seccion__estado">
            <p className="seccion__bajada">{MENSAJE_SIN_PROGRESO}</p>
            <Link className="boton-primario" to={RUTAS.entrenamientos}>
              Ver entrenamientos
            </Link>
          </div>
        ) : (
          <ul className="historial" aria-label="Historial de sesiones">
            {historial.map((sesionCompletada) => (
              <li className="historial__fila" key={sesionCompletada.id}>
                <h2 className="historial__titulo">
                  {sesionCompletada.tituloEntrenamiento}
                </h2>
                <span className="historial__detalle">
                  {`${String(sesionCompletada.ejerciciosCompletados)} de ${String(
                    sesionCompletada.ejerciciosTotales,
                  )} ejercicios`}
                </span>
                <span className="historial__detalle">
                  {formatearFechaCorta(sesionCompletada.completadoEn)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </>
    </Vista>
  );
}
