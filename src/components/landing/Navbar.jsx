import React from 'react';
import { Dumbbell, Smartphone, User, Globe } from 'lucide-react';

export default function Navbar({ currentView, onToggleView, onStartWorkout }) {
  return (
    <header className="navbar">
      <div className="container navbar-container">
        <a href="#inicio" className="navbar-brand" onClick={() => onToggleView('landing')}>
          <div className="brand-icon">
            <Dumbbell size={22} className="text-white" />
          </div>
          <span>
            ATLAS <span className="brand-name-highlight">TRAINING</span>
          </span>
        </a>

        <nav>
          <ul className="navbar-links">
            <li>
              <a href="#inicio" className="nav-link">Inicio</a>
            </li>
            <li>
              <a href="#programas" className="nav-link">Programas</a>
            </li>
            <li>
              <a href="#entrenador" className="nav-link">El Coach</a>
            </li>
            <li>
              <a href="#app-features" className="nav-link">La App</a>
            </li>
            <li>
              <a href="#planes" className="nav-link">Planes & Gym</a>
            </li>
            <li>
              <a href="#ubicacion" className="nav-link">Ubicación</a>
            </li>
          </ul>
        </nav>

        <div className="navbar-actions">
          {currentView === 'landing' ? (
            <button
              type="button"
              className="btn-view-toggle"
              onClick={() => onToggleView('app')}
            >
              <Smartphone size={16} />
              <span>📱 Vista Alumno</span>
            </button>
          ) : (
            <button
              type="button"
              className="btn-view-toggle"
              onClick={() => onToggleView('landing')}
            >
              <Globe size={16} />
              <span>🌐 Vista Landing</span>
            </button>
          )}

          <button
            type="button"
            className="btn-primary"
            style={{ padding: '0.55rem 1.2rem', fontSize: '0.85rem' }}
            onClick={onStartWorkout}
          >
            <span>Iniciar Rutina</span>
          </button>
        </div>
      </div>
    </header>
  );
}
