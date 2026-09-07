import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Volume2,
  VolumeX,
  Sparkles,
  Swords,
  Scroll,
  MapPin,
  RotateCcw,
  Lock,
  Unlock,
  CheckCircle2,
  Music,
  Layers,
  Compass,
  Gamepad2,
  Flame,
  X,
  ArrowLeft,
} from 'lucide-react';
import { useSpectrum, PIGMENT_REGISTRY, Pigment, EnvironmentalBarrier } from './contexts/SpectrumContext';
import { useSaveGame } from './contexts/SaveGameContext';
import { useAudio, ProceduralSfxType } from './contexts/AudioContext';
import { PhaserOverworld } from './components/overworld/PhaserOverworld';
import { ArcadeTrialsView } from './components/games/ArcadeTrialsView';
import { CONTINENTAL_REGIONS } from './lib/engine/tilemapData';

export const App: React.FC = () => {
  const {
    unlockedPigments,
    chapter,
    chapterTitle,
    hasPigment,
    resetSpectrum,
    canTraverse,
  } = useSpectrum();

  const { saveData, resetGame } = useSaveGame();
  const { isMuted, toggleMute, playSfx } = useAudio();

  const [activeTab, setActiveTab] = useState<'overworld' | 'trials' | 'spectrum' | 'audio' | 'world'>('overworld');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  const handleSealClick = (_pigment: Pigment) => {
    playSfx('parchment');
  };

  const handleResetAll = () => {
    playSfx('click');
    if (window.confirm('Reset all Chromatic progress and save game data?')) {
      resetSpectrum();
      resetGame();
      playSfx('ink-splash');
    }
  };

  const soundFxButtons: { type: ProceduralSfxType; label: string; icon: string }[] = [
    { type: 'clash', label: 'Katana Clash', icon: '⚔️' },
    { type: 'heavy-strike', label: 'Heavy Strike', icon: '💥' },
    { type: 'parry', label: 'Deflection Parry', icon: '🛡️' },
    { type: 'ink-splash', label: 'Ink Splatter', icon: '🖋️' },
    { type: 'taiko', label: 'Taiko Drum', icon: '🥁' },
    { type: 'taiko-heavy', label: 'Great War Taiko', icon: '🏮' },
    { type: 'parchment', label: 'Scroll Rustle', icon: '📜' },
    { type: 'wind', label: 'Mountain Wind', icon: '🌬️' },
    { type: 'seal-stamp', label: 'Vermilion Stamp', icon: '💮' },
    { type: 'victory', label: 'Triumphant Chord', icon: '🎺' },
  ];

  const barriers: { id: EnvironmentalBarrier; name: string; pigment: Pigment; description: string }[] = [
    { id: 'ice-chasm', name: 'Frozen Waterfalls & Ice Chasms', pigment: 'frost-cyan', description: 'Solidifies into climbable ice bridges' },
    { id: 'ocean-mist', name: 'Supernatural Ocean Mist', pigment: 'abyssal-navy', description: 'Clears sea lanes for archipelago ferries' },
    { id: 'wind-gorge', name: 'Howling Canyon Updrafts', pigment: 'sky-cerulean', description: 'Unveils sky currents for aerial glides' },
    { id: 'gilded-gate', name: 'Gilded Speakeasy Inscriptions', pigment: 'molten-gold', description: 'Reveals secret underground parlor doors' },
    { id: 'vine-cliff', name: 'Ancient Root Ladders', pigment: 'emerald-jade', description: 'Sprouts living vertical cliff vines' },
    { id: 'river-rapids', name: 'Roaring Trident Rapids', pigment: 'rushing-teal', description: 'Reveals safe shallow river crossing sandbars' },
    { id: 'sandstorm-ruins', name: 'Red Waste Sandstorms', pigment: 'blood-vermilion', description: 'Calms dust storms covering ancient tombs' },
    { id: 'citadel-barrier', name: 'Primordial Rift Gate', pigment: 'full-spectrum', description: 'Breaks the Obsidian Citadel Ancient Seal' },
  ];

  return (
    <div className="min-h-[100dvh] h-[100dvh] w-screen bg-[#141414] text-[#f4ebd0] flex flex-col font-sans select-none overflow-hidden">
      {/* Top Header / Status Bar - Hidden on mobile during Overworld exploration for pure game immersion */}
      <header
        className={`${
          activeTab === 'overworld' ? 'hidden md:flex' : 'flex'
        } items-center justify-between px-4 sm:px-6 py-2.5 sm:py-3 border-b border-[#2a2a2a] bg-[#1a1a1a]/80 backdrop-blur-md z-30 shrink-0`}
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#b3312c] flex items-center justify-center font-bold text-white shadow-lg shadow-[#b3312c]/30 text-sm border border-[#f4ebd0]/30 font-serif">
            <Swords size={18} />
          </div>
          <div>
            <h1 className="font-serif tracking-widest text-lg md:text-xl font-bold text-[#f4ebd0] flex items-center gap-2">
              SHADOW REALM
              <span className="text-xs font-mono font-normal tracking-normal text-[#e0a96d] bg-[#b3312c]/30 px-2 py-0.5 rounded border border-[#b3312c]/50">
                PHASE 4: STRATEGY & PUZZLE TRIALS
              </span>
            </h1>
            <p className="text-xs text-[#f4ebd0]/60 tracking-wider">
              {chapterTitle} • Chapter {chapter}
            </p>
          </div>
        </div>

        {/* Global Action Controls */}
        <div className="flex items-center gap-2 md:gap-4">
          <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-[#f4ebd0]/70 bg-[#242424] px-3 py-1.5 rounded-md border border-[#333]">
            <MapPin size={13} className="text-[#0077b6]" />
            <span>{CONTINENTAL_REGIONS[saveData.playerCoords.currentRegion]?.name || saveData.playerCoords.currentRegion}</span>
          </div>

          <button
            onClick={() => {
              playSfx('click');
              toggleMute();
            }}
            className="p-2 rounded-lg bg-[#242424] hover:bg-[#333] transition border border-[#333] text-[#f4ebd0]/80 hover:text-white"
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {isMuted ? <VolumeX size={18} className="text-red-400" /> : <Volume2 size={18} />}
          </button>

          <button
            onClick={handleResetAll}
            className="p-2 rounded-lg bg-[#242424] hover:bg-red-950/40 hover:border-red-600/50 transition border border-[#333] text-[#f4ebd0]/80 hover:text-red-300"
            title="Reset All Progress"
          >
            <RotateCcw size={18} />
          </button>
        </div>
      </header>

      {/* Main Canvas / Content Deck */}
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Navigation Sidebar - Hidden on mobile during Overworld exploration */}
        <nav
          className={`${
            activeTab === 'overworld' ? 'hidden md:flex' : 'flex'
          } w-full md:w-64 bg-[#181818] border-b md:border-b-0 md:border-r border-[#2a2a2a] p-2 sm:p-3 flex md:flex-col gap-1.5 sm:gap-2 shrink-0 overflow-x-auto md:overflow-x-visible`}
        >
          <button
            onClick={() => {
              playSfx('click');
              setActiveTab('overworld');
            }}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition shrink-0 ${
              activeTab === 'overworld'
                ? 'bg-[#2a2a2a] text-[#f4ebd0] border-l-4 border-[#b3312c] shadow-md'
                : 'text-[#f4ebd0]/60 hover:bg-[#222] hover:text-[#f4ebd0]'
            }`}
          >
            <Gamepad2 size={18} className="text-[#b3312c]" />
            <span>Explore Overworld</span>
          </button>

          <button
            onClick={() => {
              playSfx('click');
              setActiveTab('trials');
            }}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition ${
              activeTab === 'trials'
                ? 'bg-[#2a2a2a] text-[#f4ebd0] border-l-4 border-[#e0a96d] shadow-md'
                : 'text-[#f4ebd0]/60 hover:bg-[#222] hover:text-[#f4ebd0]'
            }`}
          >
            <Flame size={18} className="text-[#e0a96d]" />
            <span>Action Trials</span>
          </button>

          <button
            onClick={() => {
              playSfx('click');
              setActiveTab('spectrum');
            }}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition ${
              activeTab === 'spectrum'
                ? 'bg-[#2a2a2a] text-[#f4ebd0] border-l-4 border-[#ffd166] shadow-md'
                : 'text-[#f4ebd0]/60 hover:bg-[#222] hover:text-[#f4ebd0]'
            }`}
          >
            <Sparkles size={18} className="text-[#ffd166]" />
            <span>7 Vermilion Seals</span>
          </button>

          <button
            onClick={() => {
              playSfx('click');
              setActiveTab('audio');
            }}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition ${
              activeTab === 'audio'
                ? 'bg-[#2a2a2a] text-[#f4ebd0] border-l-4 border-[#48cae4] shadow-md'
                : 'text-[#f4ebd0]/60 hover:bg-[#222] hover:text-[#f4ebd0]'
            }`}
          >
            <Music size={18} className="text-[#48cae4]" />
            <span>Sound Synthesizer</span>
          </button>

          <button
            onClick={() => {
              playSfx('click');
              setActiveTab('world');
            }}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition ${
              activeTab === 'world'
                ? 'bg-[#2a2a2a] text-[#f4ebd0] border-l-4 border-[#2d6a4f] shadow-md'
                : 'text-[#f4ebd0]/60 hover:bg-[#222] hover:text-[#f4ebd0]'
            }`}
          >
            <Compass size={18} className="text-[#2d6a4f]" />
            <span>Continental Perception</span>
          </button>

          <div className="hidden md:block mt-auto p-3 rounded-lg bg-[#202020] border border-[#2d2d2d] text-xs space-y-1 text-[#f4ebd0]/60">
            <div className="flex items-center gap-1.5 font-bold text-[#f4ebd0]">
              <Layers size={14} className="text-[#e0a96d]" />
              <span>Engine Status</span>
            </div>
            <p>Phaser 3 Canvas Engines</p>
            <p>Vite 6 + React 19</p>
            <p>Capacitor 7 + Tauri v2</p>
          </div>
        </nav>

        {/* Tab Viewport */}
        {activeTab === 'overworld' ? (
          <section className="flex-1 w-full h-full relative overflow-hidden bg-[#141414]">
            <PhaserOverworld onOpenMenu={() => setIsMobileMenuOpen(true)} />
          </section>
        ) : (
          <section className="flex-1 overflow-y-auto p-4 md:p-8 bg-[#141414] bg-sumi-texture">
            {/* Mobile Return to Overworld Action Header */}
            <div className="md:hidden flex items-center justify-between pb-3 mb-4 border-b border-[#2a2a2a]">
              <button
                onClick={() => {
                  playSfx('click');
                  setActiveTab('overworld');
                }}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-[#b3312c] hover:bg-[#c73832] text-white text-xs font-serif font-bold shadow-md active:scale-95 transition"
              >
                <ArrowLeft size={16} />
                <span>Return to Overworld</span>
              </button>
              <span className="text-xs font-mono text-[#e0a96d] uppercase">
                {activeTab}
              </span>
            </div>

            {activeTab === 'trials' && <ArcadeTrialsView />}

            {activeTab === 'spectrum' && (
              <div className="max-w-4xl mx-auto space-y-6">
                <div className="border border-[#333] rounded-xl p-5 bg-[#1b1b1b]/80 backdrop-blur-sm shadow-xl">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                    <div>
                      <h2 className="text-xl font-serif font-bold text-[#f4ebd0] flex items-center gap-2">
                        <Scroll size={20} className="text-[#b3312c]" />
                        The Great Scroll: 7 Vermilion Seals
                      </h2>
                      <p className="text-xs text-[#f4ebd0]/60 mt-0.5">
                        Defeat the regional Wardens in their sacred action trials to reclaim the stolen pigments.
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-mono px-2.5 py-1 rounded bg-[#242424] border border-[#333] text-[#e0a96d]">
                        Seals Reclaimed: {unlockedPigments.length} / 8
                      </span>
                    </div>
                  </div>

                  {/* 8 Seals Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {(Object.keys(PIGMENT_REGISTRY) as Pigment[]).map((key) => {
                      const item = PIGMENT_REGISTRY[key];
                      const unlocked = hasPigment(key);

                      return (
                        <div
                          key={key}
                          onClick={() => handleSealClick(key)}
                          className={`group relative p-4 rounded-xl border transition-all cursor-pointer select-none flex flex-col justify-between ${
                            unlocked
                              ? 'bg-[#1f1f1f] shadow-lg hover:scale-[1.02]'
                              : 'bg-[#171717] opacity-75 hover:opacity-100 hover:border-[#444]'
                          }`}
                          style={{
                            borderColor: unlocked ? item.colorHex : '#2d2d2d',
                            boxShadow: unlocked ? `0 0 20px ${item.colorHex}25` : 'none',
                          }}
                        >
                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <div
                                className="w-10 h-10 rounded-lg flex items-center justify-center font-serif text-xl font-bold shadow-md transition-transform group-hover:scale-110"
                                style={{
                                  backgroundColor: unlocked ? item.colorHex : '#282828',
                                  color: unlocked ? '#141414' : '#666',
                                }}
                              >
                                {item.sealKanji}
                              </div>
                              <span className="text-xs">
                                {unlocked ? (
                                  <span className="flex items-center gap-1 text-emerald-400 font-mono">
                                    <CheckCircle2 size={14} /> Unlocked
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1 text-[#666] font-mono">
                                    <Lock size={14} /> Sealed
                                  </span>
                                )}
                              </span>
                            </div>

                            <h3
                              className="font-serif font-bold text-base tracking-wide"
                              style={{ color: unlocked ? item.colorHex : '#f4ebd0' }}
                            >
                              {item.name}
                            </h3>
                            <p className="text-xs text-[#f4ebd0]/50 font-mono mt-0.5">{item.realm}</p>
                            <p className="text-xs text-[#f4ebd0]/40 italic mt-0.5">Warden: {item.warden}</p>
                          </div>

                          <div className="mt-4 pt-3 border-t border-[#262626]">
                            <p className="text-[11px] text-[#f4ebd0]/70 leading-relaxed">
                              {item.motto}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'audio' && (
              <div className="max-w-4xl mx-auto space-y-6">
                <div className="border border-[#333] rounded-xl p-5 bg-[#1b1b1b]/80 backdrop-blur-sm shadow-xl">
                  <div className="mb-6">
                    <h2 className="text-xl font-serif font-bold text-[#f4ebd0] flex items-center gap-2">
                      <Swords size={20} className="text-[#48cae4]" />
                      Procedural Sound Synthesizer
                    </h2>
                    <p className="text-xs text-[#f4ebd0]/60 mt-1">
                      Zero-latency procedural sound synthesizer using Web Audio oscillators and biquad filters. Works 100% offline.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    {soundFxButtons.map((btn) => (
                      <button
                        key={btn.type}
                        onClick={() => playSfx(btn.type)}
                        className="p-4 rounded-xl bg-[#222] hover:bg-[#2d2d2d] active:scale-95 border border-[#333] hover:border-[#48cae4]/50 transition flex flex-col items-center justify-center gap-2 group"
                      >
                        <span className="text-2xl group-hover:scale-125 transition-transform">
                          {btn.icon}
                        </span>
                        <span className="text-xs font-serif font-medium text-[#f4ebd0] group-hover:text-[#48cae4] transition-colors text-center">
                          {btn.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'world' && (
              <div className="max-w-4xl mx-auto space-y-6">
                <div className="border border-[#333] rounded-xl p-5 bg-[#1b1b1b]/80 backdrop-blur-sm shadow-xl">
                  <div className="mb-6">
                    <h2 className="text-xl font-serif font-bold text-[#f4ebd0] flex items-center gap-2">
                      <Compass size={20} className="text-[#2d6a4f]" />
                      Continental Perception & Color-Gate State
                    </h2>
                    <p className="text-xs text-[#f4ebd0]/60 mt-1">
                      Defeating Wardens in action trials grants perceptual abilities that turn impassable barriers into navigable pathways across previous kingdoms.
                    </p>
                  </div>

                  <div className="divide-y divide-[#262626]">
                    {barriers.map((b) => {
                      const accessible = canTraverse(b.id);
                      const color = PIGMENT_REGISTRY[b.pigment].colorHex;

                      return (
                        <div key={b.id} className="py-3.5 flex items-center justify-between gap-4">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="font-serif font-semibold text-sm text-[#f4ebd0]">
                                {b.name}
                              </span>
                              <span
                                className="text-[10px] font-mono px-2 py-0.5 rounded border"
                                style={{
                                  borderColor: `${color}40`,
                                  color: color,
                                  backgroundColor: `${color}15`,
                                }}
                              >
                                Requires {PIGMENT_REGISTRY[b.pigment].name}
                              </span>
                            </div>
                            <p className="text-xs text-[#f4ebd0]/60">{b.description}</p>
                          </div>

                          <div>
                            {accessible ? (
                              <span className="inline-flex items-center gap-1 text-xs font-mono text-emerald-400 bg-emerald-950/40 px-2.5 py-1 rounded border border-emerald-800/50">
                                <Unlock size={12} /> Navigable
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs font-mono text-zinc-500 bg-zinc-900 px-2.5 py-1 rounded border border-zinc-800">
                                <Lock size={12} /> Impassable
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </section>
        )}
      </main>

      {/* Mobile In-Game Pause / System Menu Modal */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 select-none"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-2xl bg-[#181818] border-2 border-[#b3312c]/60 shadow-2xl overflow-hidden text-[#f4ebd0]"
            >
              {/* Menu Header */}
              <div className="p-4 border-b border-[#2a2a2a] bg-[#202020] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#b3312c] flex items-center justify-center text-white font-bold shadow text-xs">
                    <Swords size={16} />
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-sm tracking-wider">SHADOW REALM</h3>
                    <p className="text-[10px] font-mono text-[#e0a96d]">SYSTEM & NAVIGATION MENU</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    playSfx('click');
                    setIsMobileMenuOpen(false);
                  }}
                  className="p-1.5 rounded-lg bg-[#2a2a2a] hover:bg-[#333] text-[#f4ebd0]/70 hover:text-white transition"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Menu Items */}
              <div className="p-4 space-y-2 max-h-[70vh] overflow-y-auto">
                <button
                  onClick={() => {
                    playSfx('click');
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-[#b3312c] text-white font-serif font-bold text-sm shadow-md active:scale-95 transition"
                >
                  <Gamepad2 size={18} />
                  <span>Resume Overworld</span>
                </button>

                <button
                  onClick={() => {
                    playSfx('click');
                    setActiveTab('trials');
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl bg-[#222] hover:bg-[#2a2a2a] border border-[#333] text-xs font-serif font-medium active:scale-95 transition"
                >
                  <Flame size={16} className="text-[#e0a96d]" />
                  <span>Action Trials (Minigames)</span>
                </button>

                <button
                  onClick={() => {
                    playSfx('click');
                    setActiveTab('spectrum');
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl bg-[#222] hover:bg-[#2a2a2a] border border-[#333] text-xs font-serif font-medium active:scale-95 transition"
                >
                  <Sparkles size={16} className="text-[#ffd166]" />
                  <span>7 Vermilion Seals ({unlockedPigments.length}/8)</span>
                </button>

                <button
                  onClick={() => {
                    playSfx('click');
                    setActiveTab('world');
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl bg-[#222] hover:bg-[#2a2a2a] border border-[#333] text-xs font-serif font-medium active:scale-95 transition"
                >
                  <Compass size={16} className="text-[#2d6a4f]" />
                  <span>Continental Perception & Barriers</span>
                </button>

                <button
                  onClick={() => {
                    playSfx('click');
                    setActiveTab('audio');
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl bg-[#222] hover:bg-[#2a2a2a] border border-[#333] text-xs font-serif font-medium active:scale-95 transition"
                >
                  <Music size={16} className="text-[#48cae4]" />
                  <span>Procedural Sound Synthesizer</span>
                </button>

                <div className="pt-2 border-t border-[#2a2a2a] flex items-center gap-2">
                  <button
                    onClick={() => {
                      playSfx('click');
                      toggleMute();
                    }}
                    className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-[#222] border border-[#333] text-xs font-mono text-[#f4ebd0]/80"
                  >
                    {isMuted ? <VolumeX size={15} className="text-red-400" /> : <Volume2 size={15} />}
                    <span>{isMuted ? 'Unmute SFX' : 'Mute SFX'}</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      handleResetAll();
                    }}
                    className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-red-950/40 border border-red-800/40 text-xs font-mono text-red-300"
                  >
                    <RotateCcw size={14} />
                    <span>Reset</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;
