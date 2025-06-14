import React, { useState, useEffect, useCallback } from 'react';

export default function AttentionSwitching({ updateStats }) {
  const [currentTask, setCurrentTask] = useState(null);
  const [currentStimulus, setCurrentStimulus] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [isWaiting, setIsWaiting] = useState(true);
  const STIMULI = {
    colors: { red: { type: 'primary', className: 'bg-red-500' }, blue: { type: 'primary', className: 'bg-blue-500' }, green: { type: 'secondary', className: 'bg-green-500' }, yellow: { type: 'secondary', className: 'bg-yellow-500' } },
    shapes: { circle: { type: 'curved', className: 'rounded-full' }, square: { type: 'angular', className: 'rounded-md' } },
    sizes: { small: { type: 'small', className: 'w-20 h-20' }, large: { type: 'large', className: 'w-32 h-32' } }
  };
  const TASKS = [
    { type: 'Color', ruleText: 'Is the color PRIMARY?', check: (s) => STIMULI.colors[s.color].type === 'primary' },
    { type: 'Color', ruleText: 'Is the color SECONDARY?', check: (s) => STIMULI.colors[s.color].type === 'secondary' },
    { type: 'Shape', ruleText: 'Is the shape CURVED?', check: (s) => STIMULI.shapes[s.shape].type === 'curved' },
    { type: 'Shape', ruleText: 'Is the shape ANGULAR?', check: (s) => STIMULI.shapes[s.shape].type === 'angular' },
    { type: 'Size', ruleText: 'Is the size LARGE?', check: (s) => STIMULI.sizes[s.size].type === 'large' },
    { type: 'Size', ruleText: 'Is the size SMALL?', check: (s) => STIMULI.sizes[s.size].type === 'small' },
  ];

  const generateNewProblem = useCallback(() => {
    setFeedback('');
    const task = TASKS[Math.floor(Math.random() * TASKS.length)];
    const colorKeys = Object.keys(STIMULI.colors), shapeKeys = Object.keys(STIMULI.shapes), sizeKeys = Object.keys(STIMULI.sizes);
    const stimulus = { color: colorKeys[Math.floor(Math.random() * colorKeys.length)], shape: shapeKeys[Math.floor(Math.random() * shapeKeys.length)], size: sizeKeys[Math.floor(Math.random() * sizeKeys.length)] };
    setCurrentTask(task);
    setCurrentStimulus(stimulus);
    setIsWaiting(false);
  }, [TASKS, STIMULI]);

  const handleResponse = (userAnswer) => { 
    if (isWaiting) return;
    setIsWaiting(true);
    const isCorrect = currentTask.check(currentStimulus);
    if (userAnswer === isCorrect) {
      setFeedback('Correct!');
      updateStats({ score: 20, streak: 'inc' });
    } else {
      setFeedback('Incorrect');
      updateStats({ score: -10, streak: 0 });
    }
    setTimeout(generateNewProblem, 1000);
  };

  useEffect(() => { generateNewProblem(); }, [generateNewProblem]);

  return (
    <div className="w-full text-center">
      <h2 className="text-2xl font-bold mb-2">Attention Switching</h2>
      {currentTask && <p className="mb-4 text-sky-300">Rule: <span className="font-semibold text-white">{currentTask.ruleText}</span></p>}
      <div className="h-48 flex items-center justify-center my-4">
        {currentStimulus && <div className={`transition-all duration-300 ${STIMULI.colors[currentStimulus.color].className} ${STIMULI.shapes[currentStimulus.shape].className} ${STIMULI.sizes[currentStimulus.size].className}`} />}
      </div>
      <div className={`h-8 text-lg font-bold ${feedback === 'Correct!' ? 'text-green-400' : 'text-red-400'}`}>{feedback}</div>
      <div className="flex justify-center space-x-4 mt-4">
        <button onClick={() => handleResponse(true)} disabled={isWaiting} className="px-8 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-semibold transition-all w-32 disabled:opacity-50 disabled:cursor-not-allowed">YES</button>
        <button onClick={() => handleResponse(false)} disabled={isWaiting} className="px-8 py-3 bg-red-600 hover:bg-red-700 rounded-lg font-semibold transition-all w-32 disabled:opacity-50 disabled:cursor-not-allowed">NO</button>
      </div>
    </div>
  );
};