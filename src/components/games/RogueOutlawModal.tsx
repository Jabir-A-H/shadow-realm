import React, { useEffect, useRef, useState, useCallback } from 'react';
import Phaser from 'phaser';
import { MinigameContainer } from './MinigameContainer';
import { RogueOutlawScene } from '../../lib/games/outlaw/RogueOutlawScene';
import { ACTION_GAMES_METADATA, ActionGameResult, ActionDifficulty } from '../../lib/games/actionGameTypes';
import { useAudio, ProceduralSfxType } from '../../contexts/AudioContext';
import { RotateCw, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Crosshair } from 'lucide-react';

interface RogueOutlawModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVictory: (score: number) => void;
  wardenColorHex?: string;
  difficulty?: ActionDifficulty;
}

export const RogueOutlawModal: React.FC<RogueOutlawModalProps> = ({
  isOpen,
  onClose,
  onVictory,
  wardenColorHex = '#b3312c',
  difficulty = 'veteran',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const sceneRef = useRef<RogueOutlawScene | null>(null);
  const { playSfx } = useAudio();

  const [result, setResult] = useState<ActionGameResult | null>(null);
  const [keySeed, setKeySeed] = useState(0);

  const config = ACTION_GAMES_METADATA['rogue-outlaw'];

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

    const scene = new RogueOutlawScene({
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
      backgroundColor: '#1a1414',
      input: {
        keyboard: true,
      },
      physics: {
        default: 'arcade',
        arcade: { gravity: { x: 0, y: 0 }, debug: false },
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

      {/* On-screen touch buttons */}
      <div className="absolute bottom-4 inset-x-4 flex items-center justify-between pointer-events-none z-30">
        {/* D-Pad */}
        <div className="grid grid-cols-3 gap-1 pointer-events-auto w-32">
          <div />
          <button
            tabIndex={-1}
            onPointerDown={() => sceneRef.current?.setVirtualMove({ x: 0, y: -1 })}
            onPointerUp={() => sceneRef.current?.setVirtualMove({ x: 0, y: 0 })}
            onPointerLeave={() => sceneRef.current?.setVirtualMove({ x: 0, y: 0 })}
            onPointerCancel={() => sceneRef.current?.setVirtualMove({ x: 0, y: 0 })}
            className="w-10 h-10 rounded-lg bg-[#222]/85 active:bg-[#333] border border-[#444] text-[#f4ebd0] flex items-center justify-center shadow"
          >
            <ChevronUp size={18} />
          </button>
          <div />
          <button
            tabIndex={-1}
            onPointerDown={() => sceneRef.current?.setVirtualMove({ x: -1, y: 0 })}
            onPointerUp={() => sceneRef.current?.setVirtualMove({ x: 0, y: 0 })}
            onPointerLeave={() => sceneRef.current?.setVirtualMove({ x: 0, y: 0 })}
            onPointerCancel={() => sceneRef.current?.setVirtualMove({ x: 0, y: 0 })}
            className="w-10 h-10 rounded-lg bg-[#222]/85 active:bg-[#333] border border-[#444] text-[#f4ebd0] flex items-center justify-center shadow"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            tabIndex={-1}
            onPointerDown={() => sceneRef.current?.setVirtualMove({ x: 0, y: 1 })}
            onPointerUp={() => sceneRef.current?.setVirtualMove({ x: 0, y: 0 })}
            onPointerLeave={() => sceneRef.current?.setVirtualMove({ x: 0, y: 0 })}
            onPointerCancel={() => sceneRef.current?.setVirtualMove({ x: 0, y: 0 })}
            className="w-10 h-10 rounded-lg bg-[#222]/85 active:bg-[#333] border border-[#444] text-[#f4ebd0] flex items-center justify-center shadow"
          >
            <ChevronDown size={18} />
          </button>
          <button
            tabIndex={-1}
            onPointerDown={() => sceneRef.current?.setVirtualMove({ x: 1, y: 0 })}
            onPointerUp={() => sceneRef.current?.setVirtualMove({ x: 0, y: 0 })}
            onPointerLeave={() => sceneRef.current?.setVirtualMove({ x: 0, y: 0 })}
            onPointerCancel={() => sceneRef.current?.setVirtualMove({ x: 0, y: 0 })}
            className="w-10 h-10 rounded-lg bg-[#222]/85 active:bg-[#333] border border-[#444] text-[#f4ebd0] flex items-center justify-center shadow"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Action Buttons: Fire & Combat Roll */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            tabIndex={-1}
            onPointerDown={() => sceneRef.current?.triggerFire()}
            className="px-5 h-12 rounded-xl bg-[#b3312c]/90 active:bg-[#d93833] border border-[#f4ebd0]/40 text-[#f4ebd0] flex items-center gap-1.5 font-mono text-xs font-bold shadow-lg"
            title="Fire Revolver [Click / Tap]"
          >
            <Crosshair size={18} />
            <span>Fire</span>
          </button>

          <button
            tabIndex={-1}
            onClick={() => sceneRef.current?.triggerRoll()}
            className="px-5 h-12 rounded-xl bg-[#3a1a1a]/90 active:bg-[#522525] border border-[#b3312c] text-[#f4ebd0] flex items-center gap-1.5 font-mono text-xs font-bold shadow-lg"
            title="Combat Roll [Space / Shift]"
          >
            <RotateCw size={16} />
            <span>Roll [Space]</span>
          </button>
        </div>
      </div>
    </MinigameContainer>
  );
};
