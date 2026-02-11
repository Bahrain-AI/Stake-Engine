import { MIN_CLUSTER_SIZE } from '../utils/constants.js';
import { isVoidCore } from '../utils/gridHelpers.js';

/**
 * Flood-fill cluster detection with orthogonal adjacency.
 *
 * - Minimum cluster size: 5
 * - WILDs substitute for any paying symbol (not SCATTER)
 * - Void core cells excluded
 *
 * Returns array of cluster objects:
 *   { symbolType, cells: [{row, col}], size, hasWild }
 */
export function findClusters(grid) {
  const rows = grid.length;
  const cols = grid[0].length;
  const visited = Array.from({ length: rows }, () => new Array(cols).fill(false));
  const clusters = [];

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (visited[row][col]) continue;
      const sym = grid[row][col];
      if (sym === null || sym === 'SCATTER') continue;
      if (sym === 'WILD') continue; // WILDs don't start clusters, they join them

      // Flood-fill for this symbol type (including WILDs)
      const cluster = [];
      let hasWild = false;
      const stack = [[row, col]];

      while (stack.length > 0) {
        const [r, c] = stack.pop();
        if (r < 0 || r >= rows || c < 0 || c >= cols) continue;
        if (visited[r][c]) continue;
        if (isVoidCore(r, c, rows)) continue;

        const cellSym = grid[r][c];
        if (cellSym === null || cellSym === 'SCATTER') continue;

        // Cell must match the cluster symbol OR be WILD
        if (cellSym !== sym && cellSym !== 'WILD') continue;

        visited[r][c] = true;
        cluster.push({ row: r, col: c });
        if (cellSym === 'WILD') hasWild = true;

        // Orthogonal neighbors
        stack.push([r - 1, c]);
        stack.push([r + 1, c]);
        stack.push([r, c - 1]);
        stack.push([r, c + 1]);
      }

      if (cluster.length >= MIN_CLUSTER_SIZE) {
        clusters.push({
          symbolType: sym,
          cells: cluster,
          size: cluster.length,
          hasWild,
        });
      }
    }
  }

  return clusters;
}
