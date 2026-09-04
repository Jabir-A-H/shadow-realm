import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, MapPin, Navigation, Lock, CheckCircle2, Compass } from 'lucide-react';
import { CONTINENTAL_REGIONS, COLOR_GATES, RegionZone } from '../../lib/engine/tilemapData';
import { PIGMENT_REGISTRY, Pigment } from '../../contexts/SpectrumContext';
import { useAudio } from '../../contexts/AudioContext';

interface WorldMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentRegionId: string;
  unlockedPigments: Pigment[];
  onFastTravel: (x: number, y: number) => void;
}

export const WorldMapModal: React.FC<WorldMapModalProps> = ({
  isOpen,
  onClose,
  currentRegionId,
  unlockedPigments,
  onFastTravel,
}) => {
  const { playSfx } = useAudio();

  if (!isOpen) return null;

  const regionsList = [
    'frozen-reach',
    'drowned-isles',
    'river-crossings',
    'high-vale',
    'gilded-vault',
    'verdant-reach',
    'scorched-dunes',
    'obsidian-citadel',
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md select-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-4xl max-h-[90vh] bg-[#1a1a1a] border border-[#333] rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#2a2a2a] bg-[#1f1f1f]">
            <div className="flex items-center gap-3">
              <Compass size={22} className="text-[#e0a96d]" />
              <div>
                <h2 className="font-serif font-bold text-lg text-[#f4ebd0]">
                  Continental Map of the 7 Kingdoms
                </h2>
                <p className="text-xs text-[#f4ebd0]/50 font-mono">
                  The Parchment Realm • Chromatic Metroidvania Spectrum
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                playSfx('click');
                onClose();
              }}
              className="p-2 rounded-lg bg-[#282828] hover:bg-[#333] text-[#f4ebd0] transition"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body / Continental Schematic */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-parchment-texture text-[#141414]">
            {/* Legend / Status */}
            <div className="bg-[#141414]/90 text-[#f4ebd0] p-4 rounded-xl border border-[#333] flex flex-wrap items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#b3312c] animate-pulse" />
                <span>Current Location: <strong>{CONTINENTAL_REGIONS[currentRegionId]?.name || 'Unknown'}</strong></span>
              </div>
              <div className="flex items-center gap-4 text-xs font-mono">
                <span>Pigments Reclaimed: <strong className="text-[#e0a96d]">{unlockedPigments.length} / 8</strong></span>
              </div>
            </div>

            {/* Continental Regions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {regionsList.map((id) => {
                const reg = CONTINENTAL_REGIONS[id] as RegionZone;
                const pigmentMeta = PIGMENT_REGISTRY[reg.pigment];
                const isCurrent = currentRegionId === id;
                const isUnlocked = unlockedPigments.includes(reg.pigment);

                return (
                  <div
                    key={id}
                    className={`p-4 rounded-xl border-2 transition-all relative flex flex-col justify-between shadow-md ${
                      isCurrent
                        ? 'bg-[#181818] text-[#f4ebd0] border-[#b3312c] shadow-lg ring-2 ring-[#b3312c]/30'
                        : 'bg-[#141414]/90 text-[#f4ebd0] border-[#2e2e2e] hover:border-[#444]'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center font-serif text-sm font-bold shadow"
                            style={{
                              backgroundColor: pigmentMeta.colorHex,
                              color: '#141414',
                            }}
                          >
                            {pigmentMeta.sealKanji}
                          </div>
                          <div>
                            <h3 className="font-serif font-bold text-sm leading-snug">
                              {reg.name}
                            </h3>
                            <p className="text-[11px] text-[#f4ebd0]/50 font-mono">
                              {reg.gotEquivalent}
                            </p>
                          </div>
                        </div>

                        {isCurrent ? (
                          <span className="flex items-center gap-1 text-[11px] font-mono text-[#b3312c] bg-[#b3312c]/15 px-2 py-0.5 rounded border border-[#b3312c]/30">
                            <MapPin size={12} /> HERE
                          </span>
                        ) : isUnlocked ? (
                          <span className="flex items-center gap-1 text-[11px] font-mono text-emerald-400">
                            <CheckCircle2 size={12} /> Sealed
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[11px] font-mono text-zinc-500">
                            <Lock size={12} /> Locked
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-[#f4ebd0]/70 mt-2 line-clamp-2">
                        {reg.description}
                      </p>

                      <p className="text-[11px] text-[#e0a96d] font-mono mt-1">
                        Trial: {reg.signatureGame}
                      </p>
                    </div>

                    {/* Fast Travel Button */}
                    <div className="mt-4 pt-3 border-t border-[#2a2a2a] flex items-center justify-between">
                      <span className="text-[10px] font-mono text-[#f4ebd0]/40">
                        Shrine: ({reg.wardenShrine.x}, {reg.wardenShrine.y})
                      </span>

                      <button
                        onClick={() => {
                          playSfx('wind');
                          onFastTravel(reg.wardenShrine.x, reg.wardenShrine.y + 40);
                          onClose();
                        }}
                        className="px-3 py-1.5 rounded-lg text-xs font-serif font-bold transition flex items-center gap-1.5 bg-[#252525] hover:bg-[#323232] text-[#f4ebd0] border border-[#3a3a3a]"
                      >
                        <Navigation size={12} className="text-[#48cae4]" />
                        <span>Travel to Shrine</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Metroidvania Gates Overview */}
            <div className="bg-[#181818] p-5 rounded-xl border border-[#2d2d2d] text-[#f4ebd0]">
              <h3 className="font-serif font-bold text-sm mb-3 flex items-center gap-2">
                <Lock size={15} className="text-[#b3312c]" />
                Continental Chokepoints & Metroidvania Color Gates
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {COLOR_GATES.map((g) => {
                  const unlocked = unlockedPigments.includes(g.requiredPigment);
                  const meta = PIGMENT_REGISTRY[g.requiredPigment];

                  return (
                    <div
                      key={g.id}
                      className="p-2.5 rounded-lg bg-[#202020] border border-[#2b2b2b] flex items-center justify-between"
                    >
                      <div className="space-y-0.5">
                        <p className="font-serif font-semibold text-[#f4ebd0]">{g.name}</p>
                        <p className="text-[10px] font-mono text-[#f4ebd0]/50">
                          Requires {meta.name}
                        </p>
                      </div>

                      <div>
                        {unlocked ? (
                          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40">
                            Passable
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono text-zinc-500 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                            Barricaded
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
