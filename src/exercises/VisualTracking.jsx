import React, { useState, useEffect, useCallback, useRef } from 'react';

export default function VisualTracking({ updateStats }) {
    const [level, setLevel] = useState(1);
    const [phase, setPhase] = useState('identify');
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
        const targetIndices = new Set();
        while (targetIndices.size < numTargets) targetIndices.add(Math.floor(Math.random() * totalDots));
        for (let i = 0; i < totalDots; i++) {
            newDots.push({ id: i, x: Math.random() * (width - 20) + 10, y: Math.random() * (height - 20) + 10, vx: (Math.random() - 0.5) * 2, vy: (Math.random() - 0.5) * 2, isTarget: targetIndices.has(i), isSelected: false, });
        }
        setDots(newDots);
    }, [level, totalDots, numTargets]);

    useEffect(() => { generateDots(); }, [generateDots]);

    useEffect(() => {
        if (phase === 'identify') { const timer = setTimeout(() => setPhase('track'), 3000); return () => clearTimeout(timer); }
        if (phase === 'track') {
            const trackTimer = setTimeout(() => { setPhase('select'); cancelAnimationFrame(animationFrameId.current); }, 5000);
            const animate = () => {
                setDots(prevDots => {
                    if (!containerRef.current) return prevDots;
                    const { width, height } = containerRef.current.getBoundingClientRect();
                    return prevDots.map(dot => {
                        let newX = dot.x + dot.vx, newY = dot.y + dot.vy, newVx = dot.vx, newVy = dot.vy;
                        if (newX <= 10 || newX >= width - 10) newVx = -newVx;
                        if (newY <= 10 || newY >= height - 10) newVy = -newVy;
                        return { ...dot, x: newX, y: newY, vx: newVx, vy: newVy };
                    });
                });
                animationFrameId.current = requestAnimationFrame(animate);
            };
            animationFrameId.current = requestAnimationFrame(animate);
            return () => { clearTimeout(trackTimer); cancelAnimationFrame(animationFrameId.current); };
        }
    }, [phase]);

    const handleDotClick = (id) => { if (phase === 'select') setDots(dots.map(dot => (dot.id === id ? { ...dot, isSelected: !dot.isSelected } : dot))); };

    const handleSubmit = () => {
        let correctSelections = 0, incorrectSelections = 0;
        dots.forEach(dot => {
            if (dot.isSelected) {
                if (dot.isTarget) correctSelections++;
                else incorrectSelections++;
            }
        });
        const isPerfect = correctSelections === numTargets && incorrectSelections === 0;
        const points = (correctSelections * 20) - (incorrectSelections * 10) + (isPerfect ? 50 : 0);
        updateStats({ score: points, streak: isPerfect ? 'inc' : 0 });
        setFeedback(`You found ${correctSelections} of ${numTargets} targets! ${isPerfect ? "+50 Perfect Bonus!" : ""}`);
        if(isPerfect) setLevel(l => l + 1);
        setPhase('result');
    };

    const handleNextRound = () => { setPhase('identify'); setFeedback(''); generateDots(); };
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
            <h2 className="text-2xl font-bold mb-2">Visual Tracking</h2>
            <p className="mb-4 text-sky-300 h-6">{getPhaseInstructions()}</p>
            <div ref={containerRef} className="w-full h-96 bg-slate-800/50 rounded-lg relative overflow-hidden">
                {dots.map(dot => <div key={dot.id} onClick={() => handleDotClick(dot.id)} className="w-5 h-5 rounded-full absolute transition-colors duration-300" style={{ transform: `translate(${dot.x - 10}px, ${dot.y - 10}px)`, backgroundColor: phase === 'result' && dot.isTarget ? '#22c55e' : phase === 'result' && dot.isSelected && !dot.isTarget ? '#ef4444' : dot.isSelected ? '#eab308' : phase === 'identify' && dot.isTarget ? '#ef4444' : '#3b82f6', cursor: phase === 'select' ? 'pointer' : 'default' }} /> )}
            </div>
            {phase === 'select' && <button onClick={handleSubmit} className="mt-4 px-6 py-2 bg-sky-500 hover:bg-sky-600 rounded-lg font-semibold transition-colors">Submit</button>}
            {phase === 'result' && <button onClick={handleNextRound} className="mt-4 px-6 py-2 bg-sky-500 hover:bg-sky-600 rounded-lg font-semibold transition-colors">Next Round</button>}
        </div>
    );
};