# ArcByte OS

Portfolio interactivo construido como un sistema operativo simulado: arranca con una secuencia de boot, incluye una terminal funcional, neofetch, juegos retro y una sección de proyectos al estilo de un escritorio CLI.

**URL:** https://willythecreator.vercel.app

## Stack

- [Next.js 16](https://nextjs.org) (App Router + Turbopack)
- [React 19](https://react.dev)
- [TypeScript](https://www.typescriptlang.org)
- [Tailwind CSS 4](https://tailwindcss.com)

## Funcionalidades

- Secuencia de arranque animada (boot + scan).
- Terminal con comandos: `help`, `about`, `projects`, `games`, `neofetch`, `clear`, entre otros.
- Neofetch con ASCII art del sistema.
- Juegos jugables: Tetris, Pac-Man, Space Invaders y DOOM (DOSBox vía js-dos).
- Sección de proyectos con overlay `[LOCKED]` para repos en construcción o privados.
- Diseño responsive con controles táctiles en pantalla para jugar en el teléfono.

## Controles móviles

Cada juego muestra un pad direccional y botones de acción en dispositivos táctiles
(media query `pointer: coarse`). Los botones emiten eventos de teclado sintéticos,
por lo que el mismo código de juego responde tanto a teclado como a táctil.

- **Space Invaders:** izquierda/derecha + FIRE.
- **Pac-Man:** pad direccional completo.
- **Tetris:** izquierda/derecha/abajo, rotar, drop y hold.
- **DOOM:** pad direccional + FIRE / USE / RUN.

## Puesta en marcha

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Build

```bash
npm run build
```

## Deploy

Desplegado en [Vercel](https://vercel.com) conectado al repo. Cada push a `main` publica una nueva versión automáticamente.

## Nota

Algunos proyectos muestran un candado (`in construction`) porque su repositorio sigue privado o en desarrollo. Se irán desbloqueando conforme se publiquen.
