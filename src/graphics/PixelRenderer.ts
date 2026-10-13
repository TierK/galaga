import { SPRITES, ARCADE_PALETTES } from '../graphics/SpriteMatrix';

type SpriteName = keyof typeof SPRITES;

// Pre-rendered sprite cache
const spriteCache = new Map<string, HTMLCanvasElement>();

export function renderSprite(name: SpriteName, ctx: CanvasRenderingContext2D, x: number, y: number, scale = 1, flipX = false) {
  const key = `${name}_${scale}`;
  if (!spriteCache.has(key)) {
    spriteCache.set(key, buildSprite(name, scale));
  }
  const sprite = spriteCache.get(key)!;
  ctx.save();
  if (flipX) {
    ctx.translate(x + sprite.width, y);
    ctx.scale(-1, 1);
    ctx.drawImage(sprite, 0, 0);
  } else {
    ctx.drawImage(sprite, x, y);
  }
  ctx.restore();
}

function buildSprite(name: SpriteName, scale: number): HTMLCanvasElement {
  const matrix = SPRITES[name] as string[];
  const rows = matrix.length;
  const cols = matrix[0].length;
  const oc = document.createElement('canvas');
  oc.width = cols * scale;
  oc.height = rows * scale;
  const octx = oc.getContext('2d')!;
  const palette = ARCADE_PALETTES.default;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const ch = matrix[r][c];
      const color = palette[ch] ?? 'rgba(0,0,0,0)';
      if (!color || color === 'rgba(0,0,0,0)') continue;
      octx.fillStyle = color;
      octx.fillRect(c * scale, r * scale, scale, scale);
    }
  }
  return oc;
}

export function getSpriteSize(name: SpriteName, scale = 1): { w: number; h: number } {
  const matrix = SPRITES[name] as string[];
  return { w: matrix[0].length * scale, h: matrix.length * scale };
}

export function preloadSprites(scale = 2) {
  const names = Object.keys(SPRITES) as SpriteName[];
  for (const name of names) {
    const key = `${name}_${scale}`;
    if (!spriteCache.has(key)) {
      spriteCache.set(key, buildSprite(name, scale));
    }
  }
}
