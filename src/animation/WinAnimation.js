import { ANIM } from '../utils/constants.js';
import { easeOutCubic, easeInCubic } from './Easings.js';

/**
 * Win Animation: cluster symbols glow, then shrink/absorb toward center.
 *
 * Phase 1: Glow (0.3s) — emissive intensity → 2.0
 * Phase 2: Absorb (0.5s) — symbols scale down and spiral toward void center
 */
export class WinAnimation {
  constructor(symbolManager, clusters, blackHole) {
    this.symbolManager = symbolManager;
    this.clusters = clusters;
    this.blackHole = blackHole;
    this.elapsed = 0;
    this.duration = ANIM.WIN_GLOW + ANIM.WIN_ABSORB;
    this._done = false;
    this._phase = 0;

    // Build set of cell keys for fast lookup
    this._winCells = new Set();
    this._winMeshes = [];
    for (const cluster of clusters) {
      for (const cell of cluster.cells) {
        this._winCells.add(`${cell.row},${cell.col}`);
      }
    }

    // Find matching symbol meshes
    for (const sym of symbolManager.symbols) {
      const key = `${sym.userData.row},${sym.userData.col}`;
      if (this._winCells.has(key)) {
        this._winMeshes.push(sym);
      }
    }

    // Cache start positions
    this._startPositions = this._winMeshes.map((m) => ({
      x: m.position.x,
      y: m.position.y,
      z: m.position.z,
    }));
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
      // Phase 1: Glow
      const t = Math.min(this.elapsed / ANIM.WIN_GLOW, 1);

      for (const mesh of this._winMeshes) {
        if (mesh.material.emissive) {
          mesh.material.emissiveIntensity = 0.3 + t * 1.7; // → 2.0
        }
      }

      if (t >= 1) {
        this._phase = 1;
        this.elapsed = 0;
      }
    } else {
      // Phase 2: Absorb — spiral toward center and shrink
      const t = Math.min(this.elapsed / ANIM.WIN_ABSORB, 1);
      const ease = easeInCubic(t);

      for (let i = 0; i < this._winMeshes.length; i++) {
        const mesh = this._winMeshes[i];
        const start = this._startPositions[i];

        // Logarithmic spiral toward center
        const spiralAngle = t * Math.PI * 3; // 1.5 full rotations
        const spiralRadius = (1 - ease) * 1.5;

        mesh.position.x = start.x * (1 - ease) + Math.cos(spiralAngle + i) * spiralRadius * (1 - ease);
        mesh.position.y = start.y * (1 - ease) + Math.sin(spiralAngle + i) * spiralRadius * (1 - ease);
        mesh.position.z = start.z * (1 - ease);

        // Scale down
        const scale = 1.0 - ease * 0.9;
        mesh.scale.set(scale, scale, scale);

        // Fade
        mesh.material.opacity = 0.9 * (1 - ease);
      }

      // Core pulse effect on absorption
      if (this.blackHole && t > 0.5) {
        const corePulse = 1.0 + Math.sin((t - 0.5) * Math.PI * 4) * 0.08;
        this.blackHole.coreBaseScale = corePulse;
      }

      if (t >= 1) {
        this._finalize();
      }
    }
  }

  _finalize() {
    this._done = true;
    this.symbolManager.animating = false;

    // Hide absorbed symbols (they'll be reassigned in cascade)
    for (const mesh of this._winMeshes) {
      mesh.visible = false;
      mesh.scale.set(1, 1, 1);
      mesh.material.opacity = 0.9;
      if (mesh.material.emissive) {
        mesh.material.emissiveIntensity = 0.3;
      }
    }

    // Reset core pulse
    if (this.blackHole) {
      this.blackHole.coreBaseScale = 1.0;
    }
  }

  isComplete() {
    return this._done;
  }
}
