# Game Format

> Source: https://stakeengine.github.io/math-sdk/math_docs/overview_section/game_format/

## Standard Game Setup Requirements

New slot games should follow a structured setup process. It is recommended to start with sample games or templates that match the project's needs.

## Configuration File

Developers must set game parameters in the `GameConfig` `__init__()` function. Key requirements include:

- Game identification details (name, RTP, board dimensions)
- Payout tables and reel configurations
- Special symbol definitions
- BetMode classes (typically a base game and freegame)

Code example showing the basic structure:
```python
self.game_id = "game_id"
self.provider_number = "provider_number"
self.working_name = "working_name"
self.wincap = 5000
self.win_type = "lines"
self.RTP = 0.96
self.reels = {...}
self.paytable = {...}
```

Each BetMode requires explicit definition including cost, RTP, maximum win amounts, and gametype flags. Distribution criteria are preassigned to each simulation number to control hit-rates and RTP allocation across different game conditions.

## Gamestate File

The entry point is the `run_spin()` function within the `GameState` class. The generic structure includes:

1. Seeding the RNG with simulation numbers for reproducibility
2. Resetting local variables
3. Drawing boards from reelstrip positions
4. Evaluating win data and updating wallet manager
5. Emitting relevant events
6. Checking freespin conditions

A parallel freespin structure handles free game modes with similar flow patterns.

## Runfile

The `run.py` file generates simulation outputs. It configures parameters like thread count, batch sizing, and compression options, then calls `create_books()` and `generate_configs()` functions.

## Outputs

Simulation results are stored in `game/library/` containing:

- **books_compressed** — Primary data file with events and payout multipliers
- **lookup_tables** — Summary payout values in CSV format for optimization
- **force/ folder** — Information for game analysis
- **config/ folder** — Frontend and backend configuration data

## Key Technical Points

- The RNG is seeded with simulation numbers for reproducibility
- The repeat condition persists until criteria-specific conditions are satisfied
