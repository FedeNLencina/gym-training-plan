import React, { useState } from 'react';
import Navbar from './components/landing/Navbar';
import Hero from './components/landing/Hero';
import AboutTrainer from './components/landing/AboutTrainer';
import ProgramsShowcase from './components/landing/ProgramsShowcase';
import AppFeatures from './components/landing/AppFeatures';
import Transformations from './components/landing/Transformations';
import Pricing from './components/landing/Pricing';
import GymLocation from './components/landing/GymLocation';
import Footer from './components/landing/Footer';
import StudentDashboard from './components/app/StudentDashboard';
import WorkoutPlayer from './components/app/WorkoutPlayer';
import WorkoutSummaryModal from './components/app/WorkoutSummaryModal';
import { PROGRAMS, INITIAL_USER_STATE } from './data/mockData';

export default function App() {
  // 'landing' | 'app' | 'player'
  const [currentView, setCurrentView] = useState('landing');
  const [activeSession, setActiveSession] = useState(null);
  const [summaryData, setSummaryData] = useState(null);

  const defaultWorkoutSession = PROGRAMS[0].weeks[0].days[0];

  const handleStartWorkout = (session = null) => {
    setActiveSession(session || defaultWorkoutSession);
    setCurrentView('player');
  };

  const handleFinishWorkout = (data) => {
    setSummaryData(data);
  };

  const handleCloseSummary = () => {
    setSummaryData(null);
    setCurrentView('app');
  };

  const handleSelectPlan = (plan) => {
    const text = encodeURIComponent(`Hola Franco, me interesa el ${plan.name} (${plan.price}). ¿Cómo me anoto?`);
    window.open(`https://wa.me/5491155558899?text=${text}`, '_blank');
  };

  const handleSelectProgramFromLanding = (programId) => {
    const prog = PROGRAMS.find((p) => p.id === programId);
    if (prog && prog.weeks.length > 0 && prog.weeks[0].days.length > 0) {
      handleStartWorkout(prog.weeks[0].days[0]);
    } else {
      handleStartWorkout(defaultWorkoutSession);
    }
  };

  return (
    <div className="app-root">
      {/* Navbar visible on landing and app dashboard views */}
      {currentView !== 'player' && (
        <Navbar
          currentView={currentView}
          onToggleView={(view) => setCurrentView(view)}
          onStartWorkout={() => handleStartWorkout()}
        />
      )}

      <main>
        {currentView === 'landing' && (
          <>
            <Hero
              onExplorePrograms={() => {
                const el = document.getElementById('programas');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              onTryApp={() => setCurrentView('app')}
            />
            <ProgramsShowcase
              programs={PROGRAMS}
              onSelectProgram={handleSelectProgramFromLanding}
            />
            <AboutTrainer />
            <AppFeatures onTryApp={() => setCurrentView('app')} />
            <Transformations />
            <Pricing onSelectPlan={handleSelectPlan} />
            <GymLocation />
            <Footer />
          </>
        )}

        {currentView === 'app' && (
          <StudentDashboard
            onStartWorkout={handleStartWorkout}
            onExplorePrograms={() => {
              setCurrentView('landing');
              setTimeout(() => {
                const el = document.getElementById('programas');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }, 100);
            }}
          />
        )}

        {currentView === 'player' && activeSession && (
          <WorkoutPlayer
            session={activeSession}
            onFinishWorkout={handleFinishWorkout}
            onExit={() => setCurrentView('app')}
          />
        )}
      </main>

      {/* Completion Summary Modal */}
      {summaryData && (
        <WorkoutSummaryModal
          summaryData={summaryData}
          onClose={handleCloseSummary}
        />
      )}
    </div>
  );
}
