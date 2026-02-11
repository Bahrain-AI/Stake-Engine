import { PAY_TABLE } from '../utils/constants.js';

/**
 * Get the pay tier index from cluster size.
 * Tiers: 0 = 5-7, 1 = 8-11, 2 = 12-15, 3 = 16+
 */
function getPayTier(size) {
  if (size >= 16) return 3;
  if (size >= 12) return 2;
  if (size >= 8) return 1;
  return 0; // 5-7
}

/**
 * Calculate the win multiplier for a single cluster.
 * Returns the bet multiplier (e.g. 2.0 = 2x bet).
 */
export function clusterPay(cluster) {
  const payRow = PAY_TABLE[cluster.symbolType];
  if (!payRow) return 0; // WILD/SCATTER don't have their own pay
  const tier = getPayTier(cluster.size);
  return payRow[tier];
}

/**
 * Calculate total win from all clusters in a cascade step.
 * Returns { totalMultiplier, clusterWins: [{ symbolType, size, multiplier }] }
 */
export function calculateStepWin(clusters) {
  let totalMultiplier = 0;
  const clusterWins = [];

  for (const cluster of clusters) {
    const mult = clusterPay(cluster);
    totalMultiplier += mult;
    clusterWins.push({
      symbolType: cluster.symbolType,
      size: cluster.size,
      multiplier: mult,
    });
  }

  return { totalMultiplier, clusterWins };
}

/**
 * Calculate the total win from all cascade steps.
 * betAmount is in dollars.
 * Returns { totalWin, steps: [{ multiplier, clusterWins }] }
 */
export function calculateTotalWin(cascadeSteps, betAmount) {
  let totalWin = 0;
  const steps = [];

  for (const step of cascadeSteps) {
    const result = calculateStepWin(step.clusters);
    const stepWin = result.totalMultiplier * betAmount;
    totalWin += stepWin;
    steps.push({
      multiplier: result.totalMultiplier,
      clusterWins: result.clusterWins,
      win: stepWin,
    });
  }

  return { totalWin, steps };
}
