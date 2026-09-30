/**
 * App: cableado de la Plataforma.
 *
 * Compone, de afuera hacia adentro, `BrowserRouter` (navegación sin recarga del
 * documento), `ProveedorSesion` (sesión activa sobre el ServicioAutenticacion
 * real) y `ProveedorAvisos` (canal de mensajes que sobreviven un cambio de
 * ruta), y finalmente el árbol de rutas. `ProveedorAvisos` usa el `location` del
 * enrutador, de modo que debe quedar por debajo de `BrowserRouter`.
 *
 * El ServicioAutenticacion se construye una sola vez sobre el almacenamiento
 * local del navegador. El ContextoServicios aporta el Repositorio_Datos real,
 * sembrado con los Entrenamientos y planes simulados, y el reloj del navegador,
 * de modo que las vistas de contenido (Catálogo destacado, Planes, Catálogo)
 * obtengan sus datos sin conocer cómo se construyen esos colaboradores.
 *
 * Cubre: 2.12, 2.15
 */

import { useMemo, type ReactElement } from 'react';
import { BrowserRouter } from 'react-router-dom';

import { crearContenidoLanding } from './datos/contenidoLanding';
import { crearEntrenamientosSimulados } from './datos/entrenamientosSimulados';
import { crearPlanesSimulados } from './datos/planesSimulados';
import { ProveedorAvisos } from './estado/ContextoAvisos';
import { ProveedorServicios } from './estado/ContextoServicios';
import { ProveedorSesion } from './estado/ContextoSesion';
import { crearAlmacenamientoLocal } from './infra/almacenamientoLocal';
import { crearBaseIndexedDb } from './infra/baseIndexedDb';
import { crearReloj } from './infra/reloj';
import { ArbolRutas } from './rutas/definicionRutas';
import { crearAlmacenVideos } from './servicios/almacenVideos';
import { crearRepositorioDatos } from './servicios/repositorioDatos';
import { crearServicioAutenticacion } from './servicios/servicioAutenticacion';

export default function App(): ReactElement {
  const almacenamiento = useMemo(() => crearAlmacenamientoLocal(), []);

  const servicioAutenticacion = useMemo(
    () => crearServicioAutenticacion({ almacenamiento }),
    [almacenamiento],
  );

  const almacenVideos = useMemo(
    () => crearAlmacenVideos({ base: crearBaseIndexedDb() }),
    [],
  );

  const repositorio = useMemo(
    () =>
      crearRepositorioDatos({
        almacenamiento,
        almacenVideos,
        datosIniciales: {
          entrenamientos: crearEntrenamientosSimulados(),
          planes: crearPlanesSimulados(),
          contenidoLanding: crearContenidoLanding(),
        },
      }),
    [almacenamiento, almacenVideos],
  );

  const reloj = useMemo(() => crearReloj(), []);

  return (
    <BrowserRouter>
      <ProveedorSesion servicio={servicioAutenticacion}>
        <ProveedorServicios
          repositorio={repositorio}
          reloj={reloj}
          almacenVideos={almacenVideos}
        >
          <ProveedorAvisos>
            <ArbolRutas />
          </ProveedorAvisos>
        </ProveedorServicios>
      </ProveedorSesion>
    </BrowserRouter>
  );
}
