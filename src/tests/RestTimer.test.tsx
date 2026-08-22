import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import React from 'react';
import RestTimer from '../components/app/RestTimer';

describe('Componente RestTimer (Temporizador de Descanso)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renderiza el tiempo inicial formateado correctamente (ej. 90s -> 01:30)', () => {
    render(<RestTimer initialSeconds={90} onComplete={() => {}} onClose={() => {}} />);
    expect(screen.getByText('01:30')).toBeInTheDocument();
  });

  it('descuenta los segundos cronológicamente cuando está activo', () => {
    render(<RestTimer initialSeconds={60} onComplete={() => {}} onClose={() => {}} />);
    
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(screen.getByText('00:58')).toBeInTheDocument();
  });

  it('agrega 30 segundos al presionar el botón +30s', () => {
    render(<RestTimer initialSeconds={60} onComplete={() => {}} onClose={() => {}} />);
    
    const botonSumar = screen.getByRole('button', { name: /\+30s/i });
    fireEvent.click(botonSumar);

    expect(screen.getByText('01:30')).toBeInTheDocument();
  });

  it('pausa y reanuda la cuenta regresiva al hacer clic en el botón de alternancia', () => {
    render(<RestTimer initialSeconds={60} onComplete={() => {}} onClose={() => {}} />);
    
    const botonPausar = screen.getByRole('button', { name: /pausar/i });
    fireEvent.click(botonPausar);

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    // Debe permanecer en 60 al estar en pausa
    expect(screen.getByText('01:00')).toBeInTheDocument();

    const botonReanudar = screen.getByRole('button', { name: /continuar|reanudar/i });
    fireEvent.click(botonReanudar);

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(screen.getByText('00:58')).toBeInTheDocument();
  });

  it('ejecuta la función onComplete cuando el temporizador llega a cero', () => {
    const fnCompletarMock = vi.fn();
    render(<RestTimer initialSeconds={3} onComplete={fnCompletarMock} onClose={() => {}} />);
    
    act(() => {
      vi.advanceTimersByTime(4000);
    });

    expect(fnCompletarMock).toHaveBeenCalled();
  });
});
