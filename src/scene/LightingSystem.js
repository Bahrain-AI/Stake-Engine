import * as THREE from 'three';
import { COLORS, LIGHT_POSITIONS } from '../utils/constants.js';
import { lerp } from '../utils/mathHelpers.js';

export class LightingSystem {
  constructor(scene) {
    this.scene = scene;

    // Ambient light — Grid Purple
    this.ambient = new THREE.AmbientLight(COLORS.GRID_PURPLE, 0.5);
    scene.add(this.ambient);

    // Point light 1 — Deep Purple
    this.pointLight1 = new THREE.PointLight(COLORS.DEEP_PURPLE, 1.0, 50);
    this.pointLight1.position.set(
      LIGHT_POSITIONS.POINT1.x,
      LIGHT_POSITIONS.POINT1.y,
      LIGHT_POSITIONS.POINT1.z
    );
    scene.add(this.pointLight1);

    // Point light 2 — Electric Cyan
    this.pointLight2 = new THREE.PointLight(COLORS.ELECTRIC_CYAN, 0.8, 50);
    this.pointLight2.position.set(
      LIGHT_POSITIONS.POINT2.x,
      LIGHT_POSITIONS.POINT2.y,
      LIGHT_POSITIONS.POINT2.z
    );
    scene.add(this.pointLight2);

    // Pulse light — shifts between purple and magenta with meter
    this.pulseLight = new THREE.PointLight(COLORS.DEEP_PURPLE, 0.6, 40);
    this.pulseLight.position.set(
      LIGHT_POSITIONS.PULSE.x,
      LIGHT_POSITIONS.PULSE.y,
      LIGHT_POSITIONS.PULSE.z
    );
    scene.add(this.pulseLight);

    // Pre-allocate color objects for lerping
    this._purpleColor = new THREE.Color(COLORS.DEEP_PURPLE);
    this._cyanColor = new THREE.Color(COLORS.ELECTRIC_CYAN);
    this._magentaColor = new THREE.Color(COLORS.HOT_MAGENTA);
    this._tempColor = new THREE.Color();
  }

  update(time, delta, meterLevel) {
    // Pulse light intensity oscillation
    const pulseBase = 0.4 + meterLevel * 0.8;
    const pulseOsc = Math.sin(time * 2.0) * 0.3;
    this.pulseLight.intensity = pulseBase + pulseOsc;

    // Pulse light color shifts with meter level
    // 0-24%: purple, 25-49%: cyan, 50-74%: cyan+magenta, 75-100%: magenta
    if (meterLevel < 0.25) {
      this.pulseLight.color.copy(this._purpleColor);
    } else if (meterLevel < 0.5) {
      const t = (meterLevel - 0.25) / 0.25;
      this._tempColor.copy(this._purpleColor).lerp(this._cyanColor, t);
      this.pulseLight.color.copy(this._tempColor);
    } else if (meterLevel < 0.75) {
      const t = (meterLevel - 0.5) / 0.25;
      this._tempColor.copy(this._cyanColor).lerp(this._magentaColor, t);
      this.pulseLight.color.copy(this._tempColor);
      // Flickering at 50%+
      if (Math.sin(time * 8.0) > 0.5) {
        this.pulseLight.intensity *= 1.3;
      }
    } else {
      this.pulseLight.color.copy(this._magentaColor);
      // Strobing at 75%+
      const strobe = Math.sin(time * 12.0) > 0.3 ? 1.5 : 0.5;
      this.pulseLight.intensity *= strobe;
    }

    // Point light 1 intensity scales up with meter
    this.pointLight1.intensity = 1.0 + meterLevel * 0.5;

    // Point light 2 brightens at 25%+
    this.pointLight2.intensity = 0.8 + (meterLevel > 0.25 ? meterLevel * 0.6 : 0);

    // Ambient brightens with meter
    this.ambient.intensity = 0.5 + meterLevel * 0.3;
  }

  dispose() {
    this.scene.remove(this.ambient);
    this.scene.remove(this.pointLight1);
    this.scene.remove(this.pointLight2);
    this.scene.remove(this.pulseLight);
  }
}
