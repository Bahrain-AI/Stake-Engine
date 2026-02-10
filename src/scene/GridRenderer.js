import * as THREE from 'three';
import { GRID_SIZE, CELL_SPACING, COLORS, SYMBOL_PLANE_Z } from '../utils/constants.js';
import { isVoidCore, gridToWorld } from '../utils/gridHelpers.js';

export class GridRenderer {
  constructor(scene) {
    this.group = new THREE.Group();
    this.group.name = 'GridGroup';
    scene.add(this.group);

    this._createGridFrame();
    this._createVoidCoreMask();
  }

  _createGridFrame() {
    const spacing = CELL_SPACING;
    const offset = ((GRID_SIZE - 1) * spacing) / 2;
    const half = spacing / 2;
    const z = SYMBOL_PLANE_Z - 0.1; // slightly behind symbols

    // Grid boundaries: from first cell edge to last cell edge
    const minEdge = -offset - half;
    const maxEdge = offset + half;

    const vertices = [];

    // Horizontal lines (8 lines for 7 rows)
    for (let row = 0; row <= GRID_SIZE; row++) {
      const y = -(row * spacing - offset - half);
      vertices.push(minEdge, y, z);
      vertices.push(maxEdge, y, z);
    }

    // Vertical lines (8 lines for 7 cols)
    for (let col = 0; col <= GRID_SIZE; col++) {
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

  _createVoidCoreMask() {
    // Visual indicator for the 4 void core cells — subtle dark overlay
    const spacing = CELL_SPACING;
    const size = spacing * 2; // 2×2 cells

    const geometry = new THREE.PlaneGeometry(size, size);
    const material = new THREE.MeshBasicMaterial({
      color: COLORS.PURE_BLACK,
      transparent: true,
      opacity: 0.4,
      depthWrite: false,
    });

    this.voidCoreMask = new THREE.Mesh(geometry, material);
    // Center of the 4 void core cells (3,3), (3,4), (4,3), (4,4)
    // gridToWorld gives positions with row 0 at top
    const tl = gridToWorld(3, 3);
    const br = gridToWorld(4, 4);
    this.voidCoreMask.position.set(
      (tl.x + br.x) / 2,
      (tl.y + br.y) / 2,
      SYMBOL_PLANE_Z - 0.2
    );
    this.voidCoreMask.name = 'VoidCoreMask';
    this.group.add(this.voidCoreMask);
  }

  update(time, delta, meterLevel) {
    // Grid frame pulsing opacity
    const baseOpacity = 0.2 + meterLevel * 0.15;
    const pulse = Math.sin(time * 1.5) * 0.08;
    this.gridFrame.material.opacity = baseOpacity + pulse;

    // Grid brightens with meter
    if (meterLevel > 0.5) {
      const brighten = (meterLevel - 0.5) * 2; // 0-1 over 50-100%
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
