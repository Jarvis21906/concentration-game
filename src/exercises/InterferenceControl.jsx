import React, { useState, useEffect, useCallback, useRef } from 'react';

// Constants
const COLORS = { RED: 'text-red-500', BLUE: 'text-blue-500', GREEN: 'text-green-500', YELLOW: 'text-yellow-500' };
const COLOR_NAMES = Object.keys(COLORS);
const MAX_LEVEL = 10;
const FEEDBACK_DURATION = 800;
const MIN_TIME_LIMIT = 2000;
const MAX_TIME_LIMIT = 4000;

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

    // Clear any existing timers
    clearTimeout(timerRef.current);
    
    // Calculate time limit based on level
    const timeLimit = Math.max(MIN_TIME_LIMIT, MAX_TIME_LIMIT - level * 200);
    timerRef.current = setTimeout(() => handleResponse(null), timeLimit);
  }, [level]);

  const handleResponse = useCallback((userMatch) => {
    if (isWaiting || !task) return;
    
    setIsWaiting(true);
    clearTimeout(timerRef.current);

    const correct = userMatch === task.isMatch;
    if (correct) {
      setFeedback('Correct!');
      try {
        updateStats({ scoreChange: 15, streakChange: 'inc' });
      } catch (error) {
        console.error('Failed to update stats:', error);
      }
      setLevel(prev => Math.min(prev + 0.2, MAX_LEVEL));
    } else {
      setFeedback('Incorrect');
      try {
        updateStats({ scoreChange: -10, streakChange: 0 });
      } catch (error) {
        console.error('Failed to update stats:', error);
      }
    }

    // Clear any existing transition timeout
    clearTimeout(transitionTimeoutRef.current);
    
    // Set up transition to next task
    transitionTimeoutRef.current = setTimeout(() => {
      setTask(null);
      setTimeout(generateTask, 100);
    }, FEEDBACK_DURATION);
  }, [isWaiting, task, updateStats, generateTask]);

  // Initial setup and cleanup
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
        {task ? (
          <span 
            className={`text-6xl font-extrabold transition-opacity duration-300 ${COLORS[task.color]}`}
            role="text"
            aria-label={`Word ${task.word} in ${task.color.toLowerCase()} color`}
          >
            {task.word}
          </span>
        ) : (
          <p className="text-xl text-gray-400">Loading...</p>
        )}
      </div>
      <div 
        className={`h-8 text-lg font-bold ${feedback === 'Correct!' ? 'text-green-400' : 'text-red-400'}`}
        role="status"
        aria-live="polite"
      >
        {feedback}
      </div>
      <div className="flex justify-center space-x-4 mt-4">
        <button 
          onClick={() => handleResponse(true)} 
          disabled={isWaiting} 
          className="px-8 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-semibold transition-all w-32 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Answer: Word matches its color"
        >
          MATCH
        </button>
        <button 
          onClick={() => handleResponse(false)} 
          disabled={isWaiting} 
          className="px-8 py-3 bg-red-600 hover:bg-red-700 rounded-lg font-semibold transition-all w-32 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Answer: Word does not match its color"
        >
          DIFFERENT
        </button>
      </div>
    </div>
  );
}