import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Swords, Shield, Zap } from 'lucide-react';
import { useAudio } from '../../contexts/AudioContext';
import { ActionGameConfig } from '../../lib/games/actionGameTypes';

interface BossIntroCutsceneProps {
  gameConfig: ActionGameConfig;
  isOpen: boolean;
  onStartGame: () => void;
  wardenColorHex: string;
}

export const BossIntroCutscene: React.FC<BossIntroCutsceneProps> = ({
  gameConfig,
  isOpen,
  onStartGame,
  wardenColorHex,
}) => {
  const { playSfx } = useAudio();

  useEffect(() => {
    if (!isOpen) return;

    // Dramatic sound sequence
    playSfx('taiko-heavy');
    const timer1 = setTimeout(() => {
      playSfx('clash');
    }, 600);

    const timer2 = setTimeout(() => {
      onStartGame();
    }, 2800);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [isOpen, onStartGame, playSfx]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a0a0a] select-none overflow-hidden">
        {/* Living Ink Background Wash */}
        <div
          className="absolute inset-0 opacity-20 pointer-events-none blur-3xl"
          style={{
            background: `radial-gradient(circle at 75% 50%, ${wardenColorHex}, transparent 60%), radial-gradient(circle at 25% 50%, #b3312c, transparent 60%)`,
          }}
        />

        {/* Diagonal screen split line */}
        <motion.div
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="absolute inset-y-0 left-1/2 w-0.5 bg-gradient-to-b from-transparent via-[#f4ebd0]/40 to-transparent -translate-x-1/2 pointer-events-none"
        />

        {/* Left Side: Challenger (Shadow Wanderer) */}
        <motion.div
          initial={{ x: -200, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="absolute left-6 md:left-24 top-1/2 -translate-y-1/2 flex flex-col items-start space-y-3"
        >
          <div className="flex items-center gap-2 text-xs font-mono text-[#b3312c] bg-[#b3312c]/15 px-3 py-1 rounded-full border border-[#b3312c]/30">
            <Swords size={14} />
            <span>CHALLENGER</span>
          </div>

          <h2 className="font-serif text-2xl md:text-4xl font-bold tracking-widest text-[#f4ebd0]">
            SHADOW WANDERER
          </h2>

          <p className="text-xs md:text-sm font-mono text-[#f4ebd0]/50 tracking-wider">
            Reclaimer of the Vermilion Seals
          </p>

          <div className="w-24 h-32 md:w-32 md:h-44 rounded-2xl bg-[#141414] border-2 border-[#333] flex items-center justify-center shadow-2xl relative overflow-hidden">
            <div className="w-16 h-24 bg-black rounded-t-full relative flex items-center justify-center">
              <div className="w-1.5 h-0.5 bg-red-500 rounded-full shadow-[0_0_8px_red]" />
            </div>
            <div className="absolute bottom-2 left-2 text-[10px] font-mono text-[#f4ebd0]/40">
              RONIN-01
            </div>
          </div>
        </motion.div>

        {/* Center: Dramatic VS Emblem & Trial Title */}
        <motion.div
          initial={{ scale: 3, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.35, duration: 0.4, type: 'spring', stiffness: 200 }}
          className="relative z-20 flex flex-col items-center text-center space-y-4 px-4"
        >
          <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-[#181818] border-2 border-[#e0a96d] flex items-center justify-center shadow-2xl shadow-black">
            <span className="font-serif text-xl md:text-2xl font-extrabold text-[#f4ebd0]">
              VS
            </span>
          </div>

          <div className="space-y-1">
            <div className="text-xs font-mono tracking-widest uppercase text-[#e0a96d]">
              SACRED TRIAL
            </div>
            <h1 className="font-serif text-3xl md:text-5xl font-black tracking-wider text-white drop-shadow-md">
              {gameConfig.title.toUpperCase()}
            </h1>
            <p className="text-xs md:text-sm font-mono text-[#f4ebd0]/70 tracking-wider">
              {gameConfig.subtitle}
            </p>
          </div>

          <button
            onClick={() => {
              playSfx('clash');
              onStartGame();
            }}
            className="px-6 py-2.5 rounded-xl bg-[#e0a96d] hover:bg-[#ecc089] text-[#141414] font-serif font-bold text-xs tracking-wider uppercase transition shadow-lg flex items-center gap-2"
          >
            <Zap size={15} />
            <span>Engage Battle</span>
          </button>
        </motion.div>

        {/* Right Side: Warden Guardian */}
        <motion.div
          initial={{ x: 200, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="absolute right-6 md:right-24 top-1/2 -translate-y-1/2 flex flex-col items-end space-y-3 text-right"
        >
          <div
            className="flex items-center gap-2 text-xs font-mono px-3 py-1 rounded-full border"
            style={{
              borderColor: `${wardenColorHex}50`,
              color: wardenColorHex,
              backgroundColor: `${wardenColorHex}15`,
            }}
          >
            <Shield size={14} />
            <span>WARDEN GUARDIAN</span>
          </div>

          <h2
            className="font-serif text-2xl md:text-4xl font-bold tracking-widest"
            style={{ color: wardenColorHex }}
          >
            {gameConfig.warden.toUpperCase()}
          </h2>

          <p className="text-xs md:text-sm font-mono text-[#f4ebd0]/50 tracking-wider">
            {gameConfig.region}
          </p>

          <div
            className="w-24 h-32 md:w-32 md:h-44 rounded-2xl bg-[#141414] border-2 flex items-center justify-center shadow-2xl relative overflow-hidden"
            style={{ borderColor: `${wardenColorHex}60` }}
          >
            <div className="w-16 h-24 bg-[#1b1b1b] rounded-t-full relative flex items-center justify-center">
              <div
                className="w-1.5 h-0.5 rounded-full"
                style={{
                  backgroundColor: wardenColorHex,
                  boxShadow: `0 0 8px ${wardenColorHex}`,
                }}
              />
            </div>
            <div
              className="absolute bottom-2 right-2 text-[10px] font-mono"
              style={{ color: wardenColorHex }}
            >
              WARDEN
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
