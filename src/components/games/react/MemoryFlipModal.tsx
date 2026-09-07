import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  Volume2,
  VolumeX,
  Layers,
} from 'lucide-react';
import { useAudio } from '../../../contexts/AudioContext';
import { useSpectrum } from '../../../contexts/SpectrumContext';
import { useSaveGame } from '../../../contexts/SaveGameContext';
import confetti from 'canvas-confetti';

const GLYPH_NAMES = [
  'mountain', 'river', 'sun', 'moon', 'star', 'flower', 'bamboo', 'lotus',
  'pine', 'wind', 'wave', 'leaf', 'crane', 'dragonfly', 'lantern', 'boat',
  'feather', 'droplet', 'stone', 'bridge', 'lightning', 'crescent', 'ripple', 'ember',
  'butterfly', 'fish', 'branch', 'reed', 'rain', 'cloud', 'sunflower', 'torii',
];

const ShapeGlyph: React.FC<{ shape: string }> = ({ shape }) => {
  switch (shape) {
    case 'mountain':
      return <span className="text-xl sm:text-2xl">⛰️</span>;
    case 'river':
      return <span className="text-xl sm:text-2xl">🌊</span>;
    case 'sun':
      return <span className="text-xl sm:text-2xl">☀️</span>;
    case 'moon':
      return <span className="text-xl sm:text-2xl">🌙</span>;
    case 'star':
      return <span className="text-xl sm:text-2xl">⭐</span>;
    case 'flower':
      return <span className="text-xl sm:text-2xl">🌸</span>;
    case 'bamboo':
      return <span className="text-xl sm:text-2xl">🎋</span>;
    case 'lotus':
      return <span className="text-xl sm:text-2xl">🪷</span>;
    case 'pine':
      return <span className="text-xl sm:text-2xl">🌲</span>;
    case 'wind':
      return <span className="text-xl sm:text-2xl">🍃</span>;
    case 'wave':
      return <span className="text-xl sm:text-2xl">🌀</span>;
    case 'lantern':
      return <span className="text-xl sm:text-2xl">🏮</span>;
    case 'crane':
      return <span className="text-xl sm:text-2xl">🕊️</span>;
    case 'dragonfly':
      return <span className="text-xl sm:text-2xl">🦗</span>;
    case 'stone':
      return <span className="text-xl sm:text-2xl">🪨</span>;
    case 'lightning':
      return <span className="text-xl sm:text-2xl">⚡</span>;
    default:
      return <span className="text-xl sm:text-2xl">💮</span>;
  }
};

type CardItem = {
  id: string;
  shape: string;
  isFlipped: boolean;
  isMatched: boolean;
};

interface MemoryFlipModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVictory?: () => void;
}

export const MemoryFlipModal: React.FC<MemoryFlipModalProps> = ({
  isOpen,
  onClose,
  onVictory,
}) => {
  const { isMuted, toggleMute, playSfx } = useAudio();
  const { unlockPigment, hasPigment } = useSpectrum();
  const { stampSeal, recordGameResult } = useSaveGame();

  const [gridSize, setGridSize] = useState<16 | 36>(16); // 16 = 4x4, 36 = 6x6
  const [cards, setCards] = useState<CardItem[]>([]);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [moves, setMoves] = useState<number>(0);
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [isWon, setIsWon] = useState<boolean>(false);

  const initGame = useCallback((size: 16 | 36) => {
    const pairCount = size / 2;
    const selectedShapes = GLYPH_NAMES.slice(0, pairCount);
    const deckShapes = [...selectedShapes, ...selectedShapes];

    // Shuffle
    for (let i = deckShapes.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deckShapes[i], deckShapes[j]] = [deckShapes[j], deckShapes[i]];
    }

    const initialCards: CardItem[] = deckShapes.map((shape, idx) => ({
      id: `${shape}-${idx}`,
      shape,
      isFlipped: false,
      isMatched: false,
    }));

    setGridSize(size);
    setCards(initialCards);
    setFlippedIndices([]);
    setMoves(0);
    setIsLocked(false);
    setIsWon(false);
  }, []);

  useEffect(() => {
    if (isOpen) {
      initGame(gridSize);
    }
  }, [isOpen, initGame, gridSize]);

  const handleCardClick = (idx: number) => {
    if (isLocked || isWon || cards[idx].isFlipped || cards[idx].isMatched) return;

    playSfx('clash');
    const newCards = [...cards];
    newCards[idx].isFlipped = true;
    setCards(newCards);

    const newFlipped = [...flippedIndices, idx];
    setFlippedIndices(newFlipped);

    if (newFlipped.length === 2) {
      setMoves((m) => m + 1);
      setIsLocked(true);

      const [firstIdx, secondIdx] = newFlipped;
      if (cards[firstIdx].shape === cards[secondIdx].shape) {
        // Match found!
        playSfx('seal-stamp');
        setTimeout(() => {
          newCards[firstIdx].isMatched = true;
          newCards[secondIdx].isMatched = true;
          setCards([...newCards]);
          setFlippedIndices([]);
          setIsLocked(false);

          if (newCards.every((c) => c.isMatched)) {
            setIsWon(true);
            playSfx('victory');
            confetti({ particleCount: 70, spread: 80, origin: { y: 0.6 } });

            recordGameResult('memory', true, 1800);
            if (!hasPigment('full-spectrum')) {
              unlockPigment('full-spectrum');
              stampSeal('full-spectrum', 1800);
            }
            onVictory?.();
          }
        }, 400);
      } else {
        // No match
        setTimeout(() => {
          newCards[firstIdx].isFlipped = false;
          newCards[secondIdx].isFlipped = false;
          setCards([...newCards]);
          setFlippedIndices([]);
          setIsLocked(false);
        }, 800);
      }
    }
  };

  if (!isOpen) return null;

  const cols = Math.sqrt(gridSize);

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
                <Layers size={18} className="text-[#f4ebd0]" />
                <h2 className="font-serif font-bold text-sm sm:text-base text-[#f4ebd0]">
                  Citadel Memory Flip
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-[#f4ebd0]/40 text-[#f4ebd0] bg-[#f4ebd0]/10">
                  The Obsidian Citadel
                </span>
              </div>
              <p className="text-[11px] text-[#f4ebd0]/50 font-mono">
                Glyph Archive Match • Moves: {moves}
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

        {/* Board Area */}
        <div className="flex-1 flex flex-col items-center justify-center p-4 bg-[#120d0f] overflow-auto">
          {/* Dimension Selector */}
          <div className="flex items-center justify-between w-full max-w-sm mb-4 px-2 text-xs font-mono">
            <div className="flex items-center gap-1 bg-[#201518] p-1 rounded-lg border border-[#352328]">
              {([16, 36] as const).map((sz) => (
                <button
                  key={sz}
                  onClick={() => initGame(sz)}
                  className={`px-3 py-1 rounded ${
                    gridSize === sz ? 'bg-[#b3312c] text-white font-bold' : 'text-[#f4ebd0]/50'
                  }`}
                >
                  {Math.sqrt(sz)}x{Math.sqrt(sz)} ({sz / 2} Pairs)
                </button>
              ))}
            </div>

            <button
              onClick={() => initGame(gridSize)}
              className="px-3 py-1 rounded bg-[#201518] border border-[#352328] hover:bg-[#2b1e22] text-[#f4ebd0]/70"
            >
              Reshuffle
            </button>
          </div>

          {/* Cards Grid */}
          <div
            className="p-3 rounded-2xl bg-[#22161a] border-2 border-[#3d252c] shadow-2xl"
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
              gap: gridSize === 36 ? '6px' : '10px',
              width: `${Math.min(380, cols * (gridSize === 36 ? 56 : 78))}px`,
              height: `${Math.min(380, cols * (gridSize === 36 ? 56 : 78))}px`,
            }}
          >
            {cards.map((card, idx) => (
              <button
                key={card.id}
                disabled={card.isMatched || isLocked}
                onClick={() => handleCardClick(idx)}
                className={`relative rounded-xl border-2 flex items-center justify-center transition-all ${
                  card.isFlipped || card.isMatched
                    ? 'bg-[#f4ebd0] border-[#b3312c] text-[#141414] shadow-md scale-100'
                    : 'bg-[#181013] border-[#382329] hover:bg-[#24171c]'
                }`}
              >
                {card.isFlipped || card.isMatched ? (
                  <ShapeGlyph shape={card.shape} />
                ) : (
                  <span className="font-serif text-[#b3312c]/40 font-bold text-xs sm:text-sm">
                    印
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Victory Overlay */}
          {isWon && (
            <div className="mt-4 p-3 rounded-xl bg-[#b3312c]/30 border border-[#b3312c] flex items-center gap-4 text-xs font-mono">
              <span>🏆 All Glyphs Restored in {moves} moves!</span>
              <button
                onClick={() => initGame(gridSize)}
                className="px-3 py-1 rounded bg-[#b3312c] text-white font-bold hover:bg-red-700 transition"
              >
                Play Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
