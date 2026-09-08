import { SnakeSegment, Vector2D, GameMode } from './types';

export class SnakePhysics {
  public head: Vector2D = { x: 400, y: 300 };
  public angle: number = 0; // 朝向弧度
  public targetAngle: number = 0; // 目标朝向
  public baseSpeed: number = 3.6; // 基础游弋速度
  public currentSpeed: number = 3.6;
  public segments: SnakeSegment[] = [];
  public segmentDist: number = 11; // 节距
  public totalLength: number = 16; // 初始节数
  public turnSpeed: number = 0.095; // 转向敏捷度
  public timeAlive: number = 0;
  public setsunaTime: number = 0; // 刹那缓时倒计时

  constructor(startX = 400, startY = 300, initialLength = 18) {
    this.reset(startX, startY, initialLength);
  }

  public reset(x: number, y: number, length = 18) {
    this.head = { x, y };
    this.angle = 0;
    this.targetAngle = 0;
    this.baseSpeed = 3.6;
    this.currentSpeed = 3.6;
    this.totalLength = length;
    this.timeAlive = 0;
    this.setsunaTime = 0;
    this.segments = [];

    // 初始化初始节
    for (let i = 0; i < length; i++) {
      this.segments.push({
        x: x - i * this.segmentDist,
        y: y,
        angle: 0,
        radius: this.calculateRadius(i, length)
      });
    }
  }

  public setDirection(rad: number) {
    // 限制单次突变过大，保持和风蛇形游弋的自然物理惯性
    let diff = rad - this.targetAngle;
    while (diff < -Math.PI) diff += Math.PI * 2;
    while (diff > Math.PI) diff -= Math.PI * 2;
    this.targetAngle += diff;
  }

  public steerByDelta(deltaRad: number) {
    this.targetAngle += deltaRad;
  }

  public addSegments(count = 3) {
    this.totalLength += count;
    const last = this.segments[this.segments.length - 1] || { x: this.head.x, y: this.head.y, angle: this.angle, radius: 2 };
    for (let i = 0; i < count; i++) {
      this.segments.push({
        x: last.x,
        y: last.y,
        angle: last.angle,
        radius: 2
      });
    }
  }

  public activateSetsuna(durationSeconds = 4.0) {
    this.setsunaTime = durationSeconds;
  }

  public update(dt: number, width: number, height: number, mode: GameMode): boolean {
    this.timeAlive += dt;

    // 刹那缓时计算
    let timeScale = 1.0;
    if (this.setsunaTime > 0) {
      this.setsunaTime = Math.max(0, this.setsunaTime - dt);
      timeScale = 0.55; // 45% 慢动作
    }

    const effectiveDt = dt * timeScale;

    // 角度渐进平滑插值（带自然惯性）
    let angleDiff = this.targetAngle - this.angle;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    this.angle += angleDiff * Math.min(1.0, this.turnSpeed * (60 * effectiveDt));

    // 推进头部位置
    const speed = this.currentSpeed * (60 * effectiveDt);
    this.head.x += Math.cos(this.angle) * speed;
    this.head.y += Math.sin(this.angle) * speed;

    // 边界处理
    if (mode === 'zen') {
      // 禅境模式：平滑越界穿梭
      if (this.head.x < 0) this.head.x = width;
      if (this.head.x > width) this.head.x = 0;
      if (this.head.y < 0) this.head.y = height;
      if (this.head.y > height) this.head.y = 0;
    } else {
      // 试练模式：触及结界边界即死亡
      const margin = 24;
      if (this.head.x < margin || this.head.x > width - margin || this.head.y < margin || this.head.y > height - margin) {
        return true; // 碰撞结界
      }
    }

    // 骨骼链约束（Verlet Distance Relaxation）+ 游蛇正弦横向波动
    if (this.segments.length > 0) {
      // 第一节紧随头部
      const first = this.segments[0];
      first.x = this.head.x;
      first.y = this.head.y;
      first.angle = this.angle;
      first.radius = this.calculateRadius(0, this.segments.length);

      for (let i = 1; i < this.segments.length; i++) {
        const prev = this.segments[i - 1];
        const curr = this.segments[i];

        const dx = curr.x - prev.x;
        const dy = curr.y - prev.y;
        const dist = Math.hypot(dx, dy) || 0.001;

        // 约束节距
        const factor = this.segmentDist / dist;
        curr.x = prev.x + dx * factor;
        curr.y = prev.y + dy * factor;
        curr.angle = Math.atan2(prev.y - curr.y, prev.x - curr.x);
        curr.radius = this.calculateRadius(i, this.segments.length);

        // 越界平滑同步（禅境模式）
        if (mode === 'zen') {
          if (Math.abs(curr.x - prev.x) > width / 2) curr.x = prev.x;
          if (Math.abs(curr.y - prev.y) > height / 2) curr.y = prev.y;
        }
      }
    }

    // 自碰撞检测（试练模式，从第 12 节之后开始计算）
    if (mode === 'trial' && this.segments.length > 14) {
      const headRadius = 10;
      for (let i = 12; i < this.segments.length; i++) {
        const seg = this.segments[i];
        const dist = Math.hypot(this.head.x - seg.x, this.head.y - seg.y);
        if (dist < headRadius + seg.radius * 0.75) {
          return true; // 自咬尾碰撞
        }
      }
    }

    return false;
  }

  /**
   * 计算机身不同部位的优雅收尾半径（头部圆润、胸腹饱满、尾部如狼毫笔锋）
   */
  private calculateRadius(index: number, total: number): number {
    if (index === 0) return 13.5; // 蛇头
    if (index === 1) return 14;
    if (index < 5) return 13.5;
    const progress = index / Math.max(1, total - 1);
    // 缓动收尖
    return Math.max(2.2, 13.5 * Math.pow(1 - progress, 0.65));
  }

  /**
   * 绘制具有水墨神韵的白蛇神身体
   */
  public draw(ctx: CanvasRenderingContext2D, isDarkTheme = true) {
    if (this.segments.length === 0) return;

    ctx.save();

    // 刹那缓时模式下的灵动墨韵光环
    if (this.setsunaTime > 0) {
      ctx.shadowColor = isDarkTheme ? '#D4AF37' : '#C73E3A';
      ctx.shadowBlur = 16;
    } else {
      ctx.shadowColor = isDarkTheme ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.35)';
      ctx.shadowBlur = 8;
    }

    // 1. 绘制蛇身外沿水墨笔触阴影
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (let i = this.segments.length - 1; i >= 0; i--) {
      const seg = this.segments[i];

      // 叠加自然游动微正弦横向摆动
      const lateralSway = Math.sin(this.timeAlive * 7.5 - i * 0.38) * Math.min(4.5, i * 0.28);
      const perpAngle = seg.angle + Math.PI / 2;
      const drawX = seg.x + Math.cos(perpAngle) * lateralSway;
      const drawY = seg.y + Math.sin(perpAngle) * lateralSway;

      // 笔刷浓淡层次：白蛇神外墨内玉
      const alpha = 0.92;
      ctx.fillStyle = isDarkTheme
        ? `rgba(248, 248, 252, ${alpha})`
        : `rgba(20, 22, 26, ${alpha})`;

      ctx.beginPath();
      ctx.arc(drawX, drawY, seg.radius, 0, Math.PI * 2);
      ctx.fill();

      // 内层鳞光/龙脊光斑
      if (i > 0 && i % 2 === 0) {
        ctx.fillStyle = isDarkTheme
          ? 'rgba(212, 175, 55, 0.45)' // 金箔微斑
          : 'rgba(199, 62, 58, 0.35)'; // 朱红脊线
        ctx.beginPath();
        ctx.arc(drawX, drawY, seg.radius * 0.45, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 2. 绘制精细的白蛇神龙头
    const head = this.head;
    ctx.translate(head.x, head.y);
    ctx.rotate(this.angle);

    // 蛇头外廓（和风大蛇流线）
    ctx.fillStyle = isDarkTheme ? '#FFFFFF' : '#14161A';
    ctx.beginPath();
    ctx.moveTo(16, 0); // 吻部前突
    ctx.quadraticCurveTo(8, -12, -10, -11); // 左颌
    ctx.quadraticCurveTo(-14, 0, -10, 11);  // 枕骨
    ctx.quadraticCurveTo(8, 12, 16, 0);    // 右颌
    ctx.closePath();
    ctx.fill();

    // 额间神道灵纹（朱砂神印）
    ctx.fillStyle = '#C73E3A';
    ctx.beginPath();
    ctx.ellipse(3, 0, 4.5, 2.2, 0, 0, Math.PI * 2);
    ctx.fill();

    // 双目：金眸玉瞳（带微光）
    ctx.fillStyle = '#E6B422';
    ctx.shadowColor = '#E6B422';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(6, -6, 2.5, 0, Math.PI * 2); // 左眼
    ctx.arc(6, 6, 2.5, 0, Math.PI * 2);  // 右眼
    ctx.fill();

    // 瞳孔：黑细竖眸
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.ellipse(6.5, -6, 1.8, 0.8, 0, 0, Math.PI * 2);
    ctx.ellipse(6.5, 6, 1.8, 0.8, 0, 0, Math.PI * 2);
    ctx.fill();

    // 飘逸龙须/神使灵须
    ctx.strokeStyle = isDarkTheme ? 'rgba(230, 180, 34, 0.65)' : 'rgba(199, 62, 58, 0.65)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    // 左须
    ctx.moveTo(12, -4);
    ctx.quadraticCurveTo(18, -14 + Math.sin(this.timeAlive * 8) * 3, 26, -10);
    // 右须
    ctx.moveTo(12, 4);
    ctx.quadraticCurveTo(18, 14 - Math.sin(this.timeAlive * 8) * 3, 26, 10);
    ctx.stroke();

    ctx.restore();
  }
}
