# Math SDK Quickstart Guide

Source: https://stakeengine.github.io/math-sdk/math_docs/quickstart/

## Overview

The Math SDK is a Python framework for defining game rules, simulating outcomes, and generating the static outcome files that the RGS serves to players.

## Running a Simulation

Example game located in `games/0_0_lines/` (3-row, 5-reel, 20 win-lines):

```bash
make run GAME=0_0_lines
```

## Configuration (run.py)

Control simulation behavior with these variables:
- Number of simulation threads
- Compression settings (JSON or .json.zst format)
- Simulation counts per game mode
- Which processes to execute (simulations, optimization, analysis)

## Testing / Debugging

For small-scale debugging:
- Set `compression = False`
- Set `num_threads = 1`
- Limit simulations (e.g., 100 per mode)

## Output Files

Results appear in `library/publish_files/`.

Game outcomes stored in `library/books/books_base.jsonl`:
- Each entry contains: simulation ID, payout multiplier, event sequences
- Event sequences communicate to the frontend what happened in the round

## Production Scale

For deployment: run **100k+ simulations per mode** to ensure:
- Diverse payout multipliers
- Minimal duplicate results for players

## Integration Flow

1. Math SDK generates static outcome files
2. Files are uploaded to Stake Engine
3. RGS selects outcomes at runtime based on probability weights
4. Frontend receives outcome via /play API and animates it

## Game File Format

All possible game-outcomes contained in compressed game-files, separated by modes.
Each outcome maps to CSV columns:
- `simulation_number` — unique identifier
- `probability` — selection weight
- `final_payout_multiplier` — total payout as multiplier of bet
