'use client';

import React, { useState } from 'react';
import { GameMode, GameStatus, JapaneseTheme, GameStats } from '../engine/types';
import {
  Volume2,
  VolumeX,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Trophy,
  Swords,
  Sun,
  Moon,
  Info,
  Maximize2,
  Minimize2,
  X
} from 'lucide-react';
import { japaneseAudio } from '../audio/japaneseSynth';

interface GameHUDProps {
  stats: GameStats;
  quote: string;
  mode: GameMode;
  theme: JapaneseTheme;
  status: GameStatus;
  onModeChange: (mode: GameMode) => void;
  onThemeChange: (theme: JapaneseTheme) => void;
  onStatusChange: (status: GameStatus) => void;
  onRestart: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  stats,
  quote,
  mode,
  theme,
  status,
  onModeChange,
  onThemeChange,
  onStatusChange,
  onRestart
}) => {
  const [isMuted, setIsMuted] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const isDark = theme === 'sumi_dark';

  const toggleSound = () => {
    const muted = japaneseAudio.toggleMute();
    setIsMuted(muted);
    if (!muted) {
      japaneseAudio.playHyoshigi(1.0);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const handleModeSwitch = (targetMode: GameMode) => {
    japaneseAudio.playHyoshigi(1.2);
    onModeChange(targetMode);
  };

  const handleThemeSwitch = () => {
    japaneseAudio.playHyoshigi(0.9);
    onThemeChange(isDark ? 'washi_light' : 'sumi_dark');
  };

  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-4 sm:p-6 select-none z-10">
      {/* 顶部状态栏与控制面板 */}
      <header className="flex items-center justify-between gap-3">
        {/* 标题与印章 */}
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-sm flex items-center justify-center font-serif text-sm font-bold border ${
              isDark
                ? 'bg-red-950/80 border-red-700/80 text-red-300 shadow-[0_0_12px_rgba(199,62,58,0.5)]'
                : 'bg-red-700 border-red-800 text-amber-50 shadow-md'
            }`}
          >
            神
          </div>
          <div>
            <h1
              className={`text-lg sm:text-2xl font-serif font-extrabold tracking-widest ${
                isDark ? 'text-stone-100' : 'text-stone-900'
              }`}
            >
              白蛇神 <span className="text-xs sm:text-sm font-normal opacity-70 tracking-normal">墨影之境</span>
            </h1>
            <div className="flex items-center gap-2 text-[11px] font-mono tracking-wider opacity-60">
              <span>{mode === 'zen' ? '✦ 禅境心流' : '⚔ 修罗试练'}</span>
              <span>•</span>
              <span>{isDark ? '玄墨' : '素纸'}</span>
            </div>
          </div>
        </div>

        {/* 交互按钮组 */}
        <div className="pointer-events-auto flex items-center gap-1.5 sm:gap-2">
          {/* 模式切换 */}
          <button
            onClick={() => handleModeSwitch(mode === 'zen' ? 'trial' : 'zen')}
            title="切换模式 (禅境 / 试练)"
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-serif transition-all duration-200 border ${
              isDark
                ? 'bg-neutral-900/80 hover:bg-neutral-800 border-neutral-700 text-stone-200'
                : 'bg-stone-100/90 hover:bg-stone-200 border-stone-300 text-stone-800 shadow-sm'
            }`}
          >
            {mode === 'zen' ? (
              <>
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">禅境</span>
              </>
            ) : (
              <>
                <Swords className="w-3.5 h-3.5 text-red-500" />
                <span className="hidden sm:inline">修罗</span>
              </>
            )}
          </button>

          {/* 主题切换 */}
          <button
            onClick={handleThemeSwitch}
            title="和风主题切换 (玄墨 / 素纸)"
            className={`p-2 rounded-md transition-all duration-200 border ${
              isDark
                ? 'bg-neutral-900/80 hover:bg-neutral-800 border-neutral-700 text-amber-400'
                : 'bg-stone-100/90 hover:bg-stone-200 border-stone-300 text-stone-700 shadow-sm'
            }`}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* 音效开关 */}
          <button
            onClick={toggleSound}
            title={isMuted ? '开启音效' : '静音'}
            className={`p-2 rounded-md transition-all duration-200 border ${
              isDark
                ? 'bg-neutral-900/80 hover:bg-neutral-800 border-neutral-700 text-stone-300'
                : 'bg-stone-100/90 hover:bg-stone-200 border-stone-300 text-stone-700 shadow-sm'
            }`}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          {/* 全屏按钮 */}
          <button
            onClick={toggleFullscreen}
            title="全屏"
            className={`p-2 rounded-md transition-all duration-200 border hidden md:flex ${
              isDark
                ? 'bg-neutral-900/80 hover:bg-neutral-800 border-neutral-700 text-stone-300'
                : 'bg-stone-100/90 hover:bg-stone-200 border-stone-300 text-stone-700 shadow-sm'
            }`}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* 帮助指南 */}
          <button
            onClick={() => setShowHelp(true)}
            title="游戏指南"
            className={`p-2 rounded-md transition-all duration-200 border ${
              isDark
                ? 'bg-neutral-900/80 hover:bg-neutral-800 border-neutral-700 text-stone-300'
                : 'bg-stone-100/90 hover:bg-stone-200 border-stone-300 text-stone-700 shadow-sm'
            }`}
          >
            <Info className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* 数据仪表板 (Score / Magatama / Multiplier) */}
      <div className="flex flex-wrap items-center justify-between gap-3 my-auto">
        {/* 左侧：分数与连击 */}
        <div
          className={`px-4 py-3 rounded-lg border backdrop-blur-md transition-all ${
            isDark
              ? 'bg-neutral-950/60 border-neutral-800/80 text-stone-100 shadow-xl'
              : 'bg-white/70 border-stone-200/80 text-stone-900 shadow-md'
          }`}
        >
          <div className="text-[11px] font-serif uppercase tracking-widest opacity-60">灵力点数</div>
          <div className="text-2xl sm:text-4xl font-serif font-black tracking-tight text-amber-500">
            {stats.score.toLocaleString()}
          </div>
          {stats.combo > 1 && (
            <div className="flex items-center gap-1.5 mt-1 text-xs font-serif text-red-500 animate-pulse">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{stats.combo} 连击 ×{stats.multiplier}</span>
            </div>
          )}
        </div>

        {/* 右侧：勾玉统计与最高纪录 */}
        <div
          className={`px-4 py-3 rounded-lg border backdrop-blur-md transition-all flex flex-col items-end ${
            isDark
              ? 'bg-neutral-950/60 border-neutral-800/80 text-stone-100 shadow-xl'
              : 'bg-white/70 border-stone-200/80 text-stone-900 shadow-md'
          }`}
        >
          <div className="flex items-center gap-1.5 text-xs opacity-70">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-serif">最高纪录</span>
            <span className="font-mono font-bold">{stats.highScore.toLocaleString()}</span>
          </div>
          <div className="mt-1 flex items-center gap-3 text-xs font-serif">
            <div>
              <span className="opacity-60">勾玉：</span>
              <span className="font-mono font-bold text-amber-500">{stats.magatamaCount}</span>
            </div>
            <div>
              <span className="opacity-60">蛇身：</span>
              <span className="font-mono font-bold">{stats.zenLength} 节</span>
            </div>
          </div>
        </div>
      </div>

      {/* 底部禅境诗句与快捷键提示 */}
      <footer className="flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
        <div
          className={`text-xs sm:text-sm font-serif italic tracking-widest transition-opacity duration-1000 ${
            isDark ? 'text-amber-200/80' : 'text-stone-700'
          }`}
        >
          「 {quote} 」
        </div>

        <div className="flex items-center gap-2">
          <div
            className={`pointer-events-auto px-3 py-1.5 rounded text-[11px] font-mono border hidden sm:flex items-center gap-2 ${
              isDark
                ? 'bg-neutral-900/60 border-neutral-800 text-neutral-400'
                : 'bg-stone-200/60 border-stone-300 text-stone-600'
            }`}
          >
            <span>[WASD/方向键] 游弋</span>
            <span>•</span>
            <span>[空格] 暂停</span>
            <span>•</span>
            <span>[R] 重置</span>
          </div>

          <button
            onClick={() => {
              japaneseAudio.playHyoshigi(1.0);
              onStatusChange(status === 'playing' ? 'paused' : 'playing');
            }}
            className={`pointer-events-auto p-2.5 rounded-full shadow-lg border transition-all ${
              isDark
                ? 'bg-amber-600/90 hover:bg-amber-500 text-neutral-950 border-amber-400/50'
                : 'bg-stone-900 hover:bg-stone-800 text-stone-50 border-stone-700'
            }`}
            title={status === 'playing' ? '暂停' : '继续'}
          >
            {status === 'playing' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
          </button>
        </div>
      </footer>

      {/* 游戏暂停界面 */}
      {status === 'paused' && (
        <div className="pointer-events-auto absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            className={`max-w-md w-full p-6 sm:p-8 rounded-xl border text-center shadow-2xl ${
              isDark
                ? 'bg-neutral-900 border-neutral-700 text-stone-100'
                : 'bg-stone-50 border-stone-300 text-stone-900'
            }`}
          >
            <div className="text-3xl font-serif font-black tracking-widest text-amber-500 mb-2">
              心流暂止
            </div>
            <p className="text-xs sm:text-sm font-serif opacity-75 mb-6">
              风止于秋水，静候君归。
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => {
                  japaneseAudio.playHyoshigi(1.1);
                  onStatusChange('playing');
                }}
                className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-red-700 hover:bg-red-600 text-white font-serif text-sm shadow-md transition-all"
              >
                <Play className="w-4 h-4" /> 继续游弋
              </button>
              <button
                onClick={() => {
                  japaneseAudio.playHyoshigi(0.9);
                  onRestart();
                  onStatusChange('playing');
                }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border font-serif text-sm transition-all ${
                  isDark
                    ? 'border-neutral-700 hover:bg-neutral-800 text-stone-300'
                    : 'border-stone-300 hover:bg-stone-200 text-stone-700'
                }`}
              >
                <RotateCcw className="w-4 h-4" /> 重置
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 试练模式游戏结束界面 */}
      {status === 'gameover' && (
        <div className="pointer-events-auto absolute inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div
            className={`max-w-md w-full p-6 sm:p-8 rounded-xl border text-center shadow-2xl animate-in fade-in zoom-in duration-300 ${
              isDark
                ? 'bg-neutral-900 border-red-900/60 text-stone-100'
                : 'bg-stone-50 border-red-300 text-stone-900'
            }`}
          >
            <div className="inline-block p-3 rounded-full bg-red-500/20 text-red-500 mb-3">
              <Swords className="w-8 h-8" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-serif font-black tracking-widest text-red-600 mb-1">
              修罗寂灭
            </h2>
            <p className="text-xs font-serif opacity-70 mb-5">
              触犯神域结界或自缚蛇躯，尘归于尘。
            </p>

            <div
              className={`p-4 rounded-lg mb-6 border flex justify-around text-center ${
                isDark ? 'bg-neutral-950/80 border-neutral-800' : 'bg-stone-100 border-stone-200'
              }`}
            >
              <div>
                <div className="text-[11px] font-serif opacity-60">本次灵力</div>
                <div className="text-xl font-mono font-bold text-amber-500">
                  {stats.score.toLocaleString()}
                </div>
              </div>
              <div className="w-[1px] bg-neutral-700/50" />
              <div>
                <div className="text-[11px] font-serif opacity-60">吸纳勾玉</div>
                <div className="text-xl font-mono font-bold text-stone-300">
                  {stats.magatamaCount}
                </div>
              </div>
              <div className="w-[1px] bg-neutral-700/50" />
              <div>
                <div className="text-[11px] font-serif opacity-60">极盛连击</div>
                <div className="text-xl font-mono font-bold text-red-400">
                  {stats.maxCombo}
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                japaneseAudio.playHyoshigi(1.2);
                onRestart();
                onStatusChange('playing');
              }}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-red-700 hover:bg-red-600 text-white font-serif text-sm font-bold shadow-lg transition-all"
            >
              <RotateCcw className="w-4 h-4" /> 再次入阵
            </button>
          </div>
        </div>
      )}

      {/* 玩法说明模态窗 */}
      {showHelp && (
        <div className="pointer-events-auto absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div
            className={`max-w-lg w-full p-6 sm:p-8 rounded-xl border shadow-2xl relative ${
              isDark
                ? 'bg-neutral-900 border-neutral-700 text-stone-200'
                : 'bg-stone-50 border-stone-300 text-stone-800'
            }`}
          >
            <button
              onClick={() => setShowHelp(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-neutral-800/50 transition-colors"
            >
              <X className="w-5 h-5 opacity-70" />
            </button>

            <h3 className="text-xl font-serif font-black tracking-widest text-amber-500 mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" /> 白蛇神・和风秘卷
            </h3>

            <div className="space-y-4 text-xs sm:text-sm font-serif leading-relaxed opacity-85">
              <div className="border-b pb-3 border-neutral-700/50">
                <div className="font-bold text-amber-400 mb-1">一、双重意境模式</div>
                <p>
                  • <strong>禅境模式 (Zen)</strong>：无死亡边界，穿屏隐入水墨，专注于心流与和筝和声。<br />
                  • <strong>修罗试练 (Trial)</strong>：朱红结界封印，四周设庭石与灯笼，撞壁或自咬尾即败。
                </p>
              </div>

              <div className="border-b pb-3 border-neutral-700/50">
                <div className="font-bold text-amber-400 mb-1">二、神道三神器与拾取物</div>
                <p>
                  • <strong>勾玉 (Magatama)</strong>：吸纳灵力，弹奏平调子和筝音阶，增长蛇身。<br />
                  • <strong>金鲤神魂 (Golden Koi)</strong>：稀有化形，倍率暴增并鸣响水琴窟禅钟。<br />
                  • <strong>桜之雫 (Sakura Dew)</strong>：触发 4.5 秒“刹那”时缓，尺八悠扬。
                </p>
              </div>

              <div>
                <div className="font-bold text-amber-400 mb-1">三、操控法则</div>
                <p>
                  • <strong>电脑键盘</strong>：WASD / 方向键转向；长按左右键可亚像素连续平滑偏转。<br />
                  • <strong>触屏设备</strong>：支持下方虚拟和风触控罗盘，360° 无极游弋。
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowHelp(false)}
              className="mt-6 w-full py-2.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-stone-200 text-xs font-serif tracking-wider border border-neutral-600 transition-colors"
            >
              领悟并归去
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
