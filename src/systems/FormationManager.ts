import { Enemy } from '../entities/Enemy';
import type { AudioManager } from '../core/AudioManager';

// Formation grid: 5 rows x 10 cols = 50 enemies
// Row types (bottom to top): 0-1 = boss, 2-3 = butterfly, 4-5 = bee
const FORMATION_ROWS = 5;
const FORMATION_COLS = 10;
const SLOT_W = 18;
const SLOT_H = 16;
const FORM_LEFT = 15;
const FORM_TOP = 45;

// Breathing animation
const BREATH_AMP = 4; // px horizontal
const BREATH_SPEED = 0.5; // radians per second

export type WaveEntry = {
  type: 'bee' | 'butterfly' | 'boss';
  slot: { row: number; col: number };
  entryFrom: 'left' | 'right' | 'top';
  delay: number;
};

export class FormationManager {
  enemies: Enemy[] = [];
  breathPhase = 0;

  private allEntered = false;
  private waveQueue: WaveEntry[] = [];
  private waveTimer = 0;
  private spawnedCount = 0;

  constructor(
    private screenW: number,
    private screenH: number,
    private audio: AudioManager
  ) {}

  buildStageWaves(stage: number): WaveEntry[] {
    const entries: WaveEntry[] = [];
    let delay = 0;
    const delayStep = 0.18;

    // Wave 1: Bees from left (10 bees, rows 3-4)
    for (let c = 0; c < FORMATION_COLS; c++) {
      entries.push({ type: 'bee', slot: { row: 4, col: c }, entryFrom: c < 5 ? 'left' : 'right', delay });
      delay += delayStep;
    }
    // Wave 2: Bees rows 3
    delay += 0.3;
    for (let c = 0; c < FORMATION_COLS; c++) {
      entries.push({ type: 'bee', slot: { row: 3, col: c }, entryFrom: c < 5 ? 'right' : 'left', delay });
      delay += delayStep;
    }
    // Wave 3: Butterflies rows 2
    delay += 0.5;
    for (let c = 0; c < FORMATION_COLS; c++) {
      entries.push({ type: 'butterfly', slot: { row: 2, col: c }, entryFrom: 'top', delay });
      delay += delayStep;
    }
    // Wave 4: Butterflies rows 1
    delay += 0.5;
    for (let c = 0; c < FORMATION_COLS; c++) {
      entries.push({ type: 'butterfly', slot: { row: 1, col: c }, entryFrom: 'top', delay });
      delay += delayStep;
    }
    // Wave 5: Bosses row 0
    delay += 0.6;
    for (let c = 0; c < FORMATION_COLS; c++) {
      entries.push({ type: 'boss', slot: { row: 0, col: c }, entryFrom: c % 2 === 0 ? 'left' : 'right', delay });
      delay += delayStep * 1.5;
    }

    return entries;
  }

  getSlotPos(row: number, col: number, breathOffset = 0): { x: number; y: number } {
    const x = FORM_LEFT + col * SLOT_W + breathOffset;
    const y = FORM_TOP + row * SLOT_H;
    return { x, y };
  }

  init(stage: number) {
    this.enemies = [];
    this.allEntered = false;
    this.breathPhase = 0;
    this.spawnedCount = 0;
    this.waveTimer = 0;
    this.waveQueue = this.buildStageWaves(stage);
  }

  update(dt: number) {
    this.breathPhase += BREATH_SPEED * dt;
    const breathOffset = Math.sin(this.breathPhase) * BREATH_AMP;

    // Spawn enemies from queue
    if (this.spawnedCount < this.waveQueue.length) {
      this.waveTimer += dt;
      while (this.spawnedCount < this.waveQueue.length && this.waveTimer >= this.waveQueue[this.spawnedCount].delay) {
        this.spawnEnemy(this.waveQueue[this.spawnedCount]);
        this.spawnedCount++;
      }
    }

    // Update slot positions with breathing
    for (const e of this.enemies) {
      if (!e.active) continue;
      const { x, y } = this.getSlotPos(e.row, e.col, breathOffset);
      e.slotX = x;
      e.slotY = y;
    }

    // Check all entered
    if (!this.allEntered && this.spawnedCount >= this.waveQueue.length) {
      this.allEntered = this.enemies.every(e => !e.active || e.state !== 'entering');
    }
  }

  get isAllEntered() { return this.allEntered; }
  get activeCount() { return this.enemies.filter(e => e.active).length; }

  private spawnEnemy(entry: WaveEntry) {
    const { x: sx, y: sy } = this.getSlotPos(entry.slot.row, entry.slot.col);
    let startX: number, startY: number;

    switch (entry.entryFrom) {
      case 'left':  startX = -20; startY = 20 + Math.random() * 40; break;
      case 'right': startX = this.screenW + 20; startY = 20 + Math.random() * 40; break;
      case 'top':   startX = 30 + Math.random() * (this.screenW - 60); startY = -20; break;
    }

    const e = new Enemy(entry.type, startX!, startY!, entry.slot.row, entry.slot.col, this.audio);
    e.slotX = sx;
    e.slotY = sy;

    // Build entry bezier path
    const midX = (startX! + sx) / 2 + (Math.random() - 0.5) * 50;
    const midY = entry.entryFrom === 'top' ? 60 + Math.random() * 30 : sy * 0.5;

    e.addPath({
      pts: [startX!, startY!, midX, midY, midX, midY, sx, sy],
      dur: 1.2 + Math.random() * 0.4
    });

    this.enemies.push(e);
  }

  triggerDive(playerX: number, playerY: number, stage: number) {
    if (!this.allEntered) return;

    const candidates = this.enemies.filter(e => e.active && e.state === 'formation');
    if (candidates.length === 0) return;

    // ── Difficulty scaling by stage ────────────────────────────────────────
    // Stage 1-2: only 1 bee at a time, no boss dives
    // Stage 3-5: up to 2 enemies, boss possible but no escort
    // Stage 6-9: up to 3 enemies, boss with 1 escort
    // Stage 10+: boss with 2 escorts (full difficulty)
    const bossChance   = stage <= 2 ? 0    : stage <= 5 ? 0.10 : stage <= 9 ? 0.20 : 0.30;
    const maxGroupSize = stage <= 2 ? 1    : stage <= 5 ? 2    : stage <= 9 ? 3    : 3;
    const maxEscorts   = stage <= 5 ? 0    : stage <= 9 ? 1    : 2;

    const bosses = candidates.filter(e => e.type === 'boss');
    if (bosses.length > 0 && Math.random() < bossChance) {
      const boss = bosses[Math.floor(Math.random() * bosses.length)];
      boss.startDive(playerX, playerY, this.screenH, this.screenW);

      if (maxEscorts > 0) {
        const butterflies = candidates.filter(e => e.type === 'butterfly');
        const numEscort = Math.min(maxEscorts, butterflies.length);
        for (let i = 0; i < numEscort; i++) {
          butterflies[i].startDive(playerX + (i === 0 ? -20 : 20), playerY, this.screenH, this.screenW);
        }
      }
    } else {
      // Bees dive in early stages; butterflies added later
      const pool = stage <= 5
        ? candidates.filter(e => e.type === 'bee')
        : candidates;
      const src = pool.length > 0 ? pool : candidates;
      const count = 1 + Math.floor(Math.random() * Math.min(maxGroupSize, src.length));
      for (let i = 0; i < count; i++) {
        const rem = src.filter(e => e.active && e.state === 'formation');
        if (rem.length === 0) break;
        const idx = Math.floor(Math.random() * rem.length);
        rem[idx].startDive(playerX, playerY, this.screenH, this.screenW);
      }
    }
  }

  tryTractorBeam(playerX: number, playerY: number): Enemy | null {
    const bosses = this.enemies.filter(e => e.active && e.type === 'boss' && e.state === 'diving' && !e.tractorActive);
    if (bosses.length === 0) return null;
    const boss = bosses[0];
    // Boss must be near mid-screen
    if (boss.y < 80 || boss.y > 180) return null;
    if (Math.abs(boss.x + 8 - playerX) > 40) return null;
    boss.tractorActive = true;
    boss.tractorY = playerY;
    return boss;
  }
}
