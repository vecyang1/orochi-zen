export interface Vector2D {
  x: number;
  y: number;
}

export interface SnakeSegment {
  x: number;
  y: number;
  angle: number;
  radius: number;
}

export type CollectibleType = 'magatama' | 'golden_koi' | 'sakura_dew';

export interface Collectible {
  id: string;
  type: CollectibleType;
  x: number;
  y: number;
  radius: number;
  spawnTime: number;
  pulsePhase: number;
  rotation: number;
}

export interface Obstacle {
  x: number;
  y: number;
  radius: number;
  shape: 'rock' | 'lantern';
  roughness: number[];
}

export type ParticleType = 'sakura' | 'ink_splash' | 'gold_dust' | 'zen_ripple';

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  maxLife: number;
  life: number;
  type: ParticleType;
  color?: string;
  rotation?: number;
  rotSpeed?: number;
}

export type GameMode = 'zen' | 'trial';
export type GameStatus = 'idle' | 'playing' | 'paused' | 'gameover';
export type JapaneseTheme = 'sumi_dark' | 'washi_light';

export interface GameStats {
  score: number;
  highScore: number;
  magatamaCount: number;
  combo: number;
  maxCombo: number;
  multiplier: number;
  zenLength: number;
  timeAlive: number;
}
