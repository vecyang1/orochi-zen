import { Collectible, Obstacle, GameMode, GameStats, JapaneseTheme, ControlMode } from './types';
import { SnakePhysics } from './snakePhysics';
import { ParticleSystem } from './particleSystem';
import { japaneseAudio } from '../audio/japaneseSynth';

export const ZEN_QUOTES = [
  '白蛇衔玉，清池无尘。',
  '风动落樱，刹那芳华。',
  '枯山水阔，心远地偏。',
  '静水流深，神乐自鸣。',
  '行到水穷处，坐看云起时。',
  '一花一世界，一叶一菩提。',
  '万法归一，明月在天。',
  '白云抱幽石，绿竹隐深渊。'
];

export class GameManager {
  public snake: SnakePhysics;
  public particles: ParticleSystem;
  public collectibles: Collectible[] = [];
  public obstacles: Obstacle[] = [];
  public mode: GameMode = 'zen';
  public theme: JapaneseTheme = 'sumi_dark';
  public controlMode: ControlMode = 'cardinal';
  public stats: GameStats = {
    score: 0,
    highScore: 0,
    magatamaCount: 0,
    combo: 0,
    maxCombo: 0,
    multiplier: 1,
    zenLength: 18,
    timeAlive: 0
  };
  public currentQuote: string = ZEN_QUOTES[0];
  public lastQuoteChange: number = 0;
  public width: number = 800;
  public height: number = 600;

  constructor(width = 800, height = 600) {
    this.width = width;
    this.height = height;
    this.snake = new SnakePhysics(width / 2, height / 2, 18);
    this.particles = new ParticleSystem();
    this.particles.initSakuraPetals(32, width, height);
    this.loadHighScore();
    this.spawnCollectibles();
  }

  public resize(w: number, h: number) {
    this.width = w;
    this.height = h;
  }

  private loadHighScore() {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('orochi_zen_highscore');
      if (saved) {
        this.stats.highScore = parseInt(saved, 10) || 0;
      }
    }
  }

  private saveHighScore() {
    if (typeof window !== 'undefined') {
      localStorage.setItem('orochi_zen_highscore', this.stats.highScore.toString());
    }
  }

  public setMode(newMode: GameMode) {
    this.mode = newMode;
    this.reset();
  }

  public setTheme(newTheme: JapaneseTheme) {
    this.theme = newTheme;
  }

  public setControlMode(newMode: ControlMode) {
    this.controlMode = newMode;
    this.snake.setControlMode(newMode);
  }

  public reset() {
    this.snake.reset(this.width / 2, this.height / 2, 18);
    this.snake.setControlMode(this.controlMode);
    this.collectibles = [];
    this.obstacles = [];
    this.stats.score = 0;
    this.stats.combo = 0;
    this.stats.multiplier = 1;
    this.stats.magatamaCount = 0;
    this.stats.timeAlive = 0;
    this.stats.zenLength = 18;
    this.currentQuote = ZEN_QUOTES[Math.floor(Math.random() * ZEN_QUOTES.length)];

    if (this.mode === 'trial') {
      this.generateTrialObstacles();
    }

    this.spawnCollectibles();
  }

  private generateTrialObstacles() {
    this.obstacles = [];
    const count = 4 + Math.floor(Math.random() * 3);
    const centerSafeRadius = 140;

    for (let i = 0; i < count; i++) {
      let x = 0, y = 0, valid = false, attempts = 0;
      while (!valid && attempts < 30) {
        x = 60 + Math.random() * (this.width - 120);
        y = 60 + Math.random() * (this.height - 120);
        const distFromCenter = Math.hypot(x - this.width / 2, y - this.height / 2);
        if (distFromCenter > centerSafeRadius) {
          valid = true;
        }
        attempts++;
      }

      // 生成和风庭石的自然粗糙边缘
      const pointCount = 7 + Math.floor(Math.random() * 4);
      const roughness: number[] = [];
      for (let p = 0; p < pointCount; p++) {
        roughness.push(0.8 + Math.random() * 0.4);
      }

      this.obstacles.push({
        x,
        y,
        radius: 20 + Math.random() * 16,
        shape: i % 2 === 0 ? 'rock' : 'lantern',
        roughness
      });
    }
  }

  public spawnCollectibles() {
    // 保持场上有 2-4 个勾玉
    const desired = this.mode === 'zen' ? 3 : 2;
    while (this.collectibles.length < desired) {
      this.spawnItem('magatama');
    }

    // 小概率生成金鲤神魂或桜之雫
    if (Math.random() < 0.25 && !this.collectibles.some(c => c.type === 'golden_koi')) {
      this.spawnItem('golden_koi');
    }
    if (Math.random() < 0.2 && !this.collectibles.some(c => c.type === 'sakura_dew')) {
      this.spawnItem('sakura_dew');
    }
  }

  private spawnItem(type: 'magatama' | 'golden_koi' | 'sakura_dew') {
    let x = 0, y = 0, valid = false, attempts = 0;
    const margin = 50;

    while (!valid && attempts < 40) {
      x = margin + Math.random() * (this.width - margin * 2);
      y = margin + Math.random() * (this.height - margin * 2);
      valid = true;

      // 避免生成在障碍物内
      for (const obs of this.obstacles) {
        if (Math.hypot(x - obs.x, y - obs.y) < obs.radius + 30) {
          valid = false;
          break;
        }
      }
      attempts++;
    }

    this.collectibles.push({
      id: Math.random().toString(36).substring(2, 9),
      type,
      x,
      y,
      radius: type === 'golden_koi' ? 14 : (type === 'sakura_dew' ? 12 : 11),
      spawnTime: performance.now(),
      pulsePhase: Math.random() * Math.PI * 2,
      rotation: Math.random() * Math.PI * 2
    });
  }

  public update(dt: number): boolean {
    this.stats.timeAlive += dt;

    // 定期轮换禅诗名句
    if (this.stats.timeAlive - this.lastQuoteChange > 12) {
      this.currentQuote = ZEN_QUOTES[Math.floor(Math.random() * ZEN_QUOTES.length)];
      this.lastQuoteChange = this.stats.timeAlive;
    }

    // 更新粒子系统
    this.particles.update(dt, this.width, this.height);

    // 周期性从蛇尾释放轻微水墨微粒
    if (Math.random() < 0.35) {
      const tail = this.snake.segments[this.snake.segments.length - 1];
      if (tail) {
        this.particles.emitInkSplash(tail.x, tail.y, 1, this.theme === 'sumi_dark');
      }
    }

    // 更新蛇动力学并检测碰撞
    const died = this.snake.update(dt, this.width, this.height, this.mode);
    if (died && this.mode === 'trial') {
      japaneseAudio.playTaiko(1.2);
      return true; // 死亡触发
    }

    // 试练模式下的障碍物碰撞检测
    if (this.mode === 'trial') {
      for (const obs of this.obstacles) {
        const dist = Math.hypot(this.snake.head.x - obs.x, this.snake.head.y - obs.y);
        if (dist < obs.radius + 10) {
          japaneseAudio.playTaiko(1.2);
          return true; // 撞石死亡
        }
      }
    }

    // 拾取物吸收判定
    const head = this.snake.head;
    for (let i = this.collectibles.length - 1; i >= 0; i--) {
      const item = this.collectibles[i];
      const dist = Math.hypot(head.x - item.x, head.y - item.y);

      if (dist < item.radius + 14) {
        // 成功拾取！
        this.collectibles.splice(i, 1);
        this.handlePickup(item);
      }
    }

    // 保持拾取物供给
    this.spawnCollectibles();

    return false;
  }

  private handlePickup(item: Collectible) {
    if (item.type === 'magatama') {
      this.stats.magatamaCount++;
      this.stats.combo++;
      if (this.stats.combo > this.stats.maxCombo) {
        this.stats.maxCombo = this.stats.combo;
      }
      this.stats.multiplier = 1 + Math.floor(this.stats.combo / 4);
      const points = 10 * this.stats.multiplier;
      this.stats.score += points;

      // 演奏和筝上升音阶
      japaneseAudio.playKoto(this.stats.combo, 1.0 + this.stats.combo * 0.05);

      // 蛇身体增长
      this.snake.addSegments(3);
      this.stats.zenLength = this.snake.totalLength;

      // 视觉爆发
      this.particles.emitZenRipple(item.x, item.y, '#D4AF37');
      this.particles.emitInkSplash(item.x, item.y, 8, this.theme === 'sumi_dark');
    } else if (item.type === 'golden_koi') {
      // 金鲤神魂：翻倍与水琴窟禅钟
      this.stats.multiplier += 2;
      this.stats.score += 50 * this.stats.multiplier;
      japaneseAudio.playSuikinkutsu();
      this.particles.emitGoldDust(item.x, item.y, 22);
      this.particles.emitZenRipple(item.x, item.y, '#E6B422');
      this.snake.addSegments(5);
    } else if (item.type === 'sakura_dew') {
      // 桜之雫：触发刹那缓时 + 尺八声
      this.snake.activateSetsuna(4.5);
      japaneseAudio.playShakuhachi(1.0);
      this.particles.emitZenRipple(item.x, item.y, '#F8C3CD');
      this.particles.emitInkSplash(item.x, item.y, 14, this.theme === 'sumi_dark');
      this.stats.score += 30;
    }

    // 更新最高分
    if (this.stats.score > this.stats.highScore) {
      this.stats.highScore = this.stats.score;
      this.saveHighScore();
    }
  }

  /**
   * 绘制背景和风质感、障碍庭石与拾取神物
   */
  public draw(ctx: CanvasRenderingContext2D) {
    const isDark = this.theme === 'sumi_dark';

    // 1. 绘制和纸/玄墨底色与径向晕影
    ctx.save();
    ctx.fillStyle = isDark ? '#121316' : '#F6F3E9';
    ctx.fillRect(0, 0, this.width, this.height);

    // 枯山水涟漪纹底（细微淡线）
    ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.028)' : 'rgba(0, 0, 0, 0.038)';
    ctx.lineWidth = 1;
    const rippleSpacing = 42;
    for (let r = 0; r < Math.max(this.width, this.height); r += rippleSpacing) {
      ctx.beginPath();
      ctx.arc(this.width / 2, this.height / 2, r, 0, Math.PI * 2);
      ctx.stroke();
    }

    // 试练模式下的四角朱红鸟居神域立柱印记
    if (this.mode === 'trial') {
      ctx.strokeStyle = 'rgba(199, 62, 58, 0.38)';
      ctx.lineWidth = 3;
      const corner = 32;
      const m = 24;
      // 左上
      ctx.beginPath();
      ctx.moveTo(m, m + corner);
      ctx.lineTo(m, m);
      ctx.lineTo(m + corner, m);
      // 右上
      ctx.moveTo(this.width - m - corner, m);
      ctx.lineTo(this.width - m, m);
      ctx.lineTo(this.width - m, m + corner);
      // 左下
      ctx.moveTo(m, this.height - m - corner);
      ctx.lineTo(m, this.height - m);
      ctx.lineTo(m + corner, this.height - m);
      // 右下
      ctx.moveTo(this.width - m - corner, this.height - m);
      ctx.lineTo(this.width - m, this.height - m);
      ctx.lineTo(this.width - m, this.height - m - corner);
      ctx.stroke();
    }

    // 2. 绘制障碍庭石与石灯笼（试练模式）
    for (const obs of this.obstacles) {
      ctx.save();
      ctx.translate(obs.x, obs.y);

      if (obs.shape === 'rock') {
        // 庭石造型
        ctx.fillStyle = isDark ? '#23252B' : '#C7C2B4';
        ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.2)';
        ctx.lineWidth = 2;

        ctx.beginPath();
        const pts = obs.roughness.length;
        for (let p = 0; p < pts; p++) {
          const theta = (p / pts) * Math.PI * 2;
          const rad = obs.radius * obs.roughness[p];
          const px = Math.cos(theta) * rad;
          const py = Math.sin(theta) * rad;
          if (p === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // 庭石青苔点缀
        ctx.fillStyle = 'rgba(123, 141, 66, 0.45)';
        ctx.beginPath();
        ctx.arc(-obs.radius * 0.2, -obs.radius * 0.2, obs.radius * 0.3, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // 石灯笼造型（简练和风方形灯台）
        ctx.fillStyle = isDark ? '#282B32' : '#B8B3A6';
        const w = obs.radius * 1.3;
        const h = obs.radius * 1.5;
        ctx.fillRect(-w / 2, -h / 2, w, h);

        // 灯芯微光
        ctx.fillStyle = '#E6B422';
        ctx.shadowColor = '#E6B422';
        ctx.shadowBlur = 10;
        ctx.fillRect(-w * 0.25, -h * 0.25, w * 0.5, h * 0.5);
      }

      ctx.restore();
    }

    // 3. 绘制拾取物品（勾玉、金鲤、桜之雫）
    const now = performance.now() * 0.003;
    for (const item of this.collectibles) {
      ctx.save();
      ctx.translate(item.x, item.y);
      const floatOffset = Math.sin(now * 3 + item.pulsePhase) * 3;
      ctx.translate(0, floatOffset);

      if (item.type === 'magatama') {
        // 绘制经典勾玉（神道三神器之一）
        ctx.rotate(now * 1.5 + item.rotation);
        ctx.shadowColor = isDark ? '#D4AF37' : '#C73E3A';
        ctx.shadowBlur = 12;

        ctx.fillStyle = isDark ? '#FFFFFF' : '#181A20';
        ctx.beginPath();
        // 勾玉外形贝塞尔曲线
        ctx.arc(0, -5, 8, Math.PI * 0.5, Math.PI * 1.5, false);
        ctx.bezierCurveTo(-9, 4, 3, 14, 0, 16);
        ctx.bezierCurveTo(7, 10, 8, 2, 8, -5);
        ctx.fill();

        // 勾玉头顶圆孔
        ctx.fillStyle = isDark ? '#121316' : '#F6F3E9';
        ctx.beginPath();
        ctx.arc(0, -5, 2.5, 0, Math.PI * 2);
        ctx.fill();
      } else if (item.type === 'golden_koi') {
        // 绘制金鲤神魂游动剪影
        ctx.rotate(now * 2.5);
        ctx.shadowColor = '#E6B422';
        ctx.shadowBlur = 15;
        ctx.fillStyle = '#E6B422';

        // 鲤鱼流线
        ctx.beginPath();
        ctx.ellipse(0, 0, 10, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        // 尾鳍摆动
        const tailSway = Math.sin(now * 12) * 4;
        ctx.beginPath();
        ctx.moveTo(-9, 0);
        ctx.lineTo(-17, -5 + tailSway);
        ctx.lineTo(-17, 5 + tailSway);
        ctx.closePath();
        ctx.fill();
      } else {
        // 桜之雫（水珠形状粉色晶露）
        ctx.shadowColor = '#F8C3CD';
        ctx.shadowBlur = 14;
        ctx.fillStyle = '#F8C3CD';

        ctx.beginPath();
        ctx.arc(0, 3, 7, 0, Math.PI * 2);
        ctx.moveTo(0, -8);
        ctx.lineTo(-6, 2);
        ctx.lineTo(6, 2);
        ctx.closePath();
        ctx.fill();

        // 高光
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(-2, 1, 2, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }

    // 4. 绘制粒子
    this.particles.draw(ctx);

    // 5. 绘制白蛇神
    this.snake.draw(ctx, isDark);

    ctx.restore();
  }
}
