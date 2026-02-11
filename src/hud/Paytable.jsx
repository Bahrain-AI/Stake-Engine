import React from 'react';
import { SYMBOL_TYPES, PAY_TABLE } from '../utils/constants.js';

const SYMBOL_DISPLAY = [
  { key: 'S7_NEUTRON', tiers: PAY_TABLE.S7_NEUTRON },
  { key: 'S6_SINGULARITY', tiers: PAY_TABLE.S6_SINGULARITY },
  { key: 'S5_DARK_MATTER', tiers: PAY_TABLE.S5_DARK_MATTER },
  { key: 'S4_STELLAR_FRAG', tiers: PAY_TABLE.S4_STELLAR_FRAG },
  { key: 'S3_PLASMA_ORB', tiers: PAY_TABLE.S3_PLASMA_ORB },
  { key: 'S2_NEBULA_CORE', tiers: PAY_TABLE.S2_NEBULA_CORE },
  { key: 'S1_VOID_SHARD', tiers: PAY_TABLE.S1_VOID_SHARD },
];

const TIER_LABELS = ['5-7', '8-11', '12-15', '16+'];

function colorHex(num) {
  return '#' + num.toString(16).padStart(6, '0');
}

export default function Paytable({ visible, onClose }) {
  if (!visible) return null;

  return (
    <div className="bonus-buy-overlay" onClick={onClose}>
      <div style={{ maxWidth: 520, width: '90%', maxHeight: '80vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 24, fontWeight: 900, letterSpacing: 6, color: '#fff' }}>PAYTABLE</div>
          <div style={{ fontSize: 9, color: '#6b1fb1', letterSpacing: 4, marginTop: 4 }}>SYMBOL PAYOUTS (BET MULTIPLIER)</div>
        </div>

        {/* Header row */}
        <div style={{ display: 'flex', padding: '4px 8px', color: '#6b1fb1', fontSize: 9, letterSpacing: 2 }}>
          <div style={{ flex: 2 }}>SYMBOL</div>
          {TIER_LABELS.map((l) => <div key={l} style={{ flex: 1, textAlign: 'center' }}>{l}</div>)}
        </div>

        {/* Symbol rows */}
        {SYMBOL_DISPLAY.map(({ key, tiers }) => {
          const sym = SYMBOL_TYPES[key];
          return (
            <div key={key} style={{
              display: 'flex', alignItems: 'center', padding: '8px',
              borderBottom: '1px solid rgba(107,31,177,0.15)',
            }}>
              <div style={{ flex: 2, display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 14, height: 14, borderRadius: key === 'S5_DARK_MATTER' ? 2 : '50%',
                  background: colorHex(sym.color), boxShadow: `0 0 6px ${colorHex(sym.emissive)}55`,
                }} />
                <span style={{ fontSize: 10, color: colorHex(sym.color) }}>{sym.name}</span>
              </div>
              {tiers.map((pay, i) => (
                <div key={i} style={{ flex: 1, textAlign: 'center', fontSize: 12, fontWeight: 700, color: '#fff' }}>
                  {pay}x
                </div>
              ))}
            </div>
          );
        })}

        {/* Special symbols */}
        <div style={{ marginTop: 16, padding: '0 8px' }}>
          <div style={{ fontSize: 10, color: '#6b1fb1', letterSpacing: 2, marginBottom: 8 }}>SPECIAL SYMBOLS</div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#000', border: '2px solid #6b1fb1' }} />
            <span style={{ fontSize: 10, color: '#6b1fb1' }}>WILD</span>
            <span style={{ fontSize: 9, color: '#888', marginLeft: 8 }}>Substitutes for any paying symbol</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#ffd700', border: '2px solid #fff' }} />
            <span style={{ fontSize: 10, color: '#ffd700' }}>SCATTER</span>
            <span style={{ fontSize: 9, color: '#888', marginLeft: 8 }}>3+ triggers Event Horizon bonus</span>
          </div>
        </div>

        {/* Rules */}
        <div style={{ marginTop: 16, padding: '0 8px', fontSize: 9, color: '#666', lineHeight: 1.6 }}>
          <div style={{ color: '#6b1fb1', letterSpacing: 2, marginBottom: 6 }}>RULES</div>
          <p>Clusters of 5+ matching symbols (orthogonal adjacency) pay according to the table above.</p>
          <p>Wins are removed and remaining symbols cascade down. New symbols fill from above.</p>
          <p>The Singularity Meter charges from wins. At 100% — Event Horizon bonus activates!</p>
          <p>Multiplier bubbles orbit the grid. When a cluster overlaps a bubble, the win is multiplied.</p>
        </div>

        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <button onClick={onClose} style={{
            padding: '8px 24px', background: 'transparent', border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: 6, color: 'rgba(255,255,255,0.5)', fontFamily: 'inherit', fontSize: 10,
            letterSpacing: 3, cursor: 'pointer', fontWeight: 700,
          }}>CLOSE</button>
        </div>
      </div>
    </div>
  );
}
