import { isVoidCore } from '../utils/gridHelpers.js';
import { randomSymbol } from './MockOutcomeGen.js';
import { findClusters } from './ClusterDetector.js';

/**
 * Cascade Resolver: handles the full cascade loop.
 *
 * 1. Remove winning cluster cells from grid
 * 2. Gravity-settle remaining symbols downward
 * 3. Spawn new symbols at top to fill gaps
 * 4. Re-detect clusters
 * 5. Repeat until no wins
 *
 * Returns a sequence of cascade steps for animation:
 * [
 *   {
 *     clusters,           // clusters found this step
 *     removedCells,       // cells to remove
 *     settledMoves,       // [{ from: {row,col}, to: {row,col} }]
 *     spawnedCells,       // [{ row, col, symbolKey }]
 *     gridAfter,          // grid state after this step
 *   },
 *   ...
 * ]
 */
export function resolveCascades(initialGrid) {
  const steps = [];
  let grid = cloneGrid(initialGrid);
  let cascadeCount = 0;
  const maxCascades = 50; // safety cap

  while (cascadeCount < maxCascades) {
    const clusters = findClusters(grid);
    if (clusters.length === 0) break;

    // Collect all cells to remove (deduplicate)
    const removeSet = new Set();
    for (const cluster of clusters) {
      for (const cell of cluster.cells) {
        removeSet.add(`${cell.row},${cell.col}`);
      }
    }

    const removedCells = [];
    removeSet.forEach((key) => {
      const [r, c] = key.split(',').map(Number);
      removedCells.push({ row: r, col: c });
    });

    // Remove winning symbols
    for (const cell of removedCells) {
      grid[cell.row][cell.col] = null;
    }

    // Gravity settle: symbols fall down to fill gaps (column by column)
    const settledMoves = [];
    const cols = grid[0].length;
    const rows = grid.length;

    for (let col = 0; col < cols; col++) {
      // Process column bottom-up
      let writeRow = rows - 1;

      // Find bottom-most non-void row
      while (writeRow >= 0 && isVoidCore(writeRow, col, rows)) {
        writeRow--;
      }

      for (let readRow = writeRow; readRow >= 0; readRow--) {
        if (isVoidCore(readRow, col, rows)) continue;

        if (grid[readRow][col] !== null) {
          if (readRow !== writeRow) {
            settledMoves.push({
              from: { row: readRow, col },
              to: { row: writeRow, col },
              symbolKey: grid[readRow][col],
            });
            grid[writeRow][col] = grid[readRow][col];
            grid[readRow][col] = null;
          }
          // Find next write position
          writeRow--;
          while (writeRow >= 0 && isVoidCore(writeRow, col, rows)) {
            writeRow--;
          }
        }
      }
    }

    // Spawn new symbols in empty active cells
    const spawnedCells = [];
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        if (isVoidCore(row, col, rows)) continue;
        if (grid[row][col] === null) {
          const symbolKey = randomSymbol();
          grid[row][col] = symbolKey;
          spawnedCells.push({ row, col, symbolKey });
        }
      }
    }

    steps.push({
      clusters,
      removedCells,
      settledMoves,
      spawnedCells,
      gridAfter: cloneGrid(grid),
    });

    cascadeCount++;
  }

  return steps;
}

function cloneGrid(grid) {
  return grid.map((row) => [...row]);
}
