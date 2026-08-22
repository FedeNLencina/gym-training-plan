import React from 'react';
import { Star, Trophy, Quote } from 'lucide-react';
import { TRANSFORMATIONS, TESTIMONIALS } from '../../data/mockData';

export default function Transformations() {
  return (
    <section id="testimonios" className="section-transformations">
      <div className="container">
        <div className="section-header text-center">
          <div className="badge mb-3">
            <Trophy size={14} /> Resultados Comprobados
          </div>
          <h2>
            Transformaciones Reales de <span className="text-gradient-red">Nuestra Comunidad</span>
          </h2>
          <p className="section-subtitle">
            El trabajo duro no miente. Mira lo que nuestros alumnos logran con constancia y el método Atlas.
          </p>
        </div>

        {/* Transformations Cards */}
        <div className="transformations-grid">
          {TRANSFORMATIONS.map((trans, idx) => (
            <div key={idx} className="trans-card">
              <img src={trans.image} alt={trans.name} className="trans-img" />
              <div className="trans-info-overlay">
                <h4 className="trans-name">{trans.name}</h4>
                <p className="trans-result">{trans.result}</p>
                <span style={{ fontSize: '0.78rem', color: '#ffffff', opacity: 0.8 }}>
                  Tiempo: {trans.duration}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Testimonials Reviews Grid */}
        <div className="testimonials-grid">
          {TESTIMONIALS.map((testi, idx) => (
            <div key={idx} className="testimonial-card card-glass">
              <div>
                <div style={{ display: 'flex', gap: '3px', marginBottom: '1rem' }}>
                  {Array.from({ length: testi.rating }).map((_, s) => (
                    <Star key={s} size={16} fill="var(--primary-vibrant)" color="var(--primary-vibrant)" />
                  ))}
                </div>
                <p className="testimonial-quote">"{testi.quote}"</p>
              </div>

              <div className="testimonial-author">
                <img src={testi.avatar} alt={testi.name} className="author-avatar" />
                <div>
                  <div className="author-name">{testi.name}</div>
                  <div className="author-role">{testi.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
