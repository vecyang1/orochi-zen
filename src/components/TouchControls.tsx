import React, { useRef, useState, useEffect, useCallback } from 'react';
import { ControlMode } from '../engine/types';

interface TouchControlsProps {
  onSteer: (rad: number) => void;
  isDark: boolean;
  controlMode?: ControlMode;
}

export const TouchControls: React.FC<TouchControlsProps> = ({ onSteer, isDark, controlMode = 'cardinal' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  const [knobPos, setKnobPos] = useState({ x: 0, y: 0 });
  const touchIdRef = useRef<number | null>(null);
  const centerRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const handleTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation();
    if (touchIdRef.current !== null) return;
    const touch = e.changedTouches[0];
    touchIdRef.current = touch.identifier;

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    centerRef.current = { x: centerX, y: centerY };

    updateKnob(touch.clientX, touch.clientY);
    setActive(true);
  };

  const updateKnob = useCallback((clientX: number, clientY: number) => {
    const dx = clientX - centerRef.current.x;
    const dy = clientY - centerRef.current.y;
    const maxRadius = 45;
    const dist = Math.hypot(dx, dy);
    const angle = Math.atan2(dy, dx);

    const clampedDist = Math.min(dist, maxRadius);
    setKnobPos({
      x: Math.cos(angle) * clampedDist,
      y: Math.sin(angle) * clampedDist
    });

    if (dist > 10) {
      onSteer(angle);
    }
  }, [onSteer]);

  const handleTouchMove = (e: React.TouchEvent) => {
    e.stopPropagation();
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === touchIdRef.current) {
        updateKnob(touch.clientX, touch.clientY);
        break;
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.stopPropagation();
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === touchIdRef.current) {
        touchIdRef.current = null;
        setActive(false);
        setKnobPos({ x: 0, y: 0 });
        break;
      }
    }
  };

  // 键盘与触控双防抖
  useEffect(() => {
    const handleReset = () => {
      touchIdRef.current = null;
      setActive(false);
      setKnobPos({ x: 0, y: 0 });
    };
    window.addEventListener('touchend', handleReset);
    return () => window.removeEventListener('touchend', handleReset);
  }, []);

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      className={`relative w-36 h-36 rounded-full flex items-center justify-center select-none touch-none transition-opacity ${
        isDark
          ? 'bg-neutral-900/50 border-2 border-neutral-700/60 shadow-[0_0_20px_rgba(0,0,0,0.5)]'
          : 'bg-stone-200/60 border-2 border-stone-400/60 shadow-[0_0_15px_rgba(0,0,0,0.1)]'
      }`}
      style={{ backdropFilter: 'blur(8px)' }}
    >
      {/* 虚拟罗盘同心墨环 */}
      <div
        className={`w-24 h-24 rounded-full border border-dashed relative transition-colors ${
          isDark ? 'border-amber-500/30' : 'border-red-600/30'
        }`}
      >
        {/* 四向刻度标记 (仅在四向模式突出显示，游弋模式淡化) */}
        <span className={`absolute -top-1.5 left-1/2 -translate-x-1/2 text-[9px] font-mono leading-none ${
          controlMode === 'cardinal' ? (isDark ? 'text-amber-400 font-bold' : 'text-red-600 font-bold') : 'opacity-30'
        }`}>北</span>
        <span className={`absolute -bottom-1.5 left-1/2 -translate-x-1/2 text-[9px] font-mono leading-none ${
          controlMode === 'cardinal' ? (isDark ? 'text-amber-400 font-bold' : 'text-red-600 font-bold') : 'opacity-30'
        }`}>南</span>
        <span className={`absolute top-1/2 -left-1.5 -translate-y-1/2 text-[9px] font-mono leading-none ${
          controlMode === 'cardinal' ? (isDark ? 'text-amber-400 font-bold' : 'text-red-600 font-bold') : 'opacity-30'
        }`}>西</span>
        <span className={`absolute top-1/2 -right-1.5 -translate-y-1/2 text-[9px] font-mono leading-none ${
          controlMode === 'cardinal' ? (isDark ? 'text-amber-400 font-bold' : 'text-red-600 font-bold') : 'opacity-30'
        }`}>东</span>
      </div>

      {/* 摇杆中心操纵钮 */}
      <div
        className={`absolute w-12 h-12 rounded-full transition-transform duration-75 flex items-center justify-center shadow-lg ${
          isDark
            ? 'bg-gradient-to-br from-neutral-200 to-neutral-400 text-neutral-900'
            : 'bg-gradient-to-br from-stone-800 to-neutral-950 text-stone-100'
        }`}
        style={{
          transform: `translate(${knobPos.x}px, ${knobPos.y}px)`,
          boxShadow: active
            ? isDark
              ? '0 0 16px rgba(212, 175, 55, 0.7)'
              : '0 0 14px rgba(199, 62, 58, 0.6)'
            : 'none'
        }}
      >
        <div
          className={`w-3 h-3 rounded-full ${
            isDark ? 'bg-amber-600' : 'bg-red-500'
          }`}
        />
      </div>

      <span
        className={`absolute -bottom-6 text-[11px] font-serif tracking-widest pointer-events-none select-none ${
          isDark ? 'text-neutral-500' : 'text-stone-500'
        }`}
      >
        {controlMode === 'cardinal' ? '四向罗盘' : '游弋罗盘'}
      </span>
    </div>
  );
};
