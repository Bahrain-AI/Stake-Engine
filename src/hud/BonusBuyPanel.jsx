import React from 'react';
import { BONUS_BUY, BET_LEVELS } from '../utils/constants.js';

const TIERS = [
  { key: 'ANOMALY', ...BONUS_BUY.ANOMALY, accentCSS: '#6b1fb1' },
  { key: 'COLLAPSE', ...BONUS_BUY.COLLAPSE, accentCSS: '#00d4ff' },
  { key: 'SINGULARITY', ...BONUS_BUY.SINGULARITY, accentCSS: '#ff006e' },
];

export default function BonusBuyPanel({ visible, betIndex, onBuy, onClose }) {
  if (!visible) return null;

  const betAmount = BET_LEVELS[betIndex];

  return (
    <div className="bonus-buy-overlay" onClick={onClose}>
      <div className="bonus-buy-panel" onClick={(e) => e.stopPropagation()}>
        <div className="bonus-buy-title">BONUS BUY</div>
        <div className="bonus-buy-subtitle">CHOOSE YOUR ENTRY</div>

        <div className="bonus-buy-cards">
          {TIERS.map((tier) => {
            const cost = (tier.costMultiplier * betAmount).toFixed(2);
            return (
              <div
                key={tier.key}
                className="bonus-card void-panel"
                style={{ borderColor: tier.accentCSS }}
                onClick={() => onBuy(tier.key)}
              >
                <div className="card-name" style={{ color: tier.accentCSS }}>{tier.name}</div>
                <div className="card-cost">${cost}</div>
                <div className="card-multiplier">{tier.costMultiplier}x BET</div>
                <div className="card-desc">{tier.description}</div>
              </div>
            );
          })}
        </div>

        <button className="bonus-buy-close" onClick={onClose}>CANCEL</button>
      </div>
    </div>
  );
}
