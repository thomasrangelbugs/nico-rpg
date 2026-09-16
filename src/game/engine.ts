import { ENEMIES, POWERS, getPower, type PowerDef } from './powers';

export { POWERS, getPower, ENEMIES };

export interface Vec {
  x: number;
  y: number;
}

export interface OwnedPower {
  id: string;
  level: number;
}

export interface Player {
  x: number;
  y: number;
  vx: number;
  vy: number;
  hp: number;
  maxHp: number;
  level: number;
  xp: number;
  xpToNext: number;
  facing: number;
  invuln: number;
  powers: OwnedPower[];
  kills: number;
  gold: number;
}

export interface Enemy {
  id: number;
  type: string;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  speed: number;
  damage: number;
  size: number;
  xp: number;
  score: number;
  hitFlash: number;
}

export interface Projectile {
  id: number;
  powerId: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  life: number;
  size: number;
  pierce: number;
  sprite: string;
  angle: number;
  orbitAngle?: number;
  orbitRadius?: number;
  returning?: boolean;
  ownerDist?: number;
  hitSet?: Set<number>;
}

export interface GroundZone {
  id: number;
  x: number;
  y: number;
  r: number;
  damage: number;
  life: number;
  tick: number;
  color: string;
  follow?: boolean;
}

export interface Pickup {
  id: number;
  kind: 'gem' | 'coin' | 'meat';
  x: number;
  y: number;
  value: number;
  life: number;
}

export interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
}

export type GamePhase = 'title' | 'playing' | 'levelup' | 'paused' | 'dead' | 'victory';

export interface GameState {
  phase: GamePhase;
  time: number;
  player: Player;
  enemies: Enemy[];
  projectiles: Projectile[];
  zones: GroundZone[];
  pickups: Pickup[];
  particles: Particle[];
  cooldowns: Record<string, number>;
  spawnAcc: number;
  bossSpawned: boolean;
  levelChoices: PowerDef[];
  pendingLevels: number;
  score: number;
  input: { x: number; y: number };
  camera: Vec;
  worldSize: number;
  shake: number;
  messages: { text: string; life: number }[];
  hitStop: number;
}

let nextId = 1;
const uid = () => nextId++;

function xpForLevel(level: number) {
  return Math.floor(8 + level * 5 + level * level * 1.4);
}

export function createInitialState(): GameState {
  return {
    phase: 'title',
    time: 0,
    player: {
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      hp: 100,
      maxHp: 100,
      level: 1,
      xp: 0,
      xpToNext: xpForLevel(1),
      facing: 1,
      invuln: 0,
      powers: [{ id: 'blade', level: 1 }],
      kills: 0,
      gold: 0,
    },
    enemies: [],
    projectiles: [],
    zones: [],
    pickups: [],
    particles: [],
    cooldowns: {},
    spawnAcc: 0,
    bossSpawned: false,
    levelChoices: [],
    pendingLevels: 0,
    score: 0,
    input: { x: 0, y: 0 },
    camera: { x: 0, y: 0 },
    worldSize: 3200,
    shake: 0,
    messages: [],
    hitStop: 0,
  };
}

export function getBonuses(player: Player) {
  const b = {
    armor: 0,
    moveSpeed: 1,
    might: 1,
    magnet: 60,
    recovery: 0,
    area: 1,
    cooldown: 1,
    amount: 0,
    duration: 1,
    luck: 0,
  };
  for (const op of player.powers) {
    const def = getPower(op.id);
    if (def.kind !== 'passive' || !def.passiveStat) continue;
    const lv = op.level;
    switch (def.passiveStat) {
      case 'armor':
        b.armor += lv * 2;
        break;
      case 'moveSpeed':
        b.moveSpeed += lv * 0.08;
        break;
      case 'might':
        b.might += lv * 0.1;
        break;
      case 'magnet':
        b.magnet += lv * 35;
        break;
      case 'recovery':
        b.recovery += lv * 0.35;
        break;
      case 'area':
        b.area += lv * 0.1;
        break;
      case 'cooldown':
        b.cooldown -= lv * 0.06;
        break;
      case 'amount':
        b.amount += lv;
        break;
      case 'duration':
        b.duration += lv * 0.15;
        break;
      case 'luck':
        b.luck += lv * 0.08;
        break;
    }
  }
  b.cooldown = Math.max(0.35, b.cooldown);
  return b;
}

function waveTable(t: number): { types: string[]; rate: number; hpMul: number; speedMul: number } {
  if (t < 60) return { types: ['bat', 'slime'], rate: 1.2, hpMul: 1, speedMul: 1 };
  if (t < 120) return { types: ['bat', 'slime', 'skeleton'], rate: 1.6, hpMul: 1.3, speedMul: 1.05 };
  if (t < 180) return { types: ['skeleton', 'wolf', 'ghost'], rate: 2.1, hpMul: 1.7, speedMul: 1.1 };
  if (t < 300) return { types: ['wolf', 'ghost', 'mage', 'skeleton'], rate: 2.8, hpMul: 2.2, speedMul: 1.15 };
  if (t < 480) return { types: ['mage', 'golem', 'wolf', 'ghost'], rate: 3.4, hpMul: 3, speedMul: 1.2 };
  return { types: ['golem', 'mage', 'wolf', 'boss'], rate: 4, hpMul: 4, speedMul: 1.25 };
}

function spawnEnemy(state: GameState, type: string, mulHp: number, mulSpd: number) {
  const def = ENEMIES.find((e) => e.id === type)!;
  const ang = Math.random() * Math.PI * 2;
  const dist = 420 + Math.random() * 180;
  state.enemies.push({
    id: uid(),
    type,
    x: state.player.x + Math.cos(ang) * dist,
    y: state.player.y + Math.sin(ang) * dist,
    hp: def.hp * mulHp,
    maxHp: def.hp * mulHp,
    speed: def.speed * mulSpd,
    damage: def.damage,
    size: def.size,
    xp: def.xp,
    score: def.score,
    hitFlash: 0,
  });
}

function nearestEnemy(state: GameState, x: number, y: number): Enemy | null {
  let best: Enemy | null = null;
  let bestD = Infinity;
  for (const e of state.enemies) {
    const d = (e.x - x) ** 2 + (e.y - y) ** 2;
    if (d < bestD) {
      bestD = d;
      best = e;
    }
  }
  return best;
}

function fireWeapons(state: GameState, dt: number) {
  const p = state.player;
  const bonus = getBonuses(p);
  for (const op of p.powers) {
    const def = getPower(op.id);
    if (def.kind !== 'weapon') continue;
    const cdKey = op.id;
    state.cooldowns[cdKey] = (state.cooldowns[cdKey] ?? 0) - dt;
    if (state.cooldowns[cdKey] > 0) continue;

    const level = op.level;
    const damage = (def.baseDamage ?? 10) * (1 + (level - 1) * 0.2) * bonus.might;
    const amount = (def.baseAmount ?? 1) + Math.floor((level - 1) / 2) + bonus.amount;
    const area = (def.baseArea ?? 1) * (1 + (level - 1) * 0.1) * bonus.area;
    const speed = (def.baseSpeed ?? 200) * (1 + (level - 1) * 0.05);
    const duration = (def.baseDuration ?? 0.4) * bonus.duration * (1 + (level - 1) * 0.08);
    const cooldown = (def.baseCooldown ?? 1) * bonus.cooldown * Math.max(0.45, 1 - (level - 1) * 0.04);
    state.cooldowns[cdKey] = cooldown;

    const dirX = p.facing;
    const dirY = Math.abs(p.vy) > 10 ? Math.sign(p.vy) : 0;

    switch (def.pattern) {
      case 'whip': {
        for (let i = 0; i < amount; i++) {
          const side = i % 2 === 0 ? 1 : -1;
          const yOff = (Math.floor(i / 2) - 0.5) * 18;
          state.projectiles.push({
            id: uid(),
            powerId: op.id,
            x: p.x + side * dirX * 40,
            y: p.y + yOff,
            vx: side * dirX * 20,
            vy: 0,
            damage,
            life: 0.22,
            size: 48 * area,
            pierce: 99,
            sprite: 'slash',
            angle: side * dirX > 0 ? 0 : Math.PI,
          });
        }
        break;
      }
      case 'wand': {
        for (let i = 0; i < amount; i++) {
          const target = nearestEnemy(state, p.x, p.y);
          let ang = Math.random() * Math.PI * 2;
          if (target) ang = Math.atan2(target.y - p.y, target.x - p.x) + (i - (amount - 1) / 2) * 0.15;
          state.projectiles.push({
            id: uid(),
            powerId: op.id,
            x: p.x,
            y: p.y,
            vx: Math.cos(ang) * speed,
            vy: Math.sin(ang) * speed,
            damage,
            life: 1.4,
            size: 14,
            pierce: 1 + Math.floor(level / 3),
            sprite: 'proj_blue',
            angle: ang,
          });
        }
        break;
      }
      case 'knife': {
        for (let i = 0; i < amount; i++) {
          const ang = Math.atan2(dirY || 0, dirX) + (i - (amount - 1) / 2) * 0.18;
          state.projectiles.push({
            id: uid(),
            powerId: op.id,
            x: p.x,
            y: p.y,
            vx: Math.cos(ang) * speed,
            vy: Math.sin(ang) * speed,
            damage,
            life: 0.9,
            size: 12,
            pierce: 1,
            sprite: 'proj_light',
            angle: ang,
          });
        }
        break;
      }
      case 'axe': {
        for (let i = 0; i < amount; i++) {
          const ang = -Math.PI / 2 + (i - (amount - 1) / 2) * 0.4;
          state.projectiles.push({
            id: uid(),
            powerId: op.id,
            x: p.x,
            y: p.y,
            vx: Math.cos(ang) * speed,
            vy: Math.sin(ang) * speed - 80,
            damage,
            life: duration,
            size: 22,
            pierce: 99,
            sprite: 'proj_fire',
            angle: ang,
          });
        }
        break;
      }
      case 'cross': {
        for (let i = 0; i < amount; i++) {
          const target = nearestEnemy(state, p.x, p.y);
          const ang = target ? Math.atan2(target.y - p.y, target.x - p.x) : Math.random() * Math.PI * 2;
          state.projectiles.push({
            id: uid(),
            powerId: op.id,
            x: p.x,
            y: p.y,
            vx: Math.cos(ang) * speed,
            vy: Math.sin(ang) * speed,
            damage,
            life: duration,
            size: 18,
            pierce: 99,
            sprite: 'proj_light',
            angle: ang,
            returning: false,
            ownerDist: 0,
          });
        }
        break;
      }
      case 'orbit': {
        // keep orbit projectiles refreshed
        const existing = state.projectiles.filter((pr) => pr.powerId === op.id);
        const need = amount + 1;
        while (existing.length < need) {
          const orbitAngle = (existing.length / need) * Math.PI * 2;
          const proj: Projectile = {
            id: uid(),
            powerId: op.id,
            x: p.x,
            y: p.y,
            vx: 0,
            vy: 0,
            damage,
            life: 9999,
            size: 16,
            pierce: 99,
            sprite: 'proj_blue',
            angle: 0,
            orbitAngle,
            orbitRadius: 70 * area,
          };
          state.projectiles.push(proj);
          existing.push(proj);
        }
        for (const pr of existing) {
          pr.damage = damage;
          pr.orbitRadius = 70 * area;
          pr.life = 9999;
        }
        state.cooldowns[cdKey] = 0.15;
        break;
      }
      case 'lightning': {
        const pool = [...state.enemies].sort(() => Math.random() - 0.5).slice(0, amount);
        for (const e of pool) {
          e.hp -= damage;
          e.hitFlash = 0.12;
          burst(state, e.x, e.y, '#ffe566');
          if (e.hp <= 0) killEnemy(state, e);
        }
        break;
      }
      case 'fire': {
        for (let i = 0; i < amount; i++) {
          const ang = Math.random() * Math.PI * 2;
          state.projectiles.push({
            id: uid(),
            powerId: op.id,
            x: p.x,
            y: p.y,
            vx: Math.cos(ang) * speed,
            vy: Math.sin(ang) * speed,
            damage,
            life: duration,
            size: 16,
            pierce: 3,
            sprite: 'proj_fire',
            angle: ang,
          });
        }
        break;
      }
      case 'garlic': {
        // persistent aura zone that follows the player
        const existing = state.zones.find((z) => z.follow);
        if (existing) {
          existing.r = 70 * area;
          existing.damage = damage;
          existing.life = 1;
        } else {
          state.zones.push({
            id: uid(),
            x: p.x,
            y: p.y,
            r: 70 * area,
            damage,
            life: 1,
            tick: 0,
            color: 'rgba(140,220,120,0.18)',
            follow: true,
          });
        }
        state.cooldowns[cdKey] = 0.2;
        break;
      }
      case 'holywater': {
        for (let i = 0; i < amount; i++) {
          const ang = Math.random() * Math.PI * 2;
          const dist = 40 + Math.random() * 90 * area;
          state.zones.push({
            id: uid(),
            x: p.x + Math.cos(ang) * dist,
            y: p.y + Math.sin(ang) * dist,
            r: 42 * area,
            damage: damage,
            life: duration,
            tick: 0,
            color: 'rgba(80,160,230,0.25)',
          });
        }
        break;
      }
      case 'thorns': {
        const near = state.enemies
          .map((e) => ({ e, d: (e.x - p.x) ** 2 + (e.y - p.y) ** 2 }))
          .sort((a, b) => a.d - b.d)
          .slice(0, amount);
        for (const { e } of near) {
          state.zones.push({
            id: uid(),
            x: e.x,
            y: e.y,
            r: 40 * area,
            damage,
            life: 0.35,
            tick: 0,
            color: 'rgba(100,180,90,0.3)',
          });
        }
        break;
      }
      case 'wind': {
        for (let i = 0; i < amount; i++) {
          const ang = Math.atan2(dirY || 0, dirX) + (i - (amount - 1) / 2) * 0.25;
          state.projectiles.push({
            id: uid(),
            powerId: op.id,
            x: p.x,
            y: p.y,
            vx: Math.cos(ang) * speed,
            vy: Math.sin(ang) * speed,
            damage,
            life: 0.7,
            size: 18 * area,
            pierce: 4,
            sprite: 'proj_light',
            angle: ang,
          });
        }
        break;
      }
    }
  }
}

function burst(state: GameState, x: number, y: number, color: string) {
  for (let i = 0; i < 6; i++) {
    const ang = Math.random() * Math.PI * 2;
    state.particles.push({
      id: uid(),
      x,
      y,
      vx: Math.cos(ang) * (40 + Math.random() * 80),
      vy: Math.sin(ang) * (40 + Math.random() * 80),
      life: 0.3 + Math.random() * 0.3,
      color,
      size: 2 + Math.random() * 3,
    });
  }
}

function killEnemy(state: GameState, e: Enemy) {
  state.player.kills += 1;
  state.score += e.score;
  state.pickups.push({
    id: uid(),
    kind: 'gem',
    x: e.x,
    y: e.y,
    value: e.xp,
    life: 20,
  });
  if (Math.random() < 0.08) {
    state.pickups.push({ id: uid(), kind: 'coin', x: e.x + 8, y: e.y, value: 1 + Math.floor(Math.random() * 3), life: 20 });
  }
  if (Math.random() < 0.03) {
    state.pickups.push({ id: uid(), kind: 'meat', x: e.x - 8, y: e.y, value: 15, life: 20 });
  }
  burst(state, e.x, e.y, '#ff8899');
  state.enemies = state.enemies.filter((x) => x.id !== e.id);
}

function gainXp(state: GameState, amount: number) {
  const p = state.player;
  p.xp += amount;
  let gained = 0;
  while (p.xp >= p.xpToNext) {
    p.xp -= p.xpToNext;
    p.level += 1;
    p.xpToNext = xpForLevel(p.level);
    p.maxHp += 5;
    p.hp = Math.min(p.maxHp, p.hp + 10);
    gained += 1;
  }
  if (gained > 0) {
    state.pendingLevels += gained;
    if (state.phase === 'playing') offerLevelUp(state);
  }
}

export function offerLevelUp(state: GameState) {
  if (state.pendingLevels <= 0) {
    state.phase = 'playing';
    state.levelChoices = [];
    return;
  }
  const owned = new Map(state.player.powers.map((p) => [p.id, p.level]));
  const weaponsOwned = state.player.powers.filter((p) => getPower(p.id).kind === 'weapon').length;
  const pool = POWERS.filter((def) => {
    const lv = owned.get(def.id) ?? 0;
    if (lv >= def.maxLevel) return false;
    // soft cap: max 6 weapons
    if (def.kind === 'weapon' && !owned.has(def.id) && weaponsOwned >= 6) return false;
    return true;
  });
  // Prefer new weapons early, then upgrades / passives
  const weighted = [...pool].sort((a, b) => {
    const aNew = owned.has(a.id) ? 0 : a.kind === 'weapon' ? 2 : 1;
    const bNew = owned.has(b.id) ? 0 : b.kind === 'weapon' ? 2 : 1;
    return bNew - aNew + (Math.random() - 0.5);
  });
  const picks: PowerDef[] = [];
  for (const def of weighted) {
    if (picks.length >= 3) break;
    picks.push(def);
  }
  state.levelChoices = picks.slice(0, 3);
  if (state.levelChoices.length) state.phase = 'levelup';
  else {
    state.pendingLevels = 0;
    state.phase = 'playing';
  }
}

export function choosePower(state: GameState, powerId: string) {
  const existing = state.player.powers.find((p) => p.id === powerId);
  if (existing) existing.level = Math.min(getPower(powerId).maxLevel, existing.level + 1);
  else state.player.powers.push({ id: powerId, level: 1 });
  // rebuild orbits if bible upgraded
  if (getPower(powerId).pattern === 'orbit') {
    state.projectiles = state.projectiles.filter((pr) => pr.powerId !== powerId);
    state.cooldowns[powerId] = 0;
  }
  state.levelChoices = [];
  state.pendingLevels = Math.max(0, state.pendingLevels - 1);
  state.messages.push({ text: getPower(powerId).name, life: 1.5 });
  if (state.pendingLevels > 0) offerLevelUp(state);
  else state.phase = 'playing';
}

export function startRun(state: GameState) {
  const fresh = createInitialState();
  Object.assign(state, fresh);
  state.phase = 'playing';
}

export function updateGame(state: GameState, dt: number) {
  if (state.phase !== 'playing') return;

  if (state.hitStop > 0) {
    state.hitStop -= dt;
    return;
  }

  const p = state.player;
  const bonus = getBonuses(p);
  state.time += dt;
  if (state.shake > 0) state.shake = Math.max(0, state.shake - dt * 8);

  // move
  const speed = 145 * bonus.moveSpeed;
  let ix = state.input.x;
  let iy = state.input.y;
  const len = Math.hypot(ix, iy);
  if (len > 1) {
    ix /= len;
    iy /= len;
  }
  p.vx = ix * speed;
  p.vy = iy * speed;
  p.x += p.vx * dt;
  p.y += p.vy * dt;
  const half = state.worldSize / 2;
  p.x = Math.max(-half, Math.min(half, p.x));
  p.y = Math.max(-half, Math.min(half, p.y));
  if (Math.abs(p.vx) > 5) p.facing = Math.sign(p.vx);
  p.invuln = Math.max(0, p.invuln - dt);

  // regen
  if (bonus.recovery > 0) p.hp = Math.min(p.maxHp, p.hp + bonus.recovery * dt);

  // spawn
  const wave = waveTable(state.time);
  const enemyCap = Math.min(160, 40 + Math.floor(state.time / 8));
  state.spawnAcc += dt * wave.rate;
  while (state.spawnAcc >= 1 && state.enemies.length < enemyCap) {
    state.spawnAcc -= 1;
    const type = wave.types[Math.floor(Math.random() * wave.types.length)];
    if (type === 'boss' && state.bossSpawned) continue;
    spawnEnemy(state, type === 'boss' ? 'boss' : type, wave.hpMul, wave.speedMul);
    if (type === 'boss') state.bossSpawned = true;
  }
  if (state.time > 300 && !state.bossSpawned) {
    spawnEnemy(state, 'boss', 1, 1);
    state.bossSpawned = true;
    state.messages.push({ text: 'Senhor das Sombras despertou!', life: 3 });
  }

  // enemies + light separation
  for (let i = 0; i < state.enemies.length; i++) {
    const e = state.enemies[i];
    const dx = p.x - e.x;
    const dy = p.y - e.y;
    const d = Math.hypot(dx, dy) || 1;
    e.x += (dx / d) * e.speed * dt;
    e.y += (dy / d) * e.speed * dt;
    // separate from a neighbor to reduce stacking
    if (i > 0) {
      const o = state.enemies[i - 1];
      const sx = e.x - o.x;
      const sy = e.y - o.y;
      const sd = Math.hypot(sx, sy);
      if (sd > 0 && sd < 18) {
        e.x += (sx / sd) * 20 * dt;
        e.y += (sy / sd) * 20 * dt;
      }
    }
    e.hitFlash = Math.max(0, e.hitFlash - dt);
    if (d < (e.size + 18) / 2 && p.invuln <= 0) {
      const dmg = Math.max(1, e.damage - bonus.armor);
      p.hp -= dmg;
      p.invuln = 0.7;
      state.shake = 6;
      state.hitStop = 0.04;
      if (p.hp <= 0) {
        p.hp = 0;
        state.phase = 'dead';
      }
    }
  }

  fireWeapons(state, dt);

  // projectiles
  for (const pr of state.projectiles) {
    if (!pr.hitSet) pr.hitSet = new Set();
    if (pr.orbitRadius != null && pr.orbitAngle != null) {
      pr.orbitAngle += 2.4 * dt;
      pr.x = p.x + Math.cos(pr.orbitAngle) * pr.orbitRadius;
      pr.y = p.y + Math.sin(pr.orbitAngle) * pr.orbitRadius;
      pr.angle = pr.orbitAngle;
      // orbit can re-hit after leaving
      if (Math.random() < 0.02) pr.hitSet.clear();
    } else if (pr.powerId === 'axe') {
      pr.vy += 220 * dt;
      pr.x += pr.vx * dt;
      pr.y += pr.vy * dt;
      pr.angle += 8 * dt;
    } else if (pr.powerId === 'cross') {
      pr.ownerDist = (pr.ownerDist ?? 0) + Math.hypot(pr.vx, pr.vy) * dt;
      if (!pr.returning && (pr.ownerDist ?? 0) > 220) {
        pr.returning = true;
        pr.hitSet.clear();
      }
      if (pr.returning) {
        const dx = p.x - pr.x;
        const dy = p.y - pr.y;
        const d = Math.hypot(dx, dy) || 1;
        pr.vx = (dx / d) * 280;
        pr.vy = (dy / d) * 280;
        if (d < 20) pr.life = 0;
      }
      pr.x += pr.vx * dt;
      pr.y += pr.vy * dt;
      pr.angle += 6 * dt;
    } else {
      pr.x += pr.vx * dt;
      pr.y += pr.vy * dt;
    }
    pr.life -= dt;

    for (const e of state.enemies) {
      if (pr.hitSet.has(e.id)) continue;
      const d = Math.hypot(e.x - pr.x, e.y - pr.y);
      if (d < (e.size + pr.size) / 2) {
        pr.hitSet.add(e.id);
        e.hp -= pr.damage;
        e.hitFlash = 0.1;
        pr.pierce -= 1;
        burst(state, e.x, e.y, '#fff');
        if (e.hp <= 0) killEnemy(state, e);
        if (pr.pierce <= 0 && pr.orbitRadius == null) {
          pr.life = 0;
          break;
        }
      }
    }
  }
  state.projectiles = state.projectiles.filter((pr) => pr.life > 0);

  // zones
  for (const z of state.zones) {
    if (z.follow) {
      z.x = p.x;
      z.y = p.y;
      z.life = 1;
    }
    z.life -= dt;
    z.tick -= dt;
    if (z.tick <= 0) {
      z.tick = 0.25;
      for (const e of state.enemies) {
        if (Math.hypot(e.x - z.x, e.y - z.y) < z.r) {
          e.hp -= z.damage;
          e.hitFlash = 0.08;
          if (e.hp <= 0) killEnemy(state, e);
        }
      }
    }
  }

  state.zones = state.zones.filter((z) => z.life > 0 || z.follow);

  // pickups + vacuum when crowded
  const vacuum = state.pickups.length > 80;
  for (const g of state.pickups) {
    g.life -= dt;
    const d = Math.hypot(g.x - p.x, g.y - p.y);
    const magnet = vacuum ? 9999 : bonus.magnet;
    if (d < magnet) {
      const pull = Math.min(1, vacuum ? 1 : (magnet - d) / magnet) * (vacuum ? 520 : 340) * dt;
      const nx = (p.x - g.x) / (d || 1);
      const ny = (p.y - g.y) / (d || 1);
      g.x += nx * pull;
      g.y += ny * pull;
    }
    if (d < 24) {
      if (g.kind === 'gem') gainXp(state, g.value);
      if (g.kind === 'coin') p.gold += g.value;
      if (g.kind === 'meat') p.hp = Math.min(p.maxHp, p.hp + g.value);
      g.life = 0;
    }
  }
  state.pickups = state.pickups.filter((g) => g.life > 0);

  // particles
  for (const pt of state.particles) {
    pt.x += pt.vx * dt;
    pt.y += pt.vy * dt;
    pt.life -= dt;
  }
  state.particles = state.particles.filter((pt) => pt.life > 0);
  if (state.particles.length > 250) state.particles.length = 250;

  for (const m of state.messages) m.life -= dt;
  state.messages = state.messages.filter((m) => m.life > 0);

  state.camera.x = p.x;
  state.camera.y = p.y;

  if (state.time >= 900 && Math.floor(state.time) === 900) {
    state.messages.push({ text: 'Sobreviveu 15 minutos!', life: 4 });
  }
}
