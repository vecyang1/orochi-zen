import { Particle, ParticleType } from './types';

export class ParticleSystem {
  public particles: Particle[] = [];
  private maxParticles: number = 220;

  public update(dt: number, width: number, height: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += dt;

      if (p.life >= p.maxLife) {
        this.particles.splice(i, 1);
        continue;
      }

      // 运动动力学
      if (p.type === 'sakura') {
        // 落樱受微风与正弦飘动影响
        p.x += (p.vx + Math.sin(p.life * 2.5 + p.y * 0.01) * 0.6) * dt * 60;
        p.y += (p.vy + Math.cos(p.life * 1.5) * 0.2) * dt * 60;
        if (p.rotation !== undefined && p.rotSpeed !== undefined) {
          p.rotation += p.rotSpeed * dt * 60;
        }

        // 边界循环
        if (p.y > height + 20) p.y = -20;
        if (p.x > width + 20) p.x = -20;
        if (p.x < -20) p.x = width + 20;
      } else if (p.type === 'zen_ripple') {
        // 水面波纹扩展
        p.size += dt * 38;
      } else {
        // 墨滴与金粉自然摩擦力衰减
        p.x += p.vx * dt * 60;
        p.y += p.vy * dt * 60;
        p.vx *= 0.94;
        p.vy *= 0.94;
      }
    }
  }

  /**
   * 初始化常驻背景八重樱花瓣
   */
  public initSakuraPetals(count: number, width: number, height: number) {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: 0.35 + Math.random() * 0.5, // 偏东南微风
        vy: 0.65 + Math.random() * 0.8,
        size: 5 + Math.random() * 5,
        alpha: 0.4 + Math.random() * 0.45,
        life: 0,
        maxLife: 999999, // 永久背景循环
        type: 'sakura',
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.04,
        color: '#F9D5DB'
      });
    }
  }

  /**
   * 爆发水墨溅射粒子
   */
  public emitInkSplash(x: number, y: number, count = 12, isDark = true) {
    if (this.particles.length > this.maxParticles) return;
    const baseColor = isDark ? 'rgba(240, 240, 245,' : 'rgba(25, 25, 30,';

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.2 + Math.random() * 3.5;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 2.5 + Math.random() * 4,
        alpha: 0.75 + Math.random() * 0.25,
        life: 0,
        maxLife: 0.45 + Math.random() * 0.4,
        type: 'ink_splash',
        color: baseColor
      });
    }
  }

  /**
   * 生成水面禅境涟漪
   */
  public emitZenRipple(x: number, y: number, color = 'rgba(212, 175, 55, 0.6)') {
    this.particles.push({
      x,
      y,
      vx: 0,
      vy: 0,
      size: 4,
      alpha: 0.85,
      life: 0,
      maxLife: 0.75,
      type: 'zen_ripple',
      color
    });
  }

  /**
   * 爆发金粉灵光
   */
  public emitGoldDust(x: number, y: number, count = 15) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.8 + Math.random() * 2.8;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 2 + Math.random() * 3,
        alpha: 0.9,
        life: 0,
        maxLife: 0.6 + Math.random() * 0.4,
        type: 'gold_dust',
        color: '#E6B422'
      });
    }
  }

  /**
   * 绘制所有粒子
   */
  public draw(ctx: CanvasRenderingContext2D) {
    for (const p of this.particles) {
      const progress = p.life / p.maxLife;
      const currentAlpha = p.type === 'sakura' ? p.alpha : p.alpha * (1 - progress);

      ctx.save();
      ctx.globalAlpha = Math.max(0, currentAlpha);

      if (p.type === 'sakura') {
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation || 0);

        // 绘制八重樱花瓣造型（两端尖、中间圆润带微缺口）
        ctx.fillStyle = p.color || '#F9D5DB';
        ctx.beginPath();
        ctx.ellipse(0, 0, p.size * 0.5, p.size, 0, 0, Math.PI * 2);
        ctx.fill();

        // 花瓣中央微粉渐变
        ctx.fillStyle = 'rgba(224, 98, 122, 0.4)';
        ctx.beginPath();
        ctx.ellipse(0, p.size * 0.3, p.size * 0.25, p.size * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'zen_ripple') {
        ctx.strokeStyle = p.color || 'rgba(199, 62, 58, 0.5)';
        ctx.lineWidth = Math.max(0.5, 2.5 * (1 - progress));
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.stroke();
      } else if (p.type === 'gold_dust') {
        ctx.fillStyle = p.color || '#E6B422';
        ctx.shadowColor = '#D4AF37';
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // ink_splash
        ctx.fillStyle = `${p.color} ${Math.max(0, 1 - progress)})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
  }
}
