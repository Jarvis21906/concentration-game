import React, { useState, useEffect, useCallback, useRef } from 'react';

// *** FIX: Moved constant data outside the component to prevent re-creation on every render. ***
// This breaks the infinite loop.
const COLORS = { RED: 'text-red-500', BLUE: 'text-blue-500', GREEN: 'text-green-500', YELLOW: 'text-yellow-500' };
const COLOR_NAMES = Object.keys(COLORS);

export default function InterferenceControl({ updateStats }) {
  const [task, setTask] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [level, setLevel] = useState(1);
  const [isWaiting, setIsWaiting] = useState(true);
  const timerRef = useRef(null);
  const transitionTimeoutRef = useRef(null);
  
  const generateTask = useCallback(() => {
    setFeedback('');
    const word = COLOR_NAMES[Math.floor(Math.random() * COLOR_NAMES.length)];
    const color = COLOR_NAMES[Math.floor(Math.random() * COLOR_NAMES.length)];
    const isMatch = word === color;
    setTask({ word, color, isMatch });
    setIsWaiting(false); 
    clearTimeout(timerRef.current);
    const timeLimit = Math.max(2000, 4000 - level * 200);
    timerRef.current = setTimeout(() => handleResponse(null), timeLimit);
  }, [level]); // Now only depends on `level`, which is stable.

  const handleResponse = (userMatch) => {
    if (isWaiting || !task) return;
    setIsWaiting(true);
    clearTimeout(timerRef.current);
    const correct = userMatch === task.isMatch;
    if (correct) {
      setFeedback('Correct!');
      updateStats({ score: 15, streak: 'inc' });
      setLevel(prev => prev + 0.2);
    } else {
      setFeedback('Incorrect');
      updateStats({ score: -10, streak: 0 });
    }
    transitionTimeoutRef.current = setTimeout(() => {
      setTask(null); 
      setTimeout(generateTask, 100);
    }, 800);
  };

  useEffect(() => {
    generateTask();
    return () => {
      clearTimeout(timerRef.current);
      clearTimeout(transitionTimeoutRef.current);
    };
  }, [generateTask]);

  return (
    <div className="w-full text-center">
      <h2 className="text-2xl font-bold mb-2">Interference Control</h2>
      <p className="mb-6">Does the word's meaning match its color?</p>
      <div className="h-40 flex items-center justify-center">
        {task ? <span className={`text-6xl font-extrabold ${COLORS[task.color]}`}>{task.word}</span> : <p className="text-xl text-gray-400">Loading...</p>}
      </div>
      <div className={`h-8 text-lg font-bold ${feedback === 'Correct!' ? 'text-green-400' : 'text-red-400'}`}>{feedback}</div>
      <div className="flex justify-center space-x-4 mt-4">
        <button onClick={() => handleResponse(true)} disabled={isWaiting} className="px-8 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-semibold transition-all w-32 disabled:opacity-50 disabled:cursor-not-allowed">MATCH</button>
        <button onClick={() => handleResponse(false)} disabled={isWaiting} className="px-8 py-3 bg-red-600 hover:bg-red-700 rounded-lg font-semibold transition-all w-32 disabled:opacity-50 disabled:cursor-not-allowed">DIFFERENT</button>
      </div>
    </div>
  );
};