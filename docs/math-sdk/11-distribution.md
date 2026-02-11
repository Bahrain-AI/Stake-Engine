# Distribution Conditions

> Source: https://stakeengine.github.io/math-sdk/math_docs/gamestate_section/configuration_section/betmode_dist/

## Overview

Within each `BetMode` there is a set of `Distribution` Classes which determine the win-criteria within each bet-mode.

## Required Fields

### 1. Criteria

A shorthand name describing the win condition in a single word.

### 2. Quota

The amount of simulations (as a ratio of the total number of bet-mode simulations) which need to satisfy the corresponding criteria. The quota is normalized when assigning criteria to simulations, so the sum of all quotas does not need to be 1. There is a minimum of 1 simulation assigned per criteria.

### 3. Conditions

Required keys include:
- `reel_weights`
- `force_wincap` (defaults to False)
- `force_freegame` (defaults to False)

### 4. Win Criteria (Optional)

Incorporates payout multiplier into simulation acceptance. Common values are `0.0` or `self.wincap`. When `check_repeat()` is called, final win amount must match the specified value if `win_criteria` isn't `None`.

## Practical Application

Distribution Conditions enable handling game actions in a way which depends on the (known) expected simulation, allowing probability adjustments rather than repeated random draws likely to be rejected.
