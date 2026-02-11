import { useState, useCallback, useRef } from 'react';
import { GAME_STATES, BET_LEVELS, DEFAULT_BET_INDEX, GRID_SIZE, GRID_SIZE_BONUS } from '../utils/constants.js';
import { GameStateMachine } from '../engine/GameStateMachine.js';
import { generateGrid } from '../engine/MockOutcomeGen.js';
import { resolveCascades } from '../engine/CascadeResolver.js';
import { calculateTotalWin } from '../engine/PayCalculator.js';
import { SingularityMeter } from '../engine/SingularityMeter.js';
import { MultiplierSystem } from '../engine/MultiplierSystem.js';
import { BonusMode } from '../engine/BonusMode.js';
import { AnimationSequencer } from '../animation/AnimationSequencer.js';
import { SpinAnimation } from '../animation/SpinAnimation.js';
import { WinAnimation } from '../animation/WinAnimation.js';
import { CascadeAnimation } from '../animation/CascadeAnimation.js';
import { EventHorizonCinematic } from '../animation/EventHorizonCinematic.js';

/**
 * Core game state hook.
 * Connects engine logic → animation sequencer → 3D scene.
 * Integrates SingularityMeter, MultiplierSystem, and BonusMode.
 */
export function useGameState() {
  const [gameState, setGameState] = useState(GAME_STATES.IDLE);
  const [comboCount, setComboCount] = useState(0);
  const [winAmount, setWinAmount] = useState(0);
  const [betIndex, setBetIndex] = useState(DEFAULT_BET_INDEX);
  const [meterPercent, setMeterPercent] = useState(0);
  const [bonusSpins, setBonusSpins] = useState(0);
  const [showBonusBuy, setShowBonusBuy] = useState(false);
  const [ehCrackActive, setEhCrackActive] = useState(false);

  const stateMachine = useRef(new GameStateMachine()).current;
  const sequencer = useRef(new AnimationSequencer()).current;
  const meter = useRef(new SingularityMeter()).current;
  const multipliers = useRef(new MultiplierSystem()).current;
  const bonus = useRef(new BonusMode()).current;
  const sceneRef = useRef(null);
  // Track if Event Horizon is pending (meter hit 100 during cascade resolution)
  const ehPending = useRef(false);

  // Bind state machine changes to React state
  const boundRef = useRef(false);
  if (!boundRef.current) {
    boundRef.current = true;
    stateMachine.onChange((newState) => {
      setGameState(newState);
    });

    // Threshold effects
    meter.onThreshold((threshold) => {
      const scene = sceneRef.current;
      if (threshold === 25) {
        multipliers.spawnBubble();
        if (scene) scene.multiplierBubbles.sync(multipliers.activeBubbles);
      } else if (threshold === 50) {
        // Gravitational wilds placeholder (1-3 wilds placed with energy burst)
      } else if (threshold === 75) {
        multipliers.doubleAll();
        if (scene) scene.multiplierBubbles.sync(multipliers.activeBubbles);
      } else if (threshold === 100) {
        // Mark Event Horizon as pending — will trigger after current resolution
        ehPending.current = true;
      }
    });
  }

  const setScene = useCallback((scene) => {
    sceneRef.current = scene;
  }, []);

  const syncMeter = useCallback(() => {
    const scene = sceneRef.current;
    const pct = meter.percent;
    setMeterPercent(pct);
    if (scene) scene.setMeterLevel(pct);
  }, [meter]);

  /** Count scatters in a grid */
  const countScatters = useCallback((grid) => {
    let count = 0;
    for (let r = 0; r < grid.length; r++) {
      for (let c = 0; c < grid[r].length; c++) {
        if (grid[r][c] === 'SCATTER') count++;
      }
    }
    return count;
  }, []);

  /** Trigger Event Horizon cinematic → enter bonus mode */
  const triggerEventHorizon = useCallback(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    stateMachine.startEventHorizon();
    setEhCrackActive(true);

    const cinematic = new EventHorizonCinematic(scene);
    cinematic.onExpandGrid = () => {
      scene.expandTo9x9();
      // Generate fresh 9×9 grid
      const bonusGrid = generateGrid(GRID_SIZE_BONUS);
      scene.symbols.applyGrid(bonusGrid);
    };
    cinematic.onComplete = () => {
      setEhCrackActive(false);
      ehPending.current = false;

      // Enter bonus mode
      bonus.start();
      multipliers.enterBonus();
      setBonusSpins(bonus.spinsRemaining);
      stateMachine.enterBonus();
    };
    sequencer.playImmediate(cinematic);
  }, [stateMachine, sequencer, bonus, multipliers]);

  /** End bonus mode — contract grid, reset meter, show total */
  const endBonusMode = useCallback(() => {
    const scene = sceneRef.current;
    const totalBonusWin = bonus.end();
    multipliers.exitBonus();
    multipliers.clear();

    // Reset meter
    meter.reset();
    syncMeter();
    setBonusSpins(0);

    // Contract scene back to 7×7
    if (scene) {
      scene.contractTo7x7();
      scene.resetLighting();
      scene.multiplierBubbles.sync([]);
      // Generate fresh 7×7 grid
      const baseGrid = generateGrid(GRID_SIZE);
      scene.symbols.applyGrid(baseGrid);
    }

    setWinAmount(totalBonusWin);
    stateMachine.showWin();
    setTimeout(() => {
      stateMachine.returnToIdle(false);
    }, 2500);
  }, [bonus, multipliers, meter, stateMachine, syncMeter]);

  /** Resolve a single spin (shared between base game and bonus mode) */
  const resolveSpin = useCallback((newGrid, betAmount, inBonus) => {
    const scene = sceneRef.current;
    if (!scene) return;

    const gridSize = inBonus ? GRID_SIZE_BONUS : GRID_SIZE;

    // Check for scatter trigger (3+ scatters in base game)
    const scatterCount = countScatters(newGrid);
    const scatterTriggersEH = !inBonus && scatterCount >= 3;

    // In bonus, check for retrigger (2+ scatters = +3 spins)
    if (inBonus && scatterCount >= 2) {
      const added = bonus.checkRetrigger(newGrid);
      if (added > 0) setBonusSpins(bonus.spinsRemaining);
    }

    // Spin animation
    const spinAnim = new SpinAnimation(scene.symbols, newGrid);
    spinAnim.onComplete = () => {
      scene.symbols.applyGrid(newGrid);
      stateMachine.spinComplete();

      // Resolve cascades
      const steps = resolveCascades(newGrid);

      if (steps.length === 0) {
        // No wins
        if (!inBonus) {
          meter.decay();
          syncMeter();
        }

        // In bonus: apply void absorption on dead spins
        if (inBonus) {
          bonus.applyVoidAbsorption(newGrid, new Set());
          scene.symbols.applyGrid(newGrid);
        }

        stateMachine.showWin();
        setTimeout(() => {
          // Check if scatter triggered Event Horizon
          if (scatterTriggersEH) {
            triggerEventHorizon();
            return;
          }
          if (inBonus) {
            if (bonus.isComplete) {
              endBonusMode();
            } else {
              stateMachine.returnToIdle(true);
            }
          } else {
            stateMachine.returnToIdle(false);
          }
        }, inBonus ? 800 : 1200);
        return;
      }

      // Calculate wins
      const { totalWin } = calculateTotalWin(steps, betAmount);

      // Charge meter (skip in bonus — meter stays at 100%)
      if (!inBonus) {
        for (const step of steps) {
          meter.chargeFromClusters(step.clusters);
        }
        syncMeter();
      }

      // Multiplier activation
      let multiplierBonus = 1;
      for (const step of steps) {
        for (const cluster of step.clusters) {
          const result = multipliers.checkActivation(cluster.cells);
          multiplierBonus *= result.totalMultiplier;
        }
      }
      scene.multiplierBubbles.sync(multipliers.activeBubbles);

      const finalWin = totalWin * multiplierBonus;
      if (inBonus) bonus.addWin(finalWin);

      // Animate cascade steps sequentially
      let currentStep = 0;

      function playStep() {
        if (currentStep >= steps.length) {
          setWinAmount(inBonus ? bonus.totalWin : finalWin);
          stateMachine.showWin();
          setTimeout(() => {
            // Check for EH trigger (meter hit 100 or scatter)
            if (!inBonus && (ehPending.current || scatterTriggersEH)) {
              triggerEventHorizon();
              return;
            }
            if (inBonus) {
              if (bonus.isComplete) {
                endBonusMode();
              } else {
                stateMachine.returnToIdle(true);
              }
            } else {
              stateMachine.returnToIdle(false);
            }
          }, inBonus ? 800 : 1500);
          return;
        }

        const step = steps[currentStep];
        setComboCount(currentStep + 1);
        stateMachine.startCascade();

        const winAnim = new WinAnimation(scene.symbols, step.clusters, scene.blackHole);
        winAnim.onComplete = () => {
          const cascadeAnim = new CascadeAnimation(scene.symbols, step);
          cascadeAnim.onComplete = () => {
            stateMachine.cascadeComplete();
            currentStep++;
            setTimeout(() => playStep(), 150);
          };
          sequencer.playImmediate(cascadeAnim);
        };
        sequencer.playImmediate(winAnim);
      }

      playStep();
    };

    sequencer.playImmediate(spinAnim);
  }, [stateMachine, sequencer, meter, multipliers, bonus, syncMeter, countScatters, triggerEventHorizon, endBonusMode]);

  /** Main spin action */
  const spin = useCallback(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    const inBonus = bonus.active;

    // In bonus: use a spin
    if (inBonus) {
      if (!bonus.useSpin()) {
        endBonusMode();
        return;
      }
      setBonusSpins(bonus.spinsRemaining);
    }

    if (!stateMachine.startSpin()) return;

    const betAmount = BET_LEVELS[betIndex];
    setWinAmount(inBonus ? bonus.totalWin : 0);
    setComboCount(0);

    // Decrement multiplier lifespans
    multipliers.onSpin();
    multipliers.updateOrbits(0);
    scene.multiplierBubbles.sync(multipliers.activeBubbles);

    // Generate grid
    const gridSize = inBonus ? GRID_SIZE_BONUS : GRID_SIZE;
    const newGrid = generateGrid(gridSize);

    resolveSpin(newGrid, betAmount, inBonus);
  }, [betIndex, stateMachine, multipliers, bonus, resolveSpin, endBonusMode]);

  /** Handle bonus buy selection */
  const handleBonusBuy = useCallback((tierKey) => {
    const scene = sceneRef.current;
    if (!scene) return;
    if (stateMachine.current !== GAME_STATES.IDLE) return;

    setShowBonusBuy(false);
    const betAmount = BET_LEVELS[betIndex];

    if (tierKey === 'ANOMALY') {
      // 3 cascades + 2 multiplier bubbles
      multipliers.spawnBubble();
      multipliers.spawnBubble();
      scene.multiplierBubbles.sync(multipliers.activeBubbles);
      meter.set(meter.value + 30);
      syncMeter();
    } else if (tierKey === 'COLLAPSE') {
      // Meter to 75% + 5 wilds (visual effect)
      meter.set(75);
      syncMeter();
    } else if (tierKey === 'SINGULARITY') {
      // Instant Event Horizon
      meter.set(100);
      syncMeter();
      triggerEventHorizon();
      return;
    }
  }, [betIndex, stateMachine, multipliers, meter, syncMeter, triggerEventHorizon]);

  return {
    gameState,
    comboCount,
    winAmount,
    betIndex,
    setBetIndex,
    spin,
    setScene,
    sequencer,
    meterPercent,
    bonusSpins,
    bonusActive: bonus.active,
    showBonusBuy,
    setShowBonusBuy,
    handleBonusBuy,
    ehCrackActive,
  };
}
