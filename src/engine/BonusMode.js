import { BONUS, GRID_SIZE_BONUS } from '../utils/constants.js';
import { getActiveCells, isVoidCore } from '../utils/gridHelpers.js';
import { generateGrid } from './MockOutcomeGen.js';

/**
 * Bonus Mode (Event Horizon) engine.
 *
 * - 20 free spins max
 * - 9×9 grid with 3×3 void core (72 active cells)
 * - Void Absorption: ~15% of dead symbols → WILD each spin
 * - Scatter retrigger: 2+ scatters → +3 spins (cap at 20)
 * - Multiplier bubbles persist permanently
 */
export class BonusMode {
  constructor() {
    this.active = false;
    this.spinsRemaining = 0;
    this.spinsUsed = 0;
    this.totalWin = 0;
    this.gridSize = GRID_SIZE_BONUS;
  }

  /** Start bonus mode with initial spin count */
  start(initialSpins = BONUS.MAX_SPINS) {
    this.active = true;
    this.spinsRemaining = initialSpins;
    this.spinsUsed = 0;
    this.totalWin = 0;
    this.gridSize = GRID_SIZE_BONUS;
  }

  /** Use a spin. Returns false if no spins left. */
  useSpin() {
    if (this.spinsRemaining <= 0) return false;
    this.spinsRemaining--;
    this.spinsUsed++;
    return true;
  }

  /** Check for scatter retrigger — returns added spins (0 or 3) */
  checkRetrigger(grid) {
    let scatterCount = 0;
    for (let r = 0; r < this.gridSize; r++) {
      for (let c = 0; c < this.gridSize; c++) {
        if (grid[r]?.[c] === 'SCATTER') {
          scatterCount++;
        }
      }
    }

    if (scatterCount >= BONUS.SCATTER_RETRIGGER_COUNT) {
      const added = BONUS.SCATTER_RETRIGGER_SPINS;
      this.spinsRemaining = Math.min(
        this.spinsRemaining + added,
        BONUS.MAX_SPINS - this.spinsUsed
      );
      return added;
    }
    return 0;
  }

  /**
   * Void Absorption: convert ~15% of non-winning cells to WILD.
   * Mutates the grid in place and returns list of affected cells.
   */
  applyVoidAbsorption(grid, winningCellKeys) {
    const converted = [];
    const activeCells = getActiveCells(this.gridSize);

    for (const cell of activeCells) {
      const key = `${cell.row},${cell.col}`;
      if (winningCellKeys.has(key)) continue;
      if (grid[cell.row][cell.col] === 'WILD') continue;
      if (grid[cell.row][cell.col] === 'SCATTER') continue;

      if (Math.random() < BONUS.VOID_ABSORPTION_RATE) {
        grid[cell.row][cell.col] = 'WILD';
        converted.push({ row: cell.row, col: cell.col });
      }
    }
    return converted;
  }

  /** Generate a bonus grid (9×9) */
  generateBonusGrid() {
    return generateGrid(this.gridSize);
  }

  /** Add to total bonus win */
  addWin(amount) {
    this.totalWin += amount;
  }

  /** End bonus mode. Returns total win. */
  end() {
    this.active = false;
    const total = this.totalWin;
    this.totalWin = 0;
    this.spinsRemaining = 0;
    this.spinsUsed = 0;
    return total;
  }

  get isComplete() {
    return this.spinsRemaining <= 0;
  }
}
