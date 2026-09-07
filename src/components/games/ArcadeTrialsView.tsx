import React, { useState } from 'react';
import {
  Swords,
  Crosshair,
  Compass,
  Play,
  Flame,
  Award,
  Gamepad2,
  Brain,
  Snowflake,
  Anchor,
  Target,
  Zap,
  Grid3X3,
  CircleDot,
  BookOpen,
  Layers,
  Flower2,
} from 'lucide-react';
import { ACTION_GAMES_METADATA, ActionGameId, ActionDifficulty } from '../../lib/games/actionGameTypes';
import { PUZZLE_GAMES_METADATA, PuzzleGameId } from '../../lib/games/puzzleGameTypes';
import { useSaveGame } from '../../contexts/SaveGameContext';
import { useSpectrum, PIGMENT_REGISTRY } from '../../contexts/SpectrumContext';
import { useAudio } from '../../contexts/AudioContext';

// Phase 3 Action Modals
import { BladeDuelModal } from './BladeDuelModal';
import { InkImpactModal } from './InkImpactModal';
import { RogueOutlawModal } from './RogueOutlawModal';
import { InkRushModal } from './InkRushModal';

// Phase 4 Strategy & Puzzle Modals
import { InkSlideModal } from './react/InkSlideModal';
import { InkFleetModal } from './react/InkFleetModal';
import { ArcheryModal } from './react/ArcheryModal';
import { UnoModal } from './react/UnoModal';
import { BloomModal } from './react/BloomModal';
import { QuickDrawModal } from './react/QuickDrawModal';
import { Connect4Modal } from './react/Connect4Modal';
import { GomokuModal } from './react/GomokuModal';
import { SudokuModal } from './react/SudokuModal';
import { MemoryFlipModal } from './react/MemoryFlipModal';

export const ArcadeTrialsView: React.FC = () => {
  const { saveData, recordGameResult, stampSeal } = useSaveGame();
  const { unlockPigment, hasPigment } = useSpectrum();
  const { playSfx } = useAudio();

  const [activeTab, setActiveTab] = useState<'action' | 'strategy'>('strategy');

  // Active Game State
  const [activeActionGame, setActiveActionGame] = useState<ActionGameId | null>(null);
  const [activePuzzleGame, setActivePuzzleGame] = useState<PuzzleGameId | null>(null);
  const [difficulty, setDifficulty] = useState<ActionDifficulty>('veteran');

  const handleActionVictory = (gameId: ActionGameId, score: number) => {
    recordGameResult(gameId, true, score);
    const meta = ACTION_GAMES_METADATA[gameId];
    if (meta && !hasPigment(meta.pigment)) {
      unlockPigment(meta.pigment);
      stampSeal(meta.pigment, score);
    }
  };

  const renderActionIcon = (id: ActionGameId) => {
    switch (id) {
      case 'blade-duel':
        return <Swords size={22} className="text-[#48cae4]" />;
      case 'ink-impact':
        return <Crosshair size={22} className="text-[#90e0ef]" />;
      case 'rogue-outlaw':
        return <Flame size={22} className="text-[#b3312c]" />;
      case 'ink-rush':
        return <Compass size={22} className="text-[#0077b6]" />;
    }
  };

  const renderPuzzleIcon = (id: PuzzleGameId) => {
    switch (id) {
      case 'ink-slide':
        return <Snowflake size={22} className="text-[#48cae4]" />;
      case 'ink-fleet':
        return <Anchor size={22} className="text-[#1d3557]" />;
      case 'archery':
        return <Target size={22} className="text-[#90e0ef]" />;
      case 'uno':
        return <Flame size={22} className="text-[#e0a96d]" />;
      case 'bloom':
        return <Flower2 size={22} className="text-[#2d6a4f]" />;
      case 'quick-draw':
        return <Zap size={22} className="text-[#0077b6]" />;
      case 'connect4':
        return <Grid3X3 size={22} className="text-[#b3312c]" />;
      case 'gomoku':
        return <CircleDot size={22} className="text-[#b3312c]" />;
      case 'sudoku':
        return <BookOpen size={22} className="text-[#f4ebd0]" />;
      case 'memory':
        return <Layers size={22} className="text-[#f4ebd0]" />;
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Top Header Card */}
      <div className="border border-[#333] rounded-2xl p-6 bg-[#1b1b1b]/85 backdrop-blur-md shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Gamepad2 size={22} className="text-[#e0a96d]" />
            <h2 className="text-xl md:text-2xl font-serif font-bold text-[#f4ebd0] tracking-wide">
              Continental Arcade Pavilion
            </h2>
          </div>
          <p className="text-xs text-[#f4ebd0]/60 max-w-xl leading-relaxed">
            Direct access to all 14 trials across the 7 Kingdoms. Challenge martial boss encounters in the Action Arena or pit your wits against regional dens and ancient archives.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#141414] border border-[#2d2d2d] shrink-0">
          <button
            onClick={() => {
              playSfx('click');
              setActiveTab('strategy');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition ${
              activeTab === 'strategy'
                ? 'bg-[#b3312c] text-white font-bold shadow'
                : 'text-[#f4ebd0]/60 hover:text-white'
            }`}
          >
            <Brain size={14} />
            <span>Puzzle & Strategy (10)</span>
          </button>
          <button
            onClick={() => {
              playSfx('click');
              setActiveTab('action');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition ${
              activeTab === 'action'
                ? 'bg-[#e0a96d] text-[#141414] font-bold shadow'
                : 'text-[#f4ebd0]/60 hover:text-white'
            }`}
          >
            <Swords size={14} />
            <span>Action Trials (4)</span>
          </button>
        </div>
      </div>

      {/* Action Games Tab */}
      {activeTab === 'action' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <span className="text-xs font-mono text-[#f4ebd0]/60 uppercase tracking-wider">
              Phaser 3 Fixed-Timestep Combat Engines
            </span>
            <div className="flex items-center gap-1 bg-[#181818] p-1 rounded-lg border border-[#2c2c2c] text-xs font-mono">
              {(['novice', 'veteran', 'master'] as ActionDifficulty[]).map((d) => (
                <button
                  key={d}
                  onClick={() => {
                    playSfx('click');
                    setDifficulty(d);
                  }}
                  className={`px-2.5 py-0.5 rounded capitalize ${
                    difficulty === d ? 'bg-[#e0a96d] text-black font-bold' : 'text-[#f4ebd0]/50'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {(Object.keys(ACTION_GAMES_METADATA) as ActionGameId[]).map((gameId) => {
              const config = ACTION_GAMES_METADATA[gameId];
              const record = saveData.minigames[gameId] || {
                highScore: 0,
                gamesPlayed: 0,
                gamesWon: 0,
              };
              const pigmentData = PIGMENT_REGISTRY[config.pigment];
              const isSealStamped = hasPigment(config.pigment);

              return (
                <div
                  key={gameId}
                  className="group relative p-5 rounded-2xl bg-[#181818] border transition-all hover:border-[#444] shadow-xl flex flex-col justify-between space-y-4"
                  style={{
                    borderColor: `${pigmentData.colorHex}40`,
                    boxShadow: `0 4px 20px ${pigmentData.colorHex}10`,
                  }}
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-11 h-11 rounded-xl flex items-center justify-center shadow-md transition-transform group-hover:scale-105"
                          style={{
                            backgroundColor: `${pigmentData.colorHex}20`,
                            border: `1.5px solid ${pigmentData.colorHex}60`,
                          }}
                        >
                          {renderActionIcon(gameId)}
                        </div>
                        <div>
                          <h3 className="font-serif font-bold text-base text-[#f4ebd0]">
                            {config.title}
                          </h3>
                          <div className="flex items-center gap-2 text-xs font-mono text-[#f4ebd0]/50">
                            <span>{config.region}</span>
                            <span>•</span>
                            <span style={{ color: pigmentData.colorHex }}>{pigmentData.name}</span>
                          </div>
                        </div>
                      </div>

                      {isSealStamped && (
                        <div className="flex items-center gap-1 text-[11px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/60 px-2 py-0.5 rounded-full">
                          <Award size={13} />
                          <span>Stamped</span>
                        </div>
                      )}
                    </div>

                    <p className="text-xs text-[#f4ebd0]/70 leading-relaxed line-clamp-2">
                      {config.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-[#262626] flex items-center justify-between">
                    <div className="text-xs font-mono text-[#f4ebd0]/50">
                      Best:{' '}
                      <span className="text-[#f4ebd0] font-bold font-mono">
                        {record.highScore}
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        playSfx('clash');
                        setActiveActionGame(gameId);
                      }}
                      className="px-4 py-1.5 rounded-xl font-mono text-xs font-bold transition flex items-center gap-1.5 shadow-md group-hover:shadow-lg"
                      style={{
                        backgroundColor: pigmentData.colorHex,
                        color: ['frost-cyan', 'sky-cerulean', 'molten-gold'].includes(config.pigment)
                          ? '#141414'
                          : '#ffffff',
                      }}
                    >
                      <Play size={13} fill="currentColor" />
                      <span>Launch Trial</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Strategy & Puzzle Tab */}
      {activeTab === 'strategy' && (
        <div className="space-y-4">
          <div className="px-1">
            <span className="text-xs font-mono text-[#f4ebd0]/60 uppercase tracking-wider">
              React 19 Regional Dens, Autonomous Shrines & Archives
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(Object.keys(PUZZLE_GAMES_METADATA) as PuzzleGameId[]).map((gameId) => {
              const config = PUZZLE_GAMES_METADATA[gameId];
              const record = saveData.minigames[gameId] || {
                highScore: 0,
                gamesPlayed: 0,
                gamesWon: 0,
              };
              const pigmentData = PIGMENT_REGISTRY[config.pigment];
              const isSealStamped = hasPigment(config.pigment);

              return (
                <div
                  key={gameId}
                  className="group relative p-4 rounded-2xl bg-[#181818] border transition-all hover:border-[#444] shadow-xl flex flex-col justify-between space-y-3"
                  style={{
                    borderColor: `${pigmentData.colorHex}40`,
                    boxShadow: `0 4px 18px ${pigmentData.colorHex}10`,
                  }}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md shrink-0"
                          style={{
                            backgroundColor: `${pigmentData.colorHex}20`,
                            border: `1.5px solid ${pigmentData.colorHex}60`,
                          }}
                        >
                          {renderPuzzleIcon(gameId)}
                        </div>
                        <div>
                          <h3 className="font-serif font-bold text-sm text-[#f4ebd0] line-clamp-1">
                            {config.title}
                          </h3>
                          <span
                            className="text-[10px] font-mono block"
                            style={{ color: pigmentData.colorHex }}
                          >
                            {config.landmarkName}
                          </span>
                        </div>
                      </div>

                      {isSealStamped && (
                        <Award size={16} className="text-emerald-400 shrink-0" />
                      )}
                    </div>

                    <p className="text-[11px] text-[#f4ebd0]/70 leading-relaxed line-clamp-2">
                      {config.description}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-[#262626] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-[#f4ebd0]/50">
                        {config.modes[0]}
                      </span>
                      {record.gamesWon > 0 && (
                        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-800/40">
                          Won: {record.gamesWon}
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => {
                        playSfx('clash');
                        setActivePuzzleGame(gameId);
                      }}
                      className="px-3 py-1 rounded-lg font-mono text-xs font-bold transition flex items-center gap-1 shadow"
                      style={{
                        backgroundColor: pigmentData.colorHex,
                        color: ['frost-cyan', 'sky-cerulean', 'molten-gold'].includes(config.pigment)
                          ? '#141414'
                          : '#ffffff',
                      }}
                    >
                      <Play size={11} fill="currentColor" />
                      <span>Enter</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Phase 3 Action Game Modals */}
      <BladeDuelModal
        isOpen={activeActionGame === 'blade-duel'}
        onClose={() => setActiveActionGame(null)}
        onVictory={(score) => handleActionVictory('blade-duel', score)}
        difficulty={difficulty}
      />
      <InkImpactModal
        isOpen={activeActionGame === 'ink-impact'}
        onClose={() => setActiveActionGame(null)}
        onVictory={(score) => handleActionVictory('ink-impact', score)}
        difficulty={difficulty}
      />
      <RogueOutlawModal
        isOpen={activeActionGame === 'rogue-outlaw'}
        onClose={() => setActiveActionGame(null)}
        onVictory={(score) => handleActionVictory('rogue-outlaw', score)}
        difficulty={difficulty}
      />
      <InkRushModal
        isOpen={activeActionGame === 'ink-rush'}
        onClose={() => setActiveActionGame(null)}
        onVictory={(score) => handleActionVictory('ink-rush', score)}
        difficulty={difficulty}
      />

      {/* Phase 4 Strategy & Puzzle Modals */}
      <InkSlideModal
        isOpen={activePuzzleGame === 'ink-slide'}
        onClose={() => setActivePuzzleGame(null)}
      />
      <InkFleetModal
        isOpen={activePuzzleGame === 'ink-fleet'}
        onClose={() => setActivePuzzleGame(null)}
      />
      <ArcheryModal
        isOpen={activePuzzleGame === 'archery'}
        onClose={() => setActivePuzzleGame(null)}
      />
      <UnoModal
        isOpen={activePuzzleGame === 'uno'}
        onClose={() => setActivePuzzleGame(null)}
      />
      <BloomModal
        isOpen={activePuzzleGame === 'bloom'}
        onClose={() => setActivePuzzleGame(null)}
      />
      <QuickDrawModal
        isOpen={activePuzzleGame === 'quick-draw'}
        onClose={() => setActivePuzzleGame(null)}
      />
      <Connect4Modal
        isOpen={activePuzzleGame === 'connect4'}
        onClose={() => setActivePuzzleGame(null)}
      />
      <GomokuModal
        isOpen={activePuzzleGame === 'gomoku'}
        onClose={() => setActivePuzzleGame(null)}
      />
      <SudokuModal
        isOpen={activePuzzleGame === 'sudoku'}
        onClose={() => setActivePuzzleGame(null)}
      />
      <MemoryFlipModal
        isOpen={activePuzzleGame === 'memory'}
        onClose={() => setActivePuzzleGame(null)}
      />
    </div>
  );
};
