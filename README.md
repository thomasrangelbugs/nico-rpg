# Nicolas Survivors of Eldoria (Nico RPG)

Survivor no estilo Vampire Survivors: Nicolas, sprites PNG, trilha procedural, armas e passivas evolutivas. Feito com **React**, **TypeScript**, **Vite** e PWA.

## Requisitos

- **Node.js 20+** (LTS recomendado)
- **npm** 10+
- Navegador moderno com Canvas / Web Audio

## Como jogar / rodar

```bash
npm install
npm run dev
```

Abra a URL do Vite (geralmente `http://localhost:5173`).

### Controles

- **PC:** WASD / setas — mover · Enter — começar · 1/2/3 — level-up · Esc — pausa
- **Mobile:** toque para começar · arraste (joystick) · toque no card do poder

### Poderes

**Armas:** Lâmina Crescente, Orbe Arcano, Adagas, Machado, Cruz, Grimório, Relâmpago, Chama, Aura, Água Benta, Espinhos, Vendaval.

**Passivas:** Couraça, Velocidade, Fúria, Ímã, Regeneração, Área, Cooldown, Duplicador, Duração, Sorte.

## Linguagem e tecnologias

- **TypeScript / React 19**
- **Vite 6** + **vite-plugin-pwa**
- **Zustand** (estado), **idb** (IndexedDB)
- Scripts Node para gerar assets/áudio (`scripts/`)

## Estrutura do projeto

```
Nico RPG/
├── index.html
├── package.json
├── vite.config.ts
├── src/                 # React + motor do jogo
├── public/              # assets estáticos
├── scripts/             # generate-assets, generate-audio, testes
├── netlify.toml
└── README.md
```

`node_modules/` e `dist/` não entram no Git.

## Build e deploy

```bash
npm run build
```

Publique a pasta `dist` no **Netlify** (`netlify.toml` já configurado).

Teste do motor (opcional):

```bash
npm run test:engine
```

## Limitações

- Conteúdo e assets gerados localmente; não há multiplayer.
- Autoplay de áudio pode exigir interação do usuário.

## Repositório

[thomasrangelbugs/nico-rpg](https://github.com/thomasrangelbugs/nico-rpg)

## Autor

**Thomas Rangel Bugs** — [github.com/thomasrangelbugs](https://github.com/thomasrangelbugs)
