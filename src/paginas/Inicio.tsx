import { Plus } from 'lucide-react';
import type { CSSProperties, ReactElement } from 'react';
import { Link } from 'react-router-dom';

import TarjetaPlan from '../componentes/TarjetaPlan';
import { ETIQUETA_NIVEL, NIVELES } from '../dominio/modelos';
import { formatearPrecio, ordenarPorPrecio } from '../dominio/reglas';
import { usarApp } from '../estado/ContextoApp';
import { RUTAS } from '../rutas/rutas';

export default function Inicio(): ReactElement {
  const { contenido, planes, entrenamientos, cuenta } = usarApp();
  const planesOrdenados = ordenarPorPrecio(planes);

  return (
    <>
      <section className="hero">
        <div className="contenedor hero__interior">
          <div className="hero__texto">
            <h1 className="hero__titulo">{contenido.heroTitulo}</h1>
            <p className="hero__bajada">{contenido.heroTexto}</p>
            <div className="hero__acciones">
              <Link to={RUTAS.planes} className="boton-primario">
                Ver planes
              </Link>
              {cuenta === null ? (
                <Link to={RUTAS.registro} className="boton-secundario">
                  Crear mi cuenta
                </Link>
              ) : (
                <Link to={RUTAS.entrenamientos} className="boton-secundario">
                  Ir a entrenar
                </Link>
              )}
            </div>
          </div>

          {/* La escalera de niveles: cada escalón muestra qué hay en ese nivel
              y cuánto cuesta, y lleva a elegir el plan. */}
          <ol className="escalera" aria-label="Niveles de entrenamiento">
            {NIVELES.map((nivel, orden) => {
              const rutinas = entrenamientos.filter((e) => e.nivel === nivel).length;
              const plan = planesOrdenados.find((p) => p.nivel === nivel);
              return (
                <li
                  key={nivel}
                  className={`escalera__escalon escalera__escalon--${nivel}`}
                  style={{ '--orden': orden } as CSSProperties}
                >
                  <Link to={RUTAS.planes} className="escalera__enlace">
                    <span className="escalera__nivel">{ETIQUETA_NIVEL[nivel]}</span>
                    <span className="escalera__dato">
                      {rutinas} {rutinas === 1 ? 'rutina' : 'rutinas'}
                    </span>
                    {plan !== undefined && (
                      <span className="escalera__dato escalera__precio">
                        {formatearPrecio(plan.precio)} por mes
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      <section className="seccion contenedor" aria-labelledby="como-funciona">
        <h2 id="como-funciona">Cómo funciona</h2>
        <ol className="pasos">
          {contenido.pasos.map((paso, indice) => (
            <li key={indice} className="pasos__paso">
              <h3>{paso.titulo}</h3>
              <p>{paso.texto}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="seccion seccion--franja" aria-labelledby="planes-inicio">
        <div className="contenedor">
          <h2 id="planes-inicio">Planes</h2>
          <p className="seccion__bajada">
            Tres niveles. Empezás donde estás y cambiás de plan cuando quieras.
          </p>
          <div className="grilla-planes">
            {planesOrdenados.map((plan) => (
              <TarjetaPlan key={plan.id} plan={plan} />
            ))}
          </div>
          <Link to={RUTAS.planes} className="boton-primario seccion__accion">
            Elegir mi plan
          </Link>
        </div>
      </section>

      <section className="seccion contenedor" aria-labelledby="preguntas">
        <h2 id="preguntas">Preguntas frecuentes</h2>
        <div className="preguntas">
          {contenido.preguntas.map((item, indice) => (
            <details key={indice} className="preguntas__item">
              <summary>
                {item.pregunta}
                <Plus size={20} aria-hidden="true" />
              </summary>
              <p>{item.respuesta}</p>
            </details>
          ))}
        </div>
      </section>
    </>
  );
}
