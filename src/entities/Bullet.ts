import { renderSprite } from '../graphics/PixelRenderer';
import type { AudioManager } from '../core/AudioManager';

export type BulletOwner = 'player' | 'enemy';

export class Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  owner: BulletOwner;
  active = true;
  w = 3;
  h = 8;

  constructor(x: number, y: number, vx: number, vy: number, owner: BulletOwner) {
    this.x = x - 1;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.owner = owner;
  }

  update(dt: number, screenH: number) {
    this.x += this.vx * dt * 60;
    this.y += this.vy * dt * 60;
    if (this.y < -20 || this.y > screenH + 20) this.active = false;
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (!this.active) return;
    if (this.owner === 'player') {
      renderSprite('missile', ctx, Math.floor(this.x), Math.floor(this.y), 1);
    } else {
      renderSprite('alien_bomb', ctx, Math.floor(this.x), Math.floor(this.y), 1);
    }
  }
}
