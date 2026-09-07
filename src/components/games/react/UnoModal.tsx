import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  Volume2,
  VolumeX,
  Bot,
  Flame,
} from 'lucide-react';
import { useAudio } from '../../../contexts/AudioContext';
import { useSpectrum } from '../../../contexts/SpectrumContext';
import { useSaveGame } from '../../../contexts/SaveGameContext';
import {
  Card,
  CardColor,
  CardValue,
} from '../../../lib/games/unoEngine';
import confetti from 'canvas-confetti';

const INK_COLORS: { id: CardColor; name: string; bg: string; border: string; text: string }[] = [
  { id: 'sumi', name: 'Sumi', bg: 'bg-[#262626]', border: 'border-[#444]', text: 'text-white' },
  { id: 'vermillion', name: 'Vermillion', bg: 'bg-[#b3312c]', border: 'border-red-600', text: 'text-white' },
  { id: 'indigo', name: 'Indigo', bg: 'bg-[#1d3557]', border: 'border-blue-500', text: 'text-white' },
  { id: 'ochre', name: 'Ochre', bg: 'bg-[#c59b27]', border: 'border-yellow-500', text: 'text-black' },
];

const createDeck = (): Card[] => {
  const deck: Card[] = [];
  let id = 0;
  const colors: CardColor[] = ['sumi', 'vermillion', 'indigo', 'ochre'];

  colors.forEach((color) => {
    deck.push({ id: `c-${id++}`, color, value: 0 });
    for (let v = 1; v <= 9; v++) {
      deck.push({ id: `c-${id++}`, color, value: v as CardValue });
      deck.push({ id: `c-${id++}`, color, value: v as CardValue });
    }
    ['skip', 'reverse', 'draw2'].forEach((action) => {
      deck.push({ id: `c-${id++}`, color, value: action as CardValue });
      deck.push({ id: `c-${id++}`, color, value: action as CardValue });
    });
  });

  for (let i = 0; i < 4; i++) {
    deck.push({ id: `c-${id++}`, color: 'none', value: 'wild' });
    deck.push({ id: `c-${id++}`, color: 'none', value: 'wildDraw4' });
  }

  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }

  return deck;
};

interface UnoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVictory?: () => void;
}

export const UnoModal: React.FC<UnoModalProps> = ({
  isOpen,
  onClose,
  onVictory,
}) => {
  const { isMuted, toggleMute, playSfx } = useAudio();
  const { unlockPigment, hasPigment } = useSpectrum();
  const { stampSeal, recordGameResult } = useSaveGame();

  const [deck, setDeck] = useState<Card[]>([]);
  const [discardPile, setDiscardPile] = useState<Card[]>([]);
  const [activeColor, setActiveColor] = useState<CardColor>('sumi');

  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [botHand, setBotHand] = useState<Card[]>([]);
  const [turn, setTurn] = useState<'player' | 'bot'>('player');

  const [isColorPickerOpen, setIsColorPickerOpen] = useState<boolean>(false);
  const [pendingWildCard, setPendingWildCard] = useState<Card | null>(null);

  const [winner, setWinner] = useState<'player' | 'bot' | null>(null);

  const initGame = useCallback(() => {
    const newDeck = createDeck();
    const pHand = newDeck.splice(0, 7);
    const bHand = newDeck.splice(0, 7);

    let initialTop = newDeck.pop()!;
    while (initialTop.color === 'none') {
      newDeck.unshift(initialTop);
      initialTop = newDeck.pop()!;
    }

    setDeck(newDeck);
    setDiscardPile([initialTop]);
    setActiveColor(initialTop.color);
    setPlayerHand(pHand);
    setBotHand(bHand);
    setTurn('player');
    setWinner(null);
  }, []);

  useEffect(() => {
    if (isOpen) {
      initGame();
    }
  }, [isOpen, initGame]);

  const topDiscard = discardPile[discardPile.length - 1];

  const canPlayCard = (card: Card): boolean => {
    if (!topDiscard) return false;
    if (card.color === 'none') return true;
    if (card.color === activeColor) return true;
    if (card.value === topDiscard.value) return true;
    return false;
  };

  const playCard = (card: Card, chosenColor?: CardColor) => {
    const isPlayer = turn === 'player';
    const currentHand = isPlayer ? playerHand : botHand;
    const nextHand = currentHand.filter((c) => c.id !== card.id);

    const nextColor = card.color === 'none' ? chosenColor || 'sumi' : card.color;
    setActiveColor(nextColor);
    setDiscardPile((prev) => [...prev, card]);

    if (isPlayer) {
      setPlayerHand(nextHand);
      playSfx('clash');
    } else {
      setBotHand(nextHand);
      playSfx('whiff');
    }

    if (nextHand.length === 0) {
      setWinner(isPlayer ? 'player' : 'bot');
      if (isPlayer) {
        playSfx('victory');
        playSfx('seal-stamp');
        confetti({ particleCount: 70, spread: 80, origin: { y: 0.6 } });

        recordGameResult('uno', true, 1500);
        if (!hasPigment('molten-gold')) {
          unlockPigment('molten-gold');
          stampSeal('molten-gold', 1500);
        }
        onVictory?.();
      } else {
        playSfx('heavy-strike');
      }
      return;
    }

    let nextTurn: 'player' | 'bot' = isPlayer ? 'bot' : 'player';
    let penalty = 0;

    if (card.value === 'draw2') penalty = 2;
    else if (card.value === 'wildDraw4') penalty = 4;
    else if (card.value === 'skip') {
      nextTurn = isPlayer ? 'player' : 'bot';
    }

    if (penalty > 0) {
      applyDrawPenalty(nextTurn, penalty);
    }

    setTurn(nextTurn);
    if (nextTurn === 'bot') {
      setTimeout(() => handleBotTurn(nextHand, nextColor), 800);
    }
  };

  const applyDrawPenalty = (target: 'player' | 'bot', count: number) => {
    const drawn = deck.slice(0, count);
    const remDeck = deck.slice(count);
    setDeck(remDeck);

    if (target === 'player') {
      setPlayerHand((h) => [...h, ...drawn]);
    } else {
      setBotHand((h) => [...h, ...drawn]);
    }
  };

  const handleBotTurn = (currentBotHand: Card[], currentActiveColor: CardColor) => {
    if (winner) return;

    const playable = currentBotHand.filter((c) => {
      if (c.color === 'none') return true;
      if (c.color === currentActiveColor) return true;
      if (topDiscard && c.value === topDiscard.value) return true;
      return false;
    });

    if (playable.length > 0) {
      const choice = playable.find((c) => c.color !== 'none') || playable[0];
      const botColor: CardColor = 'ochre';
      playCard(choice, botColor);
    } else {
      const drawn = deck[0];
      if (drawn) {
        setDeck((d) => d.slice(1));
        setBotHand((h) => [...h, drawn]);
      }
      setTurn('player');
    }
  };

  const handlePlayerDraw = () => {
    if (turn !== 'player' || winner) return;
    const drawn = deck[0];
    if (drawn) {
      setDeck((d) => d.slice(1));
      setPlayerHand((h) => [...h, drawn]);
      playSfx('click');
    }
    setTurn('bot');
    setTimeout(() => handleBotTurn(botHand, activeColor), 800);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/90 backdrop-blur-md select-none overflow-hidden font-sans">
      <div className="relative w-full h-full max-w-4xl max-h-[92vh] bg-[#141414] border-2 border-[#e0a96d] rounded-2xl flex flex-col shadow-2xl shadow-[#e0a96d]/20 overflow-hidden text-[#f4ebd0]">
        {/* Header */}
        <header className="flex items-center justify-between px-4 py-3 bg-[#241c14] border-b border-[#3d2f22] shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                playSfx('click');
                onClose();
              }}
              className="p-1.5 rounded-lg bg-[#2d2217] hover:bg-[#382b1d] border border-[#483726] text-[#f4ebd0]/70 hover:text-white transition flex items-center gap-1 text-xs font-mono"
            >
              <X size={16} />
              <span className="hidden sm:inline">Exit</span>
            </button>
            <div>
              <div className="flex items-center gap-2">
                <Flame size={18} className="text-[#e0a96d]" />
                <h2 className="font-serif font-bold text-sm sm:text-base text-[#f4ebd0]">
                  The Gilded Den (Uno)
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-[#e0a96d]/40 text-[#e0a96d] bg-[#e0a96d]/10">
                  The Gilded Vault
                </span>
              </div>
              <p className="text-[11px] text-[#f4ebd0]/50 font-mono">
                High-Stakes Card Speakeasy • Active Color: {activeColor.toUpperCase()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleMute}
              className="p-2 rounded-lg bg-[#2d2217] hover:bg-[#382b1d] border border-[#483726] text-[#f4ebd0]/70 hover:text-white transition"
            >
              {isMuted ? <VolumeX size={16} className="text-red-400" /> : <Volume2 size={16} />}
            </button>
          </div>
        </header>

        {/* Card Table */}
        <div className="flex-1 flex flex-col items-center justify-between p-4 bg-[#14110e] overflow-auto">
          {/* Bot Cards Row */}
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-2 text-xs font-mono text-[#f4ebd0]/60">
              <Bot size={14} className="text-[#e0a96d]" />
              <span>The Golden Patriarch's Hand ({botHand.length} Cards)</span>
            </div>
            <div className="flex gap-1.5">
              {botHand.map((_, i) => (
                <div
                  key={i}
                  className="w-10 h-14 sm:w-12 sm:h-16 rounded-md bg-[#251e18] border border-[#483726] shadow-sm flex items-center justify-center font-serif text-[#e0a96d]/40 text-xs"
                >
                  金
                </div>
              ))}
            </div>
          </div>

          {/* Center Discard & Draw Deck */}
          <div className="flex items-center gap-6 my-4">
            <button
              onClick={handlePlayerDraw}
              disabled={turn !== 'player' || Boolean(winner)}
              className="w-16 h-24 sm:w-20 sm:h-28 rounded-xl bg-[#2a221b] hover:bg-[#382d23] border-2 border-[#e0a96d]/60 shadow-lg flex flex-col items-center justify-center font-serif text-[#e0a96d] cursor-pointer transition disabled:opacity-40"
            >
              <span className="text-sm font-bold">DRAW</span>
              <span className="text-[10px] font-mono text-[#f4ebd0]/50">({deck.length})</span>
            </button>

            {topDiscard && (
              <div
                className={`w-16 h-24 sm:w-20 sm:h-28 rounded-xl border-2 flex flex-col items-center justify-center shadow-xl transition-all ${
                  topDiscard.color === 'sumi'
                    ? 'bg-[#222] border-white text-white'
                    : topDiscard.color === 'vermillion'
                    ? 'bg-[#b3312c] border-white text-white'
                    : topDiscard.color === 'indigo'
                    ? 'bg-[#1d3557] border-white text-white'
                    : topDiscard.color === 'ochre'
                    ? 'bg-[#c59b27] border-black text-black'
                    : 'bg-[#444] border-[#e0a96d] text-[#e0a96d]'
                }`}
              >
                <span className="text-xl sm:text-2xl font-bold font-mono">
                  {typeof topDiscard.value === 'number'
                    ? topDiscard.value
                    : topDiscard.value === 'draw2'
                    ? '+2'
                    : topDiscard.value === 'wildDraw4'
                    ? '+4'
                    : topDiscard.value.toUpperCase().slice(0, 4)}
                </span>
                <span className="text-[9px] font-mono tracking-widest uppercase mt-1">
                  {activeColor}
                </span>
              </div>
            )}
          </div>

          {/* Player Cards Hand */}
          <div className="w-full flex flex-col items-center gap-2">
            <div className="flex items-center gap-3 text-xs font-mono">
              <span className={turn === 'player' ? 'text-[#e0a96d] font-bold' : 'text-[#f4ebd0]/50'}>
                {turn === 'player' ? '▶ Your Turn' : 'Golden Patriarch is deciding...'}
              </span>
              <span className="text-[#f4ebd0]/40">•</span>
              <span className="text-[#f4ebd0]/70">Your Hand: {playerHand.length} Cards</span>
            </div>

            <div className="flex flex-wrap justify-center gap-2 max-w-2xl px-2">
              {playerHand.map((card) => {
                const playable = turn === 'player' && !winner && canPlayCard(card);

                return (
                  <button
                    key={card.id}
                    disabled={!playable}
                    onClick={() => {
                      if (card.color === 'none') {
                        setPendingWildCard(card);
                        setIsColorPickerOpen(true);
                      } else {
                        playCard(card);
                      }
                    }}
                    className={`w-12 h-18 sm:w-14 sm:h-20 rounded-lg border-2 flex flex-col items-center justify-between p-1 shadow-md transition-all ${
                      card.color === 'sumi'
                        ? 'bg-[#222] border-[#555] text-white'
                        : card.color === 'vermillion'
                        ? 'bg-[#b3312c] border-red-400 text-white'
                        : card.color === 'indigo'
                        ? 'bg-[#1d3557] border-blue-400 text-white'
                        : card.color === 'ochre'
                        ? 'bg-[#c59b27] border-yellow-300 text-black'
                        : 'bg-[#333] border-[#e0a96d] text-[#e0a96d]'
                    } ${playable ? 'hover:-translate-y-2 cursor-pointer' : 'opacity-40 grayscale cursor-not-allowed'}`}
                  >
                    <span className="text-xs font-mono font-bold self-start">
                      {typeof card.value === 'number' ? card.value : card.value.slice(0, 2)}
                    </span>
                    <span className="text-sm sm:text-base font-bold font-mono">
                      {typeof card.value === 'number'
                        ? card.value
                        : card.value === 'draw2'
                        ? '+2'
                        : card.value === 'wildDraw4'
                        ? '+4'
                        : '★'}
                    </span>
                    <span className="text-[8px] font-mono self-end">
                      {card.color.slice(0, 3).toUpperCase()}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Wild Color Picker Modal */}
        {isColorPickerOpen && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="p-5 rounded-2xl bg-[#1e1711] border-2 border-[#e0a96d] text-center space-y-4 shadow-2xl">
              <h3 className="font-serif font-bold text-sm text-[#e0a96d]">
                Choose Ink Pigment
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {INK_COLORS.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      setIsColorPickerOpen(false);
                      if (pendingWildCard) {
                        playCard(pendingWildCard, c.id);
                        setPendingWildCard(null);
                      }
                    }}
                    className={`px-4 py-3 rounded-xl font-bold font-mono text-xs border ${c.bg} ${c.border} ${c.text} hover:scale-105 transition`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Victory / Defeat Overlay */}
        {winner && (
          <div className="p-3 bg-[#201812] border-t border-[#3d2f22] flex items-center justify-between px-6">
            <div className="text-xs font-mono">
              Result:{' '}
              <span className={winner === 'player' ? 'text-[#e0a96d] font-bold' : 'text-red-400'}>
                {winner === 'player'
                  ? 'Victory! You emptied your hand first.'
                  : 'The Golden Patriarch emptied his hand!'}
              </span>
            </div>
            <button
              onClick={initGame}
              className="px-4 py-1.5 rounded-lg bg-[#e0a96d] text-black font-bold text-xs hover:bg-[#ffc98a] transition"
            >
              Deal Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
