import { useEffect, useRef } from 'react';
import { SceneManager } from '../scene/SceneManager.js';

/**
 * Hook that manages Three.js lifecycle: init, animate, dispose.
 * Returns a ref to the SceneManager instance for imperative updates.
 */
export function useThreeScene(containerRef) {
  const sceneRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new SceneManager(container);
    sceneRef.current = scene;
    scene.start();

    return () => {
      scene.dispose();
      sceneRef.current = null;
    };
  }, []);

  return sceneRef;
}
