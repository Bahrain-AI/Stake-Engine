import * as Tone from 'tone';

/**
 * Audio Controller — procedural synth audio, no sample files.
 * Uses Tone.js for all sound generation.
 *
 * Events: spin, winCluster, cascade, meterCharge, meterThreshold,
 *         ehCharge, ehCrack, ehCollapse, ehSilence, ehRebirth, bigWin
 */
class AudioControllerClass {
  constructor() {
    this.started = false;
    this.muted = false;
    this._masterVol = null;
    this._droneSynth = null;
    this._sfxSynths = {};
  }

  /** Must call from user gesture (click) to unlock Web Audio */
  async start() {
    if (this.started) return;
    await Tone.start();
    this.started = true;

    this._masterVol = new Tone.Volume(-6).toDestination();

    // Ambient drone — deep pad
    this._droneSynth = new Tone.FMSynth({
      harmonicity: 0.5,
      modulationIndex: 2,
      oscillator: { type: 'sine' },
      modulation: { type: 'triangle' },
      envelope: { attack: 2, decay: 1, sustain: 1, release: 4 },
      volume: -20,
    }).connect(this._masterVol);

    // Start drone
    this._droneSynth.triggerAttack('C1');

    // SFX synths — pre-allocated
    this._sfxSynths.spin = new Tone.Synth({
      oscillator: { type: 'sawtooth' },
      envelope: { attack: 0.01, decay: 0.3, sustain: 0, release: 0.1 },
      volume: -12,
    }).connect(this._masterVol);

    this._sfxSynths.win = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.02, decay: 0.4, sustain: 0.1, release: 0.3 },
      volume: -10,
    }).connect(this._masterVol);

    this._sfxSynths.cascade = new Tone.MembraneSynth({
      pitchDecay: 0.05,
      octaves: 4,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.001, decay: 0.3, sustain: 0, release: 0.3 },
      volume: -8,
    }).connect(this._masterVol);

    this._sfxSynths.meter = new Tone.Synth({
      oscillator: { type: 'sine' },
      envelope: { attack: 0.05, decay: 0.2, sustain: 0, release: 0.1 },
      volume: -14,
    }).connect(this._masterVol);

    this._sfxSynths.threshold = new Tone.MetalSynth({
      frequency: 200,
      envelope: { attack: 0.001, decay: 0.6, release: 0.2 },
      harmonicity: 5.1,
      modulationIndex: 16,
      resonance: 4000,
      octaves: 1.5,
      volume: -10,
    }).connect(this._masterVol);

    this._sfxSynths.bigWin = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'square' },
      envelope: { attack: 0.01, decay: 0.5, sustain: 0.3, release: 0.5 },
      volume: -6,
    }).connect(this._masterVol);

    this._sfxSynths.ehBoom = new Tone.NoiseSynth({
      noise: { type: 'brown' },
      envelope: { attack: 0.01, decay: 1.5, sustain: 0, release: 0.5 },
      volume: -6,
    }).connect(this._masterVol);
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this._masterVol) {
      this._masterVol.mute = this.muted;
    }
    return this.muted;
  }

  playSpin() {
    if (!this.started || this.muted) return;
    this._sfxSynths.spin?.triggerAttackRelease('C4', '8n');
  }

  playWinCluster(clusterSize) {
    if (!this.started || this.muted) return;
    // Higher pitch for larger clusters
    const baseNote = clusterSize > 10 ? 'E5' : clusterSize > 7 ? 'C5' : 'G4';
    this._sfxSynths.win?.triggerAttackRelease([baseNote, 'E4'], '8n');
  }

  playCascade(comboNumber) {
    if (!this.started || this.muted) return;
    // Pitch rises with cascade depth
    const note = ['C2', 'D2', 'E2', 'F2', 'G2', 'A2', 'B2'][Math.min(comboNumber, 6)];
    this._sfxSynths.cascade?.triggerAttackRelease(note, '8n');
  }

  playMeterCharge() {
    if (!this.started || this.muted) return;
    this._sfxSynths.meter?.triggerAttackRelease('A5', '16n');
  }

  playThreshold(level) {
    if (!this.started || this.muted) return;
    this._sfxSynths.threshold?.triggerAttackRelease('16n');
  }

  playBigWin() {
    if (!this.started || this.muted) return;
    const now = Tone.now();
    this._sfxSynths.bigWin?.triggerAttackRelease(['C4', 'E4', 'G4'], '4n', now);
    this._sfxSynths.bigWin?.triggerAttackRelease(['C5', 'E5', 'G5'], '4n', now + 0.3);
  }

  playEHBoom() {
    if (!this.started || this.muted) return;
    this._sfxSynths.ehBoom?.triggerAttackRelease('2n');
  }

  /** Shift drone based on meter level */
  setDroneLevel(meterLevel) {
    if (!this._droneSynth || !this.started) return;
    // Modulation index rises with meter for increasing tension
    this._droneSynth.modulationIndex.value = 2 + meterLevel * 10;
  }

  dispose() {
    if (this._droneSynth) {
      this._droneSynth.triggerRelease();
      this._droneSynth.dispose();
    }
    for (const key of Object.keys(this._sfxSynths)) {
      this._sfxSynths[key]?.dispose();
    }
    if (this._masterVol) this._masterVol.dispose();
    this.started = false;
  }
}

// Singleton
export const AudioController = new AudioControllerClass();
