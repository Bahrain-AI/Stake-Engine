# BetMode

> Source: https://stakeengine.github.io/math-sdk/math_docs/gamestate_section/configuration_section/betmode_overview/

## Definition

All valid bet-modes are defined in the array `self.bet_modes = [...]`. BetMode serves as an important configuration element for controlling game behavior.

## Key Responsibilities

The BetMode class manages:
- Maximum win amounts
- RTP (Return to Player)
- Bet cost
- Distribution conditions

## Three Critical Flags

### 1. `auto_close_disabled`

- **Default:** False
- When False, the RGS endpoint automatically calls `/endround` to close bets
- When True, allows players to resume interrupted play even with zero payouts (useful for bonus modes)

### 2. `is_feature`

- Preserves current bet-mode without player interaction on subsequent spins
- Prevents need for confirmation after each round in feature modes

### 3. `is_buybonus`

- Indicates directly purchased modes
- Signals frontend to potentially change assets

## Example Configuration

A bonus mode from the "lines" sample game includes a BetMode with cost, RTP, wincap settings, and two distribution configurations with specific criteria, quotas, and conditions.
