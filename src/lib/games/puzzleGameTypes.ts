import { Pigment } from '../../contexts/SpectrumContext';

export type PuzzleGameId =
  | 'ink-slide'
  | 'ink-fleet'
  | 'archery'
  | 'uno'
  | 'bloom'
  | 'quick-draw'
  | 'connect4'
  | 'gomoku'
  | 'sudoku'
  | 'memory';

export type LandmarkType = 'sanctum-gate' | 'autonomous-landmark' | 'citadel-archive';

export interface PuzzleGameConfig {
  id: PuzzleGameId;
  title: string;
  subtitle: string;
  region: string;
  regionId: string;
  pigment: Pigment;
  landmarkName: string;
  landmarkType: LandmarkType;
  wardenName: string;
  description: string;
  controlsHelp: string[];
  modes: string[];
}

export const PUZZLE_GAMES_METADATA: Record<PuzzleGameId, PuzzleGameConfig> = {
  'ink-slide': {
    id: 'ink-slide',
    title: 'Ink Slide',
    subtitle: 'Glacial Cavern Sliding Puzzles',
    region: 'The Frozen Reach',
    regionId: 'frozen-reach',
    pigment: 'frost-cyan',
    landmarkName: 'Glacial Gate of Ice',
    landmarkType: 'sanctum-gate',
    wardenName: 'The Frost King',
    description: 'Navigate slick sumi ice, avoid jagged hazards, and stop on dry parchment to reach the Vermilion Goal.',
    controlsHelp: [
      'WASD / Arrow Keys: Slide in chosen direction until an obstacle or brake',
      'Swipe / Drag: Mobile swipe slide controls',
      'R / Reset: Restart the current puzzle stage',
      'U / Undo: Step backward to previous slide position',
    ],
    modes: ['Easy (10 Stages)', 'Medium (10 Stages)', 'Hard (10 Stages)'],
  },
  'ink-fleet': {
    id: 'ink-fleet',
    title: 'Ink Fleet',
    subtitle: 'Tactical Abyssal Naval Duel',
    region: 'The Drowned Isles',
    regionId: 'drowned-isles',
    pigment: 'abyssal-navy',
    landmarkName: 'Abyssal Bay Harbor',
    landmarkType: 'autonomous-landmark',
    wardenName: 'Lord of the Kraken',
    description: 'Concealed fleet placement and radar artillery duels shrouded in supernatural ocean mist.',
    controlsHelp: [
      'Click / Tap Grid: Fire artillery strike into mist',
      'Drag Ships: Arrange fleet during placement phase',
      'R Key: Rotate ship orientation (horizontal/vertical)',
    ],
    modes: ['Solo vs Kraken AI', 'Local 2P Pass-and-Play', 'Online 1v1 Duel (Supabase)'],
  },
  'archery': {
    id: 'archery',
    title: "Yoichi's Peak Archery",
    subtitle: 'High Vale Recurve Target Range',
    region: 'The High Vale',
    regionId: 'high-vale',
    pigment: 'sky-cerulean',
    landmarkName: "Yoichi's Peak Range",
    landmarkType: 'autonomous-landmark',
    wardenName: 'The Wind Hawk',
    description: 'Recurve archery facing dynamic wind shear, breath stabilization, and Olympic 5-set target brackets.',
    controlsHelp: [
      'Click & Hold / Space: Draw bowstring and enter steady aim',
      'Mouse / Touch Move: Compensate for wind drift and center crosshair',
      'Release: Loose arrow toward target rings',
    ],
    modes: ['Solo Ranking Round', 'Exhibition vs CPU', 'Grand Tournament Bracket'],
  },
  'uno': {
    id: 'uno',
    title: 'The Gilded Den (Uno)',
    subtitle: 'High-Stakes Ink Card Den',
    region: 'The Gilded Vault',
    regionId: 'gilded-vault',
    pigment: 'molten-gold',
    landmarkName: 'The Gilded Speakeasy',
    landmarkType: 'autonomous-landmark',
    wardenName: 'The Golden Patriarch',
    description: 'Fast-paced tactical card shedding with bot AI tycoons, house rules (No Mercy, Stack Wars), and multiplayer tables.',
    controlsHelp: [
      'Click / Tap Card: Play matching color or value card',
      'Draw Pile: Draw a card if no valid play',
      'Wild Picker: Choose target ink pigment (Sumi, Vermillion, Indigo, Ochre)',
    ],
    modes: ['Solo vs Bots', 'Stack War (Draw Stacking)', 'No Mercy (Knockout)', 'Supabase Multiplayer Lobby'],
  },
  'bloom': {
    id: 'bloom',
    title: 'Bloom (Chain Reaction)',
    subtitle: 'Thornwood Garden Spore Duel',
    region: 'The Verdant Reach',
    regionId: 'verdant-reach',
    pigment: 'emerald-jade',
    landmarkName: 'Thornwood Orchard',
    landmarkType: 'autonomous-landmark',
    wardenName: 'Lady of the Thorns',
    description: 'Drop spores into grid cells until they exceed capacity, triggering cascading explosions that claim adjacent territory.',
    controlsHelp: [
      'Click / Tap Cell: Add spore orb to empty cell or friendly cell',
      'Corners explode at 2 orbs; Edges explode at 3 orbs; Centers explode at 4 orbs',
    ],
    modes: ['vs CPU (Easy/Med/Hard)', 'Local 2P Duel'],
  },
  'quick-draw': {
    id: 'quick-draw',
    title: 'Bamboo Quick-Draw',
    subtitle: 'River Crossing Iaido Duel',
    region: 'The River Crossings',
    regionId: 'river-crossings',
    pigment: 'rushing-teal',
    landmarkName: 'Bamboo Grove Teahouse',
    landmarkType: 'autonomous-landmark',
    wardenName: 'The Phantom Courier',
    description: 'Split-second iaido reflex showdown against The Phantom Courier. Strike the instant the kanji flashes.',
    controlsHelp: [
      'Wait for the FLASH signal...',
      'Click / Tap / Space immediately when flash appears',
      'False start penalty if pressed early!',
    ],
    modes: ['Reflex Duel (Best of 5)', 'Speed Benchmark Trial'],
  },
  'connect4': {
    id: 'connect4',
    title: "Red Viper's Gravity Grid",
    subtitle: 'Vertical 4-in-a-Row Alignment',
    region: 'The Scorched Dunes',
    regionId: 'scorched-dunes',
    pigment: 'blood-vermilion',
    landmarkName: "The Red Viper's Pavilion",
    landmarkType: 'sanctum-gate',
    wardenName: 'The Red Viper',
    description: 'Drop crimson and obsidian stones into the 7x6 vertical lattice, calculating line traps against minimax AI.',
    controlsHelp: [
      'Click / Tap Column: Drop stone into desired vertical column',
      'Align 4 stones horizontally, vertically, or diagonally to win',
    ],
    modes: ['vs Minimax AI (Easy/Med/Hard)', 'Local 2P Duel'],
  },
  'gomoku': {
    id: 'gomoku',
    title: 'Dune Gomoku & Stones',
    subtitle: 'Ancient Line Capture Strategy',
    region: 'The Scorched Dunes',
    regionId: 'scorched-dunes',
    pigment: 'blood-vermilion',
    landmarkName: "The Red Viper's Arena Gate",
    landmarkType: 'sanctum-gate',
    wardenName: 'The Red Viper',
    description: 'Unconstrained stone placement across 3x3, 9x9, or 15x15 boards aiming to align 5 unbroken stones.',
    controlsHelp: [
      'Click / Tap Intersection: Place stone on board',
      '3x3: Align 3 in a row | 9x9: Align 4 in a row | 15x15: Align 5 in a row',
    ],
    modes: ['3x3 Tic-Tac-Toe', '9x9 Mini-Gomoku', '15x15 Full Gomoku'],
  },
  'sudoku': {
    id: 'sudoku',
    title: 'Citadel Logic Scrolls',
    subtitle: 'Obsidian Citadel 9x9 Sudoku',
    region: 'The Obsidian Citadel',
    regionId: 'obsidian-citadel',
    pigment: 'full-spectrum',
    landmarkName: 'The Citadel Scriptorium',
    landmarkType: 'citadel-archive',
    wardenName: 'The Grand Archivist',
    description: 'Decipher ancient 9x9 logic matrices with conflict detection, pencil notes, and rated difficulty scrolls.',
    controlsHelp: [
      'Click Cell + Number Key (1-9): Enter ink number',
      'Pencil Mode: Toggle draft candidate notes',
      'Delete / Backspace: Erase selected cell entry',
    ],
    modes: ['Easy Scrolls', 'Medium Scrolls', 'Hard Scrolls', 'Diabolical Scrolls'],
  },
  'memory': {
    id: 'memory',
    title: 'Citadel Memory Flip',
    subtitle: 'Glyph Archive Speedrun',
    region: 'The Obsidian Citadel',
    regionId: 'obsidian-citadel',
    pigment: 'full-spectrum',
    landmarkName: 'Archive of Lost Glyphs',
    landmarkType: 'citadel-archive',
    wardenName: 'The Grand Archivist',
    description: 'Match pairs of 32 traditional Sumi-e brush glyphs against the clock or against a memory AI opponent.',
    controlsHelp: [
      'Click / Tap Card: Flip card to reveal ancient glyph',
      'Match 2 identical glyphs to clear them from the archive',
    ],
    modes: ['4x4 Grid (8 Pairs)', '6x6 Grid (18 Pairs)', '8x8 Grid (32 Pairs)'],
  },
};
