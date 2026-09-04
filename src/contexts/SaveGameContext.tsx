import React, { createContext, useContext, useState, useEffect } from 'react';
import { Pigment } from './SpectrumContext';

export interface VermilionSeal {
  pigment: Pigment;
  stamped: boolean;
  stampedAt?: string;
  bestScore?: number;
  duelsFought?: number;
}

export interface PlayerCoordinates {
  x: number;
  y: number;
  facing: 'up' | 'down' | 'left' | 'right';
  currentRegion: string;
}

export interface MinigameRecord {
  highScore: number;
  gamesPlayed: number;
  gamesWon: number;
  lastPlayed?: string;
}

export interface SaveGameData {
  version: number;
  playerName: string;
  callsign: string;
  playerCoords: PlayerCoordinates;
  seals: Record<Pigment, VermilionSeal>;
  minigames: Record<string, MinigameRecord>;
  loreFragments: string[];
  playtimeSeconds: number;
  createdAt: string;
  updatedAt: string;
}

const DEFAULT_SEALS: Record<Pigment, VermilionSeal> = {
  'frost-cyan': { pigment: 'frost-cyan', stamped: false },
  'abyssal-navy': { pigment: 'abyssal-navy', stamped: false },
  'sky-cerulean': { pigment: 'sky-cerulean', stamped: false },
  'molten-gold': { pigment: 'molten-gold', stamped: false },
  'emerald-jade': { pigment: 'emerald-jade', stamped: false },
  'rushing-teal': { pigment: 'rushing-teal', stamped: false },
  'blood-vermilion': { pigment: 'blood-vermilion', stamped: false },
  'full-spectrum': { pigment: 'full-spectrum', stamped: false },
};

const DEFAULT_SAVE: SaveGameData = {
  version: 1,
  playerName: 'Shadow Wanderer',
  callsign: 'RONIN-01',
  playerCoords: {
    x: 640,
    y: 800,
    facing: 'down',
    currentRegion: 'The River Crossings',
  },
  seals: DEFAULT_SEALS,
  minigames: {},
  loreFragments: ['prologue_ancient_seal'],
  playtimeSeconds: 0,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const STORAGE_KEY = 'shadow_realm_save_v1';

export interface SaveGameContextValue {
  saveData: SaveGameData;
  updateCoords: (coords: Partial<PlayerCoordinates>) => void;
  stampSeal: (pigment: Pigment, score?: number) => void;
  recordGameResult: (gameId: string, won: boolean, score?: number) => void;
  unlockLoreFragment: (fragmentId: string) => void;
  resetGame: () => void;
  exportSaveJson: () => string;
  importSaveJson: (jsonString: string) => boolean;
}

const SaveGameContext = createContext<SaveGameContextValue | undefined>(undefined);

export const SaveGameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [saveData, setSaveData] = useState<SaveGameData>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return { ...DEFAULT_SAVE, ...parsed };
      }
    } catch (e) {
      console.warn('Failed to parse save game from storage:', e);
    }
    return DEFAULT_SAVE;
  });

  // Auto-persist on changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saveData));
    } catch (e) {
      console.warn('Failed to save game data:', e);
    }
  }, [saveData]);

  // Track playtime
  useEffect(() => {
    const timer = setInterval(() => {
      setSaveData((prev) => ({
        ...prev,
        playtimeSeconds: prev.playtimeSeconds + 1,
      }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const updateCoords = (coords: Partial<PlayerCoordinates>) => {
    setSaveData((prev) => ({
      ...prev,
      playerCoords: { ...prev.playerCoords, ...coords },
      updatedAt: new Date().toISOString(),
    }));
  };

  const stampSeal = (pigment: Pigment, score?: number) => {
    setSaveData((prev) => {
      const current = prev.seals[pigment] || { pigment, stamped: false };
      const currentBest = current.bestScore || 0;
      const newBest = score !== undefined ? Math.max(currentBest, score) : currentBest;
      return {
        ...prev,
        seals: {
          ...prev.seals,
          [pigment]: {
            ...current,
            stamped: true,
            stampedAt: new Date().toISOString(),
            bestScore: newBest,
            duelsFought: (current.duelsFought || 0) + 1,
          },
        },
        updatedAt: new Date().toISOString(),
      };
    });
  };

  const recordGameResult = (gameId: string, won: boolean, score = 0) => {
    setSaveData((prev) => {
      const existing = prev.minigames[gameId] || {
        highScore: 0,
        gamesPlayed: 0,
        gamesWon: 0,
      };
      return {
        ...prev,
        minigames: {
          ...prev.minigames,
          [gameId]: {
            highScore: Math.max(existing.highScore, score),
            gamesPlayed: existing.gamesPlayed + 1,
            gamesWon: existing.gamesWon + (won ? 1 : 0),
            lastPlayed: new Date().toISOString(),
          },
        },
        updatedAt: new Date().toISOString(),
      };
    });
  };

  const unlockLoreFragment = (fragmentId: string) => {
    setSaveData((prev) => {
      if (prev.loreFragments.includes(fragmentId)) return prev;
      return {
        ...prev,
        loreFragments: [...prev.loreFragments, fragmentId],
        updatedAt: new Date().toISOString(),
      };
    });
  };

  const resetGame = () => {
    const fresh: SaveGameData = {
      ...DEFAULT_SAVE,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setSaveData(fresh);
    localStorage.removeItem(STORAGE_KEY);
  };

  const exportSaveJson = (): string => {
    return JSON.stringify(saveData, null, 2);
  };

  const importSaveJson = (jsonString: string): boolean => {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed && typeof parsed === 'object' && parsed.version) {
        setSaveData({ ...DEFAULT_SAVE, ...parsed });
        return true;
      }
    } catch (e) {
      console.error('Invalid save game JSON:', e);
    }
    return false;
  };

  return (
    <SaveGameContext.Provider
      value={{
        saveData,
        updateCoords,
        stampSeal,
        recordGameResult,
        unlockLoreFragment,
        resetGame,
        exportSaveJson,
        importSaveJson,
      }}
    >
      {children}
    </SaveGameContext.Provider>
  );
};

export const useSaveGame = (): SaveGameContextValue => {
  const context = useContext(SaveGameContext);
  if (!context) {
    throw new Error('useSaveGame must be used within a SaveGameProvider');
  }
  return context;
};
