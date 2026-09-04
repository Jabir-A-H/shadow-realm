import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Swords } from 'lucide-react';

interface VirtualJoystickProps {
  onMove: (vector: { x: number; y: number }) => void;
  onInteract: () => void;
  hasNearbyInteractable?: boolean;
}

export const VirtualJoystick: React.FC<VirtualJoystickProps> = ({
  onMove,
  onInteract,
  hasNearbyInteractable = false,
}) => {
  const joystickBaseRef = useRef<HTMLDivElement>(null);
  const [knobPos, setKnobPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isActive, setIsActive] = useState(false);
  const touchIdRef = useRef<number | null>(null);

  const radius = 45; // Max knob movement radius

  const handlePointerStart = (e: React.PointerEvent) => {
    if (touchIdRef.current !== null) return;
    touchIdRef.current = e.pointerId;
    setIsActive(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    handlePointerMove(e);
  };

  const handlePointerMove = useCallback(
    (e: React.PointerEvent | PointerEvent) => {
      if (!isActive || touchIdRef.current !== e.pointerId || !joystickBaseRef.current) return;

      const rect = joystickBaseRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      let dx = e.clientX - centerX;
      let dy = e.clientY - centerY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > radius) {
        dx = (dx / dist) * radius;
        dy = (dy / dist) * radius;
      }

      setKnobPos({ x: dx, y: dy });

      // Normalized vector
      const normX = dx / radius;
      const normY = dy / radius;
      onMove({ x: normX, y: normY });
    },
    [isActive, onMove, radius]
  );

  const handlePointerEnd = useCallback(
    (e: React.PointerEvent | PointerEvent) => {
      if (touchIdRef.current === e.pointerId) {
        touchIdRef.current = null;
        setIsActive(false);
        setKnobPos({ x: 0, y: 0 });
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
    <div className="absolute inset-x-4 bottom-4 pointer-events-none flex items-end justify-between z-20 select-none">
      {/* Left: Virtual Thumbstick */}
      <div
        ref={joystickBaseRef}
        onPointerDown={handlePointerStart}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        className={`w-32 h-32 rounded-full pointer-events-auto bg-[#1a1a1a]/70 backdrop-blur-md border border-[#3a3a3a] flex items-center justify-center relative touch-none shadow-2xl transition-opacity ${
          isActive ? 'opacity-90 border-[#e0a96d]' : 'opacity-60'
        }`}
      >
        {/* Directional ticks */}
        <div className="absolute top-1 w-1.5 h-1.5 rounded-full bg-[#f4ebd0]/30" />
        <div className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-[#f4ebd0]/30" />
        <div className="absolute left-1 w-1.5 h-1.5 rounded-full bg-[#f4ebd0]/30" />
        <div className="absolute right-1 w-1.5 h-1.5 rounded-full bg-[#f4ebd0]/30" />

        {/* Floating Knob */}
        <div
          className="w-12 h-12 rounded-full bg-[#2a2a2a] border-2 border-[#f4ebd0]/70 flex items-center justify-center shadow-lg shadow-black/60 pointer-events-none transition-transform"
          style={{
            transform: `translate(${knobPos.x}px, ${knobPos.y}px)`,
          }}
        >
          <div className="w-4 h-4 rounded-full bg-[#b3312c]" />
        </div>
      </div>

      {/* Right: Action / Talk Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onInteract();
        }}
        className={`w-18 h-18 rounded-full pointer-events-auto flex flex-col items-center justify-center gap-1 font-serif text-xs font-bold shadow-2xl transition-all active:scale-95 touch-none ${
          hasNearbyInteractable
            ? 'bg-[#b3312c] text-white border-2 border-[#f4ebd0] animate-bounce shadow-[#b3312c]/40'
            : 'bg-[#222]/80 text-[#f4ebd0]/70 border border-[#3a3a3a] backdrop-blur-md'
        }`}
      >
        <Swords size={20} />
        <span>TALK</span>
      </button>
    </div>
  );
};
