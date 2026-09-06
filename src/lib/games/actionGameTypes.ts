import { Pigment } from '../../contexts/SpectrumContext';

export type ActionGameId = 'blade-duel' | 'ink-impact' | 'rogue-outlaw' | 'ink-rush';

export type ActionDifficulty = 'novice' | 'veteran' | 'master';

export interface ActionGameConfig {
  id: ActionGameId;
  title: string;
  subtitle: string;
  region: string;
  warden: string;
  pigment: Pigment;
  description: string;
  controlsGuide: {
    keyboard: string[];
    touch: string[];
  };
}

export interface ActionGameResult {
  gameId: ActionGameId;
  won: boolean;
  score: number;
  highScore: number;
  stats: {
    durationSeconds: number;
    hitsLanded?: number;
    hitsTaken?: number;
    enemiesDefeated?: number;
    accuracyPercent?: number;
    distanceMeters?: number;
    scrollsCollected?: number;
  };
}

export interface ActionGameSceneCallbacks {
  onGameOver: (result: ActionGameResult) => void;
  onScoreUpdate: (score: number) => void;
  onPlaySfx?: (sfxName: string) => void;
  onPauseChange?: (isPaused: boolean) => void;
}

export const ACTION_GAMES_METADATA: Record<ActionGameId, ActionGameConfig> = {
  'blade-duel': {
    id: 'blade-duel',
    title: 'The Neutral',
    subtitle: '1D Blade Spacing Duel',
    region: 'The Frozen Reach',
    warden: 'The Frost King',
    pigment: 'frost-cyan',
    description: 'A frame-tight spacing duel. Walk in and out of range, block incoming strikes, poke fast, and punish opponent whiffs. First to 3 clean unblocked strikes wins.',
    controlsGuide: {
      keyboard: ['[A] / [D] or [←] / [→]: Step Forward / Back', '[Space] / [S] / [↓]: Guard / Block', '[J] or [Z]: Quick Poke (Fast thrust)', '[K] or [X]: Heavy Strike (Powerful reach)'],
      touch: ['Virtual D-Pad Left/Right: Step', 'Guard Button: Hold to block', 'Poke Button: Light jab', 'Strike Button: Heavy slash'],
    },
  },
  'ink-impact': {
    id: 'ink-impact',
    title: 'Ink Impact',
    subtitle: 'Sumi-e Sky Shooter',
    region: 'The High Vale & Drowned Isles',
    warden: 'The Wind Hawk & Kraken Lord',
    pigment: 'sky-cerulean',
    description: 'Horizontal ink shoot-em-up. Pilot your shadow glider across rice paper skies, dodge shadow beasts, and collect brush powerups.',
    controlsGuide: {
      keyboard: ['[W][A][S][D] or Arrow Keys: 8-Way Flight', '[Space] or [J]: Fire Ink Darts', '[K] or [B]: Ink Screen Burst Bomb'],
      touch: ['Touch & Drag or Joystick: Fly', 'Auto-Fire or Tap [Fire] button', '[Bomb] button: Clear screen'],
    },
  },
  'rogue-outlaw': {
    id: 'rogue-outlaw',
    title: 'Rogue Outlaw',
    subtitle: 'Badlands Top-Down Arena',
    region: 'The Scorched Dunes',
    warden: 'The Red Viper',
    pigment: 'blood-vermilion',
    description: 'Survive relentless waves of desert bandits and marksmen in the red canyon ruins. Roll through enemy fire and take down the Viper Boss.',
    controlsGuide: {
      keyboard: ['[W][A][S][D] / Arrow Keys: 8-Way Movement', 'Mouse Aim + Click / [J] / [F] / [Enter]: Shoot', '[Space] / [Shift]: Combat Roll (Invulnerable)'],
      touch: ['Left Stick: Move', 'Right Stick / Tap: Aim & Shoot', 'Roll Button: Dodge roll'],
    },
  },
  'ink-rush': {
    id: 'ink-rush',
    title: 'Ink Rush',
    subtitle: 'River Rapids Courier Runner',
    region: 'The River Crossings',
    warden: 'The Phantom Courier',
    pigment: 'rushing-teal',
    description: 'Sprint across the roaring Trident River sandbars. Switch lanes, leap over jagged boulders, and slide under wooden gates to deliver the confidential scroll.',
    controlsGuide: {
      keyboard: ['[A] / [D] or [←] / [→]: Switch Lane (3 Lanes)', '[W] / [↑] / [Space]: High Jump over logs and boulders', '[S] / [↓]: Slide under gates and rope traps'],
      touch: ['Swipe Left / Right: Switch Lanes', 'Swipe Up: Jump', 'Swipe Down: Slide'],
    },
  },
};
