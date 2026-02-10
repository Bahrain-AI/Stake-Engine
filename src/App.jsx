import { useRef } from 'react';
import { useThreeScene } from './hooks/useThreeScene.js';

export default function App() {
  const containerRef = useRef(null);
  const sceneRef = useThreeScene(containerRef);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100vh',
        overflow: 'hidden',
        position: 'relative',
      }}
    />
  );
}
