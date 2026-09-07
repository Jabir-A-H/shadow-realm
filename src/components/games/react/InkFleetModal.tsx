import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  Volume2,
  VolumeX,
  Anchor,
} from 'lucide-react';
import { useAudio } from '../../../contexts/AudioContext';
import { useSpectrum } from '../../../contexts/SpectrumContext';
import { useSaveGame } from '../../../contexts/SaveGameContext';
import {
  GridSize,
  Fleet,
  CPUState,
  generateRandomFleet,
  getNextCPUMove,
  processCPUHitResult,
} from '../../../lib/games/fleetEngine';
import confetti from 'canvas-confetti';

interface InkFleetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVictory?: () => void;
}

export const InkFleetModal: React.FC<InkFleetModalProps> = ({
  isOpen,
  onClose,
  onVictory,
}) => {
  const { isMuted, toggleMute, playSfx } = useAudio();
  const { unlockPigment, hasPigment } = useSpectrum();
  const { stampSeal, recordGameResult } = useSaveGame();

  const [gridSize, setGridSize] = useState<GridSize>(6);
  const [phase, setPhase] = useState<'placement' | 'battle' | 'gameover'>('placement');

  // Placement state
  const [playerFleet, setPlayerFleet] = useState<Fleet>([]);
  const [enemyFleet, setEnemyFleet] = useState<Fleet>([]);

  // Battle state
  const [playerShots, setPlayerShots] = useState<Map<string, 'hit' | 'miss'>>(new Map());
  const [enemyShots, setEnemyShots] = useState<Map<string, 'hit' | 'miss'>>(new Map());
  const [turn, setTurn] = useState<'player' | 'enemy'>('player');
  const [winner, setWinner] = useState<'player' | 'enemy' | null>(null);

  // CPU state
  const [cpuState, setCpuState] = useState<CPUState>({
    mode: 'random',
    firstHit: null,
    lastHit: null,
    currentDir: null,
    triedDirs: [],
  });

  const initGame = useCallback((size: GridSize) => {
    const pf = generateRandomFleet(size);
    const ef = generateRandomFleet(size);
    setPlayerFleet(pf);
    setEnemyFleet(ef);
    setPlayerShots(new Map());
    setEnemyShots(new Map());
    setTurn('player');
    setWinner(null);
    setPhase('placement');
    setCpuState({
      mode: 'random',
      firstHit: null,
      lastHit: null,
      currentDir: null,
      triedDirs: [],
    });
  }, []);

  useEffect(() => {
    initGame(gridSize);
  }, [gridSize, initGame]);

  // Handle Player Shot against enemy
  const handleFireAtEnemy = (r: number, c: number) => {
    if (phase !== 'battle' || turn !== 'player' || winner) return;
    const key = `${r},${c}`;
    if (playerShots.has(key)) return;

    let hit = false;
    for (const ship of enemyFleet) {
      if (ship.cells.some(([sr, sc]) => sr === r && sc === c)) {
        hit = true;
        break;
      }
    }

    const newShots = new Map(playerShots);
    newShots.set(key, hit ? 'hit' : 'miss');
    setPlayerShots(newShots);

    if (hit) {
      playSfx('heavy-strike');
      const allHits = Array.from(newShots.entries())
        .filter(([, result]) => result === 'hit')
        .map(([k]) => k);

      const allShipCells = enemyFleet.flatMap((s) => s.cells.map(([sr, sc]) => `${sr},${sc}`));
      const allSunk = allShipCells.every((cellKey) => allHits.includes(cellKey));

      if (allSunk) {
        setWinner('player');
        setPhase('gameover');
        playSfx('victory');
        playSfx('seal-stamp');
        confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });

        recordGameResult('ink-fleet', true, 1200);
        if (!hasPigment('abyssal-navy')) {
          unlockPigment('abyssal-navy');
          stampSeal('abyssal-navy', 1200);
        }
        onVictory?.();
        return;
      }
    } else {
      playSfx('whiff');
    }

    setTurn('enemy');
    setTimeout(() => {
      handleCPUTurn();
    }, 600);
  };

  // CPU Turn Execution
  const handleCPUTurn = () => {
    const previousShotKeys = new Set(enemyShots.keys());
    const { move, newState } = getNextCPUMove(cpuState, previousShotKeys, gridSize);
    const [r, c] = move;
    const key = `${r},${c}`;

    let hit = false;
    for (const ship of playerFleet) {
      if (ship.cells.some(([sr, sc]) => sr === r && sc === c)) {
        hit = true;
        break;
      }
    }

    const updatedEnemyShots = new Map(enemyShots);
    updatedEnemyShots.set(key, hit ? 'hit' : 'miss');
    setEnemyShots(updatedEnemyShots);

    const updatedCpuState = processCPUHitResult(newState, move, hit, false);
    setCpuState(updatedCpuState);

    if (hit) {
      playSfx('clash');
      const allHits = Array.from(updatedEnemyShots.entries())
        .filter(([, result]) => result === 'hit')
        .map(([k]) => k);

      const allPlayerCells = playerFleet.flatMap((s) => s.cells.map(([sr, sc]) => `${sr},${sc}`));
      const allSunk = allPlayerCells.every((cellKey) => allHits.includes(cellKey));

      if (allSunk) {
        setWinner('enemy');
        setPhase('gameover');
        playSfx('heavy-strike');
        return;
      }
    }

    setTurn('player');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/90 backdrop-blur-md select-none overflow-hidden font-sans">
      <div className="relative w-full h-full max-w-4xl max-h-[92vh] bg-[#141414] border-2 border-[#1d3557] rounded-2xl flex flex-col shadow-2xl shadow-[#1d3557]/20 overflow-hidden text-[#f4ebd0]">
        {/* Header */}
        <header className="flex items-center justify-between px-4 py-3 bg-[#182333] border-b border-[#24354d] shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                playSfx('click');
                onClose();
              }}
              className="p-1.5 rounded-lg bg-[#141c28] hover:bg-[#1d2a3d] border border-[#2b3e58] text-[#f4ebd0]/70 hover:text-white transition flex items-center gap-1 text-xs font-mono"
            >
              <X size={16} />
              <span className="hidden sm:inline">Exit</span>
            </button>
            <div>
              <div className="flex items-center gap-2">
                <Anchor size={18} className="text-[#48cae4]" />
                <h2 className="font-serif font-bold text-sm sm:text-base text-[#f4ebd0]">
                  Ink Fleet
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-[#48cae4]/40 text-[#48cae4] bg-[#1d3557]/40">
                  The Drowned Isles
                </span>
              </div>
              <p className="text-[11px] text-[#f4ebd0]/50 font-mono">
                {phase === 'placement' ? 'Harbor Positioning Phase' : 'Abyssal Radar Artillery Duel'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleMute}
              className="p-2 rounded-lg bg-[#141c28] hover:bg-[#1d2a3d] border border-[#2b3e58] text-[#f4ebd0]/70 hover:text-white transition"
            >
              {isMuted ? <VolumeX size={16} className="text-red-400" /> : <Volume2 size={16} />}
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Main Board */}
          <div className="flex-1 flex flex-col items-center justify-center p-4 bg-[#0f1722] overflow-auto">
            {/* Top Toolbar */}
            <div className="flex items-center justify-between w-full max-w-lg mb-4 px-2">
              <div className="flex items-center gap-2">
                {( [5, 6, 8] as GridSize[] ).map((sz) => (
                  <button
                    key={sz}
                    disabled={phase === 'battle'}
                    onClick={() => {
                      setGridSize(sz);
                      playSfx('click');
                    }}
                    className={`px-2.5 py-1 rounded text-xs font-mono transition ${
                      gridSize === sz
                        ? 'bg-[#48cae4] text-[#141414] font-bold'
                        : 'bg-[#182333] text-[#f4ebd0]/60 hover:text-white disabled:opacity-40'
                    }`}
                  >
                    {sz}x{sz}
                  </button>
                ))}
              </div>

              {phase === 'placement' ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setPlayerFleet(generateRandomFleet(gridSize));
                      playSfx('clash');
                    }}
                    className="px-3 py-1 rounded bg-[#182333] hover:bg-[#202f45] border border-[#2b3e58] text-xs font-mono"
                  >
                    Scramble Fleet
                  </button>
                  <button
                    onClick={() => {
                      setPhase('battle');
                      playSfx('taiko');
                    }}
                    className="px-4 py-1 rounded bg-[#b3312c] hover:bg-red-700 font-bold text-xs text-white shadow"
                  >
                    Engage Fleet!
                  </button>
                </div>
              ) : (
                <div className="text-xs font-mono">
                  Turn:{' '}
                  <span className={turn === 'player' ? 'text-[#48cae4] font-bold' : 'text-red-400'}>
                    {turn === 'player' ? 'Your Salvo' : 'Kraken Fleet Salvo...'}
                  </span>
                </div>
              )}
            </div>

            {/* Grids Layout */}
            <div className="flex flex-col sm:flex-row items-center gap-6">
              {/* Player Fleet Grid */}
              <div className="flex flex-col items-center">
                <span className="text-xs font-mono text-[#f4ebd0]/70 mb-1">Your Fleet</span>
                <div
                  className="p-1 rounded-xl bg-[#141c28] border-2 border-[#2b3e58]"
                  style={{
                    display: 'grid',
                    gridTemplateRows: `repeat(${gridSize}, minmax(0, 1fr))`,
                    gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
                    gap: '2px',
                    width: `${gridSize * 36}px`,
                    height: `${gridSize * 36}px`,
                  }}
                >
                  {Array.from({ length: gridSize }).map((_, r) =>
                    Array.from({ length: gridSize }).map((_, c) => {
                      const key = `${r},${c}`;
                      const isShip = playerFleet.some((s) =>
                        s.cells.some(([sr, sc]) => sr === r && sc === c)
                      );
                      const shot = enemyShots.get(key);

                      return (
                        <div
                          key={key}
                          className={`relative rounded flex items-center justify-center text-[10px] ${
                            shot === 'hit'
                              ? 'bg-red-900/80 border border-red-500'
                              : shot === 'miss'
                              ? 'bg-[#182333]/50'
                              : isShip
                              ? 'bg-[#1d3557] border border-[#48cae4]/60'
                              : 'bg-[#0f1722]'
                          }`}
                        >
                          {shot === 'hit' && '💥'}
                          {shot === 'miss' && '•'}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Enemy Grid */}
              <div className="flex flex-col items-center">
                <span className="text-xs font-mono text-[#48cae4] mb-1">
                  Abyssal Mist Radar (Target)
                </span>
                <div
                  className="p-1 rounded-xl bg-[#141c28] border-2 border-[#48cae4]/50 shadow-[0_0_15px_#1d355750]"
                  style={{
                    display: 'grid',
                    gridTemplateRows: `repeat(${gridSize}, minmax(0, 1fr))`,
                    gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
                    gap: '2px',
                    width: `${gridSize * 36}px`,
                    height: `${gridSize * 36}px`,
                  }}
                >
                  {Array.from({ length: gridSize }).map((_, r) =>
                    Array.from({ length: gridSize }).map((_, c) => {
                      const key = `${r},${c}`;
                      const shot = playerShots.get(key);

                      return (
                        <button
                          key={key}
                          disabled={phase !== 'battle' || turn !== 'player' || Boolean(shot)}
                          onClick={() => handleFireAtEnemy(r, c)}
                          className={`relative rounded flex items-center justify-center text-[10px] transition-all ${
                            shot === 'hit'
                              ? 'bg-red-700 border border-red-400 text-white font-bold'
                              : shot === 'miss'
                              ? 'bg-[#1d2a3d] text-[#f4ebd0]/30'
                              : 'bg-[#141c28] hover:bg-[#1e2f47] active:bg-[#48cae4]/20'
                          }`}
                        >
                          {shot === 'hit' && '💥'}
                          {shot === 'miss' && '○'}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Info Drawer */}
          <div className="w-full md:w-72 bg-[#121a24] border-t md:border-t-0 md:border-l border-[#24354d] p-4 flex flex-col justify-between">
            <div className="space-y-3">
              <h3 className="font-serif font-bold text-xs uppercase tracking-wider text-[#48cae4]">
                Abyssal Naval Order
              </h3>
              <p className="text-xs text-[#f4ebd0]/70 leading-relaxed">
                The Drowned Isles are shrouded in supernatural ocean mist. Deploy your warships, calibrate radar sweeps, and sink the Kraken Fleet before your own flagship is submerged.
              </p>

              <div className="space-y-1.5 pt-2 border-t border-[#24354d] text-xs font-mono text-[#f4ebd0]/60">
                <div className="flex justify-between">
                  <span>Ships in Fleet:</span>
                  <span className="text-[#f4ebd0]">{playerFleet.length} Warships</span>
                </div>
                <div className="flex justify-between">
                  <span>Enemy Hits:</span>
                  <span className="text-red-400">
                    {Array.from(playerShots.values()).filter((v) => v === 'hit').length}
                  </span>
                </div>
              </div>
            </div>

            {/* Game Over Banner */}
            {winner && (
              <div
                className={`p-3 rounded-xl text-center space-y-2 border ${
                  winner === 'player'
                    ? 'bg-[#1d3557]/40 border-[#48cae4]'
                    : 'bg-red-950/40 border-red-700/60'
                }`}
              >
                <div className="text-xs font-serif font-bold text-[#f4ebd0]">
                  {winner === 'player' ? 'Kraken Fleet Sunk!' : 'Your Fleet Has Sunk!'}
                </div>
                <p className="text-[11px] text-[#f4ebd0]/70">
                  {winner === 'player'
                    ? 'The ocean mists part. Abyssal Navy ferry passages unlocked!'
                    : 'The cold tides take your armada. Reorganize and strike again.'}
                </p>
                <button
                  onClick={() => initGame(gridSize)}
                  className="w-full py-1.5 rounded-lg bg-[#48cae4] text-black font-bold text-xs hover:bg-[#72ddf4] transition"
                >
                  Play Again
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
