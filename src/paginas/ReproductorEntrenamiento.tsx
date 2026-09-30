/**
 * ReproductorEntrenamiento: vista de detalle y ejecución de un Entrenamiento.
 *
 * Recibe el identificador del Entrenamiento por el segmento `:id` de la ruta
 * `/entrenamientos/:id`, lo solicita al Repositorio_Datos a través del
 * ContextoServicios y presenta su título y la lista completa de sus Ejercicios,
 * indicando para cada uno el nombre, las series, las repeticiones y el descanso
 * en segundos (6.1).
 *
 * La carga reutiliza `usarCargaConPlazo`, la misma máquina de estados
 * `cargando → listo | error` con carrera contra el plazo que usan el catálogo y
 * la Seccion_Planes, de modo que una lectura lenta o fallida no deje la vista
 * colgada.
 *
 * El área del video se delega en `VisorVideo`, que despacha según la
 * Fuente_Video del Entrenamiento entre el reproductor embebido del Enlace_Video
 * y el reproductor nativo del Archivo_Video, y presenta "Video no disponible"
 * cuando no hay video reproducible (6.6, 6.10, 6.11, 6.12). El temporizador de
 * descanso, el marcado de Ejercicios y el resumen de sesión corresponden a la
 * tarea 17.6.
 *
 * Cubre: 6.1
 */
import { useCallback, type ReactElement } from 'react';
import { useParams } from 'react-router-dom';

import BarraProgreso from '../componentes/reproductor/BarraProgreso';
import ListaEjercicios from '../componentes/reproductor/ListaEjercicios';
import ResumenSesion from '../componentes/reproductor/ResumenSesion';
import VisorVideo from '../componentes/reproductor/VisorVideo';
import type { Entrenamiento } from '../dominio/modelos';
import { usarServicios } from '../estado/ContextoServicios';
import { usarCargaConPlazo } from '../estado/useEntrenamientos';
import { useProgresoEntrenamiento } from '../estado/useProgresoEntrenamiento';

export const MENSAJE_SIN_EJERCICIOS =
  'Este entrenamiento no tiene ejercicios cargados';

export const MENSAJE_CARGANDO = 'Cargando entrenamiento';
export const MENSAJE_ERROR = 'No pudimos cargar el entrenamiento';
export const MENSAJE_NO_ENCONTRADO = 'No encontramos el entrenamiento';

/** Envoltura de la vista: contenedor y sección accesibles. */
function Vista({ children }: { children: ReactElement }): ReactElement {
  return (
    <section className="seccion" aria-labelledby="reproductor-titulo">
      <div className="contenedor">{children}</div>
    </section>
  );
}

export default function ReproductorEntrenamiento(): ReactElement {
  const { id } = useParams<{ id: string }>();
  const { repositorio, reloj } = usarServicios();

  const cargar = useCallback(
    () => repositorio.obtenerEntrenamiento(id ?? ''),
    [repositorio, id],
  );

  const { estado, datos } = usarCargaConPlazo<Entrenamiento | null>({
    cargar,
    valorInicial: null,
    reloj,
    mensajeError: MENSAJE_ERROR,
  });

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
        <p className="mensaje mensaje--error">{MENSAJE_ERROR}</p>
      </Vista>
    );
  }

  if (datos === null) {
    return (
      <Vista>
        <p className="seccion__bajada">{MENSAJE_NO_ENCONTRADO}</p>
      </Vista>
    );
  }

  return (
    <Vista>
      <SesionEntrenamiento entrenamiento={datos} />
    </Vista>
  );
}

/**
 * SesionEntrenamiento: ejecución de un Entrenamiento ya cargado.
 *
 * Vive en su propio componente para que los hooks de sesión
 * (`useProgresoEntrenamiento`, y el reloj del ContextoServicios) se llamen de
 * forma incondicional una vez que hay un Entrenamiento, sin depender de los
 * primeros retornos de la máquina de carga.
 *
 * Compone el video (VisorVideo), la barra de avance (6.4), la lista de
 * Ejercicios con marcado y temporizador de descanso (6.2, 6.3, 6.7) y el
 * resumen de la sesión al completarse (6.5). Sin Ejercicios presenta el mensaje
 * correspondiente, el avance en 0 y los controles deshabilitados (6.9).
 */
function SesionEntrenamiento({
  entrenamiento,
}: {
  entrenamiento: Entrenamiento;
}): ReactElement {
  const { reloj } = usarServicios();
  const progreso = useProgresoEntrenamiento(entrenamiento.ejercicios);
  const sinEjercicios = entrenamiento.ejercicios.length === 0;

  return (
    <>
      <div className="seccion__encabezado">
        <h1 id="reproductor-titulo">{entrenamiento.titulo}</h1>
      </div>
      <VisorVideo entrenamiento={entrenamiento} />
      <BarraProgreso porcentaje={progreso.porcentaje} />
      {sinEjercicios ? (
        <p className="seccion__bajada">{MENSAJE_SIN_EJERCICIOS}</p>
      ) : (
        <ListaEjercicios
          ejercicios={entrenamiento.ejercicios}
          estaCompletado={progreso.estaCompletado}
          alAlternar={progreso.alternarCompletado}
          reloj={reloj}
        />
      )}
      {progreso.completo ? (
        <ResumenSesion
          completados={progreso.cantidadCompletados}
          total={progreso.total}
        />
      ) : null}
    </>
  );
}
