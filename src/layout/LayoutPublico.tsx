/**
 * LayoutPublico: envoltorio persistente de toda vista pública.
 *
 * Compone la Navbar, el `Outlet` donde se presenta la vista de cada ruta, la
 * región `aria-live="polite"` de avisos (`RegionAvisos`) y el pie de página. Al
 * envolver todas las rutas, la Navbar permanece visible incluso en la vista de
 * ruta inexistente (2.1, 2.15), y los mensajes de redirección publicados antes
 * de navegar se presentan en la región de avisos, que sobrevive al cambio de
 * ruta que los motiva (2.13, 2.14, 6.8, 7.2, 7.8).
 *
 * Cubre: 2.1
 */
import { type ReactElement } from 'react';
import { Outlet } from 'react-router-dom';

import { RegionAvisos } from '../estado/ContextoAvisos';
import Navbar from './Navbar';
import PieDePagina from './PieDePagina';

export default function LayoutPublico(): ReactElement {
  return (
    <div className="layout-publico">
      <Navbar />
      <RegionAvisos />
      <main className="layout-publico__contenido">
        <Outlet />
      </main>
      <PieDePagina />
    </div>
  );
}
