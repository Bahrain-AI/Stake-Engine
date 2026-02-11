import React, { useState, useEffect, useRef } from 'react';

/**
 * Debug Panel — activated by Ctrl+Shift+D or ?debug=true URL param.
 * Shows FPS, draw calls, triangles. Controls: meter slider, forced outcomes, trigger EH.
 */
export default function DebugPanel({ sceneRef, onSetMeter, onTriggerEH, onForceOutcome }) {
  const [visible, setVisible] = useState(() => {
    return new URLSearchParams(window.location.search).has('debug');
  });
  const [fps, setFps] = useState(0);
  const [drawCalls, setDrawCalls] = useState(0);
  const [triangles, setTriangles] = useState(0);
  const [meterSlider, setMeterSlider] = useState(0);
  const frameCount = useRef(0);
  const lastTime = useRef(performance.now());

  // Toggle with Ctrl+Shift+D
  useEffect(() => {
    const handleKey = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        setVisible((v) => !v);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  // FPS + renderer stats
  useEffect(() => {
    if (!visible) return;
    let raf;
    const tick = () => {
      frameCount.current++;
      const now = performance.now();
      if (now - lastTime.current >= 1000) {
        setFps(frameCount.current);
        frameCount.current = 0;
        lastTime.current = now;

        const scene = sceneRef?.current;
        if (scene?.renderer?.info) {
          setDrawCalls(scene.renderer.info.render.calls);
          setTriangles(scene.renderer.info.render.triangles);
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [visible, sceneRef]);

  if (!visible) return null;

  return (
    <div style={{
      position: 'absolute', top: 8, right: 8, zIndex: 200,
      background: 'rgba(0,0,0,0.85)', color: '#0f0', fontFamily: 'monospace',
      fontSize: 11, padding: 10, borderRadius: 6, pointerEvents: 'auto',
      minWidth: 180, border: '1px solid #333',
    }}>
      <div style={{ marginBottom: 6, color: '#0f0', fontWeight: 'bold' }}>DEBUG</div>
      <div>FPS: <span style={{ color: fps >= 55 ? '#0f0' : fps >= 30 ? '#ff0' : '#f00' }}>{fps}</span></div>
      <div>Draw calls: {drawCalls}</div>
      <div>Triangles: {triangles.toLocaleString()}</div>

      <hr style={{ borderColor: '#333', margin: '8px 0' }} />

      <div style={{ marginBottom: 4 }}>Meter: {meterSlider}%</div>
      <input
        type="range" min="0" max="100" value={meterSlider}
        onChange={(e) => {
          const v = Number(e.target.value);
          setMeterSlider(v);
          onSetMeter?.(v);
        }}
        style={{ width: '100%' }}
      />

      <button onClick={() => onTriggerEH?.()} style={btnStyle}>Trigger Event Horizon</button>

      <div style={{ marginTop: 6, fontSize: 10, color: '#666' }}>
        Forced outcomes:
      </div>
      {['BIG_CLUSTER', 'DEAD_SPIN', 'CASCADE_CHAIN', 'SCATTER_TRIGGER'].map((name) => (
        <button key={name} onClick={() => onForceOutcome?.(name)} style={{ ...btnStyle, fontSize: 9 }}>
          {name}
        </button>
      ))}
    </div>
  );
}

const btnStyle = {
  display: 'block', width: '100%', marginTop: 4, padding: '4px 8px',
  background: '#222', color: '#0f0', border: '1px solid #444',
  borderRadius: 3, cursor: 'pointer', fontFamily: 'monospace', fontSize: 10,
};
