import * as THREE from 'three';
import { GRID_SIZE, GRID_SIZE_BONUS, CELL_SPACING, COLORS, SYMBOL_PLANE_Z } from '../utils/constants.js';
import { isVoidCore, gridToWorld } from '../utils/gridHelpers.js';

export class GridRenderer {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.group.name = 'GridGroup';
    scene.add(this.group);

    this._currentGridSize = GRID_SIZE;
    this._buildGrid(GRID_SIZE);
  }

  _buildGrid(gridSize) {
    // Clear existing
    while (this.group.children.length > 0) {
      const child = this.group.children[0];
      if (child.geometry) child.geometry.dispose();
      if (child.material) child.material.dispose();
      this.group.remove(child);
    }

    this._currentGridSize = gridSize;
    this._createGridFrame(gridSize);
    this._createVoidCoreMask(gridSize);
  }

  _createGridFrame(gridSize) {
    const spacing = CELL_SPACING;
    const offset = ((gridSize - 1) * spacing) / 2;
    const half = spacing / 2;
    const z = SYMBOL_PLANE_Z - 0.1;

    const minEdge = -offset - half;
    const maxEdge = offset + half;

    const vertices = [];

    for (let row = 0; row <= gridSize; row++) {
      const y = -(row * spacing - offset - half);
      vertices.push(minEdge, y, z);
      vertices.push(maxEdge, y, z);
    }

    for (let col = 0; col <= gridSize; col++) {
      const x = col * spacing - offset - half;
      vertices.push(x, -minEdge, z);
      vertices.push(x, -maxEdge, z);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(vertices, 3)
    );

    const material = new THREE.LineBasicMaterial({
      color: COLORS.GRID_PURPLE,
      transparent: true,
      opacity: 0.3,
      blending: THREE.AdditiveBlending,
    });

    this.gridFrame = new THREE.LineSegments(geometry, material);
    this.gridFrame.name = 'GridFrame';
    this.group.add(this.gridFrame);
  }

  _createVoidCoreMask(gridSize) {
    const spacing = CELL_SPACING;
    // 7×7: 2×2 void core, 9×9: 3×3 void core
    const coreSize = gridSize === GRID_SIZE ? 2 : 3;
    const size = spacing * coreSize;

    const geometry = new THREE.PlaneGeometry(size, size);
    const material = new THREE.MeshBasicMaterial({
      color: COLORS.PURE_BLACK,
      transparent: true,
      opacity: 0.4,
      depthWrite: false,
    });

    this.voidCoreMask = new THREE.Mesh(geometry, material);

    // Center of void core
    const coreStart = gridSize === GRID_SIZE ? 3 : 3;
    const coreEnd = gridSize === GRID_SIZE ? 4 : 5;
    const tl = gridToWorld(coreStart, coreStart, gridSize);
    const br = gridToWorld(coreEnd, coreEnd, gridSize);
    this.voidCoreMask.position.set(
      (tl.x + br.x) / 2,
      (tl.y + br.y) / 2,
      SYMBOL_PLANE_Z - 0.2
    );
    this.voidCoreMask.name = 'VoidCoreMask';
    this.group.add(this.voidCoreMask);
  }

  /** Rebuild grid for 9×9 bonus mode */
  expandTo9x9() {
    this._buildGrid(GRID_SIZE_BONUS);
  }

  /** Rebuild grid for 7×7 base mode */
  contractTo7x7() {
    this._buildGrid(GRID_SIZE);
  }

  update(time, delta, meterLevel) {
    if (!this.gridFrame) return;
    const baseOpacity = 0.2 + meterLevel * 0.15;
    const pulse = Math.sin(time * 1.5) * 0.08;
    this.gridFrame.material.opacity = baseOpacity + pulse;

    if (meterLevel > 0.5) {
      const brighten = (meterLevel - 0.5) * 2;
      this.gridFrame.material.opacity += brighten * 0.15;
    }
  }

  dispose() {
    this.group.traverse((obj) => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) obj.material.dispose();
    });
    this.group.parent?.remove(this.group);
  }
}
