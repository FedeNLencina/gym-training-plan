import { Clock } from 'lucide-react';
import type { ReactElement } from 'react';
import { Link, useParams } from 'react-router-dom';

import EtiquetaNivel from '../componentes/EtiquetaNivel';
import VisorVideo from '../componentes/VisorVideo';
import { ETIQUETA_NIVEL } from '../dominio/modelos';
import { puedeVer } from '../dominio/reglas';
import { usarApp } from '../estado/ContextoApp';
import { RUTAS } from '../rutas/rutas';

export default function DetalleEntrenamiento(): ReactElement {
  const { id } = useParams();
  const { entrenamientos, acceso } = usarApp();
  const entrenamiento = entrenamientos.find((e) => e.id === id);

  if (entrenamiento === undefined) {
    return (
      <section className="seccion contenedor">
        <h1>Entrenamiento no encontrado</h1>
        <p className="seccion__bajada">Puede que lo hayan quitado del catálogo.</p>
        <Link to={RUTAS.entrenamientos} className="boton-primario">
          Ver entrenamientos
        </Link>
      </section>
    );
  }

  return (
    <section className="seccion contenedor detalle">
      <Link to={RUTAS.entrenamientos} className="detalle__volver">
        Volver a entrenamientos
      </Link>
      <h1>{entrenamiento.titulo}</h1>
      <div className="entrenamiento__meta">
        <EtiquetaNivel nivel={entrenamiento.nivel} />
        <span className="entrenamiento__duracion">
          <Clock size={14} aria-hidden="true" />
          {entrenamiento.duracionMin} min
        </span>
      </div>

      {puedeVer(acceso, entrenamiento.nivel) ? (
        <VisorVideo video={entrenamiento.video} titulo={entrenamiento.titulo} />
      ) : (
        <p className="mensaje mensaje--aviso">
          Este entrenamiento requiere el plan {ETIQUETA_NIVEL[entrenamiento.nivel]}.{' '}
          <Link to={RUTAS.planes}>Ver planes</Link>
        </p>
      )}

      <p className="detalle__descripcion">{entrenamiento.descripcion}</p>
    </section>
  );
}
