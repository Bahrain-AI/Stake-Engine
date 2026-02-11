import { useRef, useEffect, useCallback, useState } from 'react';
import { useThreeScene } from './hooks/useThreeScene.js';
import { useGameState } from './hooks/useGameState.js';
import { AudioController } from './audio/AudioController.js';
import HUD from './hud/HUD.jsx';
import BonusBuyPanel from './hud/BonusBuyPanel.jsx';
import DebugPanel from './hud/DebugPanel.jsx';
import Paytable from './hud/Paytable.jsx';

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
    bonusSpins,
    bonusActive,
    showBonusBuy,
    setShowBonusBuy,
    handleBonusBuy,
    ehCrackActive,
    muted,
    toggleMute,
    debugSetMeter,
    debugTriggerEH,
  } = useGameState();

  const [showPaytable, setShowPaytable] = useState(false);
  const audioStarted = useRef(false);

  // Wire scene manager to game state once scene is ready
  useEffect(() => {
    const scene = sceneRef.current;
    if (scene) {
      setScene(scene);
      scene.animationSequencer = sequencer;
    }
  }, [sceneRef.current]);

  // Fade out loading screen once scene is ready
  useEffect(() => {
    const scene = sceneRef.current;
    if (scene) {
      const el = document.getElementById('loading-screen');
      if (el) {
        el.classList.add('fade-out');
        setTimeout(() => { if (el.parentNode) el.parentNode.removeChild(el); }, 1000);
      }
    }
  }, [sceneRef.current]);

  // Start audio on first user interaction
  const ensureAudio = useCallback(() => {
    if (!audioStarted.current) {
      audioStarted.current = true;
      AudioController.start();
    }
  }, []);

  // Click anywhere to spin (except on interactive HUD elements)
  const handleClick = useCallback((e) => {
    ensureAudio();
    if (e.target.tagName === 'CANVAS') {
      spin();
    }
  }, [spin, ensureAudio]);

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
        onSpin={() => { ensureAudio(); spin(); }}
        comboCount={comboCount}
        winAmount={winAmount}
        betIndex={betIndex}
        onBetChange={setBetIndex}
        meterPercent={meterPercent}
        bonusSpins={bonusSpins}
        bonusActive={bonusActive}
        onBonusBuy={() => setShowBonusBuy(true)}
        ehCrackActive={ehCrackActive}
        muted={muted}
        onMuteToggle={() => { ensureAudio(); toggleMute(); }}
        onShowPaytable={() => setShowPaytable(true)}
      />
      <BonusBuyPanel
        visible={showBonusBuy}
        betIndex={betIndex}
        onBuy={handleBonusBuy}
        onClose={() => setShowBonusBuy(false)}
      />
      <Paytable
        visible={showPaytable}
        onClose={() => setShowPaytable(false)}
      />
      <DebugPanel
        sceneRef={sceneRef}
        onSetMeter={debugSetMeter}
        onTriggerEH={debugTriggerEH}
      />
    </div>
  );
}
