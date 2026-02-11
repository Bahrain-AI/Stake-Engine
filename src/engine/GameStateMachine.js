import { GAME_STATES } from '../utils/constants.js';

/**
 * Game State Machine
 * States: IDLE → SPINNING → RESOLVING → CASCADING → WIN_DISPLAY → IDLE
 */
export class GameStateMachine {
  constructor() {
    this.state = GAME_STATES.IDLE;
    this._listeners = [];
  }

  get current() {
    return this.state;
  }

  get isIdle() {
    return this.state === GAME_STATES.IDLE;
  }

  onChange(fn) {
    this._listeners.push(fn);
    return () => {
      this._listeners = this._listeners.filter((l) => l !== fn);
    };
  }

  _transition(newState) {
    const oldState = this.state;
    this.state = newState;
    for (let i = 0; i < this._listeners.length; i++) {
      this._listeners[i](newState, oldState);
    }
  }

  startSpin() {
    if (this.state !== GAME_STATES.IDLE) return false;
    this._transition(GAME_STATES.SPINNING);
    return true;
  }

  spinComplete() {
    if (this.state !== GAME_STATES.SPINNING) return;
    this._transition(GAME_STATES.RESOLVING);
  }

  startCascade() {
    if (this.state !== GAME_STATES.RESOLVING) return;
    this._transition(GAME_STATES.CASCADING);
  }

  cascadeComplete() {
    if (this.state !== GAME_STATES.CASCADING) return;
    // Go back to resolving to re-check for clusters
    this._transition(GAME_STATES.RESOLVING);
  }

  showWin() {
    if (this.state !== GAME_STATES.RESOLVING) return;
    this._transition(GAME_STATES.WIN_DISPLAY);
  }

  returnToIdle() {
    this._transition(GAME_STATES.IDLE);
  }
}
