import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useMeditationAudio } from '../hooks/useMeditationAudio';
import { IoRainyOutline, IoLeafOutline, IoSparklesOutline, IoVolumeMuteOutline, IoVolumeMediumOutline } from 'react-icons/io5';
import { TbWaveSine } from 'react-icons/tb';

const SoundscapeControls = ({ onTrackSelect, onVolumeChange, selectedTrack, backgroundVolume }) => {
    const SOUNDSCAPES = [
        { key: 'none', name: 'None', icon: <IoVolumeMuteOutline /> },
        { key: 'rain', name: 'Rain', icon: <IoRainyOutline /> },
        { key: 'waves', name: 'Waves', icon: <TbWaveSine /> },
        { key: 'forest', name: 'Forest', icon: <IoLeafOutline /> },
        { key: 'cosmic', name: 'Cosmic', icon: <IoSparklesOutline /> },
    ];
    
    return (
        <div className="w-full max-w-md mx-auto p-4 pt-0">
             <div className="flex items-center justify-center space-x-2 mb-3">
                {SOUNDSCAPES.map(({ key, icon }) => (
                    <button 
                        key={key} 
                        onClick={() => onTrackSelect(key)} 
                        title={key.charAt(0).toUpperCase() + key.slice(1)}
                        className={`w-12 h-12 flex items-center justify-center text-2xl rounded-lg transition-all border-2 ${selectedTrack === key ? 'bg-indigo-500 border-indigo-300 text-white' : 'bg-white/10 border-transparent hover:border-white/30 hover:bg-white/20 text-gray-300'}`}
                    >
                        {icon}
                    </button>
                ))}
            </div>
            <div className="flex items-center space-x-3">
                <IoVolumeMediumOutline className="text-xl text-gray-400" />
                <input 
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={backgroundVolume}
                    onChange={onVolumeChange}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                    disabled={selectedTrack === 'none'}
                />
            </div>
        </div>
    );
};


export default function FocusMeditation() {
    const [gameState, setGameState] = useState('selection');
    const [timeRemaining, setTimeRemaining] = useState(0);
    const [breathPhase, setBreathPhase] = useState('pause'); 
    const [selectedTrack, setSelectedTrack] = useState('none');
    const [backgroundVolume, setBackgroundVolume] = useState(0.5);

    const { initAudio, playBreathSound, playBackgroundSound, stopAllAudio, updateBackgroundVolume } = useMeditationAudio();
    
    const phaseTimer = useRef(null);
    const sessionTimer = useRef(null);

    const BREATH_CYCLE = {
        inhale: { next: 'hold', duration: 4000, text: 'Inhale...', circleColor: 'bg-sky-400', shadowColor: 'shadow-sky-300/50', scale: 'scale-110', bgGradient: 'from-sky-900/40 to-indigo-900/40' },
        hold: { next: 'exhale', duration: 2000, text: 'Hold', circleColor: 'bg-sky-300', shadowColor: 'shadow-sky-200/50', scale: 'scale-110', bgGradient: 'from-sky-900/40 to-indigo-900/40' },
        exhale: { next: 'pause', duration: 4000, text: 'Exhale...', circleColor: 'bg-indigo-400', shadowColor: 'shadow-indigo-300/50', scale: 'scale-100', bgGradient: 'from-indigo-900/60 to-slate-900/60' },
        pause: { next: 'inhale', duration: 2000, text: 'Pause', circleColor: 'bg-indigo-300', shadowColor: 'shadow-indigo-200/50', scale: 'scale-100', bgGradient: 'from-indigo-900/60 to-slate-900/60' },
    };

    const handleVolumeChange = (e) => {
        const newVolume = parseFloat(e.target.value);
        setBackgroundVolume(newVolume);
        updateBackgroundVolume(newVolume);
    };
    
    const handleTrackSelect = (track) => {
        setSelectedTrack(track);
        if (gameState === 'running') {
            playBackgroundSound(track, backgroundVolume);
        }
    }

    // This function only initializes and sets state now.
    const startSession = async (minutes) => {
        await initAudio();
        setTimeRemaining(minutes * 60);
        setBreathPhase('inhale'); // Set initial phase
        setGameState('running');  // This triggers the useEffects
    };
    
    // Cleanup effect for unmounting
    useEffect(() => {
        return () => {
            clearInterval(sessionTimer.current);
            clearTimeout(phaseTimer.current);
            stopAllAudio();
        };
    }, [stopAllAudio]);
    
    // *** FIX: This useEffect now controls the entire session lifecycle ***
    useEffect(() => {
        if (gameState === 'running') {
            // Start background and first breath sound
            playBackgroundSound(selectedTrack, backgroundVolume);
            playBreathSound(breathPhase);

            // Set up the session timer
            sessionTimer.current = setInterval(() => {
                setTimeRemaining(t => {
                    if (t <= 1) {
                        setGameState('complete');
                        return 0;
                    }
                    return t - 1;
                });
            }, 1000);

            // Set up the breath cycle timer
            const current = BREATH_CYCLE[breathPhase];
            phaseTimer.current = setTimeout(() => {
                setBreathPhase(current.next);
            }, current.duration);
        } else {
            // Cleanup when gameState changes from 'running'
            clearInterval(sessionTimer.current);
            clearTimeout(phaseTimer.current);
            stopAllAudio();
        }

    }, [gameState, breathPhase]); // This hook now perfectly syncs with the state

    if (gameState === 'selection' || gameState === 'complete') {
        return (
            <div className="w-full text-center flex flex-col items-center justify-center h-[500px] animate-fade-in">
                {gameState === 'complete' ? (
                    <>
                        <h2 className="text-3xl font-bold mb-4">Session Complete</h2>
                        <p className="mb-8 text-lg">Well done.</p>
                    </>
                ) : (
                    <>
                        <h2 className="text-2xl font-bold mb-4">Focus Meditation</h2>
                        <p className="mb-6">Select a duration for your session.</p>
                    </>
                )}

                <div className="flex space-x-4">
                    {[1, 5, 10, 15].map(min => (
                        <button key={min} onClick={() => startSession(min)} className="px-6 py-2 bg-sky-500 hover:bg-sky-600 rounded-lg font-semibold transition-colors">{min} Min</button>
                    ))}
                </div>
                <div className="mt-8 pt-6 border-t border-white/10 w-full">
                    <p className="mb-4">Ambiance & Volume</p>
                    <SoundscapeControls 
                        selectedTrack={selectedTrack}
                        backgroundVolume={backgroundVolume}
                        onTrackSelect={handleTrackSelect}
                        onVolumeChange={handleVolumeChange}
                    />
                </div>
            </div>
        );
    }

    const currentPhase = BREATH_CYCLE[breathPhase];
    const formatTime = (seconds) => `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`;

    return (
        <div className="w-full flex flex-col h-[500px] relative">
             <div className={`absolute inset-0 transition-all duration-1000 bg-gradient-to-br ${currentPhase.bgGradient} rounded-xl`}></div>
             
             <div className="relative z-10 flex-grow flex flex-col items-center justify-center text-center p-4">
                <p className="text-xl font-mono mb-2 text-gray-300">
                    {formatTime(timeRemaining)}
                </p>
                <p className="text-3xl font-semibold mb-6">
                    {currentPhase.text}
                </p>
                <div 
                    className={`w-48 h-48 rounded-full transition-all ease-in-out shadow-2xl ${currentPhase.circleColor} ${currentPhase.scale} ${currentPhase.shadowColor} animate-pulse`}
                    style={{ animationDuration: '4s', transitionDuration: `${currentPhase.duration}ms` }}
                />
             </div>
             
             <div className="relative z-10 pb-4">
                <SoundscapeControls 
                    selectedTrack={selectedTrack}
                    backgroundVolume={backgroundVolume}
                    onTrackSelect={handleTrackSelect}
                    onVolumeChange={handleVolumeChange}
                />
             </div>
        </div>
    );
};