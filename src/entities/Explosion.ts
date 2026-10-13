import { renderSprite } from '../graphics/PixelRenderer';

export type ExplosionFrame = 'exp_1' | 'exp_2' | 'exp_3' | 'exp_4';
const FRAMES: ExplosionFrame[] = ['exp_1', 'exp_2', 'exp_3', 'exp_4'];
const FRAME_DUR = 0.08; // seconds per frame

export class Explosion {
  active = true;
  private frame = 0;
  private timer = 0;
  private size: number;

  constructor(public cx: number, public cy: number, big = false) {
    this.size = big ? 2 : 1;
    this.frame = big ? 1 : 0;
  }

  update(dt: number) {
    this.timer += dt;
    if (this.timer >= FRAME_DUR) {
      this.timer -= FRAME_DUR;
      this.frame++;
      if (this.frame >= FRAMES.length) this.active = false;
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (!this.active || this.frame >= FRAMES.length) return;
    const name = FRAMES[this.frame];
    // Frame dims
    const dims: Record<string, number> = { exp_1: 8, exp_2: 12, exp_3: 16, exp_4: 16 };
    const s = dims[name] * this.size;
    renderSprite(name, ctx, Math.floor(this.cx - s / 2), Math.floor(this.cy - s / 2), this.size);
  }
}
