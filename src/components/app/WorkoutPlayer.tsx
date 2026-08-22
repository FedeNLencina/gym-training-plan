import React, { useState } from 'react';
import { ArrowLeft, Check, Play, Info, Trophy, Sparkles } from 'lucide-react';
import RestTimer from './RestTimer';
import { DaySession, Exercise, SetLog, WorkoutSummary } from '../../types';

interface WorkoutPlayerProps {
  session: DaySession;
  onFinishWorkout?: (summary: WorkoutSummary) => void;
  onExit?: () => void;
}

export default function WorkoutPlayer({ session, onFinishWorkout, onExit }: WorkoutPlayerProps) {
  const [activeExerciseIndex, setActiveExerciseIndex] = useState<number>(0);
  const [showRestTimer, setShowRestTimer] = useState<boolean>(false);
  const [restSeconds, setRestSeconds] = useState<number>(90);
  const [showVideoModal, setShowVideoModal] = useState<boolean>(false);

  const [logs, setLogs] = useState<Record<string, SetLog[]>>(() => {
    const initial: Record<string, SetLog[]> = {};
    session.exercises.forEach((ex: Exercise) => {
      initial[ex.id] = Array.from({ length: ex.suggestedSets }, (_, i) => ({
        setNumber: i + 1,
        weight: ex.defaultWeight || 0,
        reps: ex.suggestedReps.split('-')[0] || '8',
        completed: false
      }));
    });
    return initial;
  });

  const activeExercise: Exercise = session.exercises[activeExerciseIndex] || session.exercises[0];

  const handleUpdateLog = (exId: string, setIndex: number, field: 'weight' | 'reps', value: string | number) => {
    setLogs((prev) => {
      const exerciseLogs = [...(prev[exId] || [])];
      exerciseLogs[setIndex] = {
        ...exerciseLogs[setIndex],
        [field]: value
      };
      return { ...prev, [exId]: exerciseLogs };
    });
  };

  const handleToggleCompleteSet = (exId: string, setIndex: number) => {
    setLogs((prev) => {
      const exerciseLogs = [...(prev[exId] || [])];
      const isNowCompleted = !exerciseLogs[setIndex].completed;
      exerciseLogs[setIndex] = {
        ...exerciseLogs[setIndex],
        completed: isNowCompleted
      };
      
      if (isNowCompleted) {
        setRestSeconds(activeExercise.suggestedRestSeconds || 90);
        setShowRestTimer(true);
      }

      return { ...prev, [exId]: exerciseLogs };
    });
  };

  const calculateTotalVolume = () => {
    let totalKg = 0;
    let completedSetsCount = 0;
    Object.values(logs).forEach((setArray) => {
      setArray.forEach((set) => {
        if (set.completed) {
          totalKg += (Number(set.weight) || 0) * (Number(set.reps) || 0);
          completedSetsCount += 1;
        }
      });
    });
    return { totalKg, completedSetsCount };
  };

  const handleFinish = () => {
    const summary = calculateTotalVolume();
    if (onFinishWorkout) {
      onFinishWorkout({
        sessionTitle: session.title,
        ...summary,
        logs
      });
    }
  };

  const currentExerciseLogs = logs[activeExercise.id] || [];

  return (
    <div className="workout-player-container">
      {/* Header Bar */}
      <div className="workout-player-header card-glass">
        <button
          type="button"
          onClick={onExit}
          className="btn-workout-back"
          aria-label="Volver"
        >
          <ArrowLeft size={18} />
          <span>Salir</span>
        </button>

        <div className="workout-header-center">
          <span className="badge-live-session">Sesión en Curso</span>
          <h2 className="workout-session-title">{session.title}</h2>
        </div>

        <button
          type="button"
          onClick={handleFinish}
          className="btn-finish-workout"
        >
          <Trophy size={16} />
          <span>Finalizar Entrenamiento</span>
        </button>
      </div>

      <div className="workout-player-layout">
        {/* Left Column: Exercise Stepper & Active Card */}
        <div className="workout-player-main">
          {/* Stepper de ejercicios */}
          <div className="exercise-stepper-list">
            {session.exercises.map((ex: Exercise, idx: number) => {
              const isCurrent = idx === activeExerciseIndex;
              const allSetsCompleted = (logs[ex.id] || []).every((s) => s.completed);
              return (
                <button
                  key={ex.id}
                  type="button"
                  onClick={() => setActiveExerciseIndex(idx)}
                  className={`exercise-stepper-tab ${isCurrent ? 'active' : ''} ${allSetsCompleted ? 'completed' : ''}`}
                >
                  <span className="stepper-num">{idx + 1}</span>
                  <span className="stepper-name">{ex.name}</span>
                  {allSetsCompleted && <Check size={14} className="text-primary-vibrant" />}
                </button>
              );
            })}
          </div>

          {/* Active Exercise Detail Card */}
          <div className="active-exercise-card card-glass">
            <div className="exercise-card-top">
              <div className="exercise-info-text">
                <span className="badge-muscle">{activeExercise.muscle}</span>
                <h3 className="active-exercise-name">{activeExercise.name}</h3>
                <p className="exercise-equipment">Equipo: {activeExercise.equipment}</p>
              </div>

              <div className="exercise-card-media-preview">
                <img src={activeExercise.thumbnail} alt={activeExercise.name} className="exercise-thumb-img" />
                <button
                  type="button"
                  onClick={() => setShowVideoModal(true)}
                  className="btn-play-guide"
                  aria-label="Ver video de técnica"
                >
                  <Play size={20} fill="#ffffff" />
                </button>
              </div>
            </div>

            {/* Technical Tip Box */}
            <div className="exercise-tip-box">
              <Info size={18} className="tip-icon" />
              <div className="tip-text">
                <strong>Clave biomecánica:</strong> {activeExercise.tips}
              </div>
            </div>

            {/* Sets Logging Table */}
            <div className="sets-table-wrapper">
              <div className="sets-table-header">
                <span>SERIE</span>
                <span>PESO (KG)</span>
                <span>REPS</span>
                <span>ESTADO</span>
              </div>

              <div className="sets-rows">
                {currentExerciseLogs.map((set: SetLog, setIndex: number) => (
                  <div
                    key={set.setNumber}
                    className={`set-row ${set.completed ? 'set-completed' : ''}`}
                  >
                    <div className="set-cell-num">{set.setNumber}</div>

                    <div className="set-cell-input">
                      <input
                        type="number"
                        value={set.weight}
                        onChange={(e) =>
                          handleUpdateLog(activeExercise.id, setIndex, 'weight', e.target.value)
                        }
                        className="set-input"
                        placeholder="Kg"
                        aria-label={`Peso serie ${set.setNumber}`}
                      />
                    </div>

                    <div className="set-cell-input">
                      <input
                        type="text"
                        value={set.reps}
                        onChange={(e) =>
                          handleUpdateLog(activeExercise.id, setIndex, 'reps', e.target.value)
                        }
                        className="set-input"
                        placeholder="Reps"
                        aria-label={`Reps serie ${set.setNumber}`}
                      />
                    </div>

                    <div className="set-cell-action">
                      <button
                        type="button"
                        onClick={() => handleToggleCompleteSet(activeExercise.id, setIndex)}
                        className={`btn-check-set ${set.completed ? 'completed' : ''}`}
                        aria-label={`check-set serie ${set.setNumber}`}
                        data-completed={set.completed ? 'true' : 'false'}
                      >
                        <Check size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Exercise Navigation Footer */}
            <div className="exercise-nav-footer">
              <button
                type="button"
                disabled={activeExerciseIndex === 0}
                onClick={() => setActiveExerciseIndex((prev) => Math.max(0, prev - 1))}
                className="btn-prev-ex"
              >
                Ejercicio Anterior
              </button>

              <button
                type="button"
                disabled={activeExerciseIndex === session.exercises.length - 1}
                onClick={() =>
                  setActiveExerciseIndex((prev) =>
                    Math.min(session.exercises.length - 1, prev + 1)
                  )
                }
                className="btn-next-ex"
              >
                Siguiente Ejercicio
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Live Stats & Floating Timer */}
        <div className="workout-player-sidebar">
          {showRestTimer && (
            <RestTimer
              initialSeconds={restSeconds}
              onComplete={() => setShowRestTimer(false)}
              onClose={() => setShowRestTimer(false)}
            />
          )}

          <div className="workout-summary-widget card-glass">
            <h4 className="widget-title">
              <Sparkles size={16} className="text-primary-vibrant" /> Métricas en Vivo
            </h4>
            <div className="widget-metrics-grid">
              <div className="widget-metric-card">
                <span className="metric-val">{calculateTotalVolume().completedSetsCount}</span>
                <span className="metric-lbl">Series Listas</span>
              </div>
              <div className="widget-metric-card">
                <span className="metric-val">{calculateTotalVolume().totalKg.toLocaleString()} kg</span>
                <span className="metric-lbl">Volumen Levantado</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Video Modal */}
      {showVideoModal && (
        <div className="modal-backdrop" onClick={() => setShowVideoModal(false)}>
          <div className="video-modal-content card-glass" onClick={(e) => e.stopPropagation()}>
            <div className="video-modal-header">
              <h4>Técnica: {activeExercise.name}</h4>
              <button
                type="button"
                onClick={() => setShowVideoModal(false)}
                className="btn-close-modal"
              >
                ✕
              </button>
            </div>
            <div className="video-iframe-container">
              <iframe
                src={activeExercise.videoUrl}
                title={activeExercise.name}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
