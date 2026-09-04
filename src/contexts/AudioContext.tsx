import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

export type ProceduralSfxType =
  | 'clash'
  | 'heavy-strike'
  | 'parry'
  | 'ink-splash'
  | 'taiko'
  | 'taiko-heavy'
  | 'parchment'
  | 'wind'
  | 'seal-stamp'
  | 'click'
  | 'victory';

export interface AudioContextValue {
  masterVolume: number;
  sfxVolume: number;
  bgmVolume: number;
  isMuted: boolean;
  setMasterVolume: (v: number) => void;
  setSfxVolume: (v: number) => void;
  setBgmVolume: (v: number) => void;
  toggleMute: () => void;
  playSfx: (type: ProceduralSfxType) => void;
  playExternalSound: (url: string) => void;
}

const STORAGE_KEY = 'shadow_realm_audio_settings_v1';

const AudioContext = createContext<AudioContextValue | undefined>(undefined);

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [masterVolume, setMasterVolume] = useState<number>(0.8);
  const [sfxVolume, setSfxVolume] = useState<number>(0.9);
  const [bgmVolume, setBgmVolume] = useState<number>(0.6);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  const audioCtxRef = useRef<AudioContext | null>(null);

  // Initialize or resume Web Audio Context on first interaction
  const getAudioContext = (): AudioContext | null => {
    if (typeof window === 'undefined') return null;
    if (!audioCtxRef.current) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        audioCtxRef.current = new AudioCtxClass();
      }
    }
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume().catch(() => {});
    }
    return audioCtxRef.current;
  };

  // Load saved settings
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.masterVolume === 'number') setMasterVolume(parsed.masterVolume);
        if (typeof parsed.sfxVolume === 'number') setSfxVolume(parsed.sfxVolume);
        if (typeof parsed.bgmVolume === 'number') setBgmVolume(parsed.bgmVolume);
        if (typeof parsed.isMuted === 'boolean') setIsMuted(parsed.isMuted);
      }
    } catch (e) {
      console.warn('Failed to load audio settings:', e);
    }
  }, []);

  // Persist settings
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ masterVolume, sfxVolume, bgmVolume, isMuted })
      );
    } catch (e) {
      console.warn('Failed to save audio settings:', e);
    }
  }, [masterVolume, sfxVolume, bgmVolume, isMuted]);

  const toggleMute = () => setIsMuted((prev) => !prev);

  // Procedural Web Audio API sound synthesizer
  const playSfx = (type: ProceduralSfxType) => {
    if (isMuted) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const finalVolume = masterVolume * sfxVolume;
    const now = ctx.currentTime;

    switch (type) {
      case 'clash': {
        // High pitched metallic katana blade ring
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(1480, now);
        osc.frequency.exponentialRampToValueAtTime(320, now + 0.18);

        gain.gain.setValueAtTime(finalVolume * 0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.22);
        break;
      }

      case 'parry': {
        // High resonance bell/deflection chime
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(2200, now);
        osc.frequency.exponentialRampToValueAtTime(1800, now + 0.35);

        gain.gain.setValueAtTime(finalVolume * 0.5, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.35);
        break;
      }

      case 'heavy-strike': {
        // Heavy impact thud with low frequency drop
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(240, now);
        osc.frequency.exponentialRampToValueAtTime(45, now + 0.28);

        gain.gain.setValueAtTime(finalVolume * 0.7, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.3);
        break;
      }

      case 'ink-splash': {
        // Low pass noise burst
        const bufferSize = ctx.sampleRate * 0.15;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.2));
        }

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, now);
        filter.frequency.linearRampToValueAtTime(200, now + 0.15);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(finalVolume * 0.5, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        noise.start(now);
        break;
      }

      case 'taiko': {
        // Japanese Taiko drum boom
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(120, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.4);

        gain.gain.setValueAtTime(finalVolume * 0.8, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.45);
        break;
      }

      case 'taiko-heavy': {
        // Deep war drum resonance
        const osc = ctx.createOscillator();
        const sub = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(90, now);
        osc.frequency.exponentialRampToValueAtTime(32, now + 0.6);

        sub.type = 'triangle';
        sub.frequency.setValueAtTime(45, now);
        sub.frequency.exponentialRampToValueAtTime(20, now + 0.5);

        gain.gain.setValueAtTime(finalVolume * 0.9, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

        osc.connect(gain);
        sub.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        sub.start(now);
        osc.stop(now + 0.65);
        sub.stop(now + 0.65);
        break;
      }

      case 'parchment': {
        // Dry paper rustle using bandpass noise
        const bufferSize = ctx.sampleRate * 0.12;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(3000, now);
        filter.Q.value = 2;

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(finalVolume * 0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        noise.start(now);
        break;
      }

      case 'wind': {
        // Atmospheric mountain gust
        const bufferSize = ctx.sampleRate * 0.8;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(400, now);
        filter.frequency.linearRampToValueAtTime(700, now + 0.4);
        filter.frequency.linearRampToValueAtTime(350, now + 0.8);
        filter.Q.value = 5;

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(finalVolume * 0.3, now + 0.3);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        noise.start(now);
        break;
      }

      case 'seal-stamp': {
        // Vermilion ink seal stamping thud and ringing shimmer
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(110, now);
        osc.frequency.exponentialRampToValueAtTime(35, now + 0.35);

        gain.gain.setValueAtTime(finalVolume * 0.85, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

        const shimmer = ctx.createOscillator();
        const shimmerGain = ctx.createGain();
        shimmer.type = 'sine';
        shimmer.frequency.setValueAtTime(880, now + 0.05);
        shimmer.frequency.exponentialRampToValueAtTime(1320, now + 0.5);

        shimmerGain.gain.setValueAtTime(0, now);
        shimmerGain.gain.setValueAtTime(finalVolume * 0.4, now + 0.05);
        shimmerGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

        osc.connect(gain);
        gain.connect(ctx.destination);
        shimmer.connect(shimmerGain);
        shimmerGain.connect(ctx.destination);

        osc.start(now);
        shimmer.start(now + 0.05);
        osc.stop(now + 0.4);
        shimmer.stop(now + 0.5);
        break;
      }

      case 'victory': {
        // Aristocratic feudal triumphant chord progression
        const notes = [440, 554.37, 659.25, 880]; // A major
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const delay = idx * 0.08;

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + delay);

          gain.gain.setValueAtTime(0, now);
          gain.gain.setValueAtTime(finalVolume * 0.3, now + delay);
          gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.6);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now + delay);
          osc.stop(now + delay + 0.6);
        });
        break;
      }

      case 'click':
      default: {
        // Clean wooden bamboo tap
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(150, now + 0.04);

        gain.gain.setValueAtTime(finalVolume * 0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.04);
        break;
      }
    }
  };

  const playExternalSound = (url: string) => {
    if (isMuted) return;
    try {
      const audio = new Audio(url);
      audio.volume = masterVolume * sfxVolume;
      audio.play().catch(() => {});
    } catch (e) {
      console.warn('Failed to play sound:', url, e);
    }
  };

  return (
    <AudioContext.Provider
      value={{
        masterVolume,
        sfxVolume,
        bgmVolume,
        isMuted,
        setMasterVolume,
        setSfxVolume,
        setBgmVolume,
        toggleMute,
        playSfx,
        playExternalSound,
      }}
    >
      {children}
    </AudioContext.Provider>
  );
};

export const useAudio = (): AudioContextValue => {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
};
