import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Volume2,
  VolumeX,
  Zap,
} from 'lucide-react';
import { useAudio } from '../../../contexts/AudioContext';
import { useSpectrum } from '../../../contexts/SpectrumContext';
import { useSaveGame } from '../../../contexts/SaveGameContext';
import confetti from 'canvas-confetti';

type DrawState = 'idle' | 'waiting' | 'signal' | 'false-start' | 'result';

interface QuickDrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVictory?: () => void;
}

export const QuickDrawModal: React.FC<QuickDrawModalProps> = ({
  isOpen,
  onClose,
  onVictory,
}) => {
  const { isMuted, toggleMute, playSfx } = useAudio();
  const { unlockPigment, hasPigment } = useSpectrum();
  const { stampSeal, recordGameResult } = useSaveGame();

  const [state, setState] = useState<DrawState>('idle');
  const [reactionTime, setReactionTime] = useState<number | null>(null);
  const [bestTime, setBestTime] = useState<number | null>(null);
  const [playerWins, setPlayerWins] = useState<number>(0);
  const [courierWins, setCourierWins] = useState<number>(0);

  const signalTimeRef = useRef<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startRound = () => {
    setState('waiting');
    setReactionTime(null);
    playSfx('parchment');

    // Random delay between 2000ms and 5000ms
    const delay = Math.floor(2000 + Math.random() * 3000);

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setState('signal');
      signalTimeRef.current = performance.now();
      playSfx('clash');
    }, delay);
  };

  const handleStrike = () => {
    if (state === 'idle') {
      startRound();
      return;
    }

    if (state === 'waiting') {
      // False start!
      if (timerRef.current) clearTimeout(timerRef.current);
      setState('false-start');
      setCourierWins((w) => w + 1);
      playSfx('heavy-strike');
      return;
    }

    if (state === 'signal') {
      const elapsed = Math.round(performance.now() - signalTimeRef.current);
      setReactionTime(elapsed);
      setState('result');

      // The Phantom Courier reacts between 240ms and 320ms
      const courierTime = Math.floor(240 + Math.random() * 70);

      if (elapsed < courierTime) {
        setPlayerWins((w) => w + 1);
        playSfx('victory');

        if (!bestTime || elapsed < bestTime) {
          setBestTime(elapsed);
        }

        if (playerWins + 1 >= 3) {
          playSfx('seal-stamp');
          confetti({ particleCount: 70, spread: 80, origin: { y: 0.6 } });

          recordGameResult('quick-draw', true, Math.max(100, 1000 - elapsed));
          if (!hasPigment('rushing-teal')) {
            unlockPigment('rushing-teal');
            stampSeal('rushing-teal', Math.max(100, 1000 - elapsed));
          }
          onVictory?.();
        }
      } else {
        setCourierWins((w) => w + 1);
        playSfx('heavy-strike');
      }
    }
  };

  // Keyboard shortcut (Space)
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        handleStrike();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  const resetDuel = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setState('idle');
    setPlayerWins(0);
    setCourierWins(0);
    setReactionTime(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/90 backdrop-blur-md select-none overflow-hidden font-sans">
      <div className="relative w-full h-full max-w-3xl max-h-[85vh] bg-[#141414] border-2 border-[#0077b6] rounded-2xl flex flex-col shadow-2xl shadow-[#0077b6]/20 overflow-hidden text-[#f4ebd0]">
        {/* Header */}
        <header className="flex items-center justify-between px-4 py-3 bg-[#131f28] border-b border-[#1f3545] shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (timerRef.current) clearTimeout(timerRef.current);
                playSfx('click');
                onClose();
              }}
              className="p-1.5 rounded-lg bg-[#182a38] hover:bg-[#20374a] border border-[#2b4b63] text-[#f4ebd0]/70 hover:text-white transition flex items-center gap-1 text-xs font-mono"
            >
              <X size={16} />
              <span className="hidden sm:inline">Exit</span>
            </button>
            <div>
              <div className="flex items-center gap-2">
                <Zap size={18} className="text-[#0077b6]" />
                <h2 className="font-serif font-bold text-sm sm:text-base text-[#f4ebd0]">
                  Bamboo Quick-Draw
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-[#0077b6]/40 text-[#0077b6] bg-[#0077b6]/10">
                  The River Crossings
                </span>
              </div>
              <p className="text-[11px] text-[#f4ebd0]/50 font-mono">
                Iaido Reflex Duel vs The Phantom Courier • Best of 5
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleMute}
              className="p-2 rounded-lg bg-[#182a38] hover:bg-[#20374a] border border-[#2b4b63] text-[#f4ebd0]/70 hover:text-white transition"
            >
              {isMuted ? <VolumeX size={16} className="text-red-400" /> : <Volume2 size={16} />}
            </button>
          </div>
        </header>

        {/* Duel Area */}
        <div
          onClick={handleStrike}
          className={`flex-1 flex flex-col items-center justify-center p-6 cursor-pointer transition-colors ${
            state === 'signal'
              ? 'bg-[#b3312c]'
              : state === 'false-start'
              ? 'bg-red-950'
              : 'bg-[#0e171e]'
          }`}
        >
          {/* Score Counter */}
          <div className="absolute top-16 flex items-center gap-8 text-sm font-mono">
            <span className="text-[#0077b6] font-bold">You: {playerWins}</span>
            <span className="text-[#f4ebd0]/40">First to 3</span>
            <span className="text-red-400 font-bold">Courier: {courierWins}</span>
          </div>

          {/* Central Visual */}
          {state === 'idle' && (
            <div className="text-center space-y-4">
              <span className="text-6xl sm:text-8xl font-serif text-[#f4ebd0]/30 font-bold">
                抜刀
              </span>
              <p className="text-sm font-mono text-[#0077b6]">
                Click Anywhere or Press SPACE to Begin
              </p>
            </div>
          )}

          {state === 'waiting' && (
            <div className="text-center space-y-4">
              <span className="text-6xl sm:text-8xl font-serif text-[#f4ebd0]/50 animate-pulse font-bold">
                待
              </span>
              <p className="text-xs font-mono text-amber-400 tracking-widest uppercase">
                Hold your breath... Wait for the signal!
              </p>
            </div>
          )}

          {state === 'signal' && (
            <div className="text-center space-y-2">
              <span className="text-8xl sm:text-9xl font-serif font-black text-white drop-shadow-[0_0_30px_#fff]">
                斬!
              </span>
              <p className="text-sm font-mono text-white font-bold tracking-widest uppercase">
                STRIKE NOW!
              </p>
            </div>
          )}

          {state === 'false-start' && (
            <div className="text-center space-y-3">
              <span className="text-5xl sm:text-6xl font-serif font-bold text-red-400">
                FALSE START!
              </span>
              <p className="text-xs font-mono text-[#f4ebd0]/70">
                You struck before the kanji flashed. Round ceded to The Phantom Courier!
              </p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  startRound();
                }}
                className="px-4 py-2 rounded-lg bg-[#b3312c] text-white font-bold text-xs"
              >
                Next Bout
              </button>
            </div>
          )}

          {state === 'result' && (
            <div className="text-center space-y-3">
              <div className="text-4xl sm:text-6xl font-mono font-bold text-[#0077b6]">
                {reactionTime} ms
              </div>
              <p className="text-xs font-mono text-[#f4ebd0]/80">
                {reactionTime! < 240
                  ? '⚡ Godlike Iaido Slash! Clean decapitating strike.'
                  : reactionTime! < 310
                  ? '🗡️ Swift Ronin timing! Opponent struck down.'
                  : '❌ Too slow! The Courier parried and retaliated.'}
              </p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (playerWins >= 3 || courierWins >= 3) {
                    resetDuel();
                  } else {
                    startRound();
                  }
                }}
                className="px-4 py-2 rounded-lg bg-[#0077b6] text-white font-bold text-xs hover:bg-[#0096c7]"
              >
                {playerWins >= 3 || courierWins >= 3 ? 'Restart Duel' : 'Next Round'}
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="px-4 py-2.5 bg-[#101920] border-t border-[#1f3545] flex items-center justify-between text-xs font-mono text-[#f4ebd0]/60">
          <span>Click screen or Press [SPACE] to strike</span>
          {bestTime && <span>Best Speed: {bestTime} ms</span>}
        </footer>
      </div>
    </div>
  );
};
