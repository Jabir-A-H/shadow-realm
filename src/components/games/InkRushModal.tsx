import React, { useEffect, useRef, useState, useCallback } from 'react';
import Phaser from 'phaser';
import { MinigameContainer } from './MinigameContainer';
import { InkRushScene } from '../../lib/games/rush/InkRushScene';
import { ACTION_GAMES_METADATA, ActionGameResult, ActionDifficulty } from '../../lib/games/actionGameTypes';
import { useAudio, ProceduralSfxType } from '../../contexts/AudioContext';
import { ArrowUp, ArrowDown, ChevronUp, ChevronDown } from 'lucide-react';

interface InkRushModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVictory: (score: number) => void;
  wardenColorHex?: string;
  difficulty?: ActionDifficulty;
}

export const InkRushModal: React.FC<InkRushModalProps> = ({
  isOpen,
  onClose,
  onVictory,
  wardenColorHex = '#0077b6',
  difficulty = 'veteran',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const sceneRef = useRef<InkRushScene | null>(null);
  const { playSfx } = useAudio();

  const [result, setResult] = useState<ActionGameResult | null>(null);
  const [keySeed, setKeySeed] = useState(0);

  const config = ACTION_GAMES_METADATA['ink-rush'];

  const ensureFocus = useCallback(() => {
    if (containerRef.current) {
      const canvas = containerRef.current.querySelector('canvas');
      if (canvas) {
        canvas.tabIndex = 0;
        canvas.style.outline = 'none';
        if (document.activeElement && document.activeElement !== canvas) {
          (document.activeElement as HTMLElement)?.blur();
        }
        canvas.focus();
      }
    }
  }, []);

  const initGame = useCallback(() => {
    if (!containerRef.current) return;
    if (gameRef.current) {
      gameRef.current.destroy(true);
      gameRef.current = null;
    }

    setResult(null);

    const scene = new InkRushScene({
      callbacks: {
        onGameOver: (res) => {
          setResult(res);
          if (res.won) playSfx('victory');
        },
        onScoreUpdate: () => {},
        onPlaySfx: (sfx) => playSfx(sfx as ProceduralSfxType),
      },
      difficulty,
    });

    sceneRef.current = scene;

    const gameConfig: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: containerRef.current,
      width: containerRef.current.clientWidth || 800,
      height: containerRef.current.clientHeight || 500,
      backgroundColor: '#0e1b24',
      physics: {
        default: 'arcade',
        arcade: { gravity: { x: 0, y: 0 }, debug: false },
      },
      input: {
        keyboard: true,
      },
      render: { antialias: true, roundPixels: true },
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      scene: [scene],
    };

    gameRef.current = new Phaser.Game(gameConfig);

    requestAnimationFrame(ensureFocus);
    setTimeout(ensureFocus, 60);
    setTimeout(ensureFocus, 200);
  }, [difficulty, playSfx, ensureFocus]);

  useEffect(() => {
    if (isOpen) {
      initGame();
      const focusTimer = setTimeout(() => {
        ensureFocus();
      }, 150);
      return () => {
        clearTimeout(focusTimer);
        if (gameRef.current) {
          gameRef.current.destroy(true);
          gameRef.current = null;
          sceneRef.current = null;
        }
      };
    }
    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
        sceneRef.current = null;
      }
    };
  }, [isOpen, keySeed, initGame]);

  const handleRestart = () => {
    setKeySeed((prev) => prev + 1);
  };

  const handleClaim = () => {
    if (result) {
      onVictory(result.score);
    }
    onClose();
  };

  const handleContainerFocus = () => {
    ensureFocus();
  };

  return (
    <MinigameContainer
      config={config}
      isOpen={isOpen}
      onClose={onClose}
      onRestart={handleRestart}
      result={result}
      onClaimVictory={handleClaim}
      wardenColorHex={wardenColorHex}
    >
      <div
        ref={containerRef}
        tabIndex={0}
        onClick={handleContainerFocus}
        onPointerDown={handleContainerFocus}
        className="w-full h-full outline-none focus:outline-none"
      />

      {/* Touch Buttons */}
      <div className="absolute bottom-4 inset-x-4 flex items-center justify-between pointer-events-none z-30">
        {/* Lane Switching Buttons */}
        <div className="flex flex-col gap-2 pointer-events-auto">
          <button
            onClick={() => sceneRef.current?.switchLaneUp()}
            className="w-12 h-12 rounded-xl bg-[#222]/85 active:bg-[#333] border border-[#444] text-[#f4ebd0] flex items-center justify-center shadow-lg"
            title="Switch Lane Up"
          >
            <ChevronUp size={22} />
          </button>
          <button
            onClick={() => sceneRef.current?.switchLaneDown()}
            className="w-12 h-12 rounded-xl bg-[#222]/85 active:bg-[#333] border border-[#444] text-[#f4ebd0] flex items-center justify-center shadow-lg"
            title="Switch Lane Down"
          >
            <ChevronDown size={22} />
          </button>
        </div>

        {/* Jump & Slide Action Buttons */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={() => sceneRef.current?.triggerJump()}
            className="px-4 h-12 rounded-xl bg-[#1a2f3f]/90 active:bg-[#27455c] border border-[#0077b6] text-[#90e0ef] flex items-center gap-1 font-mono text-xs font-bold shadow-lg"
            title="High Jump [W / ↑ / Space]"
          >
            <ArrowUp size={16} />
            <span>Jump [W / Space]</span>
          </button>

          <button
            onClick={() => sceneRef.current?.triggerSlide()}
            className="px-4 h-12 rounded-xl bg-[#2b2416]/90 active:bg-[#423722] border border-[#e0a96d] text-[#f4ebd0] flex items-center gap-1 font-mono text-xs font-bold shadow-lg"
            title="Slide [S / ↓]"
          >
            <ArrowDown size={16} />
            <span>Slide [S]</span>
          </button>
        </div>
      </div>
    </MinigameContainer>
  );
};
