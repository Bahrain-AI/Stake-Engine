import { CELL_SPACING, VOID_CORE_CELLS, VOID_CORE_9x9, SYMBOL_PLANE_Z } from './constants.js';

/**
 * Convert grid position (row, col) to world position (x, y, z).
 */
export function gridToWorld(row, col, gridSize = 7) {
  const offset = ((gridSize - 1) * CELL_SPACING) / 2;
  return {
    x: col * CELL_SPACING - offset,
    y: -(row * CELL_SPACING - offset), // flip Y so row 0 is top
    z: SYMBOL_PLANE_Z,
  };
}

/**
 * Check if a cell is part of the void core.
 */
export function isVoidCore(row, col, gridSize = 7) {
  const cores = gridSize === 7 ? VOID_CORE_CELLS : VOID_CORE_9x9;
  return cores.some(([r, c]) => r === row && c === col);
}

/**
 * Get all active cell positions (non-void-core) for a given grid size.
 * Returns array of { row, col, worldX, worldY, worldZ }.
 */
export function getActiveCells(gridSize = 7) {
  const cells = [];
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      if (!isVoidCore(row, col, gridSize)) {
        const pos = gridToWorld(row, col, gridSize);
        cells.push({
          row,
          col,
          worldX: pos.x,
          worldY: pos.y,
          worldZ: pos.z,
        });
      }
    }
  }
  return cells;
}

/**
 * Distance from a world position to the grid center (0,0).
 */
export function distanceFromCenter(x, y) {
  return Math.sqrt(x * x + y * y);
}
