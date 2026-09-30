/**
 * Tests de las reglas de estilo transversales del Tema_Atlas.
 *
 * Las hojas de estilo no se ejecutan con una cascada real en jsdom, por lo que
 * estas pruebas leen los archivos `.css` como texto y verifican que las reglas
 * declaradas existen y son correctas: el indicador de foco visible con contorno
 * de acento, el área activa de 44 x 44 px por debajo de 768 px, la disposición
 * en una sola columna entre 320 y 767 px con grillas a partir de 768 px, el uso
 * exclusivo de `var(--token)` (sin colores literales fuera de `variables.css`) y
 * los bloques decorativos ignorados por las tecnologías de asistencia.
 *
 * Cubre: 9.1, 9.2, 9.3, 9.4, 9.5, 9.9, 9.10, 9.11
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { describe, it, expect } from 'vitest';

// Las hojas de estilo se leen como texto desde el sistema de archivos para
// verificar las reglas declaradas sin ejecutar la cascada CSS. Se evita el
// sufijo `?raw` de Vite porque, bajo la configuración de Vitest de este
// proyecto, puede devolver una cadena vacía para los `.css`.
function leerEstilo(nombre: string): string {
  return readFileSync(fileURLToPath(new URL(nombre, import.meta.url)), 'utf8');
}

const global = leerEstilo('./global.css');
const componentes = leerEstilo('./components.css');
const variables = leerEstilo('./variables.css');

/**
 * Extrae el bloque de declaraciones `{ ... }` que sigue al primer selector que
 * contiene `aguja`. Permite comprobar reglas concretas sin depender del resto
 * del archivo.
 */
function bloqueTrasSelector(css: string, aguja: string): string {
  const indiceSelector = css.indexOf(aguja);
  if (indiceSelector === -1) return '';
  const inicio = css.indexOf('{', indiceSelector);
  const fin = css.indexOf('}', inicio);
  if (inicio === -1 || fin === -1) return '';
  return css.slice(inicio + 1, fin);
}

/**
 * Devuelve el contenido de la primera at-rule `@media (condicion) { ... }` que
 * coincide con `condicion`, respetando el anidamiento de llaves interno.
 */
function bloqueMedia(css: string, condicion: string): string {
  const indice = css.indexOf(condicion);
  if (indice === -1) return '';
  const inicio = css.indexOf('{', indice);
  if (inicio === -1) return '';
  let profundidad = 0;
  for (let i = inicio; i < css.length; i += 1) {
    if (css[i] === '{') profundidad += 1;
    else if (css[i] === '}') {
      profundidad -= 1;
      if (profundidad === 0) return css.slice(inicio + 1, i);
    }
  }
  return '';
}

describe('Reglas de estilo transversales', () => {
  it('Dado el foco del teclado Cuando se aplica :focus-visible Entonces dibuja un contorno con un token de acento', () => {
    // Cubre: 9.9
    const bloque = bloqueTrasSelector(global, ':focus-visible');
    expect(bloque).toMatch(/outline:/);
    expect(bloque).toMatch(/var\(--primary(-vibrant)?\)/);
  });

  it('Dado un ancho por debajo de 768 px Cuando se muestran controles Entonces exige un área activa de 44 x 44 px', () => {
    // Cubre: 9.10
    const bloque = bloqueMedia(global, '@media (max-width: 767px)');
    expect(bloque).not.toBe('');
    expect(bloque).toMatch(/min-height:\s*var\(--area-activa-min\)/);
    expect(bloque).toMatch(/min-width:\s*var\(--area-activa-min\)/);
    expect(variables).toMatch(/--area-activa-min:\s*44px/);
  });

  it('Dado el token de área activa Cuando se declara Entonces vale 44 píxeles', () => {
    // Cubre: 9.10
    expect(global).toMatch(/--area-activa-min:\s*44px/);
  });

  it('Dado un ancho entre 320 y 767 px Cuando se disponen las grillas Entonces usan una sola columna por defecto', () => {
    // Cubre: 9.4
    const bloque = bloqueTrasSelector(componentes, '.grilla {');
    expect(bloque).toMatch(/display:\s*grid/);
    expect(bloque).toMatch(/grid-template-columns:\s*1fr/);
  });

  it('Dado el estilo de una sola columna Cuando se busca la multicolumna Entonces sólo aparece dentro de @media (min-width: 768px)', () => {
    // Cubre: 9.4, 9.5
    const fuera = componentes.replace(/@media[^{]*\{(?:[^{}]|\{[^{}]*\})*\}/g, '');
    // Ninguna definición de varias columnas debe existir fuera de las at-rules.
    expect(fuera).not.toMatch(/grid-template-columns:\s*repeat\(/);

    const bloque768 = bloqueMedia(componentes, '@media (min-width: 768px)');
    expect(bloque768).toMatch(/grid-template-columns:\s*repeat\(/);
  });

  it('Dado el enfoque mobile-first Cuando se listan las at-rules Entonces las columnas adicionales usan min-width y no max-width', () => {
    // Cubre: 9.5
    const columnasEnMaxWidth = /@media\s*\(max-width[^{]*\{[^}]*grid-template-columns:\s*repeat\(/;
    expect(componentes).not.toMatch(columnasEnMaxWidth);
    expect(global).not.toMatch(columnasEnMaxWidth);
  });

  it('Dado el archivo variables.css Cuando se revisan los colores Entonces es el único que declara valores literales', () => {
    // Cubre: 9.1
    expect(variables).toMatch(/#[0-9a-fA-F]{3,8}/);
    expect(variables).toMatch(/rgba?\(/);
  });

  it('Dado global.css Cuando se buscan colores literales Entonces no declara ninguno fuera de variables.css', () => {
    // Cubre: 9.1
    expect(global).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(global).not.toMatch(/\brgba?\(/);
    expect(global).not.toMatch(/\bhsla?\(/);
  });

  it('Dado components.css Cuando se buscan colores literales Entonces no declara ninguno fuera de variables.css', () => {
    // Cubre: 9.1
    expect(componentes).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(componentes).not.toMatch(/\brgba?\(/);
    expect(componentes).not.toMatch(/\bhsla?\(/);
  });

  it('Dado un botón sobre --primary Cuando se lee su tipografía Entonces el texto blanco tiene tamaño >= 18 px o negrita', () => {
    // Cubre: 9.2, 9.3
    const bloque = bloqueTrasSelector(componentes, '.boton-primario,');
    // 1.125rem = 18px: satisface el umbral de contraste 3:1 para texto grande.
    expect(bloque).toMatch(/font-size:\s*1\.125rem/);
    expect(bloque).toMatch(/font-weight:\s*700/);
    const fondo = bloqueTrasSelector(componentes, '.boton-primario {');
    expect(fondo).toMatch(/background-color:\s*var\(--primary\)/);
    expect(fondo).toMatch(/color:\s*var\(--text-main\)/);
  });

  it('Dado el texto pequeño Cuando se colorea Entonces nunca usa var(--primary) como fondo con texto blanco', () => {
    // Cubre: 9.2
    // El texto pequeño de acento se apoya en var(--primary-deep) como fondo,
    // no en var(--primary), evitando el texto blanco sobre --primary a < 18 px.
    const etiqueta = bloqueTrasSelector(componentes, '.etiqueta-acento {');
    expect(etiqueta).toMatch(/font-size:\s*0\.875rem/);
    expect(etiqueta).not.toMatch(/background-color:\s*var\(--primary\)\s*;/);
    expect(etiqueta).toMatch(/color:\s*var\(--text-accent\)/);
  });

  it('Dado un bloque decorativo sin información Cuando se define su estilo Entonces existe una clase de bloque decorativo consumible por markup con aria-hidden', () => {
    // Cubre: 9.11
    expect(componentes).toMatch(/\.bloque-imagen\s*\{/);
    // La clase no aporta contenido textual: sólo dimensiones, borde y fondo por token.
    const bloque = bloqueTrasSelector(componentes, '.bloque-imagen {');
    expect(bloque).toMatch(/background-color:\s*var\(--bg-surface-elevated\)/);
    expect(bloque).not.toMatch(/content:/);
  });

  it('Dado el reset base Cuando se define .solo-lectores Entonces oculta contenido visualmente sin quitarlo del árbol accesible', () => {
    // Cubre: 9.11
    const bloque = bloqueTrasSelector(global, '.solo-lectores');
    expect(bloque).toMatch(/position:\s*absolute/);
    expect(bloque).toMatch(/width:\s*1px/);
    expect(bloque).toMatch(/height:\s*1px/);
    expect(bloque).toMatch(/overflow:\s*hidden/);
  });

  it('Dado cualquier ancho Cuando se renderiza el cuerpo Entonces impide el desplazamiento horizontal', () => {
    // Cubre: 9.4, 9.5
    const bloque = bloqueTrasSelector(global, 'body');
    expect(bloque).toMatch(/overflow-x:\s*hidden/);
  });
});
