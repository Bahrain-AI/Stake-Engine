import React, { useState, useCallback, useEffect, useRef } from 'react';
import { GAME_STATES, BET_LEVELS, DEFAULT_BET_INDEX } from '../utils/constants.js';
import './HUD.css';

/**
 * HUD overlay — HTML/CSS over the Three.js canvas.
 * All game state displayed here, imperative updates from game loop.
 */
export default function HUD({
  gameState,
  onSpin,
  comboCount,
  winAmount,
  betIndex,
  onBetChange,
  meterPercent = 0,
  bonusSpins = 0,
  bonusActive = false,
  onBonusBuy,
  ehCrackActive = false,
  muted = false,
  onMuteToggle,
  onShowPaytable,
}) {
  const betAmount = BET_LEVELS[betIndex] || BET_LEVELS[DEFAULT_BET_INDEX];
  const isIdle = gameState === GAME_STATES.IDLE || gameState === GAME_STATES.BONUS_ACTIVE;
  const isSpinning = gameState === GAME_STATES.SPINNING;
  const [comboBounce, setComboBounce] = useState(false);
  const prevCombo = useRef(0);

  // Combo bounce animation trigger
  useEffect(() => {
    if (comboCount > prevCombo.current && comboCount > 0) {
      setComboBounce(true);
      const timer = setTimeout(() => setComboBounce(false), 250);
      prevCombo.current = comboCount;
      return () => clearTimeout(timer);
    }
    prevCombo.current = comboCount;
  }, [comboCount]);

  const handleBetClick = useCallback(() => {
    if (!isIdle || bonusActive) return;
    const next = (betIndex + 1) % BET_LEVELS.length;
    onBetChange(next);
  }, [isIdle, bonusActive, betIndex, onBetChange]);

  const handleSpin = useCallback(() => {
    if (isIdle) onSpin();
  }, [isIdle, onSpin]);

  // Message text
  let messageText = bonusActive ? 'CLICK TO SPIN' : 'CLICK ANYWHERE TO SPIN';
  let messageClass = 'idle';
  if (gameState === GAME_STATES.EVENT_HORIZON) {
    messageText = 'EVENT HORIZON';
    messageClass = 'win';
  } else if (gameState === GAME_STATES.SPINNING) {
    messageText = 'SCANNING FREQUENCIES...';
    messageClass = 'spinning';
  } else if (gameState === GAME_STATES.RESOLVING || gameState === GAME_STATES.CASCADING) {
    if (comboCount > 0) {
      messageText = `CASCADE \u00D7${comboCount}`;
      messageClass = 'win';
      if (comboCount >= 3) messageText += ' \u2014 GRAVITATIONAL SURGE';
    } else {
      messageText = 'RESOLVING...';
      messageClass = 'spinning';
    }
  } else if (gameState === GAME_STATES.WIN_DISPLAY) {
    if (winAmount > 0) {
      messageText = `WIN $${winAmount.toFixed(2)}`;
      messageClass = 'win';
    } else {
      messageText = 'VOID SILENCE...';
      messageClass = 'no-win';
    }
  }

  return (
    <div className="hud">
      {/* Event Horizon screen crack overlay */}
      <div className={`eh-crack-overlay ${ehCrackActive ? 'active' : ''}`} />

      {/* Top-left controls */}
      <div className="top-controls">
        <button className="hud-icon-btn" onClick={onMuteToggle} title={muted ? 'Unmute' : 'Mute'}>
          {muted ? 'OFF' : 'SFX'}
        </button>
        <button className="hud-icon-btn" onClick={onShowPaytable} title="Paytable">
          INFO
        </button>
      </div>

      {/* Title */}
      <div className="title-bar">
        <h1>VOID BREAK</h1>
        <div className="subtitle">GRAVITATIONAL SLOT EXPERIENCE</div>
      </div>

      {/* Bonus Buy button (only in base game idle) */}
      {!bonusActive && gameState === GAME_STATES.IDLE && (
        <button className="bonus-buy-btn" onClick={onBonusBuy}>
          BONUS BUY
        </button>
      )}

      {/* Bonus spins indicator */}
      {bonusActive && (
        <div className="bonus-indicator">
          <div className="bonus-label">EVENT HORIZON</div>
          <div className="bonus-spins">{bonusSpins} SPINS</div>
        </div>
      )}

      {/* Singularity Meter — left side */}
      <div className="singularity-meter void-panel">
        <div className="meter-label">SINGULARITY</div>
        <div className="meter-track">
          <div
            className={`meter-fill level-${meterPercent >= 0.75 ? 3 : meterPercent >= 0.5 ? 2 : meterPercent >= 0.25 ? 1 : 0}`}
            style={{ height: `${meterPercent * 100}%` }}
          />
          <div className="meter-thresholds">
            <div className="meter-tick t25" />
            <div className="meter-tick t50" />
            <div className="meter-tick t75" />
          </div>
        </div>
        <div className={`meter-percent level-${meterPercent >= 0.75 ? 3 : meterPercent >= 0.5 ? 2 : meterPercent >= 0.25 ? 1 : 0}`}>
          {Math.round(meterPercent * 100)}%
        </div>
      </div>

      {/* Combo Counter */}
      <div className="combo-counter void-panel">
        <div className="combo-label">COMBO</div>
        <div className={`combo-value ${comboCount > 0 ? 'active' : 'inactive'} ${comboBounce ? 'bounce' : ''}`}>
          {'\u00D7'}{comboCount}
        </div>
        <div className={`combo-sublabel ${comboCount >= 3 ? 'visible' : ''}`}>
          GRAVITATIONAL SURGE
        </div>
      </div>

      {/* Message Bar */}
      <div className={`message-bar ${messageClass}`}>
        {messageText}
      </div>

      {/* Bottom Bar */}
      <div className="bottom-bar">
        <div className="bet-display void-panel" onClick={handleBetClick}>
          <div className="label">BET</div>
          <div className="value">${betAmount.toFixed(2)}</div>
        </div>

        <button
          className={`spin-button ${isSpinning ? 'spinning' : ''}`}
          onClick={handleSpin}
          disabled={!isIdle}
        >
          {bonusActive ? 'FREE' : 'SPIN'}
        </button>

        <div className="win-display void-panel">
          <div className="label">WIN</div>
          <div className={`value ${winAmount > 0 ? 'has-win' : ''}`}>
            ${winAmount.toFixed(2)}
          </div>
        </div>
      </div>
    </div>
  );
}
