import { ANIM, CAMERA_POS_Z, CAMERA_FOV } from '../utils/constants.js';
import { easeInCubic, easeOutCubic } from './Easings.js';

/**
 * Event Horizon Cinematic — 5-stage, ~4.3s animation.
 *
 * Stage 1: Charge (0.5s) — energy rushes to center, symbols vibrate
 * Stage 2: Crack (1.0s) — screen overlay fracture lines, light bleeds
 * Stage 3: Collapse (0.8s) — symbols pulled violently to center
 * Stage 4: Silence (0.5s) — pure black, no particles, no light
 * Stage 5: Rebirth (1.5s) — 9×9 grid materializes outward, color shift
 */
export class EventHorizonCinematic {
  constructor(sceneManager) {
    this.sm = sceneManager;
    this.elapsed = 0;
    this._done = false;
    this._stage = 0;
    this._stageElapsed = 0;

    this._stages = [
      { name: 'charge', duration: ANIM.EH_CHARGE },
      { name: 'crack', duration: ANIM.EH_CRACK },
      { name: 'collapse', duration: ANIM.EH_COLLAPSE },
      { name: 'silence', duration: ANIM.EH_SILENCE },
      { name: 'rebirth', duration: ANIM.EH_REBIRTH },
    ];

    this.totalDuration = this._stages.reduce((s, st) => s + st.duration, 0);

    // Cache symbol positions for collapse animation
    this._symbolStartPositions = [];
    this._savedMeterLevel = 0;

    // Callback for when 9×9 grid should be expanded (called during rebirth)
    this.onExpandGrid = null;
  }

  start() {
    this.elapsed = 0;
    this._done = false;
    this._stage = 0;
    this._stageElapsed = 0;

    // Lock symbol animation
    this.sm.symbols.animating = true;

    // Cache starting positions
    this._symbolStartPositions = this.sm.symbols.symbols.map((s) => ({
      x: s.position.x,
      y: s.position.y,
      z: s.position.z,
      visible: s.visible,
    }));

    // Save and override meter level for cinematic
    this._savedMeterLevel = this.sm.meterLevel;
  }

  update(delta) {
    if (this._done) return;
    this.elapsed += delta;
    this._stageElapsed += delta;

    const stage = this._stages[this._stage];
    const t = Math.min(this._stageElapsed / stage.duration, 1);

    switch (stage.name) {
      case 'charge':
        this._updateCharge(t);
        break;
      case 'crack':
        this._updateCrack(t);
        break;
      case 'collapse':
        this._updateCollapse(t);
        break;
      case 'silence':
        this._updateSilence(t);
        break;
      case 'rebirth':
        this._updateRebirth(t);
        break;
    }

    // Advance to next stage
    if (t >= 1) {
      this._stage++;
      this._stageElapsed = 0;

      if (this._stage >= this._stages.length) {
        this._finalize();
      }
    }
  }

  /**
   * Charge: energy rushes to center, symbols vibrate
   */
  _updateCharge(t) {
    const ease = easeInCubic(t);
    const symbols = this.sm.symbols.symbols;

    for (let i = 0; i < symbols.length; i++) {
      const sym = symbols[i];
      if (!sym.visible) continue;
      const sp = this._symbolStartPositions[i];

      // Vibrate increasing with t
      const vibrate = ease * 0.2;
      sym.position.x = sp.x + (Math.random() - 0.5) * vibrate;
      sym.position.y = sp.y + (Math.random() - 0.5) * vibrate;

      // Emissive ramp up
      if (sym.material.emissive) {
        sym.material.emissiveIntensity = 0.3 + ease * 2.0;
      }
    }

    // Bloom surge
    if (this.sm.bloomPass) {
      this.sm.bloomPass.strength = 0.8 + ease * 2.0;
    }

    // Meter held at max
    this.sm.meterLevel = 1.0;
  }

  /**
   * Crack: screen fracture effect (visual via bloom + camera shake + overlay handled by HUD)
   */
  _updateCrack(t) {
    const ease = easeOutCubic(t);

    // Intense bloom flash
    if (this.sm.bloomPass) {
      const flash = Math.sin(t * Math.PI * 6) * 0.5;
      this.sm.bloomPass.strength = 2.8 + flash;
    }

    // Camera shake intensifies
    const shake = 0.15 * (1 - ease * 0.5);
    this.sm.camera.position.x += (Math.random() - 0.5) * shake;
    this.sm.camera.position.y += (Math.random() - 0.5) * shake;

    // Light bleeds — white flash pulses
    if (this.sm.lighting && this.sm.lighting.pulseLight) {
      this.sm.lighting.pulseLight.intensity = 2.0 + Math.sin(t * Math.PI * 8) * 1.5;
      this.sm.lighting.pulseLight.color.setHex(0xffffff);
    }
  }

  /**
   * Collapse: symbols pulled violently to center with scale-down
   */
  _updateCollapse(t) {
    const ease = easeInCubic(t);
    const symbols = this.sm.symbols.symbols;

    for (let i = 0; i < symbols.length; i++) {
      const sym = symbols[i];
      if (!this._symbolStartPositions[i].visible) continue;
      const sp = this._symbolStartPositions[i];

      // Pull toward center (0,0)
      sym.position.x = sp.x * (1 - ease);
      sym.position.y = sp.y * (1 - ease);
      sym.position.z = sp.z * (1 - ease * 0.5);

      // Scale down
      const scale = 1.0 - ease * 0.8;
      sym.scale.set(scale, scale, scale);

      // Fade
      sym.material.opacity = 0.9 * (1 - ease);
    }

    // Core pulses larger
    if (this.sm.blackHole) {
      const coreScale = 1.0 + ease * 0.5;
      this.sm.blackHole.core.scale.set(coreScale, coreScale, coreScale);
    }

    // Accretion disc speeds up massively
    if (this.sm.blackHole && this.sm.blackHole.accretionDisc) {
      this.sm.blackHole.accretionDisc.material.opacity = 1.0 - ease * 0.7;
    }
  }

  /**
   * Silence: pure black, no particles, no light
   */
  _updateSilence(t) {
    // Hide everything
    for (const sym of this.sm.symbols.symbols) {
      sym.visible = false;
    }

    // Kill all lights
    if (this.sm.lighting) {
      this.sm.lighting.ambient.intensity = 0;
      this.sm.lighting.pointLight1.intensity = 0;
      this.sm.lighting.pointLight2.intensity = 0;
      this.sm.lighting.pulseLight.intensity = 0;
    }

    // Hide particles
    if (this.sm.blackHole) {
      this.sm.blackHole.accretionDisc.visible = false;
      this.sm.blackHole.group.visible = false;
    }
    if (this.sm.environment) {
      this.sm.environment.starField.visible = false;
      this.sm.environment.nebulaFog.visible = false;
    }
    if (this.sm.grid) {
      this.sm.grid.group.visible = false;
    }

    // Pure black bloom
    if (this.sm.bloomPass) {
      this.sm.bloomPass.strength = 0;
    }
  }

  /**
   * Rebirth: 9×9 grid materializes outward, magenta color shift
   */
  _updateRebirth(t) {
    const ease = easeOutCubic(t);

    // Restore visibility gradually
    if (this.sm.blackHole) {
      this.sm.blackHole.group.visible = true;
      this.sm.blackHole.accretionDisc.visible = true;
      this.sm.blackHole.accretionDisc.material.opacity = ease * 0.9;
    }
    if (this.sm.environment) {
      this.sm.environment.starField.visible = true;
      this.sm.environment.nebulaFog.visible = true;
      this.sm.environment.nebulaFog.material.opacity = ease * 0.15;
    }
    if (this.sm.grid) {
      this.sm.grid.group.visible = true;
      this.sm.grid.gridFrame.material.opacity = ease * 0.4;
    }

    // Restore lights with magenta tint
    if (this.sm.lighting) {
      this.sm.lighting.ambient.intensity = ease * 0.6;
      this.sm.lighting.pointLight1.intensity = ease * 1.2;
      this.sm.lighting.pointLight1.color.setHex(0xff006e);
      this.sm.lighting.pointLight2.intensity = ease * 1.0;
      this.sm.lighting.pointLight2.color.setHex(0xff006e);
      this.sm.lighting.pulseLight.intensity = ease * 1.5;
      this.sm.lighting.pulseLight.color.setHex(0xff006e);
    }

    // Bloom ramps back up dramatically
    if (this.sm.bloomPass) {
      this.sm.bloomPass.strength = ease * 2.5;
    }

    // Camera pulls back + FOV widens slightly
    this.sm.camera.position.z = CAMERA_POS_Z + ease * 4;
    this.sm.camera.fov = CAMERA_FOV + ease * 8;
    this.sm.camera.updateProjectionMatrix();

    // Trigger grid expansion at start of rebirth
    if (t < 0.1 && this.onExpandGrid) {
      this.onExpandGrid();
      this.onExpandGrid = null; // only call once
    }

    // Materialize symbols outward from center
    const symbols = this.sm.symbols.symbols;
    for (let i = 0; i < symbols.length; i++) {
      const sym = symbols[i];
      const d = sym.userData;
      sym.visible = true;

      // Scale up from 0
      const scale = ease;
      sym.scale.set(scale, scale, scale);

      // Position from center outward
      sym.position.x = d.baseX * ease;
      sym.position.y = d.baseY * ease;
      sym.position.z = d.baseZ;

      // Opacity fade in
      sym.material.opacity = ease * 0.9;

      // Magenta emissive tint
      if (sym.material.emissive) {
        sym.material.emissiveIntensity = 0.5 + ease * 0.3;
      }
    }
  }

  _finalize() {
    this._done = true;
    this.sm.symbols.animating = false;

    // Reset camera
    this.sm.camera.position.z = CAMERA_POS_Z + 4;
    this.sm.camera.fov = CAMERA_FOV + 8;
    this.sm.camera.updateProjectionMatrix();

    // Ensure all symbols are at full position/scale
    for (const sym of this.sm.symbols.symbols) {
      sym.visible = true;
      sym.scale.set(1, 1, 1);
      sym.material.opacity = 0.9;
      sym.position.set(sym.userData.baseX, sym.userData.baseY, sym.userData.baseZ);
    }

    // Bloom at bonus level
    if (this.sm.bloomPass) {
      this.sm.bloomPass.strength = 2.0;
    }

    this.sm.meterLevel = 1.0;
  }

  isComplete() {
    return this._done;
  }
}
