import React, { useState, useEffect, useCallback, useRef } from 'react';

// --- Constants (remain outside the component for stability) ---
const COLORS = { RED: 'text-red-500', BLUE: 'text-blue-500', GREEN: 'text-green-500', YELLOW: 'text-yellow-500' };
const COLOR_NAMES = Object.keys(COLORS);

export default function InterferenceControl({ updateStats }) {
  const [task, setTask] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [level, setLevel] = useState(1);
  const [isFading, setIsFading] = useState(true);
  
  // The timer's ID is stored in a ref for stable access across renders.
  const timerRef = useRef(null);

  const generateNewTask = useCallback(() => {
    const word = COLOR_NAMES[Math.floor(Math.random() * COLOR_NAMES.length)];
    const color = COLOR_NAMES[Math.floor(Math.random() * COLOR_NAMES.length)];
    return { word, color, isMatch: word === color };
  }, []);

  // This is now the single point of control for advancing the game.
  const handleResponse = useCallback((userAnswer) => {
    // 1. Immediately destroy the timer for the current question. This is the most critical step.
    clearTimeout(timerRef.current);

    // 2. Process the answer and update stats, but only if there was a task to answer.
    if (task) {
        const correct = userAnswer === task.isMatch;
        if (correct) {
          setFeedback('Correct!');
          updateStats({ score: 15, streak: 'inc' });
          setLevel(prev => prev + 0.2);
        } else {
          setFeedback('Incorrect');
          updateStats({ score: -10, streak: 0 });
        }
    }

    // 3. Trigger the visual transition to the next question.
    setIsFading(true); // Start fade out
    setTimeout(() => {
        setTask(generateNewTask());
        setIsFading(false); // Start fade in
    }, 400); // This delay allows for the fade-out/loading visual.
    
  }, [task, updateStats, generateNewTask]);


  // --- The Game Loop Engine ---
  // This useEffect now has one job: set a timer for the current task.
  // The cleanup function is the key to its stability.
  useEffect(() => {
    // Only set a timer if a task is fully displayed.
    if (task && !isFading) {
      const timeLimit = Math.max(2000, 4000 - level * 200);
      
      // Store the timer ID in the ref.
      timerRef.current = setTimeout(() => {
        handleResponse(null); // Timeout is an incorrect answer.
      }, timeLimit);
    }
    
    // CRITICAL CLEANUP: When the task changes (or component unmounts),
    // this function runs FIRST, destroying the timer for the PREVIOUS task.
    return () => {
      clearTimeout(timerRef.current);
    };

  }, [task, isFading, level, handleResponse]);
  
  // Effect for the very first task load
  useEffect(() => {
    setTask(generateNewTask());
    setIsFading(false);
  }, [generateNewTask]);

  return (
    <div className="w-full text-center">
      <h2 className="text-2xl font-bold mb-2">Interference Control</h2>
      <p className="mb-6">Does the word's meaning match its color?</p>
      <div className="h-40 flex items-center justify-center">
        {task ? (
          <span className={`text-6xl font-extrabold transition-opacity duration-300 ${isFading ? 'opacity-0' : 'opacity-100'} ${COLORS[task.color]}`}>
            {task.word}
          </span>
        ) : (
          <p className="text-xl text-gray-400">Loading...</p>
        )}
      </div>
      <div className={`h-8 text-lg font-bold ${feedback === 'Correct!' ? 'text-green-400' : 'text-red-400'}`}>{feedback}</div>
      <div className="flex justify-center space-x-4 mt-4">
        {/* Buttons are disabled when fading, preventing double-clicks */}
        <button onClick={() => handleResponse(true)} disabled={isFading} className="px-8 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-semibold transition-all w-32 disabled:opacity-50 disabled:cursor-not-allowed">MATCH</button>
        <button onClick={() => handleResponse(false)} disabled={isFading} className="px-8 py-3 bg-red-600 hover:bg-red-700 rounded-lg font-semibold transition-all w-32 disabled:opacity-50 disabled:cursor-not-allowed">DIFFERENT</button>
      </div>
    </div>
  );
};