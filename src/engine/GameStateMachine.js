import { GAME_STATES } from '../utils/constants.js';

/**
 * Game State Machine
 * Base: IDLE → SPINNING → RESOLVING → CASCADING → WIN_DISPLAY → IDLE
 * Bonus: IDLE → EVENT_HORIZON → BONUS_ACTIVE (loops SPINNING→...→WIN_DISPLAY) → IDLE
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

  get isBonus() {
    return this.state === GAME_STATES.BONUS_ACTIVE;
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
    if (this.state !== GAME_STATES.IDLE && this.state !== GAME_STATES.BONUS_ACTIVE) return false;
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
    this._transition(GAME_STATES.RESOLVING);
  }

  showWin() {
    if (this.state !== GAME_STATES.RESOLVING) return;
    this._transition(GAME_STATES.WIN_DISPLAY);
  }

  startEventHorizon() {
    this._transition(GAME_STATES.EVENT_HORIZON);
  }

  enterBonus() {
    this._transition(GAME_STATES.BONUS_ACTIVE);
  }

  returnToIdle(inBonus = false) {
    this._transition(inBonus ? GAME_STATES.BONUS_ACTIVE : GAME_STATES.IDLE);
  }
}
