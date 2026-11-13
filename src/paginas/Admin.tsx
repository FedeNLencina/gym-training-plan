import { useState, type ReactElement } from 'react';

import AdminContenido from '../componentes/admin/AdminContenido';
import AdminEntrenamientos from '../componentes/admin/AdminEntrenamientos';
import AdminPlanes from '../componentes/admin/AdminPlanes';
import AdminUsuarios from '../componentes/admin/AdminUsuarios';

const SECCIONES = [
  { clave: 'entrenamientos', texto: 'Entrenamientos', Panel: AdminEntrenamientos },
  { clave: 'planes', texto: 'Planes', Panel: AdminPlanes },
  { clave: 'usuarios', texto: 'Usuarios', Panel: AdminUsuarios },
  { clave: 'contenido', texto: 'Contenido', Panel: AdminContenido },
] as const;

export default function Admin(): ReactElement {
  const [activa, setActiva] = useState<(typeof SECCIONES)[number]['clave']>('entrenamientos');
  const { Panel } = SECCIONES.find((s) => s.clave === activa) ?? SECCIONES[0];

  return (
    <section className="seccion contenedor">
      <h1>Administración</h1>
      <div className="pestanias" role="tablist" aria-label="Secciones de administración">
        {SECCIONES.map(({ clave, texto }) => (
          <button
            key={clave}
            type="button"
            role="tab"
            id={`pestania-${clave}`}
            className="pestanias__pestania"
            aria-selected={activa === clave}
            aria-controls="panel-admin"
            onClick={() => setActiva(clave)}
          >
            {texto}
          </button>
        ))}
      </div>
      <div id="panel-admin" role="tabpanel" aria-labelledby={`pestania-${activa}`} className="panel-admin">
        <Panel />
      </div>
    </section>
  );
}
