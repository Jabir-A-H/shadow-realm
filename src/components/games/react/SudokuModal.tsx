import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  Volume2,
  VolumeX,
  BookOpen,
  CheckCircle2,
} from 'lucide-react';
import { useAudio } from '../../../contexts/AudioContext';
import { useSpectrum } from '../../../contexts/SpectrumContext';
import { useSaveGame } from '../../../contexts/SaveGameContext';
import puzzlesData from '../../../data/sudoku-puzzles.json';
import confetti from 'canvas-confetti';

type Difficulty = 'easy' | 'medium' | 'hard';

const typedPuzzles = puzzlesData as Record<string, string[]>;

interface SudokuModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVictory?: () => void;
}

export const SudokuModal: React.FC<SudokuModalProps> = ({
  isOpen,
  onClose,
  onVictory,
}) => {
  const { isMuted, toggleMute, playSfx } = useAudio();
  const { unlockPigment, hasPigment } = useSpectrum();
  const { stampSeal, recordGameResult } = useSaveGame();

  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [initialGrid, setInitialGrid] = useState<number[][]>(() =>
    Array.from({ length: 9 }, () => Array(9).fill(0))
  );
  const [grid, setGrid] = useState<number[][]>(() =>
    Array.from({ length: 9 }, () => Array(9).fill(0))
  );
  const [notes, setNotes] = useState<boolean[][][]>(() =>
    Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => Array(10).fill(false)))
  );
  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(null);
  const [mode, setMode] = useState<'pen' | 'pencil'>('pen');
  const [isWon, setIsWon] = useState<boolean>(false);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  // Load puzzle
  const loadPuzzle = useCallback(
    (diff: Difficulty) => {
      const list = typedPuzzles[diff] || typedPuzzles['easy'];
      const rawStr = list[Math.floor(Math.random() * list.length)];

      const parsed: number[][] = [];
      for (let r = 0; r < 9; r++) {
        const row: number[] = [];
        for (let c = 0; c < 9; c++) {
          const char = rawStr[r * 9 + c];
          row.push(char === '0' || char === '.' ? 0 : parseInt(char, 10));
        }
        parsed.push(row);
      }

      setInitialGrid(parsed);
      setGrid(parsed.map((r) => [...r]));
      setNotes(Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => Array(10).fill(false))));
      setSelectedCell(null);
      setIsWon(false);
      setElapsedSeconds(0);
    },
    []
  );

  useEffect(() => {
    if (isOpen) {
      loadPuzzle(difficulty);
    }
  }, [isOpen, difficulty, loadPuzzle]);

  // Timer
  useEffect(() => {
    if (!isOpen || isWon) return;
    const interval = setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen, isWon]);

  // Check Sudoku validity
  const checkCompletion = (board: number[][]) => {
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (board[r][c] === 0) return false;
      }
    }

    // Rows and columns check
    for (let i = 0; i < 9; i++) {
      const rowSet = new Set<number>();
      const colSet = new Set<number>();
      for (let j = 0; j < 9; j++) {
        rowSet.add(board[i][j]);
        colSet.add(board[j][i]);
      }
      if (rowSet.size !== 9 || colSet.size !== 9) return false;
    }

    // 3x3 box check
    for (let br = 0; br < 3; br++) {
      for (let bc = 0; bc < 3; bc++) {
        const boxSet = new Set<number>();
        for (let r = 0; r < 3; r++) {
          for (let c = 0; c < 3; c++) {
            boxSet.add(board[br * 3 + r][bc * 3 + c]);
          }
        }
        if (boxSet.size !== 9) return false;
      }
    }

    return true;
  };

  const handleNumberInput = (num: number) => {
    if (!selectedCell || isWon) return;
    const [r, c] = selectedCell;

    // Cannot edit initial puzzle clues
    if (initialGrid[r][c] !== 0) return;

    playSfx('click');

    if (mode === 'pencil') {
      const newNotes = notes.map((row) => row.map((cellNotes) => [...cellNotes]));
      newNotes[r][c][num] = !newNotes[r][c][num];
      setNotes(newNotes);
    } else {
      const newGrid = grid.map((row) => [...row]);
      newGrid[r][c] = newGrid[r][c] === num ? 0 : num;
      setGrid(newGrid);

      if (checkCompletion(newGrid)) {
        setIsWon(true);
        playSfx('victory');
        playSfx('seal-stamp');
        confetti({ particleCount: 70, spread: 80, origin: { y: 0.6 } });

        recordGameResult('sudoku', true, 2000);
        if (!hasPigment('full-spectrum')) {
          unlockPigment('full-spectrum');
          stampSeal('full-spectrum', 2000);
        }
        onVictory?.();
      }
    }
  };

  // Keyboard number inputs
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '1' && e.key <= '9') {
        handleNumberInput(parseInt(e.key, 10));
      } else if (e.key === 'Backspace' || e.key === 'Delete') {
        if (selectedCell) {
          const [r, c] = selectedCell;
          if (initialGrid[r][c] === 0) {
            const newGrid = grid.map((row) => [...row]);
            newGrid[r][c] = 0;
            setGrid(newGrid);
          }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  const formatTimer = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/90 backdrop-blur-md select-none overflow-hidden font-sans">
      <div className="relative w-full h-full max-w-3xl max-h-[92vh] bg-[#141414] border-2 border-[#b3312c] rounded-2xl flex flex-col shadow-2xl shadow-[#b3312c]/20 overflow-hidden text-[#f4ebd0]">
        {/* Header */}
        <header className="flex items-center justify-between px-4 py-3 bg-[#1e1518] border-b border-[#35252a] shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                playSfx('click');
                onClose();
              }}
              className="p-1.5 rounded-lg bg-[#2b1e22] hover:bg-[#38272c] border border-[#443037] text-[#f4ebd0]/70 hover:text-white transition flex items-center gap-1 text-xs font-mono"
            >
              <X size={16} />
              <span className="hidden sm:inline">Exit</span>
            </button>
            <div>
              <div className="flex items-center gap-2">
                <BookOpen size={18} className="text-[#f4ebd0]" />
                <h2 className="font-serif font-bold text-sm sm:text-base text-[#f4ebd0]">
                  Citadel Logic Scrolls (Sudoku)
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-[#f4ebd0]/40 text-[#f4ebd0] bg-[#f4ebd0]/10">
                  The Obsidian Citadel
                </span>
              </div>
              <p className="text-[11px] text-[#f4ebd0]/50 font-mono">
                Decipher the 9x9 Primordial Matrix • Time: {formatTimer(elapsedSeconds)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleMute}
              className="p-2 rounded-lg bg-[#2b1e22] hover:bg-[#38272c] border border-[#443037] text-[#f4ebd0]/70 hover:text-white transition"
            >
              {isMuted ? <VolumeX size={16} className="text-red-400" /> : <Volume2 size={16} />}
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 flex flex-col md:flex-row items-center justify-center p-4 bg-[#120d0f] overflow-auto gap-6">
          {/* Main 9x9 Grid */}
          <div className="flex flex-col items-center">
            {/* Tier & Mode Toolbar */}
            <div className="flex items-center justify-between w-full max-w-sm mb-3 text-xs font-mono">
              <div className="flex items-center gap-1 bg-[#201518] p-1 rounded-lg border border-[#352328]">
                {(['easy', 'medium', 'hard'] as const).map((d) => (
                  <button
                    key={d}
                    onClick={() => {
                      setDifficulty(d);
                      playSfx('click');
                    }}
                    className={`px-2 py-0.5 rounded capitalize ${
                      difficulty === d ? 'bg-[#b3312c] text-white font-bold' : 'text-[#f4ebd0]/50'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1 bg-[#201518] p-1 rounded-lg border border-[#352328]">
                <button
                  onClick={() => setMode('pen')}
                  className={`px-2 py-0.5 rounded ${
                    mode === 'pen' ? 'bg-[#f4ebd0] text-black font-bold' : 'text-[#f4ebd0]/50'
                  }`}
                >
                  Pen
                </button>
                <button
                  onClick={() => setMode('pencil')}
                  className={`px-2 py-0.5 rounded ${
                    mode === 'pencil' ? 'bg-[#e0a96d] text-black font-bold' : 'text-[#f4ebd0]/50'
                  }`}
                >
                  Pencil
                </button>
              </div>
            </div>

            {/* 9x9 Board */}
            <div className="p-1 rounded-xl bg-[#261a1e] border-4 border-[#3f2b31] shadow-2xl grid grid-cols-9 gap-[1px]">
              {grid.map((row, r) =>
                row.map((val, c) => {
                  const isInitial = initialGrid[r][c] !== 0;
                  const isSelected = selectedCell?.[0] === r && selectedCell?.[1] === c;
                  const isSameBlock =
                    selectedCell &&
                    (selectedCell[0] === r ||
                      selectedCell[1] === c ||
                      (Math.floor(selectedCell[0] / 3) === Math.floor(r / 3) &&
                        Math.floor(selectedCell[1] / 3) === Math.floor(c / 3)));

                  const borderRight = c % 3 === 2 && c !== 8 ? 'border-r-2 border-r-[#5e4149]' : '';
                  const borderBottom = r % 3 === 2 && r !== 8 ? 'border-b-2 border-b-[#5e4149]' : '';

                  return (
                    <button
                      key={`${r}-${c}`}
                      onClick={() => setSelectedCell([r, c])}
                      className={`w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center font-mono text-sm sm:text-base font-bold transition-all ${borderRight} ${borderBottom} ${
                        isSelected
                          ? 'bg-[#b3312c] text-white shadow-inner'
                          : isSameBlock
                          ? 'bg-[#211619]'
                          : 'bg-[#181013]'
                      } ${isInitial ? 'text-[#f4ebd0]' : 'text-[#48cae4]'}`}
                    >
                      {val !== 0 ? (
                        val
                      ) : (
                        <div className="grid grid-cols-3 gap-[1px] text-[7px] text-[#e0a96d]/60 leading-none">
                          {Array.from({ length: 9 }).map((_, n) => (
                            <span key={n}>{notes[r][c][n + 1] ? n + 1 : ''}</span>
                          ))}
                        </div>
                      )}
                    </button>
                  );
                })
              )}
            </div>

            {/* Number Pad for Mobile / Clicks */}
            <div className="flex gap-1.5 mt-4">
              {Array.from({ length: 9 }).map((_, i) => (
                <button
                  key={i + 1}
                  onClick={() => handleNumberInput(i + 1)}
                  className="w-8 h-9 sm:w-10 sm:h-10 rounded-lg bg-[#22161a] hover:bg-[#312025] border border-[#3b272d] text-sm font-mono font-bold text-[#f4ebd0]"
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </div>

          {/* Victory State Banner */}
          {isWon && (
            <div className="p-4 rounded-xl bg-[#b3312c]/30 border border-[#b3312c] text-center space-y-2 max-w-xs">
              <div className="text-sm font-serif font-bold text-[#f4ebd0] flex items-center justify-center gap-1">
                <CheckCircle2 size={18} className="text-green-400" />
                Scroll Deciphered!
              </div>
              <p className="text-xs text-[#f4ebd0]/80">
                You solved the 9x9 logic matrix in {formatTimer(elapsedSeconds)}. The Obsidian Citadel Ancient Rift Gate weakens!
              </p>
              <button
                onClick={() => loadPuzzle(difficulty)}
                className="w-full py-1.5 rounded-lg bg-[#b3312c] text-white font-bold text-xs hover:bg-red-700 transition"
              >
                Decipher Next Scroll
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
