// src/hooks/useMeditationAudio.js

import { useRef, useCallback } from 'react';

// This custom hook encapsulates all Web Audio API logic for the meditation exercise.
export const useMeditationAudio = () => {
    const audioRef = useRef({
        context: null,
        breathOscillator: null,
        backgroundNodes: {},
        backgroundInterval: null,
        unlockInterval: null,
    });

    // NEW FUNCTION: Stops only the background audio elements
    const stopBackgroundAudio = useCallback(() => {
        const { backgroundNodes, backgroundInterval } = audioRef.current;
        
        // Stop and cleanup background audio source
        if (backgroundNodes.source) {
            try { 
                backgroundNodes.source.stop(); 
                backgroundNodes.source.disconnect();
            } catch (e) { /* Already stopped */ }
        }
        
        // Disconnect and cleanup all background nodes
        Object.values(backgroundNodes).forEach(node => {
            if (node && typeof node.disconnect === 'function') {
                try { node.disconnect(); } catch(e) {}
            }
        });

        // Clear background interval
        if (backgroundInterval) clearInterval(backgroundInterval);

        // Reset background-specific state
        audioRef.current.backgroundNodes = {};
        audioRef.current.backgroundInterval = null;
    }, []);


    const stopAllAudio = useCallback(() => {
        const { context, breathOscillator, unlockInterval } = audioRef.current;
        if (!context) return;
        
        // Use our new function to handle the background part
        stopBackgroundAudio();
        
        // Stop breath oscillator
        if (breathOscillator) {
            try { 
                breathOscillator.stop(); 
                breathOscillator.disconnect();
            } catch (e) { /* Already stopped */ }
        }

        // Clear the unlock interval
        if (unlockInterval) clearInterval(unlockInterval);

        // Reset all audio state
        audioRef.current.breathOscillator = null;
        audioRef.current.unlockInterval = null;

        // Suspend the audio context to ensure complete stop
        try {
            if (context.state !== 'suspended') {
                context.suspend();
            }
        } catch (e) {
            console.error('Error suspending audio context:', e);
        }
    }, [stopBackgroundAudio]); // dependency added

    const playBreathSound = useCallback((phase) => {
        const { context } = audioRef.current;
        if (!context) return;
        
        try {
            if (context.state === 'suspended') {
                context.resume();
            }

            const now = context.currentTime;

            if (audioRef.current.breathOscillator) { 
                try { audioRef.current.breathOscillator.stop(now); } catch (e) {} 
            }

            if (phase === 'inhale' || phase === 'exhale') {
                const oscillator = context.createOscillator();
                const gainNode = context.createGain();
                oscillator.type = 'sine';
                const startFreq = 261.63, endFreq = 392.00;
                
                oscillator.frequency.setValueAtTime(phase === 'inhale' ? startFreq : endFreq, now);
                oscillator.frequency.linearRampToValueAtTime(phase === 'inhale' ? endFreq : startFreq, now + 4);
                gainNode.gain.setValueAtTime(0.25, now);
                gainNode.gain.linearRampToValueAtTime(0, now + 4);
                
                // IMPORTANT: Connect the breath sound to the main destination, not through the BGM gain
                oscillator.connect(gainNode).connect(context.destination);
                oscillator.start(now);
                audioRef.current.breathOscillator = oscillator;
            }
        } catch (error) {
            console.error('Error playing breath sound:', error);
        }
    }, []);
    
    const playBackgroundSound = useCallback((track, volume) => {
        try {
            // CHANGED: Use the more specific stop function
            stopBackgroundAudio(); 
            const { context } = audioRef.current;
            if (track === 'none' || !context) return;

            if (context.state === 'suspended') {
                context.resume();
            }

            const now = context.currentTime;
            const mainGain = context.createGain();
            mainGain.gain.setValueAtTime(0, now);
            mainGain.gain.linearRampToValueAtTime(volume, now + 3);
            mainGain.connect(context.destination);
            audioRef.current.backgroundNodes.gain = mainGain;
            
            const createNoiseSource = (type) => {
                 const bufferSize = 2 * context.sampleRate;
                 const buffer = context.createBuffer(1, bufferSize, context.sampleRate);
                 const output = buffer.getChannelData(0);
                 if (type === 'pink') {
                     let b0=0,b1=0,b2=0,b3=0,b4=0,b5=0,b6=0;
                     for (let i=0; i<bufferSize; i++) {
                         const white = Math.random() * 2 - 1;
                         b0 = 0.99886*b0 + white*0.0555179; b1 = 0.99332*b1 + white*0.0750759;
                         b2 = 0.96900*b2 + white*0.1538520; b3 = 0.86650*b3 + white*0.3104856;
                         b4 = 0.55000*b4 + white*0.5329522; b5 = -0.7616*b5 - white*0.0168980;
                         output[i] = (b0+b1+b2+b3+b4+b5+b6+white*0.5362)*0.11; b6 = white*0.115926;
                     }
                 } else { // white noise
                    for (let i = 0; i < bufferSize; i++) output[i] = Math.random() * 2 - 1;
                 }
                const noise = context.createBufferSource();
                noise.buffer = buffer;
                noise.loop = true;
                return noise;
            };

            if (track === 'rain' || track === 'waves' || track === 'forest') {
                const noiseType = (track === 'waves' || track === 'forest') ? 'pink' : 'white';
                const noiseSource = createNoiseSource(noiseType);
                const filter = context.createBiquadFilter();
                filter.type = 'lowpass';
                filter.frequency.value = track === 'rain' ? 800 : 400;
                noiseSource.connect(filter).connect(mainGain);
                noiseSource.start(now);
                audioRef.current.backgroundNodes.source = noiseSource;
            }

            if (track === 'forest') {
                const interval = setInterval(() => {
                    const chirp = context.createOscillator();
                    const chirpGain = context.createGain();
                    chirp.frequency.setValueAtTime(1000 + Math.random() * 500, context.currentTime);
                    chirpGain.gain.setValueAtTime(0.2 * volume, context.currentTime);
                    chirpGain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.2);
                    chirp.connect(chirpGain).connect(mainGain);
                    chirp.start();
                    chirp.stop(context.currentTime + 0.2);
                }, 2000 + Math.random() * 3000);
                audioRef.current.backgroundInterval = interval;
            }

            if (track === 'cosmic') {
                const drone = context.createOscillator();
                drone.type = 'sine';
                drone.frequency.setValueAtTime(60, now);
                drone.connect(mainGain);
                drone.start(now);
                audioRef.current.backgroundNodes.source = drone;

                const interval = setInterval(() => {
                    const sparkle = context.createOscillator();
                    const sparkleGain = context.createGain();
                    sparkle.type = 'square';
                    sparkle.frequency.setValueAtTime(1200 + Math.random() * 800, context.currentTime);
                    sparkleGain.gain.setValueAtTime(0.1 * volume, context.currentTime);
                    sparkleGain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.1);
                    sparkle.connect(sparkleGain).connect(mainGain);
                    sparkle.start();
                    sparkle.stop(context.currentTime + 0.1);
                }, 1500 + Math.random() * 2000);
                audioRef.current.backgroundInterval = interval;
            }
        } catch (error) {
            console.error('Error playing background sound:', error);
        }
    }, [stopBackgroundAudio]); // dependency added

    const updateBackgroundVolume = useCallback((newVolume) => {
        try {
            const { backgroundNodes, context } = audioRef.current;
            if (backgroundNodes.gain && context) {
                if (context.state === 'suspended') {
                    context.resume();
                }
                backgroundNodes.gain.gain.linearRampToValueAtTime(newVolume, context.currentTime + 0.1);
            }
        } catch (error) {
            console.error('Error updating volume:', error);
        }
    }, []);

    const initAudio = async () => {
        try {
            if (!audioRef.current.context) {
                const AudioContext = window.AudioContext || window.webkitAudioContext;
                audioRef.current.context = new AudioContext();
            }
            
            const context = audioRef.current.context;
            if (context.state === 'suspended') {
                await context.resume();
            }
            
            // This silent sound part is a good robust way to handle browser policies.
            const oscillator = context.createOscillator();
            const gainNode = context.createGain();
            gainNode.gain.setValueAtTime(0, context.currentTime);
            oscillator.connect(gainNode).connect(context.destination);
            oscillator.start();
            oscillator.stop(context.currentTime + 0.001);
            
            if (audioRef.current.unlockInterval) clearInterval(audioRef.current.unlockInterval);

            const unlockInterval = setInterval(() => {
                if (context.state === 'suspended') {
                    context.resume();
                }
            }, 5000);

            audioRef.current.unlockInterval = unlockInterval;
        } catch (error) {
            console.error('Error initializing audio:', error);
            throw error;
        }
    };

    return { initAudio, playBreathSound, playBackgroundSound, stopAllAudio, updateBackgroundVolume };
};