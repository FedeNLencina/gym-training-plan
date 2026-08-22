import React, { useState, useEffect } from 'react';
import { Play, Pause, Plus, X, Bell } from 'lucide-react';

export default function RestTimer({ initialSeconds = 90, onComplete, onClose }) {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    let interval = null;
    if (isActive && secondsLeft > 0) {
      interval = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            if (onComplete) onComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive, secondsLeft, onComplete]);

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  const handleAdd30 = () => {
    setSecondsLeft((prev) => prev + 30);
  };

  const toggleTimer = () => {
    setIsActive((prev) => !prev);
  };

  const progressPercent = Math.max(0, Math.min(100, (secondsLeft / initialSeconds) * 100));

  return (
    <div className="rest-timer-floating">
      <div className="rest-timer-header">
        <div className="rest-timer-title">
          <Bell size={16} className="text-primary animate-pulse" />
          <span>Descanso entre series</span>
        </div>
        {onClose && (
          <button 
            type="button" 
            aria-label="Cerrar temporizador" 
            onClick={onClose} 
            className="rest-timer-close"
          >
            <X size={16} />
          </button>
        )}
      </div>

      <div className="rest-timer-display">
        <div className="rest-timer-clock">{formatTime(secondsLeft)}</div>
      </div>

      {/* Progress Bar */}
      <div className="rest-timer-progress-bg">
        <div 
          className="rest-timer-progress-fill" 
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div className="rest-timer-actions">
        <button
          type="button"
          aria-label="+30s"
          onClick={handleAdd30}
          className="btn-timer-secondary"
        >
          <Plus size={14} /> +30s
        </button>

        <button
          type="button"
          aria-label={isActive ? "Pausar" : "Continuar"}
          onClick={toggleTimer}
          className="btn-timer-primary"
        >
          {isActive ? (
            <>
              <Pause size={15} /> Pausar
            </>
          ) : (
            <>
              <Play size={15} /> Reanudar
            </>
          )}
        </button>
      </div>
    </div>
  );
}
