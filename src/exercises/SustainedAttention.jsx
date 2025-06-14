import React, { useState, useEffect, useCallback, useRef } from 'react';

// This component is now self-contained.
export default function SustainedAttention({ updateStats }) {
  const [isStarted, setIsStarted] = useState(false);
  const [target, setTarget] = useState(null);
  const [misses, setMisses] = useState(0);
  const gameAreaRef = useRef(null);
  const timerRef = useRef(null);
  const targetAppearTimeRef = useRef(null);

  const scheduleNextTarget = useCallback(() => {
    const delay = 1000 + Math.random() * 3000;
    timerRef.current = setTimeout(() => {
      if (Math.random() < 0.3) {
        spawnTarget();
      } else {
        scheduleNextTarget();
      }
    }, delay);
  }, []); 

  const spawnTarget = useCallback(() => {
    if (!gameAreaRef.current) return;
    const { width, height } = gameAreaRef.current.getBoundingClientRect();
    const size = 50;
    setTarget({
      top: Math.random() * (height - size),
      left: Math.random() * (width - size),
      size: size,
    });
    targetAppearTimeRef.current = Date.now();

    timerRef.current = setTimeout(() => {
      setTarget(null);
      setMisses(prev => prev + 1);
      updateStats({ scoreChange: -10, streakChange: 0 });
      scheduleNextTarget(); 
    }, 2000);
  }, [updateStats, scheduleNextTarget]);

  const handleTargetClick = () => {
    if (!target) return;
    clearTimeout(timerRef.current);
    const reactionTime = (Date.now() - targetAppearTimeRef.current) / 1000;
    const points = Math.max(1, Math.round(20 - reactionTime * 10));
    updateStats({ scoreChange: points, streakChange: 'inc' });
    setTarget(null);
    scheduleNextTarget();
  };

  useEffect(() => {
    if (isStarted) {
      scheduleNextTarget();
    }
    return () => clearTimeout(timerRef.current);
  }, [isStarted, scheduleNextTarget]);

  return (
    <div className="w-full text-center">
      <h2 className="text-2xl font-bold mb-4">Sustained Attention</h2>
      <div
        ref={gameAreaRef}
        className="w-full h-96 bg-slate-800/50 rounded-lg relative overflow-hidden"
      >
        {!isStarted ? (
          <div className="flex flex-col items-center justify-center h-full">
            <p className="mb-4">Click the yellow targets as soon as they appear.</p>
            <button onClick={() => setIsStarted(true)} className="px-6 py-2 bg-sky-500 hover:bg-sky-600 rounded-lg font-semibold transition-colors">Start Exercise</button>
          </div>
        ) : (
          target && (
            <div
              onClick={handleTargetClick}
              style={{ top: `${target.top}px`, left: `${target.left}px`, width: `${target.size}px`, height: `${target.size}px` }}
              className="absolute bg-yellow-400 rounded-full cursor-pointer transition-opacity duration-200 animate-pulse"
            />
          )
        )}
      </div>
      <p className="mt-4">Missed Targets: {misses}</p>
    </div>
  );
};