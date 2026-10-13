export class Starfield {
  private stars: Array<{ x: number; y: number; speed: number; brightness: number; size: number }> = [];

  constructor(private w: number, private h: number, count = 80) {
    for (let i = 0; i < count; i++) {
      this.stars.push({
        x: Math.random() * w,
        y: Math.random() * h,
        speed: 0.3 + Math.random() * 0.9,
        brightness: 0.3 + Math.random() * 0.7,
        size: Math.random() < 0.1 ? 2 : 1
      });
    }
  }

  update(dt: number) {
    for (const s of this.stars) {
      s.y += s.speed * dt * 60;
      if (s.y > this.h) {
        s.y = 0;
        s.x = Math.random() * this.w;
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    for (const s of this.stars) {
      const alpha = s.brightness;
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.fillRect(Math.floor(s.x), Math.floor(s.y), s.size, s.size);
    }
  }
}
