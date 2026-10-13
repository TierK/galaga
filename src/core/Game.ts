import type { AudioManager } from './AudioManager';
import type { InputManager } from './InputManager';
import { Starfield } from '../entities/Starfield';
import { Player } from '../entities/Player';
import { Bullet } from '../entities/Bullet';
import { Explosion } from '../entities/Explosion';
import { FormationManager } from '../systems/FormationManager';
import { ScoreManager } from '../systems/ScoreManager';
import { preloadSprites } from '../graphics/PixelRenderer';
import type { Enemy } from '../entities/Enemy';
import { renderSprite } from '../graphics/PixelRenderer';

type GameState =
  | 'attract'
  | 'stage_intro'
  | 'entering'
  | 'combat'
  | 'challenging_intro'
  | 'challenging'
  | 'stage_clear'
  | 'player_dying'
  | 'player_dead'
  | 'game_over'
  | 'accuracy_report'
  | 'high_score_entry'
  | 'paused';

const W = 224;
const H = 288;
const PLAYER_START_X = W / 2;
const PLAYER_START_Y = H - 28;

const BADGE_STAGES: Record<number, string> = {
  1: 'badge_1', 5: 'badge_5', 10: 'badge_10', 20: 'badge_20', 30: 'badge_30', 50: 'badge_50'
};

export class Game {
  private state: GameState = 'attract';
  private prevState: GameState = 'attract';
  isPaused = false;
  private lastTime = 0;

  private starfield: Starfield;
  private player!: Player;
  private bullets: Bullet[] = [];
  private explosions: Explosion[] = [];
  private formation!: FormationManager;
  private score: ScoreManager;

  private stage = 1;
  private lives = 3;
  private stateTimer = 0;
  private attractTimer = 0;
  private attractBlink = true;
  private attractBlinkTimer = 0;

  // Dive timing
  private diveTimer = 0;
  private diveInterval = 3.0;

  // Tractor beam
  private tractorBoss: Enemy | null = null;
  private tractorTimer = 0;
  private capturedFighterX = 0;
  private capturedFighterY = 0;
  private capturedFighterDescent = 0;
  private hasCapturedFighter = false;
  private capturedFighterDocking = false;
  private capturedFighterSprite = 0;

  // Challenging stage
  private challengingEnemies: Array<{ x: number; y: number; vx: number; vy: number; t: 'bee' | 'butterfly'; active: boolean }> = [];
  private challengingHit = 0;
  private challengingTotal = 40;
  private challengingTimer = 0;
  private challengingWave = 0;

  // Stage clear
  private stageClearTimer = 0;
  private stagePoints = 0;

  // Game over / accuracy
  private goTimer = 0;
  private accuracyPage = 0;
  private accuracyTimer = 0;

  // High score entry
  private playerInitials = ['A', 'A', 'A'];
  private initialsPos = 0;
  private initialsFlash = true;
  private initialsTimer = 0;

  // Debug
  private godMode = false;

  constructor(
    private canvas: HTMLCanvasElement,
    private ctx: CanvasRenderingContext2D,
    private audio: AudioManager,
    private input: InputManager
  ) {
    this.starfield = new Starfield(W, H);
    this.score = new ScoreManager();
    this.formation = new FormationManager(W, H, audio);
    preloadSprites(1);
  }

  start() {
    this.lastTime = performance.now();
    requestAnimationFrame((t) => this.loop(t));
  }

  private loop(now: number) {
    const dt = Math.min((now - this.lastTime) / 1000, 0.05);
    this.lastTime = now;
    this.input.update();
    this.update(dt);
    this.draw();
    requestAnimationFrame((t) => this.loop(t));
  }

  // ─────────────────────────────────────────
  // PUBLIC API (called from main.ts)
  // ─────────────────────────────────────────

  togglePause() {
    if (this.state === 'paused') {
      this.state = this.prevState;
      this.isPaused = false;
    } else if (['combat', 'entering', 'challenging'].includes(this.state)) {
      this.prevState = this.state;
      this.state = 'paused';
      this.isPaused = true;
    }
  }

  restart() {
    this.stage = 1;
    this.lives = 3;
    this.score.reset();
    this.bullets = [];
    this.explosions = [];
    this.tractorBoss = null;
    this.hasCapturedFighter = false;
    this.isPaused = false;
    this.goToState('attract');
  }

  debug(action: string): boolean | void {
    switch (action) {
      case 'tractorBeam':
        if (this.state === 'combat' && this.player && this.player.state === 'alive') {
          this.startTractorCapture();
        }
        break;
      case 'dualFighter':
        if (this.player && this.player.state === 'alive') {
          this.player.isDual = true;
        }
        break;
      case 'challengingStage':
        this.goToChallengingStage();
        break;
      case 'godMode':
        this.godMode = !this.godMode;
        return this.godMode;
      case 'nextStage':
        this.stage++;
        this.startStage();
        break;
      case 'addLife':
        this.lives++;
        break;
      case 'addScore':
        this.score.addScore(10000);
        break;
    }
  }

  // ─────────────────────────────────────────
  // STATE MACHINE
  // ─────────────────────────────────────────

  private goToState(s: GameState) {
    this.state = s;
    this.stateTimer = 0;
  }

  private update(dt: number) {
    this.starfield.update(dt);

    // Pause short-circuit
    if (this.input.isPauseJustPressed) {
      this.togglePause();
      return;
    }
    if (this.state === 'paused') return;

    switch (this.state) {
      case 'attract': this.updateAttract(dt); break;
      case 'stage_intro': this.updateStageIntro(dt); break;
      case 'entering':
      case 'combat': this.updateCombat(dt); break;
      case 'challenging_intro': this.updateChallengingIntro(dt); break;
      case 'challenging': this.updateChallenging(dt); break;
      case 'stage_clear': this.updateStageClear(dt); break;
      case 'player_dying': this.updatePlayerDying(dt); break;
      case 'player_dead': this.updatePlayerDead(dt); break;
      case 'game_over': this.updateGameOver(dt); break;
      case 'accuracy_report': this.updateAccuracyReport(dt); break;
      case 'high_score_entry': this.updateHighScoreEntry(dt); break;
    }
  }

  // ─── ATTRACT ───────────────────────────────
  private updateAttract(dt: number) {
    this.stateTimer += dt;
    this.attractBlinkTimer += dt;
    if (this.attractBlinkTimer >= 0.55) { this.attractBlinkTimer = 0; this.attractBlink = !this.attractBlink; }

    if (this.input.consumeFireJustPressed()) {
      this.score.reset();
      this.stage = 1;
      this.lives = 3;
      this.audio.playStageStart();
      this.goToState('stage_intro');
    }
  }

  // ─── STAGE INTRO ───────────────────────────
  private updateStageIntro(dt: number) {
    this.stateTimer += dt;
    if (this.stateTimer >= 2.0) {
      this.startStage();
    }
  }

  private startStage() {
    this.player = new Player(PLAYER_START_X, PLAYER_START_Y, this.audio);
    this.bullets = [];
    this.explosions = [];
    this.diveTimer = 0;
    // Stage 1: 7s between dives; Stage 2: 5.5s; Stage 3-5: 4s; Stage 6+: gradually down to 1.5s
    if (this.stage <= 1)      this.diveInterval = 7.0;
    else if (this.stage <= 2) this.diveInterval = 5.5;
    else if (this.stage <= 5) this.diveInterval = 4.0;
    else                       this.diveInterval = Math.max(1.5, 4.0 - (this.stage - 5) * 0.15);
    this.tractorBoss = null;
    this.hasCapturedFighter = false;
    this.formation.init(this.stage);
    this.goToState('entering');
  }

  // ─── ENTERING / COMBAT ─────────────────────
  private updateCombat(dt: number) {
    this.stateTimer += dt;

    this.player.update(dt, this.input, this.bullets, W, H);

    // Tick enemies
    for (const e of this.formation.enemies) {
      if (!e.active) continue;
      e.update(dt, W, H, this.bullets, this.player.cx, this.player.cy, this.stage);
    }
    this.formation.update(dt);

    // Update bullets
    for (const b of this.bullets) b.update(dt, H);

    // Update explosions
    for (const ex of this.explosions) ex.update(dt);

    // Tractor beam update
    if (this.tractorBoss) this.updateTractor(dt);

    // Dive trigger
    if (this.state === 'combat') {
      this.diveTimer += dt;
      if (this.diveTimer >= this.diveInterval) {
        this.diveTimer = 0;
        const minInterval = this.stage <= 1 ? 4.5 : this.stage <= 2 ? 3.5 : 1.5;
        this.diveInterval = Math.max(minInterval, this.diveInterval * 0.98);
        this.formation.triggerDive(this.player.cx, this.player.cy, this.stage);
      }
    }

    // Transition from entering → combat
    if (this.state === 'entering' && this.formation.isAllEntered) {
      this.goToState('combat');
    }

    // Collision: player bullets → enemies
    const playerBullets = this.bullets.filter(b => b.owner === 'player' && b.active);
    for (const b of playerBullets) {
      for (const e of this.formation.enemies) {
        if (!e.active || e.state === 'dead') continue;
        if (this.rectsOverlap(b.x, b.y, b.w, b.h, e.x, e.y, e.w, e.h)) {
          b.active = false;
          this.score.recordHit();
          const killed = e.hit();
          if (killed) {
            this.explosions.push(new Explosion(e.x + 8, e.y + 8, e.type === 'boss'));
            this.score.addScore(e.points);
            this.audio.playExplode(e.type === 'boss');
            if (e.tractorActive) {
              e.tractorActive = false;
              this.tractorBoss = null;
            }
          }
        }
      }
    }

    // Collision: enemy bombs → player
    if ((this.player.state === 'alive' || this.player.state === 'respawning') && !this.godMode && !this.player.isInvulnerable) {
      const enemyBullets = this.bullets.filter(b => b.owner === 'enemy' && b.active);
      for (const b of enemyBullets) {
        if (this.rectsOverlap(b.x, b.y, b.w, b.h, this.player.x, this.player.y, this.player.w, this.player.h)) {
          b.active = false;
          this.killPlayer();
          break;
        }
      }

      // Enemy collision with player
      for (const e of this.formation.enemies) {
        if (!e.active || e.state !== 'diving') continue;
        if (this.rectsOverlap(e.x, e.y, e.w, e.h, this.player.x, this.player.y, this.player.w, this.player.h)) {
          e.active = false;
          this.killPlayer();
          break;
        }
      }
    }

    // Clean up
    this.bullets = this.bullets.filter(b => b.active);
    this.explosions = this.explosions.filter(e => e.active);

    // Stage clear
    if (this.state === 'combat' && this.formation.activeCount === 0 && this.explosions.length === 0) {
      this.goToStageClear();
    }
  }

  private killPlayer() {
    this.player.die();
    this.explosions.push(new Explosion(this.player.cx, this.player.cy, true));
    this.audio.playExplode(true);
    this.goToState('player_dying');
  }

  // ─── TRACTOR BEAM ──────────────────────────
  private startTractorCapture() {
    const boss = this.formation.enemies.find(e => e.active && e.type === 'boss' && e.state === 'diving');
    if (!boss) return;
    boss.tractorActive = true;
    boss.tractorY = this.player.cy;
    this.tractorBoss = boss;
    this.tractorTimer = 0;
    this.audio.playTractorBeam();
  }

  private updateTractor(dt: number) {
    if (!this.tractorBoss || !this.tractorBoss.active) {
      this.tractorBoss = null;
      return;
    }
    this.tractorBoss.tractorY = this.player.cy;
    this.tractorTimer += dt;

    // After 2.5 s, if boss is still active and player in beam, capture
    if (this.tractorTimer >= 2.5 && this.player.state === 'alive') {
      if (!this.godMode) {
        this.capturePlayer();
      }
    }
  }

  private capturePlayer() {
    if (!this.tractorBoss) return;
    this.hasCapturedFighter = true;
    this.capturedFighterX = this.player.cx;
    this.capturedFighterY = this.player.cy;
    this.capturedFighterDescent = 0;
    this.capturedFighterDocking = false;
    this.capturedFighterSprite = 0;
    this.tractorBoss.tractorActive = false;
    this.audio.playCapture();
    this.player.capturePlayer();

    // Use a life, spawn new player if lives remain
    this.lives--;
    if (this.lives > 0) {
      this.player = new Player(PLAYER_START_X, PLAYER_START_Y, this.audio);
      this.player.respawn(PLAYER_START_X, PLAYER_START_Y);
      // Mark state back to combat (player is respawning)
    } else {
      this.goToState('player_dead');
    }
    this.tractorBoss = null;
  }

  // ─── PLAYER DYING ──────────────────────────
  private updatePlayerDying(dt: number) {
    this.stateTimer += dt;
    this.player.update(dt, this.input, this.bullets, W, H);
    for (const ex of this.explosions) ex.update(dt);
    this.explosions = this.explosions.filter(e => e.active);

    if (this.stateTimer >= 1.8) {
      this.lives--;
      if (this.lives <= 0) {
        this.goToState('player_dead');
      } else {
        this.player.respawn(PLAYER_START_X, PLAYER_START_Y);
        this.bullets = [];
        this.goToState('combat');
      }
    }
  }

  private updatePlayerDead(dt: number) {
    this.stateTimer += dt;
    for (const ex of this.explosions) ex.update(dt);
    this.explosions = this.explosions.filter(e => e.active);
    if (this.stateTimer >= 1.8) {
      this.audio.playGameOver();
      this.goToState('game_over');
    }
  }

  // ─── GAME OVER ─────────────────────────────
  private updateGameOver(dt: number) {
    this.stateTimer += dt;
    if (this.stateTimer >= 3.0) {
      this.goToState('accuracy_report');
      this.accuracyTimer = 0;
    }
  }

  // ─── ACCURACY REPORT ───────────────────────
  private updateAccuracyReport(dt: number) {
    this.accuracyTimer += dt;
    if (this.accuracyTimer >= 4.5 || this.input.consumeFireJustPressed()) {
      if (this.score.isHighScore()) {
        this.initialsPos = 0;
        this.playerInitials = ['A', 'A', 'A'];
        this.goToState('high_score_entry');
      } else {
        this.goToState('attract');
      }
    }
  }

  // ─── HIGH SCORE ENTRY ──────────────────────
  private updateHighScoreEntry(dt: number) {
    this.initialsTimer += dt;
    if (this.initialsTimer >= 0.4) { this.initialsTimer = 0; this.initialsFlash = !this.initialsFlash; }

    if (this.input.consumeFireJustPressed()) {
      if (this.initialsPos < 2) {
        this.initialsPos++;
      } else {
        this.score.submitScore(this.playerInitials.join(''));
        this.goToState('attract');
      }
    }

    // Cycle letter with up/down
    if (this.input.isLeft) {
      this.cycleInitial(-1);
    } else if (this.input.isRight) {
      this.cycleInitial(1);
    }
  }

  private cycleInitial(dir: number) {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    const cur = letters.indexOf(this.playerInitials[this.initialsPos]);
    this.playerInitials[this.initialsPos] = letters[(cur + dir + 26) % 26];
  }

  // ─── STAGE CLEAR ───────────────────────────
  private goToStageClear() {
    this.stageClearTimer = 0;
    this.stagePoints = 0;
    this.goToState('stage_clear');
  }

  private updateStageClear(dt: number) {
    this.stageClearTimer += dt;
    if (this.stageClearTimer >= 2.5) {
      this.stage++;
      // Every 4 stages starting at 3: 3, 7, 11, 15...
      if ((this.stage - 1) % 4 === 2) {
        this.goToChallengingStage();
      } else {
        this.audio.playStageStart();
        this.goToState('stage_intro');
      }
    }
  }

  // ─── CHALLENGING STAGE ─────────────────────
  private goToChallengingStage() {
    this.challengingEnemies = [];
    this.challengingHit = 0;
    this.challengingTimer = 0;
    this.challengingWave = 0;
    this.player = new Player(PLAYER_START_X, PLAYER_START_Y, this.audio);
    this.bullets = [];
    this.explosions = [];
    this.audio.playChallengingStage();
    this.goToState('challenging_intro');
  }

  private updateChallengingIntro(dt: number) {
    this.stateTimer += dt;
    if (this.stateTimer >= 2.5) this.goToState('challenging');
  }

  private updateChallenging(dt: number) {
    this.challengingTimer += dt;

    // Spawn waves of 8 enemies at intervals
    const waveInterval = 1.2;
    const waveSize = 8;
    const totalWaves = Math.ceil(this.challengingTotal / waveSize);

    if (this.challengingWave < totalWaves && this.challengingTimer >= this.challengingWave * waveInterval + 0.5) {
      for (let i = 0; i < waveSize && this.challengingEnemies.length < this.challengingTotal; i++) {
        const fromLeft = this.challengingWave % 2 === 0;
        const vy = 1.5 + Math.random() * 1.0;
        const vx = (fromLeft ? 1 : -1) * (1.0 + Math.random() * 1.0);
        const sy = 20 + i * 20;
        const sx = fromLeft ? -20 : W + 20;
        const t: 'bee' | 'butterfly' = i % 2 === 0 ? 'bee' : 'butterfly';
        this.challengingEnemies.push({ x: sx, y: sy, vx, vy, t, active: true });
      }
      this.challengingWave++;
    }

    // Update challenging enemies
    for (const e of this.challengingEnemies) {
      if (!e.active) continue;
      e.x += e.vx * dt * 60;
      e.y += e.vy * dt * 60;
      if (e.x < -30 || e.x > W + 30 || e.y > H + 30) e.active = false;
    }

    // Player can shoot
    this.player.update(dt, this.input, this.bullets, W, H);
    for (const b of this.bullets) b.update(dt, H);
    for (const ex of this.explosions) ex.update(dt);

    // Bullet → enemy collisions
    const pb = this.bullets.filter(b => b.owner === 'player' && b.active);
    for (const b of pb) {
      for (const e of this.challengingEnemies) {
        if (!e.active) continue;
        if (this.rectsOverlap(b.x, b.y, 3, 8, e.x, e.y, 16, 16)) {
          b.active = false;
          e.active = false;
          this.challengingHit++;
          this.score.recordHit();
          const pts = 100 * (1 + Math.floor(this.challengingHit / 5));
          this.score.addScore(pts);
          this.explosions.push(new Explosion(e.x + 8, e.y + 8));
          this.audio.playExplode(false);
        }
      }
    }

    this.bullets = this.bullets.filter(b => b.active);
    this.explosions = this.explosions.filter(e => e.active);
    this.score.recordShot();

    // Stage ends when all waves have come and gone
    const allGone = this.challengingWave >= totalWaves && this.challengingEnemies.every(e => !e.active);
    if (allGone) {
      if (this.challengingHit === this.challengingTotal) {
        this.score.addScore(10000);
        this.audio.playChallengeBonus();
      }
      this.stage++;
      this.audio.playStageStart();
      this.goToState('stage_intro');
    }
  }

  // ─────────────────────────────────────────
  // DRAWING
  // ─────────────────────────────────────────

  private draw() {
    const ctx = this.ctx;
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, W, H);

    this.starfield.draw(ctx);

    switch (this.state) {
      case 'attract': this.drawAttract(); break;
      case 'stage_intro': this.drawStageIntro(); break;
      case 'entering':
      case 'combat':
      case 'player_dying':
      case 'player_dead': this.drawCombat(); break;
      case 'challenging_intro': this.drawChallengingIntro(); break;
      case 'challenging': this.drawChallenging(); break;
      case 'stage_clear': this.drawStageClear(); break;
      case 'game_over': this.drawGameOver(); break;
      case 'accuracy_report': this.drawAccuracyReport(); break;
      case 'high_score_entry': this.drawHighScoreEntry(); break;
      case 'paused': this.drawCombat(); this.drawPaused(); break;
    }
  }

  private drawHUD() {
    const ctx = this.ctx;

    // 1UP score
    this.drawText('1UP', 8, 8, '#ff2a2a', 6);
    this.drawText(String(this.score.score).padStart(6, '0'), 8, 16, '#ffffff', 6);

    // HIGH SCORE
    this.drawText('HI-SCORE', 72, 8, '#ff2a2a', 6);
    this.drawText(String(this.score.highScore).padStart(6, '0'), 84, 16, '#ffffff', 6);

    // Stage
    this.drawText(`STAGE ${this.stage}`, 152, 8, '#ffff00', 6);

    // Lives
    for (let i = 0; i < Math.max(0, this.lives - 1); i++) {
      renderSprite('player', ctx, 8 + i * 18, H - 20, 1);
    }

    // Stage badges bottom right
    this.drawStageBadges();
  }

  private drawStageBadges() {
    const ctx = this.ctx;
    let remaining = this.stage;
    let bx = W - 14;
    const by = H - 12;
    // Draw badges: 50, 30, 20, 10, 5, 1
    for (const [val, name] of Object.entries(BADGE_STAGES).reverse() as [string, string][]) {
      const v = parseInt(val);
      while (remaining >= v) {
        // draw small badge indicator (3px square)
        ctx.fillStyle = v >= 30 ? '#ff2a2a' : v >= 10 ? '#ffff00' : v >= 5 ? '#ffffff' : '#00e5ff';
        ctx.fillRect(bx, by, 4, 4);
        bx -= 6;
        remaining -= v;
      }
    }
  }

  private drawCombat() {
    this.drawHUD();
    this.player.draw(this.ctx);

    for (const e of this.formation.enemies) e.draw(this.ctx);
    for (const b of this.bullets) b.draw(this.ctx);
    for (const ex of this.explosions) ex.draw(this.ctx);

    // Captured fighter floating beside boss
    if (this.hasCapturedFighter && this.tractorBoss && this.tractorBoss.active) {
      this.capturedFighterSprite = (this.capturedFighterSprite + 1) % 8;
      renderSprite(this.capturedFighterSprite < 4 ? 'captured_player' : 'player', this.ctx,
        Math.floor(this.tractorBoss.x + 20), Math.floor(this.tractorBoss.y), 1);
    }
  }

  private drawAttract() {
    const ctx = this.ctx;

    // Title
    this.drawText('GALAGA', W / 2 - 30, 60, '#ff2a2a', 8);
    this.drawText('© 1981 NAMCO LTD.', W / 2 - 54, 88, '#ffff00', 6);

    // Demo enemies
    const t = performance.now() / 1000;
    const ex = W / 2 + Math.cos(t * 1.2) * 50;
    renderSprite('boss_green_1', ctx, Math.floor(ex - 8), 110, 1);
    renderSprite('butterfly_1', ctx, Math.floor(ex - 30), 130, 1);
    renderSprite('bee_1', ctx, Math.floor(ex + 18), 130, 1);

    // Score table
    this.drawText('---- SCORE TABLE ----', W / 2 - 64, 165, '#00e5ff', 6);
    this.drawText('BOSS GALAGA  400/1600', 20, 179, '#ffffff', 5);
    this.drawText('BUTTERFLY    160', 20, 191, '#ffffff', 5);
    this.drawText('BEE           100', 20, 203, '#ffffff', 5);

    // High scores
    this.drawText('-HIGH SCORES-', W / 2 - 40, 220, '#ff2a2a', 6);
    const board = this.score.getBoard().slice(0, 5);
    board.forEach((e, i) => {
      this.drawText(`${i + 1}. ${e.initials}  ${String(e.score).padStart(6, '0')}`, 40, 230 + i * 10, '#ffffff', 5);
    });

    if (this.attractBlink) {
      this.drawText('PRESS FIRE TO START', W / 2 - 58, H - 22, '#ffff00', 6);
    }
  }

  private drawStageIntro() {
    this.drawText(`STAGE ${this.stage}`, W / 2 - 28, H / 2 - 10, '#ffff00', 8);
  }

  private drawStageClear() {
    this.drawHUD();
    this.drawText('STAGE CLEAR!', W / 2 - 38, H / 2 - 10, '#00e5ff', 7);
  }

  private drawChallengingIntro() {
    this.drawText('CHALLENGING', W / 2 - 38, H / 2 - 18, '#ffff00', 7);
    this.drawText('STAGE', W / 2 - 18, H / 2, '#ffff00', 7);
  }

  private drawChallenging() {
    const ctx = this.ctx;
    this.drawHUD();

    // HIT count
    this.drawText(`HIT  ${this.challengingHit}`, W / 2 - 22, 28, '#00e5ff', 6);

    // Player and bullets
    this.player.draw(ctx);
    for (const e of this.challengingEnemies) {
      if (!e.active) continue;
      renderSprite(e.t === 'bee' ? 'bee_1' : 'butterfly_1', ctx, Math.floor(e.x), Math.floor(e.y), 1);
    }
    for (const b of this.bullets) b.draw(ctx);
    for (const ex of this.explosions) ex.draw(ctx);
  }

  private drawGameOver() {
    this.drawHUD();
    this.drawText('GAME OVER', W / 2 - 30, H / 2 - 10, '#ff2a2a', 8);
  }

  private drawAccuracyReport() {
    const ctx = this.ctx;
    this.drawText('-GAME RESULTS-', W / 2 - 46, 60, '#ffff00', 7);
    this.drawText(`SHOTS FIRED    ${String(this.score.shotsTotal).padStart(4, ' ')}`, 30, 95, '#ffffff', 6);
    this.drawText(`NUMBER OF HITS ${String(this.score.shotsHit).padStart(4, ' ')}`, 30, 110, '#ffffff', 6);
    this.drawText(`HIT-MISS RATIO ${this.score.hitRatio}%`, 30, 125, '#00e5ff', 6);
    this.drawText(`FINAL SCORE    ${String(this.score.score).padStart(6, '0')}`, 30, 145, '#ff2a2a', 6);

    if (this.stateTimer > 2.0 && this.attractBlink) {
      this.drawText('PRESS FIRE TO CONTINUE', W / 2 - 68, H - 30, '#ffff00', 6);
    }
  }

  private drawHighScoreEntry() {
    const ctx = this.ctx;
    this.drawText('NEW RECORD!', W / 2 - 36, 55, '#ff2a2a', 8);
    this.drawText(`SCORE: ${String(this.score.score).padStart(6, '0')}`, W / 2 - 42, 80, '#ffffff', 7);

    this.drawText('ENTER YOUR INITIALS', W / 2 - 60, 110, '#ffff00', 6);

    // Three letter boxes
    for (let i = 0; i < 3; i++) {
      const lx = W / 2 - 24 + i * 24;
      const ly = 135;
      ctx.strokeStyle = i === this.initialsPos ? '#00e5ff' : '#555588';
      ctx.lineWidth = 2;
      ctx.strokeRect(lx - 2, ly - 2, 20, 20);
      const show = (i !== this.initialsPos) || this.initialsFlash;
      if (show) {
        this.drawText(this.playerInitials[i], lx + 2, ly + 2, i === this.initialsPos ? '#00e5ff' : '#aaaacc', 10);
      }
    }

    this.drawText('USE L/R TO CHANGE LETTER', W / 2 - 76, 175, '#aaaacc', 5);
    this.drawText('PRESS FIRE TO CONFIRM', W / 2 - 64, 188, '#aaaacc', 5);

    // Current top scores
    this.drawText('TOP SCORES:', W / 2 - 36, 215, '#ffffff', 6);
    this.score.getBoard().slice(0, 5).forEach((e, i) => {
      this.drawText(`${i + 1}. ${e.initials}  ${String(e.score).padStart(6, '0')}`, 40, 227 + i * 10, '#aaaacc', 5);
    });
  }

  private drawPaused() {
    this.ctx.fillStyle = 'rgba(0,0,0,0.55)';
    this.ctx.fillRect(0, 0, W, H);
    this.drawText('- PAUSED -', W / 2 - 32, H / 2 - 8, '#ffff00', 8);
    this.drawText('PRESS P TO RESUME', W / 2 - 54, H / 2 + 14, '#aaaacc', 6);
  }

  // ─────────────────────────────────────────
  // HELPERS
  // ─────────────────────────────────────────

  private drawText(text: string, x: number, y: number, color: string, size: number) {
    const ctx = this.ctx;
    ctx.save();
    ctx.font = `${size}px "Press Start 2P", monospace`;
    ctx.fillStyle = color;
    ctx.textBaseline = 'top';
    ctx.fillText(text, x, y);
    ctx.restore();
  }

  private rectsOverlap(ax: number, ay: number, aw: number, ah: number, bx: number, by: number, bw: number, bh: number): boolean {
    return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
  }
}
