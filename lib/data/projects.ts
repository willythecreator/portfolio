import { blackholeArt } from '@/lib/ascii-art/blackhole'
import { chessArt, chessDelays } from '@/lib/ascii-art/chess'

export interface Project {
  slug: string
  name: string
  category: ProjectCategory
  description: string
  longDescription: string
  tech: string[]
  github?: string
  asciiArtFrames?: string[][]
  asciiFrameDelays?: number[]
}

export type ProjectCategory =
  | 'Emulation'
  | 'Physics & Cosmology'
  | 'Graphics & Fractals'
  | 'Tools & Algorithms'
  | 'Games'

const CATEGORY_ORDER: ProjectCategory[] = [
  'Emulation',
  'Physics & Cosmology',
  'Graphics & Fractals',
  'Tools & Algorithms',
  'Games',
]

const ALL_PROJECTS: Project[] = [
  {
    slug: 'advance-pocket',
    name: 'Advance-Pocket',
    category: 'Emulation',
    description: 'GBA emulator written in C++',
    longDescription:
      'A Game Boy Advance emulator built from scratch in C++. Implements ARM7TDMI instruction decoding, PPU tile/sprite rendering, and cartridge save-state handling. Aims for cycle-accurate timing and broad ROM compatibility.',
    tech: ['C++', 'ARM Assembly', 'SDL2'],
    github: 'https://github.com/willythecreator/Advance-Pocket',
  },
  {
    slug: 'schwarzschild-tracer',
    name: 'Schwarzschild Black Hole Geodesic Tracer',
    category: 'Physics & Cosmology',
    description: 'Ray-trace photon paths around a black hole',
    longDescription:
      'Numerically integrates geodesic equations in Schwarzschild spacetime to trace photon trajectories. Visualizes gravitational lensing, photon spheres, and the shadow of a non-rotating black hole.',
    tech: ['C++', 'OpenGL', 'GLSL'],
    github: 'https://github.com/willythecreator/Schwarzschild-black-hole-geodesic-tracer',
    asciiArtFrames: blackholeArt,
  },
  {
    slug: 'gravitational-lensing',
    name: 'Gravitational Lensing Ray Tracer',
    category: 'Physics & Cosmology',
    description: 'Simulate lensing from massive objects',
    longDescription:
      'Rays are deflected by the gravitational field of point masses, producing Einstein rings, arcs, and multiple images. Uses weak-field approximation for computational efficiency.',
    tech: ['C++', 'OpenGL'],
  },
  {
    slug: 'three-body',
    name: 'Three-Body Problem Visualizer',
    category: 'Physics & Cosmology',
    description: 'Chaotic N-body orbital mechanics',
    longDescription:
      'Interactive simulation of the classical three-body problem using a symplectic integrator. Explores chaotic sensitivity to initial conditions and plots Poincare sections.',
    tech: ['Python', 'NumPy', 'Matplotlib'],
  },
  {
    slug: 'two-body-orbit',
    name: 'Two-Body Gravitational Orbit Simulator',
    category: 'Physics & Cosmology',
    description: 'Classical orbital dynamics',
    longDescription:
      'Keplerian orbit solver supporting elliptical, parabolic, and hyperbolic trajectories. Renders real-time orbital paths with configurable mass, eccentricity, and initial velocity.',
    tech: ['Python', 'Pygame'],
  },
  {
    slug: 'lunar-lander',
    name: 'Lunar Lander Physics Sim',
    category: 'Physics & Cosmology',
    description: 'Thrust and gravity simulation',
    longDescription:
      'A physics-based lunar lander with realistic thrust vectors, fuel consumption, and terrain collision. Players must manage descent rate and horizontal velocity to land safely.',
    tech: ['Python', 'Pygame'],
  },
  {
    slug: 'neutron-star-eos',
    name: 'Neutron Star EOS Solver',
    category: 'Physics & Cosmology',
    description: 'Equation of state for degenerate matter',
    longDescription:
      'Solves the Tolman-Oppenheimer-Volkoff equation for neutron star structure using various nuclear matter equations of state. Computes mass-radius relationships.',
    tech: ['Python', 'SciPy'],
  },
  {
    slug: 'nuclear-fusion',
    name: 'Nuclear Fusion Rate Calculator',
    category: 'Physics & Cosmology',
    description: 'Fusion rates inside stellar cores',
    longDescription:
      'Computes thermonuclear reaction rates for pp-chain and CNO cycle reactions as a function of temperature and density. Useful for stellar evolution modeling.',
    tech: ['Python'],
  },
  {
    slug: 'supernova-lightcurve',
    name: 'Supernova Light Curve Modeler',
    category: 'Physics & Cosmology',
    description: 'Stellar explosion luminosity over time',
    longDescription:
      'Models the photometric evolution of Type Ia and core-collapse supernovae using radioactive decay heating and diffusion approximations.',
    tech: ['Python', 'Matplotlib'],
  },
  {
    slug: 'hubble-expansion',
    name: 'Hubble Expansion Rate Visualizer',
    category: 'Physics & Cosmology',
    description: 'Cosmic expansion dynamics',
    longDescription:
      'Plots the expansion history of the universe for different cosmological parameters (Omega_m, Omega_Lambda, H0). Visualizes the Hubble parameter H(z) across redshift.',
    tech: ['Python', 'Matplotlib'],
  },
  {
    slug: 'bao-visualizer',
    name: 'BAO Visualizer',
    category: 'Physics & Cosmology',
    description: 'Baryon acoustic oscillation mapping',
    longDescription:
      'Visualizes the baryon acoustic oscillation signal in the matter power spectrum and correlation function. Demonstrates the standard ruler for cosmological distance measurements.',
    tech: ['Python', 'NumPy'],
  },
  {
    slug: 'large-scale-structure',
    name: 'Large-Scale Structure Filament Sim',
    category: 'Physics & Cosmology',
    description: 'Cosmic web formation',
    longDescription:
      'N-body simulation of dark matter particle evolution under gravity, forming the characteristic cosmic web of filaments, walls, and voids.',
    tech: ['Python', 'NumPy'],
  },
  {
    slug: 'hr-diagram',
    name: 'Hertzsprung-Russell Diagram Plotter',
    category: 'Physics & Cosmology',
    description: 'Star classification from catalog data',
    longDescription:
      'Parses stellar catalog data (Hipparcos/Tycho) and plots luminosity vs effective temperature. Interactive classification of main sequence, giants, and white dwarfs.',
    tech: ['Python', 'Matplotlib', 'Pandas'],
  },
  {
    slug: 'mandelbrot',
    name: 'Mandelbrot Set Renderer',
    category: 'Graphics & Fractals',
    description: 'Escape-time fractal in C',
    longDescription:
      'High-performance Mandelbrot renderer with deep zoom support. Uses escape-time algorithm with smooth coloring and optional SIMD acceleration.',
    tech: ['C', 'SDL2'],
  },
  {
    slug: 'julia-set',
    name: 'Julia Set Explorer',
    category: 'Graphics & Fractals',
    description: 'Interactive complex-dynamics viewer',
    longDescription:
      'Real-time interactive Julia set explorer. Click to pick a c-parameter and watch the fractal morph. Supports multiple coloring algorithms and animation between parameters.',
    tech: ['C', 'SDL2'],
  },
  {
    slug: 'perlin-terrain',
    name: 'Perlin Noise Terrain Generator',
    category: 'Graphics & Fractals',
    description: 'Heightmap generation',
    longDescription:
      'Generates procedural terrain heightmaps using multi-octave Perlin noise. Renders 3D wireframe or shaded terrain with configurable roughness and resolution.',
    tech: ['Python', 'OpenGL'],
  },
  {
    slug: 'barnsley-fern',
    name: 'Barnsley Fern Renderer',
    category: 'Graphics & Fractals',
    description: 'IFS fractal renderer',
    longDescription:
      'Plots the Barnsley fern using an iterated function system with 4 affine transformations. Each point is plotted iteratively, revealing the self-similar structure.',
    tech: ['C', 'SDL2'],
  },
  {
    slug: 'lissajous',
    name: 'Lissajous Curve Animator',
    category: 'Graphics & Fractals',
    description: 'Parametric curve visualization',
    longDescription:
      'Animates Lissajous curves with adjustable frequency ratios and phase offsets. Renders trails with configurable decay for artistic visualizations.',
    tech: ['Python', 'Pygame'],
  },
  {
    slug: 'spinning-donut',
    name: 'Spinning Donut',
    category: 'Graphics & Fractals',
    description: 'ASCII 3D donut in C',
    longDescription:
      'The classic ASCII torus renderer. Computes 3D surface normals and maps them to luminance characters. Spins in real-time on a terminal.',
    tech: ['C'],
    github: 'https://github.com/willythecreator/Spinning-Donut',
  },
  {
    slug: 'password-manager',
    name: 'Password Manager',
    category: 'Tools & Algorithms',
    description: 'AES-encrypted credential storage',
    longDescription:
      'CLI password manager with AES-256-GCM encryption. Master key derived via Argon2id. Stores credentials in an encrypted local database with search and copy-to-clipboard.',
    tech: ['Python', 'cryptography'],
  },
  {
    slug: 'k-means',
    name: 'K-Means Clustering',
    category: 'Tools & Algorithms',
    description: 'Unsupervised learning from scratch',
    longDescription:
      'Implementation of K-Means clustering from scratch without ML libraries. Includes K-Means++ initialization and convergence diagnostics.',
    tech: ['Python', 'NumPy'],
  },
  {
    slug: 'sorting-visualizer',
    name: 'Sorting Algorithm Visualizer',
    category: 'Tools & Algorithms',
    description: 'Live algorithm comparison',
    longDescription:
      'Side-by-side visualization of sorting algorithms (bubble, merge, quick, heap). Animates comparisons and swaps in real-time with configurable array size and speed.',
    tech: ['Python', 'Pygame'],
  },
  {
    slug: 'matrix-calculator',
    name: 'Matrix Calculator',
    category: 'Tools & Algorithms',
    description: 'Linear algebra operations',
    longDescription:
      'Interactive matrix calculator supporting determinant, inverse, eigenvalues, SVD, and row reduction. Handles arbitrary-size matrices with rational arithmetic.',
    tech: ['Python'],
  },
  {
    slug: 'geometric-prover',
    name: 'Geometric Theorem Prover',
    category: 'Tools & Algorithms',
    description: 'Automated geometric reasoning',
    longDescription:
      'Automated theorem prover for plane geometry. Uses coordinate geometry and algebraic verification to prove or disprove geometric statements.',
    tech: ['Python', 'SymPy'],
  },
  {
    slug: 'telescope-psf',
    name: 'Telescope PSF Simulator',
    category: 'Tools & Algorithms',
    description: 'Point-spread function modeling',
    longDescription:
      'Simulates the optical point-spread function of a telescope including diffraction, atmospheric turbulence (seeing), and detector sampling effects.',
    tech: ['Python', 'NumPy', 'Astropy'],
  },
  {
    slug: 'chess-python',
    name: 'Chess Engine (Python)',
    category: 'Games',
    description: 'UCI-compliant chess AI',
    longDescription:
      'Full chess engine with move generation, evaluation, and UCI protocol support. Uses alpha-beta pruning with iterative deepening and transposition tables.',
    tech: ['Python'],
    github: 'https://github.com/willythecreator/Chess-Game-Engine-in-Python',
    asciiArtFrames: chessArt,
    asciiFrameDelays: chessDelays,
  },
  {
    slug: 'chess-c',
    name: 'Chess Engine (C)',
    category: 'Games',
    description: 'Lower-level chess AI',
    longDescription:
      'High-performance chess engine in C with bitboard representation. Implements magic bitboards for sliding piece attacks and MCTS for move search.',
    tech: ['C'],
  },
  {
    slug: 'tetris',
    name: 'Tetris',
    category: 'Games',
    description: 'Classic tetromino stacking (SDL2, C++)',
    longDescription:
      'Feature-complete Tetris clone with wall kicks, hold piece, next-piece preview, ghost piece, and scoring system. Built with SDL2 for cross-platform support.',
    tech: ['C++', 'SDL2'],
    github: 'https://github.com/willythecreator/Tetris',
  },
  {
    slug: 'space-invaders',
    name: 'Space Invaders',
    category: 'Games',
    description: 'Classic arcade shooter',
    longDescription:
      'Retro space invaders clone with descending alien formations, player ship movement, shield blocks, and increasing difficulty. Pure arcade action.',
    tech: ['Python', 'Pygame'],
  },
  {
    slug: 'battleship',
    name: 'Battleship (2-player)',
    category: 'Games',
    description: 'Naval combat game',
    longDescription:
      'Two-player battleship game with random fleet placement, salvo mode option, and hit/miss tracking. Terminal-based interface.',
    tech: ['Python'],
  },
]

// Only projects that can actually be viewed (public repository) are listed.
// Projects without a link are considered "locked" and are hidden from the UI.
export const PROJECTS: Project[] = ALL_PROJECTS.filter((project) => Boolean(project.github))

// Categories are derived from the visible projects so empty tabs never show up.
export const CATEGORIES: ProjectCategory[] = CATEGORY_ORDER.filter((category) =>
  PROJECTS.some((project) => project.category === category)
)
