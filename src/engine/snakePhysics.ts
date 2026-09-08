import { SnakeSegment, Vector2D, GameMode, ControlMode } from './types';

export function normalizeAngle(rad: number): number {
  let a = rad % (Math.PI * 2);
  if (a > Math.PI) a -= Math.PI * 2;
  if (a < -Math.PI) a += Math.PI * 2;
  return a;
}

export function angleDiff(a: number, b: number): number {
  let diff = a - b;
  while (diff < -Math.PI) diff += Math.PI * 2;
  while (diff > Math.PI) diff -= Math.PI * 2;
  return diff;
}

export function isOppositeAngle(a: number, b: number, thresholdCos = -0.7): boolean {
  return Math.cos(a - b) < thresholdCos;
}

export function snapToNearestCardinal(rad: number): number {
  const normalized = normalizeAngle(rad);
  if (normalized >= -Math.PI / 4 && normalized < Math.PI / 4) {
    return 0; // East
  } else if (normalized >= Math.PI / 4 && normalized < (3 * Math.PI) / 4) {
    return Math.PI / 2; // South
  } else if (normalized >= (-3 * Math.PI) / 4 && normalized < -Math.PI / 4) {
    return -Math.PI / 2; // North
  } else {
    return Math.PI; // West
  }
}

export class SnakePhysics {
  public head: Vector2D = { x: 400, y: 300 };
  public angle: number = 0; // 朝向弧度
  public targetAngle: number = 0; // 目标朝向
  public baseSpeed: number = 3.6; // 基础游弋速度
  public currentSpeed: number = 3.6;
  public segments: SnakeSegment[] = [];
  public segmentDist: number = 11; // 节距
  public totalLength: number = 18; // 初始节数
  public turnSpeed: number = 0.35; // 经典四向敏捷度（响应迅速俐落）
  public analogTurnSpeed: number = 0.16; // 模拟舵向平滑度
  public controlMode: ControlMode = 'cardinal';
  public turnQueue: number[] = [];
  public maxQueueSize: number = 2;
  public lastCommittedDirection: number = 0;
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
    this.turnQueue = [];
    this.lastCommittedDirection = 0;
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

  public setControlMode(mode: ControlMode) {
    this.controlMode = mode;
    this.turnQueue = [];
  }

  public inputCardinalDirection(rad: number): boolean {
    const normalized = normalizeAngle(rad);

    // 以队列末尾或当前目标朝向为基准
    const reference = this.turnQueue.length > 0
      ? this.turnQueue[this.turnQueue.length - 1]
      : this.targetAngle;

    // 1. 重复方向忽略
    if (Math.abs(angleDiff(normalized, reference)) < 0.05) {
      return false;
    }

    // 2. 180度反向防回头锁死保护（严格杜绝咬脖自噬）
    if (isOppositeAngle(normalized, reference)) {
      return false;
    }

    // 3. 检查当前蛇头是否已大致对准当前目标角
    const angleError = Math.abs(angleDiff(this.targetAngle, this.angle));
    if (this.turnQueue.length === 0 && angleError <= 0.35) {
      this.applyDirection(normalized);
      return true;
    }

    // 否则加入转向缓冲队列，防止快速双击丢键
    if (this.turnQueue.length < this.maxQueueSize) {
      this.turnQueue.push(normalized);
      return true;
    }

    return false;
  }

  public setAnalogDirection(rad: number) {
    const normalized = normalizeAngle(rad);
    let diff = normalized - this.targetAngle;
    while (diff < -Math.PI) diff += Math.PI * 2;
    while (diff > Math.PI) diff -= Math.PI * 2;
    this.targetAngle += diff;
  }

  public applyDirection(rad: number) {
    let diff = rad - this.targetAngle;
    while (diff < -Math.PI) diff += Math.PI * 2;
    while (diff > Math.PI) diff -= Math.PI * 2;
    this.targetAngle += diff;
    this.lastCommittedDirection = rad;
  }

  public setDirection(rad: number) {
    if (this.controlMode === 'cardinal') {
      const cardinalAngle = snapToNearestCardinal(rad);
      this.inputCardinalDirection(cardinalAngle);
    } else {
      this.setAnalogDirection(rad);
    }
  }

  public steerByDelta(deltaRad: number) {
    // 经典四向模式下严禁混入微操偏转，防止方向死循环与剧烈自旋
    if (this.controlMode !== 'analog') return;
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

    // 处理四向模式转弯缓冲队列 (Turn Queue)
    if (this.controlMode === 'cardinal' && this.turnQueue.length > 0) {
      const angleError = Math.abs(angleDiff(this.targetAngle, this.angle));
      if (angleError < 0.3) {
        const nextDir = this.turnQueue.shift()!;
        if (!isOppositeAngle(nextDir, this.angle)) {
          this.applyDirection(nextDir);
        }
      }
    }

    // 角度渐进平滑插值（根据模式匹配敏捷响应与自然惯性）
    const activeTurnSpeed = this.controlMode === 'cardinal' ? this.turnSpeed : this.analogTurnSpeed;
    let angleDiffVal = this.targetAngle - this.angle;
    while (angleDiffVal < -Math.PI) angleDiffVal += Math.PI * 2;
    while (angleDiffVal > Math.PI) angleDiffVal -= Math.PI * 2;
    this.angle += angleDiffVal * Math.min(1.0, activeTurnSpeed * (60 * effectiveDt));

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
