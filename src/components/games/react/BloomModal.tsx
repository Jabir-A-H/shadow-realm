import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  Volume2,
  VolumeX,
  Flower2,
} from 'lucide-react';
import { useAudio } from '../../../contexts/AudioContext';
import { useSpectrum } from '../../../contexts/SpectrumContext';
import { useSaveGame } from '../../../contexts/SaveGameContext';
import {
  Player,
  BloomBoard,
  getCapacity,
  getNeighbors,
  cloneBoard,
  getBloomAIMove,
} from '../../../lib/games/bloomAI';
import confetti from 'canvas-confetti';

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

const createInitialBoard = (rows: number, cols: number): BloomBoard => {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({
      owner: null,
      orbs: 0,
    }))
  );
};

interface BloomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVictory?: () => void;
}

export const BloomModal: React.FC<BloomModalProps> = ({
  isOpen,
  onClose,
  onVictory,
}) => {
  const { isMuted, toggleMute, playSfx } = useAudio();
  const { unlockPigment, hasPigment } = useSpectrum();
  const { stampSeal, recordGameResult } = useSaveGame();

  const [gridDimensions, setGridDimensions] = useState<{ rows: number; cols: number }>({
    rows: 6,
    cols: 5,
  });
  const [board, setBoard] = useState<BloomBoard>(() => createInitialBoard(6, 5));
  const [currentPlayer, setCurrentPlayer] = useState<Player>(1);
  const [isCascading, setIsCascading] = useState<boolean>(false);
  const [winner, setWinner] = useState<Player | null>(null);
  const [turnCount, setTurnCount] = useState<number>(0);

  const { rows, cols } = gridDimensions;

  const initGame = useCallback((r = 6, c = 5) => {
    setGridDimensions({ rows: r, cols: c });
    setBoard(createInitialBoard(r, c));
    setCurrentPlayer(1);
    setIsCascading(false);
    setWinner(null);
    setTurnCount(0);
  }, []);

  useEffect(() => {
    if (isOpen) {
      initGame(6, 5);
    }
  }, [isOpen, initGame]);

  const triggerCascade = async (initialBoard: BloomBoard, player: Player) => {
    setIsCascading(true);
    let currentBoard = cloneBoard(initialBoard);

    let hasOverCapacity = true;
    let iterations = 0;
    const maxIterations = 30;

    while (hasOverCapacity && iterations < maxIterations) {
      iterations++;
      const explodingCells: [number, number][] = [];

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (currentBoard[r][c].orbs >= getCapacity(r, c, rows, cols)) {
            explodingCells.push([r, c]);
          }
        }
      }

      if (explodingCells.length === 0) {
        hasOverCapacity = false;
        break;
      }

      playSfx('ink-splash');

      const nextBoard = cloneBoard(currentBoard);
      for (const [r, c] of explodingCells) {
        const cap = getCapacity(r, c, rows, cols);
        nextBoard[r][c].orbs -= cap;
        if (nextBoard[r][c].orbs === 0) {
          nextBoard[r][c].owner = null;
        }

        const neighbors = getNeighbors(r, c, rows, cols);
        for (const [nr, nc] of neighbors) {
          nextBoard[nr][nc].orbs++;
          nextBoard[nr][nc].owner = player;
        }
      }

      currentBoard = nextBoard;
      setBoard(currentBoard);
      await delay(220);

      if (turnCount >= 2) {
        const opponent: Player = player === 1 ? 2 : 1;
        let opponentOrbs = 0;
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            if (currentBoard[r][c].owner === opponent) {
              opponentOrbs += currentBoard[r][c].orbs;
            }
          }
        }

        if (opponentOrbs === 0) {
          setWinner(player);
          setIsCascading(false);

          if (player === 1) {
            playSfx('victory');
            playSfx('seal-stamp');
            confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });

            recordGameResult('bloom', true, 1400);
            if (!hasPigment('emerald-jade')) {
              unlockPigment('emerald-jade');
              stampSeal('emerald-jade', 1400);
            }
            onVictory?.();
          } else {
            playSfx('heavy-strike');
          }
          return;
        }
      }
    }

    setIsCascading(false);
    const nextPlayer: Player = player === 1 ? 2 : 1;
    setCurrentPlayer(nextPlayer);
    setTurnCount((t) => t + 1);

    if (nextPlayer === 2 && !winner) {
      setTimeout(() => handleCPUTurn(currentBoard), 300);
    }
  };

  const handleCellClick = (r: number, c: number) => {
    if (isCascading || winner || currentPlayer !== 1) return;

    const cell = board[r][c];
    if (cell.owner !== null && cell.owner !== 1) {
      playSfx('whiff');
      return;
    }

    playSfx('clash');
    const newBoard = cloneBoard(board);
    newBoard[r][c].orbs++;
    newBoard[r][c].owner = 1;
    setBoard(newBoard);

    if (newBoard[r][c].orbs >= getCapacity(r, c, rows, cols)) {
      triggerCascade(newBoard, 1);
    } else {
      setCurrentPlayer(2);
      setTurnCount((t) => t + 1);
      setTimeout(() => handleCPUTurn(newBoard), 400);
    }
  };

  const handleCPUTurn = (currentBoard: BloomBoard) => {
    if (winner) return;

    const move = getBloomAIMove(currentBoard, 'medium', 2, rows, cols);
    if (!move || move[0] === -1) return;

    const [r, c] = move;
    playSfx('clash');
    const newBoard = cloneBoard(currentBoard);
    newBoard[r][c].orbs++;
    newBoard[r][c].owner = 2;
    setBoard(newBoard);

    if (newBoard[r][c].orbs >= getCapacity(r, c, rows, cols)) {
      triggerCascade(newBoard, 2);
    } else {
      setCurrentPlayer(1);
      setTurnCount((t) => t + 1);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/90 backdrop-blur-md select-none overflow-hidden font-sans">
      <div className="relative w-full h-full max-w-4xl max-h-[92vh] bg-[#141414] border-2 border-[#2d6a4f] rounded-2xl flex flex-col shadow-2xl shadow-[#2d6a4f]/20 overflow-hidden text-[#f4ebd0]">
        {/* Header */}
        <header className="flex items-center justify-between px-4 py-3 bg-[#13221b] border-b border-[#203a2e] shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                playSfx('click');
                onClose();
              }}
              className="p-1.5 rounded-lg bg-[#1a2f25] hover:bg-[#233d31] border border-[#2f5041] text-[#f4ebd0]/70 hover:text-white transition flex items-center gap-1 text-xs font-mono"
            >
              <X size={16} />
              <span className="hidden sm:inline">Exit</span>
            </button>
            <div>
              <div className="flex items-center gap-2">
                <Flower2 size={18} className="text-[#52b788]" />
                <h2 className="font-serif font-bold text-sm sm:text-base text-[#f4ebd0]">
                  Bloom (Chain Reaction)
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-[#52b788]/40 text-[#52b788] bg-[#2d6a4f]/20">
                  The Verdant Reach
                </span>
              </div>
              <p className="text-[11px] text-[#f4ebd0]/50 font-mono">
                Thornwood Garden Spore Duel • Turn {turnCount + 1}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleMute}
              className="p-2 rounded-lg bg-[#1a2f25] hover:bg-[#233d31] border border-[#2f5041] text-[#f4ebd0]/70 hover:text-white transition"
            >
              {isMuted ? <VolumeX size={16} className="text-red-400" /> : <Volume2 size={16} />}
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Main Board */}
          <div className="flex-1 flex flex-col items-center justify-center p-4 bg-[#0d1612] overflow-auto">
            {/* Top Bar */}
            <div className="flex items-center justify-between w-full max-w-sm mb-3 px-2 text-xs font-mono">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => initGame(6, 5)}
                  className={`px-2 py-1 rounded ${
                    rows === 6 ? 'bg-[#2d6a4f] text-white font-bold' : 'bg-[#15231c] text-[#f4ebd0]/60'
                  }`}
                >
                  6x5 Grid
                </button>
                <button
                  onClick={() => initGame(9, 6)}
                  className={`px-2 py-1 rounded ${
                    rows === 9 ? 'bg-[#2d6a4f] text-white font-bold' : 'bg-[#15231c] text-[#f4ebd0]/60'
                  }`}
                >
                  9x6 Grid
                </button>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-0.5 rounded ${
                    currentPlayer === 1 ? 'bg-[#52b788] text-black font-bold' : 'text-[#f4ebd0]/50'
                  }`}
                >
                  You (Jade)
                </span>
                <span>vs</span>
                <span
                  className={`px-2 py-0.5 rounded ${
                    currentPlayer === 2 ? 'bg-red-500 text-white font-bold' : 'text-[#f4ebd0]/50'
                  }`}
                >
                  Thorns (Crimson)
                </span>
              </div>
            </div>

            {/* Spore Grid */}
            <div
              className="relative p-2 rounded-xl bg-[#14221b] border-2 border-[#22392d] shadow-2xl"
              style={{
                display: 'grid',
                gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
                gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
                gap: '4px',
                width: `${cols * 56}px`,
                height: `${rows * 56}px`,
              }}
            >
              {board.map((row, r) =>
                row.map((cell, c) => {
                  const cap = getCapacity(r, c, rows, cols);
                  const isCritical = cell.orbs === cap - 1;

                  return (
                    <button
                      key={`${r}-${c}`}
                      disabled={isCascading || Boolean(winner) || (cell.owner !== null && cell.owner !== 1)}
                      onClick={() => handleCellClick(r, c)}
                      className={`relative rounded-lg flex items-center justify-center transition-all ${
                        cell.owner === 1
                          ? 'bg-[#1b4332] border border-[#52b788]/60 shadow-[0_0_8px_#52b78830]'
                          : cell.owner === 2
                          ? 'bg-red-950/60 border border-red-500/60 shadow-[0_0_8px_#b3312c30]'
                          : 'bg-[#0f1a14] border border-[#1b2c23] hover:bg-[#18281f]'
                      } ${isCritical ? 'animate-pulse' : ''}`}
                    >
                      {cell.orbs > 0 && (
                        <div className="flex flex-wrap items-center justify-center gap-1 p-1">
                          {Array.from({ length: cell.orbs }).map((_, idx) => (
                            <div
                              key={idx}
                              className={`w-2.5 h-2.5 rounded-full ${
                                cell.owner === 1 ? 'bg-[#52b788]' : 'bg-red-400'
                              } shadow-sm`}
                            />
                          ))}
                        </div>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Info Drawer */}
          <div className="w-full md:w-72 bg-[#101b15] border-t md:border-t-0 md:border-l border-[#203a2e] p-4 flex flex-col justify-between">
            <div className="space-y-3">
              <h3 className="font-serif font-bold text-xs uppercase tracking-wider text-[#52b788]">
                Thornwood Bloom Codex
              </h3>
              <p className="text-xs text-[#f4ebd0]/70 leading-relaxed">
                Plant jade spores on empty soil or your existing spores. When a cell exceeds capacity (Corner: 2, Edge: 3, Center: 4), it explodes into adjacent cells, converting enemy spores to your color!
              </p>

              <div className="space-y-1.5 pt-2 border-t border-[#203a2e] text-xs font-mono text-[#f4ebd0]/60">
                <div className="flex justify-between">
                  <span>Corners Explode:</span>
                  <span className="text-[#f4ebd0]">at 2 spores</span>
                </div>
                <div className="flex justify-between">
                  <span>Edges Explode:</span>
                  <span className="text-[#f4ebd0]">at 3 spores</span>
                </div>
                <div className="flex justify-between">
                  <span>Centers Explode:</span>
                  <span className="text-[#f4ebd0]">at 4 spores</span>
                </div>
              </div>
            </div>

            {/* Victory / Defeat */}
            {winner && (
              <div
                className={`p-3 rounded-xl text-center space-y-2 border ${
                  winner === 1
                    ? 'bg-[#2d6a4f]/30 border-[#52b788]'
                    : 'bg-red-950/40 border-red-700/60'
                }`}
              >
                <div className="text-xs font-serif font-bold text-[#f4ebd0]">
                  {winner === 1 ? 'Garden Conquered!' : 'Consumed by Thorns!'}
                </div>
                <p className="text-[11px] text-[#f4ebd0]/70">
                  {winner === 1
                    ? 'Living vine ladders revealed. Vertical traversal unlocked across cliff faces!'
                    : 'The briars grew too fierce. Cultivate a new approach and try again.'}
                </p>
                <button
                  onClick={() => initGame(rows, cols)}
                  className="w-full py-1.5 rounded-lg bg-[#52b788] text-black font-bold text-xs hover:bg-[#74c69d] transition"
                >
                  Grow Again
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
