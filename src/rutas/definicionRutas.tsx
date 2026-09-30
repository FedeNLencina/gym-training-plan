/**
 * Árbol de rutas de la Plataforma y constantes de ruta.
 *
 * Aquí se declara el conjunto de rutas de la sección Rutas: raíz (Landing_Page),
 * catálogo, detalle de Entrenamiento, registro, ingreso, panel de administración
 * y la ruta comodín para la página inexistente. Toda ruta cuelga de
 * `LayoutPublico`, de modo que la Navbar y la región de avisos permanezcan
 * visibles en toda vista pública, incluida la de ruta inexistente (2.1, 2.15).
 *
 * `RUTAS` es la única fuente de verdad de las direcciones: los `Link`, las
 * redirecciones y las pruebas la consumen para que las direcciones no diverjan
 * entre módulos.
 *
 * La vista raíz ya monta la `Landing_Page` real (tarea 13.1), las direcciones
 * de registro e ingreso montan las vistas reales `Registro` e `Ingresar`
 * (tarea 14.1), el catálogo monta la vista real `CatalogoEntrenamientos`
 * (tarea 15.1) y `/admin` monta el `PanelAdmin` real tras la guarda
 * `RutaProtegida` que exige rol administrador (tarea 18.1, criterios 7.2 y 7.8).
 * La vista de detalle del Reproductor sigue siendo un marcador de posición: su
 * implementación definitiva corresponde a una tarea posterior. Lo que estas
 * rutas fijan y prueban es que cada dirección declarada resuelve a su vista o a
 * su redirección definida, bajo `LayoutPublico`, y que toda dirección no
 * declarada resuelve a la página inexistente.
 *
 * Cubre: 2.1, 2.12, 2.15
 */

import type { ReactElement } from 'react';
import { Route, Routes } from 'react-router-dom';

import LayoutPublico from '../layout/LayoutPublico';
import CatalogoEntrenamientos from '../paginas/CatalogoEntrenamientos';
import Ingresar from '../paginas/Ingresar';
import LandingPage from '../paginas/LandingPage';
import NoEncontrada from '../paginas/NoEncontrada';
import PanelAdmin from '../paginas/PanelAdmin';
import Registro from '../paginas/Registro';
import { RutaProtegida } from './RutaProtegida';

/**
 * Direcciones declaradas de la Plataforma. `detalleEntrenamiento` es una función
 * porque la ruta lleva el identificador del Entrenamiento como segmento.
 */
export const RUTAS = Object.freeze({
  inicio: '/',
  entrenamientos: '/entrenamientos',
  detalleEntrenamiento: (id: string): string => `/entrenamientos/${id}`,
  registro: '/registro',
  ingresar: '/ingresar',
  admin: '/admin',
} as const);

/** Patrón del segmento dinámico del detalle de un Entrenamiento. */
export const PATRON_DETALLE_ENTRENAMIENTO = '/entrenamientos/:id';

/** Marcador de posición de una vista todavía no implementada. */
function VistaPlaceholder({ titulo }: { titulo: string }): ReactElement {
  return (
    <section>
      <h1>{titulo}</h1>
    </section>
  );
}

/**
 * Árbol de rutas. Se exporta como componente (no como `BrowserRouter`) para que
 * `App` lo componga bajo el enrutador real y las pruebas lo monten bajo un
 * `MemoryRouter` con la dirección de entrada que quieran ejercitar.
 */
export function ArbolRutas(): ReactElement {
  return (
    <Routes>
      <Route path={RUTAS.inicio} element={<LayoutPublico />}>
        <Route index element={<LandingPage />} />
        <Route path="entrenamientos" element={<CatalogoEntrenamientos />} />
        <Route
          path="entrenamientos/:id"
          element={
            <VistaPlaceholder titulo="Reproductor de entrenamiento" />
          }
        />
        <Route path="registro" element={<Registro />} />
        <Route path="ingresar" element={<Ingresar />} />
        <Route
          path="admin"
          element={
            <RutaProtegida rolRequerido="administrador">
              <PanelAdmin />
            </RutaProtegida>
          }
        />
        <Route path="*" element={<NoEncontrada />} />
      </Route>
    </Routes>
  );
}
