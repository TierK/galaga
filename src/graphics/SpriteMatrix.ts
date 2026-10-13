// Galaga Sprite Matrices - Pixel-exact representations
// Key: '.' = transparent
// Colors:
// 'W': #ffffff, 'R': #e61919, 'B': #1952e6, 'Y': #ffea19, 'C': #19d5e6, 'G': #19e645, 'M': #e619d5, 'O': #e67d19, 'K': #444444

export type PaletteMap = Record<string, string>;

export const ARCADE_PALETTES: Record<string, PaletteMap> = {
  default: {
    '.': 'rgba(0,0,0,0)',
    'W': '#ffffff',
    'R': '#ff2a2a',
    'B': '#2a52be',
    'Y': '#ffff00',
    'C': '#00e5ff',
    'G': '#00ff44',
    'M': '#ff00aa',
    'O': '#ff7700',
    'K': '#333344',
    'D': '#111122'
  }
};

export const SPRITES = {
  // PLAYER SHIP (16x16)
  player: [
    ".......WW.......",
    ".......WW.......",
    "......WRRW......",
    "......WRRW......",
    ".....WWRRWW.....",
    ".....WWRRWW.....",
    "....WWWRRWWW....",
    "....WWWRRWWW....",
    "...WWWBWWWBWW...",
    "...WWWBWWWBWW...",
    "..WWRRBWWBBRWW..",
    "..WWRRBWWBBRWW..",
    ".WWRRRB..BRRRWW.",
    ".WWRRRB..BRRRWW.",
    "WWRRRWW..WWRRRWW",
    "WWRRRWW..WWRRRWW"
  ],

  // CAPTURED PLAYER SHIP (Red tinted, 16x16)
  captured_player: [
    ".......RR.......",
    ".......RR.......",
    "......RMMR......",
    "......RMMR......",
    ".....RRMMRR.....",
    ".....RRMMRR.....",
    "....RRRMMRRR....",
    "....RRRMMRRR....",
    "...RRRMRRRMRR...",
    "...RRRMRRRMRR...",
    "..RRMMRRRRMMRR..",
    "..RRMMRRRRMMRR..",
    ".RRMMMR..RMMMRR.",
    ".RRMMMR..RMMMRR.",
    "RRMMMRR..RRMMMRR",
    "RRMMMRR..RRMMMRR"
  ],

  // ZAKO / BEE - Frame 1 (16x16)
  bee_1: [
    "....YY....YY....",
    "...YYYY..YYYY...",
    "..YYYYYYYYYYYY..",
    "..YYYYYYYYYYYY..",
    "...YYYYBBYYYY...",
    "....YYRBRRYY....",
    "....YYBBBBYY....",
    "...RRRYYYYYRRR..",
    "..RRRRYYYYYRRRR.",
    "..RRRRYYYYYRRRR.",
    "...RRRYYYYYRRR..",
    "....YYRBRRYY....",
    "....YYB..BYY....",
    ".....YY..YY.....",
    "......Y..Y......",
    ".......RR......."
  ],

  // ZAKO / BEE - Frame 2 (Wings tucked, 16x16)
  bee_2: [
    "......YYYY......",
    ".....YYYYYY.....",
    "....YYYYYYYY....",
    "....YYYYYYYY....",
    "....YYYBBYYY....",
    "....YYRBRRYY....",
    "....YYBBBBYY....",
    "...RRRYYYYYRRR..",
    "..RRRRYYYYYRRRR.",
    "..RRRRYYYYYRRRR.",
    "...RRRYYYYYRRR..",
    "....YYRBRRYY....",
    "....YYB..BYY....",
    "....YY....YY....",
    ".....Y....Y.....",
    ".......RR......."
  ],

  // GOEI / BUTTERFLY - Frame 1 (Wings Open, 16x16)
  butterfly_1: [
    "RR............RR",
    "RRR..........RRR",
    ".RRRR......RRRR.",
    "..RRRRBBBBBRRR..",
    "...RRRBBWBBRRR..",
    "...RRRBBWBBRRR..",
    "..RRRRRBBBRRRR..",
    ".RRRRRRRRRRRRRR.",
    "RRRRRRWWWRRRRRRR",
    ".RRRRRRRRRRRRRR.",
    "..RRRRRWWWRRRR..",
    "...RRRRWWWRRR...",
    "....RRR...RRR...",
    ".....RR...RR....",
    "......R...R.....",
    ".......RRR......"
  ],

  // GOEI / BUTTERFLY - Frame 2 (Wings Closed, 16x16)
  butterfly_2: [
    "......RRRR......",
    "....RRRRRRRR....",
    "...RRRRRRRRRR...",
    "..RRRRRBBBBRRR..",
    "..RRRRBBWBBBRR..",
    "..RRRRBBWBBBRR..",
    "...RRRRRBBBRRR..",
    "....RRRRRRRR....",
    "....RRWWWRRR....",
    "....RRRRRRRR....",
    "....RRWWWRRR....",
    "....RRWWWRRR....",
    ".....RR...RR....",
    ".....RR...RR....",
    "......R...R.....",
    ".......RRR......"
  ],

  // BOSS GALAGA - Undamaged Green Frame 1 (16x16)
  boss_green_1: [
    "....GG....GG....",
    "...GGGG..GGGG...",
    "..GGGGGGGGGGGG..",
    "..GGGGGGGGGGGG..",
    "...GGGYYGGGG....",
    "...GGYYRRYYGG...",
    "..GGYYYRRBYYGG..",
    ".GGGGYYRRBYYGGGG",
    "GGGGGYBBBRYGGGGG",
    "GGGGGYBBBRYGGGGG",
    ".GGGGYYYYYYGGGG.",
    "..GGGGYYYYGGGG..",
    "...GGGG..GGGG...",
    "....GG....GG....",
    ".....G....G.....",
    "......G..G......"
  ],

  // BOSS GALAGA - Undamaged Green Frame 2 (16x16)
  boss_green_2: [
    "......GGGG......",
    ".....GGGGGG.....",
    "....GGGGGGGG....",
    "....GGGGGGGG....",
    "...GGGYYGGGG....",
    "...GGYYRRYYGG...",
    "..GGYYYRRBYYGG..",
    ".GGGGYYRRBYYGGGG",
    "GGGGGYBBBRYGGGGG",
    "GGGGGYBBBRYGGGGG",
    ".GGGGYYYYYYGGGG.",
    "..GGGGYYYYGGGG..",
    "....GGGGGGGG....",
    ".....GG..GG.....",
    "......G..G......",
    ".......GG......."
  ],

  // BOSS GALAGA - Damaged Blue Frame 1 (16x16)
  boss_blue_1: [
    "....BB....BB....",
    "...BBBB..BBBB...",
    "..BBBBBBBBBBBB..",
    "..BBBBBBBBBBBB..",
    "...BBBYYBBBB....",
    "...BBYYRRYYBB...",
    "..BBYYYRRMYYBB..",
    ".BBBBYYRRMYYBBBB",
    "BBBBBYMMMRYBBBBB",
    "BBBBBYMMMRYBBBBB",
    ".BBBBYYYYYYBBBB.",
    "..BBBBYYYYBBBB..",
    "...BBBB..BBBB...",
    "....BB....BB....",
    ".....B....B.....",
    "......B..B......"
  ],

  // BOSS GALAGA - Damaged Blue Frame 2 (16x16)
  boss_blue_2: [
    "......BBBB......",
    ".....BBBBBB.....",
    "....BBBBBBBB....",
    "....BBBBBBBB....",
    "...BBBYYBBBB....",
    "...BBYYRRYYBB...",
    "..BBYYYRRMYYBB..",
    ".BBBBYYRRMYYBBBB",
    "BBBBBYMMMRYBBBBB",
    "BBBBBYMMMRYBBBBB",
    ".BBBBYYYYYYBBBB.",
    "..BBBBYYYYBBBB..",
    "....BBBBBBBB....",
    ".....BB..BB.....",
    "......B..B......",
    ".......BB......."
  ],

  // PLAYER MISSILE (3x8)
  missile: [
    ".Y.",
    ".Y.",
    "YYY",
    "YYY",
    "YYY",
    ".Y.",
    ".Y.",
    ".Y."
  ],

  // ENEMY BOMB (3x6)
  alien_bomb: [
    ".R.",
    "RRR",
    "RYR",
    "RYR",
    "RRR",
    ".R."
  ],

  // EXPLOSION FRAME 1 (Spark, 8x8)
  exp_1: [
    "...YY...",
    "..YYYY..",
    ".YYYYYY.",
    "YYYYYYYY",
    "YYYYYYYY",
    ".YYYYYY.",
    "..YYYY..",
    "...YY..."
  ],

  // EXPLOSION FRAME 2 (Burst, 12x12)
  exp_2: [
    "....RRRR....",
    "...RRYYRR...",
    "..RRYYYYRR..",
    ".RRYYYYYYRR.",
    "RRYYWWWWYYRR",
    "RRYWWWWWWYRR",
    "RRYWWWWWWYRR",
    "RRYYWWWWYYRR",
    ".RRYYYYYYRR.",
    "..RRYYYYRR..",
    "...RRYYRR...",
    "....RRRR...."
  ],

  // EXPLOSION FRAME 3 (Fireball, 16x16)
  exp_3: [
    ".....RRRRRR.....",
    "...RRRYYYYRRR...",
    "..RRRYYWWYYRRR..",
    ".RRRYWWWWWWYRRR.",
    ".RRYWW....WWYRR.",
    "RRYWW......WWYRR",
    "RRYW........WYRR",
    "RRYW........WYRR",
    "RRYW........WYRR",
    "RRYWW......WWYRR",
    ".RRYWW....WWYRR.",
    ".RRRYWWWWWWYRRR.",
    "..RRRYYWWYYRRR..",
    "...RRRYYYYRRR...",
    ".....RRRRRR.....",
    "................"
  ],

  // EXPLOSION FRAME 4 (Dissipate, 16x16)
  exp_4: [
    "..R..........R..",
    "...R..RRRR..R...",
    "....RYYYYYYR....",
    "...RYY....YYR...",
    "..RY........YR..",
    ".RY..........YR.",
    ".R............R.",
    ".R............R.",
    ".R............R.",
    ".RY..........YR.",
    "..RY........YR..",
    "...RYY....YYR...",
    "....RYYYYYYR....",
    "...R..RRRR..R...",
    "..R..........R..",
    "................"
  ],

  // STAGE BADGE: 1 FLAG (9x11)
  badge_1: [
    "YYYYYYYY.",
    "YYYYYYYY.",
    "YYYYYYYY.",
    "YYYYYYYY.",
    "YYYYYYYY.",
    "YYYYYYYY.",
    "B........",
    "B........",
    "B........",
    "B........",
    "B........"
  ],

  // STAGE BADGE: 5 FLAG (9x11)
  badge_5: [
    "WWWWWWWW.",
    "WWWWWWWW.",
    "WWWWWWWW.",
    "WWWWWWWW.",
    "WWWWWWWW.",
    "WWWWWWWW.",
    "B........",
    "B........",
    "B........",
    "B........",
    "B........"
  ],

  // STAGE BADGE: 10 BADGE (11x11, Yellow/Red Emblem)
  badge_10: [
    "....RRR....",
    "...RRRRR...",
    "..RRRYRRR..",
    ".RRRYYYRRR.",
    "RRRYYYYYRRR",
    "RRRYYYYYRRR",
    "RRRYYYYYRRR",
    ".RRRYYYRRR.",
    "..RRRYRRR..",
    "...RRRRR...",
    "....RRR...."
  ],

  // STAGE BADGE: 20 BADGE (11x11, Blue/White Emblem)
  badge_20: [
    "....BBB....",
    "...BBBBB...",
    "..BBBWWBBB..",
    ".BBBWWWWBBB.",
    "BBBWWWWWWBBB",
    "BBBWWWWWWBBB",
    "BBBWWWWWWBBB",
    ".BBBWWWWBBB.",
    "..BBBWWBBB..",
    "...BBBBB...",
    "....BBB...."
  ],

  // STAGE BADGE: 30 BADGE (11x11, Red/Gold Crest)
  badge_30: [
    "....YYY....",
    "...YYYYY...",
    "..YYYMMYYY..",
    ".YYYMMMMYYY.",
    "YYYMMMMMMYYY",
    "YYYMMMMMMYYY",
    "YYYMMMMMMYYY",
    ".YYYMMMMYYY.",
    "..YYYMMYYY..",
    "...YYYYY...",
    "....YYY...."
  ],

  // STAGE BADGE: 50 BADGE (11x11, Special Royal Shield)
  badge_50: [
    "..YYYYYYY..",
    ".YYWWWWWWY.",
    "YYWWWWWWWWY",
    "YYWRRMMRRWY",
    "YYWRMMMMRWY",
    "YYWRMMMMRWY",
    ".YYRMMMMRY.",
    "..YYRMMRY..",
    "...YYRRY...",
    "....YYY....",
    ".....Y....."
  ]
};
