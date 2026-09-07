import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Compass,
  ShieldAlert,
  Gamepad2,
  Volume2,
  VolumeX,
  Menu,
} from 'lucide-react';
import {
  createOverworldGame,
  OverworldGameHandle,
  OverworldCallbacks,
  NearbyInteractableInfo,
} from '../../lib/engine/phaserConfig';
import { useSpectrum, Pigment, PIGMENT_REGISTRY } from '../../contexts/SpectrumContext';
import { useSaveGame } from '../../contexts/SaveGameContext';
import { useAudio, ProceduralSfxType } from '../../contexts/AudioContext';
import { DialogueOverlay } from './DialogueOverlay';
import { WorldMapModal } from './WorldMapModal';
import { VirtualJoystick } from './VirtualJoystick';
import { BossIntroCutscene } from './BossIntroCutscene';
import { CONTINENTAL_REGIONS } from '../../lib/engine/tilemapData';
import { ActionGameId, ACTION_GAMES_METADATA } from '../../lib/games/actionGameTypes';
import { BladeDuelModal } from '../games/BladeDuelModal';
import { InkImpactModal } from '../games/InkImpactModal';
import { RogueOutlawModal } from '../games/RogueOutlawModal';
import { InkRushModal } from '../games/InkRushModal';
import { PuzzleGameId, PUZZLE_GAMES_METADATA } from '../../lib/games/puzzleGameTypes';
import { InkSlideModal } from '../games/react/InkSlideModal';
import { InkFleetModal } from '../games/react/InkFleetModal';
import { ArcheryModal } from '../games/react/ArcheryModal';
import { UnoModal } from '../games/react/UnoModal';
import { BloomModal } from '../games/react/BloomModal';
import { QuickDrawModal } from '../games/react/QuickDrawModal';
import { Connect4Modal } from '../games/react/Connect4Modal';
import { GomokuModal } from '../games/react/GomokuModal';
import { SudokuModal } from '../games/react/SudokuModal';
import { MemoryFlipModal } from '../games/react/MemoryFlipModal';
import confetti from 'canvas-confetti';

const getTrialForRegion = (regionId: string): ActionGameId => {
  switch (regionId) {
    case 'frozen-reach':
      return 'blade-duel';
    case 'river-crossings':
      return 'ink-rush';
    case 'high-vale':
    case 'drowned-isles':
      return 'ink-impact';
    case 'scorched-dunes':
      return 'rogue-outlaw';
    default:
      return 'blade-duel';
  }
};

export interface PhaserOverworldProps {
  onOpenMenu?: () => void;
}

export const PhaserOverworld: React.FC<PhaserOverworldProps> = ({ onOpenMenu }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameHandleRef = useRef<OverworldGameHandle | null>(null);

  const { unlockedPigments, unlockPigment, hasPigment } = useSpectrum();
  const { saveData, updateCoords, stampSeal, recordGameResult } = useSaveGame();
  const { playSfx, isMuted, toggleMute } = useAudio();

  // Overworld UI State
  const [currentRegionId, setCurrentRegionId] = useState<string>(
    saveData.playerCoords.currentRegion || 'river-crossings'
  );
  const currentRegionRef = useRef<string>(
    saveData.playerCoords.currentRegion || 'river-crossings'
  );
  const [currentCoords, setCurrentCoords] = useState<{ x: number; y: number }>({
    x: saveData.playerCoords.x || 1600,
    y: saveData.playerCoords.y || 1000,
  });

  // Modals & Notifications
  const [isMapOpen, setIsMapOpen] = useState<boolean>(false);
  const [encounterWardenId, setEncounterWardenId] = useState<string | null>(null);
  const [regionBanner, setRegionBanner] = useState<{ name: string; motto: string } | null>(null);
  const [barrierAlert, setBarrierAlert] = useState<{ name: string; pigment: Pigment } | null>(null);
  const [nearbyInteractable, setNearbyInteractable] = useState<NearbyInteractableInfo | null>(null);

  // Trial Action & Strategy Minigame State
  const [activeBossCutscene, setActiveBossCutscene] = useState<ActionGameId | null>(null);
  const [activeTrialGame, setActiveTrialGame] = useState<ActionGameId | null>(null);
  const [activePuzzleGame, setActivePuzzleGame] = useState<PuzzleGameId | null>(null);
  const [challengingWardenRegion, setChallengingWardenRegion] = useState<string | null>(null);

  // Mobile / Touch controls toggle
  const [showTouchControls, setShowTouchControls] = useState<boolean>(() => {
    return typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);
  });

  // 1. Initialize Phaser Engine
  useEffect(() => {
    if (!containerRef.current || gameHandleRef.current) return;

    const callbacks: OverworldCallbacks = {
      onRegionChange: (regionId, regionName) => {
        currentRegionRef.current = regionId;
        setCurrentRegionId(regionId);
        const meta = CONTINENTAL_REGIONS[regionId];
        const motto = meta ? PIGMENT_REGISTRY[meta.pigment].motto : '';
        setRegionBanner({ name: regionName, motto });

        // Auto-dismiss banner after 3.5s
        setTimeout(() => {
          setRegionBanner(null);
        }, 3500);
      },

      onPlayerMove: (coords) => {
        setCurrentCoords({ x: coords.x, y: coords.y });
        const regId = coords.currentRegion || currentRegionRef.current || 'river-crossings';
        currentRegionRef.current = regId;
        updateCoords({
          x: coords.x,
          y: coords.y,
          facing: coords.facing,
          currentRegion: regId,
        });
      },

      onWardenEncounter: (wardenRegionId) => {
        setEncounterWardenId(wardenRegionId);
      },

      onLandmarkEncounter: (landmark) => {
        setActivePuzzleGame(landmark.gameId);
        playSfx('parchment');
      },

      onBarrierEncounter: (barrierName, requiredPigment) => {
        playSfx('clash');
        setBarrierAlert({ name: barrierName, pigment: requiredPigment });
        setTimeout(() => {
          setBarrierAlert(null);
        }, 3000);
      },

      onNearbyInteractableChange: (interactable) => {
        setNearbyInteractable(interactable);
      },

      onPlaySfx: (sfxName) => {
        playSfx(sfxName as ProceduralSfxType);
      },
    };

    const handle = createOverworldGame({
      parent: containerRef.current,
      callbacks,
      initialCoords: { x: saveData.playerCoords.x, y: saveData.playerCoords.y },
      unlockedPigments,
    });

    gameHandleRef.current = handle;

    return () => {
      handle.game.destroy(true);
      gameHandleRef.current = null;
    };
  }, []);

  // 2. React to unlocked pigments changes
  useEffect(() => {
    if (gameHandleRef.current) {
      gameHandleRef.current.updateUnlockedPigments(unlockedPigments);
    }
  }, [unlockedPigments]);

  // Pause overworld & release keyboard captures when any modal or cutscene is active
  useEffect(() => {
    if (!gameHandleRef.current) return;
    const isModalActive = Boolean(
      activeTrialGame || activeBossCutscene || isMapOpen || encounterWardenId || activePuzzleGame
    );
    if (isModalActive) {
      gameHandleRef.current.pauseOverworld();
    } else {
      gameHandleRef.current.resumeOverworld();
    }
  }, [activeTrialGame, activeBossCutscene, isMapOpen, encounterWardenId, activePuzzleGame]);

  // 3. Global Keyboard Shortcuts (M for Map, Esc for close)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'm' || e.key === 'M') {
        if (!encounterWardenId && !activeBossCutscene && !activeTrialGame && !activePuzzleGame) {
          playSfx('parchment');
          setIsMapOpen((prev) => !prev);
        }
      } else if (e.key === 'Escape') {
        setIsMapOpen(false);
        setEncounterWardenId(null);
        setActivePuzzleGame(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [encounterWardenId, activeBossCutscene, activeTrialGame, activePuzzleGame, playSfx]);

  // Fast Travel handler
  const handleFastTravel = useCallback(
    (x: number, y: number) => {
      if (gameHandleRef.current) {
        gameHandleRef.current.teleportPlayer(x, y);
      }
    },
    []
  );

  // Challenge Warden -> Trigger Cutscene -> Minigame
  const handleWardenChallenge = (_pigment: Pigment) => {
    const regionId = encounterWardenId || 'frozen-reach';
    const trialId = getTrialForRegion(regionId);
    setChallengingWardenRegion(regionId);
    setEncounterWardenId(null);
    setActiveBossCutscene(trialId);
  };

  const handleStartMinigame = useCallback(() => {
    setActiveBossCutscene((current) => {
      if (current) {
        setActiveTrialGame(current);
      }
      return null;
    });
  }, []);

  const handleTrialVictory = (score: number) => {
    if (!challengingWardenRegion || !activeTrialGame) return;

    const reg = CONTINENTAL_REGIONS[challengingWardenRegion];
    const pigment = reg ? reg.pigment : 'frost-cyan';

    recordGameResult(activeTrialGame, true, score);
    stampSeal(pigment, score);
    unlockPigment(pigment);

    playSfx('victory');
    playSfx('seal-stamp');

    const hex = PIGMENT_REGISTRY[pigment].colorHex;
    try {
      confetti({
        particleCount: 80,
        spread: 80,
        origin: { y: 0.6 },
        colors: [hex, '#f4ebd0', '#141414'],
      });
    } catch {}

    setActiveTrialGame(null);
    setChallengingWardenRegion(null);
  };

  const handlePuzzleVictory = (gameId: PuzzleGameId, score: number) => {
    const meta = PUZZLE_GAMES_METADATA[gameId];
    const pigment = meta ? meta.pigment : 'frost-cyan';

    recordGameResult(gameId, true, score);
    stampSeal(pigment, score);
    unlockPigment(pigment);

    playSfx('victory');
    playSfx('seal-stamp');

    const hex = PIGMENT_REGISTRY[pigment].colorHex;
    try {
      confetti({
        particleCount: 85,
        spread: 80,
        origin: { y: 0.6 },
        colors: [hex, '#f4ebd0', '#141414'],
      });
    } catch {}

    setActivePuzzleGame(null);
  };

  const activeRegion = CONTINENTAL_REGIONS[currentRegionId] || CONTINENTAL_REGIONS['river-crossings'];
  const activePigment = PIGMENT_REGISTRY[activeRegion.pigment];

  const challengingRegionData = challengingWardenRegion
    ? CONTINENTAL_REGIONS[challengingWardenRegion]
    : activeRegion;
  const challengingPigment = challengingRegionData ? PIGMENT_REGISTRY[challengingRegionData.pigment] : activePigment;

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#141414] select-none">
      {/* 1. Phaser 3 Canvas Container */}
      <div ref={containerRef} className="w-full h-full" />

      {/* 2. Top-Left HUD: Realm & Coordinates Bar */}
      <div className="absolute top-4 left-4 z-20 pointer-events-auto flex items-center gap-3">
        <div
          onClick={() => {
            playSfx('parchment');
            setIsMapOpen(true);
          }}
          className="flex items-center gap-2.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-[#1a1a1a]/85 backdrop-blur-md border border-[#333] shadow-lg cursor-pointer hover:border-[#e0a96d] transition group"
        >
          <div
            className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center font-serif text-xs font-bold shadow shrink-0"
            style={{
              backgroundColor: activePigment.colorHex,
              color: '#141414',
            }}
          >
            {activePigment.sealKanji}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-serif font-bold text-xs text-[#f4ebd0] group-hover:text-[#e0a96d] transition-colors">
                {activeRegion.name}
              </span>
              <span className="text-[10px] font-mono text-[#f4ebd0]/40 hidden sm:inline">
                ({currentCoords.x}, {currentCoords.y})
              </span>
            </div>
            <p className="text-[10px] text-[#f4ebd0]/50 font-mono hidden sm:block">
              Press <kbd className="px-1 py-0.5 rounded bg-[#2a2a2a] text-[#f4ebd0] font-bold">M</kbd> for Continent Map
            </p>
          </div>
        </div>
      </div>

      {/* 3. Top-Right HUD: Quick Action Toggles & Mobile Menu */}
      <div className="absolute top-4 right-4 z-20 pointer-events-auto flex items-center gap-2">
        {onOpenMenu && (
          <button
            onClick={() => {
              playSfx('click');
              onOpenMenu();
            }}
            className="px-2.5 py-2 rounded-xl bg-[#b3312c]/85 hover:bg-[#b3312c] backdrop-blur-md border border-[#f4ebd0]/30 text-[#f4ebd0] shadow-lg transition flex items-center gap-1.5 active:scale-95"
            title="Open Game Menu"
          >
            <Menu size={17} />
            <span className="text-xs font-serif font-bold">MENU</span>
          </button>
        )}

        <button
          onClick={() => {
            playSfx('click');
            setShowTouchControls((prev) => !prev);
          }}
          className={`p-2 sm:p-2.5 rounded-xl backdrop-blur-md border transition ${
            showTouchControls
              ? 'bg-[#b3312c]/30 border-[#b3312c] text-[#f4ebd0]'
              : 'bg-[#1a1a1a]/80 border-[#333] text-[#f4ebd0]/70 hover:text-white'
          }`}
          title="Toggle Mobile Touch Controls"
        >
          <Gamepad2 size={17} />
        </button>

        <button
          onClick={() => {
            playSfx('parchment');
            setIsMapOpen(true);
          }}
          className="p-2 sm:p-2.5 rounded-xl bg-[#1a1a1a]/80 backdrop-blur-md border border-[#333] hover:border-[#e0a96d] text-[#f4ebd0]/80 hover:text-white transition"
          title="Open World Map (M)"
        >
          <Compass size={17} />
        </button>

        <button
          onClick={() => {
            playSfx('click');
            toggleMute();
          }}
          className="p-2 sm:p-2.5 rounded-xl bg-[#1a1a1a]/80 backdrop-blur-md border border-[#333] hover:border-[#48cae4] text-[#f4ebd0]/80 hover:text-white transition"
          title={isMuted ? 'Unmute SFX' : 'Mute SFX'}
        >
          {isMuted ? <VolumeX size={17} className="text-red-400" /> : <Volume2 size={17} />}
        </button>
      </div>

      {/* 4. Animated Region Discovery Banner */}
      <AnimatePresence>
        {regionBanner && (
          <motion.div
            initial={{ opacity: 0, y: -40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="absolute top-18 inset-x-0 mx-auto w-fit z-20 pointer-events-none"
          >
            <div className="px-6 py-2.5 rounded-full bg-[#181818]/90 backdrop-blur-md border border-[#e0a96d]/60 shadow-2xl shadow-black/80 flex items-center gap-3 text-center">
              <span className="font-serif text-sm font-bold text-[#f4ebd0] tracking-wider">
                {regionBanner.name.toUpperCase()}
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#b3312c]" />
              <span className="font-serif italic text-xs text-[#e0a96d]">
                "{regionBanner.motto}"
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 5. Barrier Collision Alert Toast */}
      <AnimatePresence>
        {barrierAlert && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-24 inset-x-0 mx-auto w-fit z-30 pointer-events-none"
          >
            <div className="px-5 py-3 rounded-xl bg-[#1f1616]/95 border-2 border-[#b3312c] shadow-2xl flex items-center gap-3">
              <ShieldAlert size={20} className="text-[#b3312c] shrink-0" />
              <div className="text-left">
                <p className="font-serif font-bold text-xs text-[#f4ebd0]">
                  Barrier Impassable: {barrierAlert.name}
                </p>
                <p className="text-[11px] font-mono text-[#f4ebd0]/70">
                  Requires <strong style={{ color: PIGMENT_REGISTRY[barrierAlert.pigment].colorHex }}>
                    {PIGMENT_REGISTRY[barrierAlert.pigment].name}
                  </strong> pigment to cross. Defeat the Warden or conquer the Regional Trial!
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 6. Floating Center Action Banner for Touch / Direct Mobile Interaction */}
      <AnimatePresence>
        {nearbyInteractable && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-[max(9.5rem,calc(env(safe-area-inset-bottom,0px)+8.5rem))] inset-x-0 mx-auto w-fit z-30 pointer-events-auto px-4"
          >
            <button
              onClick={() => {
                if (gameHandleRef.current) {
                  gameHandleRef.current.triggerInteract();
                }
              }}
              className="px-5 py-2.5 rounded-full bg-gradient-to-r from-[#b3312c] to-[#d64038] text-[#f4ebd0] font-serif font-bold text-xs sm:text-sm tracking-wide shadow-2xl shadow-black/80 border border-[#f4ebd0]/40 active:scale-95 transition-transform flex items-center gap-2 animate-pulse"
            >
              <span>🏮</span>
              <span>
                {nearbyInteractable.type === 'landmark'
                  ? `Tap to Enter: ${nearbyInteractable.name}`
                  : `Tap to Speak with: ${nearbyInteractable.name}`}
              </span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 7. On-Screen Virtual Touch Controls (Optional/Mobile) */}
      {showTouchControls && (
        <VirtualJoystick
          onMove={(vec) => {
            if (gameHandleRef.current) {
              gameHandleRef.current.setVirtualInput(vec);
            }
          }}
          onInteract={() => {
            if (gameHandleRef.current) {
              gameHandleRef.current.triggerInteract();
            }
          }}
          hasNearbyInteractable={Boolean(nearbyInteractable)}
          interactType={nearbyInteractable?.type}
          interactLabel={
            nearbyInteractable
              ? nearbyInteractable.type === 'landmark'
                ? 'ENTER'
                : 'TALK'
              : undefined
          }
        />
      )}

      {/* 7. Dialogue Overlay Modal */}
      {encounterWardenId && (
        <DialogueOverlay
          regionId={encounterWardenId}
          isOpen={true}
          onClose={() => setEncounterWardenId(null)}
          onChallenge={handleWardenChallenge}
          onLaunchPuzzle={(gameId) => {
            setEncounterWardenId(null);
            setActivePuzzleGame(gameId);
          }}
          isUnlocked={hasPigment(CONTINENTAL_REGIONS[encounterWardenId]?.pigment)}
        />
      )}

      {/* 8. Boss Intro Cutscene */}
      {activeBossCutscene && (
        <BossIntroCutscene
          gameConfig={ACTION_GAMES_METADATA[activeBossCutscene]}
          isOpen={true}
          onStartGame={handleStartMinigame}
          wardenColorHex={challengingPigment.colorHex}
        />
      )}

      {/* 9. Action Minigame Modals */}
      {activeTrialGame === 'blade-duel' && (
        <BladeDuelModal
          isOpen={true}
          onClose={() => {
            setActiveTrialGame(null);
            setChallengingWardenRegion(null);
          }}
          onVictory={handleTrialVictory}
          wardenName={challengingPigment.warden}
          wardenColorHex={challengingPigment.colorHex}
        />
      )}

      {activeTrialGame === 'ink-impact' && (
        <InkImpactModal
          isOpen={true}
          onClose={() => {
            setActiveTrialGame(null);
            setChallengingWardenRegion(null);
          }}
          onVictory={handleTrialVictory}
          wardenColorHex={challengingPigment.colorHex}
        />
      )}

      {activeTrialGame === 'rogue-outlaw' && (
        <RogueOutlawModal
          isOpen={true}
          onClose={() => {
            setActiveTrialGame(null);
            setChallengingWardenRegion(null);
          }}
          onVictory={handleTrialVictory}
          wardenColorHex={challengingPigment.colorHex}
        />
      )}

      {activeTrialGame === 'ink-rush' && (
        <InkRushModal
          isOpen={true}
          onClose={() => {
            setActiveTrialGame(null);
            setChallengingWardenRegion(null);
          }}
          onVictory={handleTrialVictory}
          wardenColorHex={challengingPigment.colorHex}
        />
      )}

      {/* 10. Strategy & Puzzle Minigame Modals */}
      {activePuzzleGame === 'ink-slide' && (
        <InkSlideModal
          isOpen={true}
          onClose={() => setActivePuzzleGame(null)}
          onVictory={() => handlePuzzleVictory('ink-slide', 100)}
        />
      )}

      {activePuzzleGame === 'ink-fleet' && (
        <InkFleetModal
          isOpen={true}
          onClose={() => setActivePuzzleGame(null)}
          onVictory={() => handlePuzzleVictory('ink-fleet', 100)}
        />
      )}

      {activePuzzleGame === 'archery' && (
        <ArcheryModal
          isOpen={true}
          onClose={() => setActivePuzzleGame(null)}
          onVictory={() => handlePuzzleVictory('archery', 100)}
        />
      )}

      {activePuzzleGame === 'uno' && (
        <UnoModal
          isOpen={true}
          onClose={() => setActivePuzzleGame(null)}
          onVictory={() => handlePuzzleVictory('uno', 100)}
        />
      )}

      {activePuzzleGame === 'bloom' && (
        <BloomModal
          isOpen={true}
          onClose={() => setActivePuzzleGame(null)}
          onVictory={() => handlePuzzleVictory('bloom', 100)}
        />
      )}

      {activePuzzleGame === 'quick-draw' && (
        <QuickDrawModal
          isOpen={true}
          onClose={() => setActivePuzzleGame(null)}
          onVictory={() => handlePuzzleVictory('quick-draw', 100)}
        />
      )}

      {activePuzzleGame === 'connect4' && (
        <Connect4Modal
          isOpen={true}
          onClose={() => setActivePuzzleGame(null)}
          onVictory={() => handlePuzzleVictory('connect4', 100)}
        />
      )}

      {activePuzzleGame === 'gomoku' && (
        <GomokuModal
          isOpen={true}
          onClose={() => setActivePuzzleGame(null)}
          onVictory={() => handlePuzzleVictory('gomoku', 100)}
        />
      )}

      {activePuzzleGame === 'sudoku' && (
        <SudokuModal
          isOpen={true}
          onClose={() => setActivePuzzleGame(null)}
          onVictory={() => handlePuzzleVictory('sudoku', 100)}
        />
      )}

      {activePuzzleGame === 'memory' && (
        <MemoryFlipModal
          isOpen={true}
          onClose={() => setActivePuzzleGame(null)}
          onVictory={() => handlePuzzleVictory('memory', 100)}
        />
      )}

      {/* 11. Continental World Map Modal */}
      <WorldMapModal
        isOpen={isMapOpen}
        onClose={() => setIsMapOpen(false)}
        currentRegionId={currentRegionId}
        unlockedPigments={unlockedPigments}
        onFastTravel={handleFastTravel}
      />
    </div>
  );
};

export default PhaserOverworld;
