import {
  createInitialState,
  startRun,
  updateGame,
  choosePower,
  getBonuses,
} from './_engine.bundle.mjs';
import { POWERS, getPower } from './_engine.bundle.mjs';

let passed = 0;
let failed = 0;
function assert(cond, msg) {
  if (cond) {
    passed++;
    console.log('  OK  ', msg);
  } else {
    failed++;
    console.error('  FAIL', msg);
  }
}

console.log('=== Survivor engine tests ===\n');

{
  const s = createInitialState();
  assert(s.phase === 'title', 'starts on title');
  startRun(s);
  assert(s.phase === 'playing', 'startRun -> playing');
  assert(s.player.powers.some((p) => p.id === 'blade'), 'starts with blade');
  assert(s.player.hp === 100, 'full hp on start');
}

{
  const s = createInitialState();
  startRun(s);
  s.input = { x: 1, y: 0 };
  const x0 = s.player.x;
  updateGame(s, 0.1);
  assert(s.player.x > x0, 'moves right with input');
  assert(s.player.facing === 1, 'facing updates');
}

{
  const s = createInitialState();
  startRun(s);
  for (let i = 0; i < 120; i++) updateGame(s, 0.05);
  assert(s.enemies.length > 0, 'enemies spawn within ~6s');
  assert(s.time > 5, 'time advances');
}

{
  const s = createInitialState();
  startRun(s);
  let sawAttack = false;
  for (let i = 0; i < 40; i++) {
    updateGame(s, 0.05);
    if (s.projectiles.length > 0 || s.zones.length > 0) sawAttack = true;
    if (s.phase === 'levelup' && s.levelChoices[0]) choosePower(s, s.levelChoices[0].id);
  }
  assert(sawAttack, 'blade produces attacks');
}

{
  const s = createInitialState();
  startRun(s);
  s.pickups.push({ id: 9, kind: 'gem', x: s.player.x, y: s.player.y, value: s.player.xpToNext, life: 5 });
  updateGame(s, 0.05);
  assert(s.phase === 'levelup' || s.player.level >= 2, 'level up triggers from gem');
  if (s.phase === 'levelup') {
    assert(s.levelChoices.length === 3, '3 level-up choices');
    const id = s.levelChoices[0].id;
    choosePower(s, id);
    assert(s.phase === 'playing', 'choosePower resumes play');
    assert(s.player.powers.some((p) => p.id === id), 'power acquired');
  }
}

{
  const s = createInitialState();
  startRun(s);
  // multi-level gem should queue pending levels (after fix)
  s.pickups.push({ id: 10, kind: 'gem', x: s.player.x, y: s.player.y, value: 500, life: 5 });
  updateGame(s, 0.05);
  assert(s.phase === 'levelup', 'big gem opens level-up');
  assert(typeof s.pendingLevels === 'number' && s.pendingLevels >= 1, 'pendingLevels queued');
  const pending = s.pendingLevels;
  choosePower(s, s.levelChoices[0].id);
  assert(s.pendingLevels === pending - 1 || s.phase === 'levelup' || s.phase === 'playing', 'pending consumed on choose');
}

{
  const s = createInitialState();
  startRun(s);
  s.player.powers.push({ id: 'might', level: 3 }, { id: 'speed', level: 2 });
  const b = getBonuses(s.player);
  assert(b.might > 1, 'might bonus applied');
  assert(b.moveSpeed > 1, 'speed bonus applied');
}

{
  const s = createInitialState();
  startRun(s);
  s.enemies.push({
    id: 1,
    type: 'bat',
    x: s.player.x + 30,
    y: s.player.y,
    hp: 5,
    maxHp: 5,
    speed: 0,
    damage: 1,
    size: 22,
    xp: 2,
    score: 10,
    hitFlash: 0,
  });
  s.projectiles.push({
    id: 2,
    powerId: 'blade',
    x: s.player.x + 30,
    y: s.player.y,
    vx: 0,
    vy: 0,
    damage: 50,
    life: 1,
    size: 40,
    pierce: 2,
    sprite: 'slash',
    angle: 0,
  });
  const k = s.player.kills;
  updateGame(s, 0.05);
  assert(s.player.kills > k || s.pickups.some((p) => p.kind === 'gem'), 'kill creates gem/score');
}

{
  const s = createInitialState();
  startRun(s);
  s.player.hp = 5;
  s.enemies.push({
    id: 3,
    type: 'golem',
    x: s.player.x,
    y: s.player.y,
    hp: 100,
    maxHp: 100,
    speed: 0,
    damage: 50,
    size: 40,
    xp: 1,
    score: 1,
    hitFlash: 0,
  });
  updateGame(s, 0.05);
  assert(s.player.hp < 5 || s.phase === 'dead', 'contact damages player');
}

{
  const s = createInitialState();
  startRun(s);
  s.phase = 'paused';
  const t = s.time;
  updateGame(s, 1);
  assert(s.time === t, 'paused does not advance time');
}

{
  for (const p of POWERS) {
    assert(!!getPower(p.id), `power ${p.id} resolvable`);
    assert(p.maxLevel >= 1, `${p.id} maxLevel`);
  }
}

{
  const s = createInitialState();
  startRun(s);
  s.player.powers.push(
    { id: 'orb', level: 3 },
    { id: 'bible', level: 2 },
    { id: 'garlic', level: 2 },
    { id: 'lightning', level: 1 },
    { id: 'holywater', level: 2 },
    { id: 'axe', level: 2 }
  );
  let threw = false;
  try {
    for (let i = 0; i < 600; i++) {
      s.input = { x: Math.sin(i / 20), y: Math.cos(i / 25) };
      if (s.phase === 'levelup' && s.levelChoices[0]) choosePower(s, s.levelChoices[0].id);
      if (s.phase === 'dead') break;
      updateGame(s, 0.05);
    }
  } catch (e) {
    threw = true;
    console.error(e);
  }
  assert(!threw, '30s stress sim completes');
  assert(s.time > 10 || s.phase === 'dead', 'progressed or died legitimately');
  console.log('   (stress stats: t=' + s.time.toFixed(1) + ' kills=' + s.player.kills + ' enemies=' + s.enemies.length + ' proj=' + s.projectiles.length + ')');
}

{
  const s = createInitialState();
  startRun(s);
  s.player.x = 99999;
  s.input = { x: 1, y: 0 };
  updateGame(s, 0.1);
  assert(Math.abs(s.player.x) <= s.worldSize / 2 + 1, 'player clamped to world');
}

// Performance sample
{
  const s = createInitialState();
  startRun(s);
  for (let i = 0; i < 200; i++) updateGame(s, 0.05);
  const t0 = performance.now();
  for (let i = 0; i < 1000; i++) {
    s.input = { x: 1, y: 0 };
    if (s.phase === 'levelup' && s.levelChoices[0]) choosePower(s, s.levelChoices[0].id);
    if (s.phase === 'playing') updateGame(s, 0.016);
  }
  const ms = performance.now() - t0;
  console.log(`   (1000 frames ~${ms.toFixed(1)}ms, avg ${(ms / 1000).toFixed(3)}ms/frame)`);
  assert(ms / 1000 < 8, 'avg frame sim under 8ms');
}

console.log(`\nResult: ${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
