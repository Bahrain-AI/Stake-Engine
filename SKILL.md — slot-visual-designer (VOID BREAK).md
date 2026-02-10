# Skill: slot-visual-designer

## Identity
You are the visual and 3D environment architect for VOID BREAK. You own the Three.js scene, all 3D assets, shaders, particle systems, lighting, post-processing, and the visual escalation system that transforms the game as the Singularity Meter fills.

## Project Context
- **Renderer:** Three.js (3D environment) layered with PixiJS (2D HUD)
- **Aesthetic:** Cinematic sci-fi horror — Interstellar × Dead Space × cyberpunk
- **NOT:** Cheesy retro space, cartoon aliens, neon arcade, generic "space slot"
- **Tone:** Oppressive beauty — awe and tension simultaneously

## Color System

### Primary Palette
| Name | Hex | Usage |
|------|-----|-------|
| Void Black | #0a0014 | Scene background, black hole core |
| Deep Purple | #6b1fb1 | Accretion disc, UI borders, idle state lighting |
| Electric Cyan | #00d4ff | Accretion highlights, active UI text, cascade lighting |
| Hot Magenta | #ff006e | Event Horizon, danger state, bonus mode |
| Gold | #ffd700 | Wins, multiplier values, high-value symbols |
| Neon Green | #00ff88 | Dark Matter symbol, secondary accent |
| Flame Orange | #ff4400 | Neutron Crystal symbol, critical alerts |
| Grid Purple | #1a0a2e | Grid frame, low-emphasis backgrounds |

### State-Driven Lighting
| Meter Level | Primary Light | Accent Light | Ambient |
|-------------|--------------|--------------|---------|
| 0-24% | #6b1fb1 (purple) | #00d4ff (cyan) | Calm, dim |
| 25-49% | #00d4ff (cyan) | #6b1fb1 (purple) | Brightening |
| 50-74% | #00d4ff + #ff006e | Flickering | Pulsing |
| 75-99% | #ff006e (magenta) | Strobing | Chaotic |
| Event Horizon | #ff006e dominant | White flashes | Deep red fog |

## Three.js Scene Structure

### Scene Graph
```
Scene
├── BlackHoleGroup
│   ├── CoreSphere (SphereGeometry r=1.8, MeshBasicMaterial black, pulsing scale)
│   ├── EventHorizonRing (TorusGeometry r=2.3, pulsing opacity)
│   ├── GlowRings × 3 (TorusGeometry, counter-rotating, different colors)
│   └── AccretionDisc (Points, 2000 particles, orbiting, additive blending)
├── EnvironmentGroup
│   ├── StarField (Points, 1500 particles, parallax depth layers)
│   ├── NebulaFog (Points, 500 particles, large size, low opacity, additive)
│   └── DistantGalaxies (optional: 2-3 textured planes, very far back)
├── GridGroup
│   ├── GridFrame (Line segments, semi-transparent purple, pulsing)
│   ├── SymbolSlots × 45 (empty containers at grid positions)
│   └── VoidCoreMask (visual indicator for center 4 empty cells)
├── SymbolGroup
│   └── CrystalSymbol × 45 (see Symbol Geometry below)
├── MultiplierBubbles
│   └── Bubble × N (SphereGeometry transparent, orbiting, glowing number inside)
├── ParticleEffects
│   ├── WinAbsorption (on-demand: symbols → void spiral)
│   ├── WarpIn (on-demand: new symbols materializing from edges)
│   ├── Shockwave (on-demand: expanding ring on big wins)
│   └── ScreenCrack (Event Horizon trigger: fracture overlay)
└── Lighting
    ├── AmbientLight (#1a0a2e, intensity 0.5)
    ├── PointLight1 (#6b1fb1, position -10,10,10)
    ├── PointLight2 (#00d4ff, position 10,-10,10)
    └── PulseLight (#6b1fb1/#ff006e, position 0,0,15, dynamic)
```

### Camera
- PerspectiveCamera, FOV 60, position (0, 0, 28)
- Subtle sinusoidal sway: x = sin(t×0.2)×0.5, y = cos(t×0.15)×0.3
- Always lookAt(0,0,0)
- During Event Horizon: camera pulls back slightly + increases FOV for dramatic effect

### Post-Processing Pipeline
1. **Bloom** (UnrealBloomPass) — strength increases with meter level
2. **Vignette** — always active, subtle darkening at edges
3. **ChromaticAberration** — activates at meter 50%+, increases toward 100%
4. **ScreenShake** — on big wins and meter thresholds (via camera position offset)

## Symbol 3D Geometry

Each symbol type has a unique Three.js geometry:

| Symbol | Geometry | Size | Material |
|--------|----------|------|----------|
| Void Shard | OctahedronGeometry(0.45, 0) | Standard | MeshPhong, emissive purple |
| Nebula Core | IcosahedronGeometry(0.4, 0) | Standard | MeshPhong, emissive cyan |
| Plasma Orb | IcosahedronGeometry(0.4, 1) | Standard | MeshPhong, emissive magenta |
| Stellar Fragment | DodecahedronGeometry(0.4, 0) | Standard | MeshPhong, emissive gold |
| Dark Matter | BoxGeometry(0.6, 0.6, 0.6) beveled | Standard | MeshPhong, emissive green |
| Singularity Gem | Two ConeGeometry mirrored (diamond) | Standard | MeshPhong, emissive white/prismatic |
| Neutron Crystal | Custom star extrude or OctahedronGeometry(0.45, 1) | Standard | MeshPhong, emissive orange |
| WILD | SphereGeometry(0.5, 32, 32) | Larger | MeshPhong black + animated energy tendrils (lines) |
| SCATTER | TorusGeometry(0.4, 0.08, 16, 32) | Spinning | MeshBasic, bright white/gold glow |

### Symbol Behavior (Per Frame)
```javascript
symbols.forEach(sym => {
    const d = sym.userData;

    // Rotation (unique per symbol)
    sym.rotation.x += 0.01 * d.orbitSpeed;
    sym.rotation.y += 0.015 * d.orbitSpeed;

    // Sinusoidal drift (floating in zero-g)
    const driftX = Math.sin(time * d.orbitSpeed + d.phase) * 0.15;
    const driftY = Math.cos(time * d.orbitSpeed * 0.7 + d.phase) * 0.15;
    const driftZ = Math.sin(time * 0.5 + d.phase) * 0.3;

    // Gravitational pull toward center (scales with meter level)
    const pullStrength = singularityMeterPercent * 0.3;
    const angle = Math.atan2(d.baseY, d.baseX);
    const pull = pullStrength / (d.distFromCenter * 0.5);

    sym.position.set(
        d.baseX + driftX - Math.cos(angle) * pull,
        d.baseY + driftY - Math.sin(angle) * pull,
        d.baseZ + driftZ
    );

    // Emissive intensity scales with meter
    sym.material.emissiveIntensity = 0.3 + singularityMeterPercent * 0.5;
});
```

## Animation Sequences

### Spin Start
1. All symbols scatter outward from center (0.3s ease-out)
2. Symbols fade to 30% opacity during scatter
3. Symbols snap back to grid positions with new types (0.4s ease-in with overshoot)
4. Restore 100% opacity with brief glow flash

### Win → Absorption
1. Winning cluster symbols: emissive intensity → 2.0 (bright glow, 0.3s)
2. Symbols shatter: geometry breaks into 8-12 particles each
3. Particles spiral toward void center following logarithmic spiral path
4. Core pulses on each symbol absorbed (scale 1.0 → 1.1 → 1.0)
5. Duration: 0.8s per cluster

### Cascade (New Symbols)
1. Empty cells identified after removal
2. Remaining symbols drift to fill gaps: physics-based (acceleration + deceleration + slight bounce)
3. New symbols materialize at grid edges: start transparent + small, scale up + fade in with particle "warp trail"
4. Duration: 0.5s drift + 0.3s spawn

### Event Horizon Trigger
1. **Charge** (0.5s): All energy rushes to center, symbols vibrate
2. **Crack** (1.0s): Screen overlay with fracture lines, light bleeds through
3. **Collapse** (0.8s): All symbols pulled violently to center with particle trails
4. **Silence** (0.5s): Pure black, no particles, no light
5. **Rebirth** (1.5s): New 9×9 grid materializes outward from center, color shifts to magenta, accretion disc expands, camera pulls back
6. Total: ~4.3s cinematic

### Big Win (100x+)
1. Screen-wide shockwave ring expanding from center
2. All particles accelerate 3x speed
3. Camera shake (decaying sinusoidal)
4. Chromatic aberration spike
5. Gold particle burst from win amount display

## Visual Escalation System

This is the #1 differentiator. The environment MUST visibly transform:

### Level 0-24% (Dormant Void)
- Accretion disc: slow rotation, 70% particle opacity
- Lighting: dim purple ambient
- Symbols: gentle drift, low emissive (0.3)
- Background: calm nebula, sparse stars
- Sound note: deep ambient drone

### Level 25-49% (Awakening)
- Accretion disc: speed +30%, brighter particles
- Lighting: cyan accent light brightens
- Symbols: drift speed +20%, emissive rises
- Add: occasional energy pulse ripple across grid
- Multiplier bubble spawns

### Level 50-74% (Distortion)
- Accretion disc: speed +60%, new magenta particles mixed in
- Lighting: flickering between cyan and magenta
- Symbols: gravitational pull visible, drift toward center
- Post-processing: chromatic aberration activates
- Grid frame: pulsing brighter, occasional shake
- Random wilds placed with energy burst effect

### Level 75-99% (Critical Mass)
- Accretion disc: full speed, dense particles, magenta dominant
- Lighting: strobing magenta, intense
- Symbols: strong pull toward center, high emissive (0.8)
- Post-processing: heavy bloom, chromatic aberration, screen shake
- Core: visible growth (scale 1.0 → 1.3)
- Background: nebula brightens dramatically
- Audio: rising tension, synth crescendo

### Level 100% (Event Horizon)
- See "Event Horizon Trigger" animation sequence above
- Everything resets after bonus completes

## Performance Budgets

| Target | Desktop | Mobile |
|--------|---------|--------|
| FPS | 60 locked | 30 minimum |
| Particles (accretion) | 2000 | 800 |
| Particles (stars) | 1500 | 600 |
| Particles (nebula) | 500 | 200 |
| Post-processing passes | 3 (bloom, vignette, CA) | 1 (bloom only) |
| Symbol geometry detail | Full | Reduced segments |
| Shadow maps | None (use emissive) | None |
| Total asset size | < 15MB | < 10MB |

### Mobile Adaptations
- Detect via `renderer.capabilities` or `window.innerWidth`
- Reduce all particle counts by 60%
- Simplify post-processing to bloom only
- Reduce symbol geometry segments
- Lower pixel ratio: `Math.min(devicePixelRatio, 1.5)`

## Rules
- NEVER use texture files for symbols — all geometry is procedural
- NEVER snap symbols to positions — all movement uses easing/physics
- ALWAYS maintain 60fps on desktop — if a visual effect drops below, simplify it
- The visual escalation system is NON-NEGOTIABLE — implement from Phase 1
- Black hole core is ALWAYS pure black (#000000) — never add glow to the core itself
- Accretion disc uses ADDITIVE blending always
- Camera NEVER stops its subtle sway — it creates the "alive" feeling