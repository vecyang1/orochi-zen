'use client';

import React, { useRef, useEffect, useCallback } from 'react';
import { GameManager } from '../engine/gameManager';
import { GameStatus, GameMode, JapaneseTheme, GameStats, ControlMode } from '../engine/types';
import { japaneseAudio } from '../audio/japaneseSynth';

interface ZenCanvasProps {
  mode: GameMode;
  theme: JapaneseTheme;
  controlMode: ControlMode;
  status: GameStatus;
  onStatusChange: (status: GameStatus) => void;
  onStatsUpdate: (stats: GameStats, quote: string) => void;
  gameManagerRef: React.MutableRefObject<GameManager | null>;
}

export const ZenCanvas: React.FC<ZenCanvasProps> = ({
  mode,
  theme,
  controlMode,
  status,
  onStatusChange,
  onStatsUpdate,
  gameManagerRef
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameId = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());
  const keysPressed = useRef<{ [key: string]: boolean }>({});
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

  // 初始化并同步 GameManager 参数
  useEffect(() => {
    if (!gameManagerRef.current) {
      gameManagerRef.current = new GameManager(800, 600);
    }
    gameManagerRef.current.setMode(mode);
    gameManagerRef.current.setTheme(theme);
    gameManagerRef.current.setControlMode(controlMode);
  }, [mode, theme, controlMode, gameManagerRef]);

  // 处理窗口/画布尺寸自适应与 Retina 屏幕高清缩放
  const handleResize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !gameManagerRef.current) return;

    const parent = canvas.parentElement;
    if (!parent) return;

    const rect = parent.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5); // 规避过大损耗

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(dpr, dpr);
    }

    gameManagerRef.current.resize(rect.width, rect.height);
  }, [gameManagerRef]);

  useEffect(() => {
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [handleResize]);

  // 键盘事件监听：WASD / 方向键 / 空格暂停 / R 重置
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current[e.key] = true;

      const gm = gameManagerRef.current;
      if (!gm) return;

      // 空格暂停/继续
      if (e.code === 'Space') {
        e.preventDefault();
        japaneseAudio.playHyoshigi(1.1);
        onStatusChange(status === 'playing' ? 'paused' : 'playing');
        return;
      }

      // R 键重置
      if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        gm.reset();
        onStatusChange('playing');
        return;
      }

      if (status !== 'playing') return;

      // 四向模式下由 keydown 触发绝对朝向指引，规避帧循环中的偏转叠加死循环
      if (gm.controlMode === 'cardinal') {
        if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
          e.preventDefault();
          gm.snake.setDirection(0);
        } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
          e.preventDefault();
          gm.snake.setDirection(Math.PI / 2);
        } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
          e.preventDefault();
          gm.snake.setDirection(Math.PI);
        } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
          e.preventDefault();
          gm.snake.setDirection(-Math.PI / 2);
        }
      } else {
        // 模拟舵向模式阻止方向键滚动页面
        if (
          e.key === 'ArrowLeft' || e.key === 'ArrowRight' ||
          e.key === 'ArrowUp' || e.key === 'ArrowDown'
        ) {
          e.preventDefault();
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current[e.key] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [status, onStatusChange, gameManagerRef]);

  // 触屏轻扫手势监听 (Mobile Swipes on Canvas)
  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: performance.now()
      };
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!touchStartRef.current || status !== 'playing' || !gameManagerRef.current) return;
    const touch = e.touches[0];
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;
    const dist = Math.hypot(dx, dy);

    if (dist >= 24) {
      const angle = Math.atan2(dy, dx);
      gameManagerRef.current.snake.setDirection(angle);
      // 更新锚点支持连贯拐弯
      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: performance.now()
      };
    }
  }, [status, gameManagerRef]);

  const handleTouchEnd = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!touchStartRef.current || status !== 'playing' || !gameManagerRef.current) {
      touchStartRef.current = null;
      return;
    }
    if (e.changedTouches.length > 0) {
      const touch = e.changedTouches[0];
      const dx = touch.clientX - touchStartRef.current.x;
      const dy = touch.clientY - touchStartRef.current.y;
      const dist = Math.hypot(dx, dy);
      if (dist >= 16) {
        const angle = Math.atan2(dy, dx);
        gameManagerRef.current.snake.setDirection(angle);
      }
    }
    touchStartRef.current = null;
  }, [status, gameManagerRef]);

  // 主循环 (requestAnimationFrame 60-120FPS)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    lastTimeRef.current = performance.now();

    const loop = (currentTime: number) => {
      const dt = Math.min((currentTime - lastTimeRef.current) / 1000, 0.1);
      lastTimeRef.current = currentTime;

      const gm = gameManagerRef.current;
      if (gm) {
        if (status === 'playing') {
          // 仅在模拟舵向模式下根据长按偏转，避免四向经典模式下的连击自旋
          if (gm.controlMode === 'analog') {
            const steerRate = 3.2; // 弧度/秒
            if (keysPressed.current['ArrowLeft'] || keysPressed.current['a'] || keysPressed.current['A']) {
              gm.snake.steerByDelta(-steerRate * dt);
            }
            if (keysPressed.current['ArrowRight'] || keysPressed.current['d'] || keysPressed.current['D']) {
              gm.snake.steerByDelta(steerRate * dt);
            }
          }

          const gameOver = gm.update(dt);
          if (gameOver) {
            onStatusChange('gameover');
          }
        }

        // 渲染画布
        ctx.clearRect(0, 0, gm.width, gm.height);
        gm.draw(ctx);

        // 同步状态到上层 UI
        onStatsUpdate({ ...gm.stats }, gm.currentQuote);
      }

      animationFrameId.current = requestAnimationFrame(loop);
    };

    animationFrameId.current = requestAnimationFrame(loop);

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [status, onStatusChange, onStatsUpdate, gameManagerRef]);

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      <canvas
        ref={canvasRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        className="w-full h-full block cursor-crosshair touch-none select-none"
      />
    </div>
  );
};
