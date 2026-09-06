import React, { useState } from 'react';
import {
  Swords,
  Crosshair,
  Compass,
  Play,
  Flame,
  Award,
  Gamepad2,
} from 'lucide-react';
import { ACTION_GAMES_METADATA, ActionGameId, ActionDifficulty } from '../../lib/games/actionGameTypes';
import { useSaveGame } from '../../contexts/SaveGameContext';
import { useSpectrum, PIGMENT_REGISTRY } from '../../contexts/SpectrumContext';
import { useAudio } from '../../contexts/AudioContext';
import { BladeDuelModal } from './BladeDuelModal';
import { InkImpactModal } from './InkImpactModal';
import { RogueOutlawModal } from './RogueOutlawModal';
import { InkRushModal } from './InkRushModal';

export const ArcadeTrialsView: React.FC = () => {
  const { saveData, recordGameResult, stampSeal } = useSaveGame();
  const { unlockPigment, hasPigment } = useSpectrum();
  const { playSfx } = useAudio();

  const [activeGame, setActiveGame] = useState<ActionGameId | null>(null);
  const [difficulty, setDifficulty] = useState<ActionDifficulty>('veteran');

  const handleGameVictory = (gameId: ActionGameId, score: number) => {
    recordGameResult(gameId, true, score);
    const meta = ACTION_GAMES_METADATA[gameId];
    if (meta && !hasPigment(meta.pigment)) {
      unlockPigment(meta.pigment);
      stampSeal(meta.pigment, score);
    }
  };

  const renderGameIcon = (id: ActionGameId) => {
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

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Header Card */}
      <div className="border border-[#333] rounded-2xl p-6 bg-[#1b1b1b]/85 backdrop-blur-md shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Gamepad2 size={22} className="text-[#e0a96d]" />
            <h2 className="text-xl md:text-2xl font-serif font-bold text-[#f4ebd0] tracking-wide">
              Action Minigame Trials
            </h2>
          </div>
          <p className="text-xs text-[#f4ebd0]/60 max-w-xl leading-relaxed">
            Direct access to the 4 core Phaser 3 action engines. Test spacing in The Neutral, dodge hazards in Ink Rush, survive the Badlands in Rogue Outlaw, and soar through rice paper skies in Ink Impact.
          </p>
        </div>

        {/* Difficulty Selector */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#141414] border border-[#2d2d2d] shrink-0">
          {(['novice', 'veteran', 'master'] as ActionDifficulty[]).map((d) => (
            <button
              key={d}
              onClick={() => {
                playSfx('click');
                setDifficulty(d);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono capitalize transition ${
                difficulty === d
                  ? 'bg-[#e0a96d] text-[#141414] font-bold shadow'
                  : 'text-[#f4ebd0]/60 hover:text-white'
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* 4 Games Grid */}
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
                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center shadow-md transition-transform group-hover:scale-105"
                      style={{
                        backgroundColor: `${pigmentData.colorHex}20`,
                        border: `1.5px solid ${pigmentData.colorHex}60`,
                      }}
                    >
                      {renderGameIcon(gameId)}
                    </div>

                    <div>
                      <h3 className="font-serif font-bold text-lg text-[#f4ebd0] flex items-center gap-2">
                        {config.title}
                      </h3>
                      <p className="text-xs font-mono" style={{ color: pigmentData.colorHex }}>
                        {config.subtitle}
                      </p>
                    </div>
                  </div>

                  {isSealStamped ? (
                    <span className="flex items-center gap-1 text-[11px] font-mono text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40 shrink-0">
                      <Award size={12} /> Stamped
                    </span>
                  ) : (
                    <span className="text-[11px] font-mono text-[#f4ebd0]/40 shrink-0">
                      Unclaimed
                    </span>
                  )}
                </div>

                <p className="text-xs text-[#f4ebd0]/70 leading-relaxed min-h-[38px]">
                  {config.description}
                </p>

                {/* Score & Records */}
                <div className="mt-4 grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-[#121212] border border-[#252525] text-center text-xs font-mono">
                  <div>
                    <span className="text-[10px] text-[#f4ebd0]/40 uppercase">High Score</span>
                    <p className="font-bold text-[#e0a96d] text-sm">{record.highScore}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#f4ebd0]/40 uppercase">Played</span>
                    <p className="font-bold text-[#f4ebd0] text-sm">{record.gamesPlayed}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#f4ebd0]/40 uppercase">Victories</span>
                    <p className="font-bold text-emerald-400 text-sm">{record.gamesWon}</p>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={() => {
                  playSfx('clash');
                  setActiveGame(gameId);
                }}
                className="w-full py-2.5 rounded-xl font-serif text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg group-hover:brightness-110"
                style={{
                  backgroundColor: pigmentData.colorHex,
                  color: '#141414',
                }}
              >
                <Play size={14} className="fill-current" />
                <span>Play {config.title}</span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Active Minigame Modals */}
      {activeGame === 'blade-duel' && (
        <BladeDuelModal
          isOpen={true}
          onClose={() => setActiveGame(null)}
          onVictory={(score) => handleGameVictory('blade-duel', score)}
          difficulty={difficulty}
          wardenName={ACTION_GAMES_METADATA['blade-duel'].warden}
          wardenColorHex={PIGMENT_REGISTRY['frost-cyan'].colorHex}
        />
      )}

      {activeGame === 'ink-impact' && (
        <InkImpactModal
          isOpen={true}
          onClose={() => setActiveGame(null)}
          onVictory={(score) => handleGameVictory('ink-impact', score)}
          difficulty={difficulty}
          wardenColorHex={PIGMENT_REGISTRY['sky-cerulean'].colorHex}
        />
      )}

      {activeGame === 'rogue-outlaw' && (
        <RogueOutlawModal
          isOpen={true}
          onClose={() => setActiveGame(null)}
          onVictory={(score) => handleGameVictory('rogue-outlaw', score)}
          difficulty={difficulty}
          wardenColorHex={PIGMENT_REGISTRY['blood-vermilion'].colorHex}
        />
      )}

      {activeGame === 'ink-rush' && (
        <InkRushModal
          isOpen={true}
          onClose={() => setActiveGame(null)}
          onVictory={(score) => handleGameVictory('ink-rush', score)}
          difficulty={difficulty}
          wardenColorHex={PIGMENT_REGISTRY['rushing-teal'].colorHex}
        />
      )}
    </div>
  );
};
