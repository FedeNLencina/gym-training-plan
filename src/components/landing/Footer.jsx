import React from 'react';
import { Dumbbell, MessageSquare, ArrowUp, Share2 } from 'lucide-react';
import { TRAINER_INFO } from '../../data/mockData';

export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-top">
          <div className="navbar-brand">
            <div className="brand-icon">
              <Dumbbell size={20} className="text-white" />
            </div>
            <span>
              ATLAS <span className="brand-name-highlight">TRAINING</span>
            </span>
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              type="button"
              onClick={scrollToTop}
              className="btn-secondary"
              style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
              aria-label="Volver arriba"
            >
              <ArrowUp size={16} /> Volver Arriba
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <p className="footer-copy">
            © {new Date().getFullYear()} {TRAINER_INFO.gymName}. Todos los derechos reservados.
          </p>

          <p style={{ fontSize: '0.8rem', color: 'var(--text-dimmed)' }}>
            Diseñado para atletas y entusiastas de la fuerza.
          </p>
        </div>
      </div>
    </footer>
  );
}
