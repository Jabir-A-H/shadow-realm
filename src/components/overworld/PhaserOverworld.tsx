import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Compass,
  ShieldAlert,
  Gamepad2,
  Volume2,
  VolumeX,
} from 'lucide-react';
import {
  createOverworldGame,
  OverworldGameHandle,
  OverworldCallbacks,
} from '../../lib/engine/phaserConfig';
import { useSpectrum, Pigment, PIGMENT_REGISTRY } from '../../contexts/SpectrumContext';
import { useSaveGame } from '../../contexts/SaveGameContext';
import { useAudio, ProceduralSfxType } from '../../contexts/AudioContext';
import { DialogueOverlay } from './DialogueOverlay';
import { WorldMapModal } from './WorldMapModal';
import { VirtualJoystick } from './VirtualJoystick';
import { CONTINENTAL_REGIONS } from '../../lib/engine/tilemapData';
import confetti from 'canvas-confetti';

export const PhaserOverworld: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameHandleRef = useRef<OverworldGameHandle | null>(null);

  const { unlockedPigments, unlockPigment, hasPigment } = useSpectrum();
  const { saveData, updateCoords, stampSeal } = useSaveGame();
  const { playSfx, isMuted, toggleMute } = useAudio();

  // Overworld UI State
  const [currentRegionId, setCurrentRegionId] = useState<string>(
    saveData.playerCoords.currentRegion || 'river-crossings'
  );
  const [currentCoords, setCurrentCoords] = useState<{ x: number; y: number }>({
    x: saveData.playerCoords.x || 640,
    y: saveData.playerCoords.y || 800,
  });

  // Modals & Notifications
  const [isMapOpen, setIsMapOpen] = useState<boolean>(false);
  const [encounterWardenId, setEncounterWardenId] = useState<string | null>(null);
  const [regionBanner, setRegionBanner] = useState<{ name: string; motto: string } | null>(null);
  const [barrierAlert, setBarrierAlert] = useState<{ name: string; pigment: Pigment } | null>(null);

  // Mobile / Touch controls toggle
  const [showTouchControls, setShowTouchControls] = useState<boolean>(() => {
    return typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);
  });

  // 1. Initialize Phaser Engine
  useEffect(() => {
    if (!containerRef.current || gameHandleRef.current) return;

    const callbacks: OverworldCallbacks = {
      onRegionChange: (regionId, regionName) => {
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
        updateCoords({
          x: coords.x,
          y: coords.y,
          facing: coords.facing,
          currentRegion: CONTINENTAL_REGIONS[currentRegionId]?.name || 'The River Crossings',
        });
      },

      onWardenEncounter: (wardenRegionId) => {
        setEncounterWardenId(wardenRegionId);
      },

      onBarrierEncounter: (barrierName, requiredPigment) => {
        playSfx('clash');
        setBarrierAlert({ name: barrierName, pigment: requiredPigment });
        setTimeout(() => {
          setBarrierAlert(null);
        }, 3000);
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

  // 3. Global Keyboard Shortcuts (M for Map, Esc for close)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'm' || e.key === 'M') {
        if (!encounterWardenId) {
          playSfx('parchment');
          setIsMapOpen((prev) => !prev);
        }
      } else if (e.key === 'Escape') {
        setIsMapOpen(false);
        setEncounterWardenId(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [encounterWardenId, playSfx]);

  // Fast Travel handler
  const handleFastTravel = useCallback(
    (x: number, y: number) => {
      if (gameHandleRef.current) {
        gameHandleRef.current.teleportPlayer(x, y);
      }
    },
    []
  );

  // Challenge / Seal Stamping handler
  const handleWardenChallenge = (pigment: Pigment) => {
    if (!hasPigment(pigment)) {
      unlockPigment(pigment);
      stampSeal(pigment, 100);
      playSfx('victory');
      playSfx('seal-stamp');

      // Confetti celebration
      const hex = PIGMENT_REGISTRY[pigment].colorHex;
      try {
        confetti({
          particleCount: 70,
          spread: 80,
          origin: { y: 0.6 },
          colors: [hex, '#f4ebd0', '#141414'],
        });
      } catch {
        // Fallback
      }
    } else {
      playSfx('clash');
    }
  };

  const activeRegion = CONTINENTAL_REGIONS[currentRegionId] || CONTINENTAL_REGIONS['river-crossings'];
  const activePigment = PIGMENT_REGISTRY[activeRegion.pigment];

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
          className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-[#1a1a1a]/85 backdrop-blur-md border border-[#333] shadow-lg cursor-pointer hover:border-[#e0a96d] transition group"
        >
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center font-serif text-xs font-bold shadow"
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
              <span className="text-[10px] font-mono text-[#f4ebd0]/40">
                ({currentCoords.x}, {currentCoords.y})
              </span>
            </div>
            <p className="text-[10px] text-[#f4ebd0]/50 font-mono">
              Press <kbd className="px-1 py-0.5 rounded bg-[#2a2a2a] text-[#f4ebd0] font-bold">M</kbd> for Continent Map
            </p>
          </div>
        </div>
      </div>

      {/* 3. Top-Right HUD: Quick Action Toggles */}
      <div className="absolute top-4 right-4 z-20 pointer-events-auto flex items-center gap-2">
        <button
          onClick={() => {
            playSfx('click');
            setShowTouchControls((prev) => !prev);
          }}
          className={`p-2.5 rounded-xl backdrop-blur-md border transition ${
            showTouchControls
              ? 'bg-[#b3312c]/30 border-[#b3312c] text-[#f4ebd0]'
              : 'bg-[#1a1a1a]/80 border-[#333] text-[#f4ebd0]/70 hover:text-white'
          }`}
          title="Toggle Mobile Touch Controls"
        >
          <Gamepad2 size={18} />
        </button>

        <button
          onClick={() => {
            playSfx('parchment');
            setIsMapOpen(true);
          }}
          className="p-2.5 rounded-xl bg-[#1a1a1a]/80 backdrop-blur-md border border-[#333] hover:border-[#e0a96d] text-[#f4ebd0]/80 hover:text-white transition"
          title="Open World Map (M)"
        >
          <Compass size={18} />
        </button>

        <button
          onClick={() => {
            playSfx('click');
            toggleMute();
          }}
          className="p-2.5 rounded-xl bg-[#1a1a1a]/80 backdrop-blur-md border border-[#333] hover:border-[#48cae4] text-[#f4ebd0]/80 hover:text-white transition"
          title={isMuted ? 'Unmute SFX' : 'Mute SFX'}
        >
          {isMuted ? <VolumeX size={18} className="text-red-400" /> : <Volume2 size={18} />}
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
                  </strong> pigment to cross. Defeat the Warden in sacred trial!
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 6. On-Screen Virtual Touch Controls (Optional/Mobile) */}
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
          hasNearbyInteractable={true}
        />
      )}

      {/* 7. Dialogue Overlay Modal */}
      {encounterWardenId && (
        <DialogueOverlay
          regionId={encounterWardenId}
          isOpen={true}
          onClose={() => setEncounterWardenId(null)}
          onChallenge={handleWardenChallenge}
          isUnlocked={hasPigment(CONTINENTAL_REGIONS[encounterWardenId]?.pigment)}
        />
      )}

      {/* 8. Continental World Map Modal */}
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
