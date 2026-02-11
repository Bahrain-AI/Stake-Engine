import { clamp } from '../utils/mathHelpers.js';

/**
 * Singularity Meter — tracks charge level from 0 to 100.
 *
 * Charge rates by cluster size:
 *   5-7:  +5
 *   8-11: +10
 *   12-15: +20
 *   16+:   +35
 *
 * Decay: -5 per non-winning spin, floor at 0
 * Thresholds fire events at 25%, 50%, 75%, 100%
 */

const CHARGE_RATES = [
  { min: 5, max: 7, charge: 5 },
  { min: 8, max: 11, charge: 10 },
  { min: 12, max: 15, charge: 20 },
  { min: 16, max: Infinity, charge: 35 },
];

const DECAY_AMOUNT = 5;
const THRESHOLDS = [25, 50, 75, 100];

export class SingularityMeter {
  constructor() {
    this.value = 0; // 0-100
    this._previousThreshold = 0; // last crossed threshold index
    this._listeners = [];
  }

  get percent() {
    return this.value / 100;
  }

  get level() {
    if (this.value >= 100) return 4;
    if (this.value >= 75) return 3;
    if (this.value >= 50) return 2;
    if (this.value >= 25) return 1;
    return 0;
  }

  /** Register threshold event listener: fn(thresholdValue, meterValue) */
  onThreshold(fn) {
    this._listeners.push(fn);
    return () => {
      this._listeners = this._listeners.filter((l) => l !== fn);
    };
  }

  /**
   * Charge the meter based on cluster size.
   * Returns the amount charged and any newly crossed thresholds.
   */
  chargeFromCluster(clusterSize) {
    let chargeAmount = 0;
    for (const rate of CHARGE_RATES) {
      if (clusterSize >= rate.min && clusterSize <= rate.max) {
        chargeAmount = rate.charge;
        break;
      }
    }

    const oldValue = this.value;
    this.value = clamp(this.value + chargeAmount, 0, 100);

    const crossedThresholds = this._checkThresholds(oldValue, this.value);
    return { charged: chargeAmount, crossedThresholds };
  }

  /**
   * Charge from all clusters in a cascade step.
   */
  chargeFromClusters(clusters) {
    const results = [];
    for (const cluster of clusters) {
      results.push(this.chargeFromCluster(cluster.size));
    }
    return results;
  }

  /**
   * Decay on non-winning spin.
   */
  decay() {
    const oldValue = this.value;
    this.value = clamp(this.value - DECAY_AMOUNT, 0, 100);
    // Recalculate threshold index on decay
    this._previousThreshold = this._getThresholdIndex(this.value);
    return oldValue - this.value;
  }

  /**
   * Set meter to a specific value (for debug/bonus buy).
   */
  set(val) {
    const oldValue = this.value;
    this.value = clamp(val, 0, 100);
    this._checkThresholds(oldValue, this.value);
  }

  reset() {
    this.value = 0;
    this._previousThreshold = 0;
  }

  _getThresholdIndex(val) {
    for (let i = THRESHOLDS.length - 1; i >= 0; i--) {
      if (val >= THRESHOLDS[i]) return i + 1;
    }
    return 0;
  }

  _checkThresholds(oldValue, newValue) {
    const crossed = [];
    for (const t of THRESHOLDS) {
      if (oldValue < t && newValue >= t) {
        crossed.push(t);
        for (const fn of this._listeners) {
          fn(t, newValue);
        }
      }
    }
    return crossed;
  }
}
