import { useRef, useEffect, useCallback } from 'react';
import { useThreeScene } from './hooks/useThreeScene.js';
import { useGameState } from './hooks/useGameState.js';
import HUD from './hud/HUD.jsx';

export default function App() {
  const containerRef = useRef(null);
  const sceneRef = useThreeScene(containerRef);
  const {
    gameState,
    comboCount,
    winAmount,
    betIndex,
    setBetIndex,
    spin,
    setScene,
    sequencer,
    meterPercent,
  } = useGameState();

  // Wire scene manager to game state once scene is ready
  useEffect(() => {
    const scene = sceneRef.current;
    if (scene) {
      setScene(scene);
      scene.animationSequencer = sequencer;
    }
  }, [sceneRef.current]);

  // Click anywhere to spin (except on interactive HUD elements)
  const handleClick = useCallback((e) => {
    if (e.target.tagName === 'CANVAS') {
      spin();
    }
  }, [spin]);

  return (
    <div
      ref={containerRef}
      onClick={handleClick}
      style={{
        width: '100%',
        height: '100vh',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <HUD
        gameState={gameState}
        onSpin={spin}
        comboCount={comboCount}
        winAmount={winAmount}
        betIndex={betIndex}
        onBetChange={setBetIndex}
        meterPercent={meterPercent}
      />
    </div>
  );
}
