import React, { useEffect, useRef, useState, useCallback } from 'react';
import Phaser from 'phaser';
import { MinigameContainer } from './MinigameContainer';
import { InkImpactScene } from '../../lib/games/impact/InkImpactScene';
import { ACTION_GAMES_METADATA, ActionGameResult, ActionDifficulty } from '../../lib/games/actionGameTypes';
import { useAudio, ProceduralSfxType } from '../../contexts/AudioContext';
import { Crosshair, Bomb, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

interface InkImpactModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVictory: (score: number) => void;
  wardenColorHex?: string;
  difficulty?: ActionDifficulty;
}

export const InkImpactModal: React.FC<InkImpactModalProps> = ({
  isOpen,
  onClose,
  onVictory,
  wardenColorHex = '#90e0ef',
  difficulty = 'veteran',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const sceneRef = useRef<InkImpactScene | null>(null);
  const { playSfx } = useAudio();

  const [result, setResult] = useState<ActionGameResult | null>(null);
  const [keySeed, setKeySeed] = useState(0);

  const config = ACTION_GAMES_METADATA['ink-impact'];

  const initGame = useCallback(() => {
    if (!containerRef.current) return;
    if (gameRef.current) {
      gameRef.current.destroy(true);
      gameRef.current = null;
    }

    setResult(null);

    const scene = new InkImpactScene({
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
      backgroundColor: '#181818',
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
  }, [difficulty, playSfx]);

  useEffect(() => {
    if (isOpen) {
      initGame();
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
      <div ref={containerRef} className="w-full h-full" />

      {/* On-screen touch buttons */}
      <div className="absolute bottom-4 inset-x-4 flex items-center justify-between pointer-events-none z-30">
        {/* Directional Pad */}
        <div className="grid grid-cols-3 gap-1 pointer-events-auto w-32">
          <div />
          <button
            onPointerDown={() => sceneRef.current?.setVirtualMovement({ x: 0, y: -1 })}
            onPointerUp={() => sceneRef.current?.setVirtualMovement({ x: 0, y: 0 })}
            className="w-10 h-10 rounded-lg bg-[#222]/85 active:bg-[#333] border border-[#444] text-[#f4ebd0] flex items-center justify-center shadow"
          >
            <ChevronUp size={18} />
          </button>
          <div />
          <button
            onPointerDown={() => sceneRef.current?.setVirtualMovement({ x: -1, y: 0 })}
            onPointerUp={() => sceneRef.current?.setVirtualMovement({ x: 0, y: 0 })}
            className="w-10 h-10 rounded-lg bg-[#222]/85 active:bg-[#333] border border-[#444] text-[#f4ebd0] flex items-center justify-center shadow"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onPointerDown={() => sceneRef.current?.setVirtualMovement({ x: 0, y: 1 })}
            onPointerUp={() => sceneRef.current?.setVirtualMovement({ x: 0, y: 0 })}
            className="w-10 h-10 rounded-lg bg-[#222]/85 active:bg-[#333] border border-[#444] text-[#f4ebd0] flex items-center justify-center shadow"
          >
            <ChevronDown size={18} />
          </button>
          <button
            onPointerDown={() => sceneRef.current?.setVirtualMovement({ x: 1, y: 0 })}
            onPointerUp={() => sceneRef.current?.setVirtualMovement({ x: 0, y: 0 })}
            className="w-10 h-10 rounded-lg bg-[#222]/85 active:bg-[#333] border border-[#444] text-[#f4ebd0] flex items-center justify-center shadow"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Action buttons (Fire & Bomb) */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onPointerDown={() => sceneRef.current?.setVirtualFiring(true)}
            onPointerUp={() => sceneRef.current?.setVirtualFiring(false)}
            className="px-4 h-12 rounded-xl bg-[#242424]/90 active:bg-[#333] border border-[#90e0ef] text-[#90e0ef] flex items-center gap-1 font-mono text-xs font-bold shadow-lg"
          >
            <Crosshair size={18} />
            <span>Fire [Space]</span>
          </button>

          <button
            onClick={() => sceneRef.current?.triggerBomb()}
            className="px-4 h-12 rounded-xl bg-[#3b1c1c]/90 active:bg-[#522525] border border-[#b3312c] text-[#f4ebd0] flex items-center gap-1 font-mono text-xs font-bold shadow-lg"
          >
            <Bomb size={18} className="text-[#b3312c]" />
            <span>Bomb [K]</span>
          </button>
        </div>
      </div>
    </MinigameContainer>
  );
};
