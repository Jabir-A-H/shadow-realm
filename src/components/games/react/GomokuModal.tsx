import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  Volume2,
  VolumeX,
  CircleDot,
} from 'lucide-react';
import { useAudio } from '../../../contexts/AudioContext';
import { useSpectrum } from '../../../contexts/SpectrumContext';
import { useSaveGame } from '../../../contexts/SaveGameContext';
import { Cell, checkLineWin } from '../../../lib/games/lineWinCheck';
import { getStonesAIMove } from '../../../lib/games/stonesAI';
import confetti from 'canvas-confetti';

type BoardDim = 3 | 9 | 15;

const WIN_LENGTH_MAP: Record<BoardDim, number> = {
  3: 3,
  9: 4,
  15: 5,
};

interface GomokuModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVictory?: () => void;
}

export const GomokuModal: React.FC<GomokuModalProps> = ({
  isOpen,
  onClose,
  onVictory,
}) => {
  const { isMuted, toggleMute, playSfx } = useAudio();
  const { unlockPigment, hasPigment } = useSpectrum();
  const { stampSeal, recordGameResult } = useSaveGame();

  const [dimension, setDimension] = useState<BoardDim>(9);
  const [board, setBoard] = useState<Cell[][]>(() =>
    Array.from({ length: 9 }, () => Array(9).fill(0))
  );
  const [turn, setTurn] = useState<1 | 2>(1);
  const [winner, setWinner] = useState<Cell | 'draw' | null>(null);
  const [winningLine, setWinningLine] = useState<[number, number][]>([]);
  const [difficulty] = useState<'easy' | 'medium' | 'hard'>('medium');

  const winLength = WIN_LENGTH_MAP[dimension];

  const initGame = useCallback((dim: BoardDim) => {
    setDimension(dim);
    setBoard(Array.from({ length: dim }, () => Array(dim).fill(0)));
    setTurn(1);
    setWinner(null);
    setWinningLine([]);
  }, []);

  useEffect(() => {
    if (isOpen) {
      initGame(dimension);
    }
  }, [isOpen, initGame, dimension]);

  const handleCellClick = (r: number, c: number) => {
    if (board[r][c] !== 0 || turn !== 1 || winner) return;

    playSfx('clash');
    const newBoard = board.map((row) => [...row]);
    newBoard[r][c] = 1;
    setBoard(newBoard);

    const winCheck = checkLineWin(newBoard, r, c, winLength);
    if (winCheck.won) {
      setWinner(1);
      setWinningLine(winCheck.line);
      playSfx('victory');
      playSfx('seal-stamp');
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });

      recordGameResult('gomoku', true, 1300);
      if (!hasPigment('blood-vermilion')) {
        unlockPigment('blood-vermilion');
        stampSeal('blood-vermilion', 1300);
      }
      onVictory?.();
      return;
    }

    // Check Draw
    const isFull = newBoard.every((row) => row.every((cell) => cell !== 0));
    if (isFull) {
      setWinner('draw');
      return;
    }

    setTurn(2);
    setTimeout(() => handleCPUTurn(newBoard), 300);
  };

  const handleCPUTurn = (currentBoard: Cell[][]) => {
    if (winner) return;

    const move = getStonesAIMove(currentBoard, difficulty, 2, winLength);
    if (move[0] === -1) return;

    const [r, c] = move;
    playSfx('clash');
    const newBoard = currentBoard.map((row) => [...row]);
    newBoard[r][c] = 2;
    setBoard(newBoard);

    const winCheck = checkLineWin(newBoard, r, c, winLength);
    if (winCheck.won) {
      setWinner(2);
      setWinningLine(winCheck.line);
      playSfx('heavy-strike');
      return;
    }

    const isFull = newBoard.every((row) => row.every((cell) => cell !== 0));
    if (isFull) {
      setWinner('draw');
      return;
    }

    setTurn(1);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/90 backdrop-blur-md select-none overflow-hidden font-sans">
      <div className="relative w-full h-full max-w-3xl max-h-[92vh] bg-[#141414] border-2 border-[#b3312c] rounded-2xl flex flex-col shadow-2xl shadow-[#b3312c]/20 overflow-hidden text-[#f4ebd0]">
        {/* Header */}
        <header className="flex items-center justify-between px-4 py-3 bg-[#261211] border-b border-[#3d1c1a] shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                playSfx('click');
                onClose();
              }}
              className="p-1.5 rounded-lg bg-[#301716] hover:bg-[#3d1e1c] border border-[#4d2422] text-[#f4ebd0]/70 hover:text-white transition flex items-center gap-1 text-xs font-mono"
            >
              <X size={16} />
              <span className="hidden sm:inline">Exit</span>
            </button>
            <div>
              <div className="flex items-center gap-2">
                <CircleDot size={18} className="text-[#b3312c]" />
                <h2 className="font-serif font-bold text-sm sm:text-base text-[#f4ebd0]">
                  Dune Gomoku & Stones
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-[#b3312c]/40 text-[#b3312c] bg-[#b3312c]/10">
                  The Scorched Dunes
                </span>
              </div>
              <p className="text-[11px] text-[#f4ebd0]/50 font-mono">
                {dimension}x{dimension} Grid • Align {winLength} stones in unbroken succession
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleMute}
              className="p-2 rounded-lg bg-[#301716] hover:bg-[#3d1e1c] border border-[#4d2422] text-[#f4ebd0]/70 hover:text-white transition"
            >
              {isMuted ? <VolumeX size={16} className="text-red-400" /> : <Volume2 size={16} />}
            </button>
          </div>
        </header>

        {/* Board Area */}
        <div className="flex-1 flex flex-col items-center justify-center p-4 bg-[#140f0e] overflow-auto">
          {/* Dim Switcher */}
          <div className="flex items-center justify-between w-full max-w-sm mb-3 px-2 text-xs font-mono">
            <div className="flex items-center gap-1 bg-[#201514] p-1 rounded-lg border border-[#331f1e]">
              {([3, 9, 15] as BoardDim[]).map((d) => (
                <button
                  key={d}
                  onClick={() => initGame(d)}
                  className={`px-2.5 py-0.5 rounded ${
                    dimension === d ? 'bg-[#b3312c] text-white font-bold' : 'text-[#f4ebd0]/50'
                  }`}
                >
                  {d}x{d}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <span className={turn === 1 ? 'text-[#b3312c] font-bold' : 'text-[#f4ebd0]/50'}>
                You (Crimson)
              </span>
              <span>vs</span>
              <span className={turn === 2 ? 'text-[#f4ebd0] font-bold' : 'text-[#f4ebd0]/50'}>
                Viper (Obsidian)
              </span>
            </div>
          </div>

          {/* Gomoku Grid */}
          <div
            className="p-2 rounded-xl bg-[#221312] border-2 border-[#3d1d1a] shadow-2xl"
            style={{
              display: 'grid',
              gridTemplateRows: `repeat(${dimension}, minmax(0, 1fr))`,
              gridTemplateColumns: `repeat(${dimension}, minmax(0, 1fr))`,
              gap: dimension === 15 ? '2px' : '4px',
              width: `${Math.min(380, dimension * (dimension === 15 ? 24 : 38))}px`,
              height: `${Math.min(380, dimension * (dimension === 15 ? 24 : 38))}px`,
            }}
          >
            {board.map((row, r) =>
              row.map((cell, c) => {
                const isWinning = winningLine.some(([wr, wc]) => wr === r && wc === c);

                return (
                  <button
                    key={`${r}-${c}`}
                    disabled={turn !== 1 || cell !== 0 || Boolean(winner)}
                    onClick={() => handleCellClick(r, c)}
                    className={`rounded-full flex items-center justify-center transition-all ${
                      cell === 1
                        ? 'bg-[#b3312c] border border-red-400 shadow-[0_0_8px_#b3312c]'
                        : cell === 2
                        ? 'bg-[#181818] border border-[#555] shadow-[0_0_6px_#000]'
                        : 'bg-[#180e0d] border border-[#2d1614] hover:bg-[#2c1715]'
                    } ${isWinning ? 'animate-bounce border-white' : ''}`}
                  />
                );
              })
            )}
          </div>

          {/* Victory Overlay */}
          {winner && (
            <div className="mt-4 p-3 rounded-xl bg-[#261211] border border-[#b3312c] flex items-center gap-4 text-xs font-mono">
              <span>
                {winner === 1
                  ? '🏆 Victory! Your stone line remains unbroken.'
                  : winner === 2
                  ? '💀 Defeat! The Red Viper completed his alignment.'
                  : '🤝 Stalemate draw!'}
              </span>
              <button
                onClick={() => initGame(dimension)}
                className="px-3 py-1 rounded bg-[#b3312c] text-white font-bold hover:bg-red-700 transition"
              >
                Rematch
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
