/**
 * Generadores (arbitraries) de fast-check para los modelos de dominio.
 *
 * Los generadores incluyen deliberadamente los casos borde señalados en el
 * prework: cadenas vacías y de sólo espacios, longitudes exactamente en el
 * límite, listas vacías, caracteres no ASCII y tamaños de Archivo_Video
 * exactamente en 52.428.800 bytes.
 *
 * Los tipos y las constantes de dominio viven en `../tiposDominio`, provisional
 * hasta que exista `src/dominio/modelos.ts` (tarea 2.1): así ninguna prueba
 * depende de módulos aún no escritos.
 *
 * Cubre: 10.8
 */

import fc from 'fast-check';
import {
  CATEGORIAS,
  ESTADOS_ENTRENAMIENTO,
  FUENTES_VIDEO,
  LIMITE_VIDEO_BYTES,
  NIVELES,
  PERIODICIDADES,
  ROLES,
  TIPOS_VIDEO_ADMITIDOS,
} from '../tiposDominio';
import type {
  Cuenta,
  Ejercicio,
  Entrenamiento,
  EntrenamientoDudoso,
  EstadoEntrenamiento,
  FuenteVideo,
  Plan,
} from '../tiposDominio';

export {
  CATEGORIAS,
  ESTADOS_ENTRENAMIENTO,
  FUENTES_VIDEO,
  LIMITE_VIDEO_BYTES,
  NIVELES,
  PERIODICIDADES,
  ROLES,
  TIPOS_VIDEO_ADMITIDOS,
};

/** Tipos MIME que el Archivo_Video debe rechazar. */
export const TIPOS_VIDEO_NO_ADMITIDOS = Object.freeze([
  '',
  'video/avi',
  'video/quicktime',
  'image/png',
  'application/pdf',
  'text/plain',
] as const);

/** Rutas declaradas de la Plataforma, en la forma del árbol de rutas. */
export const RUTAS_DECLARADAS = Object.freeze([
  '/',
  '/entrenamientos',
  '/entrenamientos/:id',
  '/registro',
  '/ingresar',
  '/admin',
] as const);

/** Cadenas que no aportan contenido: vacía y de sólo espacios. */
export const TEXTOS_EN_BLANCO = Object.freeze([
  '',
  ' ',
  '   ',
  '\t',
  '\n  ',
] as const);

// --- Utilidades de texto -----------------------------------------------------

const CARACTERES_ASCII =
  'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 -_.';
/** Caracteres no ASCII del plano básico: una unidad de código cada uno. */
const CARACTERES_NO_ASCII = 'áéíóúÁÉÍÓÚñÑüçßωλ日本語漢';

const arbCaracterAscii = fc.constantFrom(...CARACTERES_ASCII.split(''));
const arbCaracterNoAscii = fc.constantFrom(...CARACTERES_NO_ASCII.split(''));
const arbCaracter = fc.oneof(arbCaracterAscii, arbCaracterNoAscii);

const unir = (caracteres: string[]): string => caracteres.join('');

/**
 * Texto de longitud exacta en unidades de código, con mezcla de ASCII y no
 * ASCII.
 */
export function arbTextoDeLongitud(longitud: number): fc.Arbitrary<string> {
  return fc
    .array(arbCaracter, { minLength: longitud, maxLength: longitud })
    .map(unir);
}

/**
 * Texto no vacío ni en blanco, con longitud entre `min` y `max`, que incluye
 * explícitamente los extremos exactos del rango y variantes no ASCII.
 */
export function arbTexto(min: number, max: number): fc.Arbitrary<string> {
  const enRango = fc
    .array(arbCaracter, { minLength: Math.max(min, 1), maxLength: max })
    .map(unir);
  const candidatos: fc.Arbitrary<string>[] = [
    enRango,
    arbTextoDeLongitud(Math.max(min, 1)),
  ];
  if (max !== min) candidatos.push(arbTextoDeLongitud(max));
  return fc.oneof(...candidatos).map((texto) => {
    // Garantiza que el texto no quede en blanco al recortarlo.
    if (texto.trim().length > 0) return texto;
    return `a${texto.slice(1)}`;
  });
}

/** Cadenas vacías o de sólo espacios. */
export const arbTextoEnBlanco: fc.Arbitrary<string> = fc.constantFrom(
  ...TEXTOS_EN_BLANCO,
);

/** Texto que contiene al menos un carácter fuera de ASCII. */
export const arbTextoNoAscii: fc.Arbitrary<string> = fc
  .tuple(arbCaracterNoAscii, fc.array(arbCaracter, { maxLength: 20 }))
  .map(([inicial, resto]) => inicial + unir(resto));

// --- Ejercicio ---------------------------------------------------------------

/**
 * Ejercicio válido: nombre 3–60, series 1–20, repeticiones 1–100, descanso
 * 0–300. Los extremos exactos de cada rango se generan con probabilidad no nula.
 */
export function arbEjercicio({
  descansoMinimo = 0,
  descansoMaximo = 300,
}: { descansoMinimo?: number; descansoMaximo?: number } = {}): fc.Arbitrary<Ejercicio> {
  return fc.record<Ejercicio>({
    id: fc.uuid(),
    nombre: arbTexto(3, 60),
    series: fc.oneof(fc.integer({ min: 1, max: 20 }), fc.constantFrom(1, 20)),
    repeticiones: fc.oneof(
      fc.integer({ min: 1, max: 100 }),
      fc.constantFrom(1, 100),
    ),
    descansoSegundos: fc.oneof(
      fc.integer({ min: descansoMinimo, max: descansoMaximo }),
      fc.constantFrom(descansoMinimo, descansoMaximo),
    ),
  });
}

/** Lista de Ejercicios con identificadores únicos dentro del Entrenamiento. */
export function arbListaEjercicios({
  minimo = 1,
  maximo = 5,
}: { minimo?: number; maximo?: number } = {}): fc.Arbitrary<Ejercicio[]> {
  return fc
    .array(arbEjercicio(), { minLength: minimo, maxLength: maximo })
    .map((ejercicios) =>
      ejercicios.map((ejercicio, indice) => ({
        ...ejercicio,
        id: `ej-${indice}-${ejercicio.id}`,
      })),
    );
}

// --- Entrenamiento -----------------------------------------------------------

const arbEnlaceVideo: fc.Arbitrary<string> = fc
  .tuple(
    fc.constantFrom('https://', 'http://'),
    fc.constantFrom('www.youtube.com/watch?v=', 'vimeo.com/', 'cdn.atlas.io/'),
    fc
      .array(
        arbCaracterAscii.filter((caracter) => caracter !== ' ' && caracter !== '.'),
        { minLength: 3, maxLength: 12 },
      )
      .map(unir),
  )
  .map(([esquema, host, recurso]) => `${esquema}${host}${recurso}`);

export type OpcionesEntrenamiento = {
  fuenteVideo?: FuenteVideo;
  estado?: EstadoEntrenamiento;
  minimoEjercicios?: number;
  maximoEjercicios?: number;
};

/** Entrenamiento válido según los límites del Repositorio_Datos. */
export function arbEntrenamiento({
  fuenteVideo,
  estado,
  minimoEjercicios = 1,
  maximoEjercicios = 5,
}: OpcionesEntrenamiento = {}): fc.Arbitrary<Entrenamiento> {
  const arbFuente =
    fuenteVideo === undefined
      ? fc.constantFrom(...FUENTES_VIDEO)
      : fc.constant(fuenteVideo);
  const arbEstado =
    estado === undefined
      ? fc.constantFrom(...ESTADOS_ENTRENAMIENTO)
      : fc.constant(estado);

  return fc
    .record({
      id: fc.uuid(),
      titulo: arbTexto(1, 80),
      descripcion: fc.oneof(fc.constant(''), arbTexto(1, 200)),
      categoria: fc.constantFrom(...CATEGORIAS),
      nivel: fc.constantFrom(...NIVELES),
      duracionMinutos: fc.oneof(
        fc.integer({ min: 5, max: 120 }),
        fc.constantFrom(5, 120),
      ),
      estado: arbEstado,
      fuenteVideo: arbFuente,
      enlace: arbEnlaceVideo,
      videoArchivo: fc.record({
        nombre: arbTexto(1, 30),
        tipo: fc.constantFrom(...TIPOS_VIDEO_ADMITIDOS),
        tamanioBytes: fc.integer({ min: 1, max: LIMITE_VIDEO_BYTES }),
      }),
      ejercicios: arbListaEjercicios({
        minimo: minimoEjercicios,
        maximo: maximoEjercicios,
      }),
    })
    .map(({ enlace, videoArchivo, ...resto }): Entrenamiento => ({
      ...resto,
      enlaceVideo: resto.fuenteVideo === 'enlace' ? enlace : '',
      videoArchivo: resto.fuenteVideo === 'archivo' ? videoArchivo : null,
    }));
}

/** Reglas de invalidez del Repositorio_Datos (criterios 8.7 y 8.14). */
export const REGLAS_ENTRENAMIENTO_INVALIDO = Object.freeze([
  'tituloEnBlanco',
  'tituloExcedeLimite',
  'descripcionExcedeLimite',
  'categoriaEnBlanco',
  'nivelAusente',
  'duracionAusente',
  'duracionPorDebajoDelRango',
  'duracionPorEncimaDelRango',
  'duracionNoEntera',
  'sinEjercicios',
  'demasiadosEjercicios',
  'fuenteVideoInvalida',
] as const);

export type ReglaEntrenamientoInvalido =
  (typeof REGLAS_ENTRENAMIENTO_INVALIDO)[number];

/** Campo que cada regla vuelve inválido. */
export const CAMPO_POR_REGLA: Readonly<
  Record<ReglaEntrenamientoInvalido, keyof Entrenamiento>
> = Object.freeze({
  tituloEnBlanco: 'titulo',
  tituloExcedeLimite: 'titulo',
  descripcionExcedeLimite: 'descripcion',
  categoriaEnBlanco: 'categoria',
  nivelAusente: 'nivel',
  duracionAusente: 'duracionMinutos',
  duracionPorDebajoDelRango: 'duracionMinutos',
  duracionPorEncimaDelRango: 'duracionMinutos',
  duracionNoEntera: 'duracionMinutos',
  sinEjercicios: 'ejercicios',
  demasiadosEjercicios: 'ejercicios',
  fuenteVideoInvalida: 'fuenteVideo',
} as const);

/** Caso inválido: la regla violada, el campo afectado y el Entrenamiento. */
export type CasoEntrenamientoInvalido = {
  regla: ReglaEntrenamientoInvalido;
  campo: keyof Entrenamiento;
  entrenamiento: EntrenamientoDudoso;
};

/**
 * Entrenamiento inválido por una regla concreta. Devuelve la regla, el campo
 * afectado y el Entrenamiento, para que la prueba pueda afirmar sobre el campo
 * que el error debe nombrar.
 */
export function arbEntrenamientoInvalidoPorRegla(
  regla: ReglaEntrenamientoInvalido,
): fc.Arbitrary<CasoEntrenamientoInvalido> {
  const base = arbEntrenamiento();

  const mutaciones: Record<
    ReglaEntrenamientoInvalido,
    fc.Arbitrary<EntrenamientoDudoso>
  > = {
    tituloEnBlanco: arbTextoEnBlanco.map((titulo) => ({ titulo })),
    // 121 caracteres: un carácter por encima del límite de 120.
    tituloExcedeLimite: arbTextoDeLongitud(121).map((titulo) => ({ titulo })),
    descripcionExcedeLimite: arbTextoDeLongitud(1001).map((descripcion) => ({
      descripcion,
    })),
    categoriaEnBlanco: arbTextoEnBlanco.map((categoria) => ({ categoria })),
    nivelAusente: fc
      .constantFrom(null, undefined, '', 'Experto')
      .map((nivel) => ({ nivel })),
    duracionAusente: fc
      .constantFrom(null, undefined, '')
      .map((duracionMinutos) => ({ duracionMinutos })),
    duracionPorDebajoDelRango: fc
      .integer({ min: -50, max: 0 })
      .map((duracionMinutos) => ({ duracionMinutos })),
    duracionPorEncimaDelRango: fc
      .integer({ min: 241, max: 5000 })
      .map((duracionMinutos) => ({ duracionMinutos })),
    duracionNoEntera: fc
      .double({ min: 1.1, max: 239.9, noNaN: true, noDefaultInfinity: true })
      .filter((valor) => !Number.isInteger(valor))
      .map((duracionMinutos) => ({ duracionMinutos })),
    sinEjercicios: fc.constant({ ejercicios: [] }),
    demasiadosEjercicios: arbListaEjercicios({ minimo: 51, maximo: 51 }).map(
      (ejercicios) => ({ ejercicios }),
    ),
    fuenteVideoInvalida: fc
      .constantFrom('', 'ambos', 'url', null, undefined)
      .map((fuenteVideo) => ({ fuenteVideo })),
  };

  return fc
    .tuple(base, mutaciones[regla])
    .map(([entrenamiento, cambios]): CasoEntrenamientoInvalido => ({
      regla,
      campo: CAMPO_POR_REGLA[regla],
      entrenamiento: { ...entrenamiento, ...cambios },
    }));
}

/** Entrenamiento inválido por cualquiera de las reglas declaradas. */
export function arbEntrenamientoInvalido(): fc.Arbitrary<CasoEntrenamientoInvalido> {
  return fc.oneof(
    ...REGLAS_ENTRENAMIENTO_INVALIDO.map(arbEntrenamientoInvalidoPorRegla),
  );
}

/** Lista de Entrenamientos con identificadores únicos. Admite lista vacía. */
export function arbListaEntrenamientos({
  minimo = 0,
  maximo = 6,
  estado,
}: {
  minimo?: number;
  maximo?: number;
  estado?: EstadoEntrenamiento;
} = {}): fc.Arbitrary<Entrenamiento[]> {
  return fc
    .array(arbEntrenamiento({ estado }), {
      minLength: minimo,
      maxLength: maximo,
    })
    .map((entrenamientos) =>
      entrenamientos.map((entrenamiento, indice) => ({
        ...entrenamiento,
        id: `ent-${indice}-${entrenamiento.id}`,
      })),
    );
}

// --- Plan --------------------------------------------------------------------

/**
 * Plan válido. `precio` se construye en centavos para garantizar exactamente
 * dos decimales dentro del rango 1–999.999.
 */
export function arbPlan({
  recomendado = false,
}: { recomendado?: boolean } = {}): fc.Arbitrary<Plan> {
  return fc.record<Plan>({
    id: fc.uuid(),
    nombre: arbTexto(3, 40),
    objetivo: arbTexto(10, 120),
    precio: fc
      .integer({ min: 100, max: 99999900 })
      .map((centavos) => Number((centavos / 100).toFixed(2))),
    periodicidad: fc.constantFrom(...PERIODICIDADES),
    prestaciones: fc.array(arbTexto(5, 80), { minLength: 3, maxLength: 8 }),
    incluyeAsesoria: fc.boolean(),
    incluyeAlimentacion: fc.boolean(),
    recomendado: fc.constant(recomendado),
  });
}

export type OpcionesListaPlanes = {
  /** Cantidad exacta de planes. */
  cantidad?: number;
  minimo?: number;
  maximo?: number;
  /** Cantidad exacta de planes marcados como recomendados. */
  cantidadRecomendados?: number;
};

/**
 * Lista de planes parametrizada por la cantidad de recomendados. Con
 * `cantidadRecomendados` sin especificar, la cantidad es libre (0, 1 o más), lo
 * que permite ejercitar la regla de destaque único. Admite lista vacía.
 */
export function arbListaPlanes({
  cantidad,
  minimo = 0,
  maximo = 5,
  cantidadRecomendados,
}: OpcionesListaPlanes = {}): fc.Arbitrary<Plan[]> {
  const minLength = cantidad ?? minimo;
  const maxLength = cantidad ?? maximo;

  return fc.array(arbPlan(), { minLength, maxLength }).chain((planes) => {
    const total = planes.length;
    const arbCuantos =
      cantidadRecomendados === undefined
        ? fc.integer({ min: 0, max: total })
        : fc.constant(Math.min(cantidadRecomendados, total));

    return arbCuantos.chain((cuantos) => {
      const arbIndices: fc.Arbitrary<number[]> =
        cuantos === 0
          ? fc.constant([])
          : fc.uniqueArray(fc.integer({ min: 0, max: total - 1 }), {
              minLength: cuantos,
              maxLength: cuantos,
            });
      return arbIndices.map((indices) =>
        planes.map((plan, indice) => ({
          ...plan,
          id: `plan-${indice}-${plan.id}`,
          recomendado: indices.includes(indice),
        })),
      );
    });
  });
}

// --- Cuenta y correo ---------------------------------------------------------

const arbSegmentoCorreo = (min: number, max: number): fc.Arbitrary<string> =>
  fc
    .array(
      fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789'.split('')),
      { minLength: min, maxLength: max },
    )
    .map(unir);

/** Correo con formato `texto@dominio.extension` y longitud entre 6 y 254. */
export const arbCorreoValido: fc.Arbitrary<string> = fc
  .tuple(
    arbSegmentoCorreo(1, 20),
    arbSegmentoCorreo(1, 15),
    fc.constantFrom('com', 'ar', 'io', 'net', 'com.ar'),
  )
  .map(([local, dominio, extension]) => `${local}@${dominio}.${extension}`);

/**
 * Correos inválidos: en blanco, sin arroba, sin extensión, con más de una
 * arroba, por debajo de 6 caracteres y por encima de 254.
 */
export const arbCorreoInvalido: fc.Arbitrary<string> = fc.oneof(
  arbTextoEnBlanco,
  arbSegmentoCorreo(1, 20).map((texto) => `${texto}.com`),
  arbSegmentoCorreo(1, 20).map((texto) => `${texto}@sinextension`),
  arbSegmentoCorreo(1, 20).map((texto) => `${texto}@.com`),
  arbSegmentoCorreo(1, 20).map((texto) => `@${texto}.com`),
  arbSegmentoCorreo(1, 10).map((texto) => `${texto}@a@b.com`),
  arbSegmentoCorreo(1, 8).map((texto) => `${texto} con espacio@a.com`),
  // Exactamente 5 caracteres: un carácter por debajo del mínimo de 6.
  fc.constant('a@b.c'),
  // 255 caracteres: un carácter por encima del máximo de 254.
  arbTextoDeLongitud(247).map((relleno) => `${relleno}@dominio.com`),
);

/** Cuenta válida: nombre 2–60, contraseña 8–64. */
export function arbCuenta({
  rol,
  idPlan,
}: { rol?: Cuenta['rol']; idPlan?: string | null } = {}): fc.Arbitrary<Cuenta> {
  return fc.record<Cuenta>({
    id: fc.uuid(),
    nombre: arbTexto(2, 60),
    correo: arbCorreoValido,
    contrasenia: arbTexto(8, 64),
    rol: rol === undefined ? fc.constantFrom(...ROLES) : fc.constant(rol),
    idPlan:
      idPlan === undefined
        ? fc.option(fc.uuid(), { nil: null })
        : fc.constant(idPlan),
  });
}

// --- Archivo_Video -----------------------------------------------------------

/** Descriptor de Archivo_Video: metadatos y, opcionalmente, los bytes. */
export type DescriptorArchivoVideo = {
  nombre: string;
  tipo: string;
  tamanioBytes: number;
  contenido: Uint8Array | null;
};

/** Descriptor con bytes materializados: `tamanioBytes === contenido.length`. */
export type DescriptorArchivoVideoConContenido = Omit<
  DescriptorArchivoVideo,
  'contenido'
> & { contenido: Uint8Array };

const arbNombreArchivo: fc.Arbitrary<string> = arbTexto(1, 30).map(
  (base) => `${base}.mp4`,
);

/**
 * Descriptor con bytes reales (hasta 64) y `tamanioBytes` igual a su longitud,
 * apto para verificar la ida y vuelta binaria.
 */
export function arbArchivoVideoConContenido({
  admitido = true,
}: { admitido?: boolean } = {}): fc.Arbitrary<DescriptorArchivoVideoConContenido> {
  return fc
    .record({
      nombre: arbNombreArchivo,
      tipo: admitido
        ? fc.constantFrom<string>(...TIPOS_VIDEO_ADMITIDOS)
        : fc.constantFrom<string>(...TIPOS_VIDEO_NO_ADMITIDOS),
      contenido: fc.uint8Array({ minLength: 0, maxLength: 64 }),
    })
    .map((descriptor) => ({
      ...descriptor,
      tamanioBytes: descriptor.contenido.length,
    }));
}

/**
 * Descriptor de Archivo_Video.
 *
 * Con `conContenido: true` delega en `arbArchivoVideoConContenido`. Sin
 * contenido produce sólo metadatos, con tamaños alrededor del límite de
 * 52.428.800 bytes (incluido el valor exacto): materializar 50 MB de bytes en
 * cada iteración haría la suite impracticable, y los caminos de validación sólo
 * consultan tipo y tamaño.
 */
export function arbArchivoVideo({
  admitido = true,
  conContenido = false,
}: { admitido?: boolean; conContenido?: boolean } = {}): fc.Arbitrary<DescriptorArchivoVideo> {
  if (conContenido) return arbArchivoVideoConContenido({ admitido });

  const arbTamanioAdmitido = fc.oneof(
    fc.integer({ min: 0, max: LIMITE_VIDEO_BYTES }),
    // Bordes: vacío, un byte, uno menos que el límite y el límite exacto.
    fc.constantFrom(0, 1, LIMITE_VIDEO_BYTES - 1, LIMITE_VIDEO_BYTES),
  );
  const arbTamanioExcedido = fc.oneof(
    fc.integer({ min: LIMITE_VIDEO_BYTES + 1, max: LIMITE_VIDEO_BYTES * 3 }),
    fc.constant(LIMITE_VIDEO_BYTES + 1),
  );

  const arbAdmitido = fc.record<DescriptorArchivoVideo>({
    nombre: arbNombreArchivo,
    tipo: fc.constantFrom<string>(...TIPOS_VIDEO_ADMITIDOS),
    tamanioBytes: arbTamanioAdmitido,
    contenido: fc.constant(null),
  });

  if (admitido) return arbAdmitido;

  // Rechazable por tipo, por tamaño, o por ambos motivos a la vez.
  return fc.oneof(
    fc.record<DescriptorArchivoVideo>({
      nombre: arbNombreArchivo,
      tipo: fc.constantFrom<string>(...TIPOS_VIDEO_NO_ADMITIDOS),
      tamanioBytes: arbTamanioAdmitido,
      contenido: fc.constant(null),
    }),
    fc.record<DescriptorArchivoVideo>({
      nombre: arbNombreArchivo,
      tipo: fc.constantFrom<string>(...TIPOS_VIDEO_ADMITIDOS),
      tamanioBytes: arbTamanioExcedido,
      contenido: fc.constant(null),
    }),
    fc.record<DescriptorArchivoVideo>({
      nombre: arbNombreArchivo,
      tipo: fc.constantFrom<string>(...TIPOS_VIDEO_NO_ADMITIDOS),
      tamanioBytes: arbTamanioExcedido,
      contenido: fc.constant(null),
    }),
  );
}

/** Archivo seleccionado, en la forma que consumen el almacén y la interfaz. */
export type ArchivoSeleccionado =
  | File
  | {
      name: string;
      nombre: string;
      type: string;
      tipo: string;
      size: number;
      tamanioBytes: number;
      contenido: Uint8Array | null;
    };

/**
 * Convierte un descriptor en algo consumible como archivo seleccionado.
 *
 * Con contenido devuelve un `File` real. Sin contenido devuelve un objeto con
 * `name`, `type` y `size`, porque el tamaño de un `Blob` no puede declararse sin
 * materializar los bytes.
 */
export function construirArchivo(
  descriptor: DescriptorArchivoVideo,
): ArchivoSeleccionado {
  const { nombre, tipo, tamanioBytes, contenido } = descriptor;
  if (contenido !== null && typeof File !== 'undefined') {
    // Copia los bytes para obtener un buffer concreto: `Uint8Array` genérico
    // sobre `ArrayBufferLike` no es un `BlobPart` admisible.
    return new File([new Uint8Array(contenido)], nombre, { type: tipo });
  }
  return {
    name: nombre,
    nombre,
    type: tipo,
    tipo,
    size: tamanioBytes,
    tamanioBytes,
    contenido,
  };
}

// --- Ancho de ventana y rutas ------------------------------------------------

/** Ancho de ventana en píxeles, con los bordes del umbral de 768 px incluidos. */
export function arbAnchoVentana({
  franja = 'cualquiera',
}: {
  franja?: 'movil' | 'escritorio' | 'cualquiera';
} = {}): fc.Arbitrary<number> {
  const movil = fc.oneof(
    fc.integer({ min: 320, max: 767 }),
    fc.constantFrom(320, 767),
  );
  const escritorio = fc.oneof(
    fc.integer({ min: 768, max: 2560 }),
    fc.constantFrom(768, 1024),
  );
  if (franja === 'movil') return movil;
  if (franja === 'escritorio') return escritorio;
  return fc.oneof(movil, escritorio);
}

/**
 * Indica si una ruta concreta corresponde a alguna ruta declarada, incluyendo
 * el patrón `/entrenamientos/:id`.
 */
export function esRutaDeclarada(ruta: string): boolean {
  if ((RUTAS_DECLARADAS as readonly string[]).includes(ruta)) return true;
  const segmentos = ruta.split('/').filter((segmento) => segmento !== '');
  return segmentos.length === 2 && segmentos[0] === 'entrenamientos';
}

/** Ruta que no pertenece al conjunto de rutas declaradas. */
export const arbRutaNoDeclarada: fc.Arbitrary<string> = fc
  .array(
    fc
      .array(
        fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789-'.split('')),
        { minLength: 1, maxLength: 10 },
      )
      .map(unir),
    { minLength: 1, maxLength: 3 },
  )
  .map((segmentos) => `/${segmentos.join('/')}`)
  .filter((ruta) => !esRutaDeclarada(ruta));
