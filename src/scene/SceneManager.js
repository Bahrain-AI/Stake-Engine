import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import {
  COLORS,
  CAMERA_FOV,
  CAMERA_POS_Z,
  CAMERA_SWAY_X_SPEED,
  CAMERA_SWAY_Y_SPEED,
  CAMERA_SWAY_X_AMP,
  CAMERA_SWAY_Y_AMP,
  BLOOM_PARAMS,
  MOBILE_BREAKPOINT,
  MAX_PIXEL_RATIO_MOBILE,
} from '../utils/constants.js';
import { BlackHole } from './BlackHole.js';
import { Environment } from './Environment.js';
import { LightingSystem } from './LightingSystem.js';
import { GridRenderer } from './GridRenderer.js';
import { SymbolManager } from './SymbolManager.js';
import { VisualEscalation } from './VisualEscalation.js';
import { MultiplierBubbles } from './MultiplierBubbles.js';

// Vignette shader
const VignetteShader = {
  uniforms: {
    tDiffuse: { value: null },
    darkness: { value: 1.2 },
    offset: { value: 1.0 },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float darkness;
    uniform float offset;
    varying vec2 vUv;
    void main() {
      vec4 texel = texture2D(tDiffuse, vUv);
      vec2 uv = (vUv - vec2(0.5)) * vec2(offset);
      float vignette = clamp(1.0 - dot(uv, uv), 0.0, 1.0);
      texel.rgb *= mix(1.0 - darkness, 1.0, vignette);
      gl_FragColor = texel;
    }
  `,
};

export class SceneManager {
  constructor(container) {
    this.container = container;
    this.isMobile = window.innerWidth <= MOBILE_BREAKPOINT;
    this.clock = new THREE.Clock();
    this.elapsedTime = 0;
    this.animationId = null;
    this.disposed = false;

    // Singularity meter level (0.0 - 1.0) — wired up for visual escalation
    this.meterLevel = 0;

    // External animation sequencer (set by useGameState)
    this.animationSequencer = null;

    this._initRenderer();
    this._initScene();
    this._initCamera();
    this._initPostProcessing();
    this._initSubsystems();
    this._onResize = this._onResize.bind(this);
    window.addEventListener('resize', this._onResize);
  }

  _initRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isMobile,
      powerPreference: 'high-performance',
    });
    const pixelRatio = this.isMobile
      ? Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO_MOBILE)
      : Math.min(window.devicePixelRatio, 2);
    this.renderer.setPixelRatio(pixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setClearColor(COLORS.VOID_BLACK, 1);
    this.renderer.sortObjects = true;
    this.container.appendChild(this.renderer.domElement);
  }

  _initScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(COLORS.VOID_BLACK);
  }

  _initCamera() {
    const aspect = window.innerWidth / window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(CAMERA_FOV, aspect, 0.1, 1000);
    this.camera.position.set(0, 0, CAMERA_POS_Z);
    this.camera.lookAt(0, 0, 0);
  }

  _initPostProcessing() {
    const size = new THREE.Vector2(window.innerWidth, window.innerHeight);
    this.composer = new EffectComposer(this.renderer);

    const renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(renderPass);

    this.bloomPass = new UnrealBloomPass(
      size,
      BLOOM_PARAMS.strength,
      BLOOM_PARAMS.radius,
      BLOOM_PARAMS.threshold
    );
    this.composer.addPass(this.bloomPass);

    if (!this.isMobile) {
      this.vignettePass = new ShaderPass(VignetteShader);
      this.composer.addPass(this.vignettePass);
    }
  }

  _initSubsystems() {
    this.blackHole = new BlackHole(this.scene);
    this.environment = new Environment(this.scene, this.isMobile);
    this.lighting = new LightingSystem(this.scene);
    this.grid = new GridRenderer(this.scene);
    this.symbols = new SymbolManager(this.scene);
    this.multiplierBubbles = new MultiplierBubbles(this.scene);
    this.escalation = new VisualEscalation(this);
  }

  start() {
    if (this.disposed) return;
    this._animate();
  }

  _animate() {
    if (this.disposed) return;
    this.animationId = requestAnimationFrame(() => this._animate());

    const delta = this.clock.getDelta();
    this.elapsedTime += delta;
    const time = this.elapsedTime;

    // Visual escalation per-frame (screen shake)
    this.escalation.updateFrame(time, delta, this.meterLevel);

    // Camera sway + screen shake offset
    const shake = this.escalation.cameraShakeOffset;
    this.camera.position.x = Math.sin(time * CAMERA_SWAY_X_SPEED) * CAMERA_SWAY_X_AMP + shake.x;
    this.camera.position.y = Math.cos(time * CAMERA_SWAY_Y_SPEED) * CAMERA_SWAY_Y_AMP + shake.y;
    this.camera.lookAt(0, 0, 0);

    // Update subsystems
    this.blackHole.update(time, delta, this.meterLevel);
    this.environment.update(time, delta, this.meterLevel);
    this.lighting.update(time, delta, this.meterLevel);
    this.grid.update(time, delta, this.meterLevel);
    this.symbols.update(time, delta, this.meterLevel);
    this.multiplierBubbles.update(time, delta);

    // Update animation sequencer
    if (this.animationSequencer) {
      this.animationSequencer.update(delta);
    }

    // Render
    this.composer.render(delta);
  }

  setMeterLevel(level) {
    this.meterLevel = Math.max(0, Math.min(1, level));
    this.escalation.apply(this.meterLevel);
  }

  /** Expand grid and symbols to 9×9 for bonus mode */
  expandTo9x9() {
    this.grid.expandTo9x9();
    this.symbols.expandTo9x9();
  }

  /** Contract grid and symbols back to 7×7 */
  contractTo7x7() {
    this.grid.contractTo7x7();
    this.symbols.contractTo7x7();
    // Reset camera to base position
    this.camera.position.z = CAMERA_POS_Z;
    this.camera.fov = CAMERA_FOV;
    this.camera.updateProjectionMatrix();
  }

  /** Reset lighting to base colors after bonus */
  resetLighting() {
    if (this.lighting) {
      this.lighting.pointLight1.color.setHex(0x6b1fb1);
      this.lighting.pointLight2.color.setHex(0x00d4ff);
      this.lighting.pulseLight.color.setHex(0x6b1fb1);
      this.lighting.ambient.intensity = 0.5;
      this.lighting.pointLight1.intensity = 1.0;
      this.lighting.pointLight2.intensity = 0.8;
      this.lighting.pulseLight.intensity = 0.6;
    }
    if (this.bloomPass) {
      this.bloomPass.strength = BLOOM_PARAMS.strength;
      this.bloomPass.radius = BLOOM_PARAMS.radius;
    }
  }

  _onResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
    this.composer.setSize(width, height);
  }

  dispose() {
    this.disposed = true;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    window.removeEventListener('resize', this._onResize);

    this.blackHole.dispose();
    this.environment.dispose();
    this.lighting.dispose();
    this.grid.dispose();
    this.symbols.dispose();
    this.multiplierBubbles.dispose();
    this.escalation.dispose();

    this.composer.dispose();
    this.renderer.dispose();

    if (this.renderer.domElement && this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
  }
}
