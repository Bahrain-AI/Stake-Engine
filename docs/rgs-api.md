# RGS (Remote Gaming Server) API Reference

Source: https://stakeengine.github.io/math-sdk/rgs_docs/RGS/

## Game URL Structure

```
https://{{.TeamName}}.cdn.stake-engine.com/{{.GameID}}/{{.GameVersion}}/index.html?sessionID={{.SessionID}}&lang={{.Lang}}&device={{.Device}}&rgs_url={{.RgsUrl}}
```

### Query Parameters
- `sessionID` — unique per player session
- `lang` — ISO 639-1 language code
- `device` — "mobile" or "desktop"
- `rgs_url` — dynamic RGS base URL for API calls

## Monetary Values

**All monetary values are integers with 6 decimal places of precision.**

| Display | Integer Value |
|---------|--------------|
| $1.00   | 1,000,000    |
| $0.10   | 100,000      |
| $0.01   | 10,000       |

## Wallet Endpoints

### POST /wallet/authenticate
Validates sessionID. Returns:
- Player balance
- Configuration: minBet, maxBet, stepBet, betLevels
- Active/last round data

### GET /wallet/balance
Returns current player balance. Use for periodic balance updates.

### POST /wallet/play
Initiates a game round. Debits bet amount.
- Requires: amount, sessionID, bet mode
- Returns: game events (the predetermined outcome)

### POST /wallet/endround
Completes the round. Triggers payout credit. Closes round activity.

### POST /wallet/event
Tracks in-progress player actions. Useful for disconnect recovery.

## Betting Configuration

- Bet must fall between minBet and maxBet (from /wallet/authenticate)
- Bet must be divisible by stepBet
- Recommended: use predefined betLevels to guide players
- Bet modes apply cost multipliers to base wager amounts
- Currency affects display only, not gameplay logic

## Error Codes

### 400 Errors
- Invalid request
- Insufficient balance
- Invalid session
- Authentication failure
- Location restriction

### 500 Errors
- General server error
- Maintenance mode
