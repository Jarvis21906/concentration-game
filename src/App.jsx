import React, { useState, useEffect, useCallback } from 'react';
import { IoScanOutline, IoEyeOutline, IoGitNetworkOutline, IoFlashOutline, IoLocateOutline, IoBodyOutline, IoTrophyOutline, IoTimeOutline, IoRefreshOutline, IoArrowBackOutline } from 'react-icons/io5';
import SustainedAttention from './exercises/SustainedAttention';
import InterferenceControl from './exercises/InterferenceControl';
import AttentionSwitching from './exercises/AttentionSwitching';
import VisualTracking from './exercises/VisualTracking';
import FocusMeditation from './exercises/FocusMeditation';

// --- Helper Components ---

const GlassCard = ({ children, className = '' }) => (
  <div className={`bg-black/20 backdrop-blur-md p-6 rounded-2xl border border-white/10 ${className}`}>
    {children}
  </div>
);

const MainMenuButton = ({ icon, title, description, benefit, onClick }) => (
  <button
    onClick={onClick}
    className="w-full text-left p-4 bg-white/5 hover:bg-white/10 border border-transparent hover:border-white/20 rounded-xl transition-all duration-300 flex items-start space-x-4"
  >
    <div className="text-3xl text-sky-300 mt-1">{icon}</div>
    <div>
      <h3 className="font-bold text-lg text-white">{title}</h3>
      <p className="text-gray-300 text-sm">{description}</p>
      <p className="text-xs text-sky-300 mt-2 bg-sky-900/50 self-start px-2 py-1 rounded">{benefit}</p>
    </div>
  </button>
);

const StatDisplay = ({ score, session, streak }) => {
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex justify-center items-center space-x-8 text-white mb-8">
      <div className="flex items-center space-x-2">
        <IoTrophyOutline className="text-yellow-400 text-2xl" />
        <span className="font-semibold">Score: {score}</span>
      </div>
      <div className="flex items-center space-x-2">
        <IoTimeOutline className="text-green-400 text-2xl" />
        <span className="font-semibold">Session: {formatTime(session)}</span>
      </div>
      <div className="flex items-center space-x-2">
        <IoFlashOutline className="text-orange-400 text-2xl" />
        <span className="font-semibold">Streak: {streak}</span>
      </div>
    </div>
  );
};


// --- Main App Component ---

export default function FocusTrainingApp() {
  const [currentScreen, setCurrentScreen] = useState('menu');
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [sessionTime, setSessionTime] = useState(0);

  const EXERCISES = {
    focusMeditation: { Component: FocusMeditation },
    sustainedAttention: { Component: SustainedAttention },
    interferenceControl: { Component: InterferenceControl },
    attentionSwitching: { Component: AttentionSwitching },
    visualTracking: { Component: VisualTracking },
  };

  useEffect(() => {
    let timer;
    if (currentScreen !== 'menu') timer = setInterval(() => setSessionTime(t => t + 1), 1000);
    return () => clearInterval(timer);
  }, [currentScreen]);

  const updateStats = useCallback(({ score: scoreChange, streak: streakChange }) => {
    if (scoreChange) {
        const bonus = streakChange === 'inc' ? streak : 0;
        setScore(s => Math.max(0, s + scoreChange + bonus));
    }
    if (streakChange === 'inc') setStreak(s => s + 1);
    else if (streakChange !== undefined) setStreak(streakChange);
  }, [streak]);

  const resetProgress = () => { setScore(0); setStreak(0); setSessionTime(0); };

  const CurrentExercise = EXERCISES[currentScreen]?.Component;

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#2a2a45] via-[#3a204a] to-[#5d2b4f] text-white font-sans flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <GlassCard className="relative">
          {currentScreen !== 'menu' && (
            <button onClick={() => setCurrentScreen('menu')} className="absolute top-4 left-4 text-2xl text-gray-300 hover:text-white transition-colors z-20">
              <IoArrowBackOutline />
            </button>
          )}

          {currentScreen === 'menu' ? (
            <>
              <div className="text-center mb-8">
                <div className="flex justify-center items-center space-x-3 mb-2"><IoScanOutline className="text-3xl" /><h1 className="text-3xl font-bold text-white">Focus Training</h1></div>
                <p className="text-gray-300">Scientifically-designed exercises to improve concentration and attention</p>
              </div>
              <StatDisplay score={score} session={sessionTime} streak={streak} />
              <div className="space-y-4">
                {/* *** FIX: Reordered to put Meditation first *** */}
                <MainMenuButton icon={<IoBodyOutline />} title="Focus Meditation" description="Guided breathing exercises" benefit="Builds baseline attention and mindfulness" onClick={() => setCurrentScreen('focusMeditation')} />
                <MainMenuButton icon={<IoEyeOutline />} title="Sustained Attention" description="Maintain focus on rare targets" benefit="Improves vigilance and sustained concentration" onClick={() => setCurrentScreen('sustainedAttention')} />
                <MainMenuButton icon={<IoGitNetworkOutline />} title="Interference Control" description="Ignore distracting information" benefit="Enhances ability to filter distractions" onClick={() => setCurrentScreen('interferenceControl')} />
                <MainMenuButton icon={<IoFlashOutline />} title="Attention Switching" description="Rapidly switch between tasks" benefit="Improves mental flexibility and task switching" onClick={() => setCurrentScreen('attentionSwitching')} />
                <MainMenuButton icon={<IoLocateOutline />} title="Visual Tracking" description="Track multiple moving objects" benefit="Enhances spatial attention and tracking" onClick={() => setCurrentScreen('visualTracking')} />
              </div>
              <div className="mt-8 text-center">
                <button onClick={resetProgress} className="flex items-center justify-center mx-auto space-x-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"><IoRefreshOutline /><span>Reset Progress</span></button>
              </div>
            </>
          ) : (
            <>
              {currentScreen !== 'focusMeditation' && <StatDisplay score={score} session={sessionTime} streak={streak} />}
              {CurrentExercise && <CurrentExercise updateStats={updateStats} />}
            </>
          )}
        </GlassCard>
      </div>
    </div>
  );
}