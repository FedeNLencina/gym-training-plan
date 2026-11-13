import type { ReactElement } from 'react';

import { ETIQUETA_NIVEL, NIVELES, type Nivel } from '../dominio/modelos';

/** Etiqueta de categoría: una, dos o tres barras según el nivel. */
export default function EtiquetaNivel({ nivel }: { nivel: Nivel }): ReactElement {
  const alcance = NIVELES.indexOf(nivel);
  return (
    <span className={`nivel nivel--${nivel}`}>
      <span className="nivel__barras" aria-hidden="true">
        {NIVELES.map((n, i) => (
          <span key={n} className={i <= alcance ? 'nivel__barra nivel__barra--llena' : 'nivel__barra'} />
        ))}
      </span>
      {ETIQUETA_NIVEL[nivel]}
    </span>
  );
}
