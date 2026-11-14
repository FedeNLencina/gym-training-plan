import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// jsdom no implementa el desplazamiento de la ventana.
Object.defineProperty(window, 'scrollTo', { value: (): void => {}, writable: true });

// Limpieza del árbol renderizado y de los datos guardados entre tests, para
// que ninguna prueba observe restos de la anterior.
afterEach(() => {
  cleanup();
  localStorage.clear();
});
