import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  Volume2,
  VolumeX,
  Grid3X3,
} from 'lucide-react';
import { useAudio } from '../../../contexts/AudioContext';
import { useSpectrum } from '../../../contexts/SpectrumContext';
import { useSaveGame } from '../../../contexts/SaveGameContext';
import { Cell, checkLineWin } from '../../../lib/games/lineWinCheck';
import { getColumnAIMove } from '../../../lib/games/columnAI';
import confetti from 'canvas-confetti';

const ROWS = 6;
const COLS = 7;

interface Connect4ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVictory?: () => void;
}

export const Connect4Modal: React.FC<Connect4ModalProps> = ({
  isOpen,
  onClose,
  onVictory,
}) => {
  const { isMuted, toggleMute, playSfx } = useAudio();
  const { unlockPigment, hasPigment } = useSpectrum();
  const { stampSeal, recordGameResult } = useSaveGame();

  const [board, setBoard] = useState<Cell[][]>(() =>
    Array.from({ length: ROWS }, () => Array(COLS).fill(0))
  );
  const [turn, setTurn] = useState<1 | 2>(1); // 1 = player, 2 = CPU
  const [winner, setWinner] = useState<Cell | 'draw' | null>(null);
  const [winningLine, setWinningLine] = useState<[number, number][]>([]);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [hoverCol, setHoverCol] = useState<number | null>(null);

  const initGame = useCallback(() => {
    setBoard(Array.from({ length: ROWS }, () => Array(COLS).fill(0)));
    setTurn(1);
    setWinner(null);
    setWinningLine([]);
  }, []);

  useEffect(() => {
    if (isOpen) {
      initGame();
    }
  }, [isOpen, initGame]);

  const dropStone = (col: number) => {
    if (winner || turn !== 1) return;

    let targetRow = -1;
    for (let r = ROWS - 1; r >= 0; r--) {
      if (board[r][col] === 0) {
        targetRow = r;
        break;
      }
    }

    if (targetRow === -1) return; // Column full

    playSfx('clash');
    const newBoard = board.map((row) => [...row]);
    newBoard[targetRow][col] = 1;
    setBoard(newBoard);

    const winCheck = checkLineWin(newBoard, targetRow, col, 4);
    if (winCheck.won) {
      setWinner(1);
      setWinningLine(winCheck.line);
      playSfx('victory');
      playSfx('seal-stamp');
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });

      recordGameResult('connect4', true, 1300);
      if (!hasPigment('blood-vermilion')) {
        unlockPigment('blood-vermilion');
        stampSeal('blood-vermilion', 1300);
      }
      onVictory?.();
      return;
    }

    // Check draw
    if (newBoard[0].every((c) => c !== 0)) {
      setWinner('draw');
      return;
    }

    setTurn(2);
    setTimeout(() => handleCPUTurn(newBoard), 450);
  };

  const handleCPUTurn = (currentBoard: Cell[][]) => {
    if (winner) return;

    const chosenCol = getColumnAIMove(currentBoard, difficulty, 2);
    if (chosenCol === -1) return;

    let targetRow = -1;
    for (let r = ROWS - 1; r >= 0; r--) {
      if (currentBoard[r][chosenCol] === 0) {
        targetRow = r;
        break;
      }
    }

    if (targetRow === -1) return;

    playSfx('clash');
    const newBoard = currentBoard.map((row) => [...row]);
    newBoard[targetRow][chosenCol] = 2;
    setBoard(newBoard);

    const winCheck = checkLineWin(newBoard, targetRow, chosenCol, 4);
    if (winCheck.won) {
      setWinner(2);
      setWinningLine(winCheck.line);
      playSfx('heavy-strike');
      return;
    }

    if (newBoard[0].every((c) => c !== 0)) {
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
                <Grid3X3 size={18} className="text-[#b3312c]" />
                <h2 className="font-serif font-bold text-sm sm:text-base text-[#f4ebd0]">
                  Red Viper's Gravity Grid
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-[#b3312c]/40 text-[#b3312c] bg-[#b3312c]/10">
                  The Scorched Dunes
                </span>
              </div>
              <p className="text-[11px] text-[#f4ebd0]/50 font-mono">
                Connect-4 Minimax Duel • First to align 4 unbroken stones
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
          {/* Difficulty & Turn Selector */}
          <div className="flex items-center justify-between w-full max-w-sm mb-3 px-2 text-xs font-mono">
            <div className="flex items-center gap-1 bg-[#201514] p-1 rounded-lg border border-[#331f1e]">
              {(['easy', 'medium', 'hard'] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => {
                    setDifficulty(d);
                    playSfx('click');
                  }}
                  className={`px-2.5 py-0.5 rounded capitalize ${
                    difficulty === d ? 'bg-[#b3312c] text-white font-bold' : 'text-[#f4ebd0]/50'
                  }`}
                >
                  {d}
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

          {/* Connect 4 Matrix */}
          <div className="p-3 rounded-2xl bg-[#2a1715] border-4 border-[#3d1d1a] shadow-2xl flex flex-col gap-2">
            {/* Hover Column Indicator */}
            <div className="grid grid-cols-7 gap-2 h-5">
              {Array.from({ length: COLS }).map((_, c) => (
                <div
                  key={c}
                  className={`flex items-center justify-center text-xs ${
                    hoverCol === c && turn === 1 && !winner ? 'text-[#b3312c]' : 'opacity-0'
                  }`}
                >
                  ▼
                </div>
              ))}
            </div>

            {/* Grid Cells */}
            <div className="grid grid-cols-7 gap-2">
              {board.map((row, r) =>
                row.map((cell, c) => {
                  const isWinningCell = winningLine.some(([wr, wc]) => wr === r && wc === c);

                  return (
                    <button
                      key={`${r}-${c}`}
                      disabled={turn !== 1 || Boolean(winner) || board[0][c] !== 0}
                      onMouseEnter={() => setHoverCol(c)}
                      onMouseLeave={() => setHoverCol(null)}
                      onClick={() => dropStone(c)}
                      className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 flex items-center justify-center transition-all ${
                        cell === 1
                          ? 'bg-[#b3312c] border-red-400 shadow-[0_0_12px_#b3312c]'
                          : cell === 2
                          ? 'bg-[#1a1a1a] border-[#555] shadow-[0_0_10px_#000]'
                          : 'bg-[#190e0d] border-[#381c19] hover:bg-[#231412]'
                      } ${isWinningCell ? 'animate-bounce border-white' : ''}`}
                    />
                  );
                })
              )}
            </div>
          </div>

          {/* Victory / Defeat Overlay */}
          {winner && (
            <div className="mt-4 p-3 rounded-xl bg-[#261211] border border-[#b3312c] flex items-center gap-4 text-xs font-mono">
              <span>
                {winner === 1
                  ? '🏆 Victory! The Red Viper acknowledges your tactical mind.'
                  : winner === 2
                  ? '💀 Defeat! The Viper outmaneuvered your stones.'
                  : '🤝 Stalemate draw!'}
              </span>
              <button
                onClick={initGame}
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
