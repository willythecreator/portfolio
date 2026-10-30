export interface FSNode {
  type: 'file' | 'dir'
  name: string
  content?: string
  children?: Record<string, FSNode>
}

export function createFileSystem(): FSNode {
  return {
    type: 'dir',
    name: '/',
    children: {
      'home': {
        type: 'dir',
        name: 'home',
        children: {
          'willy': {
            type: 'dir',
            name: 'willy',
            children: {
              'about.txt': {
                type: 'file',
                name: 'about.txt',
                content: `Name:       Willy
Handle:     willythecreator
Location:   Madrid, Spain
Focus:      self-taught . systems . emulation . cosmos
Stack:      C, C++, Python, Java, Rust, JavaScript, TypeScript

Building things that are fast, correct, and interesting.
Philosophy: "Optimize, right, interesting."`,
              },
              'projects': {
                type: 'dir',
                name: 'projects',
                children: {
                  'emulation': {
                    type: 'dir',
                    name: 'emulation',
                    children: {
                      'advance-pocket.txt': {
                        type: 'file',
                        name: 'advance-pocket.txt',
                        content: `Project:    Advance-Pocket
Language:   C++
Status:     Active development
GitHub:     github.com/willythecreator/Advance-Pocket

GBA emulator built from scratch. Implements ARM7TDMI
instruction decoding, PPU tile/sprite rendering, and
cartridge save-state handling.`,
                      },
                    },
                  },
                  'physics': {
                    type: 'dir',
                    name: 'physics',
                    children: {
                      'schwarzschild-tracer.txt': {
                        type: 'file',
                        name: 'schwarzschild-tracer.txt',
                        content: `Project:    Schwarzschild Black Hole Geodesic Tracer
Language:   C++ / OpenGL / GLSL
GitHub:     github.com/willythecreator/Schwarzschild-black-hole-geodesic-tracer

Numerically integrates geodesic equations in Schwarzschild
spacetime to trace photon trajectories.`,
                      },
                    },
                  },
                  'graphics': {
                    type: 'dir',
                    name: 'graphics',
                    children: {
                      'spinning-donut.txt': {
                        type: 'file',
                        name: 'spinning-donut.txt',
                        content: `Project:    Spinning Donut
Language:   C
GitHub:     github.com/willythecreator/Spinning-Donut

The classic ASCII torus renderer.`,
                      },
                    },
                  },
                  'games': {
                    type: 'dir',
                    name: 'games',
                    children: {
                      'tetris.txt': {
                        type: 'file',
                        name: 'tetris.txt',
                        content: `Project:    Tetris
Language:   C++ / SDL2
GitHub:     github.com/willythecreator/Tetris

Feature-complete Tetris clone with wall kicks,
hold piece, ghost piece, and scoring.`,
                      },
                      'chess.txt': {
                        type: 'file',
                        name: 'chess.txt',
                        content: `Project:    Chess Engine (Python)
Language:   Python
GitHub:     github.com/willythecreator/Chess-Game-Engine-in-Python

UCI-compliant chess engine with alpha-beta pruning
and iterative deepening.`,
                      },
                    },
                  },
                },
              },
              'skills.txt': {
                type: 'file',
                name: 'skills.txt',
                content: `Languages:  C, C++, Python, Java, Rust, JavaScript, TypeScript
Focus:      Systems programming, emulation, computational physics
Tools:      GCC, Clang, GDB, Valgrind, Git, SDL2, OpenGL
Learning:   CS50, LLMs, AI security`,
              },
              'contact.txt': {
                type: 'file',
                name: 'contact.txt',
                content: `GitHub:   github.com/willythecreator
Discord:  willythecreator
Location: Madrid, Spain`,
              },
            },
          },
        },
      },
      'etc': {
        type: 'dir',
        name: 'etc',
        children: {
          'motd': {
            type: 'file',
            name: 'motd',
            content: `
   █████╗ ██████╗  ██████╗██████╗ ██╗   ██╗████████╗███████╗
  ██╔══██╗██╔══██╗██╔════╝██╔══██╗╚██╗ ██╔╝╚══██╔══╝██╔════╝
  ███████║██████╔╝██║     ██████╔╝ ╚████╔╝    ██║   █████╗
  ██╔══██║██╔══██╗██║     ██╔══██╗  ╚██╔╝     ██║   ██╔══╝
  ██║  ██║██║  ██║╚██████╗██████╔╝   ██║      ██║   ███████╗
  ╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝╚═════╝    ╚═╝      ╚═╝   ╚══════╝

  ArcByte OS v0.97 — Unauthorized access will be prosecuted.
`,
          },
          'hostname': {
            type: 'file',
            name: 'hostname',
            content: 'arcbyte-os',
          },
        },
      },
      'dev': {
        type: 'dir',
        name: 'dev',
        children: {
          'null': { type: 'file', name: 'null', content: '' },
          'random': { type: 'file', name: 'random', content: '' },
        },
      },
    },
  }
}

export function resolvePath(fs: FSNode, path: string): FSNode | null {
  const parts = path.split('/').filter(Boolean)
  let current = fs
  for (const part of parts) {
    if (current.type !== 'dir' || !current.children) return null
    if (part === '..') {
      // Can't go above root
      continue
    }
    const child = current.children[part]
    if (!child) return null
    current = child
  }
  return current
}

export function getPwd(cwd: string): string {
  return cwd === '/' ? '/' : cwd
}
