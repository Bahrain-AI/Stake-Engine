# State Machine

> Source: https://stakeengine.github.io/math-sdk/math_docs/overview_section/state_overview/

## The State Machine

### Introduction

The **GameState** class functions as the central management hub for simulation batches, handling simulation parameters, game modes, configuration settings, results, and output files.

The entry point is `run.py`, which initializes parameters through the Config class and creates a GameState object.

### Key Responsibilities of GameState

**Simulation Configuration:**
- Compression
- Tracing
- Multithreading
- Output files
- Cumulative win manager

**Game Configuration:**
- Betmode details (costs, names)
- Paytable
- Symbols
- Reelsets

The design allows `run_spin()` to create a sub-instance (GeneralGameState) with modifiable game data, reducing parameter passing between functions.

### Extending Core Functionality

GameState acts as a super-class. Custom games extend or override functionality using Python's Method Resolution Order (MRO). Outputs are generated sequentially per BetMode after simulations complete.

## Class Inheritance

### Why Use Class Inheritance?

Inheritance ensures flexibility while maintaining access to core functions defined in Source Files.

### GameStateOverride (`game/game_override.py`)

First in MRO, modifies or extends `state.py` actions. Example overriding `reset_book()`:

```python
def reset_book(self):
    super().reset_book()
    self.reset_grid_mults()
    self.reset_grid_bool()
    self.tumble_win = 0
```

### GameExecutables (`game/game_executables.py`)

Groups commonly used game actions into executable functions. Example: freespin triggering based on scatters:

```python
config.freespin_triggers = {3: 8, 4: 10, 5: 12}

def update_freespin_amount(self, scatter_key: str = "scatter") -> None:
    self.tot_fs = self.config.freespin_triggers[self.gametype][self.count_special_symbols(scatter_key)]
    fs_trigger_event(self, basegame_trigger=True, freegame_trigger=False)
```

Sample games can override to customize behavior — the `0_0_scatter` example assigns total spins as 2x active Scatters.

### GameCalculations (`games/game_calculations.py`)

Handles game-specific calculations, inheriting from GameExecutables.

## Books and Libraries

### What is a "Book"?

A book represents a single simulation result, storing:
- The payout multiplier
- Events triggered during the round
- Win conditions

Each simulation generates a Book object, stored in a library (collection of all books from batch). Books are attached to the global GameState object for analysis and optimization.

**Example JSON structure:**
```json
[
    {
        "id": 1,
        "payoutMultiplier": 0.0,
        "events": [ {}, {}, {} ],
        "criteria": "str",
        "baseGameWins": 0.0,
        "freeGameWins": 0.0
    }
]
```

### Resetting the Book

At simulation start, the book resets for a clean state:

```python
def reset_book(self) -> None:
    self.book = {
        "id": self.sim + 1,
        "payoutMultiplier": 0.0,
        "events": [],
        "criteria": self.criteria,
    }
```

## Lookup Tables

### What are Lookup Tables?

Lookup tables summarize all simulation payouts, calculating win distribution properties and Return To Player (RTP) values. Stored as CSV files with columns:
- Simulation Number
- Simulation Weight
- Payout Multiplier

The **payoutMultiplier** represents final player payment, including basegame and freegame wins.

### Purpose

- **Win Distribution Analysis:** Analyze payout distributions across simulations
- **RTP Calculation:** Calculate overall RTP for game modes
- **Optimization:** Serve as input for optimization algorithm adjusting weights to achieve desired payout characteristics

### File Naming Convention

- Initial: `lookUpTable_mode.csv`
- Optimized: `lookUpTable_mode_0.csv`

The optimization algorithm modifies weight values (initially set to 1) for further analysis or deployment.
