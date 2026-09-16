export type PowerKind = 'weapon' | 'passive';

export interface PowerDef {
  id: string;
  name: string;
  description: string;
  kind: PowerKind;
  maxLevel: number;
  icon: string;
  /** base stats per level */
  baseDamage?: number;
  baseCooldown?: number;
  baseArea?: number;
  baseAmount?: number;
  baseSpeed?: number;
  baseDuration?: number;
  pattern:
    | 'whip'
    | 'wand'
    | 'knife'
    | 'axe'
    | 'cross'
    | 'orbit'
    | 'lightning'
    | 'fire'
    | 'garlic'
    | 'holywater'
    | 'thorns'
    | 'wind'
    | 'none';
  passiveStat?:
    | 'armor'
    | 'moveSpeed'
    | 'might'
    | 'magnet'
    | 'recovery'
    | 'area'
    | 'cooldown'
    | 'amount'
    | 'duration'
    | 'luck';
}

export const POWERS: PowerDef[] = [
  {
    id: 'blade',
    name: 'Lâmina Crescente',
    description: 'Golpes horizontais à frente.',
    kind: 'weapon',
    maxLevel: 8,
    icon: 'blade',
    baseDamage: 18,
    baseCooldown: 1.1,
    baseArea: 1,
    baseAmount: 1,
    pattern: 'whip',
  },
  {
    id: 'orb',
    name: 'Orbe Arcano',
    description: 'Projéteis mágicos no inimigo mais próximo.',
    kind: 'weapon',
    maxLevel: 8,
    icon: 'orb',
    baseDamage: 12,
    baseCooldown: 0.9,
    baseAmount: 1,
    baseSpeed: 280,
    pattern: 'wand',
  },
  {
    id: 'daggers',
    name: 'Adagas Voadoras',
    description: 'Lança adagas na direção do movimento.',
    kind: 'weapon',
    maxLevel: 8,
    icon: 'daggers',
    baseDamage: 10,
    baseCooldown: 0.7,
    baseAmount: 1,
    baseSpeed: 420,
    pattern: 'knife',
  },
  {
    id: 'axe',
    name: 'Machado Giratório',
    description: 'Machados em arco sobre a cabeça.',
    kind: 'weapon',
    maxLevel: 8,
    icon: 'axe',
    baseDamage: 22,
    baseCooldown: 1.4,
    baseAmount: 1,
    baseSpeed: 200,
    baseDuration: 1.2,
    pattern: 'axe',
  },
  {
    id: 'cross',
    name: 'Cruz Sagrada',
    description: 'Cruzes que voltam como bumerangue.',
    kind: 'weapon',
    maxLevel: 8,
    icon: 'cross',
    baseDamage: 14,
    baseCooldown: 1.2,
    baseAmount: 1,
    baseSpeed: 260,
    baseDuration: 1.5,
    pattern: 'cross',
  },
  {
    id: 'bible',
    name: 'Grimório Orbitante',
    description: 'Livros giram ao redor de Nicolas.',
    kind: 'weapon',
    maxLevel: 8,
    icon: 'bible',
    baseDamage: 11,
    baseCooldown: 0.2,
    baseAmount: 1,
    baseArea: 70,
    baseSpeed: 2.2,
    baseDuration: 999,
    pattern: 'orbit',
  },
  {
    id: 'lightning',
    name: 'Relâmpago de Eldoria',
    description: 'Raios atingem inimigos aleatórios.',
    kind: 'weapon',
    maxLevel: 8,
    icon: 'lightning',
    baseDamage: 28,
    baseCooldown: 1.6,
    baseAmount: 1,
    pattern: 'lightning',
  },
  {
    id: 'fire',
    name: 'Chama Errante',
    description: 'Bolas de fogo em direção aleatória.',
    kind: 'weapon',
    maxLevel: 8,
    icon: 'fire',
    baseDamage: 16,
    baseCooldown: 1.3,
    baseAmount: 1,
    baseSpeed: 180,
    baseDuration: 2,
    pattern: 'fire',
  },
  {
    id: 'garlic',
    name: 'Aura Purificadora',
    description: 'Dano contínuo ao redor.',
    kind: 'weapon',
    maxLevel: 8,
    icon: 'garlic',
    baseDamage: 4,
    baseCooldown: 0.25,
    baseArea: 70,
    pattern: 'garlic',
  },
  {
    id: 'holywater',
    name: 'Água Benta',
    description: 'Poças sagradas no chão.',
    kind: 'weapon',
    maxLevel: 8,
    icon: 'holywater',
    baseDamage: 8,
    baseCooldown: 1.8,
    baseArea: 50,
    baseDuration: 2.5,
    baseAmount: 1,
    pattern: 'holywater',
  },
  {
    id: 'thorns',
    name: 'Espinhos de Terra',
    description: 'Espinhos explodem sob inimigos próximos.',
    kind: 'weapon',
    maxLevel: 8,
    icon: 'thorns',
    baseDamage: 20,
    baseCooldown: 1.5,
    baseArea: 45,
    baseAmount: 1,
    pattern: 'thorns',
  },
  {
    id: 'wind',
    name: 'Vendaval',
    description: 'Rajadas em cone à frente.',
    kind: 'weapon',
    maxLevel: 8,
    icon: 'wind',
    baseDamage: 13,
    baseCooldown: 1.0,
    baseArea: 1.2,
    baseAmount: 3,
    baseSpeed: 320,
    pattern: 'wind',
  },
  // Passives
  { id: 'armor', name: 'Couraça de Pedra', description: 'Reduz dano recebido.', kind: 'passive', maxLevel: 5, icon: 'armor', pattern: 'none', passiveStat: 'armor' },
  { id: 'speed', name: 'Botas do Vento', description: 'Aumenta velocidade.', kind: 'passive', maxLevel: 5, icon: 'speed', pattern: 'none', passiveStat: 'moveSpeed' },
  { id: 'might', name: 'Anel da Fúria', description: 'Aumenta todo o dano.', kind: 'passive', maxLevel: 5, icon: 'might', pattern: 'none', passiveStat: 'might' },
  { id: 'magnet', name: 'Amuleto Ímã', description: 'Puxa gemas de longe.', kind: 'passive', maxLevel: 5, icon: 'magnet', pattern: 'none', passiveStat: 'magnet' },
  { id: 'recovery', name: 'Coração Vivo', description: 'Regenera vida com o tempo.', kind: 'passive', maxLevel: 5, icon: 'recovery', pattern: 'none', passiveStat: 'recovery' },
  { id: 'area', name: 'Tomo da Expansão', description: 'Aumenta área das armas.', kind: 'passive', maxLevel: 5, icon: 'area', pattern: 'none', passiveStat: 'area' },
  { id: 'cooldown', name: 'Ampulheta Rápida', description: 'Reduz recarga das armas.', kind: 'passive', maxLevel: 5, icon: 'cooldown', pattern: 'none', passiveStat: 'cooldown' },
  { id: 'amount', name: 'Duplicador', description: 'Mais projéteis por disparo.', kind: 'passive', maxLevel: 5, icon: 'amount', pattern: 'none', passiveStat: 'amount' },
  { id: 'duration', name: 'Relógio Eterno', description: 'Efeitos duram mais.', kind: 'passive', maxLevel: 5, icon: 'duration', pattern: 'none', passiveStat: 'duration' },
  { id: 'luck', name: 'Trevo Dourado', description: 'Mais chance de opções raras.', kind: 'passive', maxLevel: 5, icon: 'luck', pattern: 'none', passiveStat: 'luck' },
];

export function getPower(id: string): PowerDef {
  return POWERS.find((p) => p.id === id)!;
}

export interface EnemyDef {
  id: string;
  name: string;
  sprite: string;
  hp: number;
  speed: number;
  damage: number;
  xp: number;
  size: number;
  score: number;
}

export const ENEMIES: EnemyDef[] = [
  { id: 'bat', name: 'Morcego', sprite: 'bat', hp: 12, speed: 70, damage: 6, xp: 1, size: 22, score: 10 },
  { id: 'slime', name: 'Slime', sprite: 'slime', hp: 22, speed: 45, damage: 8, xp: 2, size: 26, score: 15 },
  { id: 'skeleton', name: 'Esqueleto', sprite: 'skeleton', hp: 35, speed: 55, damage: 10, xp: 3, size: 28, score: 25 },
  { id: 'wolf', name: 'Lobo', sprite: 'wolf', hp: 40, speed: 95, damage: 12, xp: 4, size: 30, score: 30 },
  { id: 'ghost', name: 'Fantasma', sprite: 'ghost', hp: 28, speed: 65, damage: 11, xp: 3, size: 28, score: 28 },
  { id: 'mage', name: 'Mago Sombrio', sprite: 'mage', hp: 55, speed: 50, damage: 14, xp: 5, size: 30, score: 40 },
  { id: 'golem', name: 'Golem', sprite: 'golem', hp: 140, speed: 28, damage: 20, xp: 10, size: 40, score: 80 },
  { id: 'boss', name: 'Senhor das Sombras', sprite: 'boss', hp: 800, speed: 40, damage: 25, xp: 50, size: 56, score: 500 },
];

export function getEnemy(id: string): EnemyDef {
  return ENEMIES.find((e) => e.id === id)!;
}
