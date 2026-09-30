/**
 * ContextoServicios: acceso de las vistas a los colaboradores de la Plataforma.
 *
 * El proveedor entrega el Repositorio_Datos y el reloj a las vistas que los
 * consumen —Catálogo destacado (1.7, 1.8), Seccion_Planes (13.7) y
 * Catalogo_Entrenamientos (15.1)— sin que ninguna de ellas sepa cómo se
 * construyen. Es el equivalente, para la capa de servicios de datos y tiempo,
 * de lo que `ContextoSesion` es para la sesión: una única fuente de verdad
 * inyectada desde `App`, que en las pruebas se sustituye por dobles
 * (`crearRepositorioEnMemoria`, `crearRelojFalso`).
 *
 * Mantiene la dirección de dependencias del diseño (vistas → estado →
 * servicios): las vistas piden lo que necesitan al contexto y `App` decide con
 * qué implementación real satisfacerlo.
 *
 * Cubre: 1.7, 1.8
 */

import {
  createContext,
  useContext,
  useMemo,
  type ReactElement,
  type ReactNode,
} from 'react';

import type { Entrenamiento } from '../dominio/modelos';
import type { Reloj } from '../infra/reloj';
import type { RepositorioDatos } from '../servicios/repositorioDatos';

/**
 * Repositorio tal como lo ven las vistas a través del contexto. Coincide con
 * `RepositorioDatos` salvo en `guardarEntrenamiento`, cuyo parámetro se acota a
 * un `Entrenamiento` ya construido en lugar del `EntrenamientoDudoso` que acepta
 * el repositorio real. Esa cota más estricta es la que satisfacen a la vez el
 * repositorio real (acepta un dudoso, luego también un Entrenamiento) y el doble
 * en memoria de las pruebas (que ya recibe un Entrenamiento), de modo que ambos
 * puedan inyectarse sin conversiones de tipo.
 */
export type RepositorioDeVistas = Omit<
  RepositorioDatos,
  'guardarEntrenamiento'
> & {
  guardarEntrenamiento: (
    entrenamiento: Entrenamiento,
  ) => Promise<Entrenamiento>;
};

/**
 * AlmacenVideos tal como lo ve el reproductor a través del contexto: sólo la
 * lectura del `Blob` conservado, que es lo que necesita `VideoArchivo` para
 * montar el `<video controls>` nativo (6.11). Es opcional en el contexto porque
 * las vistas que sólo leen Entrenamientos y planes no lo requieren; el
 * reproductor sí, y lo exige de forma explícita cuando la Fuente_Video es
 * `archivo`.
 */
export type AlmacenVideosDeVistas = {
  obtenerVideo: (idEntrenamiento: string) => Promise<Blob>;
  /**
   * Conserva el `Blob` bajo el id del Entrenamiento (7.18). Opcional en el
   * contexto porque el reproductor sólo lee; el Panel_Admin sí lo exige al
   * guardar un Entrenamiento con Fuente_Video `archivo`.
   */
  guardarVideo?: (
    idEntrenamiento: string,
    archivo: Blob,
  ) => Promise<{ tipo: string; tamanioBytes: number }>;
  /** Borra el Archivo_Video huérfano al pasar la fuente a `enlace` (7.20). */
  eliminarVideo?: (idEntrenamiento: string) => Promise<void>;
};

export type ValorContextoServicios = {
  repositorio: RepositorioDeVistas;
  reloj: Reloj;
  almacenVideos: AlmacenVideosDeVistas | null;
};

const ContextoServicios = createContext<ValorContextoServicios | null>(null);

export type PropiedadesProveedorServicios = {
  repositorio: RepositorioDeVistas;
  reloj: Reloj;
  almacenVideos?: AlmacenVideosDeVistas | null;
  children: ReactNode;
};

export function ProveedorServicios({
  repositorio,
  reloj,
  almacenVideos = null,
  children,
}: PropiedadesProveedorServicios): ReactElement {
  const valor = useMemo<ValorContextoServicios>(
    () => ({ repositorio, reloj, almacenVideos }),
    [repositorio, reloj, almacenVideos],
  );

  return (
    <ContextoServicios.Provider value={valor}>
      {children}
    </ContextoServicios.Provider>
  );
}

/** Acceso al ContextoServicios. Falla si no hay proveedor por encima. */
export function usarServicios(): ValorContextoServicios {
  const valor = useContext(ContextoServicios);
  if (valor === null) {
    throw new Error('usarServicios requiere un ProveedorServicios por encima');
  }
  return valor;
}
