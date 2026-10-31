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
 * local del navegador, sembrado con las cuentas de prueba. El ContextoServicios
 * aporta el Repositorio_Datos real —sembrado con los Entrenamientos y planes
 * simulados—, el reloj del navegador, el ServicioProgreso con el progreso
 * simulado y la gestión de cuentas del Panel_Admin, de modo que las vistas
 * obtengan lo que necesitan sin conocer cómo se construyen esos colaboradores.
 *
 * El mismo ServicioAutenticacion cumple dos papeles: es la fuente de la sesión
 * activa para `ProveedorSesion` y la `GestionCuentas` del Panel_Admin. Es una
 * sola instancia a propósito: dos instancias sobre el mismo almacenamiento
 * tendrían cada una su propia copia en memoria de las cuentas, y un cambio de
 * rol hecho en una no se vería en la otra hasta recargar.
 *
 * Todas las semillas son datos de prueba del prototipo: al incorporar backend,
 * las cuentas y el progreso vendrán del servidor y estas siembras desaparecen.
 *
 * Cubre: 2.12, 2.15
 */

import { useMemo, type ReactElement } from 'react';
import { BrowserRouter } from 'react-router-dom';

import { crearContenidoLanding } from './datos/contenidoLanding';
import { crearCuentasSimuladas } from './datos/cuentasSimuladas';
import { crearEntrenamientosSimulados } from './datos/entrenamientosSimulados';
import { crearPlanesSimulados } from './datos/planesSimulados';
import { crearProgresoSimulado } from './datos/progresoSimulado';
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
import { crearServicioProgreso } from './servicios/servicioProgreso';

export default function App(): ReactElement {
  const almacenamiento = useMemo(() => crearAlmacenamientoLocal(), []);

  const servicioAutenticacion = useMemo(
    () =>
      crearServicioAutenticacion({
        almacenamiento,
        datosIniciales: { cuentas: crearCuentasSimuladas() },
      }),
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

  const servicioProgreso = useMemo(
    () =>
      crearServicioProgreso({
        almacenamiento,
        reloj,
        datosIniciales: { porCorreo: crearProgresoSimulado() },
      }),
    [almacenamiento, reloj],
  );

  return (
    <BrowserRouter>
      <ProveedorSesion servicio={servicioAutenticacion}>
        <ProveedorServicios
          repositorio={repositorio}
          reloj={reloj}
          almacenVideos={almacenVideos}
          servicioProgreso={servicioProgreso}
          gestionCuentas={servicioAutenticacion}
        >
          <ProveedorAvisos>
            <ArbolRutas />
          </ProveedorAvisos>
        </ProveedorServicios>
      </ProveedorSesion>
    </BrowserRouter>
  );
}
