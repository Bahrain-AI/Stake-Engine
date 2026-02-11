# Game Structure

> Source: https://stakeengine.github.io/math-sdk/math_docs/overview_section/game_struct/

## Intended Engine Usage

### Game Files Structure

Standard game directory template components:
- `library/` — subdirectory containing books, configs, forces, and lookup tables
- `reels/` — directory for reelstrip CSV files
- `game_config.py` — game configuration
- `game_executables.py` — game-specific executables
- `game_calculations.py` — game-specific calculations
- `run.py` — simulation runner
- `gamestate.py` — game state management
- `game_events.py` — game event definitions
- `game_override.py` — state overrides
- `readme.txt` — game documentation

Sub-folders within `library/` are automatically generated if they do not exist at the completion of the simulation.

## Run-file Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `num_threads` | int | Threading configuration |
| `rust_threads` | int | Rust compiler threads |
| `batching_size` | int | Simulations per thread |
| `compression` | bool | File format selection between compressed and JSON |
| `profiling` | bool | Flame graph output option |
| `num_sim_args` | dict | Bet mode configuration mapping |

The `create_books()` function executes simulations and populates library folders, followed by `generate_configs()` for frontend/backend configuration generation.

## Library Folders

### books/books_compressed
Event storage from simulations, format determined by compression setting.

### configs
Three JSON files for math, frontend, and backend configuration.

### lookup_tables
Records simulation data in three-column format: simulation ID (int), weight (int), and payout (float).

## Game Components

### Configs
The GameConfig class requires symbol information, pay-tables, reel strips, and bet-mode specifications.

### Gamestate
Contains `run_spin()` function as the primary entry point, with optional `run_freespin()` for free-spin mechanics.

### Executables
Handles game logic groups and event emission, managing board operations and win-type logic.

### Misc. Calculations
Provides win-evaluation types including lines, ways, scatter, cluster mechanics, and tumbling/cascading logic.
