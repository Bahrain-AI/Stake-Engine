# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**VOID BREAK** — a gravitational slot game built for Stake Engine. Cinematic sci-fi aesthetic (Interstellar × Dead Space × cyberpunk). 7×7 grid with a black hole at center, cascade mechanics, and a Singularity Meter that visually transforms the entire environment.

## Tech Stack

- **Framework:** React 18 (Vite)
- **3D Engine:** Three.js r128 — raw, no R3F/drei/OrbitControls
- **Audio:** Tone.js / Web Audio API
- **HUD:** HTML/CSS managed by React (not PixiJS unless animated HUD elements needed)
- **Build:** Vite → static files for Stake Engine upload

## Build & Dev Commands

```bash
npm install
npm run dev          # Vite dev server
npm run build        # Production build → dist/
npm run preview      # Preview production build
```

No test runner or linter is configured. There are no test files.

## Architecture

### Rendering Pipeline

Single `requestAnimationFrame` loop drives everything sequentially:
1. Engine update (state machine, meter decay, bubble orbits)
2. Scene update (symbol positions, particles, lighting, post-fx)
3. Animation sequencer update
4. Three.js render
5. HUD render

**Three.js ↔ React integration:** Imperative scene updates via refs. Never re-render 3D through React props. The `useThreeScene` hook manages lifecycle (init, animate, dispose).

### Directory Layout (target)

- `src/engine/` — Game logic: state machine, cluster detection, cascade resolver, meter, multipliers, mock outcomes, pay calculator
- `src/scene/` — Three.js: scene manager, black hole, symbols, particles, environment, grid, lighting, visual escalation
- `src/hud/` — React HTML/CSS overlay: meter bar, combo counter, bet controls, win display
- `src/animation/` — Animation sequencer, spin/win/cascade/cinematic animations, easings
- `src/audio/` — Audio controller, SFX mappings
- `src/hooks/` — `useGameState`, `useThreeScene`, `useResponsive`
- `src/utils/` — Constants, grid helpers (`gridToWorld`), math helpers
- `docs/` — Stake Engine RGS API and Math SDK integration docs (reference for backend wiring)

### Key Concepts

**Grid:** 7×7 (expands to 9×9 during Event Horizon bonus). Center 4 cells `[[3,3],[3,4],[4,3],[4,4]]` are the void core (always empty). 45 active symbol positions. Cell spacing = 2.2 world units. Symbol plane at z=2.

**Visual Escalation:** Environment transforms based on Singularity Meter level (0-100%). Lighting colors, particle speeds, bloom strength, symbol emissive intensity, and gravitational pull all scale with meter. This is wired up from Phase 1 even before the meter itself is implemented.

**State Machine:** `IDLE → SPINNING → RESOLVING → CASCADING → WIN_DISPLAY → IDLE` (also `EVENT_HORIZON`, `BONUS_ACTIVE`). Full constants and numeric values (pay tables, bet levels, animation durations, particle counts) are in `src/utils/constants.js` — always check there before hardcoding values.

## Critical Rules

- **No texture files** — all symbol geometry is procedural (OctahedronGeometry, IcosahedronGeometry, etc.)
- **Object pool symbols** — never create/destroy meshes per spin, reuse them
- **No allocations in render loop** — pre-allocate all Vector3, Quaternion, etc.
- **Dispose everything on unmount** — geometries, materials, textures, render targets
- **Particle systems use single `Points` object** — not individual meshes
- **Accretion disc always uses additive blending**
- **Black hole core is always pure black (#000000)** — never add glow to the core itself
- **Camera never stops its sinusoidal sway** — x = sin(t×0.2)×0.5, y = cos(t×0.15)×0.3, lookAt(0,0,0)
- **60fps locked on desktop, 30fps minimum on mobile**
- **Draw calls < 100/frame, triangles < 50k/frame**
- **Bundle < 2MB gzipped**

## Color Palette

| Name | Hex | Usage |
|------|-----|-------|
| Void Black | #0a0014 | Background, black hole core |
| Deep Purple | #6b1fb1 | Accretion disc, UI borders, idle lighting |
| Electric Cyan | #00d4ff | Highlights, active UI, cascade lighting |
| Hot Magenta | #ff006e | Event Horizon, danger state, bonus mode |
| Gold | #ffd700 | Wins, multipliers, high-value symbols |
| Grid Purple | #1a0a2e | Grid frame, ambient light |

## Skill Files

The `SKILL.md` files in the repo root are design specs — reference them for exact values:
- `SKILL.md — pixi-slot-frontend (VOID BREAK).md` — File structure, rendering pipeline, grid math, dependencies, animation sequencer
- `SKILL.md — slot-visual-designer (VOID BREAK).md` — Scene graph, symbol geometry table, particle counts, post-processing, visual escalation levels
- `SKILL.md — slot-ui-components (VOID BREAK).md` — HUD layout, typography, component specs, responsive breakpoints
- `SKILL.md — slot-prototype-helper (VOID BREAK).md` — Mock outcome generator, debug panel, test checklists, performance budgets
- `SKILL.md — slot-game-planner (VOID BREAK).md` — (duplicate of visual-designer currently)
