'use client';

import React, { useState, useRef, useCallback } from 'react';
import { ZenCanvas } from '../components/ZenCanvas';
import { GameHUD } from '../components/GameHUD';
import { TouchControls } from '../components/TouchControls';
import { GameManager, ZEN_QUOTES } from '../engine/gameManager';
import { GameMode, GameStatus, JapaneseTheme, GameStats, ControlMode } from '../engine/types';
import { japaneseAudio } from '../audio/japaneseSynth';
import { Sparkles, Play } from 'lucide-react';

export default function HomePage() {
  const [mode, setMode] = useState<GameMode>('zen');
  const [theme, setTheme] = useState<JapaneseTheme>('sumi_dark');
  const [controlMode, setControlMode] = useState<ControlMode>('cardinal');
  const [status, setStatus] = useState<GameStatus>('idle');
  const [stats, setStats] = useState<GameStats>({
    score: 0,
    highScore: 0,
    magatamaCount: 0,
    combo: 0,
    maxCombo: 0,
    multiplier: 1,
    zenLength: 18,
    timeAlive: 0
  });
  const [quote, setQuote] = useState<string>(ZEN_QUOTES[0]);
  const gameManagerRef = useRef<GameManager | null>(null);

  const handleStatsUpdate = useCallback((newStats: GameStats, newQuote: string) => {
    setStats(newStats);
    setQuote(newQuote);
  }, []);

  const handleStartGame = () => {
    japaneseAudio.init();
    japaneseAudio.playHyoshigi(1.0);
    setStatus('playing');
  };

  const handleRestart = () => {
    if (gameManagerRef.current) {
      gameManagerRef.current.reset();
    }
  };

  const handleTouchSteer = useCallback((rad: number) => {
    if (gameManagerRef.current) {
      gameManagerRef.current.snake.setDirection(rad);
    }
  }, []);

  const isDark = theme === 'sumi_dark';

  return (
    <main
      className={`relative w-screen h-screen overflow-hidden select-none transition-colors duration-700 ${
        isDark ? 'bg-[#121316]' : 'bg-[#F6F3E9]'
      }`}
    >
      {/* 核心画布 */}
      <ZenCanvas
        mode={mode}
        theme={theme}
        controlMode={controlMode}
        status={status}
        onStatusChange={setStatus}
        onStatsUpdate={handleStatsUpdate}
        gameManagerRef={gameManagerRef}
      />

      {/* 头部与数据 HUD */}
      <GameHUD
        stats={stats}
        quote={quote}
        mode={mode}
        theme={theme}
        controlMode={controlMode}
        status={status}
        onModeChange={setMode}
        onThemeChange={setTheme}
        onControlModeChange={setControlMode}
        onStatusChange={setStatus}
        onRestart={handleRestart}
      />

      {/* 移动端/触屏专属罗盘操纵杆 (桌面端屏幕宽度大时淡化或藏于右下角) */}
      {status === 'playing' && (
        <div className="absolute bottom-16 right-6 sm:bottom-20 sm:right-10 z-20 opacity-90 hover:opacity-100 transition-opacity">
          <TouchControls onSteer={handleTouchSteer} isDark={isDark} controlMode={controlMode} />
        </div>
      )}

      {/* 游戏初次载入启动开卷界面 */}
      {status === 'idle' && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/70 backdrop-blur-md p-6">
          <div
            className={`max-w-md w-full p-8 sm:p-10 rounded-2xl border text-center shadow-2xl relative ${
              isDark
                ? 'bg-neutral-900/95 border-neutral-700/80 text-stone-100'
                : 'bg-stone-50/95 border-stone-300 text-stone-900'
            }`}
          >
            {/* 朱红神印 */}
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-red-700/20 border-2 border-red-600/70 text-red-500 mb-4 shadow-[0_0_20px_rgba(199,62,58,0.4)]">
              <Sparkles className="w-7 h-7" />
            </div>

            <h1 className="text-3xl sm:text-4xl font-serif font-black tracking-widest mb-2 text-stone-100">
              白蛇神 <span className="text-xl font-normal opacity-70 tracking-normal block mt-1">墨影之境</span>
            </h1>
            <p className="text-xs sm:text-sm font-serif opacity-75 mb-8 tracking-wider">
              水墨写意・平调子和筝・游弋于枯山水之间
            </p>

            <button
              onClick={handleStartGame}
              className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-red-700 to-red-800 hover:from-red-600 hover:to-red-700 text-white font-serif font-bold text-base tracking-widest shadow-xl hover:shadow-red-900/40 transition-all flex items-center justify-center gap-2 group cursor-pointer"
            >
              <Play className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
              点击启封・步入神域
            </button>

            <div className="mt-6 flex items-center justify-center gap-4 text-[11px] font-serif opacity-60">
              <span>✦ 禅境无界</span>
              <span>•</span>
              <span>⚔ 修罗试练</span>
              <span>•</span>
              <span>♫ 纯合成和风音律</span>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
