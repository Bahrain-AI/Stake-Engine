import * as THREE from 'three';
import {
  BLACK_HOLE_CORE_RADIUS,
  EVENT_HORIZON_RADIUS,
  COLORS,
  ACCRETION_PARTICLE_COUNT,
  ACCRETION_PARTICLE_COUNT_MOBILE,
  MOBILE_BREAKPOINT,
} from '../utils/constants.js';
import { randomRange } from '../utils/mathHelpers.js';

export class BlackHole {
  constructor(scene) {
    this.group = new THREE.Group();
    this.group.name = 'BlackHoleGroup';
    scene.add(this.group);

    // Pre-allocate reusable vector
    this._tempVec = new THREE.Vector3();

    this.isMobile = window.innerWidth <= MOBILE_BREAKPOINT;
    this.particleCount = this.isMobile ? ACCRETION_PARTICLE_COUNT_MOBILE : ACCRETION_PARTICLE_COUNT;

    this._createCore();
    this._createGlowRings();
    this._createEventHorizonRing();
    this._createAccretionDisc();
  }

  _createCore() {
    const geometry = new THREE.SphereGeometry(BLACK_HOLE_CORE_RADIUS, 32, 32);
    const material = new THREE.MeshBasicMaterial({ color: COLORS.PURE_BLACK });
    this.core = new THREE.Mesh(geometry, material);
    this.core.renderOrder = 10;
    this.group.add(this.core);
    this.coreBaseScale = 1.0;
  }

  _createGlowRings() {
    this.glowRings = [];

    const ringConfigs = [
      { radius: 2.5, tube: 0.04, color: COLORS.DEEP_PURPLE, speed: 0.3, axis: 'z' },
      { radius: 2.8, tube: 0.03, color: COLORS.ELECTRIC_CYAN, speed: -0.2, axis: 'x' },
      { radius: 3.1, tube: 0.03, color: COLORS.DEEP_PURPLE, speed: 0.15, axis: 'y' },
    ];

    ringConfigs.forEach((cfg) => {
      const geometry = new THREE.TorusGeometry(cfg.radius, cfg.tube, 16, 64);
      const material = new THREE.MeshBasicMaterial({
        color: cfg.color,
        transparent: true,
        opacity: 0.6,
      });
      const ring = new THREE.Mesh(geometry, material);
      ring.userData = { speed: cfg.speed, axis: cfg.axis };
      this.group.add(ring);
      this.glowRings.push(ring);
    });
  }

  _createEventHorizonRing() {
    const geometry = new THREE.TorusGeometry(EVENT_HORIZON_RADIUS, 0.06, 16, 64);
    const material = new THREE.MeshBasicMaterial({
      color: COLORS.HOT_MAGENTA,
      transparent: true,
      opacity: 0.3,
    });
    this.eventHorizonRing = new THREE.Mesh(geometry, material);
    this.group.add(this.eventHorizonRing);
  }

  _createAccretionDisc() {
    const count = this.particleCount;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    // Store orbital data for animation
    this.accretionData = new Float32Array(count * 4); // angle, radius, speed, zOffset

    const colorPalette = [
      new THREE.Color(COLORS.DEEP_PURPLE),
      new THREE.Color(COLORS.ELECTRIC_CYAN),
      new THREE.Color(COLORS.HOT_MAGENTA),
    ];

    for (let i = 0; i < count; i++) {
      const angle = randomRange(0, Math.PI * 2);
      const radius = randomRange(2.5, 6.0);
      const speed = randomRange(0.3, 1.2) / radius; // inner particles orbit faster
      const zOffset = randomRange(-0.3, 0.3);

      this.accretionData[i * 4] = angle;
      this.accretionData[i * 4 + 1] = radius;
      this.accretionData[i * 4 + 2] = speed;
      this.accretionData[i * 4 + 3] = zOffset;

      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = Math.sin(angle) * radius;
      positions[i * 3 + 2] = zOffset;

      // Weighted color selection: mostly purple, some cyan, hint of magenta
      const colorIdx = Math.random() < 0.6 ? 0 : Math.random() < 0.7 ? 1 : 2;
      const c = colorPalette[colorIdx];
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;

      sizes[i] = randomRange(1.0, 3.0);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.PointsMaterial({
      size: 2.0,
      vertexColors: true,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });

    this.accretionDisc = new THREE.Points(geometry, material);
    this.accretionDisc.name = 'AccretionDisc';
    this.group.add(this.accretionDisc);
  }

  update(time, delta, meterLevel) {
    // Core pulsing scale
    const pulse = 1.0 + Math.sin(time * 2.0) * 0.03;
    const meterScale = 1.0 + meterLevel * 0.3; // grows at high meter
    const scale = pulse * meterScale;
    this.core.scale.set(scale, scale, scale);

    // Glow rings rotation
    for (let i = 0; i < this.glowRings.length; i++) {
      const ring = this.glowRings[i];
      const d = ring.userData;
      const speed = d.speed * (1.0 + meterLevel * 0.5);

      if (d.axis === 'z') ring.rotation.z += speed * delta;
      else if (d.axis === 'x') ring.rotation.x += speed * delta;
      else ring.rotation.y += speed * delta;

      ring.material.opacity = 0.4 + Math.sin(time * 1.5 + i) * 0.2 + meterLevel * 0.2;
    }

    // Event horizon ring pulse
    this.eventHorizonRing.material.opacity = 0.15 + Math.sin(time * 3.0) * 0.1 + meterLevel * 0.3;

    // Accretion disc particle orbiting
    const positions = this.accretionDisc.geometry.attributes.position.array;
    const speedMultiplier = 1.0 + meterLevel * 1.0; // doubles speed at max meter

    for (let i = 0; i < this.particleCount; i++) {
      const idx = i * 4;
      this.accretionData[idx] += this.accretionData[idx + 2] * delta * speedMultiplier;

      const angle = this.accretionData[idx];
      const radius = this.accretionData[idx + 1];
      const zOffset = this.accretionData[idx + 3];

      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = Math.sin(angle) * radius;
      positions[i * 3 + 2] = zOffset + Math.sin(time * 0.5 + angle) * 0.1;
    }
    this.accretionDisc.geometry.attributes.position.needsUpdate = true;

    // Opacity scales with meter level
    this.accretionDisc.material.opacity = 0.7 + meterLevel * 0.3;
  }

  dispose() {
    this.group.traverse((obj) => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach((m) => m.dispose());
        } else {
          obj.material.dispose();
        }
      }
    });
    this.group.parent?.remove(this.group);
  }
}
