# Stake Engine Overview

Source: https://stake-engine.com/docs, https://stakeengine.github.io/math-sdk/

## What is Stake Engine

Stake Engine is a Remote Gaming Server (RGS) platform powered by CarrotRGS, designed for deploying slot games on Stake.com. Games are built with a Math SDK (Python) for game logic and a Frontend SDK for the visual layer.

## Revenue Model

- 10% GGR perpetual royalties — the most aggressive model in gaming

## SDK Components

### Math Framework (Python)
- Defines game rules, simulates outcomes, optimizes win distributions
- Generates all backend files, configuration data, lookup tables, and simulation results
- Output: compressed game-files separated by modes
- Each outcome maps to a CSV: simulation_number, probability, final_payout_multiplier

### Frontend Framework
- Official SDK uses PixieJS + Svelte (but custom frontends like React + Three.js are allowed)
- Must integrate with RGS API for game rounds
- All assets (images, fonts) must load from Stake Engine CDN

## How Games Work

1. All possible game-outcomes must be contained within compressed game-files, separated by modes
2. Each outcome maps to a CSV with: simulation_number, probability, final_payout_multiplier
3. When a bet is placed, RGS selects a simulation number proportional to its probability weighting
4. The corresponding game events are returned through the /play API response
5. Frontend animates the predetermined outcome

## Approval Guidelines

- Payout amounts for all symbol combinations must be presented
- Games must allow bet size changes using all bet-levels from RGS auth response
- Player balance must be displayed
- Unique audio and visual assets required (no SDK sample assets)
- Mobile view support required for common devices
- All images/fonts loaded from Stake Engine CDN

## Key URLs

- Docs: https://stake-engine.com/docs
- Math SDK: https://stakeengine.github.io/math-sdk/
- GitHub: https://github.com/stakeengine
