import { writeFileSync } from 'fs';

const rarities = ['comum', 'incomum', 'raro', 'epico', 'lendario', 'mitico', 'reliquia'];
const types = [
  ['espada', 'Espada', 12, 0],
  ['espada_grande', 'Espada Grande', 18, -1],
  ['machado', 'Machado', 14, 0],
  ['machado_grande', 'Machado Grande', 20, -2],
  ['lanca', 'Lança', 13, 1],
  ['arco', 'Arco', 11, 2],
  ['besta', 'Besta', 15, 0],
  ['cajado', 'Cajado', 4, 0],
  ['adaga', 'Adaga', 10, 3],
  ['martelo', 'Martelo', 16, -1],
];
const prefixes = [
  'Simples',
  'De Carvalho',
  'De Ferro',
  'De Aço',
  'Rúnica',
  'Élfica',
  'Ancestral',
  'Celeste',
  'Abissal',
  'Do Crepúsculo',
];

const weapons = [];
for (const [type, label, atk, spd] of types) {
  for (let p = 0; p < 5; p++) {
    const r = rarities[Math.min(p, rarities.length - 1)];
    const name = `${prefixes[p]} ${label}`;
    const id = `w_${type}_${p}`;
    const mult = 1 + p * 0.45;
    weapons.push({
      id,
      name,
      type,
      rarity: r,
      slot: 'arma',
      stats: {
        ataque: Math.round(atk * mult),
        velocidade: spd + Math.floor(p / 2),
        critico: p * 2,
        magia: type === 'cajado' ? Math.round(14 * mult) : Math.floor(p),
      },
      price: Math.round(40 * mult * (p + 1)),
      element: p >= 3 ? ['fogo', 'gelo', 'raio', 'luz', 'trevas'][p % 5] : 'neutro',
      description: `${name} forjada nas oficinas de Eldoria.`,
      sprite: `weapon_${type}`,
    });
  }
}

const extras = [
  ['w_lamina_aurora', 'Lâmina da Aurora', 'espada', 'lendario', 28, 8, 'luz'],
  ['w_arco_ventania', 'Arco Ventania', 'arco', 'epico', 22, 6, 'vento'],
  ['w_cajado_estrelas', 'Cajado das Estrelas', 'cajado', 'mitico', 8, 4, 'luz'],
  ['w_adaga_vespero', 'Adaga Véspero', 'adaga', 'epico', 20, 10, 'trevas'],
  ['w_martelo_trovao', 'Martelo Trovão', 'martelo', 'lendario', 32, 2, 'raio'],
  ['w_lanca_cristal', 'Lança de Cristal', 'lanca', 'raro', 18, 4, 'gelo'],
  ['w_espada_do_saque', 'Espada do Saque', 'espada', 'incomum', 16, 2, 'neutro'],
  ['w_machado_orc', 'Machado Orc', 'machado', 'incomum', 17, 0, 'neutro'],
  ['w_espada_corrompida', 'Espada Corrompida', 'espada', 'epico', 24, 3, 'trevas'],
  ['w_espada_eclipse', 'Espada do Eclipse', 'espada', 'reliquia', 40, 6, 'trevas'],
  ['w_cajado_osso', 'Cajado de Osso', 'cajado', 'raro', 6, 2, 'trevas'],
  ['adaga_enferrujada', 'Adaga Enferrujada', 'adaga', 'comum', 8, 2, 'neutro'],
  ['espada_curta', 'Espada Curta', 'espada', 'comum', 10, 1, 'neutro'],
];

for (const [id, name, type, rarity, ataque, critico, element] of extras) {
  weapons.push({
    id,
    name,
    type,
    rarity,
    slot: 'arma',
    stats: {
      ataque,
      critico,
      magia: type === 'cajado' ? Math.round(ataque * 1.5) : 0,
      velocidade: type === 'adaga' ? 4 : 0,
    },
    price: ataque * 25,
    element,
    description: `${name} — artefato de Eldoria.`,
    sprite: `weapon_${type}`,
  });
}

const armorSlots = [
  ['armadura', 'Armadura', 10, 8],
  ['capacete', 'Elmo', 4, 5],
  ['luvas', 'Luvas', 3, 3],
  ['botas', 'Botas', 3, 2],
  ['escudo', 'Escudo', 8, 10],
];
const armors = [];
for (const [slot, label, def, res] of armorSlots) {
  for (let p = 0; p < 8; p++) {
    const r = rarities[Math.min(p, 6)];
    const mult = 1 + p * 0.4;
    armors.push({
      id: `a_${slot}_${p}`,
      name: `${prefixes[Math.min(p, 9)]} ${label}`,
      slot,
      rarity: r,
      stats: {
        defesa: Math.round(def * mult),
        resistencia: Math.round(res * mult),
        hp: Math.round(10 * mult),
        esquiva: slot === 'botas' ? p * 2 : 0,
      },
      price: Math.round(35 * mult * (p + 1)),
      description: `Proteção ${label.toLowerCase()} de Eldoria.`,
      sprite: `armor_${slot}`,
    });
  }
}
armors.push(
  {
    id: 'armadura_escura',
    name: 'Armadura Escura',
    slot: 'armadura',
    rarity: 'epico',
    stats: { defesa: 28, resistencia: 22, hp: 60 },
    price: 800,
    description: 'Placas tingidas por magia sombria.',
    sprite: 'armor_armadura',
  },
  {
    id: 'armadura_eclipse',
    name: 'Armadura do Eclipse',
    slot: 'armadura',
    rarity: 'reliquia',
    stats: { defesa: 45, resistencia: 40, hp: 120, magia: 10 },
    price: 5000,
    description: 'Veste do Cavaleiro do Eclipse.',
    sprite: 'armor_armadura',
  },
  {
    id: 'manto_sombra',
    name: 'Manto Sombra',
    slot: 'armadura',
    rarity: 'raro',
    stats: { defesa: 12, resistencia: 18, esquiva: 12, magia: 8 },
    price: 450,
    description: 'Leve como a noite.',
    sprite: 'armor_armadura',
  }
);

function toTs(obj) {
  return JSON.stringify(obj, null, 2)
    .replace(/"([^"]+)":/g, '$1:')
    .replace(/"/g, "'");
}

writeFileSync(
  'src/game/config/weapons.ts',
  `import type { Element, Rarity, WeaponType, StatMods } from '../types';

export interface WeaponDef {
  id: string;
  name: string;
  type: WeaponType;
  rarity: Rarity;
  slot: 'arma';
  stats: StatMods;
  price: number;
  element: Element;
  description: string;
  sprite: string;
}

export const WEAPONS: WeaponDef[] = ${toTs(weapons)};

export function getWeapon(id: string) {
  return WEAPONS.find((w) => w.id === id);
}
`
);

writeFileSync(
  'src/game/config/armor.ts',
  `import type { EquipmentSlot, Rarity, StatMods } from '../types';

export interface ArmorDef {
  id: string;
  name: string;
  slot: Exclude<EquipmentSlot, 'arma' | 'amuleto' | 'anel1' | 'anel2'>;
  rarity: Rarity;
  stats: StatMods;
  price: number;
  description: string;
  sprite: string;
}

export const ARMORS: ArmorDef[] = ${toTs(armors)};

export function getArmor(id: string) {
  return ARMORS.find((a) => a.id === id);
}
`
);

console.log('weapons', weapons.length, 'armors', armors.length);
