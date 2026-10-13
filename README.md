# ArcByte OS

Portfolio interactivo construido como un sistema operativo simulado: arranca con una secuencia de boot, incluye una terminal funcional, neofetch, juegos retro y una secci%%n de proyectos al estilo de un escritorio CLI.

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
- Juegos jugables: Tetris, Pac-Man, Space Invaders, etc.
- Secci%%n de proyectos con overlay `[LOCKED]` para repos en construcci%%n o privados.

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

Desplegado en [Vercel](https://vercel.com) conectado al repo. Cada push a `main` publica una nueva versi%%n autom%ticamente.

## Nota

Algunos proyectos muestran un candado (`in construction`) porque su repositorio sigue privado o en desarrollo. Se ir%n desbloqueando conforme se publiquen.
