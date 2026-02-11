# Simulation Acceptance Criteria

> Source: https://stakeengine.github.io/math-sdk/math_docs/gamestate_section/repeat_info/

## Overview

Game configurations split win-criteria into quotas, which determine the ratio of the total number of simulations satisfying a particular win criteria.

## Four Win Categories

The sample games segment outcomes into:

1. **Zero-payout simulations** — multiplier = 0
2. **Base game wins** — payout > 0, no free game trigger
3. **Free game scenarios** — free game triggered from base
4. **Maximum-win scenarios** — highest payout multiplier awarded

## Purpose of Segmentation

This approach ensures sufficient simulation scenarios exist for each criteria type. For rare events (like a 1-in-500,000 max-win), predetermining acceptance prevents redundant outcomes and reduces player exposure to identical results.

## Predetermination Process

The `GameState` assigns acceptance criteria to specific simulation numbers before execution runs. During gameplay, the `run_spin()` function checks if the final outcome matches its predetermined criteria via `check_repeat()`. If criteria are met, `self.repeat = False` and results are saved to the library.

## Threading Advantage

Predetermining quotas prevents multi-threading bottlenecks where slower max-win simulations would delay completion, since all criteria except the max-win are likely to be filled first.
