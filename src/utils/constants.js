// Grid configuration
export const GRID_SIZE = 7;
export const GRID_SIZE_BONUS = 9;
export const CELL_SPACING = 2.2;
export const SYMBOL_PLANE_Z = 2;
export const VOID_CORE_CELLS = [[3, 3], [3, 4], [4, 3], [4, 4]];
export const VOID_CORE_9x9 = [[3, 3], [3, 4], [3, 5], [4, 3], [4, 4], [4, 5], [5, 3], [5, 4], [5, 5]];
export const ACTIVE_CELLS_COUNT = 45; // 7*7 - 4

// Camera
export const CAMERA_FOV = 60;
export const CAMERA_POS_Z = 28;
export const CAMERA_SWAY_X_SPEED = 0.2;
export const CAMERA_SWAY_Y_SPEED = 0.15;
export const CAMERA_SWAY_X_AMP = 0.5;
export const CAMERA_SWAY_Y_AMP = 0.3;

// Black hole
export const BLACK_HOLE_CORE_RADIUS = 1.8;
export const EVENT_HORIZON_RADIUS = 2.3;

// Particles
export const ACCRETION_PARTICLE_COUNT = 2000;
export const STAR_PARTICLE_COUNT = 1500;
export const NEBULA_PARTICLE_COUNT = 500;
export const ACCRETION_PARTICLE_COUNT_MOBILE = 800;
export const STAR_PARTICLE_COUNT_MOBILE = 600;
export const NEBULA_PARTICLE_COUNT_MOBILE = 200;

// Colors
export const COLORS = {
  VOID_BLACK: 0x0a0014,
  DEEP_PURPLE: 0x6b1fb1,
  ELECTRIC_CYAN: 0x00d4ff,
  HOT_MAGENTA: 0xff006e,
  GOLD: 0xffd700,
  NEON_GREEN: 0x00ff88,
  FLAME_ORANGE: 0xff4400,
  GRID_PURPLE: 0x1a0a2e,
  PURE_BLACK: 0x000000,
  WHITE: 0xffffff,
};

// Symbol types and their properties
export const SYMBOL_TYPES = {
  S1_VOID_SHARD: {
    id: 'S1_VOID_SHARD',
    name: 'Void Shard',
    geometry: 'octahedron',
    radius: 0.45,
    detail: 0,
    color: 0x6b1fb1,
    emissive: 0x6b1fb1,
    weight: 8,
  },
  S2_NEBULA_CORE: {
    id: 'S2_NEBULA_CORE',
    name: 'Nebula Core',
    geometry: 'icosahedron',
    radius: 0.4,
    detail: 0,
    color: 0x00d4ff,
    emissive: 0x00d4ff,
    weight: 8,
  },
  S3_PLASMA_ORB: {
    id: 'S3_PLASMA_ORB',
    name: 'Plasma Orb',
    geometry: 'icosahedron',
    radius: 0.4,
    detail: 1,
    color: 0xff006e,
    emissive: 0xff006e,
    weight: 7,
  },
  S4_STELLAR_FRAG: {
    id: 'S4_STELLAR_FRAG',
    name: 'Stellar Fragment',
    geometry: 'dodecahedron',
    radius: 0.4,
    detail: 0,
    color: 0xffd700,
    emissive: 0xffd700,
    weight: 6,
  },
  S5_DARK_MATTER: {
    id: 'S5_DARK_MATTER',
    name: 'Dark Matter',
    geometry: 'box',
    radius: 0.6,
    detail: 0,
    color: 0x00ff88,
    emissive: 0x00ff88,
    weight: 6,
  },
  S6_SINGULARITY: {
    id: 'S6_SINGULARITY',
    name: 'Singularity Gem',
    geometry: 'diamond',
    radius: 0.4,
    detail: 0,
    color: 0xffffff,
    emissive: 0xeeeeff,
    weight: 4,
  },
  S7_NEUTRON: {
    id: 'S7_NEUTRON',
    name: 'Neutron Crystal',
    geometry: 'octahedron_detail',
    radius: 0.45,
    detail: 1,
    color: 0xff4400,
    emissive: 0xff4400,
    weight: 3,
  },
  WILD: {
    id: 'WILD',
    name: 'Wild',
    geometry: 'sphere',
    radius: 0.5,
    detail: 0,
    color: 0x000000,
    emissive: 0x6b1fb1,
    weight: 2,
  },
  SCATTER: {
    id: 'SCATTER',
    name: 'Scatter',
    geometry: 'torus',
    radius: 0.4,
    detail: 0,
    color: 0xffffff,
    emissive: 0xffd700,
    weight: 1,
  },
};

export const SYMBOL_KEYS = Object.keys(SYMBOL_TYPES);
export const TOTAL_SYMBOL_WEIGHT = Object.values(SYMBOL_TYPES).reduce((a, s) => a + s.weight, 0);

// Lighting positions
export const LIGHT_POSITIONS = {
  POINT1: { x: -10, y: 10, z: 10 },
  POINT2: { x: 10, y: -10, z: 10 },
  PULSE: { x: 0, y: 0, z: 15 },
};

// Post-processing
export const BLOOM_PARAMS = {
  strength: 0.8,
  radius: 0.4,
  threshold: 0.2,
};

// Performance
export const MOBILE_BREAKPOINT = 640;
export const MAX_PIXEL_RATIO_MOBILE = 1.5;

// Game states
export const GAME_STATES = {
  IDLE: 'IDLE',
  SPINNING: 'SPINNING',
  RESOLVING: 'RESOLVING',
  CASCADING: 'CASCADING',
  WIN_DISPLAY: 'WIN_DISPLAY',
};

// Cluster detection
export const MIN_CLUSTER_SIZE = 5;

// Pay table: symbol → cluster size tier → pay multiplier (of bet)
// Tiers: 5-7, 8-11, 12-15, 16+
export const PAY_TABLE = {
  S1_VOID_SHARD:   [0.5,  1.0,   3.0,   10.0],
  S2_NEBULA_CORE:  [0.5,  1.0,   3.0,   10.0],
  S3_PLASMA_ORB:   [0.8,  2.0,   5.0,   25.0],
  S4_STELLAR_FRAG: [1.0,  3.0,   8.0,   50.0],
  S5_DARK_MATTER:  [1.0,  3.0,   8.0,   50.0],
  S6_SINGULARITY:  [2.0,  5.0,  15.0,  100.0],
  S7_NEUTRON:      [3.0,  8.0,  25.0,  200.0],
};

// Bet amounts
export const BET_LEVELS = [0.20, 0.50, 1.00, 2.00, 5.00, 10.00, 25.00, 50.00, 100.00];
export const DEFAULT_BET_INDEX = 2; // $1.00

// Animation durations (seconds)
export const ANIM = {
  SPIN_SCATTER_OUT: 0.3,
  SPIN_SNAP_BACK: 0.4,
  WIN_GLOW: 0.3,
  WIN_ABSORB: 0.5,
  CASCADE_DRIFT: 0.5,
  CASCADE_SPAWN: 0.3,
};
