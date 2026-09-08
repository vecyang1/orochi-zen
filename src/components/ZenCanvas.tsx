'use client';

import React, { useRef, useEffect, useCallback } from 'react';
import { GameManager } from '../engine/gameManager';
import { GameStatus, GameMode, JapaneseTheme, GameStats } from '../engine/types';
import { japaneseAudio } from '../audio/japaneseSynth';

interface ZenCanvasProps {
  mode: GameMode;
  theme: JapaneseTheme;
  status: GameStatus;
  onStatusChange: (status: GameStatus) => void;
  onStatsUpdate: (stats: GameStats, quote: string) => void;
  gameManagerRef: React.MutableRefObject<GameManager | null>;
}

export const ZenCanvas: React.FC<ZenCanvasProps> = ({
  mode,
  theme,
  status,
  onStatusChange,
  onStatsUpdate,
  gameManagerRef
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameId = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());
  const keysPressed = useRef<{ [key: string]: boolean }>({});

  // 初始化 GameManager
  useEffect(() => {
    if (!gameManagerRef.current) {
      gameManagerRef.current = new GameManager(800, 600);
    }
    gameManagerRef.current.setMode(mode);
    gameManagerRef.current.setTheme(theme);
  }, [mode, theme, gameManagerRef]);

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

      // 快速触发方向
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
        gm.reset();
        onStatusChange('playing');
        return;
      }

      if (status !== 'playing') return;

      // 绝对方向指引
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        gm.snake.setDirection(0);
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        gm.snake.setDirection(Math.PI / 2);
      } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        gm.snake.setDirection(Math.PI);
      } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        gm.snake.setDirection(-Math.PI / 2);
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
        // 键盘长按微操连续偏转
        if (status === 'playing') {
          if (keysPressed.current['ArrowLeft'] || keysPressed.current['a'] || keysPressed.current['A']) {
            gm.snake.steerByDelta(-0.065);
          }
          if (keysPressed.current['ArrowRight'] || keysPressed.current['d'] || keysPressed.current['D']) {
            gm.snake.steerByDelta(0.065);
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
        className="w-full h-full block cursor-crosshair touch-none select-none"
      />
    </div>
  );
};
