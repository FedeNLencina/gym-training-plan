import { Clock, Lock } from 'lucide-react';
import { useState, type ReactElement } from 'react';
import { Link } from 'react-router-dom';

import EtiquetaNivel from '../componentes/EtiquetaNivel';
import { ETIQUETA_NIVEL, NIVELES } from '../dominio/modelos';
import { filtrarPorNivel, puedeVer, type FiltroNivel } from '../dominio/reglas';
import { usarApp } from '../estado/ContextoApp';
import { RUTAS } from '../rutas/rutas';

const FILTROS: readonly { valor: FiltroNivel; texto: string }[] = [
  { valor: 'todos', texto: 'Todos' },
  ...NIVELES.map((nivel) => ({ valor: nivel, texto: ETIQUETA_NIVEL[nivel] })),
];

export default function Entrenamientos(): ReactElement {
  const { entrenamientos, acceso, cuenta } = usarApp();
  const [filtro, setFiltro] = useState<FiltroNivel>('todos');
  const visibles = filtrarPorNivel(entrenamientos, filtro);

  return (
    <section className="seccion seccion--app contenedor">
      <h1>Entrenamientos</h1>

      {acceso === null && (
        <p className="mensaje mensaje--aviso">
          Todavía no tenés un plan activo.{' '}
          {cuenta?.idPlanSolicitado != null
            ? 'Tu solicitud está pendiente: vas a poder entrenar cuando confirmemos el pago.'
            : 'Elegí uno para empezar a entrenar.'}{' '}
          <Link to={RUTAS.planes}>Ver planes</Link>
        </p>
      )}

      <div className="filtros" role="group" aria-label="Filtrar por categoría">
        {FILTROS.map(({ valor, texto }) => (
          <button
            key={valor}
            type="button"
            className="filtros__opcion"
            aria-pressed={filtro === valor}
            onClick={() => setFiltro(valor)}
          >
            {texto}
          </button>
        ))}
      </div>

      {visibles.length === 0 ? (
        <p className="mensaje">No hay entrenamientos en esta categoría.</p>
      ) : (
        <div className="lista-entrenamientos">
          {visibles.map((entrenamiento) => {
            const habilitado = puedeVer(acceso, entrenamiento.nivel);
            return (
              <article
                key={entrenamiento.id}
                className={habilitado ? 'entrenamiento' : 'entrenamiento entrenamiento--bloqueado'}
                aria-label={entrenamiento.titulo}
              >
                <div className="entrenamiento__meta">
                  <EtiquetaNivel nivel={entrenamiento.nivel} />
                  <span className="entrenamiento__duracion">
                    <Clock size={14} aria-hidden="true" />
                    {entrenamiento.duracionMin} min
                  </span>
                </div>
                <div>
                  <h2 className="entrenamiento__titulo">{entrenamiento.titulo}</h2>
                  <p className="entrenamiento__descripcion">{entrenamiento.descripcion}</p>
                </div>
                {habilitado ? (
                  <Link
                    to={RUTAS.entrenamiento(entrenamiento.id)}
                    className="boton-secundario boton--compacto entrenamiento__accion"
                  >
                    Ver entrenamiento
                  </Link>
                ) : (
                  <p className="entrenamiento__bloqueo">
                    <Lock size={14} aria-hidden="true" />
                    Requiere el plan {ETIQUETA_NIVEL[entrenamiento.nivel]}.{' '}
                    <Link to={RUTAS.planes}>Ver planes</Link>
                  </p>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
