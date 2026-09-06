import React, { useEffect, useRef, useState, useCallback } from 'react';
import Phaser from 'phaser';
import { MinigameContainer } from './MinigameContainer';
import { BladeDuelScene } from '../../lib/games/neutral/BladeDuelScene';
import { ACTION_GAMES_METADATA, ActionGameResult, ActionDifficulty } from '../../lib/games/actionGameTypes';
import { useAudio, ProceduralSfxType } from '../../contexts/AudioContext';
import { Shield, Zap, Swords, ChevronLeft, ChevronRight } from 'lucide-react';

interface BladeDuelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVictory: (score: number) => void;
  wardenName?: string;
  wardenColorHex?: string;
  difficulty?: ActionDifficulty;
}

export const BladeDuelModal: React.FC<BladeDuelModalProps> = ({
  isOpen,
  onClose,
  onVictory,
  wardenName = 'The Frost King',
  wardenColorHex = '#48cae4',
  difficulty = 'veteran',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const sceneRef = useRef<BladeDuelScene | null>(null);
  const { playSfx } = useAudio();

  const [result, setResult] = useState<ActionGameResult | null>(null);
  const [keySeed, setKeySeed] = useState(0);

  const config = ACTION_GAMES_METADATA['blade-duel'];

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

    const scene = new BladeDuelScene({
      callbacks: {
        onGameOver: (res) => {
          setResult(res);
          if (res.won) {
            playSfx('victory');
          } else {
            playSfx('heavy-strike');
          }
        },
        onScoreUpdate: () => {},
        onPlaySfx: (sfx) => playSfx(sfx as ProceduralSfxType),
      },
      difficulty,
      wardenName,
      wardenColorHex,
    });

    sceneRef.current = scene;

    const gameConfig: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: containerRef.current,
      width: containerRef.current.clientWidth || 800,
      height: containerRef.current.clientHeight || 500,
      backgroundColor: '#191919',
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
  }, [difficulty, playSfx, wardenColorHex, wardenName, ensureFocus]);

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

      {/* On-Screen Mobile Action Buttons */}
      <div className="absolute bottom-4 inset-x-4 flex items-center justify-between pointer-events-none z-30">
        {/* Left: Step D-Pad & Guard */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            tabIndex={-1}
            onPointerDown={() => sceneRef.current?.setVirtualMovement(-1)}
            onPointerUp={() => sceneRef.current?.setVirtualMovement(0)}
            onPointerLeave={() => sceneRef.current?.setVirtualMovement(0)}
            className="w-12 h-12 rounded-xl bg-[#222]/85 active:bg-[#333] border border-[#444] text-[#f4ebd0] flex items-center justify-center shadow-lg"
          >
            <ChevronLeft size={22} />
          </button>

          <button
            tabIndex={-1}
            onPointerDown={() => sceneRef.current?.setVirtualMovement(1)}
            onPointerUp={() => sceneRef.current?.setVirtualMovement(0)}
            onPointerLeave={() => sceneRef.current?.setVirtualMovement(0)}
            className="w-12 h-12 rounded-xl bg-[#222]/85 active:bg-[#333] border border-[#444] text-[#f4ebd0] flex items-center justify-center shadow-lg"
          >
            <ChevronRight size={22} />
          </button>

          <button
            tabIndex={-1}
            onPointerDown={() => sceneRef.current?.setVirtualGuard(true)}
            onPointerUp={() => sceneRef.current?.setVirtualGuard(false)}
            onPointerLeave={() => sceneRef.current?.setVirtualGuard(false)}
            className="px-3.5 h-12 rounded-xl bg-[#2b3542]/85 active:bg-[#3d4c60] border border-[#48cae4]/50 text-[#48cae4] flex items-center gap-1 font-mono text-xs shadow-lg"
          >
            <Shield size={16} />
            <span>Guard</span>
          </button>
        </div>

        {/* Right: Poke & Heavy Strike */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            tabIndex={-1}
            onClick={() => sceneRef.current?.triggerPoke()}
            className="px-4 h-12 rounded-xl bg-[#242424]/90 active:bg-[#333] border border-[#e0a96d]/60 text-[#e0a96d] flex items-center gap-1 font-serif text-xs font-bold shadow-lg"
          >
            <Zap size={16} />
            <span>Poke [J]</span>
          </button>

          <button
            tabIndex={-1}
            onClick={() => sceneRef.current?.triggerHeavy()}
            className="px-4 h-12 rounded-xl bg-[#381a1a]/90 active:bg-[#522525] border border-[#b3312c] text-[#f4ebd0] flex items-center gap-1 font-serif text-xs font-bold shadow-lg"
          >
            <Swords size={16} />
            <span>Strike [K]</span>
          </button>
        </div>
      </div>
    </MinigameContainer>
  );
};
