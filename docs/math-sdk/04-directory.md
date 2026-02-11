# SDK Directory

> Source: https://stakeengine.github.io/math-sdk/math_docs/directory/

## Repository Directory Overview

The repository is organized around game creation with these primary directories:

### Main Directories

#### 1. `games/`
Sample slot games demonstrating mechanics:
- **0_0_cluster** — cascading cluster-wins
- **0_0_lines** — basic win-lines
- **0_0_ways** — basic ways-wins
- **0_0_scatter** — pay-anywhere cascading
- **0_0_expwilds** — expanding wild-reel with prize-collection

#### 2. `src/`
Core reusable code with subdirectories:
- **calculations/** — board/symbol setup, win logic
- **config/** — RGS/frontend/optimization configuration
- **events/** — math-to-frontend data structures
- **executables/** — grouped game logic
- **state/** — simulation state tracking
- **wins/** — wallet management
- **write_data/** — simulation output, compression

#### 3. `utils/`
Analysis tools:
- **analysis/** — win distribution properties
- **game_analytics/** — hit-rate generation

#### 4. `tests/`
PyTest verification functions for win calculations.

#### 5. `uploads/`
AWS S3 bucket integration for game files.

#### 6. `optimization_program/`
Experimental Rust-based genetic algorithm for game balancing.

#### 7. `docs/`
Markdown documentation.
