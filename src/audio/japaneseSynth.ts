/**
 * 纯 Web Audio API 和风程序化音效引擎
 * 零外部音频文件依赖，代码实时合成日本传统乐器（和筝、拍子木、尺八、太鼓、水琴窟）
 */

// 日本传统平调子（Hirajoshi）五声音阶频率表 (A 小调系)
const HIRAJOSHI_SCALE = [
  220.00, // A3
  246.94, // B3
  261.63, // C4
  329.63, // E4
  349.23, // F4
  440.00, // A4
  493.88, // B4
  523.25, // C5
  659.25, // E5
  698.46, // F5
  880.00, // A5
  987.77, // B5
  1046.50 // C6
];

class JapaneseSynthEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isMuted: boolean = false;
  private isInitialized: boolean = false;
  private ambientGain: GainNode | null = null;
  private ambientSource: AudioBufferSourceNode | null = null;
  private ambientPlaying: boolean = false;

  public init() {
    if (this.isInitialized && this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      return;
    }

    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
      this.isInitialized = true;
    } catch {
      console.warn('Web Audio API not supported on this platform');
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(muted ? 0 : 0.7, this.ctx.currentTime, 0.05);
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public toggleMute(): boolean {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  /**
   * 拍子木 (Hyoshigi) - 神社/歌舞伎清脆木板敲击声
   * 用于：界面点击、游戏开始、暂停
   */
  public playHyoshigi(pitchMod = 1.0) {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(2400 * pitchMod, t);
    osc.frequency.exponentialRampToValueAtTime(1100 * pitchMod, t + 0.05);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2200 * pitchMod, t);
    filter.Q.setValueAtTime(8, t);

    gain.gain.setValueAtTime(0.8, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.08);

    // 双响回弹质感（稍微错开 25ms）
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'square';
    osc2.frequency.setValueAtTime(2900 * pitchMod, t + 0.025);
    osc2.frequency.exponentialRampToValueAtTime(1400 * pitchMod, t + 0.07);

    gain2.gain.setValueAtTime(0.001, t);
    gain2.gain.setValueAtTime(0.4, t + 0.025);
    gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

    osc2.connect(filter);
    gain2.connect(this.masterGain);

    osc2.start(t + 0.025);
    osc2.stop(t + 0.1);
  }

  /**
   * 和筝 (Koto) 拨弦音 - 平调子五声音阶
   * 用于：蛇拾取勾玉，连击时阶梯升高
   */
  public playKoto(noteStep: number = 0, volumeMultiplier = 1.0) {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    const baseFreq = HIRAJOSHI_SCALE[noteStep % HIRAJOSHI_SCALE.length];
    const octaveMultiplier = Math.pow(2, Math.floor(noteStep / HIRAJOSHI_SCALE.length));
    const freq = baseFreq * octaveMultiplier;

    // 主振荡器（模拟琴弦金属/丝线泛音）
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(freq, t);

    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(freq * 2.01, t); // 轻微失谐增添弦乐质感

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(freq * 4, t);
    filter.frequency.exponentialRampToValueAtTime(freq * 0.8, t + 0.6); // 模拟指尖离弦后的衰减

    const vol = Math.min(1.0, 0.45 * volumeMultiplier);
    gainNode.gain.setValueAtTime(vol, t);
    gainNode.gain.exponentialRampToValueAtTime(0.001, t + 0.75);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.masterGain);

    osc1.start(t);
    osc2.start(t);
    osc1.stop(t + 0.8);
    osc2.stop(t + 0.8);
  }

  /**
   * 尺八 (Shakuhachi) - 竹管气息与泛音
   * 用于：刹那 (Setsuna) 缓时激活、突破纪录、连击极盛
   */
  public playShakuhachi(duration = 0.9) {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    // 经典尺八开篇气息滑音
    osc.type = 'sine';
    osc.frequency.setValueAtTime(435, t);
    osc.frequency.exponentialRampToValueAtTime(440, t + 0.15);
    osc.frequency.setValueAtTime(440, t + 0.5);
    osc.frequency.exponentialRampToValueAtTime(430, t + duration);

    // 颤音 LFO (吹奏微颤)
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    lfo.frequency.setValueAtTime(5.5, t); // 5.5Hz 呼吸颤动
    lfoGain.gain.setValueAtTime(3.5, t);
    lfo.connect(osc.frequency);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(880, t);
    filter.Q.setValueAtTime(3, t);

    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.35, t + 0.12);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    lfo.start(t);
    osc.start(t);
    lfo.stop(t + duration);
    osc.stop(t + duration);
  }

  /**
   * 太鼓 (Taiko) - 深沉低频日本大鼓重击
   * 用于：碰撞障碍、试练模式死亡、高分打破
   */
  public playTaiko(power = 1.0) {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    // 鼓皮受击从 130Hz 快速坠落至 45Hz 强共振
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(45, t + 0.18);

    const vol = Math.min(1.0, 0.7 * power);
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.46);
  }

  /**
   * 水琴窟 (Suikinkutsu) / 禅钟
   * 用于：获得金鲤神魂、净化模式切换
   */
  public playSuikinkutsu() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    const partials = [880, 1320, 1760, 2640];
    const decay = 1.6;

    partials.forEach((freq, idx) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq * (1 + (Math.random() - 0.5) * 0.02), t);

      const amp = (0.2 / (idx + 1));
      gain.gain.setValueAtTime(amp, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + decay / (idx * 0.4 + 1));

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t);
      osc.stop(t + decay);
    });
  }

  /**
   * 禅意环境音（柔和夏风/竹林流水粉红噪音 LFO）
   */
  public toggleAmbient(enable: boolean) {
    this.init();
    if (!this.ctx || !this.masterGain) return;

    if (!enable) {
      if (this.ambientGain) {
        this.ambientGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.3);
      }
      this.ambientPlaying = false;
      return;
    }

    if (this.ambientPlaying) return;

    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99 * b0 + white * 0.05;
      b1 = 0.95 * b1 + white * 0.1;
      b2 = 0.85 * b2 + white * 0.2;
      output[i] = (b0 + b1 + b2) * 0.08;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(260, this.ctx.currentTime);

    this.ambientGain = this.ctx.createGain();
    this.ambientGain.gain.setValueAtTime(0.001, this.ctx.currentTime);
    this.ambientGain.gain.setTargetAtTime(0.12, this.ctx.currentTime, 1.0);

    whiteNoise.connect(filter);
    filter.connect(this.ambientGain);
    this.ambientGain.connect(this.masterGain);

    whiteNoise.start();
    this.ambientSource = whiteNoise;
    this.ambientPlaying = true;
  }
}

export const japaneseAudio = new JapaneseSynthEngine();
