import { useState, useCallback, useRef } from 'react';
import { GAME_STATES, BET_LEVELS, DEFAULT_BET_INDEX } from '../utils/constants.js';
import { GameStateMachine } from '../engine/GameStateMachine.js';
import { generateGrid } from '../engine/MockOutcomeGen.js';
import { resolveCascades } from '../engine/CascadeResolver.js';
import { calculateTotalWin } from '../engine/PayCalculator.js';
import { AnimationSequencer } from '../animation/AnimationSequencer.js';
import { SpinAnimation } from '../animation/SpinAnimation.js';
import { WinAnimation } from '../animation/WinAnimation.js';
import { CascadeAnimation } from '../animation/CascadeAnimation.js';

/**
 * Core game state hook.
 * Connects engine logic → animation sequencer → 3D scene.
 */
export function useGameState() {
  const [gameState, setGameState] = useState(GAME_STATES.IDLE);
  const [comboCount, setComboCount] = useState(0);
  const [winAmount, setWinAmount] = useState(0);
  const [betIndex, setBetIndex] = useState(DEFAULT_BET_INDEX);

  const stateMachine = useRef(new GameStateMachine()).current;
  const sequencer = useRef(new AnimationSequencer()).current;
  const sceneRef = useRef(null);

  // Bind state machine changes to React state
  const boundRef = useRef(false);
  if (!boundRef.current) {
    boundRef.current = true;
    stateMachine.onChange((newState) => {
      setGameState(newState);
    });
  }

  const setScene = useCallback((scene) => {
    sceneRef.current = scene;
  }, []);

  const spin = useCallback(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    if (!stateMachine.startSpin()) return;

    const betAmount = BET_LEVELS[betIndex];
    setWinAmount(0);
    setComboCount(0);

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
        // No wins — show void silence
        stateMachine.showWin();
        setTimeout(() => {
          stateMachine.returnToIdle();
        }, 1200);
        return;
      }

      // Calculate wins
      const { totalWin } = calculateTotalWin(steps, betAmount);

      // Animate each cascade step sequentially
      let currentStep = 0;

      function playStep() {
        if (currentStep >= steps.length) {
          // All cascades done — show total win
          setWinAmount(totalWin);
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
  }, [betIndex, stateMachine, sequencer]);

  return {
    gameState,
    comboCount,
    winAmount,
    betIndex,
    setBetIndex,
    spin,
    setScene,
    sequencer,
  };
}
