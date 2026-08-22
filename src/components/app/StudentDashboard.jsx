import React from 'react';
import { Flame, Play, Trophy, Calendar, Dumbbell, Sparkles, CheckCircle2, ChevronRight } from 'lucide-react';
import { INITIAL_USER_STATE, PROGRAMS } from '../../data/mockData';

export default function StudentDashboard({ onStartWorkout, onExplorePrograms }) {
  const user = INITIAL_USER_STATE;
  const activeProgram = PROGRAMS.find((p) => p.id === user.activeProgramId) || PROGRAMS[0];
  const todaySession = activeProgram.weeks[0]?.days[0] || null;

  return (
    <div className="container app-view-container">
      {/* User Welcome Row */}
      <div className="app-dashboard-header">
        <div className="user-welcome-row">
          <div className="user-avatar-badge">
            <img src={user.avatar} alt={user.name} className="user-avatar-img" />
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--primary-vibrant)', fontWeight: 700, textTransform: 'uppercase' }}>
                Atleta Atlas
              </span>
              <h2 style={{ fontSize: '1.8rem', color: '#ffffff' }}>¡Hola, {user.name}!</h2>
            </div>
          </div>

          <div className="streak-counter-pill">
            <Flame size={20} className="animate-bounce" />
            <span>{user.streakDays} Días de Racha Activa</span>
          </div>
        </div>
      </div>

      <div className="app-dashboard-grid">
        {/* Left Column: Today's Workout Card */}
        <div>
          {todaySession ? (
            <div className="today-workout-hero-card card-glass">
              <div className="today-workout-bg-glow" />
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <span className="badge">
                  <Sparkles size={14} /> Rutina Sugerida para Hoy
                </span>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  {todaySession.estimatedDuration}
                </span>
              </div>

              <h3 style={{ fontSize: '1.8rem', color: '#ffffff', marginBottom: '0.4rem' }}>
                {todaySession.title}
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                Programa: <strong style={{ color: '#ffffff' }}>{activeProgram.title}</strong> (Semana {user.currentWeek})
              </p>

              {/* Exercises Preview List */}
              <div className="today-exercises-preview">
                {todaySession.exercises.map((ex, idx) => (
                  <div key={ex.id} className="exercise-preview-item">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                      <span style={{ fontWeight: 800, color: 'var(--primary-vibrant)', width: '20px' }}>
                        {idx + 1}
                      </span>
                      <div>
                        <strong style={{ color: '#ffffff' }}>{ex.name}</strong>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          {ex.suggestedSets} series × {ex.suggestedReps} reps
                        </div>
                      </div>
                    </div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-dimmed)' }}>{ex.muscle}</span>
                  </div>
                ))}
              </div>

              <button
                type="button"
                className="btn-primary"
                style={{ width: '100%', padding: '1rem', fontSize: '1.05rem' }}
                onClick={() => onStartWorkout(todaySession)}
              >
                <Play size={20} fill="#ffffff" />
                <span>Comenzar Entrenamiento de Hoy</span>
              </button>
            </div>
          ) : null}
        </div>

        {/* Right Column: PRs and Progress */}
        <div>
          <div className="prs-widget card-glass">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <Trophy size={20} className="text-primary-vibrant" />
              <h3 style={{ fontSize: '1.15rem', color: '#ffffff' }}>Marcas Personales (PRs)</h3>
            </div>

            <div className="prs-list">
              {user.recentPRs.map((pr, idx) => (
                <div key={idx} className="pr-item">
                  <div>
                    <div style={{ fontWeight: 700, color: '#ffffff', fontSize: '0.9rem' }}>
                      {pr.exercise}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dimmed)' }}>
                      {pr.date}
                    </div>
                  </div>
                  <div className="pr-weight">{pr.weight}</div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '2rem', paddingTop: '1.2rem', borderTop: '1px solid var(--border-subtle)' }}>
              <button
                type="button"
                className="btn-secondary"
                style={{ width: '100%', justifyContent: 'space-between', fontSize: '0.85rem' }}
                onClick={onExplorePrograms}
              >
                <span>Explorar Todos los Programas</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
