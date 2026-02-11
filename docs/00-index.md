# Stake Engine Documentation Index

> Source: https://stake-engine.com/docs and https://stakeengine.github.io/math-sdk/
> Fetched: 2026-02-10

## Overview

Stake Engine is a powerful and developer-friendly Remote Gaming Server (RGS), which allows developers to create and integrate their own games on the Stake Casino platform. It is backed by the same technology that powers Stake.com — the world's most popular online casino, handling billions in wagers and millions of users monthly.

## Stake Development Kit

The SDK is a comprehensive framework powered by CarrotRGS for creating, simulating, and optimizing slot games. It facilitates game integration on Stake.com through the Carrot Remote Gaming Server.

### What Does the SDK Offer?

1. **Math Framework** — A Python-based engine for defining game rules, simulating outcomes, and optimizing win distributions. It generates all necessary backend and configuration files, lookup tables, and simulation results.

2. **Frontend Framework** — A PixieJS/Svelte-based toolkit for creating visually engaging slot games. This component integrates seamlessly with the math engine's outputs, ensuring consistency between game logic and player experience.

### Stake Engine Game Format Criteria

- Games must consist of static files for verification, testing, and security
- All possible outcomes compressed into game-files
- Each outcome mapped to CSV files containing simulation numbers, selection probability, and payout multipliers
- Betting round initiates simulation selection proportional to weighting
- Game events returned via /play API response

## Documentation Structure

### Math SDK Documentation
- [Math SDK Home](math-sdk/01-math-sdk-home.md)
- [Engine Setup](math-sdk/02-engine-setup.md)
- [Quickstart Guide](math-sdk/03-quickstart.md)
- [SDK Directory](math-sdk/04-directory.md)
- [State Machine](math-sdk/05-state-machine.md)
- [Game Structure](math-sdk/06-game-structure.md)
- [Game Format](math-sdk/07-game-format.md)
- [Simulation Acceptance](math-sdk/08-simulation-acceptance.md)
- [Configs](math-sdk/09-configs.md)
- [BetMode](math-sdk/10-betmode.md)
- [Distribution](math-sdk/11-distribution.md)
- [Symbols](math-sdk/12-symbols.md)
- [Board](math-sdk/13-board.md)
- [Wins](math-sdk/14-wins.md)
- [Events](math-sdk/15-events.md)
- [Force Files](math-sdk/16-force-files.md)
- [Source: Board Calculations](math-sdk/17-source-board.md)
- [Source: Tumble](math-sdk/18-source-tumble.md)
- [Source: Lines](math-sdk/19-source-lines.md)
- [Source: Ways](math-sdk/20-source-ways.md)
- [Source: Scatter](math-sdk/21-source-scatter.md)
- [Source: Cluster](math-sdk/22-source-cluster.md)
- [Source: Config](math-sdk/23-source-config.md)
- [Source: Events](math-sdk/24-source-events.md)
- [Source: Executables](math-sdk/25-source-executables.md)
- [Source: State](math-sdk/26-source-state.md)
- [Source: Win Manager](math-sdk/27-source-win-manager.md)
- [Source: Outputs](math-sdk/28-source-outputs.md)
- [Utilities](math-sdk/29-utilities.md)
- [Example Games](math-sdk/30-example-games.md)
- [Uploads](math-sdk/31-uploads.md)
- [Optimization Algorithm](math-sdk/32-optimization-algorithm.md)

### Frontend SDK Documentation
- [Frontend SDK Home](frontend-sdk/01-frontend-sdk-home.md)
- [Dependencies](frontend-sdk/02-dependencies.md)
- [Getting Started](frontend-sdk/03-getting-started.md)
- [Storybook](frontend-sdk/04-storybook.md)
- [Flowchart](frontend-sdk/05-flowchart.md)
- [Task Breakdown](frontend-sdk/06-task-breakdown.md)
- [Adding New Events](frontend-sdk/07-adding-new-events.md)
- [File Structure](frontend-sdk/08-file-structure.md)
- [Context](frontend-sdk/09-context.md)
- [UI](frontend-sdk/10-ui.md)

### RGS Documentation
- [RGS Technical Details](rgs/01-rgs-technical-details.md)
- [Required Math File Format](rgs/02-required-math-file-format.md)
- [RGS Connection Example](rgs/03-rgs-connection-example.md)

### Approval Guidelines
- [Front End Communication](approval-guidelines/01-front-end-communication.md)
- [RGS Communication](approval-guidelines/02-rgs-communication.md)
- [Jurisdiction Requirements](approval-guidelines/03-jurisdiction-requirements.md)
