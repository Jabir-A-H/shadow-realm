import Phaser from 'phaser';
import { OverworldScene } from './overworldScene';
import { Pigment } from '../../contexts/SpectrumContext';

export interface OverworldCallbacks {
  onRegionChange: (regionId: string, regionName: string) => void;
  onPlayerMove: (coords: { x: number; y: number; facing: 'up' | 'down' | 'left' | 'right'; currentRegion?: string }) => void;
  onWardenEncounter: (wardenId: string, shrineCoords: { x: number; y: number }) => void;
  onBarrierEncounter: (barrierName: string, requiredPigment: Pigment, isUnlocked: boolean) => void;
  onPlaySfx?: (sfxName: string) => void;
}

export interface CreateOverworldGameOptions {
  parent: HTMLElement;
  callbacks: OverworldCallbacks;
  initialCoords: { x: number; y: number };
  unlockedPigments: Pigment[];
}

export interface OverworldGameHandle {
  game: Phaser.Game;
  scene: OverworldScene;
  updateUnlockedPigments: (pigments: Pigment[]) => void;
  teleportPlayer: (x: number, y: number) => void;
  setVirtualInput: (vector: { x: number; y: number }) => void;
  triggerInteract: () => void;
  pauseOverworld: () => void;
  resumeOverworld: () => void;
  setKeyboardEnabled: (enabled: boolean) => void;
}

export const createOverworldGame = (options: CreateOverworldGameOptions): OverworldGameHandle => {
  const scene = new OverworldScene({
    callbacks: options.callbacks,
    initialCoords: options.initialCoords,
    unlockedPigments: options.unlockedPigments,
  });

  const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    parent: options.parent,
    width: options.parent.clientWidth || 800,
    height: options.parent.clientHeight || 600,
    backgroundColor: '#141414',
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { x: 0, y: 0 },
        debug: false,
      },
    },
    render: {
      antialias: true,
      roundPixels: true,
      powerPreference: 'high-performance',
    },
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: [scene],
  };

  const game = new Phaser.Game(config);

  return {
    game,
    scene,
    updateUnlockedPigments: (pigments: Pigment[]) => {
      scene.syncUnlockedPigments(pigments);
    },
    teleportPlayer: (x: number, y: number) => {
      scene.teleport(x, y);
    },
    setVirtualInput: (vector: { x: number; y: number }) => {
      scene.setVirtualInput(vector);
    },
    triggerInteract: () => {
      scene.triggerActionInteract();
    },
    pauseOverworld: () => {
      if (game.input?.keyboard) {
        game.input.keyboard.stopListeners();
        game.input.keyboard.enabled = false;
      }
      if (scene.input?.keyboard) {
        scene.input.keyboard.enabled = false;
        scene.input.keyboard.resetKeys();
      }
      if (scene.scene?.isActive()) {
        scene.scene.pause();
      }
    },
    resumeOverworld: () => {
      if (scene.scene?.isPaused()) {
        scene.scene.resume();
      }
      if (scene.input?.keyboard) {
        scene.input.keyboard.enabled = true;
        scene.input.keyboard.resetKeys();
      }
      if (game.input?.keyboard) {
        game.input.keyboard.enabled = true;
        game.input.keyboard.startListeners();
      }
    },
    setKeyboardEnabled: (enabled: boolean) => {
      if (game.input?.keyboard) {
        if (enabled) {
          game.input.keyboard.enabled = true;
          game.input.keyboard.startListeners();
        } else {
          game.input.keyboard.stopListeners();
          game.input.keyboard.enabled = false;
        }
      }
      if (scene.input?.keyboard) {
        scene.input.keyboard.enabled = enabled;
        if (!enabled) {
          scene.input.keyboard.resetKeys();
        }
      }
    },
  };
};
