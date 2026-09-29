import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Limpieza del árbol renderizado entre tests para que ninguna prueba
// observe restos del DOM de la anterior.
afterEach(() => {
  cleanup();
});
