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
    bounds: { minX: 300, maxX: 2900, minY: 0, maxY: 600 },
    wardenShrine: { x: 1600, y: 300 },
    signatureGame: 'Ink Slide & Ma-ai Boss Duel',
    description: 'A desolate snowscape where icy gusts whisper ancient oaths beneath The Wall.',
  },
  'drowned-isles': {
    id: 'drowned-isles',
    name: 'The Drowned Isles',
    pigment: 'abyssal-navy',
    gotEquivalent: 'Iron Islands / Pyke',
    bounds: { minX: 100, maxX: 1000, minY: 600, maxY: 1300 },
    wardenShrine: { x: 550, y: 920 },
    signatureGame: 'Ink Fleet (Naval Battleship)',
    description: 'Jagged sea stacks shrouded in impenetrable salty mist.',
  },
  'river-crossings': {
    id: 'river-crossings',
    name: 'The River Crossings',
    pigment: 'rushing-teal',
    gotEquivalent: 'Riverlands / The Twins',
    bounds: { minX: 1000, maxX: 2200, minY: 600, maxY: 1300 },
    wardenShrine: { x: 1600, y: 920 },
    signatureGame: 'Ink Rush & Reaction-Time Quick Draw',
    description: 'The roaring fork of the continental rivers, crisscrossed by stone bridges.',
  },
  'high-vale': {
    id: 'high-vale',
    name: 'The High Vale',
    pigment: 'sky-cerulean',
    gotEquivalent: 'The Eyrie / Vale of Arryn',
    bounds: { minX: 2200, maxX: 3100, minY: 600, maxY: 1300 },
    wardenShrine: { x: 2650, y: 920 },
    signatureGame: 'Archery & Ink Impact (Sky Shmup)',
    description: 'Impregnable sky needles scraping the upper atmosphere.',
  },
  'gilded-vault': {
    id: 'gilded-vault',
    name: 'The Gilded Vault',
    pigment: 'molten-gold',
    gotEquivalent: 'Westerlands / Casterly Rock',
    bounds: { minX: 100, maxX: 1100, minY: 1300, maxY: 1900 },
    wardenShrine: { x: 600, y: 1600 },
    signatureGame: 'Uno (The Gilded Den)',
    description: 'A subterranean labyrinth of molten gold and underground high-stakes parlors.',
  },
  'verdant-reach': {
    id: 'verdant-reach',
    name: 'The Verdant Reach',
    pigment: 'emerald-jade',
    gotEquivalent: 'Highgarden / The Reach',
    bounds: { minX: 2100, maxX: 3100, minY: 1300, maxY: 1900 },
    wardenShrine: { x: 2600, y: 1600 },
    signatureGame: 'Bloom (Chain Reaction)',
    description: 'Lush terraced orchards, thorny hedgerows, and cascading blossom groves.',
  },
  'scorched-dunes': {
    id: 'scorched-dunes',
    name: 'The Scorched Dunes',
    pigment: 'blood-vermilion',
    gotEquivalent: 'Dorne / Red Waste',
    bounds: { minX: 1100, maxX: 2100, minY: 1300, maxY: 1900 },
    wardenShrine: { x: 1600, y: 1600 },
    signatureGame: 'Connect-4, Gomoku & Rogue Outlaw Arena',
    description: 'A sun-bleached desert where red sands hide forgotten warrior tombs.',
  },
  'obsidian-citadel': {
    id: 'obsidian-citadel',
    name: 'The Obsidian Citadel',
    pigment: 'full-spectrum',
    gotEquivalent: 'Oldtown / King\'s Landing',
    bounds: { minX: 800, maxX: 2400, minY: 1900, maxY: 2400 },
    wardenShrine: { x: 1600, y: 2150 },
    signatureGame: 'Sudoku, Memory Flip & The Ancient Seal Climax',
    description: 'The monumental black glass library where the Great Scroll was originally shattered.',
  },
};

export const COLOR_GATES: ColorGateTrigger[] = [
  {
    id: 'gate-north',
    name: 'Glacial Chasm & Waterfall',
    requiredPigment: 'frost-cyan',
    x: 1480,
    y: 590,
    width: 240,
    height: 40,
    connectsFrom: 'river-crossings',
    connectsTo: 'frozen-reach',
  },
  {
    id: 'gate-west',
    name: 'Abyssal Mist Straits',
    requiredPigment: 'abyssal-navy',
    x: 990,
    y: 840,
    width: 40,
    height: 160,
    connectsFrom: 'river-crossings',
    connectsTo: 'drowned-isles',
  },
  {
    id: 'gate-east',
    name: 'Howling Wind Gorge',
    requiredPigment: 'sky-cerulean',
    x: 2190,
    y: 840,
    width: 40,
    height: 160,
    connectsFrom: 'river-crossings',
    connectsTo: 'high-vale',
  },
  {
    id: 'gate-vault',
    name: 'Gilded Vault Portcullis',
    requiredPigment: 'molten-gold',
    x: 1070,
    y: 1280,
    width: 50,
    height: 110,
    connectsFrom: 'river-crossings',
    connectsTo: 'gilded-vault',
  },
  {
    id: 'gate-verdant',
    name: 'Brier Thorn Cliff',
    requiredPigment: 'emerald-jade',
    x: 2080,
    y: 1280,
    width: 50,
    height: 110,
    connectsFrom: 'river-crossings',
    connectsTo: 'verdant-reach',
  },
  {
    id: 'gate-dunes',
    name: 'Vermilion Sandstorm Pass',
    requiredPigment: 'blood-vermilion',
    x: 1480,
    y: 1290,
    width: 240,
    height: 40,
    connectsFrom: 'river-crossings',
    connectsTo: 'scorched-dunes',
  },
  {
    id: 'gate-citadel',
    name: 'Primordial Rift Gate',
    requiredPigment: 'full-spectrum',
    x: 1480,
    y: 1890,
    width: 240,
    height: 40,
    connectsFrom: 'scorched-dunes',
    connectsTo: 'obsidian-citadel',
  },
];

export const getRegionAt = (x: number, y: number): RegionZone => {
  for (const region of Object.values(CONTINENTAL_REGIONS)) {
    if (
      x >= region.bounds.minX &&
      x <= region.bounds.maxX &&
      y >= region.bounds.minY &&
      y <= region.bounds.maxY
    ) {
      return region;
    }
  }
  return CONTINENTAL_REGIONS['river-crossings'];
};
