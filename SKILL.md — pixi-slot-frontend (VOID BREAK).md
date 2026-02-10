# Skill: pixi-slot-frontend

## Identity
You are the frontend rendering architect for VOID BREAK. You own the hybrid Three.js + PixiJS + React application structure, the rendering pipeline, animation sequencing, and all integration between the 3D scene, 2D HUD, and React state management.

## Project Context
- **Framework:** React (Vite)
- **3D Engine:** Three.js (r128 compatible, no external addons — no OrbitControls, no CapsuleGeometry)
- **2D Overlay:** PixiJS for HUD elements
- **State:** React hooks (useState, useReducer, useRef)
- **Audio:** Tone.js or Web Audio API
- **Build:** Vite → static files for Stake Engine upload

## Project Structure

```
void-break/
├── public/
│   └── audio/                    # Sound files (mp3/ogg)
├── src/
│   ├── main.jsx                  # React entry point
│   ├── App.jsx                   # Root component, manages game state
│   ├── engine/
│   │   ├── GameStateMachine.js   # State transitions: idle→spinning→resolving→cascading→win→idle
│   │   ├── ClusterDetector.js    # Flood-fill cluster algorithm
│   │   ├── CascadeResolver.js   # Cascade logic: remove → settle → spawn → re-check
│   │   ├── SingularityMeter.js  # Meter charge/decay/threshold logic
│   │   ├── MultiplierSystem.js  # Bubble spawn, orbit, activation, lifespan
│   │   ├── MockOutcomeGen.js    # Random outcome generator for frontend dev
│   │   └── PayCalculator.js     # Win amount calculation from clusters + multipliers
│   ├── scene/
│   │   ├── SceneManager.js      # Three.js scene setup, camera, renderer, post-processing
│   │   ├── BlackHole.js         # Core sphere, glow rings, accretion disc, event horizon ring
│   │   ├── SymbolManager.js     # Create/update/remove 3D crystal symbols on grid
│   │   ├── ParticleEffects.js   # Win absorption, warp-in, shockwave, screen crack
│   │   ├── Environment.js       # Star field, nebula fog, distant background
│   │   ├── GridRenderer.js      # Grid frame lines, void core mask
│   │   ├── LightingSystem.js    # Dynamic lights that shift with game state
│   │   └── VisualEscalation.js  # Orchestrates environment changes per meter level
│   ├── hud/
│   │   ├── HUDManager.js        # PixiJS overlay setup and render loop
│   │   ├── SingularityBar.js    # Vertical meter bar (left side)
│   │   ├── ComboCounter.js      # Cascade combo display (right side)
│   │   ├── BetControls.js       # Bet amount, spin button, auto-spin
│   │   ├── WinDisplay.js        # Current win amount + big win celebration
│   │   ├── BonusBuyPanel.js     # 3-tier bonus buy selection
│   │   └── Paytable.js          # Symbol info overlay
│   ├── animation/
│   │   ├── AnimationSequencer.js # Queues and plays animation chains
│   │   ├── SpinAnimation.js     # Symbol scatter-out + snap-back
│   │   ├── WinAnimation.js      # Glow → shatter → absorb spiral
│   │   ├── CascadeAnimation.js  # Drift-settle + warp-in spawn
│   │   ├── EventHorizonCine.js  # Full 4.3s cinematic sequence
│   │   └── Easings.js           # Custom easing functions
│   ├── audio/
│   │   ├── AudioController.js   # Master audio, dynamic music layers
│   │   └── SFXMap.js            # Sound effect mappings per game event
│   ├── hooks/
│   │   ├── useGameState.js      # Core game state reducer
│   │   ├── useThreeScene.js     # Three.js lifecycle (init, animate, dispose)
│   │   └── useResponsive.js     # Viewport detection, mobile/desktop mode
│   └── utils/
│       ├── constants.js          # All magic numbers, colors, grid config
│       ├── gridHelpers.js        # Grid coordinate ↔ world position conversion
│       └── mathHelpers.js        # Lerp, clamp, random range, easing math
├── .claude/
│   └── skills/                   # These skill files
├── package.json
├── vite.config.js
└── index.html
```

## Rendering Pipeline

### Frame Loop Architecture
```javascript
// Single requestAnimationFrame drives everything
function gameLoop(timestamp) {
    const delta = timestamp - lastTime;
    lastTime = timestamp;

    // 1. Update game logic (state machine, meter decay, bubble orbits)
    engine.update(delta);

    // 2. Update 3D scene (symbol positions, particles, lighting, post-fx)
    sceneManager.update(delta, gameState);

    // 3. Run pending animations
    animationSequencer.update(delta);

    // 4. Render Three.js scene
    sceneManager.render();

    // 5. Render PixiJS HUD overlay
    hudManager.render();

    requestAnimationFrame(gameLoop);
}
```

### Three.js ↔ React Integration Pattern
```javascript
// useThreeScene hook pattern
function useThreeScene(containerRef) {
    const sceneRef = useRef(null);

    useEffect(() => {
        const container = containerRef.current;
        const scene = new SceneManager(container);
        sceneRef.current = scene;
        scene.start();

        return () => scene.dispose(); // ALWAYS clean up
    }, []);

    return sceneRef;
}

// In component — communicate via imperative methods, not props
function GameCanvas({ gameState }) {
    const containerRef = useRef(null);
    const scene = useThreeScene(containerRef);

    useEffect(() => {
        if (scene.current) {
            scene.current.onGameStateChange(gameState);
        }
    }, [gameState]);

    return <div ref={containerRef} style={{ width: '100%', height: '100vh' }} />;
}
```

### PixiJS HUD Overlay Pattern
```javascript
// HUD renders on top of Three.js canvas using absolute positioning
// Option A: Separate canvas element positioned over Three.js
// Option B: HTML/CSS overlay (simpler, sufficient for text-heavy HUD)
// 
// RECOMMENDED: Option B (HTML/CSS overlay managed by React)
// Reason: VOID BREAK's HUD is mostly text, meters, and buttons
// PixiJS only needed if adding animated HUD elements (scanlines, glitch effects)
```

## Animation Sequencer Pattern

Animations must be chainable and non-blocking:

```javascript
class AnimationSequencer {
    queue = [];
    active = [];

    // Add animation to queue
    enqueue(animation) {
        this.queue.push(animation);
    }

    // Play next in queue
    playNext() {
        if (this.queue.length === 0) return;
        const anim = this.queue.shift();
        this.active.push(anim);
        anim.start();
        anim.onComplete(() => {
            this.active = this.active.filter(a => a !== anim);
            this.playNext();
        });
    }

    // Play all simultaneously
    playParallel(animations) {
        animations.forEach(a => {
            this.active.push(a);
            a.start();
        });
    }

    update(delta) {
        this.active.forEach(a => a.update(delta));
    }
}
```

### Spin Resolution Flow
```
1. User clicks SPIN
2. → SpinAnimation.play() (scatter out + snap back, 0.8s)
3. → ClusterDetector.findClusters(grid)
4. → If clusters found:
       a. WinAnimation.play(clusters) (glow + shatter + absorb, 0.8s)
       b. CascadeAnimation.play() (drift + spawn, 0.5s)
       c. → Go to step 3 (re-check for new clusters)
5. → If no clusters: SingularityMeter.decay() → display total win → IDLE
6. → If meter hits threshold: play threshold effect → continue
7. → If meter = 100%: EventHorizonCine.play() → enter bonus mode
```

## Grid Coordinate System

```javascript
// Grid config
const GRID_SIZE = 7; // or 9 during Event Horizon
const CELL_SPACING = 2.2;
const VOID_CORE_CELLS = [[3,3], [3,4], [4,3], [4,4]]; // 7×7
const VOID_CORE_9x9 = [[3,3],[3,4],[3,5],[4,3],[4,4],[4,5],[5,3],[5,4],[5,5]]; // 9×9

// Grid position (row, col) → world position (x, y, z)
function gridToWorld(row, col, gridSize = 7) {
    const offset = ((gridSize - 1) * CELL_SPACING) / 2;
    return {
        x: col * CELL_SPACING - offset,
        y: row * CELL_SPACING - offset,
        z: 2 // symbol plane
    };
}

// Check if cell is void core
function isVoidCore(row, col, gridSize = 7) {
    const cores = gridSize === 7 ? VOID_CORE_CELLS : VOID_CORE_9x9;
    return cores.some(([r, c]) => r === row && c === col);
}
```

## Key Dependencies

```json
{
    "dependencies": {
        "react": "^18.x",
        "react-dom": "^18.x",
        "three": "^0.128.0",
        "tone": "^14.x"
    },
    "devDependencies": {
        "vite": "^5.x",
        "@vitejs/plugin-react": "^4.x"
    }
}
```

**No other 3D libraries.** No @react-three/fiber, no drei, no cannon.js. Raw Three.js for full control and minimal bundle.

## Performance Rules
- Object pool symbols — never create/destroy Three.js meshes per spin, reuse them
- Use `BufferGeometry` for all custom geometry
- Particle systems use single `Points` object, not individual meshes
- Dispose all materials, geometries, textures on cleanup
- Use `renderer.info` to monitor draw calls (target: < 100 per frame)
- Batch similar materials where possible
- Never allocate in the render loop — pre-allocate vectors, quaternions, etc.

## Stake Engine Build Output
Final build must produce static files:
```
dist/
├── index.html
├── assets/
│   ├── main.[hash].js
│   ├── main.[hash].css
│   └── audio/
└── game-data/       # Outcome files from Math SDK (Phase 5)
    ├── outcomes.json.gz
    └── simulation.csv
```

## Rules
- NEVER use React state for per-frame animation — use refs and imperative Three.js updates
- NEVER render Three.js via React reconciler (no R3F) — direct scene graph manipulation only
- ALWAYS dispose Three.js resources on unmount (geometries, materials, textures, render targets)
- ALWAYS separate game logic (engine/) from rendering (scene/) from UI (hud/)
- Mock data first — the entire game must be playable with random outcomes before Math SDK integration
- Bundle size target: < 2MB JS (gzipped), < 15MB total with audio