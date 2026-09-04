import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';

export type Pigment =
  | 'frost-cyan'      // The Frozen Reach (The Wall / Frost King)
  | 'abyssal-navy'    // The Drowned Isles (Lord of the Kraken)
  | 'sky-cerulean'    // The High Vale (The Wind Hawk)
  | 'molten-gold'     // The Gilded Vault (The Golden Patriarch)
  | 'emerald-jade'    // The Verdant Reach (Lady of the Thorns)
  | 'rushing-teal'    // The River Crossings (The Phantom Courier)
  | 'blood-vermilion' // The Scorched Dunes (The Red Viper)
  | 'full-spectrum';  // The Obsidian Citadel (The Grand Archivist)

export interface PigmentMeta {
  id: Pigment;
  name: string;
  realm: string;
  gotEquivalent: string;
  warden: string;
  title: string;
  colorHex: string;
  motto: string;
  sealKanji: string;
  perceptiveAbility: string;
}

export const PIGMENT_REGISTRY: Record<Pigment, PigmentMeta> = {
  'frost-cyan': {
    id: 'frost-cyan',
    name: 'Frost Cyan',
    realm: 'The Frozen Reach',
    gotEquivalent: 'The North / The Wall',
    warden: 'The Frost King',
    title: 'The Ice Lich',
    colorHex: '#48cae4',
    motto: 'Winter is Drawn.',
    sealKanji: '氷', // Ice
    perceptiveAbility: 'Freezes raging torrents into solid ice bridges and reveals hidden ice cavern trials.',
  },
  'abyssal-navy': {
    id: 'abyssal-navy',
    name: 'Abyssal Navy',
    realm: 'The Drowned Isles',
    gotEquivalent: 'Iron Islands / Pyke',
    warden: 'Lord of the Kraken',
    title: 'Drowned Reaver',
    colorHex: '#1d3557',
    motto: 'What is Sunk May Never Float.',
    sealKanji: '海', // Sea
    perceptiveAbility: 'Parts supernatural ocean mists and unlocks sea ferry crossings.',
  },
  'sky-cerulean': {
    id: 'sky-cerulean',
    name: 'Sky Cerulean',
    realm: 'The High Vale',
    gotEquivalent: 'The Eyrie / Vale of Arryn',
    warden: 'The Wind Hawk',
    title: 'Aerial Champion',
    colorHex: '#90e0ef',
    motto: 'As High as the Arrow Flies.',
    sealKanji: '風', // Wind
    perceptiveAbility: 'Reveals floating wind updrafts allowing traversal across chasm gorges.',
  },
  'molten-gold': {
    id: 'molten-gold',
    name: 'Molten Gold',
    realm: 'The Gilded Vault',
    gotEquivalent: 'Westerlands / Casterly Rock',
    warden: 'The Golden Patriarch',
    title: 'High-Stakes Tycoon',
    colorHex: '#e0a96d',
    motto: 'A Warden Always Pays His Debt.',
    sealKanji: '金', // Gold
    perceptiveAbility: 'Illuminates hidden golden inscriptions and opens secret card den speakeasy doors.',
  },
  'emerald-jade': {
    id: 'emerald-jade',
    name: 'Emerald Jade',
    realm: 'The Verdant Reach',
    gotEquivalent: 'Highgarden / The Reach',
    warden: 'Lady of the Thorns',
    title: 'Matriarch of the Bloom',
    colorHex: '#2d6a4f',
    motto: 'Growing Explosions.',
    sealKanji: '木', // Wood / Flora
    perceptiveAbility: 'Sprouts ancient living root vines along sheer cliff walls for climbing.',
  },
  'rushing-teal': {
    id: 'rushing-teal',
    name: 'Rushing Teal',
    realm: 'The River Crossings',
    gotEquivalent: 'Riverlands / The Twins',
    warden: 'The Phantom Courier',
    title: 'Swiftblade of the Trident',
    colorHex: '#0077b6',
    motto: 'Family. Duty. Reflexes.',
    sealKanji: '川', // River
    perceptiveAbility: 'Reveals stable shallow sandbars across rushing river forks.',
  },
  'blood-vermilion': {
    id: 'blood-vermilion',
    name: 'Blood Vermilion',
    realm: 'The Scorched Dunes',
    gotEquivalent: 'Dorne / Red Waste',
    warden: 'The Red Viper',
    title: 'Poison Spear Duelist',
    colorHex: '#b3312c',
    motto: 'Unbowed. Unbent. Unbeaten.',
    sealKanji: '炎', // Flame
    perceptiveAbility: 'Disperses blinding dust devils and unearths buried badland ruins.',
  },
  'full-spectrum': {
    id: 'full-spectrum',
    name: 'Full Spectrum Prism',
    realm: 'The Obsidian Citadel',
    gotEquivalent: 'Oldtown / King\'s Landing',
    warden: 'The Grand Archivist',
    title: 'Keeper of the Ancient Seal',
    colorHex: '#7209b7',
    motto: 'Knowledge is Shadow.',
    sealKanji: '極', // Zenith / Ultimate
    perceptiveAbility: 'Dissolves the Primordial Rift Gate leading to the realm\'s restoration.',
  },
};

export type EnvironmentalBarrier =
  | 'ice-chasm'
  | 'ocean-mist'
  | 'wind-gorge'
  | 'gilded-gate'
  | 'vine-cliff'
  | 'river-rapids'
  | 'sandstorm-ruins'
  | 'citadel-barrier';

export interface SpectrumContextValue {
  unlockedPigments: Pigment[];
  activeOverlayColor: Pigment | null;
  chapter: number;
  chapterTitle: string;
  lastUnlockedPigment: Pigment | null;
  hasPigment: (pigment: Pigment) => boolean;
  canTraverse: (barrier: EnvironmentalBarrier) => boolean;
  unlockPigment: (pigment: Pigment) => void;
  setActiveOverlayColor: (pigment: Pigment | null) => void;
  resetSpectrum: () => void;
  clearLastUnlocked: () => void;
}

const STORAGE_KEY = 'shadow_realm_spectrum_v1';

const CHAPTER_TITLES: Record<number, string> = {
  0: 'Prologue: The Devoured Sun (Monochrome)',
  1: 'Chapter I: The First Shard of Color',
  2: 'Chapter II: The Two-Fold Spectrum',
  3: 'Chapter III: Awakening of the Triad',
  4: 'Chapter IV: The Four Continental Pillars',
  5: 'Chapter V: The Pentachrome Convergence',
  6: 'Chapter VI: The Six Seals of Mastery',
  7: 'Chapter VII: The Seven Vermilion Crowns',
  8: 'Epilogue: Master of the Infinite Ink',
};

const SpectrumContext = createContext<SpectrumContextValue | undefined>(undefined);

export const SpectrumProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [unlockedPigments, setUnlockedPigments] = useState<Pigment[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('Failed to parse saved spectrum state:', e);
    }
    return []; // Chapter 0: Complete monochrome Sumi-e
  });

  const [activeOverlayColor, setActiveOverlayColor] = useState<Pigment | null>(null);
  const [lastUnlockedPigment, setLastUnlockedPigment] = useState<Pigment | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(unlockedPigments));
    } catch (e) {
      console.warn('Failed to persist spectrum state:', e);
    }
  }, [unlockedPigments]);

  const hasPigment = (pigment: Pigment): boolean => {
    return unlockedPigments.includes(pigment);
  };

  const unlockPigment = (pigment: Pigment) => {
    setUnlockedPigments((prev) => {
      if (prev.includes(pigment)) return prev;
      setLastUnlockedPigment(pigment);
      return [...prev, pigment];
    });
  };

  const resetSpectrum = () => {
    setUnlockedPigments([]);
    setActiveOverlayColor(null);
    setLastUnlockedPigment(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const clearLastUnlocked = () => {
    setLastUnlockedPigment(null);
  };

  const canTraverse = (barrier: EnvironmentalBarrier): boolean => {
    switch (barrier) {
      case 'ice-chasm':
        return hasPigment('frost-cyan');
      case 'ocean-mist':
        return hasPigment('abyssal-navy');
      case 'wind-gorge':
        return hasPigment('sky-cerulean');
      case 'gilded-gate':
        return hasPigment('molten-gold');
      case 'vine-cliff':
        return hasPigment('emerald-jade');
      case 'river-rapids':
        return hasPigment('rushing-teal');
      case 'sandstorm-ruins':
        return hasPigment('blood-vermilion');
      case 'citadel-barrier':
        return hasPigment('full-spectrum') || unlockedPigments.length >= 7;
      default:
        return false;
    }
  };

  const chapter = useMemo(() => {
    if (hasPigment('full-spectrum')) return 8;
    return unlockedPigments.length;
  }, [unlockedPigments]);

  const chapterTitle = CHAPTER_TITLES[chapter] || 'The Unknown Ink';

  const value: SpectrumContextValue = {
    unlockedPigments,
    activeOverlayColor,
    chapter,
    chapterTitle,
    lastUnlockedPigment,
    hasPigment,
    canTraverse,
    unlockPigment,
    setActiveOverlayColor,
    resetSpectrum,
    clearLastUnlocked,
  };

  return <SpectrumContext.Provider value={value}>{children}</SpectrumContext.Provider>;
};

export const useSpectrum = (): SpectrumContextValue => {
  const context = useContext(SpectrumContext);
  if (!context) {
    throw new Error('useSpectrum must be used within a SpectrumProvider');
  }
  return context;
};
