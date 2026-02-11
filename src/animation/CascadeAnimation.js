import { ANIM } from '../utils/constants.js';
import { easeOutCubic, easeOutBack } from './Easings.js';
import { gridToWorld } from '../utils/gridHelpers.js';

/**
 * Cascade Animation: settled symbols drift to new positions, new symbols warp in.
 *
 * Phase 1: Drift (0.5s) — existing symbols move to fill gaps with physics feel
 * Phase 2: Spawn (0.3s) — new symbols materialize at their positions (scale + fade)
 */
export class CascadeAnimation {
  constructor(symbolManager, cascadeStep) {
    this.symbolManager = symbolManager;
    this.step = cascadeStep;
    this.elapsed = 0;
    this.duration = ANIM.CASCADE_DRIFT + ANIM.CASCADE_SPAWN;
    this._done = false;
    this._phase = 0;
    this._driftApplied = false;
    this._spawnApplied = false;

    // Build lookup: meshes by row,col for current positions
    this._meshMap = new Map();
    for (const sym of symbolManager.symbols) {
      const key = `${sym.userData.row},${sym.userData.col}`;
      this._meshMap.set(key, sym);
    }

    // Pre-compute drift animation data
    this._driftMoves = [];
    for (const move of cascadeStep.settledMoves) {
      const fromKey = `${move.from.row},${move.from.col}`;
      const mesh = this._meshMap.get(fromKey);
      if (!mesh) continue;

      const toWorld = gridToWorld(move.to.row, move.to.col);
      this._driftMoves.push({
        mesh,
        fromX: mesh.userData.baseX,
        fromY: mesh.userData.baseY,
        toX: toWorld.x,
        toY: toWorld.y,
        toRow: move.to.row,
        toCol: move.to.col,
        symbolKey: move.symbolKey,
      });
    }

    // Pre-compute spawn data
    this._spawns = [];
    for (const spawn of cascadeStep.spawnedCells) {
      // Find a mesh that was hidden (from win animation) or reassign
      const mesh = this._findAvailableMesh(spawn.row, spawn.col);
      if (!mesh) continue;
      const world = gridToWorld(spawn.row, spawn.col);
      this._spawns.push({
        mesh,
        targetX: world.x,
        targetY: world.y,
        row: spawn.row,
        col: spawn.col,
        symbolKey: spawn.symbolKey,
      });
    }
  }

  _findAvailableMesh(row, col) {
    // Look for hidden meshes first (absorbed symbols)
    for (const sym of this.symbolManager.symbols) {
      if (!sym.visible) return sym;
    }
    // Fallback: look for mesh at this position
    return this._meshMap.get(`${row},${col}`);
  }

  start() {
    this.elapsed = 0;
    this._done = false;
    this._phase = 0;
    this.symbolManager.animating = true;
  }

  update(delta) {
    if (this._done) return;
    this.elapsed += delta;

    if (this._phase === 0) {
      // Phase 1: Drift settle
      const t = Math.min(this.elapsed / ANIM.CASCADE_DRIFT, 1);
      const ease = easeOutCubic(t);

      for (const move of this._driftMoves) {
        move.mesh.position.x = move.fromX + (move.toX - move.fromX) * ease;
        move.mesh.position.y = move.fromY + (move.toY - move.fromY) * ease;
      }

      if (t >= 1) {
        // Apply final positions
        if (!this._driftApplied) {
          this._driftApplied = true;
          for (const move of this._driftMoves) {
            move.mesh.userData.row = move.toRow;
            move.mesh.userData.col = move.toCol;
            move.mesh.userData.baseX = move.toX;
            move.mesh.userData.baseY = move.toY;
            move.mesh.position.x = move.toX;
            move.mesh.position.y = move.toY;
          }
        }
        this._phase = 1;
        this.elapsed = 0;
      }
    } else {
      // Phase 2: Spawn new symbols
      const t = Math.min(this.elapsed / ANIM.CASCADE_SPAWN, 1);
      const ease = easeOutBack(t);

      if (!this._spawnApplied) {
        this._spawnApplied = true;
        // Set up spawned symbols
        for (const spawn of this._spawns) {
          spawn.mesh.visible = true;
          this.symbolManager.reassignSymbol(spawn.mesh, spawn.symbolKey);
          spawn.mesh.userData.row = spawn.row;
          spawn.mesh.userData.col = spawn.col;
          spawn.mesh.userData.baseX = spawn.targetX;
          spawn.mesh.userData.baseY = spawn.targetY;
          spawn.mesh.position.x = spawn.targetX;
          spawn.mesh.position.y = spawn.targetY;
          spawn.mesh.scale.set(0.01, 0.01, 0.01);
          spawn.mesh.material.opacity = 0;
        }
      }

      for (const spawn of this._spawns) {
        const scale = ease;
        spawn.mesh.scale.set(scale, scale, scale);
        spawn.mesh.material.opacity = Math.min(ease, 0.9);
      }

      if (t >= 1) {
        this._finalize();
      }
    }
  }

  _finalize() {
    this._done = true;
    this.symbolManager.animating = false;

    // Ensure all meshes are at final state
    for (const spawn of this._spawns) {
      spawn.mesh.scale.set(1, 1, 1);
      spawn.mesh.material.opacity = 0.9;
    }

    // Rebuild mesh map in symbolManager
    this.symbolManager.rebuildCellMap();
  }

  isComplete() {
    return this._done;
  }
}
