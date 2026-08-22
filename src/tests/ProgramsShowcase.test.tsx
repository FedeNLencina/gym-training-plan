import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import ProgramsShowcase from '../components/landing/ProgramsShowcase';
import { PROGRAMS } from '../data/mockData';

describe('Componente ProgramsShowcase (Catálogo de Programas)', () => {
  it('renderiza todos los programas en la carga inicial', () => {
    render(<ProgramsShowcase programs={PROGRAMS} onSelectProgram={() => {}} />);
    expect(screen.getByText('Atlas Hybrid Strength')).toBeInTheDocument();
    expect(screen.getByText('Mastery Calistenia & Pull Up')).toBeInTheDocument();
  });

  it('filtra los programas al seleccionar una categoría específica', () => {
    render(<ProgramsShowcase programs={PROGRAMS} onSelectProgram={() => {}} />);
    
    const filtroCalistenia = screen.getByRole('button', { name: /calistenia/i });
    fireEvent.click(filtroCalistenia);

    expect(screen.getByText('Mastery Calistenia & Pull Up')).toBeInTheDocument();
    expect(screen.queryByText('Atlas Hybrid Strength')).not.toBeInTheDocument();
  });

  it('ejecuta la función onSelectProgram con el ID correspondiente al presionar Ver Programa', () => {
    const fnSeleccionarMock = vi.fn();
    render(<ProgramsShowcase programs={PROGRAMS} onSelectProgram={fnSeleccionarMock} />);
    
    const botonesVer = screen.getAllByRole('button', { name: /ver programa|entrenar/i });
    fireEvent.click(botonesVer[0]);

    expect(fnSeleccionarMock).toHaveBeenCalledWith('atlas-hybrid-strength');
  });
});
