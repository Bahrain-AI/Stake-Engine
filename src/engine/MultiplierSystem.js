import { randomRange, randomInt } from '../utils/mathHelpers.js';

/**
 * Multiplier Bubble System
 *
 * Bubbles spawn from:
 *   - Gravitational Surge (cluster 12+) or meter threshold 25%
 * Values: 2x, 3x, 5x, 10x
 * Orbit grid perimeter, activate on cluster overlap
 * Multiple on same win = multiplicative
 * Lifespan: 5 spins in base game (permanent in bonus)
 * At 75% threshold: all active bubble values double
 */

const BUBBLE_VALUES = [2, 3, 5, 10];
const BASE_LIFESPAN = 5; // spins

export class MultiplierSystem {
  constructor() {
    this.bubbles = []; // { id, value, spinsLeft, row, col, orbitAngle, active }
    this._nextId = 0;
    this.isBonus = false;
  }

  /**
   * Spawn a new multiplier bubble.
   * Returns the spawned bubble data.
   */
  spawnBubble(gridSize = 7) {
    const value = BUBBLE_VALUES[randomInt(0, BUBBLE_VALUES.length - 1)];
    const orbitAngle = randomRange(0, Math.PI * 2);
    // Position on grid perimeter
    const { row, col } = this._perimeterPosition(gridSize, orbitAngle);

    const bubble = {
      id: this._nextId++,
      value,
      spinsLeft: this.isBonus ? Infinity : BASE_LIFESPAN,
      row,
      col,
      orbitAngle,
      active: true,
    };

    this.bubbles.push(bubble);
    return bubble;
  }

  /**
   * Update bubble positions — orbit grid perimeter.
   * Call each frame with elapsed time.
   */
  updateOrbits(time, gridSize = 7) {
    for (const bubble of this.bubbles) {
      if (!bubble.active) continue;
      bubble.orbitAngle += 0.005; // slow orbit
      const pos = this._perimeterPosition(gridSize, bubble.orbitAngle);
      bubble.row = pos.row;
      bubble.col = pos.col;
    }
  }

  /**
   * Check if any bubbles overlap with winning cluster cells.
   * Returns { bubbles: matchedBubbles[], totalMultiplier }
   */
  checkActivation(clusterCells) {
    const cellSet = new Set(clusterCells.map((c) => `${c.row},${c.col}`));
    const matched = [];

    for (const bubble of this.bubbles) {
      if (!bubble.active) continue;
      if (cellSet.has(`${bubble.row},${bubble.col}`)) {
        matched.push(bubble);
      }
    }

    if (matched.length === 0) return { bubbles: [], totalMultiplier: 1 };

    // Multiplicative: 2x * 3x = 6x
    let totalMultiplier = 1;
    for (const b of matched) {
      totalMultiplier *= b.value;
      b.active = false; // consumed
    }

    return { bubbles: matched, totalMultiplier };
  }

  /**
   * Decrement lifespan on spin. Remove expired bubbles.
   */
  onSpin() {
    for (let i = this.bubbles.length - 1; i >= 0; i--) {
      const b = this.bubbles[i];
      if (!b.active) {
        this.bubbles.splice(i, 1);
        continue;
      }
      if (b.spinsLeft !== Infinity) {
        b.spinsLeft--;
        if (b.spinsLeft <= 0) {
          this.bubbles.splice(i, 1);
        }
      }
    }
  }

  /**
   * Double all active bubble values (75% threshold effect).
   */
  doubleAll() {
    for (const b of this.bubbles) {
      if (b.active) b.value *= 2;
    }
  }

  /**
   * Make all bubbles sticky (permanent lifespan) for bonus mode.
   */
  enterBonus() {
    this.isBonus = true;
    for (const b of this.bubbles) {
      b.spinsLeft = Infinity;
    }
  }

  exitBonus() {
    this.isBonus = false;
  }

  /**
   * Clear all bubbles.
   */
  clear() {
    this.bubbles = [];
  }

  get activeBubbles() {
    return this.bubbles.filter((b) => b.active);
  }

  _perimeterPosition(gridSize, angle) {
    // Map angle to perimeter position (clockwise)
    const perimeter = gridSize * 4 - 4;
    const idx = Math.floor(((angle % (Math.PI * 2)) / (Math.PI * 2)) * perimeter) % perimeter;

    let row, col;
    if (idx < gridSize) {
      // Top edge
      row = 0;
      col = idx;
    } else if (idx < gridSize * 2 - 1) {
      // Right edge
      row = idx - gridSize + 1;
      col = gridSize - 1;
    } else if (idx < gridSize * 3 - 2) {
      // Bottom edge
      row = gridSize - 1;
      col = gridSize - 1 - (idx - (gridSize * 2 - 1));
    } else {
      // Left edge
      row = gridSize - 1 - (idx - (gridSize * 3 - 2));
      col = 0;
    }

    return { row, col };
  }
}
