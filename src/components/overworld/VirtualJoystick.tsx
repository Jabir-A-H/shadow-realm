import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Swords, Scroll } from 'lucide-react';

interface VirtualJoystickProps {
  onMove: (vector: { x: number; y: number }) => void;
  onInteract: () => void;
  hasNearbyInteractable?: boolean;
  interactLabel?: string;
  interactType?: 'warden' | 'landmark' | null;
}

export const VirtualJoystick: React.FC<VirtualJoystickProps> = ({
  onMove,
  onInteract,
  hasNearbyInteractable = false,
  interactLabel,
  interactType,
}) => {
  const [isActive, setIsActive] = useState(false);
  const [knobPos, setKnobPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [dynamicCenter, setDynamicCenter] = useState<{ x: number; y: number } | null>(null);

  const touchIdRef = useRef<number | null>(null);
  const centerRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const radius = 50; // Max knob movement radius

  // Handle pointer down anywhere on the left touch zone (Flexible / Floating Joystick)
  const handleZonePointerDown = (e: React.PointerEvent) => {
    if (touchIdRef.current !== null) return;
    touchIdRef.current = e.pointerId;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    const x = e.clientX;
    const y = e.clientY;
    centerRef.current = { x, y };
    setDynamicCenter({ x, y });
    setIsActive(true);
    setKnobPos({ x: 0, y: 0 });
  };

  const handleZonePointerMove = useCallback(
    (e: React.PointerEvent | PointerEvent) => {
      if (!isActive || touchIdRef.current !== e.pointerId) return;

      const centerX = centerRef.current.x;
      const centerY = centerRef.current.y;

      let dx = e.clientX - centerX;
      let dy = e.clientY - centerY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > radius) {
        dx = (dx / dist) * radius;
        dy = (dy / dist) * radius;
      }

      setKnobPos({ x: dx, y: dy });

      // Normalized vector with deadzone
      let normX = dx / radius;
      let normY = dy / radius;
      if (Math.abs(normX) < 0.1) normX = 0;
      if (Math.abs(normY) < 0.1) normY = 0;

      onMove({ x: normX, y: normY });
    },
    [isActive, onMove, radius]
  );

  const handleZonePointerEnd = useCallback(
    (e: React.PointerEvent | PointerEvent) => {
      if (touchIdRef.current === e.pointerId) {
        touchIdRef.current = null;
        setIsActive(false);
        setKnobPos({ x: 0, y: 0 });
        setDynamicCenter(null);
        onMove({ x: 0, y: 0 });
      }
    },
    [onMove]
  );

  useEffect(() => {
    const onWindowPointerUp = (e: PointerEvent) => {
      if (touchIdRef.current === e.pointerId) {
        touchIdRef.current = null;
        setIsActive(false);
        setKnobPos({ x: 0, y: 0 });
        setDynamicCenter(null);
        onMove({ x: 0, y: 0 });
      }
    };

    window.addEventListener('pointerup', onWindowPointerUp);
    window.addEventListener('pointercancel', onWindowPointerUp);
    return () => {
      window.removeEventListener('pointerup', onWindowPointerUp);
      window.removeEventListener('pointercancel', onWindowPointerUp);
    };
  }, [onMove]);

  return (
    <>
      {/* 1. Full-Screen Left Touch Zone for Flexible Floating Joystick */}
      <div
        onPointerDown={handleZonePointerDown}
        onPointerMove={handleZonePointerMove}
        onPointerUp={handleZonePointerEnd}
        onPointerCancel={handleZonePointerEnd}
        className="fixed inset-y-0 left-0 w-3/5 z-20 pointer-events-auto touch-none select-none"
        style={{
          // Reserve the top HUD area (first 80px) so map/badge taps don't trigger joystick
          top: '75px',
        }}
      >
        {/* Floating Thumbstick (Spawns under thumb when dragging) */}
        {isActive && dynamicCenter && (
          <div
            className="fixed w-32 h-32 -ml-16 -mt-16 rounded-full bg-[#141414]/80 backdrop-blur-md border-2 border-[#e0a96d] flex items-center justify-center pointer-events-none shadow-2xl shadow-black/80 z-30 transition-opacity"
            style={{
              left: `${dynamicCenter.x}px`,
              top: `${dynamicCenter.y}px`,
            }}
          >
            {/* Directional compass crosshair ticks */}
            <div className="absolute top-1.5 w-1.5 h-1.5 rounded-full bg-[#e0a96d]" />
            <div className="absolute bottom-1.5 w-1.5 h-1.5 rounded-full bg-[#e0a96d]" />
            <div className="absolute left-1.5 w-1.5 h-1.5 rounded-full bg-[#e0a96d]" />
            <div className="absolute right-1.5 w-1.5 h-1.5 rounded-full bg-[#e0a96d]" />

            {/* Moving Knob */}
            <div
              className="w-14 h-14 rounded-full bg-[#2a2a2a] border-2 border-[#f4ebd0] flex items-center justify-center shadow-lg shadow-black/80 pointer-events-none"
              style={{
                transform: `translate(${knobPos.x}px, ${knobPos.y}px)`,
              }}
            >
              <div className="w-5 h-5 rounded-full bg-[#b3312c] shadow-inner" />
            </div>
          </div>
        )}

        {/* Resting / Idle Joystick Anchor (Visible when idle, positioned safely above browser toolbars) */}
        {!isActive && (
          <div
            className="absolute left-6 pointer-events-none transition-opacity duration-300 flex flex-col items-center gap-1.5 opacity-55"
            style={{
              bottom: 'max(4.5rem, calc(env(safe-area-inset-bottom, 0px) + 3.75rem))',
            }}
          >
            <div className="w-28 h-28 rounded-full bg-[#1a1a1a]/60 backdrop-blur-md border border-[#444] flex items-center justify-center shadow-xl">
              <div className="w-10 h-10 rounded-full bg-[#242424] border border-[#f4ebd0]/40 flex items-center justify-center shadow">
                <div className="w-3.5 h-3.5 rounded-full bg-[#b3312c]/80" />
              </div>
            </div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#f4ebd0]/40">
              Touch to Move
            </span>
          </div>
        )}
      </div>

      {/* 2. Elevated Right-Hand Action / Interact Button (Safely above browser toolbars) */}
      <div
        className="fixed right-6 z-30 pointer-events-auto select-none"
        style={{
          bottom: 'max(4.5rem, calc(env(safe-area-inset-bottom, 0px) + 3.75rem))',
        }}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            onInteract();
          }}
          className={`w-20 h-20 rounded-full flex flex-col items-center justify-center gap-1 shadow-2xl transition-all active:scale-90 touch-none ${
            hasNearbyInteractable
              ? 'bg-gradient-to-br from-[#b3312c] to-[#e63946] text-white border-2 border-[#f4ebd0] shadow-[#b3312c]/60 ring-4 ring-[#b3312c]/40 animate-pulse'
              : 'bg-[#1e1e1e]/85 text-[#f4ebd0]/60 border border-[#3a3a3a] backdrop-blur-md hover:text-[#f4ebd0]'
          }`}
          title={hasNearbyInteractable ? 'Interact / Enter' : 'Action'}
        >
          {interactType === 'landmark' ? (
            <Scroll size={24} className={hasNearbyInteractable ? 'text-[#ffd166]' : ''} />
          ) : (
            <Swords size={24} className={hasNearbyInteractable ? 'text-white' : ''} />
          )}

          <span className="font-serif text-[11px] font-bold tracking-wider uppercase">
            {interactLabel || (hasNearbyInteractable ? (interactType === 'landmark' ? 'ENTER' : 'TALK') : 'ACTION')}
          </span>
        </button>
      </div>
    </>
  );
};
