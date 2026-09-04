import { Pigment } from '../../contexts/SpectrumContext';

export interface OverworldPoint {
  x: number;
  y: number;
}

export interface RegionZone {
  id: string;
  name: string;
  pigment: Pigment;
  gotEquivalent: string;
  bounds: { minX: number; maxX: number; minY: number; maxY: number };
  wardenShrine: OverworldPoint;
  signatureGame: string;
  description: string;
}

export interface ColorGateTrigger {
  id: string;
  name: string;
  requiredPigment: Pigment;
  x: number;
  y: number;
  width: number;
  height: number;
  connectsFrom: string;
  connectsTo: string;
}

export const CONTINENTAL_REGIONS: Record<string, RegionZone> = {
  'frozen-reach': {
    id: 'frozen-reach',
    name: 'The Frozen Reach',
    pigment: 'frost-cyan',
    gotEquivalent: 'The North / The Wall',
    bounds: { minX: 200, maxX: 1080, minY: 0, maxY: 300 },
    wardenShrine: { x: 640, y: 150 },
    signatureGame: 'Ink Slide & Ma-ai Boss Duel',
    description: 'A desolate snowscape where icy gusts whisper ancient oaths beneath The Wall.',
  },
  'drowned-isles': {
    id: 'drowned-isles',
    name: 'The Drowned Isles',
    pigment: 'abyssal-navy',
    gotEquivalent: 'Iron Islands / Pyke',
    bounds: { minX: 100, maxX: 450, minY: 320, maxY: 620 },
    wardenShrine: { x: 280, y: 470 },
    signatureGame: 'Ink Fleet (Naval Battleship)',
    description: 'Jagged sea stacks shrouded in impenetrable salty mist.',
  },
  'river-crossings': {
    id: 'river-crossings',
    name: 'The River Crossings',
    pigment: 'rushing-teal',
    gotEquivalent: 'Riverlands / The Twins',
    bounds: { minX: 450, maxX: 850, minY: 320, maxY: 620 },
    wardenShrine: { x: 640, y: 470 },
    signatureGame: 'Ink Rush & Reaction-Time Quick Draw',
    description: 'The roaring fork of the continental rivers, crisscrossed by stone bridges.',
  },
  'high-vale': {
    id: 'high-vale',
    name: 'The High Vale',
    pigment: 'sky-cerulean',
    gotEquivalent: 'The Eyrie / Vale of Arryn',
    bounds: { minX: 850, maxX: 1200, minY: 320, maxY: 620 },
    wardenShrine: { x: 1020, y: 470 },
    signatureGame: 'Archery & Ink Impact (Sky Shmup)',
    description: 'Impregnable sky needles scraping the upper atmosphere.',
  },
  'gilded-vault': {
    id: 'gilded-vault',
    name: 'The Gilded Vault',
    pigment: 'molten-gold',
    gotEquivalent: 'Westerlands / Casterly Rock',
    bounds: { minX: 100, maxX: 500, minY: 640, maxY: 940 },
    wardenShrine: { x: 300, y: 790 },
    signatureGame: 'Uno (The Gilded Den)',
    description: 'A subterranean labyrinth of molten gold and underground high-stakes parlors.',
  },
  'verdant-reach': {
    id: 'verdant-reach',
    name: 'The Verdant Reach',
    pigment: 'emerald-jade',
    gotEquivalent: 'Highgarden / The Reach',
    bounds: { minX: 520, maxX: 1100, minY: 640, maxY: 940 },
    wardenShrine: { x: 810, y: 790 },
    signatureGame: 'Bloom (Chain Reaction)',
    description: 'Lush terraced orchards, thorny hedgerows, and cascading blossom groves.',
  },
  'scorched-dunes': {
    id: 'scorched-dunes',
    name: 'The Scorched Dunes',
    pigment: 'blood-vermilion',
    gotEquivalent: 'Dorne / Red Waste',
    bounds: { minX: 200, maxX: 1080, minY: 960, maxY: 1300 },
    wardenShrine: { x: 640, y: 1130 },
    signatureGame: 'Connect-4, Gomoku & Rogue Outlaw Arena',
    description: 'A sun-bleached desert where red sands hide forgotten warrior tombs.',
  },
  'obsidian-citadel': {
    id: 'obsidian-citadel',
    name: 'The Obsidian Citadel',
    pigment: 'full-spectrum',
    gotEquivalent: 'Oldtown / King\'s Landing',
    bounds: { minX: 480, maxX: 800, minY: 1320, maxY: 1600 },
    wardenShrine: { x: 640, y: 1460 },
    signatureGame: 'Sudoku, Memory Flip & The Ancient Seal Climax',
    description: 'The monumental black glass library where the Great Scroll was originally shattered.',
  },
};
