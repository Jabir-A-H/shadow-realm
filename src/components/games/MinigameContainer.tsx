import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Volume2,
  VolumeX,
  RotateCcw,
  HelpCircle,
  Trophy,
  Skull,
  Award,
  ArrowLeft,
} from 'lucide-react';
import { useAudio } from '../../contexts/AudioContext';
import { ActionGameConfig, ActionGameResult } from '../../lib/games/actionGameTypes';
import confetti from 'canvas-confetti';

interface MinigameContainerProps {
  config: ActionGameConfig;
  isOpen: boolean;
  onClose: () => void;
  onRestart: () => void;
  result: ActionGameResult | null;
  children: React.ReactNode;
  onClaimVictory?: () => void;
  wardenColorHex?: string;
}

export const MinigameContainer: React.FC<MinigameContainerProps> = ({
  config,
  isOpen,
  onClose,
  onRestart,
  result,
  children,
  onClaimVictory,
  wardenColorHex = '#48cae4',
}) => {
  const { isMuted, toggleMute, playSfx } = useAudio();
  const [showControlsHelp, setShowControlsHelp] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/90 backdrop-blur-md select-none overflow-hidden">
      <div
        className="relative w-full h-full max-w-5xl max-h-[92vh] bg-[#141414] border-2 rounded-2xl flex flex-col shadow-2xl overflow-hidden"
        style={{ borderColor: wardenColorHex }}
      >
        {/* Top Header Bar */}
        <header className="flex items-center justify-between px-4 py-2.5 bg-[#1a1a1a] border-b border-[#282828] z-30 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                playSfx('click');
                onClose();
              }}
              className="p-1.5 rounded-lg bg-[#222] hover:bg-[#2d2d2d] border border-[#333] text-[#f4ebd0]/70 hover:text-white transition flex items-center gap-1 text-xs font-mono"
              title="Exit to Overworld"
            >
              <ArrowLeft size={16} />
              <span className="hidden sm:inline">Exit</span>
            </button>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-serif font-bold text-sm sm:text-base text-[#f4ebd0]">
                  {config.title}
                </h2>
                <span
                  className="text-[10px] font-mono px-2 py-0.5 rounded border hidden sm:inline"
                  style={{
                    borderColor: `${wardenColorHex}50`,
                    color: wardenColorHex,
                    backgroundColor: `${wardenColorHex}15`,
                  }}
                >
                  {config.region}
                </span>
              </div>
              <p className="text-[11px] text-[#f4ebd0]/50 font-mono">{config.subtitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                playSfx('click');
                setShowControlsHelp((prev) => !prev);
              }}
              className={`p-2 rounded-lg border transition ${
                showControlsHelp
                  ? 'bg-[#e0a96d]/20 border-[#e0a96d] text-[#e0a96d]'
                  : 'bg-[#222] hover:bg-[#2d2d2d] border-[#333] text-[#f4ebd0]/70 hover:text-white'
              }`}
              title="Controls Guide"
            >
              <HelpCircle size={16} />
            </button>

            <button
              onClick={() => {
                playSfx('click');
                toggleMute();
              }}
              className="p-2 rounded-lg bg-[#222] hover:bg-[#2d2d2d] border border-[#333] text-[#f4ebd0]/70 hover:text-white transition"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX size={16} className="text-red-400" /> : <Volume2 size={16} />}
            </button>

            <button
              onClick={() => {
                playSfx('click');
                onRestart();
              }}
              className="p-2 rounded-lg bg-[#222] hover:bg-[#2d2d2d] border border-[#333] text-[#f4ebd0]/70 hover:text-white transition"
              title="Restart Trial"
            >
              <RotateCcw size={16} />
            </button>

            <button
              onClick={() => {
                playSfx('click');
                onClose();
              }}
              className="p-2 rounded-lg bg-[#222] hover:bg-red-950/40 hover:border-red-600/50 border border-[#333] text-[#f4ebd0]/70 hover:text-red-300 transition"
              title="Close"
            >
              <X size={16} />
            </button>
          </div>
        </header>

        {/* Viewport Hosting Phaser Canvas */}
        <div className="relative flex-1 w-full h-full bg-[#121212] overflow-hidden">
          {children}

          {/* Controls Guide Drawer */}
          <AnimatePresence>
            {showControlsHelp && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="absolute top-3 inset-x-4 mx-auto max-w-lg z-40 bg-[#1a1a1a]/95 backdrop-blur-md border border-[#444] rounded-xl p-4 shadow-2xl text-xs space-y-3"
              >
                <div className="flex items-center justify-between pb-2 border-b border-[#2d2d2d]">
                  <span className="font-serif font-bold text-sm text-[#f4ebd0]">
                    Controls Guide — {config.title}
                  </span>
                  <button
                    onClick={() => setShowControlsHelp(false)}
                    className="text-[#f4ebd0]/50 hover:text-white"
                  >
                    <X size={14} />
                  </button>
                </div>

                <div className="space-y-1">
                  <p className="font-bold text-[#e0a96d] uppercase text-[10px] tracking-wider">
                    Keyboard Controls:
                  </p>
                  <ul className="space-y-1 text-[#f4ebd0]/80">
                    {config.controlsGuide.keyboard.map((c, i) => (
                      <li key={i} className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#b3312c]" />
                        <span>{c}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-1 pt-2 border-t border-[#2a2a2a]">
                  <p className="font-bold text-[#48cae4] uppercase text-[10px] tracking-wider">
                    Touch / Mobile Controls:
                  </p>
                  <ul className="space-y-1 text-[#f4ebd0]/80">
                    {config.controlsGuide.touch.map((c, i) => (
                      <li key={i} className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#48cae4]" />
                        <span>{c}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Game Over / Victory Modal Overlay */}
          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-40 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
              >
                <div
                  className="w-full max-w-md bg-[#181818] border-2 rounded-2xl p-6 shadow-2xl text-center space-y-5"
                  style={{ borderColor: result.won ? wardenColorHex : '#b3312c' }}
                >
                  <div className="flex flex-col items-center space-y-2">
                    <div
                      className="w-16 h-16 rounded-full flex items-center justify-center text-3xl shadow-lg"
                      style={{
                        backgroundColor: result.won ? `${wardenColorHex}25` : '#b3312c25',
                        color: result.won ? wardenColorHex : '#b3312c',
                        border: `2px solid ${result.won ? wardenColorHex : '#b3312c'}`,
                      }}
                    >
                      {result.won ? <Trophy size={32} /> : <Skull size={32} />}
                    </div>

                    <h3 className="font-serif text-2xl font-bold tracking-wider text-[#f4ebd0]">
                      {result.won ? 'VICTORY ACHIEVED' : 'DEFEATED IN TRIAL'}
                    </h3>

                    <p className="text-xs font-mono text-[#f4ebd0]/60">
                      {result.won
                        ? `You have conquered ${config.warden} in sacred combat!`
                        : 'The Warden proved superior. Regroup and challenge once more.'}
                    </p>
                  </div>

                  {/* Score & Stats Breakdown */}
                  <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-[#121212] border border-[#262626] text-left text-xs font-mono">
                    <div>
                      <span className="text-[#f4ebd0]/50">Score:</span>
                      <p className="text-sm font-bold text-[#e0a96d]">{result.score}</p>
                    </div>
                    <div>
                      <span className="text-[#f4ebd0]/50">Duration:</span>
                      <p className="text-sm font-bold text-[#f4ebd0]">
                        {result.stats.durationSeconds}s
                      </p>
                    </div>
                    {result.stats.hitsLanded !== undefined && (
                      <div>
                        <span className="text-[#f4ebd0]/50">Clean Strikes:</span>
                        <p className="text-sm font-bold text-emerald-400">
                          {result.stats.hitsLanded}
                        </p>
                      </div>
                    )}
                    {result.stats.enemiesDefeated !== undefined && (
                      <div>
                        <span className="text-[#f4ebd0]/50">Enemies Down:</span>
                        <p className="text-sm font-bold text-[#48cae4]">
                          {result.stats.enemiesDefeated}
                        </p>
                      </div>
                    )}
                    {result.stats.distanceMeters !== undefined && (
                      <div>
                        <span className="text-[#f4ebd0]/50">Distance:</span>
                        <p className="text-sm font-bold text-[#0077b6]">
                          {result.stats.distanceMeters}m
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-2 pt-2">
                    {result.won && onClaimVictory && (
                      <button
                        onClick={() => {
                          playSfx('seal-stamp');
                          try {
                            confetti({
                              particleCount: 60,
                              spread: 70,
                              origin: { y: 0.6 },
                              colors: [wardenColorHex, '#f4ebd0', '#141414'],
                            });
                          } catch {}
                          onClaimVictory();
                        }}
                        className="w-full py-3 rounded-xl font-serif text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg"
                        style={{
                          backgroundColor: wardenColorHex,
                          color: '#141414',
                        }}
                      >
                        <Award size={16} />
                        <span>Claim Vermilion Seal & Return</span>
                      </button>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => {
                          playSfx('click');
                          onRestart();
                        }}
                        className="py-2.5 rounded-xl bg-[#242424] hover:bg-[#2d2d2d] text-[#f4ebd0] border border-[#333] font-serif text-xs font-semibold transition flex items-center justify-center gap-1.5"
                      >
                        <RotateCcw size={14} />
                        <span>Rematch</span>
                      </button>

                      <button
                        onClick={() => {
                          playSfx('click');
                          onClose();
                        }}
                        className="py-2.5 rounded-xl bg-[#202020] hover:bg-[#282828] text-[#f4ebd0]/70 hover:text-white border border-[#333] font-mono text-xs transition"
                      >
                        Return to Overworld
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
