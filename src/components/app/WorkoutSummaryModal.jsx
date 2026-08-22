import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, CheckCircle2, Dumbbell, Flame, ArrowRight } from 'lucide-react';

export default function WorkoutSummaryModal({ summaryData, onClose }) {
  useEffect(() => {
    // Trigger celebratory confetti
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#EF1818', '#FB2C36', '#DC2626', '#FFFFFF', '#000000']
      });
    } catch (e) {
      // safe fallback
    }
  }, []);

  if (!summaryData) return null;

  return (
    <div className="modal-backdrop">
      <div className="card-glass" style={{ maxWidth: '500px', width: '100%', padding: '2.5rem', textAlign: 'center' }}>
        <div style={{
          width: '70px',
          height: '70px',
          borderRadius: 'var(--radius-full)',
          background: 'var(--primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.5rem',
          boxShadow: 'var(--shadow-glow-lg)'
        }}>
          <Trophy size={36} color="#ffffff" />
        </div>

        <div className="badge mb-2">
          <CheckCircle2 size={14} /> ¡Sesión Cumplida!
        </div>

        <h2 style={{ fontSize: '1.8rem', color: '#ffffff', marginBottom: '0.5rem' }}>
          ¡Excelente Trabajo!
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '2rem' }}>
          {summaryData.sessionTitle}
        </p>

        {/* Stats Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '1rem',
          marginBottom: '2rem'
        }}>
          <div style={{
            background: 'rgba(0,0,0,0.5)',
            padding: '1.2rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)'
          }}>
            <span style={{ display: 'block', fontSize: '1.8rem', fontWeight: 900, color: '#ffffff' }}>
              {summaryData.completedSetsCount}
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
              Series Completadas
            </span>
          </div>

          <div style={{
            background: 'rgba(0,0,0,0.5)',
            padding: '1.2rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)'
          }}>
            <span style={{ display: 'block', fontSize: '1.8rem', fontWeight: 900, color: 'var(--primary-vibrant)' }}>
              {summaryData.totalKg.toLocaleString()} kg
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
              Volumen Total
            </span>
          </div>
        </div>

        <button
          type="button"
          className="btn-primary"
          style={{ width: '100%' }}
          onClick={onClose}
        >
          <span>Guardar y Volver al Dashboard</span>
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}
