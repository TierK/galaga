export class AudioManager {
  private ctx: AudioContext | null = null;
  private muted = false;
  private masterGain!: GainNode;

  private getCtx(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.3;
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  }

  toggleMute(): boolean {
    this.muted = !this.muted;
    if (this.ctx) this.masterGain.gain.value = this.muted ? 0 : 0.3;
    return this.muted;
  }

  get isMuted() { return this.muted; }

  private play(fn: (ctx: AudioContext, dest: AudioNode) => void) {
    if (this.muted) return;
    try { fn(this.getCtx(), this.masterGain); } catch { /* ignore */ }
  }

  playShoot() {
    this.play((ctx, dest) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.connect(g); g.connect(dest);
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + 0.12);
      g.gain.setValueAtTime(0.25, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.13);
    });
  }

  playExplode(big = false) {
    this.play((ctx, dest) => {
      const bufSize = ctx.sampleRate * (big ? 0.6 : 0.25);
      const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1);
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const g = ctx.createGain();
      const filt = ctx.createBiquadFilter();
      filt.type = 'lowpass';
      filt.frequency.value = big ? 800 : 400;
      src.connect(filt); filt.connect(g); g.connect(dest);
      g.gain.setValueAtTime(big ? 0.8 : 0.4, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (big ? 0.6 : 0.25));
      src.start();
    });
  }

  playTractorBeam() {
    this.play((ctx, dest) => {
      const o1 = ctx.createOscillator();
      const o2 = ctx.createOscillator();
      const g = ctx.createGain();
      o1.connect(g); o2.connect(g); g.connect(dest);
      o1.type = 'sine'; o1.frequency.value = 120;
      o2.type = 'sine'; o2.frequency.value = 123;
      g.gain.setValueAtTime(0.3, ctx.currentTime);
      g.gain.setValueAtTime(0, ctx.currentTime + 2.5);
      o1.start(); o2.start();
      o1.stop(ctx.currentTime + 2.5); o2.stop(ctx.currentTime + 2.5);
    });
  }

  playCapture() {
    this.play((ctx, dest) => {
      const notes = [440, 330, 220, 165];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.connect(g); g.connect(dest);
        osc.type = 'square'; osc.frequency.value = freq;
        const t = ctx.currentTime + i * 0.18;
        g.gain.setValueAtTime(0.3, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.17);
        osc.start(t); osc.stop(t + 0.18);
      });
    });
  }

  playRescue() {
    this.play((ctx, dest) => {
      const notes = [220, 330, 440, 660, 880];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.connect(g); g.connect(dest);
        osc.type = 'square'; osc.frequency.value = freq;
        const t = ctx.currentTime + i * 0.1;
        g.gain.setValueAtTime(0.3, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
        osc.start(t); osc.stop(t + 0.1);
      });
    });
  }

  playStageStart() {
    this.play((ctx, dest) => {
      // Classic Galaga stage start jingle approximation
      const melody = [
        { f: 523, d: 0.1 }, { f: 659, d: 0.1 }, { f: 784, d: 0.1 },
        { f: 1047, d: 0.15 }, { f: 784, d: 0.1 }, { f: 1047, d: 0.25 }
      ];
      let t = ctx.currentTime + 0.05;
      for (const { f, d } of melody) {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.connect(g); g.connect(dest);
        osc.type = 'square'; osc.frequency.value = f;
        g.gain.setValueAtTime(0.25, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + d - 0.01);
        osc.start(t); osc.stop(t + d);
        t += d;
      }
    });
  }

  playChallengingStage() {
    this.play((ctx, dest) => {
      const melody = [
        { f: 784, d: 0.1 }, { f: 784, d: 0.1 }, { f: 784, d: 0.1 },
        { f: 659, d: 0.15 }, { f: 523, d: 0.1 }, { f: 659, d: 0.1 },
        { f: 784, d: 0.25 }
      ];
      let t = ctx.currentTime + 0.05;
      for (const { f, d } of melody) {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.connect(g); g.connect(dest);
        osc.type = 'square'; osc.frequency.value = f;
        g.gain.setValueAtTime(0.25, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + d - 0.01);
        osc.start(t); osc.stop(t + d);
        t += d;
      }
    });
  }

  playGameOver() {
    this.play((ctx, dest) => {
      const notes = [440, 415, 392, 370, 349, 330, 311, 294];
      let t = ctx.currentTime + 0.05;
      for (const f of notes) {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.connect(g); g.connect(dest);
        osc.type = 'square'; osc.frequency.value = f;
        g.gain.setValueAtTime(0.3, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
        osc.start(t); osc.stop(t + 0.13);
        t += 0.13;
      }
    });
  }

  playDiveSiren() {
    this.play((ctx, dest) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.connect(g); g.connect(dest);
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(300, ctx.currentTime);
      osc.frequency.setValueAtTime(200, ctx.currentTime + 0.15);
      osc.frequency.setValueAtTime(300, ctx.currentTime + 0.3);
      g.gain.setValueAtTime(0.15, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.36);
    });
  }

  playEnemyFire() {
    this.play((ctx, dest) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.connect(g); g.connect(dest);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.2);
      g.gain.setValueAtTime(0.12, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.21);
    });
  }

  playChallengeBonus() {
    this.play((ctx, dest) => {
      const notes = [523, 659, 784, 1047, 1047, 1047];
      let t = ctx.currentTime + 0.05;
      for (const f of notes) {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.connect(g); g.connect(dest);
        osc.type = 'square'; osc.frequency.value = f;
        g.gain.setValueAtTime(0.3, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
        osc.start(t); osc.stop(t + 0.1);
        t += 0.1;
      }
    });
  }
}
