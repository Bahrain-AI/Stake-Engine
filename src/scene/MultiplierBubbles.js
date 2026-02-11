import * as THREE from 'three';
import { COLORS, CELL_SPACING, SYMBOL_PLANE_Z } from '../utils/constants.js';
import { gridToWorld } from '../utils/gridHelpers.js';

/**
 * 3D multiplier bubbles that orbit the grid perimeter.
 * Each bubble: transparent sphere + glowing number inside (via emissive ring).
 */
export class MultiplierBubbles {
  constructor(scene) {
    this.group = new THREE.Group();
    this.group.name = 'MultiplierBubbles';
    scene.add(this.group);

    this._meshPool = []; // pre-allocated mesh objects
    this._activeMeshes = new Map(); // bubbleId → mesh

    // Shared geometries
    this._sphereGeo = new THREE.SphereGeometry(0.35, 16, 16);
    this._ringGeo = new THREE.TorusGeometry(0.25, 0.03, 8, 16);

    // Pre-allocate a pool of 10 bubbles
    for (let i = 0; i < 10; i++) {
      this._createBubbleMesh();
    }
  }

  _createBubbleMesh() {
    const bubbleGroup = new THREE.Group();

    // Transparent sphere
    const sphere = new THREE.Mesh(
      this._sphereGeo,
      new THREE.MeshPhongMaterial({
        color: COLORS.ELECTRIC_CYAN,
        emissive: COLORS.ELECTRIC_CYAN,
        emissiveIntensity: 0.3,
        transparent: true,
        opacity: 0.2,
        shininess: 100,
      })
    );
    bubbleGroup.add(sphere);

    // Glowing ring (visual indicator of multiplier)
    const ring = new THREE.Mesh(
      this._ringGeo,
      new THREE.MeshBasicMaterial({
        color: COLORS.GOLD,
        transparent: true,
        opacity: 0.8,
      })
    );
    bubbleGroup.add(ring);

    bubbleGroup.visible = false;
    bubbleGroup.userData = { sphere, ring };
    this.group.add(bubbleGroup);
    this._meshPool.push(bubbleGroup);
    return bubbleGroup;
  }

  _getMesh() {
    // Find available mesh from pool
    for (const mesh of this._meshPool) {
      if (!mesh.visible) return mesh;
    }
    // Create new if pool exhausted
    return this._createBubbleMesh();
  }

  /**
   * Sync 3D bubbles with engine's MultiplierSystem state.
   */
  sync(bubbles) {
    // Hide all first
    const activeIds = new Set();
    for (const b of bubbles) {
      if (b.active) activeIds.add(b.id);
    }

    // Remove meshes for bubbles that no longer exist
    for (const [id, mesh] of this._activeMeshes) {
      if (!activeIds.has(id)) {
        mesh.visible = false;
        this._activeMeshes.delete(id);
      }
    }

    // Add/update meshes for active bubbles
    for (const b of bubbles) {
      if (!b.active) continue;

      let mesh = this._activeMeshes.get(b.id);
      if (!mesh) {
        mesh = this._getMesh();
        this._activeMeshes.set(b.id, mesh);
      }

      mesh.visible = true;
      const world = gridToWorld(b.row, b.col);
      mesh.position.set(world.x, world.y, SYMBOL_PLANE_Z + 0.5);

      // Scale ring brightness by value
      const ringMat = mesh.userData.ring.material;
      if (b.value >= 10) {
        ringMat.color.setHex(COLORS.HOT_MAGENTA);
      } else if (b.value >= 5) {
        ringMat.color.setHex(COLORS.GOLD);
      } else {
        ringMat.color.setHex(COLORS.ELECTRIC_CYAN);
      }
    }
  }

  update(time, delta) {
    // Gentle rotation and bob for all visible bubbles
    for (const [, mesh] of this._activeMeshes) {
      if (!mesh.visible) continue;
      mesh.rotation.y += delta * 1.5;
      mesh.position.z = SYMBOL_PLANE_Z + 0.5 + Math.sin(time * 2.0 + mesh.position.x) * 0.15;

      // Pulsing sphere opacity
      mesh.userData.sphere.material.opacity = 0.15 + Math.sin(time * 3.0) * 0.08;
    }
  }

  dispose() {
    this._sphereGeo.dispose();
    this._ringGeo.dispose();
    for (const mesh of this._meshPool) {
      mesh.userData.sphere.material.dispose();
      mesh.userData.ring.material.dispose();
    }
    this.group.parent?.remove(this.group);
  }
}
