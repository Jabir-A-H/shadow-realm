import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Swords, Scroll, X, Sparkles, CheckCircle2, Lock, Gamepad2 } from 'lucide-react';
import { CONTINENTAL_REGIONS } from '../../lib/engine/tilemapData';
import { PIGMENT_REGISTRY, Pigment } from '../../contexts/SpectrumContext';
import { useAudio } from '../../contexts/AudioContext';
import { useSaveGame } from '../../contexts/SaveGameContext';
import { PuzzleGameId, PUZZLE_GAMES_METADATA } from '../../lib/games/puzzleGameTypes';

interface DialogueOverlayProps {
  regionId: string;
  isOpen: boolean;
  onClose: () => void;
  onChallenge: (pigment: Pigment) => void;
  onLaunchPuzzle?: (gameId: PuzzleGameId) => void;
  isUnlocked: boolean;
}

const WARDEN_LORE_BANTER: Record<string, { intro: string; guidance: string; challenged: string }> = {
  'frozen-reach': {
    intro: 'You dare approach the Wall with warmth in your veins, silhouette? Here in the Frozen Reach, only the cold cuts deeper than my blade.',
    guidance: 'The Frost Cyan pigment freezes the continental rapids. Without it, you shall drown in the ice chasms of the North.',
    challenged: 'Draw your blade! First to three clean unblocked strikes claims the Frost Crown!',
  },
  'drowned-isles': {
    intro: 'What is sunk in the abyssal deep may never float again. The tides obey only the Lord of the Kraken.',
    guidance: 'Our Abyssal Navy pigment clears the impenetrable mist covering the archipelago sea routes.',
    challenged: 'Position your fleet, intruder! The stormy waves shall claim your vessel!',
  },
  'river-crossings': {
    intro: 'I am the Phantom Courier. I crossed the Trident before you even drew breath. Speed and reflex are my only gods.',
    guidance: 'Rushing Teal reveals the hidden stepping stones across the river forks. Hesitate, and the current devours you.',
    challenged: 'Quick draw! One blink, one hesitation, and my courier blade strikes true!',
  },
  'high-vale': {
    intro: 'Look down from the Eyrie, ground-crawler. The sky belongs only to those who can read the mountain gales.',
    guidance: 'Sky Cerulean unlocks floating wind streams. With it, you can leap across canyon chasms without falling into the abyss.',
    challenged: 'Nock your arrow! The gale winds are howling, and the targets will not wait!',
  },
  'gilded-vault': {
    intro: 'Gold buys power, and power sets the rules in the Gilded Den. Do you come with a heavy purse or empty hands?',
    guidance: 'Molten Gold illuminates the hidden speakeasy runes. It opens doors that brute force cannot shatter.',
    challenged: 'Take a seat at the table. Stack your cards, play no mercy, and let us see who bankrupts whom!',
  },
  'verdant-reach': {
    intro: 'You walk among my thorny gardens, wanderer. Every blossom hides a barb; every seed waits for the spark to explode.',
    guidance: 'Emerald Jade awakens the dormant climbing vines along sheer cliffs, opening vertical pathways to ancient heights.',
    challenged: 'Plant your seeds and prepare for the bloom. One spark will trigger an unstoppable chain reaction!',
  },
  'scorched-dunes': {
    intro: 'The red sands care nothing for your titles. Under the scorching sun, only the unbowed and unbent survive.',
    guidance: 'Blood Vermilion calms the blinding dust devils of the badlands, revealing buried ruins and lost tombs.',
    challenged: 'Step into the arena! The Red Viper does not yield!',
  },
  'obsidian-citadel': {
    intro: 'You stand before the Obsidian Citadel, where the Great Scroll was first shattered. Here, all colors converge into eternal ink.',
    guidance: 'The Full Spectrum Prism restores the world to living harmony and dissolves the primordial rift gate.',
    challenged: 'Solve the ancient logic scrolls, stamp the ultimate seal, and rebuild the Parchment Continent!',
  },
};

export const DialogueOverlay: React.FC<DialogueOverlayProps> = ({
  regionId,
  isOpen,
  onClose,
  onChallenge,
  onLaunchPuzzle,
  isUnlocked,
}) => {
  const { playSfx } = useAudio();
  const { saveData } = useSaveGame();
  const [dialogueState, setDialogueState] = useState<'intro' | 'guidance' | 'challenge'>('intro');

  const region = CONTINENTAL_REGIONS[regionId] || CONTINENTAL_REGIONS['river-crossings'];
  const pigment = region.pigment;
  const pigmentData = PIGMENT_REGISTRY[pigment];
  const banter = WARDEN_LORE_BANTER[regionId] || WARDEN_LORE_BANTER['river-crossings'];

  // Gatekeeper gauntlet checks
  const gatekeeperLandmark = region.landmarks?.find((l) => l.gatekeeperForWarden);
  const isGatekeeperCleared = gatekeeperLandmark
    ? (saveData.minigames[gatekeeperLandmark.gameId]?.gamesWon ?? 0) > 0
    : true;
  const gatekeeperMeta = gatekeeperLandmark ? PUZZLE_GAMES_METADATA[gatekeeperLandmark.gameId] : null;

  const strategyLandmark = region.landmarks?.[0];
  const strategyMeta = strategyLandmark ? PUZZLE_GAMES_METADATA[strategyLandmark.gameId] : null;

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        playSfx('click');
        onClose();
      } else if (e.key === 'Enter' || e.key === 'e' || e.key === 'E') {
        e.preventDefault();
        if (isGatekeeperCleared) {
          playSfx('clash');
          setDialogueState('challenge');
          onChallenge(pigment);
        } else if (gatekeeperLandmark && onLaunchPuzzle) {
          playSfx('parchment');
          onLaunchPuzzle(gatekeeperLandmark.gameId);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, pigment, onChallenge, onClose, playSfx, isGatekeeperCleared, gatekeeperLandmark, onLaunchPuzzle]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md select-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="relative w-full max-w-2xl bg-[#181818] border-2 rounded-2xl p-6 md:p-8 shadow-2xl shadow-black overflow-hidden flex flex-col md:flex-row gap-6"
          style={{ borderColor: pigmentData.colorHex }}
        >
          {/* Background ink wash watermark */}
          <div
            className="absolute -right-16 -bottom-16 w-64 h-64 rounded-full blur-3xl opacity-15 pointer-events-none"
            style={{ backgroundColor: pigmentData.colorHex }}
          />

          {/* Close Button */}
          <button
            onClick={() => {
              playSfx('click');
              onClose();
            }}
            className="absolute top-4 right-4 p-2 rounded-full bg-[#242424] hover:bg-[#333] border border-[#3a3a3a] text-[#f4ebd0] transition"
          >
            <X size={18} />
          </button>

          {/* Left Column: Silhouette Portrait & Seal Rune */}
          <div className="flex flex-col items-center justify-center shrink-0 md:w-48 text-center space-y-3">
            <div
              className="relative w-32 h-40 rounded-xl bg-[#121212] border-2 flex items-center justify-center overflow-hidden shadow-inner"
              style={{ borderColor: `${pigmentData.colorHex}60` }}
            >
              {/* Silhouette Figure */}
              <div className="w-20 h-28 bg-[#0a0a0a] rounded-t-full relative flex flex-col items-center justify-center shadow-2xl">
                {/* Glowing Eyes */}
                <div
                  className="w-1.5 h-0.5 rounded-full shadow-lg mt-6"
                  style={{
                    backgroundColor: pigmentData.colorHex,
                    boxShadow: `0 0 8px ${pigmentData.colorHex}`,
                  }}
                />
              </div>

              {/* Continental Seal Rune Badge */}
              <div
                className="absolute bottom-2 right-2 w-9 h-9 rounded-lg flex items-center justify-center font-serif text-lg font-bold shadow-lg"
                style={{
                  backgroundColor: pigmentData.colorHex,
                  color: '#141414',
                }}
              >
                {pigmentData.sealKanji}
              </div>
            </div>

            <div>
              <h3 className="font-serif font-bold text-base text-[#f4ebd0]">
                {pigmentData.warden}
              </h3>
              <p
                className="text-xs font-serif font-medium"
                style={{ color: pigmentData.colorHex }}
              >
                {pigmentData.title}
              </p>
              <p className="text-[11px] text-[#f4ebd0]/50 font-mono mt-0.5">
                {region.name}
              </p>
            </div>
          </div>

          {/* Right Column: Dialogue Text & Choices */}
          <div className="flex-1 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span
                  className="text-[10px] font-mono uppercase px-2.5 py-0.5 rounded border"
                  style={{
                    borderColor: `${pigmentData.colorHex}50`,
                    color: pigmentData.colorHex,
                    backgroundColor: `${pigmentData.colorHex}15`,
                  }}
                >
                  {region.gotEquivalent}
                </span>

                {isUnlocked && (
                  <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 size={12} /> Seal Stamped
                  </span>
                )}
              </div>

              {/* Dialogue Box */}
              <div className="min-h-[90px] p-4 rounded-xl bg-[#121212] border border-[#2d2d2d] relative">
                <p className="font-serif text-sm md:text-base text-[#f4ebd0] leading-relaxed italic">
                  "{dialogueState === 'intro' && banter.intro}
                  {dialogueState === 'guidance' && banter.guidance}
                  {dialogueState === 'challenge' && banter.challenged}"
                </p>

                <p className="text-[11px] text-[#f4ebd0]/40 font-mono text-right mt-2">
                  — "{pigmentData.motto}"
                </p>
              </div>

              {/* Perceptive Ability Info */}
              <div className="mt-3 p-2.5 rounded-lg bg-[#202020]/60 border border-[#2d2d2d] flex items-center gap-2 text-xs text-[#f4ebd0]/70">
                <Sparkles size={14} style={{ color: pigmentData.colorHex }} className="shrink-0" />
                <span>
                  <strong>Pigment Effect:</strong> {pigmentData.perceptiveAbility}
                </span>
              </div>

              {/* Gatekeeper Barrier Notice */}
              {gatekeeperLandmark && !isGatekeeperCleared && (
                <div className="mt-3 p-3 rounded-xl bg-[#2b1717] border border-[#b3312c]/70 flex items-start gap-2.5 text-xs text-[#f4ebd0]">
                  <Lock size={16} className="text-[#b3312c] shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-[#e0a96d]">Sanctum Gatekeeper Barrier:</strong>
                    <p className="text-[11px] text-[#f4ebd0]/80 mt-0.5">
                      The Warden will not draw their blade until you conquer the{' '}
                      <strong className="text-white">{gatekeeperLandmark.name}</strong> ({gatekeeperMeta?.title}).
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-2 border-t border-[#262626]">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {gatekeeperLandmark && !isGatekeeperCleared ? (
                  <>
                    <button
                      onClick={() => {
                        playSfx('parchment');
                        onLaunchPuzzle?.(gatekeeperLandmark.gameId);
                      }}
                      className="px-4 py-2.5 rounded-xl font-serif text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg bg-[#b3312c] hover:bg-[#c93b35] text-white"
                    >
                      <Gamepad2 size={16} />
                      <span>Conquer Gate: {gatekeeperLandmark.name}</span>
                    </button>

                    <button
                      disabled={true}
                      className="px-4 py-2.5 rounded-xl font-serif text-xs font-medium opacity-50 cursor-not-allowed bg-[#222] border border-[#333] text-[#888] flex items-center justify-center gap-2"
                      title="Clear the Gatekeeper Trial first"
                    >
                      <Lock size={14} />
                      <span>Martial Duel Locked</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        playSfx('clash');
                        setDialogueState('challenge');
                        onChallenge(pigment);
                      }}
                      className="px-4 py-2.5 rounded-xl font-serif text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg"
                      style={{
                        backgroundColor: pigmentData.colorHex,
                        color: '#141414',
                      }}
                    >
                      <Swords size={16} />
                      <span>{isUnlocked ? 'Re-Challenge Warden' : 'Challenge to Sacred Trial'}</span>
                    </button>

                    {strategyLandmark && onLaunchPuzzle ? (
                      <button
                        onClick={() => {
                          playSfx('parchment');
                          onLaunchPuzzle(strategyLandmark.gameId);
                        }}
                        className="px-4 py-2.5 rounded-xl bg-[#252525] hover:bg-[#303030] text-[#f4ebd0] border border-[#3a3a3a] font-serif text-xs font-medium transition flex items-center justify-center gap-2"
                      >
                        <Gamepad2 size={16} style={{ color: pigmentData.colorHex }} />
                        <span>Play {strategyMeta?.title || strategyLandmark.name}</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          playSfx('parchment');
                          setDialogueState('guidance');
                        }}
                        className="px-4 py-2.5 rounded-xl bg-[#252525] hover:bg-[#303030] text-[#f4ebd0] border border-[#3a3a3a] font-serif text-xs font-medium transition flex items-center justify-center gap-2"
                      >
                        <Scroll size={16} className="text-[#e0a96d]" />
                        <span>Inquire on Pigment</span>
                      </button>
                    )}
                  </>
                )}
              </div>

              <div className="flex items-center justify-between pt-1">
                <button
                  onClick={() => {
                    playSfx('parchment');
                    setDialogueState('guidance');
                  }}
                  className="text-xs font-mono text-[#e0a96d]/80 hover:text-[#e0a96d] transition flex items-center gap-1.5"
                >
                  <Scroll size={13} />
                  <span>Lore & Pigment Insight</span>
                </button>

                <button
                  onClick={() => {
                    playSfx('click');
                    onClose();
                  }}
                  className="text-xs font-mono text-[#f4ebd0]/50 hover:text-[#f4ebd0] transition text-right"
                >
                  Take Leave (Return to Overworld)
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
