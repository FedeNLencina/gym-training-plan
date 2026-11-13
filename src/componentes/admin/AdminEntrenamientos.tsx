import { useState, type FormEvent, type ReactElement } from 'react';

import { ErrorValidacion, type CamposInvalidos } from '../../dominio/errores';
import { ETIQUETA_NIVEL, NIVELES, type Entrenamiento, type Nivel, type Video } from '../../dominio/modelos';
import { usarApp } from '../../estado/ContextoApp';
import { borrarVideo, guardarVideo, nuevoId } from '../../infra/almacen';
import { Campo, CampoTexto } from '../Campo';
import EtiquetaNivel from '../EtiquetaNivel';

type Formulario = {
  id?: string;
  titulo: string;
  descripcion: string;
  nivel: Nivel;
  duracionMin: string;
  fuente: Video['tipo'];
  enlace: string;
  /** Archivo recién elegido, todavía sin guardar. */
  archivoNuevo: File | null;
  /** Video de archivo que el entrenamiento ya tenía. */
  archivoPrevio: Extract<Video, { tipo: 'archivo' }> | null;
};

const VACIO: Formulario = {
  titulo: '',
  descripcion: '',
  nivel: 'basico',
  duracionMin: '',
  fuente: 'enlace',
  enlace: '',
  archivoNuevo: null,
  archivoPrevio: null,
};

const aFormulario = (e: Entrenamiento): Formulario => ({
  ...VACIO,
  id: e.id,
  titulo: e.titulo,
  descripcion: e.descripcion,
  nivel: e.nivel,
  duracionMin: String(e.duracionMin),
  fuente: e.video.tipo,
  enlace: e.video.tipo === 'enlace' ? e.video.url : '',
  archivoPrevio: e.video.tipo === 'archivo' ? e.video : null,
});

export default function AdminEntrenamientos(): ReactElement {
  const { entrenamientos, guardarEntrenamiento, eliminarEntrenamiento } = usarApp();
  const [formulario, setFormulario] = useState<Formulario | null>(null);
  const [campos, setCampos] = useState<CamposInvalidos>({});
  const [guardando, setGuardando] = useState(false);

  const abrir = (valores: Formulario): void => {
    setCampos({});
    setFormulario(valores);
  };

  const cambiar = (cambio: Partial<Formulario>): void => {
    setFormulario((actual) => (actual === null ? actual : { ...actual, ...cambio }));
  };

  /** Resuelve el video del formulario; si hay archivo nuevo, lo guarda primero. */
  const resolverVideo = async (f: Formulario): Promise<Video> => {
    if (f.fuente === 'enlace') return { tipo: 'enlace', url: f.enlace.trim() };
    if (f.archivoNuevo === null) {
      return f.archivoPrevio ?? { tipo: 'archivo', idArchivo: '', nombreArchivo: '' };
    }
    const idArchivo = nuevoId('video');
    await guardarVideo(idArchivo, f.archivoNuevo);
    return { tipo: 'archivo', idArchivo, nombreArchivo: f.archivoNuevo.name };
  };

  const enviar = async (evento: FormEvent): Promise<void> => {
    evento.preventDefault();
    if (formulario === null) return;
    setGuardando(true);
    let video: Video;
    try {
      video = await resolverVideo(formulario);
    } catch {
      setCampos({ video: 'No pudimos guardar el video: el almacenamiento del navegador está lleno' });
      setGuardando(false);
      return;
    }
    try {
      guardarEntrenamiento({
        id: formulario.id,
        titulo: formulario.titulo.trim(),
        descripcion: formulario.descripcion.trim(),
        nivel: formulario.nivel,
        duracionMin: Number(formulario.duracionMin),
        video,
      });
      // El archivo anterior ya no lo usa nadie si se reemplazó o se pasó a enlace.
      const previo = formulario.archivoPrevio;
      if (previo !== null && (video.tipo !== 'archivo' || video.idArchivo !== previo.idArchivo)) {
        void borrarVideo(previo.idArchivo);
      }
      setFormulario(null);
    } catch (fallo: unknown) {
      if (!(fallo instanceof ErrorValidacion)) throw fallo;
      setCampos(fallo.campos);
    } finally {
      setGuardando(false);
    }
  };

  const eliminar = (e: Entrenamiento): void => {
    if (window.confirm(`¿Eliminar "${e.titulo}" y su video?`)) eliminarEntrenamiento(e.id);
  };

  if (formulario !== null) {
    return (
      <form className="formulario" noValidate onSubmit={(evento) => void enviar(evento)}>
        <h2>{formulario.id === undefined ? 'Nuevo entrenamiento' : 'Editar entrenamiento'}</h2>
        <CampoTexto id="ent-titulo" etiqueta="Título" valor={formulario.titulo}
          alCambiar={(titulo) => cambiar({ titulo })} error={campos.titulo} />
        <CampoTexto id="ent-descripcion" etiqueta="Descripción" filas={3} valor={formulario.descripcion}
          alCambiar={(descripcion) => cambiar({ descripcion })} />
        <Campo id="ent-nivel" etiqueta="Categoría">
          <select id="ent-nivel" className="campo__control" value={formulario.nivel}
            onChange={(e) => cambiar({ nivel: e.target.value as Nivel })}>
            {NIVELES.map((nivel) => (
              <option key={nivel} value={nivel}>{ETIQUETA_NIVEL[nivel]}</option>
            ))}
          </select>
        </Campo>
        <CampoTexto id="ent-duracion" etiqueta="Duración en minutos" tipo="number"
          valor={formulario.duracionMin} alCambiar={(duracionMin) => cambiar({ duracionMin })}
          error={campos.duracionMin} />

        <fieldset className="campo">
          <legend className="campo__etiqueta">Video</legend>
          <label className="campo__opcion">
            <input type="radio" name="ent-fuente" checked={formulario.fuente === 'enlace'}
              onChange={() => cambiar({ fuente: 'enlace' })} />
            Enlace (YouTube, Vimeo o archivo en la web)
          </label>
          <label className="campo__opcion">
            <input type="radio" name="ent-fuente" checked={formulario.fuente === 'archivo'}
              onChange={() => cambiar({ fuente: 'archivo' })} />
            Subir archivo
          </label>
        </fieldset>

        {formulario.fuente === 'enlace' ? (
          <CampoTexto id="ent-enlace" etiqueta="Enlace del video" tipo="url" valor={formulario.enlace}
            alCambiar={(enlace) => cambiar({ enlace })} error={campos.video} />
        ) : (
          <Campo id="ent-archivo" etiqueta="Archivo de video" error={campos.video}
            ayuda={
              formulario.archivoPrevio !== null
                ? `Video actual: ${formulario.archivoPrevio.nombreArchivo}. Elegí otro para reemplazarlo.`
                : 'Se guarda en este navegador.'
            }>
            <input id="ent-archivo" type="file" accept="video/*" className="campo__control"
              aria-invalid={campos.video !== undefined}
              aria-describedby={campos.video !== undefined ? 'ent-archivo-error' : undefined}
              onChange={(e) => cambiar({ archivoNuevo: e.target.files?.[0] ?? null })} />
          </Campo>
        )}

        <div className="formulario__acciones">
          <button type="submit" className="boton-primario boton--compacto" disabled={guardando}>
            Guardar entrenamiento
          </button>
          <button type="button" className="boton-secundario boton--compacto" onClick={() => setFormulario(null)}>
            Cancelar
          </button>
        </div>
      </form>
    );
  }

  return (
    <>
      <div className="panel-admin__cabecera">
        <h2>Entrenamientos</h2>
        <button type="button" className="boton-primario boton--compacto" onClick={() => abrir(VACIO)}>
          Nuevo entrenamiento
        </button>
      </div>
      {entrenamientos.length === 0 ? (
        <p className="mensaje">No hay entrenamientos. Creá el primero con “Nuevo entrenamiento”.</p>
      ) : (
        <div className="tabla-contenedor">
          <table className="tabla">
            <thead>
              <tr>
                <th scope="col">Entrenamiento</th>
                <th scope="col">Categoría</th>
                <th scope="col">Duración</th>
                <th scope="col">Video</th>
                <th scope="col">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {entrenamientos.map((e) => (
                <tr key={e.id}>
                  <th scope="row">{e.titulo}</th>
                  <td><EtiquetaNivel nivel={e.nivel} /></td>
                  <td>{e.duracionMin} min</td>
                  <td>{e.video.tipo === 'enlace' ? 'Enlace' : e.video.nombreArchivo}</td>
                  <td className="tabla__acciones">
                    <button type="button" className="boton-secundario boton--compacto"
                      onClick={() => abrir(aFormulario(e))}>Editar</button>
                    <button type="button" className="boton-secundario boton--compacto"
                      onClick={() => eliminar(e)}>Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
