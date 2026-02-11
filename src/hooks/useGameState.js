import { useState, useCallback, useRef } from 'react';
import { GAME_STATES, BET_LEVELS, DEFAULT_BET_INDEX } from '../utils/constants.js';
import { GameStateMachine } from '../engine/GameStateMachine.js';
import { generateGrid } from '../engine/MockOutcomeGen.js';
import { resolveCascades } from '../engine/CascadeResolver.js';
import { calculateTotalWin } from '../engine/PayCalculator.js';
import { SingularityMeter } from '../engine/SingularityMeter.js';
import { MultiplierSystem } from '../engine/MultiplierSystem.js';
import { AnimationSequencer } from '../animation/AnimationSequencer.js';
import { SpinAnimation } from '../animation/SpinAnimation.js';
import { WinAnimation } from '../animation/WinAnimation.js';
import { CascadeAnimation } from '../animation/CascadeAnimation.js';

/**
 * Core game state hook.
 * Connects engine logic → animation sequencer → 3D scene.
 * Integrates SingularityMeter and MultiplierSystem.
 */
export function useGameState() {
  const [gameState, setGameState] = useState(GAME_STATES.IDLE);
  const [comboCount, setComboCount] = useState(0);
  const [winAmount, setWinAmount] = useState(0);
  const [betIndex, setBetIndex] = useState(DEFAULT_BET_INDEX);
  const [meterPercent, setMeterPercent] = useState(0);

  const stateMachine = useRef(new GameStateMachine()).current;
  const sequencer = useRef(new AnimationSequencer()).current;
  const meter = useRef(new SingularityMeter()).current;
  const multipliers = useRef(new MultiplierSystem()).current;
  const sceneRef = useRef(null);

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
        // Spawn a multiplier bubble
        multipliers.spawnBubble();
        if (scene) {
          scene.multiplierBubbles.sync(multipliers.activeBubbles);
        }
      } else if (threshold === 50) {
        // Gravitational wilds: 1-3 wilds placed on grid
        // (Visual only in Phase 3 — actual wild placement needs mock grid mutation)
      } else if (threshold === 75) {
        // Double all active multiplier bubbles
        multipliers.doubleAll();
        if (scene) {
          scene.multiplierBubbles.sync(multipliers.activeBubbles);
        }
      }
      // threshold 100 = Event Horizon (Phase 4)
    });
  }

  const setScene = useCallback((scene) => {
    sceneRef.current = scene;
  }, []);

  /** Update meter display on scene + React state */
  const syncMeter = useCallback(() => {
    const scene = sceneRef.current;
    const pct = meter.percent;
    setMeterPercent(pct);
    if (scene) {
      scene.setMeterLevel(pct);
    }
  }, [meter]);

  const spin = useCallback(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    if (!stateMachine.startSpin()) return;

    const betAmount = BET_LEVELS[betIndex];
    setWinAmount(0);
    setComboCount(0);

    // Decrement multiplier bubble lifespans
    multipliers.onSpin();
    multipliers.updateOrbits(0);
    scene.multiplierBubbles.sync(multipliers.activeBubbles);

    // Generate new outcome
    const newGrid = generateGrid();

    // Phase 1: Spin animation
    const spinAnim = new SpinAnimation(scene.symbols, newGrid);
    spinAnim.onComplete = () => {
      scene.symbols.applyGrid(newGrid);
      stateMachine.spinComplete();

      // Phase 2: Resolve cascades
      const steps = resolveCascades(newGrid);

      if (steps.length === 0) {
        // No wins — decay meter
        meter.decay();
        syncMeter();

        stateMachine.showWin();
        setTimeout(() => {
          stateMachine.returnToIdle();
        }, 1200);
        return;
      }

      // Calculate wins
      const { totalWin } = calculateTotalWin(steps, betAmount);

      // Charge meter from all clusters in all cascade steps
      for (const step of steps) {
        meter.chargeFromClusters(step.clusters);
      }
      syncMeter();

      // Check multiplier activation against winning clusters
      let multiplierBonus = 1;
      for (const step of steps) {
        for (const cluster of step.clusters) {
          const result = multipliers.checkActivation(cluster.cells);
          multiplierBonus *= result.totalMultiplier;
        }
      }
      scene.multiplierBubbles.sync(multipliers.activeBubbles);

      const finalWin = totalWin * multiplierBonus;

      // Animate each cascade step sequentially
      let currentStep = 0;

      function playStep() {
        if (currentStep >= steps.length) {
          // All cascades done — show total win
          setWinAmount(finalWin);
          stateMachine.showWin();
          setTimeout(() => {
            stateMachine.returnToIdle();
          }, 1500);
          return;
        }

        const step = steps[currentStep];
        setComboCount(currentStep + 1);
        stateMachine.startCascade();

        // Win animation
        const winAnim = new WinAnimation(scene.symbols, step.clusters, scene.blackHole);
        winAnim.onComplete = () => {
          // Cascade animation
          const cascadeAnim = new CascadeAnimation(scene.symbols, step);
          cascadeAnim.onComplete = () => {
            stateMachine.cascadeComplete();
            currentStep++;
            // Small pause between cascades
            setTimeout(() => playStep(), 150);
          };
          sequencer.playImmediate(cascadeAnim);
        };
        sequencer.playImmediate(winAnim);
      }

      playStep();
    };

    sequencer.playImmediate(spinAnim);
  }, [betIndex, stateMachine, sequencer, meter, multipliers, syncMeter]);

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
  };
}
