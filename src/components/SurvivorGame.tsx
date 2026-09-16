import { useEffect, useRef, useState } from 'react';
import {
  choosePower,
  createInitialState,
  startRun,
  updateGame,
  type GameState,
} from '../game/engine';
import { audio } from '../game/audio';
import { getPower } from '../game/powers';

function formatTime(t: number) {
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

type PoolImg = HTMLImageElement & { _busy?: boolean };

function makePool(src: string, size: number): PoolImg[] {
  return Array.from({ length: size }, () => {
    const el = document.createElement('img') as PoolImg;
    el.src = src;
    el.draggable = false;
    el.alt = '';
    el.className = 'spr';
    el._busy = false;
    el.style.display = 'none';
    return el;
  });
}

export function SurvivorGame() {
  const rootRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<HTMLDivElement>(null);
  const layerFxRef = useRef<HTMLDivElement>(null);
  const layerEnemyRef = useRef<HTMLDivElement>(null);
  const layerPickupRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<HTMLImageElement>(null);
  const auraRef = useRef<HTMLImageElement>(null);

  const stateRef = useRef<GameState>(createInitialState());
  const keysRef = useRef<Record<string, boolean>>({});
  const touchRef = useRef({ active: false, ox: 0, oy: 0, x: 0, y: 0 });
  const hurtGate = useRef(false);
  const pools = useRef<{
    enemies: Map<string, PoolImg[]>;
    projectiles: Map<string, PoolImg[]>;
    pickups: Map<string, PoolImg[]>;
    zones: PoolImg[];
  } | null>(null);

  const [muted, setMuted] = useState(false);
  const [ui, setUi] = useState({
    phase: 'title' as GameState['phase'],
    hp: 100,
    maxHp: 100,
    level: 1,
    xp: 0,
    xpToNext: 1,
    time: 0,
    score: 0,
    gold: 0,
    kills: 0,
    powers: [] as { id: string; level: number }[],
    choices: [] as { id: string; name: string; description: string; kind: string; icon: string; levelLabel: string }[],
    pendingLevels: 0,
    message: '',
  });

  useEffect(() => {
    // pools de imagens PNG
    const enemyTypes = ['bat', 'slime', 'skeleton', 'wolf', 'ghost', 'mage', 'golem', 'boss'];
    const enemies = new Map<string, PoolImg[]>();
    for (const t of enemyTypes) enemies.set(t, makePool(`/assets/enemies/${t}.png`, t === 'bat' || t === 'slime' ? 80 : 40));

    const projectiles = new Map<string, PoolImg[]>();
    for (const t of ['slash', 'proj_blue', 'proj_fire', 'proj_light']) {
      projectiles.set(t, makePool(`/assets/fx/${t}.png`, 40));
    }

    const pickups = new Map<string, PoolImg[]>();
    pickups.set('gem', makePool('/assets/fx/gem.png', 60));
    pickups.set('coin', makePool('/assets/fx/coin.png', 20));
    pickups.set('meat', makePool('/assets/ui/heart.png', 10));

    const zones = makePool('/assets/fx/aura_green.png', 30);

    pools.current = { enemies, projectiles, pickups, zones };

    const enemyLayer = layerEnemyRef.current!;
    const fxLayer = layerFxRef.current!;
    const pickupLayer = layerPickupRef.current!;
    for (const list of enemies.values()) list.forEach((el) => enemyLayer.appendChild(el));
    for (const list of projectiles.values()) list.forEach((el) => fxLayer.appendChild(el));
    zones.forEach((el) => fxLayer.appendChild(el));
    for (const list of pickups.values()) list.forEach((el) => pickupLayer.appendChild(el));

    void audio.unlock();
    audio.play('menu');

    const onKey = (e: KeyboardEvent, down: boolean) => {
      keysRef.current[e.code] = down;
      if (down && e.code === 'Escape') {
        const st = stateRef.current;
        if (st.phase === 'playing') st.phase = 'paused';
        else if (st.phase === 'paused') st.phase = 'playing';
        e.preventDefault();
      }
      if (down && (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'ArrowDown')) {
        if (['playing', 'title'].includes(stateRef.current.phase)) e.preventDefault();
      }
      if (down && e.code === 'Enter' && (stateRef.current.phase === 'title' || stateRef.current.phase === 'dead')) {
        begin();
      }
      if (down && stateRef.current.phase === 'levelup') {
        const idx = e.code === 'Digit1' ? 0 : e.code === 'Digit2' ? 1 : e.code === 'Digit3' ? 2 : -1;
        const choice = stateRef.current.levelChoices[idx];
        if (choice) pickPower(choice.id);
      }
    };
    const kd = (e: KeyboardEvent) => onKey(e, true);
    const ku = (e: KeyboardEvent) => onKey(e, false);
    window.addEventListener('keydown', kd);
    window.addEventListener('keyup', ku);

    let last = performance.now();
    let raf = 0;
    let uiAcc = 0;

    const loop = (now: number) => {
      const dt = Math.min(0.033, (now - last) / 1000);
      last = now;
      const st = stateRef.current;

      let ix = 0;
      let iy = 0;
      const k = keysRef.current;
      if (k.KeyW || k.ArrowUp) iy -= 1;
      if (k.KeyS || k.ArrowDown) iy += 1;
      if (k.KeyA || k.ArrowLeft) ix -= 1;
      if (k.KeyD || k.ArrowRight) ix += 1;
      const touch = touchRef.current;
      if (touch.active) {
        ix = (touch.x - touch.ox) / 40;
        iy = (touch.y - touch.oy) / 40;
        const l = Math.hypot(ix, iy) || 1;
        if (l > 1) {
          ix /= l;
          iy /= l;
        }
      }
      st.input.x = ix;
      st.input.y = iy;

      const prev = st.phase;
      updateGame(st, dt);
      if (prev === 'playing' && st.phase === 'levelup') {
        audio.sfx('level');
        audio.play('levelup');
      }
      if (prev === 'playing' && st.phase === 'dead') {
        audio.sfx('hurt');
        audio.play('dead');
      }
      if (st.phase === 'playing') {
        if (st.player.invuln > 0.65) {
          if (!hurtGate.current) {
            hurtGate.current = true;
            audio.sfx('hurt');
          }
        } else hurtGate.current = false;
      }

      renderWorld(st);
      uiAcc += dt;
      if (uiAcc > 0.1 || st.phase !== prev) {
        uiAcc = 0;
        syncUi(st);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', kd);
      window.removeEventListener('keyup', ku);
      audio.stop();
    };
  }, []);

  function begin() {
    void audio.unlock();
    startRun(stateRef.current);
    audio.sfx('start');
    audio.play('battle');
    syncUi(stateRef.current);
  }

  function pickPower(id: string) {
    choosePower(stateRef.current, id);
    audio.sfx('select');
    if (stateRef.current.phase === 'playing') audio.play('battle');
    syncUi(stateRef.current);
  }

  function syncUi(st: GameState) {
    setUi({
      phase: st.phase,
      hp: st.player.hp,
      maxHp: st.player.maxHp,
      level: st.player.level,
      xp: st.player.xp,
      xpToNext: st.player.xpToNext,
      time: st.time,
      score: st.score,
      gold: st.player.gold,
      kills: st.player.kills,
      powers: st.player.powers.map((p) => ({ id: p.id, level: p.level })),
      pendingLevels: st.pendingLevels,
      message: st.messages[0]?.text ?? '',
      choices: st.levelChoices.map((c) => {
        const owned = st.player.powers.find((p) => p.id === c.id);
        return {
          id: c.id,
          name: c.name,
          description: c.description,
          kind: c.kind,
          icon: c.icon,
          levelLabel: owned ? `Nível ${owned.level} → ${owned.level + 1}` : 'NOVO',
        };
      }),
    });
  }

  function takeFromPool(list: PoolImg[]): PoolImg | null {
    const el = list.find((x) => !x._busy);
    if (!el) return null;
    el._busy = true;
    el.style.display = 'block';
    return el;
  }

  function clearPool(list: PoolImg[]) {
    for (const el of list) {
      el._busy = false;
      el.style.display = 'none';
    }
  }

  function renderWorld(st: GameState) {
    const world = worldRef.current;
    const root = rootRef.current;
    const player = playerRef.current;
    const aura = auraRef.current;
    const p = pools.current;
    if (!world || !root || !player || !p) return;

    const w = root.clientWidth;
    const h = root.clientHeight;
    const shakeX = st.shake ? (Math.random() - 0.5) * st.shake : 0;
    const shakeY = st.shake ? (Math.random() - 0.5) * st.shake : 0;
    const camX = st.camera.x - w / 2 + shakeX;
    const camY = st.camera.y - h / 2 + shakeY;
    world.style.transform = `translate(${-camX}px, ${-camY}px)`;

    // player PNG
    player.style.transform = `translate(${st.player.x - 24}px, ${st.player.y - 28}px) scaleX(${st.player.facing < 0 ? -1 : 1})`;
    player.src = st.player.invuln > 0 && Math.floor(st.player.invuln * 20) % 2 === 0
      ? '/assets/player/nicolas_hurt.png'
      : '/assets/player/nicolas.png';
    player.style.opacity = st.player.invuln > 0 ? '0.85' : '1';

    // clear pools each frame (simple & reliable)
    for (const list of p.enemies.values()) clearPool(list);
    for (const list of p.projectiles.values()) clearPool(list);
    for (const list of p.pickups.values()) clearPool(list);
    clearPool(p.zones);

    // garlic aura
    const follow = st.zones.find((z) => z.follow);
    if (aura) {
      if (follow) {
        aura.style.display = 'block';
        const size = follow.r * 2;
        aura.style.width = `${size}px`;
        aura.style.height = `${size}px`;
        aura.style.transform = `translate(${follow.x - size / 2}px, ${follow.y - size / 2}px)`;
      } else {
        aura.style.display = 'none';
      }
    }

    // zones (holy water etc)
    for (const z of st.zones) {
      if (z.follow) continue;
      const el = takeFromPool(p.zones);
      if (!el) break;
      const size = z.r * 2;
      el.style.width = `${size}px`;
      el.style.height = `${size}px`;
      el.style.opacity = '0.55';
      el.style.transform = `translate(${z.x - size / 2}px, ${z.y - size / 2}px)`;
    }

    // pickups
    for (const g of st.pickups) {
      const list = p.pickups.get(g.kind);
      if (!list) continue;
      const el = takeFromPool(list);
      if (!el) continue;
      el.style.width = '20px';
      el.style.height = '20px';
      el.style.transform = `translate(${g.x - 10}px, ${g.y - 10}px)`;
    }

    // enemies (limit draw count for perf)
    const viewPad = 80;
    let drawn = 0;
    for (const e of st.enemies) {
      if (drawn > 120) break;
      if (e.x < camX - viewPad || e.x > camX + w + viewPad || e.y < camY - viewPad || e.y > camY + h + viewPad) continue;
      const list = p.enemies.get(e.type);
      if (!list) continue;
      const el = takeFromPool(list);
      if (!el) continue;
      el.style.width = `${e.size}px`;
      el.style.height = `${e.size}px`;
      el.style.opacity = e.hitFlash > 0 ? '0.5' : '1';
      el.style.filter = e.hitFlash > 0 ? 'brightness(2)' : 'none';
      el.style.transform = `translate(${e.x - e.size / 2}px, ${e.y - e.size / 2}px)`;
      drawn++;
    }

    // projectiles
    for (const pr of st.projectiles) {
      const key = pr.sprite;
      const list = p.projectiles.get(key) ?? p.projectiles.get('proj_blue');
      if (!list) continue;
      const el = takeFromPool(list);
      if (!el) continue;
      el.style.width = `${pr.size}px`;
      el.style.height = `${pr.size}px`;
      el.style.transform = `translate(${pr.x - pr.size / 2}px, ${pr.y - pr.size / 2}px) rotate(${pr.angle}rad)`;
    }
  }

  function onPointer(e: React.PointerEvent, type: 'down' | 'move' | 'up') {
    const root = rootRef.current;
    if (!root) return;
    const rect = root.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const st = stateRef.current;

    if (type === 'down') {
      void audio.unlock();
      if (st.phase === 'title' || st.phase === 'dead') {
        begin();
        return;
      }
      if (y > rect.height * 0.35 && st.phase === 'playing') {
        touchRef.current = { active: true, ox: x, oy: y, x, y };
      }
    }
    if (type === 'move' && touchRef.current.active) {
      touchRef.current.x = x;
      touchRef.current.y = y;
    }
    if (type === 'up') touchRef.current.active = false;
  }

  const xpPct = Math.max(0, Math.min(100, (ui.xp / Math.max(1, ui.xpToNext)) * 100));
  const hpPct = Math.max(0, Math.min(100, (ui.hp / Math.max(1, ui.maxHp)) * 100));

  return (
    <div
      className="survivor-root"
      ref={rootRef}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        onPointer(e, 'down');
      }}
      onPointerMove={(e) => onPointer(e, 'move')}
      onPointerUp={(e) => onPointer(e, 'up')}
      onPointerCancel={(e) => onPointer(e, 'up')}
    >
      <div className="world" ref={worldRef}>
        <div className="ground" />
        <img ref={auraRef} className="spr aura" src="/assets/fx/aura_green.png" alt="" draggable={false} style={{ display: 'none' }} />
        <div className="layer pickups" ref={layerPickupRef} />
        <div className="layer fx" ref={layerFxRef} />
        <div className="layer enemies" ref={layerEnemyRef} />
        <img
          ref={playerRef}
          className="spr player"
          src="/assets/player/nicolas.png"
          alt="Nicolas"
          draggable={false}
        />
      </div>

      {(ui.phase === 'playing' || ui.phase === 'paused' || ui.phase === 'levelup') && (
        <div className="hud">
          <div className="hud-card left">
            <div className="name">NICOLAS</div>
            <div className="bar hp"><span style={{ width: `${hpPct}%` }} /></div>
            <div className="meta">Nv.{ui.level}</div>
          </div>
          <div className="hud-card right">
            <div className="clock">{formatTime(ui.time)}</div>
            <div className="score">{ui.score} pts</div>
          </div>
          <div className="xp-bar"><span style={{ width: `${xpPct}%` }} /><em>Nv.{ui.level}</em></div>
          <div className="power-strip">
            {ui.powers.filter((pw) => getPower(pw.id).kind === 'weapon').map((pw) => (
              <div key={pw.id} className="power-icon">
                <img src={`/assets/powers/${pw.id}.png`} alt="" draggable={false} />
                <i>{pw.level}</i>
              </div>
            ))}
          </div>
          {ui.message && <div className="toast-msg">{ui.message}</div>}
        </div>
      )}

      {ui.phase === 'title' && (
        <div className="overlay title">
          <img src="/assets/ui/logo.png" alt="" className="logo" draggable={false} />
          <h1>NICOLAS</h1>
          <h2>SURVIVORS OF ELDORIA</h2>
          <p className="cta">TOQUE / ENTER PARA COMEÇAR</p>
          <p className="hint">WASD ou joystick · escolha poderes ao subir de nível</p>
        </div>
      )}

      {ui.phase === 'levelup' && (
        <div className="overlay levelup">
          <h2>{ui.pendingLevels > 1 ? `SUBIU DE NÍVEL! (x${ui.pendingLevels})` : 'SUBIU DE NÍVEL!'}</h2>
          <p>Escolha um poder</p>
          <div className="cards">
            {ui.choices.map((c, i) => (
              <button key={c.id} type="button" className="card" onClick={() => pickPower(c.id)}>
                <img src={`/assets/powers/${c.icon}.png`} alt="" draggable={false} />
                <strong>{c.name}</strong>
                <span className="desc">{c.description}</span>
                <span className="tag">{c.kind === 'weapon' ? 'ARMA' : 'PASSIVA'}</span>
                <span className="lvl">{c.levelLabel}</span>
                <span className="key">{i + 1}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {ui.phase === 'paused' && (
        <div className="overlay dim">
          <h2>PAUSADO</h2>
          <p>Esc para continuar</p>
        </div>
      )}

      {ui.phase === 'dead' && (
        <div className="overlay dead">
          <h2>DERROTA</h2>
          <p>Tempo {formatTime(ui.time)}</p>
          <p>Nível {ui.level} · {ui.kills} baixas</p>
          <p>{ui.score} pontos · {ui.gold} ouro</p>
          <p className="cta">TOQUE / ENTER — NOVA RUN</p>
        </div>
      )}

      {touchRef.current.active === false && null}
      <div className="audio-dock">
        <button
          type="button"
          onClick={() => {
            const next = !muted;
            setMuted(next);
            audio.setMuted(next);
            void audio.unlock();
          }}
        >
          {muted ? 'Som: OFF' : 'Som: ON'}
        </button>
        <label>
          Música
          <input type="range" min={0} max={100} defaultValue={65} onChange={(e) => audio.setMusic(+e.target.value / 100)} />
        </label>
        <label>
          SFX
          <input type="range" min={0} max={100} defaultValue={80} onChange={(e) => audio.setSfx(+e.target.value / 100)} />
        </label>
      </div>
    </div>
  );
}
