/**
 * FormularioEntrenamiento: alta y edición de un Entrenamiento por el Administrador.
 *
 * Formulario controlado con validación al enviar. Ante datos válidos guarda el
 * Entrenamiento a través del Repositorio_Datos del ContextoServicios: en
 * creación lo crea en estado publicado con un identificador único y presenta
 * "Entrenamiento publicado" (7.3); en edición conserva el identificador recibido
 * y presenta "Cambios guardados" (7.5). Ante datos inválidos presenta un mensaje
 * por cada campo afectado, asociado al control mediante `aria-describedby`, no
 * guarda nada y conserva todos los valores ya ingresados (7.4).
 *
 * Los rangos del formulario son los de la política de producto del Panel_Admin
 * (título 3–80, duración 5–120, 1–30 Ejercicios), más estrictos que los del
 * Repositorio_Datos: el formulario decide qué es publicable; el repositorio, qué
 * es almacenable. Por eso la validación vive aquí y no reusa
 * `validarEntrenamiento`, cuyos límites son los del almacenamiento.
 *
 * La Fuente_Video se elige con un grupo de radios ("Enlace de video" inicial,
 * "Subir video"), que muestra uno de dos controles obligatorios mutuamente
 * excluyentes (7.11–7.13). Con fuente `enlace` valida el formato del enlace
 * (7.10); con fuente `archivo` valida tipo y tamaño al seleccionar (7.14–7.16) y
 * exige un archivo al enviar (7.17). Al guardar un Entrenamiento con fuente
 * `archivo` sigue la secuencia `validar → guardarVideo → guardarEntrenamiento`:
 * si el AlmacenVideos rechaza por espacio insuficiente no se crea ni actualiza
 * el Entrenamiento y se conservan los valores (7.18, 7.19). Al pasar en edición
 * de `archivo` a `enlace` se guarda y luego se elimina el video huérfano (7.20).
 *
 * Cubre: 7.3, 7.4, 7.5, 7.10, 7.11, 7.12, 7.13, 7.14, 7.15, 7.16, 7.17, 7.18, 7.19, 7.20
 */
import { useState, type FormEvent, type ReactElement } from 'react';

import {
  MENSAJE_ENLACE_VIDEO_INVALIDO,
  esEnlaceVideoValido,
} from '../../dominio/enlacesVideo';
import { esErrorDominio } from '../../dominio/errores';
import {
  CATEGORIAS,
  NIVELES,
  crearEjercicio,
  crearEntrenamiento,
  type Ejercicio,
  type Entrenamiento,
  type FuenteVideo,
  type Nivel,
} from '../../dominio/modelos';
import { usarServicios } from '../../estado/ContextoServicios';
import CampoEnlaceVideo from './CampoEnlaceVideo';
import EditorEjercicios, {
  type ErroresEjercicio,
} from './EditorEjercicios';
import SelectorFuenteVideo from './SelectorFuenteVideo';
import SubidaArchivoVideo, {
  type ArchivoAceptado,
} from './SubidaArchivoVideo';

export const MENSAJE_CREACION = 'Entrenamiento publicado';
export const MENSAJE_EDICION = 'Cambios guardados';
export const MENSAJE_FALLO_GUARDADO = 'No pudimos guardar los cambios';
/** Mensaje de archivo faltante al enviar con Fuente_Video `archivo` (7.17). */
export const MENSAJE_ARCHIVO_FALTANTE = 'Seleccioná un archivo de video';
/** Mensaje de espacio insuficiente al conservar el Archivo_Video (7.19). */
export const MENSAJE_ESPACIO_INSUFICIENTE =
  'No pudimos guardar el video: el almacenamiento del navegador está lleno';

/** Rangos del formulario del Panel_Admin (política de producto, 7.3). */
export const LIMITES_FORMULARIO = Object.freeze({
  tituloMinimo: 3,
  tituloMaximo: 80,
  duracionMinima: 5,
  duracionMaxima: 120,
  ejerciciosMinimos: 1,
  ejerciciosMaximos: 30,
  nombreMinimo: 3,
  nombreMaximo: 60,
  seriesMinimas: 1,
  seriesMaximas: 20,
  repeticionesMinimas: 1,
  repeticionesMaximas: 100,
  descansoMinimo: 0,
  descansoMaximo: 300,
} as const);

/** Mensajes de validación de los campos del Entrenamiento (no de ejercicios). */
type MensajesCampo = Readonly<Record<string, string>>;

export type PropiedadesFormularioEntrenamiento = {
  /** Entrenamiento a editar; ausente en creación. */
  entrenamiento?: Entrenamiento;
};

function esEnteroEnRango(valor: number, min: number, max: number): boolean {
  return Number.isInteger(valor) && valor >= min && valor <= max;
}

/** Valida un Ejercicio contra los rangos del formulario. */
function validarEjercicioFormulario(ejercicio: Ejercicio): ErroresEjercicio {
  const errores: Record<string, string> = {};
  const nombre = ejercicio.nombre.trim();
  if (
    nombre.length < LIMITES_FORMULARIO.nombreMinimo ||
    nombre.length > LIMITES_FORMULARIO.nombreMaximo
  ) {
    errores.nombre = `Ingresá un nombre de ${LIMITES_FORMULARIO.nombreMinimo} a ${LIMITES_FORMULARIO.nombreMaximo} caracteres`;
  }
  if (
    !esEnteroEnRango(
      ejercicio.series,
      LIMITES_FORMULARIO.seriesMinimas,
      LIMITES_FORMULARIO.seriesMaximas,
    )
  ) {
    errores.series = `Ingresá un número entero de series de ${LIMITES_FORMULARIO.seriesMinimas} a ${LIMITES_FORMULARIO.seriesMaximas}`;
  }
  if (
    !esEnteroEnRango(
      ejercicio.repeticiones,
      LIMITES_FORMULARIO.repeticionesMinimas,
      LIMITES_FORMULARIO.repeticionesMaximas,
    )
  ) {
    errores.repeticiones = `Ingresá un número entero de repeticiones de ${LIMITES_FORMULARIO.repeticionesMinimas} a ${LIMITES_FORMULARIO.repeticionesMaximas}`;
  }
  if (
    !esEnteroEnRango(
      ejercicio.descansoSegundos,
      LIMITES_FORMULARIO.descansoMinimo,
      LIMITES_FORMULARIO.descansoMaximo,
    )
  ) {
    errores.descansoSegundos = `Ingresá un descanso entero de ${LIMITES_FORMULARIO.descansoMinimo} a ${LIMITES_FORMULARIO.descansoMaximo} segundos`;
  }
  return errores;
}

function tieneErrores(errores: ErroresEjercicio): boolean {
  return Object.keys(errores).length > 0;
}

/**
 * Reconoce el fallo de espacio insuficiente sin depender de `instanceof`: tanto
 * la clase real (`ErrorEspacioInsuficiente`) como el doble de prueba llevan el
 * campo `nombre` con ese valor, y comparar por `nombre` funciona con ambos.
 */
function esEspacioInsuficiente(fallo: unknown): boolean {
  return (
    typeof fallo === 'object' &&
    fallo !== null &&
    'nombre' in fallo &&
    (fallo as { nombre?: unknown }).nombre === 'ErrorEspacioInsuficiente'
  );
}

export default function FormularioEntrenamiento({
  entrenamiento,
}: PropiedadesFormularioEntrenamiento): ReactElement {
  const { repositorio, almacenVideos } = usarServicios();
  const esEdicion = entrenamiento !== undefined;

  const [titulo, setTitulo] = useState(entrenamiento?.titulo ?? '');
  const [descripcion, setDescripcion] = useState(
    entrenamiento?.descripcion ?? '',
  );
  const [categoria, setCategoria] = useState(entrenamiento?.categoria ?? '');
  const [nivel, setNivel] = useState<Nivel>(entrenamiento?.nivel ?? 'Principiante');
  const [duracion, setDuracion] = useState(
    entrenamiento !== undefined ? String(entrenamiento.duracionMinutos) : '',
  );
  // En creación el formulario arranca con un Ejercicio vacío, porque todo
  // Entrenamiento publicable exige al menos uno (7.3); en edición conserva los
  // Ejercicios del Entrenamiento recibido.
  const [ejercicios, setEjercicios] = useState<Ejercicio[]>(
    entrenamiento?.ejercicios ?? [crearEjercicio()],
  );

  // Fuente_Video: `enlace` por omisión en creación (7.11), o la del
  // Entrenamiento en edición.
  const [fuenteVideo, setFuenteVideo] = useState<FuenteVideo>(
    entrenamiento?.fuenteVideo ?? 'enlace',
  );
  const [enlaceVideo, setEnlaceVideo] = useState(
    entrenamiento?.enlaceVideo ?? '',
  );
  // Archivo recién seleccionado, pendiente de conservar. En edición, un
  // Entrenamiento con fuente `archivo` ya tiene su video conservado y su
  // metadato en `videoArchivo`; sólo se sube uno nuevo si el Administrador
  // selecciona otro.
  const [archivoSeleccionado, setArchivoSeleccionado] = useState<File | null>(
    null,
  );
  const [archivoAceptado, setArchivoAceptado] = useState<ArchivoAceptado | null>(
    entrenamiento?.videoArchivo
      ? {
          nombre: entrenamiento.videoArchivo.nombre,
          tamanioBytes: entrenamiento.videoArchivo.tamanioBytes,
        }
      : null,
  );
  const [errorEnlace, setErrorEnlace] = useState<string | null>(null);
  const [errorArchivo, setErrorArchivo] = useState<string | null>(null);

  const [campos, setCampos] = useState<MensajesCampo>({});
  const [erroresEjercicios, setErroresEjercicios] = useState<ErroresEjercicio[]>(
    [],
  );
  const [errorEjercicios, setErrorEjercicios] = useState<string | null>(null);
  const [avisoGeneral, setAvisoGeneral] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  /**
   * Valida los campos del formulario y devuelve, o bien el Entrenamiento listo
   * para guardar, o `null` habiendo fijado ya los mensajes por campo.
   */
  const validar = (): Entrenamiento | null => {
    const nuevosCampos: Record<string, string> = {};

    const tituloLimpio = titulo.trim();
    if (
      tituloLimpio.length < LIMITES_FORMULARIO.tituloMinimo ||
      tituloLimpio.length > LIMITES_FORMULARIO.tituloMaximo
    ) {
      nuevosCampos.titulo = `Ingresá un título de ${LIMITES_FORMULARIO.tituloMinimo} a ${LIMITES_FORMULARIO.tituloMaximo} caracteres`;
    }
    if (categoria.trim() === '') {
      nuevosCampos.categoria = 'Elegí una categoría';
    }
    if (!(NIVELES as readonly string[]).includes(nivel)) {
      nuevosCampos.nivel = `Elegí un nivel entre ${NIVELES.join(', ')}`;
    }
    const duracionNumero = duracion.trim() === '' ? Number.NaN : Number(duracion);
    if (
      !esEnteroEnRango(
        duracionNumero,
        LIMITES_FORMULARIO.duracionMinima,
        LIMITES_FORMULARIO.duracionMaxima,
      )
    ) {
      nuevosCampos.duracionMinutos = `Ingresá una duración entera de ${LIMITES_FORMULARIO.duracionMinima} a ${LIMITES_FORMULARIO.duracionMaxima} minutos`;
    }

    const nuevosErroresEjercicios = ejercicios.map(validarEjercicioFormulario);
    let mensajeEjercicios: string | null = null;
    if (
      ejercicios.length < LIMITES_FORMULARIO.ejerciciosMinimos ||
      ejercicios.length > LIMITES_FORMULARIO.ejerciciosMaximos
    ) {
      mensajeEjercicios = `Cargá entre ${LIMITES_FORMULARIO.ejerciciosMinimos} y ${LIMITES_FORMULARIO.ejerciciosMaximos} ejercicios`;
    }

    // Validación de la Fuente_Video (7.10, 7.17).
    let mensajeEnlace: string | null = null;
    let mensajeArchivo: string | null = null;
    if (fuenteVideo === 'enlace') {
      if (!esEnlaceVideoValido(enlaceVideo)) {
        mensajeEnlace = MENSAJE_ENLACE_VIDEO_INVALIDO;
      }
    } else if (archivoSeleccionado === null && entrenamiento?.videoArchivo == null) {
      mensajeArchivo = MENSAJE_ARCHIVO_FALTANTE;
    }

    setCampos(nuevosCampos);
    setErroresEjercicios(nuevosErroresEjercicios);
    setErrorEjercicios(mensajeEjercicios);
    setErrorEnlace(mensajeEnlace);
    setErrorArchivo(mensajeArchivo);

    const hayCampoInvalido = Object.keys(nuevosCampos).length > 0;
    const hayEjercicioInvalido = nuevosErroresEjercicios.some(tieneErrores);
    if (
      hayCampoInvalido ||
      hayEjercicioInvalido ||
      mensajeEjercicios !== null ||
      mensajeEnlace !== null ||
      mensajeArchivo !== null
    ) {
      return null;
    }

    const nombreArchivo =
      archivoSeleccionado?.name ?? entrenamiento?.videoArchivo?.nombre ?? '';
    const tipoArchivo =
      archivoSeleccionado?.type ?? entrenamiento?.videoArchivo?.tipo ?? '';
    const tamanioArchivo =
      archivoSeleccionado?.size ??
      entrenamiento?.videoArchivo?.tamanioBytes ??
      0;

    return crearEntrenamiento({
      ...entrenamiento,
      id: entrenamiento?.id,
      titulo: tituloLimpio,
      descripcion: descripcion.trim(),
      categoria: categoria.trim(),
      nivel,
      duracionMinutos: duracionNumero,
      estado: 'publicado',
      fuenteVideo,
      enlaceVideo: fuenteVideo === 'enlace' ? enlaceVideo.trim() : '',
      videoArchivo:
        fuenteVideo === 'archivo'
          ? {
              nombre: nombreArchivo,
              tipo: tipoArchivo,
              tamanioBytes: tamanioArchivo,
            }
          : null,
      ejercicios: ejercicios.map((ejercicio) =>
        crearEjercicio(ejercicio),
      ),
    });
  };

  const cambiarFuente = (fuente: FuenteVideo): void => {
    setFuenteVideo(fuente);
    setErrorEnlace(null);
    setErrorArchivo(null);
  };

  const aceptarArchivo = (archivo: File): void => {
    setArchivoSeleccionado(archivo);
    setArchivoAceptado({ nombre: archivo.name, tamanioBytes: archivo.size });
    setErrorArchivo(null);
  };

  const rechazarArchivo = (mensaje: string): void => {
    // El archivo rechazado se descarta y no queda seleccionado (7.15, 7.16).
    setArchivoSeleccionado(null);
    setArchivoAceptado(null);
    setErrorArchivo(mensaje);
  };

  const enviar = async (evento: FormEvent<HTMLFormElement>): Promise<void> => {
    evento.preventDefault();
    setAvisoGeneral(null);
    setAviso(null);

    const candidato = validar();
    if (candidato === null) return;

    try {
      // Fuente_Video `archivo` con un archivo nuevo: la secuencia es
      // validar → guardarVideo → guardarEntrenamiento (7.18). Si el AlmacenVideos
      // rechaza por espacio insuficiente no se llega a guardar el Entrenamiento y
      // se conservan los valores del formulario (7.19).
      if (candidato.fuenteVideo === 'archivo' && archivoSeleccionado !== null) {
        if (almacenVideos?.guardarVideo === undefined) {
          setAvisoGeneral(MENSAJE_FALLO_GUARDADO);
          return;
        }
        await almacenVideos.guardarVideo(candidato.id, archivoSeleccionado);
      }

      await repositorio.guardarEntrenamiento(candidato);

      // Cambio de `archivo` a `enlace` sobre un Entrenamiento existente: tras
      // guardar, se elimina el Archivo_Video que quedó huérfano (7.20).
      if (
        esEdicion &&
        entrenamiento?.fuenteVideo === 'archivo' &&
        candidato.fuenteVideo === 'enlace' &&
        almacenVideos?.eliminarVideo !== undefined
      ) {
        await almacenVideos.eliminarVideo(candidato.id);
      }

      setAviso(esEdicion ? MENSAJE_EDICION : MENSAJE_CREACION);
    } catch (fallo: unknown) {
      if (esEspacioInsuficiente(fallo)) {
        setAvisoGeneral(MENSAJE_ESPACIO_INSUFICIENTE);
        return;
      }
      if (esErrorDominio(fallo)) {
        setAvisoGeneral(fallo.message);
        return;
      }
      setAvisoGeneral(MENSAJE_FALLO_GUARDADO);
    }
  };

  return (
    <form
      noValidate
      onSubmit={(evento) => {
        void enviar(evento);
      }}
    >
      {avisoGeneral !== null && (
        <p role="alert" className="campo__error">
          {avisoGeneral}
        </p>
      )}
      {aviso !== null && <p role="status">{aviso}</p>}

      <div className="campo">
        <label className="campo__etiqueta" htmlFor="entrenamiento-titulo">
          Título
        </label>
        <input
          id="entrenamiento-titulo"
          className="campo__control"
          type="text"
          value={titulo}
          aria-invalid={campos.titulo !== undefined}
          aria-describedby={
            campos.titulo !== undefined ? 'entrenamiento-titulo-error' : undefined
          }
          onChange={(evento) => setTitulo(evento.target.value)}
        />
        {campos.titulo !== undefined && (
          <p className="campo__error" id="entrenamiento-titulo-error">
            {campos.titulo}
          </p>
        )}
      </div>

      <div className="campo">
        <label className="campo__etiqueta" htmlFor="entrenamiento-descripcion">
          Descripción
        </label>
        <textarea
          id="entrenamiento-descripcion"
          className="campo__control"
          value={descripcion}
          onChange={(evento) => setDescripcion(evento.target.value)}
        />
      </div>

      <div className="campo">
        <label className="campo__etiqueta" htmlFor="entrenamiento-categoria">
          Categoría
        </label>
        <select
          id="entrenamiento-categoria"
          className="campo__control"
          value={categoria}
          aria-invalid={campos.categoria !== undefined}
          aria-describedby={
            campos.categoria !== undefined
              ? 'entrenamiento-categoria-error'
              : undefined
          }
          onChange={(evento) => setCategoria(evento.target.value)}
        >
          <option value="">Elegí una categoría</option>
          {CATEGORIAS.map((opcion) => (
            <option key={opcion} value={opcion}>
              {opcion}
            </option>
          ))}
        </select>
        {campos.categoria !== undefined && (
          <p className="campo__error" id="entrenamiento-categoria-error">
            {campos.categoria}
          </p>
        )}
      </div>

      <div className="campo">
        <label className="campo__etiqueta" htmlFor="entrenamiento-nivel">
          Nivel
        </label>
        <select
          id="entrenamiento-nivel"
          className="campo__control"
          value={nivel}
          aria-invalid={campos.nivel !== undefined}
          aria-describedby={
            campos.nivel !== undefined ? 'entrenamiento-nivel-error' : undefined
          }
          onChange={(evento) => setNivel(evento.target.value as Nivel)}
        >
          {NIVELES.map((opcion) => (
            <option key={opcion} value={opcion}>
              {opcion}
            </option>
          ))}
        </select>
        {campos.nivel !== undefined && (
          <p className="campo__error" id="entrenamiento-nivel-error">
            {campos.nivel}
          </p>
        )}
      </div>

      <div className="campo">
        <label className="campo__etiqueta" htmlFor="entrenamiento-duracion">
          Duración estimada (minutos)
        </label>
        <input
          id="entrenamiento-duracion"
          className="campo__control"
          type="number"
          inputMode="numeric"
          value={duracion}
          aria-invalid={campos.duracionMinutos !== undefined}
          aria-describedby={
            campos.duracionMinutos !== undefined
              ? 'entrenamiento-duracion-error'
              : undefined
          }
          onChange={(evento) => setDuracion(evento.target.value)}
        />
        {campos.duracionMinutos !== undefined && (
          <p className="campo__error" id="entrenamiento-duracion-error">
            {campos.duracionMinutos}
          </p>
        )}
      </div>

      <SelectorFuenteVideo valor={fuenteVideo} onCambio={cambiarFuente} />

      {fuenteVideo === 'enlace' ? (
        <CampoEnlaceVideo
          valor={enlaceVideo}
          error={errorEnlace}
          onCambio={(valor) => {
            setEnlaceVideo(valor);
            setErrorEnlace(null);
          }}
        />
      ) : (
        <SubidaArchivoVideo
          archivo={archivoAceptado}
          error={errorArchivo}
          onSeleccion={aceptarArchivo}
          onRechazo={rechazarArchivo}
        />
      )}

      <fieldset
        aria-describedby={
          errorEjercicios !== null ? 'entrenamiento-ejercicios-error' : undefined
        }
      >
        <legend>Ejercicios</legend>
        {errorEjercicios !== null && (
          <p className="campo__error" id="entrenamiento-ejercicios-error">
            {errorEjercicios}
          </p>
        )}
        <EditorEjercicios
          ejercicios={ejercicios}
          errores={erroresEjercicios}
          onChange={setEjercicios}
        />
      </fieldset>

      <button type="submit" className="boton-primario">
        {esEdicion ? 'Guardar cambios' : 'Publicar entrenamiento'}
      </button>
    </form>
  );
}
