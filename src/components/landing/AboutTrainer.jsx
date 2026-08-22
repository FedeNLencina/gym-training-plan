import React from 'react';
import { CheckCircle2, Award, Shield } from 'lucide-react';
import { TRAINER_INFO } from '../../data/mockData';

export default function AboutTrainer() {
  return (
    <section id="entrenador" className="section-about">
      <div className="container">
        <div className="about-grid">
          {/* Left Column: Image with floating badge */}
          <div className="about-image-column">
            <div className="about-image-wrapper">
              <img
                src="https://images.unsplash.com/photo-1567013127542-490d757e51fc?q=80&w=800&auto=format&fit=crop"
                alt={TRAINER_INFO.name}
                className="about-img"
              />
              <div className="about-image-floating-badge">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <Award size={22} className="text-primary-vibrant" />
                  <div>
                    <h4 style={{ fontSize: '1rem', color: '#ffffff' }}>{TRAINER_INFO.name}</h4>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{TRAINER_INFO.role}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Bio and Amenities */}
          <div className="about-text-column">
            <div className="badge mb-3">
              <Shield size={14} /> El Entrenador & Las Instalaciones
            </div>

            <h2>
              No es solo una rutina. <br />
              <span className="text-gradient-red">Es un estándar de vida.</span>
            </h2>

            <p className="about-bio-lead">
              "{TRAINER_INFO.bio}"
            </p>

            <p className="about-bio-text text-muted">
              En nuestro centro de entrenamiento de Almagro y a través de la app digital, eliminamos la incertidumbre de tus sesiones con planificación seria, biomecánica segura y progresión medible.
            </p>

            <h4 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: '#ffffff' }}>
              Instalaciones de Atlas Gym:
            </h4>

            <div className="amenities-list">
              {TRAINER_INFO.gymDetails.amenities.map((amenity, idx) => (
                <div key={idx} className="amenity-item">
                  <CheckCircle2 size={16} className="text-primary-vibrant" />
                  <span>{amenity}</span>
                </div>
              ))}
            </div>

            <a href="#planes" className="btn-primary">
              <span>Conocer Membresías</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
