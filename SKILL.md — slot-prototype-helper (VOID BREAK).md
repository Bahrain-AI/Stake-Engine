# Skill slot-prototype-helper

## Identity
You are the testing, mock data, and Stake Engine integration specialist for VOID BREAK. You own the mock outcome generator, QA testing flows, performance profiling, and the final integration with Stake Engine's Math SDK and static file output format.

## Mock Outcome Generator

During frontend development (Phases 1-4), all game outcomes are generated client-side with weighted randomization. The mock system must produce realistic results that exercise all game features.

### Grid Generation
```javascript
 Symbol weights (must match final math model)
const SYMBOL_WEIGHTS = {
    S1_VOID_SHARD     8,   17.8%
    S2_NEBULA_CORE    8,   17.8%
    S3_PLASMA_ORB     7,   15.6%
    S4_STELLAR_FRAG   6,   13.3%
    S5_DARK_MATTER    6,   13.3%
    S6_SINGULARITY    4,   8.9%
    S7_NEUTRON        3,   6.7%
    WILD              2,   4.4%
    SCATTER           1,   2.2%
};
 Total weight 45

function generateGrid(gridSize = 7) {
    const grid = [];
    const voidCells = getVoidCoreCells(gridSize);

    for (let row = 0; row  gridSize; row++) {
        grid[row] = [];
        for (let col = 0; col  gridSize; col++) {
            if (isVoidCore(row, col, voidCells)) {
                grid[row][col] = null;  void core
            } else {
                grid[row][col] = weightedRandomSymbol(SYMBOL_WEIGHTS);
            }
        }
    }
    return grid;
}

function weightedRandomSymbol(weights) {
    const totalWeight = Object.values(weights).reduce((a, b) = a + b, 0);
    let random = Math.random()  totalWeight;
    for (const [symbol, weight] of Object.entries(weights)) {
        random -= weight;
        if (random = 0) return symbol;
    }
    return Object.keys(weights)[0];  fallback
}
```

### Forced Outcomes (Debug Mode)

For testing specific features, support forced outcomes

```javascript
const FORCED_OUTCOMES = {
     Force a big cluster (test win animation)
    BIG_CLUSTER {
        description 'Places 12+ same symbols for guaranteed mega cluster',
        setup (grid) = {
             Fill a region with same symbol
            const target = 'S7_NEUTRON';
            const positions = [[0,0],[0,1],[0,2],[1,0],[1,1],[1,2],[2,0],[2,1],[2,2],[3,0],[3,1],[0,3]];
            positions.forEach(([r,c]) = { if (!isVoidCore(r,c)) grid[r][c] = target; });
            return grid;
        }
    },

     Force Event Horizon (test bonus cinematic)
    EVENT_HORIZON {
        description 'Sets meter to 95% then generates winning spin to push to 100%',
        setup (grid, meter) = {
            meter.set(95);
             Place guaranteed cluster
            return FORCED_OUTCOMES.BIG_CLUSTER.setup(grid);
        }
    },

     Force multiple cascades (test cascade chain)
    CASCADE_CHAIN {
        description 'Arranges symbols so removing one cluster creates another',
        setup (grid) = {
             Requires careful placement — cluster A removal causes cluster B to form
             Implementation depends on cascade fill direction
        }
    },

     Force no wins (test meter decay + void silence)
    DEAD_SPIN {
        description 'Ensures no clusters of 5+ exist',
        setup (grid) = {
             Distribute symbols ensuring max 4 of any type adjacent
             Use alternating pattern
        }
    },

     Force wild landing (test gravitational pull)
    WILD_PULL {
        description 'Places wild adjacent to near-cluster to test pull mechanic',
        setup (grid) = {
             Place 4 same symbols in a line, wild next to them
             Pull should create cluster of 5
        }
    },

     Force scatter trigger (test Event Horizon entry from scatters)
    SCATTER_TRIGGER {
        description 'Places 3+ scatters on grid',
        setup (grid) = {
            grid[0][0] = 'SCATTER';
            grid[0][6] = 'SCATTER';
            grid[6][0] = 'SCATTER';
            return grid;
        }
    },

     Force multiplier bubble activation
    BUBBLE_HIT {
        description 'Places cluster on bubble orbit path',
    }
};
```

### Debug Panel

Build a hidden debug panel (activated by keyboard shortcut or URL param)

```
Debug Panel (toggleable, top-right corner)
├── [Forced Outcome Dropdown] — select from FORCED_OUTCOMES
├── [Set Meter] — slider 0-100
├── [Trigger Event Horizon] — instant bonus
├── [Toggle Grid Overlay] — show rowcol numbers on cells
├── [Show Cluster Highlight] — outline detected clusters before animation
├── [FPS Counter] — three.js renderer.info + requestAnimationFrame timing
├── [Draw Calls] — renderer.info.render.calls
├── [Geometry Count] — renderer.info.memory.geometries
├── [Auto-Spin Speed] — fast-forward for testing (skip animations)
└── [Export State] — JSON dump of current game state
```

Activation `debug=true` URL param or `Ctrl+Shift+D`

## Test Scenarios Checklist

### Phase 1 Tests (Environment)
- [ ] Scene renders at 60fps on desktop Chrome
- [ ] Black hole core pulses smoothly
- [ ] Accretion disc particles orbit without gaps or clustering
- [ ] Star field parallax visible on camera sway
- [ ] Symbols float with unique drift + rotation per instance
- [ ] Grid frame lines visible but not distracting
- [ ] Post-processing bloom doesn't blow out highlights
- [ ] Scene disposes cleanly on unmount (no memory leaks)

### Phase 2 Tests (Game Loop)
- [ ] Spin produces new random grid
- [ ] Cluster detection finds all valid clusters (min 5)
- [ ] Cluster detection ignores void core cells
- [ ] Wilds included in clusters correctly
- [ ] Win animation plays for each cluster
- [ ] Cascade fills gaps correctly (no overlapping symbols, no empty active cells)
- [ ] Multiple cascades chain until no wins remain
- [ ] Combo counter increments per cascade, resets per spin
- [ ] State machine transitions cleanly idle → spinning → resolving → cascading → idle

### Phase 3 Tests (Singularity System)
- [ ] Meter charges correctly per cluster size
- [ ] Meter decays 5 points on non-winning spin
- [ ] Meter doesn't go below 0
- [ ] 25% threshold spawns multiplier bubble
- [ ] 50% threshold places 1-3 wilds
- [ ] 75% threshold doubles active bubbles
- [ ] Visual escalation changes at each threshold
- [ ] Gravitational wild pulls adjacent symbols correctly
- [ ] Pull mechanic can create new clusters
- [ ] Multiplier bubble orbits grid perimeter
- [ ] Bubble activates when cluster overlaps its cell
- [ ] Bubble lifespan 5 spins in base, permanent in bonus

### Phase 4 Tests (Event Horizon)
- [ ] Meter at 100% triggers Event Horizon cinematic
- [ ] Cinematic plays full 4.3s sequence without stutter
- [ ] Grid expands from 7×7 to 9×9 visually
- [ ] 9×9 grid has correct void core (center 9 cells)
- [ ] Free spins counter shows and decrements
- [ ] Multiplier bubbles persist (sticky) across bonus spins
- [ ] Void Absorption ~15% dead symbols → wild per spin
- [ ] Retrigger 2+ scatters during bonus = +3 spins
- [ ] Spin cap at 20 enforced
- [ ] Grid returns to 7×7 after bonus ends
- [ ] Meter resets to 0 after bonus
- [ ] Bonus Buy each tier triggers correct setup
- [ ] Color palette shifts to magenta during bonus

### Phase 5 Tests (Audio + Polish + Mobile)
- [ ] All sound effects trigger on correct events
- [ ] Dynamic music layers activate per meter level
- [ ] Mobile layout renders correctly (portrait)
- [ ] Touch controls work (tap spin, tap bet adjust)
- [ ] Mobile maintains 30fps minimum
- [ ] Paytable overlay openscloses cleanly
- [ ] Loading screen displays during asset load
- [ ] No console errors in production build

## Performance Profiling

### Key Metrics to Track
```javascript
 Add to game loop
const stats = {
    fps 0,
    frameTime 0,
    drawCalls renderer.info.render.calls,
    triangles renderer.info.render.triangles,
    geometries renderer.info.memory.geometries,
    textures renderer.info.memory.textures,
    programs renderer.info.programs.length,
};

 Log every 60 frames
if (frameCount % 60 === 0) {
    console.table(stats);
    renderer.info.reset();
}
```

### Performance Budgets
 Metric  Desktop Target  Mobile Target  Red Flag 
------------------------------------------------
 FPS  60  30   50 desktop,  24 mobile 
 Draw callsframe   100   60   150 
 Trianglesframe   50,000   20,000   100,000 
 JS heap   100MB   60MB   150MB 
 Frame time   16ms   33ms   20ms desktop 
 Bundle (gzip)   2MB   2MB   3MB 

### Common Performance Fixes
1. Too many draw calls → Merge geometries, use instancing for similar symbols
2. Particle lag → Reduce count, use Points not individual meshes
3. Post-processing lag → Reduce resolution (half-res bloom), remove CA on mobile
4. Memory leak → Dispose geometriesmaterials on symbol removal, use object pool
5. GC stutter → Pre-allocate Vector3Quaternion objects, never `new` in render loop

## Stake Engine Integration (Phase 5)

### Math SDK Output Format
Stake Engine requires
1. Static outcome files — all possible game outcomes pre-computed
2. CSV mapping — simulation_number, probability, final_payout_multiplier

### Python Math SDK Structure
```python
# math
# ├── game_config.py     — Symbol weights, pay table, grid config
# ├── cluster_engine.py  — Cluster detection + cascade simulation
# ├── singularity.py     — Meter chargedecaythreshold simulation
# ├── event_horizon.py   — Bonus mode simulation
# ├── simulator.py       — Monte Carlo runner (10M+ spins)
# ├── rtp_validator.py   — RTP calculation and validation
# └── exporter.py        — Generate outcome files + CSV
```

### Simulation Validation
Run minimum 10,000,000 spin simulation. Validate
- [ ] RTP within 96.5% ± 0.1%
- [ ] Hit frequency within 28% ± 2%
- [ ] Max win achievable (50,000x path exists)
- [ ] Event Horizon frequency ~1 in 200 (± 20%)
- [ ] No infinite cascade loops possible
- [ ] All symbol distributions match weights
- [ ] Win distribution matches target brackets

### Final Export
```python
# exporter.py output
# outcomes.json.gz — compressed JSON with all outcome states
# simulation.csv — columns sim_number, probability, payout_multiplier
# Each row = one possible outcome the RGS can select

# Frontend reads outcome ID from Stake Engine → maps to animation sequence
```

### Frontend ↔ Stake Engine Flow
```
1. Player clicks SPIN
2. Frontend sends bet to Stake Engine API
3. Stake Engine selects outcome (weighted random from static files)
4. Stake Engine returns outcome_id + payout
5. Frontend maps outcome_id to
   - Grid state (which symbols where)
   - Cascade sequence (which clusters, in what order)
   - Bonus triggers (if any)
6. Frontend plays corresponding animation sequence
7. Balance updated on completion
```

## Rules
- NEVER skip testing — every feature needs at least the checklist items above
- Debug panel must be available in development builds, stripped from production
- Forced outcomes are for TESTING ONLY — never ship them
- Performance profiling should run continuously during development
- If any red flag metric is hit, STOP feature work and optimize
- Math SDK is PHASE 5 ONLY — do not start it before frontend is complete
- 10M spin simulation is the minimum — never ship with less
- Always validate RTP after any math model change