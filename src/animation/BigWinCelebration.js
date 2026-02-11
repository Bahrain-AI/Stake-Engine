import * as THREE from 'three';
import { COLORS } from '../utils/constants.js';

/**
 * Big Win Celebration — triggers at 100x+ multiplier.
 *
 * Effects:
 * 1. Shockwave ring expanding from center
 * 2. Particles accelerate 3x
 * 3. Camera shake (decaying sinusoidal)
 * 4. Chromatic aberration spike
 * 5. Gold particle burst
 */
export class BigWinCelebration {
  constructor(sceneManager) {
    this.sm = sceneManager;
    this.elapsed = 0;
    this.duration = 2.5; // seconds
    this._done = false;

    // Shockwave ring
    this._ring = null;
    this._ringMat = null;
  }

  start() {
    this.elapsed = 0;
    this._done = false;

    // Create expanding ring
    const geo = new THREE.TorusGeometry(0.5, 0.08, 8, 64);
    this._ringMat = new THREE.MeshBasicMaterial({
      color: COLORS.GOLD,
      transparent: true,
      opacity: 1.0,
      blending: THREE.AdditiveBlending,
    });
    this._ring = new THREE.Mesh(geo, this._ringMat);
    this._ring.position.z = 2;
    this.sm.scene.add(this._ring);
  }

  update(delta) {
    if (this._done) return;
    this.elapsed += delta;
    const t = Math.min(this.elapsed / this.duration, 1);

    // Shockwave ring expansion
    if (this._ring) {
      const scale = 1 + t * 20;
      this._ring.scale.set(scale, scale, 1);
      this._ringMat.opacity = 1.0 - t;
    }

    // Camera shake (decaying sinusoidal)
    if (this.sm.camera) {
      const decay = Math.exp(-t * 4);
      const shakeX = Math.sin(this.elapsed * 25) * 0.15 * decay;
      const shakeY = Math.cos(this.elapsed * 30) * 0.12 * decay;
      this.sm.camera.position.x += shakeX;
      this.sm.camera.position.y += shakeY;
    }

    // Chromatic aberration spike
    if (this.sm.escalation && this.sm.escalation._caPass) {
      const caSpike = (1 - t) * 0.03;
      this.sm.escalation._caPass.uniforms.amount.value = caSpike;
    }

    // Bloom spike
    if (this.sm.bloomPass) {
      this.sm.bloomPass.strength = 0.8 + (1 - t) * 3.0;
    }

    if (t >= 1) {
      this._finalize();
    }
  }

  _finalize() {
    this._done = true;

    // Remove ring
    if (this._ring) {
      this.sm.scene.remove(this._ring);
      this._ring.geometry.dispose();
      this._ringMat.dispose();
      this._ring = null;
    }

    // Reset bloom
    if (this.sm.bloomPass) {
      this.sm.escalation?.apply(this.sm.meterLevel);
    }

    // Reset CA
    if (this.sm.escalation && this.sm.escalation._caPass) {
      this.sm.escalation._applyChromaticAberration(this.sm.meterLevel);
    }
  }

  isComplete() {
    return this._done;
  }
}
