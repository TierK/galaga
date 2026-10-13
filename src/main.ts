import { AudioManager } from './core/AudioManager';
import { InputManager } from './core/InputManager';
import { Game } from './core/Game';

const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;

// Scale canvas to fit screen while maintaining 224x288 internal resolution
function resizeCanvas() {
  const wrapper = document.getElementById('screen-wrapper')!;
  const mobileControls = document.getElementById('mobile-controls');
  const isMobile = window.matchMedia('(pointer: coarse) and (max-width: 900px), (max-width: 600px)').matches;

  let availH = window.innerHeight - 30; // 30px padding for cabinet aesthetics
  let availW = window.innerWidth - (isMobile ? 30 : 300); // account for side panel on desktop

  if (isMobile && mobileControls) {
    mobileControls.style.display = 'flex';
    availH -= 160;
  } else if (mobileControls) {
    mobileControls.style.display = 'none';
  }

  // Landscape mobile: controls are overlaid
  if (window.innerHeight <= 500 && window.innerWidth > window.innerHeight) {
    availH = window.innerHeight;
  }

  // Cap maximum dimensions on desktop (e.g. 15.6" laptops) so pixels stay crisp
  const MAX_DESKTOP_W = 560; // 2.5x original
  const MAX_DESKTOP_H = 720; // 2.5x original
  if (!isMobile) {
    availW = Math.min(availW, MAX_DESKTOP_W);
    availH = Math.min(availH, MAX_DESKTOP_H);
  }

  const scaleX = availW / 224;
  const scaleY = availH / 288;
  let scale = Math.min(scaleX, scaleY);

  // Use crisp integer scale if close to integer, minimum 1
  if (scale >= 1.9 && scale < 2.3) scale = 2;
  else if (scale >= 2.8 && scale < 3.3) scale = 3;
  scale = Math.max(1, scale);

  const displayW = Math.round(224 * scale);
  const displayH = Math.round(288 * scale);

  canvas.style.width = `${displayW}px`;
  canvas.style.height = `${displayH}px`;
  wrapper.style.width = `${displayW}px`;
  wrapper.style.height = `${displayH}px`;
}

resizeCanvas();
window.addEventListener('resize', resizeCanvas);
window.addEventListener('orientationchange', () => setTimeout(resizeCanvas, 200));

const audio = new AudioManager();
const input = new InputManager(audio);
const game = new Game(canvas, ctx, audio, input);

// Wire desktop sidebar buttons
document.getElementById('btn-sound-toggle')?.addEventListener('click', () => {
  const muted = audio.toggleMute();
  const btn = document.getElementById('btn-sound-toggle')!;
  btn.textContent = muted ? 'SOUND: OFF' : 'SOUND: ON';
  btn.style.borderColor = muted ? '#555' : '#00e5ff';
  btn.style.color = muted ? '#555' : '#00e5ff';
});

document.getElementById('btn-crt-toggle')?.addEventListener('click', () => {
  const overlay = document.getElementById('crt-overlay')!;
  const isOff = overlay.classList.toggle('disabled');
  const btn = document.getElementById('btn-crt-toggle')!;
  btn.textContent = isOff ? 'CRT SCANLINES: OFF' : 'CRT SCANLINES: ON';
});

document.getElementById('btn-pause-toggle')?.addEventListener('click', () => {
  game.togglePause();
  const btn = document.getElementById('btn-pause-toggle')!;
  btn.textContent = game.isPaused ? 'RESUME GAME' : 'PAUSE GAME';
});

document.getElementById('btn-restart')?.addEventListener('click', () => game.restart());

// Mobile buttons
document.getElementById('mobile-pause-btn')?.addEventListener('click', () => game.togglePause());
document.getElementById('mobile-sound-btn')?.addEventListener('click', () => audio.toggleMute());

// Debug drawer
const debugDrawer = document.getElementById('debug-drawer')!;
document.getElementById('btn-debug-open')?.addEventListener('click', () => debugDrawer.classList.toggle('open'));
document.getElementById('btn-debug-close')?.addEventListener('click', () => debugDrawer.classList.remove('open'));

document.getElementById('dbg-tractor')?.addEventListener('click', () => game.debug('tractorBeam'));
document.getElementById('dbg-dual')?.addEventListener('click', () => game.debug('dualFighter'));
document.getElementById('dbg-challenging')?.addEventListener('click', () => game.debug('challengingStage'));
document.getElementById('dbg-godmode')?.addEventListener('click', () => {
  const on = game.debug('godMode');
  const btn = document.getElementById('dbg-godmode')!;
  btn.textContent = on ? 'TOGGLE GOD MODE (ON)' : 'TOGGLE GOD MODE (OFF)';
});
document.getElementById('dbg-nextstage')?.addEventListener('click', () => game.debug('nextStage'));
document.getElementById('dbg-addlife')?.addEventListener('click', () => game.debug('addLife'));
document.getElementById('dbg-addscore')?.addEventListener('click', () => game.debug('addScore'));

// Keyboard shortcut to open/close debug drawer
document.addEventListener('keydown', (e) => {
  if (e.key === '`' || e.key === '~') debugDrawer.classList.toggle('open');
});

game.start();
