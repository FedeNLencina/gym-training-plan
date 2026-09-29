/**
 * Tests de la jerarquía de errores de dominio.
 *
 * Cubre: 8.7, 8.14
 */

import { describe, it, expect } from 'vitest';

import {
  ErrorAlmacenamiento,
  ErrorCarga,
  ErrorCorreoRegistrado,
  ErrorCredenciales,
  ErrorDominio,
  ErrorEspacioInsuficiente,
  ErrorValidacion,
  ErrorVideoAusente,
  esErrorDominio,
} from './errores';

describe('ErrorValidacion', () => {
  it('Dado un mapa de campos inválidos Cuando se crea ErrorValidacion Entonces expone los campos y su nombre', () => {
    const error = new ErrorValidacion({ titulo: 'El título es obligatorio' });
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(ErrorDominio);
    expect(error.nombre).toBe('ErrorValidacion');
    expect(error.name).toBe('ErrorValidacion');
    expect(error.campos).toEqual({ titulo: 'El título es obligatorio' });
  });

  it('Dado ningún campo Cuando se crea ErrorValidacion Entonces el mapa de campos está vacío', () => {
    const error = new ErrorValidacion();
    expect(error.campos).toEqual({});
    expect(error.message).not.toBe('');
  });

  it('Dado un ErrorValidacion Cuando se intenta mutar sus campos Entonces permanecen inalterados', () => {
    const error = new ErrorValidacion({ correo: 'Correo inválido' });
    expect(Object.isFrozen(error.campos)).toBe(true);
  });
});

describe('errores de dominio con nombre', () => {
  const casos = [
    { Clase: ErrorCorreoRegistrado, nombre: 'ErrorCorreoRegistrado' },
    { Clase: ErrorCredenciales, nombre: 'ErrorCredenciales' },
    { Clase: ErrorAlmacenamiento, nombre: 'ErrorAlmacenamiento' },
    { Clase: ErrorEspacioInsuficiente, nombre: 'ErrorEspacioInsuficiente' },
    { Clase: ErrorVideoAusente, nombre: 'ErrorVideoAusente' },
    { Clase: ErrorCarga, nombre: 'ErrorCarga' },
  ] as const;

  it.each(casos)(
    'Dado $nombre Cuando se instancia Entonces es un error de dominio con ese nombre y mensaje propio',
    ({ Clase, nombre }) => {
      const error = new Clase();
      expect(error).toBeInstanceOf(ErrorDominio);
      expect(error).toBeInstanceOf(Clase);
      expect(error.nombre).toBe(nombre);
      expect(error.name).toBe(nombre);
      expect(error.message).not.toBe('');
      expect(esErrorDominio(error)).toBe(true);
    },
  );

  it('Dado un mensaje propio Cuando se instancia un error de dominio Entonces conserva ese mensaje', () => {
    const error = new ErrorCarga('Venció el plazo de lectura');
    expect(error.message).toBe('Venció el plazo de lectura');
  });

  it('Dado un error ajeno al dominio Cuando se consulta esErrorDominio Entonces devuelve falso', () => {
    expect(esErrorDominio(new Error('cualquiera'))).toBe(false);
    expect(esErrorDominio(null)).toBe(false);
    expect(esErrorDominio('ErrorCarga')).toBe(false);
  });

  it('Dado un ErrorEspacioInsuficiente Cuando se compara con ErrorAlmacenamiento Entonces es una especialización suya', () => {
    expect(new ErrorEspacioInsuficiente()).toBeInstanceOf(ErrorAlmacenamiento);
  });
});
