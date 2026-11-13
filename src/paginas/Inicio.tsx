import type { ReactElement } from 'react';
import { Link } from 'react-router-dom';

import TarjetaPlan from '../componentes/TarjetaPlan';
import { ETIQUETA_NIVEL, NIVELES } from '../dominio/modelos';
import { ordenarPorPrecio } from '../dominio/reglas';
import { usarApp } from '../estado/ContextoApp';
import { RUTAS } from '../rutas/rutas';

export default function Inicio(): ReactElement {
  const { contenido, planes, entrenamientos, cuenta } = usarApp();

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

          {/* La escalera de niveles: cuántos entrenamientos hay en cada escalón. */}
          <ol className="escalera" aria-label="Entrenamientos por nivel">
            {NIVELES.map((nivel) => (
              <li key={nivel} className={`escalera__escalon escalera__escalon--${nivel}`}>
                <span className="escalera__cantidad">
                  {entrenamientos.filter((e) => e.nivel === nivel).length}
                </span>
                <span className="escalera__nivel">
                  {ETIQUETA_NIVEL[nivel]}
                  <small className="escalera__unidad">rutinas</small>
                </span>
              </li>
            ))}
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
            {ordenarPorPrecio(planes).map((plan) => (
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
              <summary>{item.pregunta}</summary>
              <p>{item.respuesta}</p>
            </details>
          ))}
        </div>
      </section>
    </>
  );
}
