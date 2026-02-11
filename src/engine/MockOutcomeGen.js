import { GRID_SIZE, SYMBOL_TYPES, SYMBOL_KEYS } from '../utils/constants.js';
import { isVoidCore } from '../utils/gridHelpers.js';
import { weightedRandom } from '../utils/mathHelpers.js';

const SYMBOL_WEIGHTS = {};
for (const key of SYMBOL_KEYS) {
  SYMBOL_WEIGHTS[key] = SYMBOL_TYPES[key].weight;
}

/**
 * Generate a random grid of symbols.
 * Returns a 2D array: grid[row][col] = symbolKey or null (void core).
 */
export function generateGrid(gridSize = GRID_SIZE) {
  const grid = [];
  for (let row = 0; row < gridSize; row++) {
    grid[row] = [];
    for (let col = 0; col < gridSize; col++) {
      if (isVoidCore(row, col, gridSize)) {
        grid[row][col] = null;
      } else {
        grid[row][col] = weightedRandom(SYMBOL_WEIGHTS);
      }
    }
  }
  return grid;
}

/**
 * Generate a single random symbol.
 */
export function randomSymbol() {
  return weightedRandom(SYMBOL_WEIGHTS);
}

/**
 * Forced outcomes for debug/testing.
 */
export const FORCED_OUTCOMES = {
  BIG_CLUSTER: {
    description: 'Places 12+ same symbols for guaranteed mega cluster',
    setup(grid) {
      const target = 'S7_NEUTRON';
      const positions = [
        [0, 0], [0, 1], [0, 2], [0, 3],
        [1, 0], [1, 1], [1, 2], [1, 3],
        [2, 0], [2, 1], [2, 2], [2, 3],
      ];
      positions.forEach(([r, c]) => {
        if (!isVoidCore(r, c) && r < grid.length && c < grid[0].length) {
          grid[r][c] = target;
        }
      });
      return grid;
    },
  },

  DEAD_SPIN: {
    description: 'Ensures no clusters of 5+ exist',
    setup(grid) {
      // Alternating pattern: cycle through symbols to prevent clusters
      const payingSymbols = ['S1_VOID_SHARD', 'S2_NEBULA_CORE', 'S3_PLASMA_ORB', 'S4_STELLAR_FRAG'];
      for (let row = 0; row < grid.length; row++) {
        for (let col = 0; col < grid[row].length; col++) {
          if (grid[row][col] !== null) {
            grid[row][col] = payingSymbols[(row * grid[row].length + col) % payingSymbols.length];
          }
        }
      }
      return grid;
    },
  },

  CASCADE_CHAIN: {
    description: 'Arranges symbols so removing one cluster creates another',
    setup(grid) {
      // First cluster: top-left area
      const target1 = 'S4_STELLAR_FRAG';
      const target2 = 'S2_NEBULA_CORE';
      [[0, 0], [0, 1], [0, 2], [1, 0], [1, 1]].forEach(([r, c]) => {
        if (!isVoidCore(r, c)) grid[r][c] = target1;
      });
      // Symbols above: when cluster1 is removed and things shift, these form cluster2
      [[2, 0], [2, 1], [2, 2], [0, 3], [1, 2]].forEach(([r, c]) => {
        if (!isVoidCore(r, c)) grid[r][c] = target2;
      });
      return grid;
    },
  },

  SCATTER_TRIGGER: {
    description: 'Places 3+ scatters on grid',
    setup(grid) {
      grid[0][0] = 'SCATTER';
      grid[0][6] = 'SCATTER';
      grid[6][0] = 'SCATTER';
      return grid;
    },
  },
};
