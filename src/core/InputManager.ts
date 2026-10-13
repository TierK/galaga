import type { AudioManager } from './AudioManager';

export interface InputState {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  fire: boolean;
  pause: boolean;
}

export class InputManager {
  private keys = new Set<string>();
  private state: InputState = { left: false, right: false, up: false, down: false, fire: false, pause: false };
  private _pausePressed = false;
  private _fireJustPressed = false;

  // Joystick state — now tracks both axes
  private joystickActive = false;
  private joystickDX = 0;
  private joystickDY = 0;
  private joystickTouchId: number | null = null;
  private joystickOriginX = 0;
  private joystickOriginY = 0;

  // Fire button held & auto-fire lock state
  private firePressed = false;
  private fireLocked = false;
  private lastFirePressTime = 0;

  constructor(private audio: AudioManager) {
    this.setupKeyboard();
    this.setupJoystick();
    this.setupFireButton();
  }

  private setupKeyboard() {
    window.addEventListener('keydown', (e) => {
      this.keys.add(e.code);
      if (e.code === 'Space' || e.code === 'KeyJ') {
        e.preventDefault();
        this._fireJustPressed = true;
      }
      // Toggle auto-fire lock with key 'KeyF'
      if (e.code === 'KeyF') {
        e.preventDefault();
        this.toggleFireLock();
      }
      if (e.code === 'ArrowUp' || e.code === 'KeyW' ||
          e.code === 'ArrowDown' || e.code === 'KeyS') {
        e.preventDefault();
      }
      if (e.code === 'KeyP' || e.code === 'Escape') {
        this._pausePressed = true;
      }
    });
    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.code);
    });
  }

  toggleFireLock(force?: boolean) {
    this.fireLocked = force !== undefined ? force : !this.fireLocked;
    const btn = document.getElementById('mobile-fire-btn');
    if (btn) {
      if (this.fireLocked) {
        btn.classList.add('locked');
        btn.innerHTML = 'AUTO<br><span style="font-size:8px;">[LOCK]</span>';
      } else {
        btn.classList.remove('locked');
        btn.textContent = 'FIRE';
      }
    }
  }

  private setupJoystick() {
    const zone = document.getElementById('joystick-zone');
    const thumb = document.getElementById('joystick-thumb');
    if (!zone || !thumb) return;

    const maxDist = 42;

    const onStart = (cx: number, cy: number, id: number) => {
      const rect = zone.getBoundingClientRect();
      this.joystickOriginX = rect.left + rect.width / 2;
      this.joystickOriginY = rect.top + rect.height / 2;
      this.joystickTouchId = id;
      this.joystickActive = true;
      onMove(cx, cy);
    };

    const onMove = (cx: number, cy: number) => {
      if (!this.joystickActive) return;
      const dx = cx - this.joystickOriginX;
      const dy = cy - this.joystickOriginY;
      const dist = Math.min(Math.sqrt(dx * dx + dy * dy), maxDist);
      const angle = Math.atan2(dy, dx);
      const clampedX = Math.cos(angle) * dist;
      const clampedY = Math.sin(angle) * dist;
      thumb.style.transform = `translate(${clampedX}px, ${clampedY}px)`;
      this.joystickDX = clampedX / maxDist;
      this.joystickDY = clampedY / maxDist;
    };

    const onEnd = () => {
      this.joystickActive = false;
      this.joystickDX = 0;
      this.joystickDY = 0;
      this.joystickTouchId = null;
      thumb.style.transform = 'translate(0px, 0px)';
    };

    zone.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const t = e.changedTouches[0];
      onStart(t.clientX, t.clientY, t.identifier);
    }, { passive: false });

    zone.addEventListener('touchmove', (e) => {
      e.preventDefault();
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        if (t.identifier === this.joystickTouchId) onMove(t.clientX, t.clientY);
      }
    }, { passive: false });

    zone.addEventListener('touchend', (e) => {
      e.preventDefault();
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === this.joystickTouchId) onEnd();
      }
    }, { passive: false });
  }

  private setupFireButton() {
    const btn = document.getElementById('mobile-fire-btn');
    if (!btn) return;

    const press = (e: Event) => {
      e.preventDefault();
      const now = performance.now();
      // Double tap detection (within 350ms)
      if (now - this.lastFirePressTime < 350) {
        this.toggleFireLock();
      }
      this.lastFirePressTime = now;

      if (!this.firePressed) {
        this.firePressed = true;
        this._fireJustPressed = true;
        btn.classList.add('pressed');
      }
    };

    const release = (e: Event) => {
      e.preventDefault();
      this.firePressed = false;
      btn.classList.remove('pressed');
    };

    btn.addEventListener('touchstart', press, { passive: false });
    btn.addEventListener('touchend', release, { passive: false });
    btn.addEventListener('mousedown', press);
    btn.addEventListener('mouseup', release);
    btn.addEventListener('mouseleave', release);
  }

  update() {
    const jLeft  = this.joystickDX < -0.25;
    const jRight = this.joystickDX > 0.25;
    const jUp    = this.joystickDY < -0.25;
    const jDown  = this.joystickDY > 0.25;

    this.state.left  = this.keys.has('ArrowLeft')  || this.keys.has('KeyA') || jLeft;
    this.state.right = this.keys.has('ArrowRight') || this.keys.has('KeyD') || jRight;
    this.state.up    = this.keys.has('ArrowUp')    || this.keys.has('KeyW') || jUp;
    this.state.down  = this.keys.has('ArrowDown')  || this.keys.has('KeyS') || jDown;

    // Fire = held key OR held mobile button OR fireLocked
    const keyFire = this.keys.has('Space') || this.keys.has('KeyJ');
    this.state.fire = keyFire || this.firePressed || this.fireLocked;

    // If key is now held and wasn't marked as just-pressed yet, mark it
    if (keyFire && !this._fireJustPressed) {
      // auto-fire handled in Player via isFiring; don't set _fireJustPressed here
    }

    this.state.pause = this._pausePressed;
    this._pausePressed = false;
  }

  consumeFireJustPressed(): boolean {
    if (this._fireJustPressed) {
      this._fireJustPressed = false;
      return true;
    }
    return false;
  }

  consumePauseJustPressed(): boolean {
    return this.state.pause;
  }

  get isLeft()  { return this.state.left; }
  get isRight() { return this.state.right; }
  get isUp()    { return this.state.up; }
  get isDown()  { return this.state.down; }
  get isFiring() { return this.state.fire; }
  get isPauseJustPressed() { return this.state.pause; }
}
