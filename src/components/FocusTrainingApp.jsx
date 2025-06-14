import React, { useState, useEffect, useCallback, useRef } from 'react';
import { IoScanOutline, IoEyeOutline, IoGitNetworkOutline, IoFlashOutline, IoLocateOutline, IoBodyOutline, IoTrophyOutline, IoTimeOutline, IoRefreshOutline, IoArrowBackOutline } from 'react-icons/io5';

// --- Helper Components (Unchanged) ---

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

// --- Exercise Components (Sustained, Interference, Switching, Visual Tracking are Unchanged) ---

const SustainedAttention = ({ updateStats, score, session, streak }) => {
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
      updateStats({ score: -5, streak: 0 });
      scheduleNextTarget(); 
    }, 2000);
  }, [updateStats, scheduleNextTarget]);

  const handleTargetClick = () => {
    if (!target) return;
    clearTimeout(timerRef.current);
    const reactionTime = (Date.now() - targetAppearTimeRef.current) / 1000;
    const points = Math.max(1, Math.round(10 - reactionTime * 5));
    updateStats({ score: points, streak: 'inc' });
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
      <StatDisplay score={score} session={session} streak={streak} />
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

const InterferenceControl = ({ updateStats, score, session, streak }) => {
  const COLORS = { RED: 'text-red-500', BLUE: 'text-blue-500', GREEN: 'text-green-500', YELLOW: 'text-yellow-500' };
  const COLOR_NAMES = Object.keys(COLORS);

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
  }, [level]);

  const handleResponse = (userMatch) => {
    if (isWaiting || !task) return;
    setIsWaiting(true);

    clearTimeout(timerRef.current);

    const correct = userMatch === task.isMatch;
    if (correct) {
      setFeedback('Correct!');
      updateStats({ score: 10, streak: 'inc' });
      setLevel(prev => prev + 0.2);
    } else {
      setFeedback('Incorrect');
      updateStats({ score: -5, streak: 0 });
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
      <StatDisplay score={score} session={session} streak={streak} />
      <h2 className="text-2xl font-bold mb-2">Interference Control</h2>
      <p className="mb-6">Does the word's meaning match its color?</p>
      <div className="h-40 flex items-center justify-center">
        {task ? (
          <span className={`text-6xl font-extrabold ${COLORS[task.color]}`}>{task.word}</span>
        ) : (
          <p className="text-xl text-gray-400">Loading...</p>
        )}
      </div>
      <div className={`h-8 text-lg font-bold ${feedback === 'Correct!' ? 'text-green-400' : 'text-red-400'}`}>
        {feedback}
      </div>
      <div className="flex justify-center space-x-4 mt-4">
        <button
          onClick={() => handleResponse(true)}
          disabled={isWaiting}
          className="px-8 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-semibold transition-all w-32 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          MATCH
        </button>
        <button
          onClick={() => handleResponse(false)}
          disabled={isWaiting}
          className="px-8 py-3 bg-red-600 hover:bg-red-700 rounded-lg font-semibold transition-all w-32 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          DIFFERENT
        </button>
      </div>
    </div>
  );
};

const AttentionSwitching = ({ updateStats, score, session, streak }) => {
  const STIMULI = {
    colors: {
      red: { type: 'primary', className: 'bg-red-500' },
      blue: { type: 'primary', className: 'bg-blue-500' },
      green: { type: 'secondary', className: 'bg-green-500' },
      yellow: { type: 'secondary', className: 'bg-yellow-500' },
    },
    shapes: {
      circle: { type: 'curved', className: 'rounded-full' },
      square: { type: 'angular', className: 'rounded-md' },
    },
    sizes: {
      small: { type: 'small', className: 'w-20 h-20' },
      large: { type: 'large', className: 'w-32 h-32' },
    }
  };

  const TASKS = [
    { type: 'Color', ruleText: 'Is the color PRIMARY?', check: (s) => STIMULI.colors[s.color].type === 'primary' },
    { type: 'Color', ruleText: 'Is the color SECONDARY?', check: (s) => STIMULI.colors[s.color].type === 'secondary' },
    { type: 'Shape', ruleText: 'Is the shape CURVED?', check: (s) => STIMULI.shapes[s.shape].type === 'curved' },
    { type: 'Shape', ruleText: 'Is the shape ANGULAR?', check: (s) => STIMULI.shapes[s.shape].type === 'angular' },
    { type: 'Size', ruleText: 'Is the size LARGE?', check: (s) => STIMULI.sizes[s.size].type === 'large' },
    { type: 'Size', ruleText: 'Is the size SMALL?', check: (s) => STIMULI.sizes[s.size].type === 'small' },
  ];

  const [currentTask, setCurrentTask] = useState(null);
  const [currentStimulus, setCurrentStimulus] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [isWaiting, setIsWaiting] = useState(true);

  const generateNewProblem = useCallback(() => {
    setFeedback('');
    const task = TASKS[Math.floor(Math.random() * TASKS.length)];
    const colorKeys = Object.keys(STIMULI.colors);
    const shapeKeys = Object.keys(STIMULI.shapes);
    const sizeKeys = Object.keys(STIMULI.sizes);
    
    const stimulus = {
      color: colorKeys[Math.floor(Math.random() * colorKeys.length)],
      shape: shapeKeys[Math.floor(Math.random() * shapeKeys.length)],
      size: sizeKeys[Math.floor(Math.random() * sizeKeys.length)],
    };

    setCurrentTask(task);
    setCurrentStimulus(stimulus);
    setIsWaiting(false);
  }, []);

  const handleResponse = (userAnswer) => { 
    if (isWaiting) return;
    setIsWaiting(true);

    const isCorrect = currentTask.check(currentStimulus);
    if (userAnswer === isCorrect) {
      setFeedback('Correct!');
      updateStats({ score: 15, streak: 'inc' });
    } else {
      setFeedback('Incorrect');
      updateStats({ score: -7, streak: 0 });
    }

    setTimeout(generateNewProblem, 1000);
  };

  useEffect(() => {
    generateNewProblem();
  }, [generateNewProblem]);

  return (
    <div className="w-full text-center">
      <StatDisplay score={score} session={session} streak={streak} />
      <h2 className="text-2xl font-bold mb-2">Attention Switching</h2>
      {currentTask && (
        <p className="mb-4 text-sky-300">
          Rule: <span className="font-semibold text-white">{currentTask.ruleText}</span>
        </p>
      )}

      <div className="h-48 flex items-center justify-center my-4">
        {currentStimulus && (
          <div className={`transition-all duration-300 ${STIMULI.colors[currentStimulus.color].className} ${STIMULI.shapes[currentStimulus.shape].className} ${STIMULI.sizes[currentStimulus.size].className}`} />
        )}
      </div>

      <div className={`h-8 text-lg font-bold ${feedback === 'Correct!' ? 'text-green-400' : 'text-red-400'}`}>
        {feedback}
      </div>

      <div className="flex justify-center space-x-4 mt-4">
        <button
          onClick={() => handleResponse(true)}
          disabled={isWaiting}
          className="px-8 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-semibold transition-all w-32 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          YES
        </button>
        <button
          onClick={() => handleResponse(false)}
          disabled={isWaiting}
          className="px-8 py-3 bg-red-600 hover:bg-red-700 rounded-lg font-semibold transition-all w-32 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          NO
        </button>
      </div>
    </div>
  );
};

const VisualTracking = ({ updateStats, score, session, streak }) => {
    const [level, setLevel] = useState(1);
    const [phase, setPhase] = useState('identify'); // identify, track, select, result
    const [dots, setDots] = useState([]);
    const [feedback, setFeedback] = useState('');
    const containerRef = useRef(null);
    const animationFrameId = useRef(null);
    const numTargets = Math.min(5, 2 + Math.floor(level / 2));
    const totalDots = Math.min(15, 8 + level);

    const generateDots = useCallback(() => {
        if (!containerRef.current) return;
        const { width, height } = containerRef.current.getBoundingClientRect();
        const newDots = [];
        const indices = Array.from(Array(totalDots).keys());
        const targetIndices = new Set();
        while (targetIndices.size < numTargets) {
            targetIndices.add(Math.floor(Math.random() * totalDots));
        }

        for (let i = 0; i < totalDots; i++) {
            newDots.push({
                id: i,
                x: Math.random() * (width - 20) + 10,
                y: Math.random() * (height - 20) + 10,
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 2,
                isTarget: targetIndices.has(i),
                isSelected: false,
            });
        }
        setDots(newDots);
    }, [level, totalDots, numTargets]);

    useEffect(() => {
        generateDots();
    }, [generateDots]);

    useEffect(() => {
        if (phase === 'identify') {
            const timer = setTimeout(() => setPhase('track'), 3000);
            return () => clearTimeout(timer);
        }
        if (phase === 'track') {
            const trackTimer = setTimeout(() => {
                setPhase('select');
                cancelAnimationFrame(animationFrameId.current);
            }, 5000);

            const animate = () => {
                setDots(prevDots => {
                    if (!containerRef.current) return prevDots;
                    const { width, height } = containerRef.current.getBoundingClientRect();
                    return prevDots.map(dot => {
                        let newX = dot.x + dot.vx;
                        let newY = dot.y + dot.vy;
                        let newVx = dot.vx;
                        let newVy = dot.vy;

                        if (newX <= 10 || newX >= width - 10) newVx = -newVx;
                        if (newY <= 10 || newY >= height - 10) newVy = -newVy;

                        return { ...dot, x: newX, y: newY, vx: newVx, vy: newVy };
                    });
                });
                animationFrameId.current = requestAnimationFrame(animate);
            };
            animationFrameId.current = requestAnimationFrame(animate);

            return () => {
                clearTimeout(trackTimer);
                cancelAnimationFrame(animationFrameId.current);
            };
        }
    }, [phase]);

    const handleDotClick = (id) => {
        if (phase !== 'select') return;
        setDots(dots.map(dot => (dot.id === id ? { ...dot, isSelected: !dot.isSelected } : dot)));
    };

    const handleSubmit = () => {
        let correctSelections = 0;
        dots.forEach(dot => {
            if (dot.isSelected && dot.isTarget) {
                correctSelections++;
            }
        });
        const points = correctSelections * 20 - (numTargets - correctSelections) * 10;
        updateStats({ score: points, streak: correctSelections === numTargets ? 'inc' : 0 });
        setFeedback(`You found ${correctSelections} of ${numTargets} targets!`);
        if(correctSelections === numTargets) setLevel(l => l + 1);
        setPhase('result');
    };

    const handleNextRound = () => {
        setPhase('identify');
        setFeedback('');
        generateDots();
    };

    const getPhaseInstructions = () => {
        switch (phase) {
            case 'identify': return 'Identify the red targets.';
            case 'track': return 'Track the moving dots.';
            case 'select': return `Select the ${numTargets} dots you were tracking.`;
            case 'result': return feedback;
            default: return '';
        }
    };

    return (
        <div className="w-full text-center">
            <StatDisplay score={score} session={session} streak={streak} />
            <h2 className="text-2xl font-bold mb-2">Visual Tracking</h2>
            <p className="mb-4 text-sky-300 h-6">{getPhaseInstructions()}</p>
            <div ref={containerRef} className="w-full h-96 bg-slate-800/50 rounded-lg relative overflow-hidden">
                {dots.map(dot => (
                    <div
                        key={dot.id}
                        onClick={() => handleDotClick(dot.id)}
                        className="w-5 h-5 rounded-full absolute transition-colors duration-300"
                        style={{
                            transform: `translate(${dot.x - 10}px, ${dot.y - 10}px)`,
                            backgroundColor:
                                phase === 'result' && dot.isTarget ? '#22c55e'
                                : phase === 'result' && dot.isSelected && !dot.isTarget ? '#ef4444'
                                : dot.isSelected ? '#eab308'
                                : phase === 'identify' && dot.isTarget ? '#ef4444'
                                : '#3b82f6',
                            cursor: phase === 'select' ? 'pointer' : 'default',
                        }}
                    />
                ))}
            </div>
            {phase === 'select' && <button onClick={handleSubmit} className="mt-4 px-6 py-2 bg-sky-500 hover:bg-sky-600 rounded-lg font-semibold transition-colors">Submit</button>}
            {phase === 'result' && <button onClick={handleNextRound} className="mt-4 px-6 py-2 bg-sky-500 hover:bg-sky-600 rounded-lg font-semibold transition-colors">Next Round</button>}
        </div>
    );
};

// *** FOCUS MEDITATION with AUDIO FIXES ***
const FocusMeditation = () => {
    const [isStarted, setIsStarted] = useState(false);
    const [timeRemaining, setTimeRemaining] = useState(0);
    const [breathPhase, setBreathPhase] = useState('pause'); 
    const [selectedTrack, setSelectedTrack] = useState('none');

    const audioContextRef = useRef(null);
    const breathOscillatorRef = useRef(null);
    const backgroundAudioNodesRef = useRef({});
    const phaseTimer = useRef(null);
    const sessionTimer = useRef(null);

    const BREATH_CYCLE = {
        inhale: { next: 'hold', duration: 4000, text: 'Inhale...', color: 'bg-sky-400', scale: 'scale-110' },
        hold: { next: 'exhale', duration: 2000, text: 'Hold', color: 'bg-sky-300', scale: 'scale-110' },
        exhale: { next: 'pause', duration: 4000, text: 'Exhale...', color: 'bg-indigo-400', scale: 'scale-100' },
        pause: { next: 'inhale', duration: 2000, text: 'Pause', color: 'bg-indigo-300', scale: 'scale-100' },
    };

    const stopAllAudio = () => {
        if (breathOscillatorRef.current) breathOscillatorRef.current.stop();
        if (backgroundAudioNodesRef.current.source) {
            backgroundAudioNodesRef.current.source.stop();
            Object.values(backgroundAudioNodesRef.current).forEach(node => node.disconnect());
            backgroundAudioNodesRef.current = {};
        }
    };

    const playBreathSound = useCallback((phase) => {
        if (!audioContextRef.current) return;
        const now = audioContextRef.current.currentTime;
        if (breathOscillatorRef.current) breathOscillatorRef.current.stop(now);

        if (phase === 'inhale' || phase === 'exhale') {
            const oscillator = audioContextRef.current.createOscillator();
            const gainNode = audioContextRef.current.createGain();
            oscillator.type = 'sine';
            const startFreq = 261.63, endFreq = 392.00;
            
            oscillator.frequency.setValueAtTime(phase === 'inhale' ? startFreq : endFreq, now);
            oscillator.frequency.linearRampToValueAtTime(phase === 'inhale' ? endFreq : startFreq, now + 4);
            gainNode.gain.setValueAtTime(0.3, now);
            gainNode.gain.linearRampToValueAtTime(0, now + 4);
            
            oscillator.connect(gainNode).connect(audioContextRef.current.destination);
            oscillator.start(now);
            breathOscillatorRef.current = oscillator;
        }
    }, []);
    
    const playBackgroundSound = useCallback(() => {
        if (selectedTrack === 'none' || !audioContextRef.current) return;
        const now = audioContextRef.current.currentTime;
        const gainNode = audioContextRef.current.createGain();
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(selectedTrack === 'rain' ? 0.05 : 0.2, now + 2);
        gainNode.connect(audioContextRef.current.destination);
        
        const createNoiseSource = (type) => {
            const bufferSize = 2 * audioContextRef.current.sampleRate;
            const buffer = audioContextRef.current.createBuffer(1, bufferSize, audioContextRef.current.sampleRate);
            const output = buffer.getChannelData(0);

            if (type === 'white') {
                for (let i = 0; i < bufferSize; i++) output[i] = Math.random() * 2 - 1;
            } else if (type === 'pink') {
                 let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
                 for (let i = 0; i < bufferSize; i++) {
                     const white = Math.random() * 2 - 1;
                     b0 = 0.99886 * b0 + white * 0.0555179; b1 = 0.99332 * b1 + white * 0.0750759;
                     b2 = 0.96900 * b2 + white * 0.1538520; b3 = 0.86650 * b3 + white * 0.3104856;
                     b4 = 0.55000 * b4 + white * 0.5329522; b5 = -0.7616 * b5 - white * 0.0168980;
                     output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
                     output[i] *= 0.11; b6 = white * 0.115926;
                 }
            }
            const noise = audioContextRef.current.createBufferSource();
            noise.buffer = buffer;
            noise.loop = true;
            return noise;
        };

        const noiseSource = createNoiseSource(selectedTrack === 'rain' ? 'white' : 'pink');
        noiseSource.start(now);
        noiseSource.connect(gainNode);
        backgroundAudioNodesRef.current = { source: noiseSource, gain: gainNode };

    }, [selectedTrack]);

    const startSession = (minutes) => {
        if (!audioContextRef.current) audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
        
        // *** FIX: Resume AudioContext to ensure sound plays on first user interaction ***
        if (audioContextRef.current.state === 'suspended') {
            audioContextRef.current.resume();
        }

        setTimeRemaining(minutes * 60);
        setIsStarted(true);
        setBreathPhase('inhale');
        playBreathSound('inhale');
        playBackgroundSound();
    };
    
    useEffect(() => { // Session timer effect
        if(isStarted) {
            sessionTimer.current = setInterval(() => {
                setTimeRemaining(t => {
                    if (t <= 1) {
                        clearInterval(sessionTimer.current);
                        clearTimeout(phaseTimer.current);
                        setIsStarted(false);
                        stopAllAudio();
                        return 0;
                    }
                    return t - 1;
                });
            }, 1000);
        }
        return () => { // Cleanup on unmount
            clearInterval(sessionTimer.current);
            clearTimeout(phaseTimer.current);
            stopAllAudio();
        };
    }, [isStarted]);
    
    useEffect(() => { // Breath cycle effect
        if(isStarted) {
            const current = BREATH_CYCLE[breathPhase];
            phaseTimer.current = setTimeout(() => {
                const nextPhase = current.next;
                setBreathPhase(nextPhase);
                playBreathSound(nextPhase);
            }, current.duration);
        }
    }, [isStarted, breathPhase, playBreathSound]);


    if (!isStarted) {
        const soundscapeOptions = { 'None': 'none', 'Gentle Rain': 'rain', 'Ocean Waves': 'waves' };
        return (
            <div className="w-full text-center flex flex-col items-center justify-center h-[500px]">
                <h2 className="text-2xl font-bold mb-4">Focus Meditation</h2>
                <p className="mb-6">Select a duration for your session.</p>
                <div className="flex space-x-4">
                    {[1, 5, 10, 15].map(min => (
                        <button key={min} onClick={() => startSession(min)} className="px-6 py-2 bg-sky-500 hover:bg-sky-600 rounded-lg font-semibold transition-colors">{min} Min</button>
                    ))}
                </div>
                <div className="mt-8 pt-6 border-t border-white/10 w-full">
                    <p className="mb-4">Select a background soundscape.</p>
                    <div className="flex space-x-4 justify-center">
                        {Object.entries(soundscapeOptions).map(([name, key]) => (
                            <button key={key} onClick={() => setSelectedTrack(key)} 
                                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${selectedTrack === key ? 'bg-indigo-500' : 'bg-white/10 hover:bg-white/20'}`}>
                                {name}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        );
    }
    
    const currentPhase = BREATH_CYCLE[breathPhase];
    const formatTime = (seconds) => `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`;

    return (
        <div className="w-full text-center flex flex-col items-center justify-center h-[500px]">
             <p className="text-3xl font-semibold mb-8">{currentPhase.text}</p>
             <div 
                className={`w-48 h-48 rounded-full transition-all ease-in-out ${currentPhase.color} ${currentPhase.scale}`}
                style={{ transitionDuration: `${currentPhase.duration}ms` }}
             />
             <p className="text-xl mt-8">Time Remaining: {formatTime(timeRemaining)}</p>
        </div>
    );
};

// --- Main App Component (Unchanged) ---

export default function FocusTrainingApp() {
  const [currentScreen, setCurrentScreen] = useState('menu');
  const [score, setScore] = useState(60);
  const [streak, setStreak] = useState(6);
  const [sessionTime, setSessionTime] = useState(33);

  useEffect(() => {
    let timer;
    if (currentScreen !== 'menu') {
      timer = setInterval(() => {
        setSessionTime(t => t + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [currentScreen]);

  const updateStats = useCallback(({ score: scoreChange, streak: streakChange }) => {
    if (scoreChange) {
      setScore(s => Math.max(0, s + scoreChange));
    }
    if (streakChange === 'inc') {
      setStreak(s => s + 1);
    } else if (streakChange !== undefined) {
      setStreak(streakChange);
    }
  }, []);

  const resetProgress = () => {
    setScore(0);
    setStreak(0);
    setSessionTime(0);
  };

  const renderScreen = () => {
    const exerciseProps = {
      updateStats,
      score,
      session: sessionTime,
      streak,
    };
    switch (currentScreen) {
      case 'sustainedAttention':
        return <SustainedAttention {...exerciseProps} />;
      case 'interferenceControl':
        return <InterferenceControl {...exerciseProps} />;
      case 'attentionSwitching':
        return <AttentionSwitching {...exerciseProps} />;
      case 'visualTracking':
        return <VisualTracking {...exerciseProps} />;
      case 'focusMeditation':
        return <FocusMeditation />;
      default:
        return (
          <>
            <div className="text-center mb-8">
              <div className="flex justify-center items-center space-x-3 mb-2">
                <IoScanOutline className="text-3xl" />
                <h1 className="text-3xl font-bold text-white">Focus Training</h1>
              </div>
              <p className="text-gray-300">Scientifically-designed exercises to improve concentration and attention</p>
            </div>
            
            <StatDisplay score={score} session={sessionTime} streak={streak} />

            <div className="space-y-4">
              <MainMenuButton
                icon={<IoEyeOutline />}
                title="Sustained Attention"
                description="Maintain focus on rare targets"
                benefit="Improves vigilance and sustained concentration"
                onClick={() => setCurrentScreen('sustainedAttention')}
              />
              <MainMenuButton
                icon={<IoGitNetworkOutline />}
                title="Interference Control"
                description="Ignore distracting information"
                benefit="Enhances ability to filter distractions"
                onClick={() => setCurrentScreen('interferenceControl')}
              />
              <MainMenuButton
                icon={<IoFlashOutline />}
                title="Attention Switching"
                description="Rapidly switch between tasks"
                benefit="Improves mental flexibility and task switching"
                onClick={() => setCurrentScreen('attentionSwitching')}
              />
              <MainMenuButton
                icon={<IoLocateOutline />}
                title="Visual Tracking"
                description="Track multiple moving objects"
                benefit="Enhances spatial attention and tracking"
                onClick={() => setCurrentScreen('visualTracking')}
              />
              <MainMenuButton
                icon={<IoBodyOutline />}
                title="Focus Meditation"
                description="Guided breathing exercises"
                benefit="Builds baseline attention and mindfulness"
                onClick={() => setCurrentScreen('focusMeditation')}
              />
            </div>

            <div className="mt-8 text-center">
              <button
                onClick={resetProgress}
                className="flex items-center justify-center mx-auto space-x-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
              >
                <IoRefreshOutline />
                <span>Reset Progress</span>
              </button>
            </div>
          </>
        );
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#2a2a45] via-[#3a204a] to-[#5d2b4f] text-white font-sans flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <GlassCard className="relative">
          {currentScreen !== 'menu' && (
            <button
              onClick={() => setCurrentScreen('menu')}
              className="absolute top-4 left-4 text-2xl text-gray-300 hover:text-white transition-colors z-10"
            >
              <IoArrowBackOutline />
            </button>
          )}
          {renderScreen()}
        </GlassCard>
      </div>
    </div>
  );
}