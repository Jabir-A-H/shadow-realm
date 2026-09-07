import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  X,
  Volume2,
  VolumeX,
  RotateCcw,
  Undo2,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Snowflake,
} from 'lucide-react';
import { useAudio } from '../../../contexts/AudioContext';
import { useSpectrum } from '../../../contexts/SpectrumContext';
import { useSaveGame } from '../../../contexts/SaveGameContext';
import levelsData from '../../../data/slide-levels.json';
import {
  TileType,
  SlideDirection,
  resolveSlide,
} from '../../../lib/games/slideSolver';
import confetti from 'canvas-confetti';

interface Level {
  id: string;
  title: string;
  difficulty: 'easy' | 'medium' | 'hard';
  gridSize: [number, number];
  start: [number, number];
  grid: TileType[][];
  par: number;
}

const typedLevels = levelsData as Level[];

interface InkSlideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVictory?: () => void;
}

export const InkSlideModal: React.FC<InkSlideModalProps> = ({
  isOpen,
  onClose,
  onVictory,
}) => {
  const { isMuted, toggleMute, playSfx } = useAudio();
  const { unlockPigment, hasPigment } = useSpectrum();
  const { stampSeal, recordGameResult } = useSaveGame();

  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');
  const [currentLevelIndex, setCurrentLevelIndex] = useState<number>(0);
  const [playerPos, setPlayerPos] = useState<[number, number]>([0, 0]);
  const [moveCount, setMoveCount] = useState<number>(0);
  const [history, setHistory] = useState<[number, number][]>([]);
  const [isSliding, setIsSliding] = useState<boolean>(false);
  const [isWon, setIsWon] = useState<boolean>(false);
  const [isFailed, setIsFailed] = useState<boolean>(false);

  // Filter levels for active tier
  const tierLevels = useMemo(() => {
    return typedLevels.filter((l) => l.difficulty === difficulty);
  }, [difficulty]);

  const currentLevel = tierLevels[currentLevelIndex] || tierLevels[0];

  // Initialize level
  const initLevel = useCallback(
    (lvl: Level) => {
      setPlayerPos(lvl.start);
      setMoveCount(0);
      setHistory([]);
      setIsWon(false);
      setIsFailed(false);
      setIsSliding(false);
    },
    []
  );

  useEffect(() => {
    if (currentLevel) {
      initLevel(currentLevel);
    }
  }, [currentLevel, initLevel]);

  // Execute slide move
  const handleMove = useCallback(
    (dir: SlideDirection) => {
      if (isSliding || isWon || isFailed || !currentLevel) return;

      const { dest, outcome } = resolveSlide(currentLevel.grid, playerPos, dir);

      // If no movement
      if (dest[0] === playerPos[0] && dest[1] === playerPos[1]) {
        playSfx('whiff');
        return;
      }

      setIsSliding(true);
      setHistory((prev) => [...prev, playerPos]);
      setPlayerPos(dest);
      setMoveCount((prev) => prev + 1);
      playSfx('clash');

      setTimeout(() => {
        setIsSliding(false);
        if (outcome === 'won') {
          setIsWon(true);
          playSfx('victory');
          playSfx('seal-stamp');
          confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });

          const score = Math.max(100, 1000 - (moveCount + 1 - currentLevel.par) * 50);
          recordGameResult('ink-slide', true, score);

          if (!hasPigment('frost-cyan')) {
            unlockPigment('frost-cyan');
            stampSeal('frost-cyan', score);
          }
          onVictory?.();
        } else if (outcome === 'failed') {
          setIsFailed(true);
          playSfx('heavy-strike');
        }
      }, 220);
    },
    [
      isSliding,
      isWon,
      isFailed,
      currentLevel,
      playerPos,
      moveCount,
      playSfx,
      hasPigment,
      unlockPigment,
      stampSeal,
      recordGameResult,
      onVictory,
    ]
  );

  const handleUndo = () => {
    if (history.length === 0 || isSliding || isWon) return;
    const prev = history[history.length - 1];
    setHistory((h) => h.slice(0, -1));
    setPlayerPos(prev);
    setMoveCount((m) => Math.max(0, m - 1));
    setIsFailed(false);
    playSfx('click');
  };

  const handleNextLevel = () => {
    if (currentLevelIndex < tierLevels.length - 1) {
      setCurrentLevelIndex((i) => i + 1);
      playSfx('click');
    }
  };

  const handlePrevLevel = () => {
    if (currentLevelIndex > 0) {
      setCurrentLevelIndex((i) => i - 1);
      playSfx('click');
    }
  };

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'KeyW'].includes(e.code)) {
        e.preventDefault();
        handleMove('up');
      } else if (['ArrowDown', 'KeyS'].includes(e.code)) {
        e.preventDefault();
        handleMove('down');
      } else if (['ArrowLeft', 'KeyA'].includes(e.code)) {
        e.preventDefault();
        handleMove('left');
      } else if (['ArrowRight', 'KeyD'].includes(e.code)) {
        e.preventDefault();
        handleMove('right');
      } else if (e.code === 'KeyR') {
        initLevel(currentLevel);
      } else if (e.code === 'KeyU' || e.code === 'KeyZ') {
        handleUndo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleMove, initLevel, currentLevel]);

  if (!isOpen) return null;

  const [rows, cols] = currentLevel.gridSize;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/90 backdrop-blur-md select-none overflow-hidden font-sans">
      <div className="relative w-full h-full max-w-4xl max-h-[92vh] bg-[#141414] border-2 border-[#48cae4] rounded-2xl flex flex-col shadow-2xl shadow-[#48cae4]/10 overflow-hidden text-[#f4ebd0]">
        {/* Header */}
        <header className="flex items-center justify-between px-4 py-3 bg-[#1a1a1a] border-b border-[#282828] shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                playSfx('click');
                onClose();
              }}
              className="p-1.5 rounded-lg bg-[#222] hover:bg-[#2d2d2d] border border-[#333] text-[#f4ebd0]/70 hover:text-white transition flex items-center gap-1 text-xs font-mono"
            >
              <X size={16} />
              <span className="hidden sm:inline">Exit</span>
            </button>
            <div>
              <div className="flex items-center gap-2">
                <Snowflake size={18} className="text-[#48cae4]" />
                <h2 className="font-serif font-bold text-sm sm:text-base text-[#f4ebd0]">
                  Ink Slide
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-[#48cae4]/40 text-[#48cae4] bg-[#48cae4]/10">
                  The Frozen Reach
                </span>
              </div>
              <p className="text-[11px] text-[#f4ebd0]/50 font-mono">
                Stage {currentLevelIndex + 1}/{tierLevels.length}: {currentLevel.title}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleMute}
              className="p-2 rounded-lg bg-[#222] hover:bg-[#2d2d2d] border border-[#333] text-[#f4ebd0]/70 hover:text-white transition"
            >
              {isMuted ? <VolumeX size={16} className="text-red-400" /> : <Volume2 size={16} />}
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Main Board */}
          <div className="flex-1 flex flex-col items-center justify-center p-4 bg-[#111] overflow-auto">
            {/* Tier / Level Switcher */}
            <div className="flex items-center justify-between w-full max-w-md mb-3 px-2">
              <div className="flex items-center gap-1 bg-[#1a1a1a] p-1 rounded-lg border border-[#2a2a2a]">
                {(['easy', 'medium', 'hard'] as const).map((tier) => (
                  <button
                    key={tier}
                    onClick={() => {
                      setDifficulty(tier);
                      setCurrentLevelIndex(0);
                      playSfx('click');
                    }}
                    className={`px-2.5 py-1 rounded text-xs font-mono uppercase transition ${
                      difficulty === tier
                        ? 'bg-[#48cae4] text-[#141414] font-bold shadow'
                        : 'text-[#f4ebd0]/50 hover:text-white'
                    }`}
                  >
                    {tier}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 text-xs font-mono">
                <span className="text-[#f4ebd0]/60">Par: {currentLevel.par}</span>
                <span className="text-[#48cae4] font-bold">Moves: {moveCount}</span>
              </div>
            </div>

            {/* Grid Container */}
            <div
              className="relative p-2 rounded-xl bg-[#1c1c1c] border-2 border-[#333] shadow-inner"
              style={{
                display: 'grid',
                gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
                gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
                gap: '4px',
                width: `${Math.min(360, cols * 64)}px`,
                height: `${Math.min(360, rows * 64)}px`,
              }}
            >
              {currentLevel.grid.map((row, r) =>
                row.map((tile, c) => {
                  const isPlayer = playerPos[0] === r && playerPos[1] === c;

                  let tileBg = 'bg-[#181818]';
                  let tileBorder = 'border-[#262626]';
                  let content = null;

                  if (tile === 'wall') {
                    tileBg = 'bg-[#2b2b2b]';
                    tileBorder = 'border-[#404040] shadow-md';
                    content = <div className="w-2 h-2 rounded-full bg-[#555]" />;
                  } else if (tile === 'hazard') {
                    tileBg = 'bg-red-950/40';
                    tileBorder = 'border-red-900/60';
                    content = <span className="text-red-500 font-bold text-xs">▲</span>;
                  } else if (tile === 'goal') {
                    tileBg = 'bg-[#b3312c]/20';
                    tileBorder = 'border-[#b3312c] shadow-[0_0_10px_#b3312c50]';
                    content = <span className="text-[#b3312c] font-serif font-bold text-xs">印</span>;
                  } else if (tile === 'dry') {
                    tileBg = 'bg-[#e0a96d]/10';
                    tileBorder = 'border-[#e0a96d]/40';
                    content = <div className="w-1.5 h-1.5 rounded-full bg-[#e0a96d]/50" />;
                  }

                  return (
                    <div
                      key={`${r}-${c}`}
                      className={`relative flex items-center justify-center rounded-lg border transition-all ${tileBg} ${tileBorder}`}
                    >
                      {content}
                      {isPlayer && (
                        <motion.div
                          layoutId="slide-player"
                          transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                          className="absolute inset-1.5 rounded-full bg-[#48cae4] border-2 border-white shadow-[0_0_12px_#48cae4] flex items-center justify-center text-xs font-bold text-[#141414]"
                        >
                          ●
                        </motion.div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Directional Pad for Touch & Mobile */}
            <div className="mt-4 flex flex-col items-center gap-1 sm:hidden">
              <button
                onClick={() => handleMove('up')}
                className="w-11 h-11 rounded-lg bg-[#222] border border-[#333] flex items-center justify-center text-[#f4ebd0] active:bg-[#48cae4] active:text-black"
              >
                <ArrowUp size={20} />
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => handleMove('left')}
                  className="w-11 h-11 rounded-lg bg-[#222] border border-[#333] flex items-center justify-center text-[#f4ebd0] active:bg-[#48cae4] active:text-black"
                >
                  <ArrowLeft size={20} />
                </button>
                <button
                  onClick={() => handleMove('down')}
                  className="w-11 h-11 rounded-lg bg-[#222] border border-[#333] flex items-center justify-center text-[#f4ebd0] active:bg-[#48cae4] active:text-black"
                >
                  <ArrowDown size={20} />
                </button>
                <button
                  onClick={() => handleMove('right')}
                  className="w-11 h-11 rounded-lg bg-[#222] border border-[#333] flex items-center justify-center text-[#f4ebd0] active:bg-[#48cae4] active:text-black"
                >
                  <ArrowRight size={20} />
                </button>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center gap-2 mt-4">
              <button
                onClick={handleUndo}
                disabled={history.length === 0 || isWon}
                className="px-3 py-1.5 rounded-lg bg-[#222] hover:bg-[#2c2c2c] border border-[#333] text-xs font-mono flex items-center gap-1 text-[#f4ebd0]/70 disabled:opacity-30"
              >
                <Undo2 size={14} />
                Undo
              </button>
              <button
                onClick={() => initLevel(currentLevel)}
                className="px-3 py-1.5 rounded-lg bg-[#222] hover:bg-[#2c2c2c] border border-[#333] text-xs font-mono flex items-center gap-1 text-[#f4ebd0]/70"
              >
                <RotateCcw size={14} />
                Reset (R)
              </button>
              <button
                onClick={handlePrevLevel}
                disabled={currentLevelIndex === 0}
                className="p-1.5 rounded-lg bg-[#222] border border-[#333] text-xs disabled:opacity-30"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={handleNextLevel}
                disabled={currentLevelIndex === tierLevels.length - 1}
                className="p-1.5 rounded-lg bg-[#222] border border-[#333] text-xs disabled:opacity-30"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Right Info / Lore Drawer */}
          <div className="w-full md:w-72 bg-[#181818] border-t md:border-t-0 md:border-l border-[#282828] p-4 flex flex-col justify-between">
            <div className="space-y-3">
              <h3 className="font-serif font-bold text-xs uppercase tracking-wider text-[#48cae4]">
                Glacial Cavern Protocol
              </h3>
              <p className="text-xs text-[#f4ebd0]/70 leading-relaxed">
                Step upon slick sumi ice and glide forward until you strike an ink stone wall or dry parchment brake. Avoid jagged hazard fissures and land directly on the Vermilion Seal to unseal the Gate.
              </p>

              <div className="space-y-1.5 pt-2 border-t border-[#2a2a2a] text-xs font-mono text-[#f4ebd0]/60">
                <div className="flex justify-between">
                  <span>Current Par:</span>
                  <span className="text-[#f4ebd0]">{currentLevel.par} Moves</span>
                </div>
                <div className="flex justify-between">
                  <span>Your Moves:</span>
                  <span className={moveCount <= currentLevel.par ? 'text-green-400' : 'text-amber-400'}>
                    {moveCount}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Rating:</span>
                  <span className="text-[#48cae4]">
                    {moveCount <= currentLevel.par ? '★★★ Flawless' : moveCount <= currentLevel.par + 2 ? '★★ Master' : '★ Solved'}
                  </span>
                </div>
              </div>
            </div>

            {/* Victory / Defeat Status Banner */}
            <div className="mt-4 pt-4 border-t border-[#2a2a2a]">
              {isWon && (
                <div className="p-3 rounded-xl bg-[#48cae4]/15 border border-[#48cae4] text-center space-y-2">
                  <div className="text-xs font-serif font-bold text-[#48cae4] flex items-center justify-center gap-1">
                    <Sparkles size={14} />
                    Glacial Gate Unlocked!
                  </div>
                  <p className="text-[11px] text-[#f4ebd0]/80">
                    The ice chasm thaws into climbable stairs. The Frost King's battlements await!
                  </p>
                  <button
                    onClick={handleNextLevel}
                    className="w-full py-1.5 rounded-lg bg-[#48cae4] text-black font-bold text-xs hover:bg-[#72ddf4] transition"
                  >
                    Next Stage
                  </button>
                </div>
              )}

              {isFailed && (
                <div className="p-3 rounded-xl bg-red-950/40 border border-red-700/60 text-center space-y-2">
                  <div className="text-xs font-serif font-bold text-red-400">
                    Fell into Hazard Fissure!
                  </div>
                  <button
                    onClick={() => initLevel(currentLevel)}
                    className="w-full py-1.5 rounded-lg bg-red-800 text-white font-bold text-xs hover:bg-red-700 transition"
                  >
                    Retry Stage
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
