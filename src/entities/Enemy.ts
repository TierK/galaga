import { renderSprite } from '../graphics/PixelRenderer';
import type { Bullet } from './Bullet';
import { Bullet as BulletClass } from './Bullet';
import type { AudioManager } from '../core/AudioManager';

export type EnemyType = 'bee' | 'butterfly' | 'boss';
export type EnemyState = 'entering' | 'formation' | 'diving' | 'tractor' | 'dead';

// Points table
const POINTS: Record<EnemyType, { formation: number; diving: number }> = {
  bee:       { formation: 50,  diving: 100 },
  butterfly: { formation: 80,  diving: 160 },
  boss:      { formation: 150, diving: 400 }
};

// Points for destroying boss while in tractor beam mode
const TRACTOR_BONUS = 1600;

// Bezier helper
function bezier3(t: number, p0: number, p1: number, p2: number, p3: number) {
  const u = 1 - t;
  return u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3;
}

export interface EnemyPath {
  pts: [number, number, number, number, number, number, number, number]; // x0,y0,cx0,cy0,cx1,cy1,x1,y1
  dur: number;
}

export class Enemy {
  x: number;
  y: number;
  w = 16;
  h = 16;
  hp: number;
  state: EnemyState = 'entering';
  active = true;

  // Formation slot
  slotX = 0;
  slotY = 0;

  // Entry path
  private paths: EnemyPath[] = [];
  private pathIndex = 0;
  private pathT = 0;

  // Formation breathing
  formBreathPhase = 0;

  // Dive path
  private divePts: number[] = [];
  private diveT = 0;
  private diveSpeed = 0.5;
  private diveReturnX = 0;
  private diveReturnY = 0;

  // Shooting
  private shootTimer = 0;
  private readonly SHOOT_INTERVAL = 2.5;

  // Animation
  private animTimer = 0;
  private animFrame = 0;

  // Tractor beam (boss only)
  tractorActive = false;
  tractorY = 0;

  // Escort linking
  escort: Enemy | null = null;

  constructor(
    public type: EnemyType,
    startX: number,
    startY: number,
    public row: number,
    public col: number,
    private audio: AudioManager
  ) {
    this.x = startX;
    this.y = startY;
    this.hp = type === 'boss' ? 2 : 1;
  }

  addPath(p: EnemyPath) { this.paths.push(p); }

  get points() {
    if (this.state === 'diving') {
      if (this.tractorActive) return TRACTOR_BONUS;
      return POINTS[this.type].diving;
    }
    return POINTS[this.type].formation;
  }

  update(dt: number, screenW: number, screenH: number, bullets: Bullet[], playerX: number, playerY: number, stage: number) {
    if (!this.active) return;
    this.animTimer += dt;
    if (this.animTimer >= 0.25) { this.animTimer = 0; this.animFrame ^= 1; }

    switch (this.state) {
      case 'entering': this.updateEntering(dt); break;
      case 'formation': this.updateFormation(dt, bullets, playerX, playerY, screenW, stage); break;
      case 'diving': this.updateDiving(dt, screenW, screenH, bullets, playerX, playerY); break;
    }
  }

  private updateEntering(dt: number) {
    if (this.pathIndex >= this.paths.length) {
      this.state = 'formation';
      this.x = this.slotX;
      this.y = this.slotY;
      return;
    }
    const p = this.paths[this.pathIndex];
    this.pathT += dt / p.dur;
    if (this.pathT >= 1) {
      this.pathT = 1;
      this.pathIndex++;
    }
    const t = this.pathT;
    this.x = bezier3(t, p.pts[0], p.pts[2], p.pts[4], p.pts[6]);
    this.y = bezier3(t, p.pts[1], p.pts[3], p.pts[5], p.pts[7]);
  }

  private updateFormation(dt: number, bullets: Bullet[], playerX: number, playerY: number, screenW: number, stage: number) {
    // Breathe: formation oscillates handled by FormationManager, we just read slotX/slotY
    this.x = this.slotX;
    this.y = this.slotY;

    // Shooting from formation
    if (this.type !== 'boss') {
      this.shootTimer += dt;
      const interval = Math.max(1.0, this.SHOOT_INTERVAL - stage * 0.08);
      if (this.shootTimer >= interval && Math.random() < 0.1) {
        this.shootTimer = 0;
        if (Math.random() < 0.3) {
          this.audio.playEnemyFire();
          const angle = Math.atan2(playerY - this.y, playerX - this.x);
          const speed = 1.5 + stage * 0.05;
          bullets.push(new BulletClass(this.x + 8, this.y + 8, Math.cos(angle) * speed, Math.sin(angle) * speed, 'enemy'));
        }
      }
    }
  }

  startDive(targetX: number, targetY: number, screenH: number, screenW: number) {
    this.state = 'diving';
    this.diveT = 0;
    this.audio.playDiveSiren();
    // Build a swooping dive path: down and toward player, then loop back up
    const midX = (this.x + targetX) / 2 + (Math.random() - 0.5) * 60;
    const midY = targetY + 40;
    this.divePts = [
      this.x, this.y,
      midX, midY,
      targetX + (Math.random() - 0.5) * 40, screenH + 30,
      targetX, -30
    ];
  }

  private updateDiving(dt: number, screenW: number, screenH: number, bullets: Bullet[], playerX: number, playerY: number) {
    this.diveT += dt * this.diveSpeed;
    const t = Math.min(this.diveT, 1.0);
    const [x0, y0, cx0, cy0, cx1, cy1, x1, y1] = this.divePts;
    this.x = bezier3(t, x0, cx0, cx1, x1);
    this.y = bezier3(t, y0, cy0, cy1, y1);

    // Shooting during dive
    this.shootTimer += dt;
    if (this.shootTimer >= 0.8 && Math.random() < 0.15) {
      this.shootTimer = 0;
      this.audio.playEnemyFire();
      const angle = Math.atan2(playerY - this.y, playerX - this.x);
      const speed = 2.0;
      bullets.push(new BulletClass(this.x + 8, this.y + 8, Math.cos(angle) * speed, Math.sin(angle) * speed, 'enemy'));
    }

    if (this.diveT >= 1.0) {
      // Return to formation
      this.state = 'formation';
      this.diveT = 0;
      this.x = this.slotX;
      this.y = this.slotY;
    }
  }

  hit(): boolean {
    this.hp--;
    if (this.hp <= 0) {
      this.active = false;
      this.state = 'dead';
      return true;
    }
    return false;
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (!this.active) return;
    const f = this.animFrame;

    switch (this.type) {
      case 'bee':
        renderSprite(f === 0 ? 'bee_1' : 'bee_2', ctx, Math.floor(this.x), Math.floor(this.y), 1);
        break;
      case 'butterfly':
        renderSprite(f === 0 ? 'butterfly_1' : 'butterfly_2', ctx, Math.floor(this.x), Math.floor(this.y), 1);
        break;
      case 'boss':
        if (this.hp === 2) {
          renderSprite(f === 0 ? 'boss_green_1' : 'boss_green_2', ctx, Math.floor(this.x), Math.floor(this.y), 1);
        } else {
          renderSprite(f === 0 ? 'boss_blue_1' : 'boss_blue_2', ctx, Math.floor(this.x), Math.floor(this.y), 1);
        }
        // Draw tractor beam if active
        if (this.tractorActive) {
          this.drawTractorBeam(ctx);
        }
        break;
    }
  }

  private drawTractorBeam(ctx: CanvasRenderingContext2D) {
    const bx = this.x + this.w / 2;
    const by = this.y + this.h;
    const beamW = 20 + Math.sin(Date.now() / 100) * 4;
    const beamH = this.tractorY - by;
    if (beamH <= 0) return;

    // Pulsing gradient beam
    const grad = ctx.createLinearGradient(bx, by, bx, by + beamH);
    const pulse = 0.3 + Math.sin(Date.now() / 60) * 0.2;
    grad.addColorStop(0, `rgba(0, 229, 255, ${pulse})`);
    grad.addColorStop(0.5, `rgba(0, 100, 255, ${pulse * 0.6})`);
    grad.addColorStop(1, 'rgba(0, 229, 255, 0)');

    ctx.save();
    ctx.fillStyle = grad;
    ctx.fillRect(bx - beamW / 2, by, beamW, beamH);

    // Undulating wave lines
    ctx.strokeStyle = `rgba(0, 229, 255, ${pulse})`;
    ctx.lineWidth = 1;
    for (let yi = 0; yi < beamH; yi += 8) {
      const waveX = Math.sin((yi + Date.now() / 80) * 0.4) * (beamW / 3);
      ctx.beginPath();
      ctx.moveTo(bx + waveX - 3, by + yi);
      ctx.lineTo(bx + waveX + 3, by + yi);
      ctx.stroke();
    }
    ctx.restore();
  }
}
