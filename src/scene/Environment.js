import * as THREE from 'three';
import {
  STAR_PARTICLE_COUNT,
  STAR_PARTICLE_COUNT_MOBILE,
  NEBULA_PARTICLE_COUNT,
  NEBULA_PARTICLE_COUNT_MOBILE,
  COLORS,
  MOBILE_BREAKPOINT,
} from '../utils/constants.js';
import { randomRange } from '../utils/mathHelpers.js';

export class Environment {
  constructor(scene, isMobile) {
    this.group = new THREE.Group();
    this.group.name = 'EnvironmentGroup';
    scene.add(this.group);

    this.isMobile = isMobile;
    this.starCount = isMobile ? STAR_PARTICLE_COUNT_MOBILE : STAR_PARTICLE_COUNT;
    this.nebulaCount = isMobile ? NEBULA_PARTICLE_COUNT_MOBILE : NEBULA_PARTICLE_COUNT;

    this._createStarField();
    this._createNebulaFog();
  }

  _createStarField() {
    const count = this.starCount;
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    // Distribute stars in layers for parallax depth
    for (let i = 0; i < count; i++) {
      positions[i * 3] = randomRange(-60, 60);
      positions[i * 3 + 1] = randomRange(-60, 60);
      // Distribute across depth layers: near (-10), mid (-25), far (-50)
      const layer = Math.random();
      if (layer < 0.3) {
        positions[i * 3 + 2] = randomRange(-15, -5);
        sizes[i] = randomRange(1.5, 3.0);
      } else if (layer < 0.7) {
        positions[i * 3 + 2] = randomRange(-35, -15);
        sizes[i] = randomRange(0.8, 1.5);
      } else {
        positions[i * 3 + 2] = randomRange(-60, -35);
        sizes[i] = randomRange(0.3, 0.8);
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 1.0,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });

    this.starField = new THREE.Points(geometry, material);
    this.starField.name = 'StarField';
    this.group.add(this.starField);

    // Store base positions for parallax twinkle
    this.starBasePositions = new Float32Array(positions);
  }

  _createNebulaFog() {
    const count = this.nebulaCount;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    const purpleColor = new THREE.Color(COLORS.DEEP_PURPLE);
    const cyanColor = new THREE.Color(COLORS.ELECTRIC_CYAN);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = randomRange(-40, 40);
      positions[i * 3 + 1] = randomRange(-40, 40);
      positions[i * 3 + 2] = randomRange(-30, -5);

      // Mix purple and cyan
      const t = Math.random();
      const c = t < 0.7 ? purpleColor : cyanColor;
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 8.0,
      vertexColors: true,
      transparent: true,
      opacity: 0.08,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });

    this.nebulaFog = new THREE.Points(geometry, material);
    this.nebulaFog.name = 'NebulaFog';
    this.group.add(this.nebulaFog);

    this.nebulaBasePositions = new Float32Array(positions);
  }

  update(time, delta, meterLevel) {
    // Star twinkle — subtle position drift for parallax feel
    const starPositions = this.starField.geometry.attributes.position.array;
    for (let i = 0; i < this.starCount; i++) {
      const base = i * 3;
      // Very subtle x/y drift based on depth (parallax)
      const depth = Math.abs(this.starBasePositions[base + 2]);
      const parallaxFactor = 0.001 / (depth * 0.1 + 1);
      starPositions[base] = this.starBasePositions[base] + Math.sin(time * 0.1 + i) * parallaxFactor * depth;
      starPositions[base + 1] = this.starBasePositions[base + 1] + Math.cos(time * 0.08 + i * 0.5) * parallaxFactor * depth;
    }
    this.starField.geometry.attributes.position.needsUpdate = true;

    // Nebula drift — slow, organic movement
    const nebulaPositions = this.nebulaFog.geometry.attributes.position.array;
    for (let i = 0; i < this.nebulaCount; i++) {
      const base = i * 3;
      nebulaPositions[base] = this.nebulaBasePositions[base] + Math.sin(time * 0.05 + i * 0.3) * 2.0;
      nebulaPositions[base + 1] = this.nebulaBasePositions[base + 1] + Math.cos(time * 0.04 + i * 0.2) * 2.0;
    }
    this.nebulaFog.geometry.attributes.position.needsUpdate = true;

    // Nebula brightness scales with meter
    this.nebulaFog.material.opacity = 0.08 + meterLevel * 0.12;
  }

  dispose() {
    this.group.traverse((obj) => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) obj.material.dispose();
    });
    this.group.parent?.remove(this.group);
  }
}
