import React from 'react';
import { Video, Dumbbell, Timer, Flame, Smartphone, Users, Sparkles } from 'lucide-react';
import { APP_FEATURES } from '../../data/mockData';

const iconMap = {
  Video: Video,
  Dumbbell: Dumbbell,
  Timer: Timer,
  Flame: Flame,
  Smartphone: Smartphone,
  Users: Users
};

export default function AppFeatures({ onTryApp }) {
  return (
    <section id="app-features" className="section-features">
      <div className="container">
        <div className="section-header text-center">
          <div className="badge mb-3">
            <Sparkles size={14} /> Tecnología & Rendimiento
          </div>
          <h2>
            La App Diseñada para <span className="text-gradient-red">Entrenar en Serio</span>
          </h2>
          <p className="section-subtitle">
            Todo lo que necesitas para registrar tus pesos, ver la técnica perfecta y mantener la disciplina en un solo lugar.
          </p>
        </div>

        <div className="features-grid">
          {APP_FEATURES.map((feat) => {
            const IconComponent = iconMap[feat.icon] || Dumbbell;
            return (
              <div key={feat.id} className="feature-card card-glass">
                <div className="feature-icon-wrapper">
                  <IconComponent size={24} />
                </div>
                <h3 className="feature-title">{feat.title}</h3>
                <p className="feature-desc">{feat.description}</p>
              </div>
            );
          })}
        </div>

        <div style={{ textAlign: 'center', marginTop: '3.5rem' }}>
          <button
            type="button"
            className="btn-primary"
            onClick={onTryApp}
          >
            <span>Entrar al Simulador de la App</span>
          </button>
        </div>
      </div>
    </section>
  );
}
