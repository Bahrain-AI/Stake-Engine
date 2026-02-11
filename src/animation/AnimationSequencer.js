/**
 * Queue-based animation system.
 * Supports sequential and parallel playback.
 * Each animation: { start(), update(delta), isComplete(), onComplete? }
 */
export class AnimationSequencer {
  constructor() {
    this.queue = [];
    this.active = [];
    this._onEmptyCallbacks = [];
  }

  /** Add animation to sequential queue */
  enqueue(animation) {
    this.queue.push(animation);
  }

  /** Start next animation from queue */
  playNext() {
    if (this.queue.length === 0) {
      this._fireEmpty();
      return;
    }
    const anim = this.queue.shift();
    this.active.push(anim);
    anim.start();
  }

  /** Play all provided animations simultaneously */
  playParallel(animations) {
    for (let i = 0; i < animations.length; i++) {
      this.active.push(animations[i]);
      animations[i].start();
    }
  }

  /** Play a single animation immediately (not queued) */
  playImmediate(animation) {
    this.active.push(animation);
    animation.start();
  }

  /** Update all active animations */
  update(delta) {
    for (let i = this.active.length - 1; i >= 0; i--) {
      const anim = this.active[i];
      anim.update(delta);
      if (anim.isComplete()) {
        this.active.splice(i, 1);
        if (anim.onComplete) anim.onComplete();
      }
    }

    // Auto-advance queue when current completes
    if (this.active.length === 0 && this.queue.length > 0) {
      this.playNext();
    } else if (this.active.length === 0 && this.queue.length === 0) {
      this._fireEmpty();
    }
  }

  get isPlaying() {
    return this.active.length > 0 || this.queue.length > 0;
  }

  /** Register callback for when all animations finish */
  onEmpty(fn) {
    this._onEmptyCallbacks.push(fn);
  }

  /** Remove all onEmpty callbacks */
  clearOnEmpty() {
    this._onEmptyCallbacks = [];
  }

  _fireEmpty() {
    const cbs = this._onEmptyCallbacks.slice();
    this._onEmptyCallbacks = [];
    for (let i = 0; i < cbs.length; i++) {
      cbs[i]();
    }
  }

  /** Clear all animations */
  clear() {
    this.queue = [];
    this.active = [];
    this._onEmptyCallbacks = [];
  }
}
