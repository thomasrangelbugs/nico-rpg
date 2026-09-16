import { deflateSync } from 'zlib';
import { mkdirSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const A = join(ROOT, 'public', 'assets');

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const t = Buffer.from(type);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([t, data])));
  return Buffer.concat([len, t, data, crc]);
}
function encodePng(w, h, rgba) {
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (w * 4 + 1)] = 0;
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const o = y * (w * 4 + 1) + 1 + x * 4;
      raw[o] = rgba[i];
      raw[o + 1] = rgba[i + 1];
      raw[o + 2] = rgba[i + 2];
      raw[o + 3] = rgba[i + 3];
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}
function canvas(w, h) {
  return { w, h, data: new Uint8ClampedArray(w * h * 4) };
}
function set(c, x, y, col) {
  if (x < 0 || y < 0 || x >= c.w || y >= c.h) return;
  const i = (y * c.w + x) * 4;
  c.data[i] = col[0];
  c.data[i + 1] = col[1];
  c.data[i + 2] = col[2];
  c.data[i + 3] = col[3] ?? 255;
}
function rect(c, x, y, w, h, col) {
  for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) set(c, xx, yy, col);
}
function ellipse(c, cx, cy, rx, ry, col) {
  for (let y = -ry; y <= ry; y++) for (let x = -rx; x <= rx; x++) {
    if ((x * x) / (rx * rx) + (y * y) / (ry * ry) <= 1) set(c, cx + x, cy + y, col);
  }
}
function save(rel, c) {
  const p = join(A, rel);
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, encodePng(c.w, c.h, c.data));
}

const skin = [232, 190, 150];
const hair = [166, 112, 68];
const armor = [90, 110, 140];
const outline = [30, 22, 18];

function drawNicolas() {
  const c = canvas(48, 48);
  ellipse(c, 24, 42, 10, 3, [0, 0, 0, 50]);
  rect(c, 16, 28, 6, 14, [50, 55, 70]);
  rect(c, 26, 28, 6, 14, [50, 55, 70]);
  rect(c, 14, 18, 20, 14, armor);
  rect(c, 16, 20, 16, 5, [60, 130, 170]);
  ellipse(c, 24, 12, 8, 9, skin);
  ellipse(c, 24, 8, 9, 5, hair);
  set(c, 21, 12, outline);
  set(c, 27, 12, outline);
  return c;
}

function drawEnemy(kind) {
  const c = canvas(40, 40);
  ellipse(c, 20, 36, 8, 3, [0, 0, 0, 50]);
  if (kind === 'bat') {
    ellipse(c, 20, 20, 6, 5, [70, 55, 90]);
    ellipse(c, 10, 18, 7, 4, [90, 70, 110]);
    ellipse(c, 30, 18, 7, 4, [90, 70, 110]);
    set(c, 18, 18, [255, 80, 80]);
    set(c, 22, 18, [255, 80, 80]);
  } else if (kind === 'skeleton') {
    rect(c, 14, 18, 12, 14, [230, 230, 220]);
    ellipse(c, 20, 12, 7, 7, [240, 240, 230]);
    set(c, 17, 12, outline);
    set(c, 23, 12, outline);
  } else if (kind === 'slime') {
    ellipse(c, 20, 24, 12, 10, [70, 180, 110]);
    ellipse(c, 20, 22, 9, 7, [120, 220, 150]);
    set(c, 16, 20, outline);
    set(c, 24, 20, outline);
  } else if (kind === 'ghost') {
    ellipse(c, 20, 20, 10, 14, [170, 200, 230, 190]);
    set(c, 16, 16, outline);
    set(c, 24, 16, outline);
  } else if (kind === 'wolf') {
    ellipse(c, 20, 24, 12, 8, [130, 115, 100]);
    ellipse(c, 28, 18, 6, 5, [130, 115, 100]);
    set(c, 30, 17, [255, 60, 60]);
  } else if (kind === 'golem') {
    rect(c, 10, 12, 20, 22, [120, 115, 110]);
    rect(c, 12, 4, 16, 10, [110, 105, 100]);
  } else if (kind === 'mage') {
    rect(c, 14, 16, 12, 16, [70, 40, 100]);
    ellipse(c, 20, 10, 7, 7, skin);
    ellipse(c, 20, 6, 8, 4, [40, 30, 50]);
  } else {
    // boss
    ellipse(c, 20, 22, 14, 12, [160, 50, 50]);
    ellipse(c, 20, 10, 8, 7, [180, 60, 60]);
    set(c, 16, 9, [255, 220, 80]);
    set(c, 24, 9, [255, 220, 80]);
  }
  return c;
}

function drawPower(color, shape) {
  const c = canvas(48, 48);
  rect(c, 2, 2, 44, 44, [40, 30, 22, 230]);
  rect(c, 4, 4, 40, 40, [60, 45, 30, 230]);
  if (shape === 'blade') {
    rect(c, 22, 8, 4, 28, color);
    rect(c, 16, 30, 16, 4, [200, 170, 80]);
  } else if (shape === 'orb') {
    ellipse(c, 24, 24, 12, 12, color);
    ellipse(c, 20, 20, 4, 4, [255, 255, 255, 180]);
  } else if (shape === 'dagger') {
    rect(c, 22, 10, 3, 22, color);
    rect(c, 18, 28, 11, 3, [180, 140, 60]);
  } else if (shape === 'axe') {
    ellipse(c, 28, 16, 10, 8, color);
    rect(c, 20, 14, 4, 22, [120, 80, 40]);
  } else if (shape === 'cross') {
    rect(c, 20, 10, 8, 28, color);
    rect(c, 12, 18, 24, 8, color);
  } else if (shape === 'ring') {
    ellipse(c, 24, 24, 14, 14, color);
    ellipse(c, 24, 24, 8, 8, [40, 30, 22, 255]);
  } else if (shape === 'bolt') {
    for (let i = 0; i < 6; i++) rect(c, 18 + (i % 2) * 4, 8 + i * 5, 8, 4, color);
  } else if (shape === 'book') {
    rect(c, 12, 12, 24, 24, color);
    rect(c, 14, 14, 20, 20, [240, 230, 200]);
  } else if (shape === 'flame') {
    ellipse(c, 24, 28, 8, 10, color);
    ellipse(c, 24, 18, 5, 8, [255, 200, 80]);
  } else if (shape === 'garlic') {
    ellipse(c, 24, 26, 10, 10, [230, 230, 200]);
    ellipse(c, 24, 18, 4, 4, [100, 160, 80]);
  } else if (shape === 'water') {
    ellipse(c, 24, 26, 10, 12, [80, 160, 220]);
    ellipse(c, 24, 18, 6, 4, [180, 220, 255]);
  } else if (shape === 'passive') {
    ellipse(c, 24, 24, 12, 12, color);
    rect(c, 22, 14, 4, 20, [255, 240, 180]);
  } else {
    ellipse(c, 24, 24, 10, 10, color);
  }
  return c;
}

function drawFx(color, shape) {
  const c = canvas(32, 32);
  if (shape === 'slash') {
    for (let i = 0; i < 10; i++) rect(c, 4 + i * 2, 14 - Math.abs(i - 5), 3, 3, [...color, 220]);
  } else if (shape === 'proj') {
    ellipse(c, 16, 16, 6, 6, color);
  } else if (shape === 'gem') {
    rect(c, 12, 8, 8, 16, [80, 200, 255]);
    rect(c, 10, 12, 12, 8, [120, 220, 255]);
  } else if (shape === 'coin') {
    ellipse(c, 16, 16, 8, 8, [240, 190, 60]);
  } else if (shape === 'aura') {
    ellipse(c, 16, 16, 14, 14, [...color, 80]);
  } else {
    ellipse(c, 16, 16, 8, 8, color);
  }
  return c;
}

function drawTile(color) {
  const c = canvas(64, 64);
  rect(c, 0, 0, 64, 64, color);
  for (let i = 0; i < 20; i++) {
    const x = (i * 17) % 64;
    const y = (i * 29) % 64;
    set(c, x, y, [color[0] - 15, color[1] - 10, color[2] - 10, 180]);
  }
  return c;
}

// Player
save('player/nicolas.png', drawNicolas());
save('player/nicolas_hurt.png', (() => {
  const c = drawNicolas();
  rect(c, 0, 0, 48, 48, [255, 0, 0, 40]);
  return c;
})());

// Enemies
for (const e of ['bat', 'skeleton', 'slime', 'ghost', 'wolf', 'golem', 'mage', 'boss']) {
  save(`enemies/${e}.png`, drawEnemy(e));
}

// Powers icons
const powers = [
  ['blade', [220, 220, 230], 'blade'],
  ['orb', [120, 160, 255], 'orb'],
  ['daggers', [200, 200, 210], 'dagger'],
  ['axe', [180, 80, 60], 'axe'],
  ['cross', [255, 230, 120], 'cross'],
  ['bible', [180, 140, 220], 'book'],
  ['lightning', [255, 240, 100], 'bolt'],
  ['fire', [255, 120, 40], 'flame'],
  ['garlic', [230, 230, 180], 'garlic'],
  ['holywater', [80, 160, 230], 'water'],
  ['thorns', [100, 180, 90], 'ring'],
  ['wind', [160, 220, 200], 'orb'],
  ['armor', [140, 140, 160], 'passive'],
  ['speed', [120, 200, 120], 'passive'],
  ['might', [220, 80, 80], 'passive'],
  ['magnet', [80, 180, 255], 'passive'],
  ['recovery', [255, 140, 180], 'passive'],
  ['area', [255, 200, 80], 'passive'],
  ['cooldown', [180, 220, 255], 'passive'],
  ['amount', [255, 180, 80], 'passive'],
  ['duration', [200, 160, 255], 'passive'],
  ['luck', [255, 220, 100], 'passive'],
];
for (const [id, color, shape] of powers) save(`powers/${id}.png`, drawPower(color, shape));

// FX
save('fx/slash.png', drawFx([255, 230, 180], 'slash'));
save('fx/proj_blue.png', drawFx([120, 180, 255], 'proj'));
save('fx/proj_fire.png', drawFx([255, 120, 40], 'proj'));
save('fx/proj_light.png', drawFx([255, 240, 120], 'proj'));
save('fx/gem.png', drawFx([80, 200, 255], 'gem'));
save('fx/coin.png', drawFx([240, 190, 60], 'coin'));
save('fx/aura_green.png', drawFx([120, 220, 120], 'aura'));
save('fx/aura_gold.png', drawFx([255, 220, 100], 'aura'));

// World
save('world/grass.png', drawTile([55, 110, 55]));
save('world/dirt.png', drawTile([110, 90, 50]));
save('world/stone.png', drawTile([90, 95, 100]));
save('world/tree.png', (() => {
  const c = canvas(64, 80);
  rect(c, 28, 48, 8, 28, [100, 70, 40]);
  ellipse(c, 32, 36, 22, 20, [40, 120, 55]);
  return c;
})());
save('world/rock.png', (() => {
  const c = canvas(40, 32);
  ellipse(c, 20, 18, 14, 10, [120, 120, 115]);
  return c;
})());

// UI
save('ui/panel.png', (() => {
  const c = canvas(64, 64);
  rect(c, 0, 0, 64, 64, [35, 25, 18, 240]);
  rect(c, 3, 3, 58, 58, [55, 40, 28, 240]);
  return c;
})());
save('ui/heart.png', (() => {
  const c = canvas(24, 24);
  ellipse(c, 8, 10, 5, 5, [200, 50, 60]);
  ellipse(c, 16, 10, 5, 5, [200, 50, 60]);
  rect(c, 5, 12, 14, 6, [200, 50, 60]);
  return c;
})());
save('ui/xp.png', (() => {
  const c = canvas(64, 8);
  rect(c, 0, 0, 64, 8, [20, 40, 60]);
  rect(c, 1, 1, 62, 6, [60, 160, 255]);
  return c;
})());
save('ui/logo.png', (() => {
  const c = canvas(128, 64);
  ellipse(c, 64, 32, 50, 24, [40, 28, 20, 240]);
  rect(c, 28, 22, 72, 8, [220, 170, 60]);
  rect(c, 36, 36, 56, 6, [200, 180, 120]);
  return c;
})());

// icons
mkdirSync(join(ROOT, 'public', 'icons'), { recursive: true });
function icon(size) {
  const c = canvas(size, size);
  rect(c, 0, 0, size, size, [28, 20, 16]);
  ellipse(c, size / 2, size / 2, size * 0.32, size * 0.32, [70, 110, 150]);
  ellipse(c, size / 2, size / 2 - size * 0.05, size * 0.12, size * 0.14, skin);
  ellipse(c, size / 2, size / 2 - size * 0.12, size * 0.13, size * 0.07, hair);
  return c;
}
writeFileSync(join(ROOT, 'public', 'icons', 'icon-192.png'), encodePng(192, 192, icon(192).data));
writeFileSync(join(ROOT, 'public', 'icons', 'icon-512.png'), encodePng(512, 512, icon(512).data));
writeFileSync(join(ROOT, 'public', 'favicon.png'), encodePng(64, 64, icon(64).data));

console.log('Survivor assets generated');
