import React, { useState } from 'react';
import {
  X,
  Volume2,
  VolumeX,
  Target,
  Wind,
} from 'lucide-react';
import { useAudio } from '../../../contexts/AudioContext';
import { useSpectrum } from '../../../contexts/SpectrumContext';
import { useSaveGame } from '../../../contexts/SaveGameContext';
import { useRafLoop } from '../../../lib/games/useRafLoop';
import confetti from 'canvas-confetti';

const GAME_SIZE = 1000;
const CENTER = GAME_SIZE / 2;
const MAX_HOLD_MS = 4000;
const ARROWS_PER_SET = 3;
const SETS_TO_WIN = 3;

const RINGS = [
  { r: 400, score: 1, color: '#e5e7eb' },
  { r: 360, score: 2, color: '#e5e7eb' },
  { r: 320, score: 3, color: '#262626' },
  { r: 280, score: 4, color: '#262626' },
  { r: 240, score: 5, color: '#0284c7' },
  { r: 200, score: 6, color: '#0284c7' },
  { r: 160, score: 7, color: '#dc2626' },
  { r: 120, score: 8, color: '#dc2626' },
  { r: 80, score: 9, color: '#eab308' },
  { r: 40, score: 10, color: '#eab308' },
  { r: 20, score: 10, isX: true, color: '#eab308' },
];

const getScoreForCoordinate = (x: number, y: number): { score: number; isX: boolean; dist: number } => {
  const dist = Math.hypot(x - CENTER, y - CENTER);
  for (let i = RINGS.length - 1; i >= 0; i--) {
    if (dist <= RINGS[i].r) {
      return { score: RINGS[i].score, isX: Boolean(RINGS[i].isX), dist };
    }
  }
  return { score: 0, isX: false, dist };
};

interface ArcheryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVictory?: () => void;
}

export const ArcheryModal: React.FC<ArcheryModalProps> = ({
  isOpen,
  onClose,
  onVictory,
}) => {
  const { isMuted, toggleMute, playSfx } = useAudio();
  const { unlockPigment, hasPigment } = useSpectrum();
  const { stampSeal, recordGameResult } = useSaveGame();

  // Archery Physics State
  const [aimX, setAimX] = useState<number>(CENTER);
  const [aimY, setAimY] = useState<number>(CENTER + 150);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [drawStartTime, setDrawStartTime] = useState<number>(0);
  const [holdProgress, setHoldProgress] = useState<number>(0);

  // Wind state
  const [windSpeed, setWindSpeed] = useState<number>(() => Math.random() * 8 - 4);
  const [windAngle] = useState<number>(() => Math.random() * 360);

  // Match / Set Scoring State
  const [currentSetShots, setCurrentSetShots] = useState<Array<{ x: number; y: number; score: number }>>([]);
  const [playerSetPoints, setPlayerSetPoints] = useState<number>(0);
  const [cpuSetPoints, setCpuSetPoints] = useState<number>(0);
  const [totalPlayerScore, setTotalPlayerScore] = useState<number>(0);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [matchWinner, setMatchWinner] = useState<'player' | 'cpu' | null>(null);

  // Arrow flight animation
  const [flyingArrow, setFlyingArrow] = useState<{ x: number; y: number } | null>(null);

  // Aim drift physics in RAF loop
  useRafLoop((deltaMs) => {
    if (!isDrawing || isGameOver) return;

    const elapsed = Date.now() - drawStartTime;
    const progress = Math.min(1, elapsed / MAX_HOLD_MS);
    setHoldProgress(progress);

    // Dynamic hand tremor drift
    const tremor = Math.sin(elapsed / 120) * (2 + progress * 8);
    const windDriftX = (Math.cos((windAngle * Math.PI) / 180) * windSpeed * deltaMs) / 15;
    const windDriftY = (Math.sin((windAngle * Math.PI) / 180) * windSpeed * deltaMs) / 15;

    setAimX((x) => Math.max(100, Math.min(900, x + windDriftX + tremor * 0.2)));
    setAimY((y) => Math.max(100, Math.min(900, y + windDriftY + Math.cos(elapsed / 150) * 0.8)));
  }, isDrawing && !isGameOver);

  const startDraw = (clientX: number, clientY: number, rect: DOMRect) => {
    if (isGameOver || flyingArrow) return;
    const svgX = ((clientX - rect.left) / rect.width) * GAME_SIZE;
    const svgY = ((clientY - rect.top) / rect.height) * GAME_SIZE;

    setAimX(svgX);
    setAimY(svgY);
    setIsDrawing(true);
    setDrawStartTime(Date.now());
    playSfx('wind');
  };

  const releaseArrow = () => {
    if (!isDrawing || isGameOver) return;
    setIsDrawing(false);

    const jitter = (holdProgress > 0.8 ? (holdProgress - 0.8) * 60 : 0) * (Math.random() - 0.5);
    const finalX = aimX + jitter;
    const finalY = aimY + jitter;

    const shotResult = getScoreForCoordinate(finalX, finalY);

    setFlyingArrow({ x: finalX, y: finalY });
    playSfx('whiff');

    setTimeout(() => {
      setFlyingArrow(null);
      playSfx('clash');

      const updatedShots = [...currentSetShots, { x: finalX, y: finalY, score: shotResult.score }];
      setCurrentSetShots(updatedShots);
      setTotalPlayerScore((s) => s + shotResult.score);

      if (updatedShots.length >= ARROWS_PER_SET) {
        resolveSet(updatedShots);
      } else {
        setWindSpeed((w) => Math.max(-5, Math.min(5, w + (Math.random() * 2 - 1))));
      }
    }, 280);
  };

  const resolveSet = (playerShots: Array<{ score: number }>) => {
    const playerSum = playerShots.reduce((a, b) => a + b.score, 0);
    const cpuSum = Math.floor(22 + Math.random() * 6);

    let nextPlayerSet = playerSetPoints;
    let nextCpuSet = cpuSetPoints;

    if (playerSum > cpuSum) {
      nextPlayerSet += 2;
      playSfx('victory');
    } else if (playerSum === cpuSum) {
      nextPlayerSet += 1;
      nextCpuSet += 1;
      playSfx('click');
    } else {
      nextCpuSet += 2;
      playSfx('heavy-strike');
    }

    setPlayerSetPoints(nextPlayerSet);
    setCpuSetPoints(nextCpuSet);
    setCurrentSetShots([]);

    if (nextPlayerSet >= SETS_TO_WIN || nextCpuSet >= SETS_TO_WIN) {
      setIsGameOver(true);
      const won = nextPlayerSet > nextCpuSet;
      setMatchWinner(won ? 'player' : 'cpu');

      if (won) {
        playSfx('victory');
        playSfx('seal-stamp');
        confetti({ particleCount: 70, spread: 80, origin: { y: 0.6 } });

        recordGameResult('archery', true, totalPlayerScore);
        if (!hasPigment('sky-cerulean')) {
          unlockPigment('sky-cerulean');
          stampSeal('sky-cerulean', totalPlayerScore);
        }
        onVictory?.();
      }
    }
  };

  const resetMatch = () => {
    setCurrentSetShots([]);
    setPlayerSetPoints(0);
    setCpuSetPoints(0);
    setTotalPlayerScore(0);
    setIsGameOver(false);
    setMatchWinner(null);
    setAimX(CENTER);
    setAimY(CENTER + 150);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/90 backdrop-blur-md select-none overflow-hidden font-sans">
      <div className="relative w-full h-full max-w-4xl max-h-[92vh] bg-[#141414] border-2 border-[#90e0ef] rounded-2xl flex flex-col shadow-2xl shadow-[#90e0ef]/15 overflow-hidden text-[#f4ebd0]">
        {/* Header */}
        <header className="flex items-center justify-between px-4 py-3 bg-[#181d24] border-b border-[#28323f] shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                playSfx('click');
                onClose();
              }}
              className="p-1.5 rounded-lg bg-[#202732] hover:bg-[#2a3443] border border-[#334255] text-[#f4ebd0]/70 hover:text-white transition flex items-center gap-1 text-xs font-mono"
            >
              <X size={16} />
              <span className="hidden sm:inline">Exit</span>
            </button>
            <div>
              <div className="flex items-center gap-2">
                <Target size={18} className="text-[#90e0ef]" />
                <h2 className="font-serif font-bold text-sm sm:text-base text-[#f4ebd0]">
                  Yoichi's Peak Archery
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-[#90e0ef]/40 text-[#90e0ef] bg-[#90e0ef]/10">
                  The High Vale
                </span>
              </div>
              <p className="text-[11px] text-[#f4ebd0]/50 font-mono">
                Olympic Recurve Target Range • First to {SETS_TO_WIN} Set Points
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleMute}
              className="p-2 rounded-lg bg-[#202732] hover:bg-[#2a3443] border border-[#334255] text-[#f4ebd0]/70 hover:text-white transition"
            >
              {isMuted ? <VolumeX size={16} className="text-red-400" /> : <Volume2 size={16} />}
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Main Target Canvas */}
          <div className="flex-1 flex flex-col items-center justify-center p-4 bg-[#0f141a] overflow-auto">
            {/* Wind Indicator & Set Bar */}
            <div className="flex items-center justify-between w-full max-w-md mb-3 px-2">
              <div className="flex items-center gap-2 text-xs font-mono bg-[#18202a] px-3 py-1.5 rounded-lg border border-[#283546]">
                <Wind size={15} className="text-[#90e0ef]" />
                <span>
                  Wind: {Math.abs(windSpeed).toFixed(1)} m/s {windSpeed > 0 ? '▶ East' : '◀ West'}
                </span>
              </div>

              <div className="flex items-center gap-3 text-xs font-mono">
                <span className="text-[#90e0ef] font-bold">You: {playerSetPoints} pts</span>
                <span className="text-[#f4ebd0]/50">vs</span>
                <span className="text-red-400 font-bold">CPU: {cpuSetPoints} pts</span>
              </div>
            </div>

            {/* Target SVG */}
            <div
              className="relative w-[340px] h-[340px] rounded-full border-4 border-[#24303f] shadow-2xl shadow-[#90e0ef]/10 cursor-crosshair overflow-hidden touch-none"
              onPointerDown={(e) => startDraw(e.clientX, e.clientY, e.currentTarget.getBoundingClientRect())}
              onPointerUp={releaseArrow}
              onPointerLeave={releaseArrow}
            >
              <svg viewBox={`0 0 ${GAME_SIZE} ${GAME_SIZE}`} className="w-full h-full">
                {RINGS.map((ring, idx) => (
                  <circle
                    key={idx}
                    cx={CENTER}
                    cy={CENTER}
                    r={ring.r}
                    fill={ring.color}
                    stroke="#1a1a1a"
                    strokeWidth="1.5"
                  />
                ))}

                {isDrawing && (
                  <g transform={`translate(${aimX}, ${aimY})`}>
                    <circle r="14" fill="none" stroke="#90e0ef" strokeWidth="3" />
                    <line x1="-22" y1="0" x2="22" y2="0" stroke="#90e0ef" strokeWidth="2" />
                    <line x1="0" y1="-22" x2="0" y2="22" stroke="#90e0ef" strokeWidth="2" />
                  </g>
                )}

                {currentSetShots.map((shot, idx) => (
                  <g key={idx} transform={`translate(${shot.x}, ${shot.y})`}>
                    <circle r="6" fill="#141414" stroke="#f4ebd0" strokeWidth="2" />
                    <text
                      y="3"
                      textAnchor="middle"
                      fill="#f4ebd0"
                      fontSize="9"
                      fontWeight="bold"
                    >
                      {shot.score}
                    </text>
                  </g>
                ))}

                {flyingArrow && (
                  <circle
                    cx={flyingArrow.x}
                    cy={flyingArrow.y}
                    r="8"
                    fill="#90e0ef"
                    className="animate-ping"
                  />
                )}
              </svg>
            </div>

            {/* Hold Breath Meter */}
            <div className="w-full max-w-xs mt-4 space-y-1">
              <div className="flex justify-between text-[11px] font-mono text-[#f4ebd0]/60">
                <span>Hold Stability</span>
                <span className={holdProgress > 0.8 ? 'text-red-400 font-bold' : 'text-[#90e0ef]'}>
                  {holdProgress > 0.8 ? 'Tremor Warning!' : `${Math.round(holdProgress * 100)}%`}
                </span>
              </div>
              <div className="h-1.5 w-full bg-[#1e2632] rounded-full overflow-hidden border border-[#303e50]">
                <div
                  className={`h-full transition-all ${
                    holdProgress > 0.8 ? 'bg-red-500' : 'bg-[#90e0ef]'
                  }`}
                  style={{ width: `${holdProgress * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Right Info Drawer */}
          <div className="w-full md:w-72 bg-[#141a22] border-t md:border-t-0 md:border-l border-[#24303f] p-4 flex flex-col justify-between">
            <div className="space-y-3">
              <h3 className="font-serif font-bold text-xs uppercase tracking-wider text-[#90e0ef]">
                High Vale Archery Laws
              </h3>
              <p className="text-xs text-[#f4ebd0]/70 leading-relaxed">
                Click & hold to draw your recurve bow. The howling wind of the Eyrie will pull your aim. Hold steady, release before your breath expires, and strike the 10-ring.
              </p>

              <div className="space-y-1.5 pt-2 border-t border-[#24303f] text-xs font-mono text-[#f4ebd0]/60">
                <div className="flex justify-between">
                  <span>Arrows in Set:</span>
                  <span className="text-[#f4ebd0]">
                    {currentSetShots.length}/{ARROWS_PER_SET}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Match Total:</span>
                  <span className="text-[#90e0ef] font-bold">{totalPlayerScore} pts</span>
                </div>
              </div>
            </div>

            {isGameOver && (
              <div
                className={`p-3 rounded-xl text-center space-y-2 border ${
                  matchWinner === 'player'
                    ? 'bg-[#90e0ef]/20 border-[#90e0ef]'
                    : 'bg-red-950/40 border-red-700/60'
                }`}
              >
                <div className="text-xs font-serif font-bold text-[#f4ebd0]">
                  {matchWinner === 'player' ? 'Tournament Victory!' : 'Defeated in the Finals'}
                </div>
                <p className="text-[11px] text-[#f4ebd0]/70">
                  {matchWinner === 'player'
                    ? 'Sky currents revealed. Gliding updrafts unlocked across canyon gorges!'
                    : 'The mountain wind bested your aim. Steady your hands and try again.'}
                </p>
                <button
                  onClick={resetMatch}
                  className="w-full py-1.5 rounded-lg bg-[#90e0ef] text-black font-bold text-xs hover:bg-[#b0f0ff] transition"
                >
                  Shoot Again
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
