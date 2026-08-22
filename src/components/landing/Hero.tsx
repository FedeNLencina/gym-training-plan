import React from 'react';
import { ArrowRight, Flame, PlayCircle } from 'lucide-react';
import { TRAINER_INFO } from '../../data/mockData';
import { TrainerStat } from '../../types';

interface HeroProps {
  onExplorePrograms: () => void;
  onTryApp: () => void;
}

export default function Hero({ onExplorePrograms, onTryApp }: HeroProps) {
  return (
    <section id="inicio" className="section-hero">
      <div className="hero-bg-glow" />
      <div className="container hero-content">
        <div className="hero-tag-badge">
          <Flame size={15} /> {TRAINER_INFO.tagline}
        </div>

        <h1 className="hero-title">
          Entrena con Fuerza. <br />
          <span className="text-gradient-red">Construye tu Mejor Versión.</span>
        </h1>

        <p className="hero-subtext">
          {TRAINER_INFO.subheadline}
        </p>

        <div className="hero-cta-group">
          <button
            type="button"
            className="btn-primary"
            onClick={onTryApp}
          >
            <span>Probar la App Gratis</span>
            <ArrowRight size={18} />
          </button>

          <button
            type="button"
            className="btn-secondary"
            onClick={onExplorePrograms}
          >
            <PlayCircle size={18} />
            <span>Ver Programas</span>
          </button>
        </div>

        {/* Stats Grid */}
        <div className="hero-stats-grid">
          {TRAINER_INFO.stats.map((stat: TrainerStat, idx: number) => (
            <div key={idx} className="stat-item">
              <span className="stat-value">{stat.value}</span>
              <span className="stat-label">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
