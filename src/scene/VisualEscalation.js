import * as THREE from 'three';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { BLOOM_PARAMS, MOBILE_BREAKPOINT } from '../utils/constants.js';
import { lerp } from '../utils/mathHelpers.js';

/**
 * Chromatic Aberration shader — activates at 50%+ meter.
 * Separates RGB channels with increasing offset.
 */
const ChromaticAberrationShader = {
  uniforms: {
    tDiffuse: { value: null },
    amount: { value: 0.0 },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float amount;
    varying vec2 vUv;
    void main() {
      vec2 dir = vUv - vec2(0.5);
      float dist = length(dir);
      vec2 offset = dir * dist * amount;
      float r = texture2D(tDiffuse, vUv + offset).r;
      float g = texture2D(tDiffuse, vUv).g;
      float b = texture2D(tDiffuse, vUv - offset).b;
      float a = texture2D(tDiffuse, vUv).a;
      gl_FragColor = vec4(r, g, b, a);
    }
  `,
};

/**
 * Orchestrates dramatic environment changes per meter level.
 *
 * Level 0-24%  (Dormant Void)    — dim, slow, calm
 * Level 25-49% (Awakening)       — cyan brightens, speed +30%
 * Level 50-74% (Distortion)      — flickering, chromatic aberration
 * Level 75-99% (Critical Mass)   — strobing magenta, heavy bloom, screen shake
 * Level 100%   (Event Horizon)   — cinematic trigger (handled elsewhere)
 */
export class VisualEscalation {
  constructor(sceneManager) {
    this.sm = sceneManager;
    this.isMobile = window.innerWidth <= MOBILE_BREAKPOINT;
    this._caPass = null;
    this._cameraShakeOffset = new THREE.Vector2();
    this._lastMeterLevel = 0;

    // Add chromatic aberration pass (desktop only)
    if (!this.isMobile && this.sm.composer) {
      this._caPass = new ShaderPass(ChromaticAberrationShader);
      this.sm.composer.addPass(this._caPass);
    }
  }

  apply(meterLevel) {
    this._lastMeterLevel = meterLevel;

    this._applyBloom(meterLevel);
    this._applyVignette(meterLevel);
    this._applyChromaticAberration(meterLevel);
    this._applyGridEffects(meterLevel);
  }

  /**
   * Call each frame for time-dependent effects (screen shake).
   */
  updateFrame(time, delta, meterLevel) {
    this._applyScreenShake(time, meterLevel);
  }

  _applyBloom(meterLevel) {
    if (!this.sm.bloomPass) return;

    // Bloom ramps up dramatically across tiers
    // Dormant: base → Awakening: 1.5x → Distortion: 2x → Critical: 3x
    let strengthMul, radiusMul;

    if (meterLevel < 0.25) {
      strengthMul = lerp(1.0, 1.5, meterLevel / 0.25);
      radiusMul = 1.0;
    } else if (meterLevel < 0.5) {
      strengthMul = lerp(1.5, 2.0, (meterLevel - 0.25) / 0.25);
      radiusMul = lerp(1.0, 1.2, (meterLevel - 0.25) / 0.25);
    } else if (meterLevel < 0.75) {
      strengthMul = lerp(2.0, 2.5, (meterLevel - 0.5) / 0.25);
      radiusMul = lerp(1.2, 1.4, (meterLevel - 0.5) / 0.25);
    } else {
      strengthMul = lerp(2.5, 3.0, (meterLevel - 0.75) / 0.25);
      radiusMul = lerp(1.4, 1.6, (meterLevel - 0.75) / 0.25);
    }

    this.sm.bloomPass.strength = BLOOM_PARAMS.strength * strengthMul;
    this.sm.bloomPass.radius = BLOOM_PARAMS.radius * radiusMul;
  }

  _applyVignette(meterLevel) {
    if (!this.sm.vignettePass) return;

    // Vignette opens up at high meter (more visible periphery for spectacle)
    this.sm.vignettePass.uniforms.darkness.value = lerp(1.2, 0.6, meterLevel);
  }

  _applyChromaticAberration(meterLevel) {
    if (!this._caPass) return;

    // Activates at 50%+, increases toward 100%
    if (meterLevel < 0.5) {
      this._caPass.uniforms.amount.value = 0.0;
    } else {
      // 0→0.015 over 50-100% range
      const t = (meterLevel - 0.5) / 0.5;
      this._caPass.uniforms.amount.value = t * 0.015;
    }
  }

  _applyGridEffects(meterLevel) {
    // Grid pulsing brightness handled in GridRenderer.update() via meterLevel
    // Here we handle any cross-system grid effects
    if (!this.sm.grid) return;

    // Grid frame color shifts toward cyan/magenta at high meter
    if (meterLevel > 0.5 && this.sm.grid.gridFrame) {
      const t = (meterLevel - 0.5) / 0.5;
      const baseColor = 0x1a0a2e;
      const r = ((baseColor >> 16) & 0xff) / 255;
      const g = ((baseColor >> 8) & 0xff) / 255;
      const b = (baseColor & 0xff) / 255;
      // Shift toward cyan (#00d4ff) then magenta (#ff006e)
      if (meterLevel < 0.75) {
        const st = t * 2; // 0-1 over 50-75%
        this.sm.grid.gridFrame.material.color.setRGB(
          lerp(r, 0, st),
          lerp(g, 0.83, st),
          lerp(b, 1.0, st)
        );
      } else {
        const st = (meterLevel - 0.75) / 0.25; // 0-1 over 75-100%
        this.sm.grid.gridFrame.material.color.setRGB(
          lerp(0, 1.0, st),
          lerp(0.83, 0, st),
          lerp(1.0, 0.43, st)
        );
      }
    }
  }

  _applyScreenShake(time, meterLevel) {
    if (!this.sm.camera) return;

    // Screen shake at 75%+ meter
    if (meterLevel >= 0.75) {
      const intensity = (meterLevel - 0.75) / 0.25; // 0-1
      const shakeX = (Math.sin(time * 37.0) + Math.cos(time * 53.0)) * intensity * 0.08;
      const shakeY = (Math.cos(time * 41.0) + Math.sin(time * 47.0)) * intensity * 0.06;
      this._cameraShakeOffset.set(shakeX, shakeY);
    } else {
      this._cameraShakeOffset.set(0, 0);
    }
  }

  /** Get camera shake offset to add to camera position in the render loop */
  get cameraShakeOffset() {
    return this._cameraShakeOffset;
  }

  dispose() {
    // ChromaticAberration pass is managed by composer — no separate disposal needed
  }
}
