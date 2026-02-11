import { ANIM } from '../utils/constants.js';
import { easeOutCubic, easeOutBack } from './Easings.js';

/**
 * Spin Animation: symbols scatter outward, fade, then snap back with new types.
 *
 * Phase 1: Scatter out (0.3s) — symbols move away from center, opacity → 0.3
 * Phase 2: Snap back (0.4s) — symbols move to grid positions with new types, opacity → 1.0
 */
export class SpinAnimation {
  constructor(symbolManager, newGrid) {
    this.symbolManager = symbolManager;
    this.newGrid = newGrid;
    this.elapsed = 0;
    this.duration = ANIM.SPIN_SCATTER_OUT + ANIM.SPIN_SNAP_BACK;
    this._done = false;
    this._phase = 0; // 0 = scatter, 1 = snap back
    this._swapped = false;

    // Cache original positions
    this._originals = [];
    for (let i = 0; i < symbolManager.symbols.length; i++) {
      const sym = symbolManager.symbols[i];
      const d = sym.userData;
      this._originals.push({
        x: d.baseX,
        y: d.baseY,
        z: d.baseZ,
        opacity: sym.material.opacity,
      });
    }
  }

  start() {
    this.elapsed = 0;
    this._done = false;
    this._phase = 0;
    this._swapped = false;
    this.symbolManager.animating = true;
  }

  update(delta) {
    if (this._done) return;
    this.elapsed += delta;

    const symbols = this.symbolManager.symbols;

    if (this._phase === 0) {
      // Phase 1: Scatter out
      const t = Math.min(this.elapsed / ANIM.SPIN_SCATTER_OUT, 1);
      const ease = easeOutCubic(t);

      for (let i = 0; i < symbols.length; i++) {
        const sym = symbols[i];
        const orig = this._originals[i];
        // Scatter direction: away from center
        const angle = Math.atan2(orig.y, orig.x);
        const dist = 2.0 * ease;

        sym.position.x = orig.x + Math.cos(angle) * dist;
        sym.position.y = orig.y + Math.sin(angle) * dist;
        sym.material.opacity = 0.9 - ease * 0.6; // fade to 0.3
      }

      if (t >= 1) {
        this._phase = 1;
        this.elapsed = 0;
        // Swap symbol types to new grid
        this._applyNewGrid();
      }
    } else {
      // Phase 2: Snap back
      const t = Math.min(this.elapsed / ANIM.SPIN_SNAP_BACK, 1);
      const ease = easeOutBack(t);

      for (let i = 0; i < symbols.length; i++) {
        const sym = symbols[i];
        const d = sym.userData;
        // Interpolate from scattered position back to base
        const scatterAngle = Math.atan2(this._originals[i].y, this._originals[i].x);
        const scatterDist = 2.0;
        const startX = this._originals[i].x + Math.cos(scatterAngle) * scatterDist;
        const startY = this._originals[i].y + Math.sin(scatterAngle) * scatterDist;

        sym.position.x = startX + (d.baseX - startX) * ease;
        sym.position.y = startY + (d.baseY - startY) * ease;
        sym.position.z = d.baseZ;
        sym.material.opacity = 0.3 + ease * 0.6; // restore to 0.9

        // Brief glow flash near end
        if (t > 0.7 && sym.material.emissive) {
          sym.material.emissiveIntensity = 0.3 + (1 - (t - 0.7) / 0.3) * 1.0;
        }
      }

      if (t >= 1) {
        this._finalize();
      }
    }
  }

  _applyNewGrid() {
    if (this._swapped) return;
    this._swapped = true;
    const sm = this.symbolManager;
    for (let i = 0; i < sm.symbols.length; i++) {
      const sym = sm.symbols[i];
      const d = sym.userData;
      const newSymKey = this.newGrid[d.row]?.[d.col];
      if (newSymKey && newSymKey !== d.symbolKey) {
        sm.reassignSymbol(sym, newSymKey);
      }
    }
  }

  _finalize() {
    this._done = true;
    this.symbolManager.animating = false;
    // Reset positions and opacity
    const symbols = this.symbolManager.symbols;
    for (let i = 0; i < symbols.length; i++) {
      const sym = symbols[i];
      const d = sym.userData;
      sym.position.set(d.baseX, d.baseY, d.baseZ);
      sym.material.opacity = 0.9;
      if (sym.material.emissive) {
        sym.material.emissiveIntensity = 0.3;
      }
    }
  }

  isComplete() {
    return this._done;
  }
}
