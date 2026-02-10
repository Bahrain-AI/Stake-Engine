import { BLOOM_PARAMS } from '../utils/constants.js';
import { lerp } from '../utils/mathHelpers.js';

/**
 * Orchestrates environment changes per meter level.
 * References the SceneManager's subsystems to adjust parameters.
 *
 * Level 0-24%  (Dormant Void)    — dim, slow, calm
 * Level 25-49% (Awakening)       — cyan brightens, speed +30%
 * Level 50-74% (Distortion)      — flickering, chromatic aberration
 * Level 75-99% (Critical Mass)   — strobing magenta, heavy bloom
 * Level 100%   (Event Horizon)   — cinematic trigger (handled elsewhere)
 *
 * Each subsystem reads meterLevel directly in its update(),
 * but this class applies the post-processing and bloom adjustments
 * that cross subsystem boundaries.
 */
export class VisualEscalation {
  constructor(sceneManager) {
    this.sm = sceneManager;
  }

  apply(meterLevel) {
    // Bloom strength scales with meter
    if (this.sm.bloomPass) {
      this.sm.bloomPass.strength = lerp(
        BLOOM_PARAMS.strength,
        BLOOM_PARAMS.strength * 2.5,
        meterLevel
      );
      this.sm.bloomPass.radius = lerp(
        BLOOM_PARAMS.radius,
        BLOOM_PARAMS.radius * 1.5,
        meterLevel
      );
    }

    // Vignette darkness reduces slightly at high meter (more visible periphery)
    if (this.sm.vignettePass) {
      this.sm.vignettePass.uniforms.darkness.value = lerp(1.2, 0.8, meterLevel);
    }
  }
}
