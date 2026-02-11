# Quickstart Guide

> Source: https://stakeengine.github.io/math-sdk/math_docs/quickstart/

## Running Your First Game

Example games are located in the `/games/` directory. The `games/0_0_lines/` game is a 3-row, 5-reel game with 20 paylines. Wins require 3 or more like symbols, which will award an amount described by `GameConfig.(paytable/paylines)`.

## Run-file

Simulation parameters are controlled via `run.py`. The recommended command is:

```bash
make run GAME=0_0_lines
```

Or manually:
```bash
python3 games/0_0_lines/run.py
```

Output files for RGS publication are located in `library/publish_files/`. Even if this math-sdk is not being used to generate math results, the _books_, _lookup-tables_ and _index_ file are required for publication.

## Testing Game Outputs

Configuration variables for testing with 100 uncompressed results:

```python
num_threads = 1
compression = False
num_sim_args = {"base": 100, "bonus": 100}
run_conditions = {
    "run_sims": True,
    "run_optimization": False,
    "run_analysis": False
}
```

The JSON output structure includes simulation `id`, `payoutMultiplier`, and `events` array detailing game logic, symbols, wins, and amounts.

## Larger Simulation Batches

Production recommendations suggest **100k+ simulations per mode** for diversity and preventing duplicate results. Example configuration:

```python
num_threads = 20
compression = True
num_sim_args = {"base": 10000, "bonus": 10000}
```

Thread output example shows RTP breakdown:
```
Thread 0 finished with 1.632 RTP. [baseGame: 0.043, freeGame: 1.588]
```

## Next Steps

- Implement custom games in `games/<game_name>/` directories
- Configure settings in `game_config.py`
- Place reusable functions in `/src/`
- Game-specific code belongs in the game folder
