import type { ReactElement } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

import { ProveedorApp } from './estado/ContextoApp';
import Layout from './layout/Layout';
import Admin from './paginas/Admin';
import DetalleEntrenamiento from './paginas/DetalleEntrenamiento';
import Entrenamientos from './paginas/Entrenamientos';
import Ingresar from './paginas/Ingresar';
import Inicio from './paginas/Inicio';
import NoEncontrada from './paginas/NoEncontrada';
import Planes from './paginas/Planes';
import Registro from './paginas/Registro';
import RutaProtegida from './rutas/RutaProtegida';
import { RUTAS } from './rutas/rutas';

/** Árbol de rutas, separado del enrutador para poder montarlo en las pruebas. */
export function Rutas(): ReactElement {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path={RUTAS.inicio} element={<Inicio />} />
        <Route path={RUTAS.planes} element={<Planes />} />
        <Route path={RUTAS.ingresar} element={<Ingresar />} />
        <Route path={RUTAS.registro} element={<Registro />} />
        <Route element={<RutaProtegida />}>
          <Route path={RUTAS.entrenamientos} element={<Entrenamientos />} />
          <Route path={RUTAS.entrenamiento(':id')} element={<DetalleEntrenamiento />} />
        </Route>
        <Route element={<RutaProtegida soloAdmin />}>
          <Route path={RUTAS.admin} element={<Admin />} />
        </Route>
        <Route path="*" element={<NoEncontrada />} />
      </Route>
    </Routes>
  );
}

export default function App(): ReactElement {
  return (
    <ProveedorApp>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Rutas />
      </BrowserRouter>
    </ProveedorApp>
  );
}
