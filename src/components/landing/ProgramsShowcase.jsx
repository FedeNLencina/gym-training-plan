import React, { useState } from 'react';
import { Clock, Dumbbell, Flame, CheckCircle, ArrowRight } from 'lucide-react';

export default function ProgramsShowcase({ programs = [], onSelectProgram }) {
  const [selectedCategory, setSelectedCategory] = useState('Todos');

  const categories = ['Todos', 'Fuerza', 'Calistenia', 'Movilidad', 'Resistencia'];

  const filteredPrograms = programs.filter((prog) => {
    if (selectedCategory === 'Todos') return true;
    if (selectedCategory === 'Fuerza') return prog.category.toLowerCase().includes('fuerza');
    if (selectedCategory === 'Calistenia') return prog.category.toLowerCase().includes('calistenia');
    if (selectedCategory === 'Movilidad') return prog.category.toLowerCase().includes('movilidad');
    if (selectedCategory === 'Resistencia') return prog.category.toLowerCase().includes('resistencia');
    return true;
  });

  return (
    <section id="programas" className="section-programs">
      <div className="container">
        <div className="section-header text-center">
          <div className="badge mb-3">
            <Flame size={14} /> Programas de Élite
          </div>
          <h2>
            Sistemas Estructurados para <span className="text-gradient-red">Resultados Reales</span>
          </h2>
          <p className="section-subtitle">
            Cada programa está periodizado semana a semana con progresiones claras, videos demostrativos y registro de cargas.
          </p>

          {/* Filtros de Categoría */}
          <div className="filter-pills-wrapper">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                className={`filter-pill ${selectedCategory === cat ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Grid de Programas */}
        <div className="programs-grid">
          {filteredPrograms.map((prog) => (
            <div key={prog.id} className="program-card card-glass">
              <div className="program-card-image-wrapper">
                <img src={prog.image} alt={prog.title} className="program-card-img" />
                <div className="program-card-badge-top">
                  <span>{prog.durationWeeks} Semanas</span>
                </div>
                <div className="program-card-overlay" />
              </div>

              <div className="program-card-content">
                <div className="program-tags">
                  {prog.tags.slice(0, 3).map((tag, idx) => (
                    <span key={idx} className="program-tag-item">
                      {tag}
                    </span>
                  ))}
                </div>

                <h3 className="program-card-title">{prog.title}</h3>
                <p className="program-card-desc">{prog.shortDescription}</p>

                <div className="program-meta-info">
                  <div className="meta-item">
                    <Clock size={15} />
                    <span>{prog.frequency}</span>
                  </div>
                  <div className="meta-item">
                    <Dumbbell size={15} />
                    <span>{prog.level}</span>
                  </div>
                </div>

                <button
                  type="button"
                  className="btn-program-action"
                  onClick={() => onSelectProgram && onSelectProgram(prog.id)}
                >
                  <span>Ver Programa & Rutinas</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
