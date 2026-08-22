import React from 'react';
import { MapPin, Clock, MessageSquare, ShieldCheck, Share2 } from 'lucide-react';
import { TRAINER_INFO } from '../../data/mockData';

export default function GymLocation() {
  const { gymDetails } = TRAINER_INFO;

  const whatsappMessage = encodeURIComponent(
    "¡Hola Franco! Vi la web de Atlas Gym y me gustaría consultar por los planes de entrenamiento."
  );
  const whatsappUrl = `https://wa.me/5491155558899?text=${whatsappMessage}`;

  return (
    <section id="ubicacion" className="section-location">
      <div className="container">
        <div className="location-grid">
          {/* Info Card */}
          <div className="location-info-card card-glass">
            <div className="badge mb-3">
              <MapPin size={14} /> Sede Presencial & Contacto
            </div>

            <h2>
              Visítanos en <span className="text-gradient-red">Atlas Gym</span>
            </h2>

            <p style={{ margin: '1rem 0 2rem' }}>
              Ubicados estratégicamente en la Ciudad de Buenos Aires con equipamiento de primer nivel para fuerza, potencia y calistenia.
            </p>

            <div className="contact-item">
              <div className="contact-icon">
                <MapPin size={20} />
              </div>
              <div>
                <div className="contact-label">Dirección</div>
                <div className="contact-val">{gymDetails.address}</div>
              </div>
            </div>

            <div className="contact-item">
              <div className="contact-icon">
                <Clock size={20} />
              </div>
              <div>
                <div className="contact-label">Horarios de Atención</div>
                <div className="contact-val">{gymDetails.hours}</div>
              </div>
            </div>

            <div className="contact-item">
              <div className="contact-icon">
                <MessageSquare size={20} />
              </div>
              <div>
                <div className="contact-label">WhatsApp Directo</div>
                <div className="contact-val">{gymDetails.whatsapp}</div>
              </div>
            </div>

            <div style={{ marginTop: '2.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary"
              >
                <MessageSquare size={18} />
                <span>Escribir por WhatsApp</span>
              </a>

              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary"
              >
                <Share2 size={18} />
                <span>{gymDetails.instagram}</span>
              </a>
            </div>
          </div>

          {/* Gym Facility / Map Image */}
          <div className="location-map-preview">
            <img
              src="https://images.unsplash.com/photo-1540497077202-7c8a3999166f?q=80&w=1000&auto=format&fit=crop"
              alt="Instalaciones de Atlas Gym"
              className="location-map-img"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
