import * as THREE from 'three';
import { SYMBOL_TYPES, SYMBOL_KEYS, TOTAL_SYMBOL_WEIGHT, COLORS, GRID_SIZE, GRID_SIZE_BONUS } from '../utils/constants.js';
import { getActiveCells, distanceFromCenter, gridToWorld } from '../utils/gridHelpers.js';
import { randomRange, weightedRandom } from '../utils/mathHelpers.js';

// Pre-built geometry cache — created once, shared across all symbols
const geometryCache = {};

function getOrCreateGeometry(symbolType) {
  if (geometryCache[symbolType.id]) return geometryCache[symbolType.id];

  let geo;
  switch (symbolType.geometry) {
    case 'octahedron':
      geo = new THREE.OctahedronGeometry(symbolType.radius, symbolType.detail);
      break;
    case 'icosahedron':
      geo = new THREE.IcosahedronGeometry(symbolType.radius, symbolType.detail);
      break;
    case 'dodecahedron':
      geo = new THREE.DodecahedronGeometry(symbolType.radius, symbolType.detail);
      break;
    case 'box':
      geo = new THREE.BoxGeometry(symbolType.radius, symbolType.radius, symbolType.radius);
      break;
    case 'diamond': {
      // Two cones mirrored to create diamond shape
      const coneGeo = new THREE.ConeGeometry(symbolType.radius * 0.6, symbolType.radius, 8);
      const coneGeo2 = new THREE.ConeGeometry(symbolType.radius * 0.6, symbolType.radius, 8);
      // Flip the second cone
      coneGeo2.rotateX(Math.PI);
      coneGeo2.translate(0, -symbolType.radius * 0.5, 0);
      coneGeo.translate(0, symbolType.radius * 0.5, 0);
      // Merge into one
      geo = coneGeo;
      // We'll use a group approach instead — simpler: just use a single cone pair
      // Actually, let's build it properly with merged geometry
      const merged = new THREE.BufferGeometry();
      const positions1 = coneGeo.attributes.position.array;
      const positions2 = coneGeo2.attributes.position.array;
      const normals1 = coneGeo.attributes.normal.array;
      const normals2 = coneGeo2.attributes.normal.array;

      const mergedPositions = new Float32Array(positions1.length + positions2.length);
      mergedPositions.set(positions1, 0);
      mergedPositions.set(positions2, positions1.length);

      const mergedNormals = new Float32Array(normals1.length + normals2.length);
      mergedNormals.set(normals1, 0);
      mergedNormals.set(normals2, normals1.length);

      merged.setAttribute('position', new THREE.BufferAttribute(mergedPositions, 3));
      merged.setAttribute('normal', new THREE.BufferAttribute(mergedNormals, 3));

      // Merge indices
      const idx1 = coneGeo.index.array;
      const idx2 = coneGeo2.index.array;
      const vertexOffset = positions1.length / 3;
      const mergedIndices = new Uint16Array(idx1.length + idx2.length);
      mergedIndices.set(idx1, 0);
      for (let i = 0; i < idx2.length; i++) {
        mergedIndices[idx1.length + i] = idx2[i] + vertexOffset;
      }
      merged.setIndex(new THREE.BufferAttribute(mergedIndices, 1));

      coneGeo.dispose();
      coneGeo2.dispose();
      geo = merged;
      break;
    }
    case 'octahedron_detail':
      geo = new THREE.OctahedronGeometry(symbolType.radius, symbolType.detail);
      break;
    case 'sphere':
      geo = new THREE.SphereGeometry(symbolType.radius, 32, 32);
      break;
    case 'torus':
      geo = new THREE.TorusGeometry(symbolType.radius, 0.08, 16, 32);
      break;
    default:
      geo = new THREE.OctahedronGeometry(0.4, 0);
  }

  geometryCache[symbolType.id] = geo;
  return geo;
}

function createMaterial(symbolType) {
  if (symbolType.id === 'SCATTER') {
    return new THREE.MeshBasicMaterial({
      color: symbolType.color,
      transparent: true,
      opacity: 0.9,
    });
  }

  if (symbolType.id === 'WILD') {
    return new THREE.MeshPhongMaterial({
      color: COLORS.PURE_BLACK,
      emissive: symbolType.emissive,
      emissiveIntensity: 0.5,
      shininess: 80,
      transparent: true,
      opacity: 0.9,
    });
  }

  return new THREE.MeshPhongMaterial({
    color: symbolType.color,
    emissive: symbolType.emissive,
    emissiveIntensity: 0.3,
    shininess: 60,
    transparent: true,
    opacity: 0.9,
  });
}

function pickRandomSymbol() {
  const weights = {};
  for (const key of SYMBOL_KEYS) {
    weights[key] = SYMBOL_TYPES[key].weight;
  }
  return weightedRandom(weights);
}

export class SymbolManager {
  constructor(scene) {
    this.group = new THREE.Group();
    this.group.name = 'SymbolGroup';
    scene.add(this.group);

    this.symbols = []; // array of THREE.Mesh references
    this.activeCells = getActiveCells();
    this.animating = false; // true during animations — skips drift update
    this._cellMap = new Map(); // "row,col" → mesh

    this._createSymbolPool();
    this.rebuildCellMap();
  }

  /** Rebuild the cell→mesh lookup map */
  rebuildCellMap() {
    this._cellMap.clear();
    for (const sym of this.symbols) {
      this._cellMap.set(`${sym.userData.row},${sym.userData.col}`, sym);
    }
  }

  /** Get mesh at specific grid position */
  getMeshAt(row, col) {
    return this._cellMap.get(`${row},${col}`) || null;
  }

  /** Get current grid state as 2D array */
  getGridState(gridSize = 7) {
    const grid = [];
    for (let r = 0; r < gridSize; r++) {
      grid[r] = [];
      for (let c = 0; c < gridSize; c++) {
        const mesh = this.getMeshAt(r, c);
        grid[r][c] = mesh ? mesh.userData.symbolKey : null;
      }
    }
    return grid;
  }

  /** Apply a full grid state to the symbol pool (for spin results) */
  applyGrid(grid) {
    for (const sym of this.symbols) {
      const d = sym.userData;
      const newKey = grid[d.row]?.[d.col];
      if (newKey && newKey !== d.symbolKey) {
        this.reassignSymbol(sym, newKey);
      }
      sym.visible = true;
      sym.scale.set(1, 1, 1);
      sym.material.opacity = 0.9;
    }
    this.rebuildCellMap();
  }

  _createSymbolPool() {
    for (let i = 0; i < this.activeCells.length; i++) {
      const cell = this.activeCells[i];
      const symbolKey = pickRandomSymbol();
      const symbolType = SYMBOL_TYPES[symbolKey];

      const geometry = getOrCreateGeometry(symbolType);
      const material = createMaterial(symbolType);
      const mesh = new THREE.Mesh(geometry, material);

      // Store per-symbol animation data
      const dist = distanceFromCenter(cell.worldX, cell.worldY);
      mesh.userData = {
        symbolKey,
        row: cell.row,
        col: cell.col,
        baseX: cell.worldX,
        baseY: cell.worldY,
        baseZ: cell.worldZ,
        distFromCenter: dist || 1, // avoid div by zero
        orbitSpeed: randomRange(0.5, 1.5),
        phase: randomRange(0, Math.PI * 2),
      };

      mesh.position.set(cell.worldX, cell.worldY, cell.worldZ);
      this.group.add(mesh);
      this.symbols.push(mesh);
    }
  }

  /**
   * Reassign a symbol mesh to a new symbol type (for spins/cascades).
   */
  reassignSymbol(mesh, newSymbolKey) {
    const symbolType = SYMBOL_TYPES[newSymbolKey];
    const newGeo = getOrCreateGeometry(symbolType);

    if (mesh.geometry !== newGeo) {
      mesh.geometry = newGeo;
    }

    // Replace material entirely to avoid MeshBasic↔MeshPhong issues
    const oldMat = mesh.material;
    mesh.material = createMaterial(symbolType);
    oldMat.dispose();

    mesh.userData.symbolKey = newSymbolKey;
  }

  /** Current grid size (7 or 9) */
  get gridSize() {
    return this._gridSize || GRID_SIZE;
  }

  /**
   * Expand symbol pool from 7×7 to 9×9.
   * Creates new meshes for the additional cells.
   */
  expandTo9x9() {
    this._gridSize = GRID_SIZE_BONUS;
    const newCells = getActiveCells(GRID_SIZE_BONUS);

    // Find cells not already in current pool
    const existingKeys = new Set(this.symbols.map((s) => `${s.userData.row},${s.userData.col}`));

    for (const cell of newCells) {
      const key = `${cell.row},${cell.col}`;
      if (existingKeys.has(key)) {
        // Update base positions for existing symbols (grid offset changes with size)
        const mesh = this._cellMap.get(key);
        if (mesh) {
          mesh.userData.baseX = cell.worldX;
          mesh.userData.baseY = cell.worldY;
          mesh.userData.baseZ = cell.worldZ;
          mesh.position.set(cell.worldX, cell.worldY, cell.worldZ);
        }
        continue;
      }

      // Create new symbol mesh
      const symbolKey = pickRandomSymbol();
      const symbolType = SYMBOL_TYPES[symbolKey];
      const geometry = getOrCreateGeometry(symbolType);
      const material = createMaterial(symbolType);
      const mesh = new THREE.Mesh(geometry, material);

      const dist = distanceFromCenter(cell.worldX, cell.worldY);
      mesh.userData = {
        symbolKey,
        row: cell.row,
        col: cell.col,
        baseX: cell.worldX,
        baseY: cell.worldY,
        baseZ: cell.worldZ,
        distFromCenter: dist || 1,
        orbitSpeed: randomRange(0.5, 1.5),
        phase: randomRange(0, Math.PI * 2),
      };

      mesh.position.set(cell.worldX, cell.worldY, cell.worldZ);
      this.group.add(mesh);
      this.symbols.push(mesh);
    }

    this.activeCells = newCells;
    this.rebuildCellMap();
  }

  /**
   * Contract symbol pool from 9×9 back to 7×7.
   * Removes meshes for cells outside the 7×7 grid.
   */
  contractTo7x7() {
    this._gridSize = GRID_SIZE;
    const validCells = new Set(
      getActiveCells(GRID_SIZE).map((c) => `${c.row},${c.col}`)
    );

    // Remove symbols not in 7×7
    for (let i = this.symbols.length - 1; i >= 0; i--) {
      const sym = this.symbols[i];
      const key = `${sym.userData.row},${sym.userData.col}`;
      if (!validCells.has(key)) {
        sym.material.dispose();
        this.group.remove(sym);
        this.symbols.splice(i, 1);
      }
    }

    // Update base positions (grid offset changes back)
    const cells7x7 = getActiveCells(GRID_SIZE);
    for (const cell of cells7x7) {
      const mesh = this._cellMap.get(`${cell.row},${cell.col}`);
      if (mesh) {
        mesh.userData.baseX = cell.worldX;
        mesh.userData.baseY = cell.worldY;
        mesh.userData.baseZ = cell.worldZ;
        mesh.position.set(cell.worldX, cell.worldY, cell.worldZ);
      }
    }

    this.activeCells = cells7x7;
    this.rebuildCellMap();
  }

  update(time, delta, meterLevel) {
    // Skip drift when animations are controlling positions
    if (this.animating) return;

    for (let i = 0; i < this.symbols.length; i++) {
      const sym = this.symbols[i];
      if (!sym.visible) continue;
      const d = sym.userData;

      // Rotation (unique per symbol)
      sym.rotation.x += 0.01 * d.orbitSpeed * delta * 60;
      sym.rotation.y += 0.015 * d.orbitSpeed * delta * 60;

      // Sinusoidal drift (floating in zero-g)
      const driftX = Math.sin(time * d.orbitSpeed + d.phase) * 0.15;
      const driftY = Math.cos(time * d.orbitSpeed * 0.7 + d.phase) * 0.15;
      const driftZ = Math.sin(time * 0.5 + d.phase) * 0.3;

      // Gravitational pull toward center (scales with meter level)
      const pullStrength = meterLevel * 0.3;
      const angle = Math.atan2(d.baseY, d.baseX);
      const pull = d.distFromCenter > 0.5 ? pullStrength / (d.distFromCenter * 0.5) : 0;

      sym.position.x = d.baseX + driftX - Math.cos(angle) * pull;
      sym.position.y = d.baseY + driftY - Math.sin(angle) * pull;
      sym.position.z = d.baseZ + driftZ;

      // Emissive intensity scales with meter
      if (sym.material.emissive) {
        sym.material.emissiveIntensity = 0.3 + meterLevel * 0.5;
      }
    }
  }

  dispose() {
    // Dispose materials (geometries are shared/cached)
    for (const sym of this.symbols) {
      sym.material.dispose();
    }

    // Dispose cached geometries
    for (const key of Object.keys(geometryCache)) {
      geometryCache[key].dispose();
      delete geometryCache[key];
    }

    this.group.parent?.remove(this.group);
  }
}
