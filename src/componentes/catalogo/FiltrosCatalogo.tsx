/**
 * FiltrosCatalogo: controles de filtrado del catálogo.
 *
 * Dos selectores accesibles por su etiqueta —"Categoría" y "Nivel"— que ofrecen
 * el valor neutro "Todos" más las opciones recibidas. Cada selección se notifica
 * al contenedor como un filtro parcial (5.2, 5.3), y el valor neutro "Todos"
 * aparece siempre como primera opción (5.9). Mientras el catálogo carga, los
 * controles quedan deshabilitados (5.5).
 *
 * El componente es controlado: no guarda estado propio, sólo refleja los
 * valores que recibe y avisa de cada cambio. Así el conjunto presentado y los
 * controles no pueden divergir.
 *
 * Cubre: 5.2, 5.3, 5.5, 5.9
 */
import { type ReactElement } from 'react';

import { FILTRO_TODOS, type FiltrosCatalogo as Filtros } from '../../dominio/filtros';

export type PropiedadesFiltrosCatalogo = {
  categoria: string;
  nivel: string;
  categorias: readonly string[];
  niveles: readonly string[];
  deshabilitado: boolean;
  alCambiarFiltros: (parcial: Filtros) => void;
};

export default function FiltrosCatalogo({
  categoria,
  nivel,
  categorias,
  niveles,
  deshabilitado,
  alCambiarFiltros,
}: PropiedadesFiltrosCatalogo): ReactElement {
  return (
    <div className="filtros-catalogo">
      <div className="filtros-catalogo__campo">
        <label htmlFor="filtro-categoria">Categoría</label>
        <select
          id="filtro-categoria"
          value={categoria}
          disabled={deshabilitado}
          onChange={(evento) =>
            alCambiarFiltros({ categoria: evento.target.value })
          }
        >
          <option value={FILTRO_TODOS}>{FILTRO_TODOS}</option>
          {categorias.map((opcion) => (
            <option key={opcion} value={opcion}>
              {opcion}
            </option>
          ))}
        </select>
      </div>

      <div className="filtros-catalogo__campo">
        <label htmlFor="filtro-nivel">Nivel</label>
        <select
          id="filtro-nivel"
          value={nivel}
          disabled={deshabilitado}
          onChange={(evento) =>
            alCambiarFiltros({ nivel: evento.target.value as Filtros['nivel'] })
          }
        >
          <option value={FILTRO_TODOS}>{FILTRO_TODOS}</option>
          {niveles.map((opcion) => (
            <option key={opcion} value={opcion}>
              {opcion}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
