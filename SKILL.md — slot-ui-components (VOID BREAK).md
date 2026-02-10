# Skill: slot-ui-components

## Identity
You are the UI/UX designer and HUD implementer for VOID BREAK. You own all user-facing interface elements — meters, counters, controls, overlays, and responsive layout. Your HUD must feel like a spacecraft instrument panel, not a casino UI.

## Design Language

### Typography
- **Primary:** Monospace (JetBrains Mono, Space Mono, or Courier New fallback)
- **Numbers:** Tabular figures, bold weight for values
- **Labels:** UPPERCASE, letter-spacing 2-6px, small font (8-10px)
- **Win amounts:** Large, bold, with text-shadow glow matching state color

### UI Element Styling
```css
/* Standard panel */
.void-panel {
    background: rgba(26, 10, 46, 0.6);    /* #1a0a2e at 60% */
    border: 1px solid rgba(107, 31, 177, 0.3); /* purple border */
    border-radius: 8px;
    backdrop-filter: blur(4px);  /* if supported */
}

/* Active/highlighted panel */
.void-panel-active {
    border-color: rgba(0, 212, 255, 0.6);  /* cyan border */
    box-shadow: 0 0 15px rgba(0, 212, 255, 0.2);
}

/* Text hierarchy */
.label { color: #6b1fb1; font-size: 8px; letter-spacing: 3px; text-transform: uppercase; }
.value { color: #00d4ff; font-size: 16px; font-weight: 700; }
.value-win { color: #ffd700; text-shadow: 0 0 10px rgba(255, 215, 0, 0.5); }
.value-danger { color: #ff006e; text-shadow: 0 0 15px rgba(255, 0, 110, 0.5); }
```

### No Emojis, No Rounded Cartoon Elements
Everything is angular, technical, data-driven. Think: spaceship HUD, not mobile game UI.

## HUD Layout

### Desktop (Landscape)
```
┌────────────────────────────────────────────────────────┐
│                    VOID BREAK (title)                   │
│              GRAVITATIONAL SLOT EXPERIENCE               │
│                                                          │
│  ┌──────┐                                   ┌────────┐  │
│  │ SING │                                   │ COMBO  │  │
│  │ ULAR │         [3D GAME SCENE]           │  ×3    │  │
│  │ ITY  │         [7×7 GRID +               │        │  │
│  │      │          BLACK HOLE]              │ GRAVI- │  │
│  │ ███  │                                   │ TATION │  │
│  │ ███  │                                   │ SURGE  │  │
│  │ ░░░  │                                   │        │  │
│  │ 67%  │                                   │        │  │
│  └──────┘                                   └────────┘  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │  [BET: $1.00]    ◉ SPIN    [WIN: $0.00]        │   │
│  └──────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────┘
```

### Mobile (Portrait)
```
┌────────────────────────┐
│     VOID BREAK         │
│  SING│           │COMBO│
│  72% │  [GAME]   │ ×2  │
│  ██░ │  [SCENE]  │     │
│      │           │     │
├──────┴───────────┴─────┤
│ BET $1.00  ◉  WIN $0   │
└────────────────────────┘
```

## Component Specifications

### 1. Title Bar (Top Center)
- "VOID BREAK" — 28-32px, weight 900, letter-spacing 10-12px
- Color: white with dual text-shadow (#6b1fb1 and #00d4ff glow)
- Subtitle: "GRAVITATIONAL SLOT EXPERIENCE" — 9-10px, #6b1fb1, letter-spacing 6px
- Position: absolute, top 16-20px, centered

### 2. Singularity Meter (Left Side, Vertically Centered)
- Orientation: vertical bar, bottom = 0%, top = 100%
- Width: 8px bar inside a container with label
- Background: rgba(26, 10, 46, 0.8) with 1px purple border
- Fill gradient changes by level:
  - 0-49%: #1a0a2e → #6b1fb1
  - 50-79%: #6b1fb1 → #00d4ff
  - 80-100%: #ff006e (with box-shadow glow)
- Transition: height 0.5s ease, background 0.5s ease
- Label: "SINGULARITY" — vertical text (writing-mode: vertical-rl), 8px, cyan
- Percentage: below bar, 12px, bold, color matches fill state
- Threshold markers at 25%, 50%, 75% (small tick marks)

### 3. Combo Counter (Right Side, Vertically Centered)
- Shows cascade count for current spin: "×0", "×1", "×2", etc.
- Number: 40-48px, weight 900
- Color: #1a0a2e when 0 (invisible), #ffd700 when active (with glow)
- Label above: "COMBO" — 8px, #6b1fb1
- Sub-label below (appears at ×3+): "GRAVITATIONAL SURGE" — 8px, #00d4ff
- Animation: scale bounce on increment (1.0 → 1.3 → 1.0, 200ms)

### 4. Bottom Control Bar
- Full width, gradient background: transparent → rgba(10, 0, 20, 0.95)
- Padding: 40px top (fade zone), 20px bottom

#### 4a. Bet Display (Left)
- Panel style: .void-panel
- Label: "BET" — 9px, #6b1fb1
- Value: "$1.00" — 16px, #00d4ff, bold
- Tap/click: opens bet amount selector (dropdown or ±buttons)
- Bet amounts: [0.20, 0.50, 1.00, 2.00, 5.00, 10.00, 25.00, 50.00, 100.00]

#### 4b. Spin Button (Center)
- Circular: 52-56px diameter
- Idle state: radial gradient #6b1fb1 → #2a0845, 2px cyan border, box-shadow glow
- Spinning state: gradient darkens, border dims, no glow
- Disabled state: fully dark, no interactivity
- Label: "SPIN" — 9px, white, bold, letter-spacing 2px
- Animation: subtle pulse when idle (scale 1.0 → 1.03 → 1.0, 2s loop)

#### 4c. Win Display (Right)
- Panel style: .void-panel
- Label: "WIN" — 9px, #6b1fb1
- Value: "$0.00" — 16px, bold
- Color: #ffd700 when > 0, transitions with count-up animation
- Big win (100x+): value pulses, golden particle effect around it

### 5. Message Bar (Above Controls)
- Centered text, changes based on game phase:
  - Idle: "CLICK ANYWHERE TO SPIN" — 12px, #6b1fb1
  - Spinning: "SCANNING FREQUENCIES..." — 12px, #00d4ff
  - Win: "CASCADE ×3 — GRAVITATIONAL SURGE" — 12px, #00d4ff
  - No win: "VOID SILENCE..." — 12px, #6b1fb1 dim
  - Event Horizon: "⚡ EVENT HORIZON — REALITY FRACTURE ⚡" — 18px, #ff006e, bold, glow
- Letter-spacing: 3-4px

### 6. Event Horizon Border (Bonus Mode Only)
- When active: 3px #ff006e border around entire viewport
- Box-shadow: inset 0 0 80px rgba(255, 0, 110, 0.3)
- Animation: pulsing between 0.2 and 0.5 opacity, 0.5s alternate

### 7. Bonus Buy Panel (Overlay)
- Triggered from menu or dedicated button
- Semi-transparent dark overlay
- Three cards side by side:

| Anomaly (25x) | Collapse (75x) | Singularity (150x) |
|---|---|---|
| 3 cascades + 2 bubbles | Meter at 75% + 5 wilds | Instant Event Horizon |
| Purple accent | Cyan accent | Magenta accent |

- Each card: .void-panel, hover glow, click to purchase
- Cost displayed prominently in bet multiples

### 8. Paytable (Overlay)
- Triggered from info/menu button
- Full-screen overlay with semi-transparent dark background
- Sections: Symbol payouts (with 3D renders), Feature explanations, Game rules
- Scrollable, close on X or backdrop click

### 9. Balance Display (Optional — may be handled by Stake's wrapper)
- If needed: small text in top-right corner
- "BALANCE: $XXX.XX" — 10px, #6b1fb1

## Responsive Breakpoints

```javascript
const BREAKPOINTS = {
    mobile: 640,    // ≤ 640px: compact portrait layout
    tablet: 1024,   // 641-1024px: adjusted landscape
    desktop: 1025   // 1025px+: full layout
};
```

### Mobile Adaptations
- Title: smaller (22px), reduced letter-spacing
- Singularity Meter + Combo Counter: move to top corners, horizontal mini-bars
- Bottom bar: compact, spin button stays centered
- Paytable: full-screen sheet from bottom
- Touch: larger tap targets (min 44×44px), spin on tap anywhere (with dedicated button too)

## Accessibility
- All interactive elements have focus outlines (cyan)
- Spin button responds to Enter/Space key
- Color is never the ONLY indicator — always paired with text/shape
- Animations respect `prefers-reduced-motion` (reduce to opacity transitions only)
- Min contrast ratio: 4.5:1 for text on panels

## Rules
- HUD is ALWAYS HTML/CSS managed by React — NOT Three.js or PixiJS
- HUD has `pointer-events: none` on container, `pointer-events: auto` on interactive elements
- HUD absolutely positioned over the Three.js canvas with z-index layering
- NEVER obstruct more than 15% of the game scene with UI elements
- All number values use count-up/count-down animations (never instant change)
- All transitions are CSS with 200-500ms durations — nothing instant, nothing slow
- NEVER use emojis in the actual game UI (design doc is fine, game is not)
- Font stack: 'JetBrains Mono', 'Space Mono', 'Courier New', monospace