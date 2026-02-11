# Game Configuration Files (Configs)

> Source: https://stakeengine.github.io/math-sdk/math_docs/gamestate_section/configuration_section/config_overview/

## Overview

The GameState object requires specific parameters defined in the `__init__` function.

## Key Configuration Sections

### Game-types

Different game modes (basegame and freegame) require distinct handling. Use weighted draws for mode-specific values. All simulations will start in the basegame mode unless otherwise specified.

### Reels

Games typically use distinct reelstrip dictionaries with CSV file references. Multiple reelstrips per mode can be weighted to adjust RTP. Example format:
```python
{"BR0": "BR0.csv", "FR0": "FR0.csv"}
```

### Scatter Triggers and Anticipation

Freegame entries are specified as `{num_scatters: num_spins}` format, with separate values for basegame versus freegame modes.

### Symbol Initialization

Symbols are valid if they exist in either `paytable` or `special_symbols`. Invalid symbols raise a RuntimeError.

### Symbol Values

Winning payouts use a paytable dictionary with format:
```python
(kind[int], name[str]): value[float]
```

Alternative `pay_group` format supports ranges.

### Special Symbols

Attributes like "wild" and "scatter" are assigned via `special_symbols` dictionary, accessed through `symbol.attribute`.
