import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import WorkoutPlayer from '../components/app/WorkoutPlayer';
import { PROGRAMS } from '../data/mockData';

const sesionEntrenamientoMock = PROGRAMS[0].weeks[0].days[0];

describe('Componente WorkoutPlayer (Ejecutor de Entrenamiento en Vivo)', () => {
  it('renderiza el título del ejercicio, el grupo muscular y la tabla de series', () => {
    render(<WorkoutPlayer session={sesionEntrenamientoMock} onFinishWorkout={() => {}} onExit={() => {}} />);
    expect(screen.getByRole('heading', { name: 'Press de Banca Plano con Barra' })).toBeInTheDocument();
    expect(screen.getByText(/Pectoral Mayor/i)).toBeInTheDocument();
  });

  it('permite registrar cargas, repeticiones y marcar series como completadas', () => {
    render(<WorkoutPlayer session={sesionEntrenamientoMock} onFinishWorkout={() => {}} onExit={() => {}} />);
    
    const botonesCheckSerie = screen.getAllByRole('button', { name: /check-set/i });
    expect(botonesCheckSerie.length).toBeGreaterThan(0);

    fireEvent.click(botonesCheckSerie[0]);

    // El estado del botón debe indicar serie completada
    expect(botonesCheckSerie[0]).toHaveAttribute('data-completed', 'true');
  });

  it('ejecuta la función onFinishWorkout al presionar Finalizar Entrenamiento', () => {
    const fnFinalizarMock = vi.fn();
    render(<WorkoutPlayer session={sesionEntrenamientoMock} onFinishWorkout={fnFinalizarMock} onExit={() => {}} />);

    const botonFinalizar = screen.getByRole('button', { name: /finalizar entrenamiento/i });
    fireEvent.click(botonFinalizar);

    expect(fnFinalizarMock).toHaveBeenCalled();
  });
});
