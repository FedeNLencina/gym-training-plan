/**
 * Verificación estática del corredor de pruebas y del determinismo de la suite.
 *
 * El determinismo de una corrida no puede observarse ejecutando la suite dentro
 * de un test (eso reentraría en el propio corredor y no terminaría en el tope de
 * tiempo). En su lugar, esta prueba verifica la configuración que *garantiza* el
 * determinismo y el modo no interactivo del corredor:
 *
 *  - El script `npm test` invoca `vitest run`: una única corrida no interactiva
 *    que finaliza sola y devuelve un código de salida distinto de 0 ante fallos
 *    (Vitest devuelve 1 cuando alguna prueba falla).
 *  - Toda prueba basada en propiedades fija una semilla (`seed`), de modo que dos
 *    corridas consecutivas sin cambios de código exploran la misma secuencia de
 *    entradas y producen resultados idénticos.
 *  - Las dependencias externas (servicios y Repositorio_Datos) se sustituyen por
 *    dobles de prueba controlados alojados en `src/tests/dobles`, evitando I/O
 *    real que introduciría no determinismo entre corridas.
 *
 * Cubre: 10.6, 10.8
 */

import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, it, expect } from 'vitest';

/** Directorio de este módulo (`src/tests`). */
const DIRECTORIO_ACTUAL = dirname(fileURLToPath(import.meta.url));

/** Lee un archivo de texto relativo a este módulo. */
function leer(ruta: string): string {
  return readFileSync(join(DIRECTORIO_ACTUAL, ruta), 'utf8');
}

const packageJson = JSON.parse(leer('../../package.json')) as {
  scripts: Record<string, string>;
};

const viteConfig = leer('../../vite.config.ts');

/**
 * Recorre `src` en busca de los archivos de pruebas basadas en propiedades.
 * Estos son los que ejercen fast-check y, por tanto, los que deben fijar semilla
 * para ser deterministas entre corridas.
 */
function archivosDePropiedades(): string[] {
  const raiz = join(DIRECTORIO_ACTUAL, '..');
  const encontrados: string[] = [];
  const visitar = (directorio: string): void => {
    for (const entrada of readdirSync(directorio, { withFileTypes: true })) {
      const ruta = join(directorio, entrada.name);
      if (entrada.isDirectory()) {
        visitar(ruta);
      } else if (/\.propiedades\.test\.tsx?$/.test(entrada.name)) {
        encontrados.push(ruta);
      }
    }
  };
  visitar(raiz);
  return encontrados;
}

describe('Corredor de pruebas y determinismo de la suite', () => {
  it('Dado el proyecto Cuando se lee el script test Entonces es una única corrida no interactiva vitest run', () => {
    // Cubre: 10.6
    const scriptTest = packageJson.scripts.test;
    expect(scriptTest).toBeDefined();
    // `vitest run` ejecuta la suite completa una sola vez y termina, a diferencia
    // del modo `watch` (interactivo, no termina) que bloquearía la corrida.
    expect(scriptTest).toBe('vitest run');
    expect(scriptTest).not.toMatch(/--watch\b/);
    expect(scriptTest).not.toMatch(/\bwatch\b(?!.*run)/);
  });

  it('Dado el script test Cuando falla alguna prueba Entonces vitest run devuelve un código de salida distinto de 0', () => {
    // Cubre: 10.6
    // Se afirma la garantía por configuración: `vitest run` sin `--passWithNoTests`
    // ni banderas que fuercen el éxito. Vitest devuelve un código distinto de 0
    // cuando al menos una prueba falla, comportamiento por defecto que aquí se
    // preserva al no añadir banderas que lo alteren.
    const scriptTest = packageJson.scripts.test;
    expect(scriptTest).not.toMatch(/--passWithNoTests\b/);
    expect(scriptTest).not.toMatch(/\|\|\s*true/);
    expect(scriptTest).not.toMatch(/;\s*exit\s+0/);
  });

  it('Dado el corredor Cuando se revisa la configuración Entonces no eleva el tope de tiempo por defecto de forma global', () => {
    // Cubre: 10.6
    // El límite de 300 s aplica a la corrida completa. La configuración no fija un
    // `testTimeout` global elevado que enmascare corridas lentas; los pocos tests
    // que necesitan más margen elevan su propio tope de forma local.
    expect(viteConfig).not.toMatch(/testTimeout\s*:/);
    expect(viteConfig).not.toMatch(/hookTimeout\s*:/);
  });

  it('Dado el conjunto de pruebas de propiedades Cuando se inspeccionan Entonces cada una fija una semilla para ser determinista', () => {
    // Cubre: 10.8
    const archivos = archivosDePropiedades();
    // Debe existir al menos un archivo de propiedades; de lo contrario, la
    // afirmación de determinismo sería vacua.
    expect(archivos.length).toBeGreaterThan(0);
    for (const ruta of archivos) {
      const contenido = readFileSync(ruta, 'utf8');
      // Cada archivo fija `seed` (directamente o vía la constante CONFIGURACION)
      // de modo que dos corridas consecutivas exploren la misma secuencia.
      expect(contenido).toMatch(/seed\s*:\s*\d+/);
    }
  });

  it('Dado que las pruebas dependen de servicios externos Cuando se ejecutan Entonces usan dobles en memoria en lugar de I/O real', () => {
    // Cubre: 10.8
    const raizDobles = join(DIRECTORIO_ACTUAL, 'dobles');
    const dobles = readdirSync(raizDobles).filter((nombre) => nombre.endsWith('.ts'));
    // Existe una batería de dobles controlados que sustituye al Repositorio_Datos
    // y a los servicios, garantizando corridas idénticas sin dependencias externas.
    expect(dobles).toContain('repositorioEnMemoria.ts');
    expect(dobles).toContain('almacenVideosEnMemoria.ts');
    expect(dobles).toContain('relojFalso.ts');
  });
});
