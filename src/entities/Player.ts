import { renderSprite } from '../graphics/PixelRenderer';
import type { AudioManager } from '../core/AudioManager';
import type { InputManager } from '../core/InputManager';
import type { Bullet } from './Bullet';
import { Bullet as BulletClass } from './Bullet';

export type PlayerState = 'alive' | 'dying' | 'dead' | 'captured' | 'respawning';

// Movement boundaries (pixels from each edge)
const MARGIN_LEFT  = 0;
const MARGIN_RIGHT = 0;
const MARGIN_TOP   = 24;   // don't go into the HUD
const MARGIN_BOTTOM = 30;  // stay near the bottom third

export class Player {
  x: number;
  y: number;
  w = 16;
  h = 16;
  speed = 2.0;
  state: PlayerState = 'alive';
  isDual = false;

  // Shooting — auto-fire when button held
  private fireTimer = 0;
  private readonly FIRE_COOLDOWN = 0.20;  // seconds between shots when held
  private readonly MAX_BULLETS_SINGLE = 3;
  private readonly MAX_BULLETS_DUAL = 5;

  // Death
  private deathTimer = 0;
  private readonly DEATH_DUR = 2.0;

  // Respawn & Invulnerability
  private respawnTimer = 0;
  private readonly RESPAWN_DUR = 1.2;
  private blinkTimer = 0;
  private visible = true;
  private invulnerableTimer = 0;
  private readonly INVULNERABLE_DUR = 3.0; // 3 seconds invulnerability after spawn

  constructor(
    startX: number,
    startY: number,
    private audio: AudioManager,
    private screenW: number = 224,
    private screenH: number = 288
  ) {
    this.x = startX - this.w / 2;
    this.y = startY;
    this.invulnerableTimer = this.INVULNERABLE_DUR;
  }

  get cx() { return this.x + this.w / 2; }
  get cy() { return this.y + this.h / 2; }
  get isInvulnerable() { return this.invulnerableTimer > 0; }

  update(dt: number, input: InputManager, bullets: Bullet[], screenW: number, screenH: number = 288) {
    if (this.state === 'dying') {
      this.deathTimer += dt;
      if (this.deathTimer >= this.DEATH_DUR) this.state = 'dead';
      return;
    }

    if (this.invulnerableTimer > 0) {
      this.invulnerableTimer -= dt;
      this.blinkTimer += dt;
      if (this.blinkTimer >= 0.08) {
        this.blinkTimer = 0;
        this.visible = !this.visible;
      }
      if (this.invulnerableTimer <= 0) {
        this.invulnerableTimer = 0;
        this.visible = true;
      }
    } else {
      this.visible = true;
    }

    if (this.state === 'respawning') {
      this.respawnTimer += dt;
      if (this.respawnTimer >= this.RESPAWN_DUR) {
        this.state = 'alive';
      }
    }

    if (this.state !== 'alive' && this.state !== 'respawning') return;

    // ── 4-directional movement (immediate responsiveness!) ──────
    const moveX = (input.isLeft ? -1 : 0) + (input.isRight ? 1 : 0);
    const moveY = (input.isUp   ? -1 : 0) + (input.isDown  ? 1 : 0);
    const spd = this.isDual ? this.speed * 1.1 : this.speed;

    this.x += moveX * spd * dt * 60;
    this.y += moveY * spd * dt * 60;

    // Clamp to playfield
    const maxX = screenW - (this.isDual ? this.w + 8 : this.w) - MARGIN_RIGHT;
    this.x = Math.max(MARGIN_LEFT, Math.min(this.x, maxX));

    // Vertical: allow movement in the lower 60% of screen
    const minY = screenH * 0.38 + MARGIN_TOP;
    const maxY = screenH - this.h - MARGIN_BOTTOM;
    this.y = Math.max(minY, Math.min(this.y, maxY));

    // ── Auto-fire: shoot whenever button is held, respecting cooldown ──
    this.fireTimer += dt;
    const maxBullets = this.isDual ? this.MAX_BULLETS_DUAL : this.MAX_BULLETS_SINGLE;
    const playerBullets = bullets.filter(b => b.owner === 'player' && b.active).length;

    if (input.isFiring && this.fireTimer >= this.FIRE_COOLDOWN && playerBullets < maxBullets) {
      this.fireTimer = 0;
      this.shoot(bullets);
    }

    // Consume a just-pressed event to reset cooldown immediately on first press
    if (input.consumeFireJustPressed()) {
      if (playerBullets < maxBullets) {
        this.fireTimer = this.FIRE_COOLDOWN; // fire immediately next frame
      }
    }
  }

  private shoot(bullets: Bullet[]) {
    this.audio.playShoot();
    if (this.isDual) {
      bullets.push(new BulletClass(this.cx - 6, this.y,          0, -4, 'player'));
      bullets.push(new BulletClass(this.cx + 6, this.y,          0, -4, 'player'));
      bullets.push(new BulletClass(this.cx + this.w + 2, this.y, 0, -4, 'player'));
    } else {
      bullets.push(new BulletClass(this.cx, this.y, 0, -4, 'player'));
    }
  }

  die() {
    if (this.state !== 'alive' && this.state !== 'respawning') return;
    if (this.isInvulnerable) return;
    this.state = 'dying';
    this.deathTimer = 0;
  }

  respawn(x: number, y: number) {
    this.x = x - this.w / 2;
    this.y = y;
    this.state = 'respawning';
    this.respawnTimer = 0;
    this.blinkTimer = 0;
    this.invulnerableTimer = this.INVULNERABLE_DUR;
    this.visible = true;
    this.isDual = false;
  }

  activateDual() { this.isDual = true; }

  capturePlayer() { this.state = 'captured'; }

  draw(ctx: CanvasRenderingContext2D) {
    if (!this.visible) return;
    if (this.state === 'dead' || this.state === 'captured') return;
    if (this.isDual) {
      renderSprite('player', ctx, Math.floor(this.x),          Math.floor(this.y), 1);
      renderSprite('player', ctx, Math.floor(this.x + this.w + 8), Math.floor(this.y), 1);
    } else {
      renderSprite('player', ctx, Math.floor(this.x), Math.floor(this.y), 1);
    }
  }
}
