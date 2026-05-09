/**
 * Evaluator weights configuration
 * All weights must sum to 1.0 for proper aggregation
 */

export const jdWeights = {
  skillMatch: 0.15,
  semanticMatch: 0.20,
  keywordMatch: 0.15,
  experienceMatch: 0.10,
  impactMatch: 0.15,
  atsOptimization: 0.10,
  readabilityMatch: 0.10,
  consistencyMatch: 0.05,
  techStandard: 0.00,
};

export const noJdWeights = {
  skillMatch: 0.00,
  semanticMatch: 0.00,
  keywordMatch: 0.00,
  experienceMatch: 0.00,
  impactMatch: 0.40,
  atsOptimization: 0.30,
  readabilityMatch: 0.15,
  consistencyMatch: 0.10,
  techStandard: 0.05,
};

// Verify weights sum to 1.0
const totalJdWeight = Object.values(jdWeights).reduce((sum, w) => sum + w, 0);
if (Math.abs(totalJdWeight - 1.0) > 0.001) {
  console.warn(`Warning: JD Weights sum to ${totalJdWeight}, expected 1.0`);
}

const totalNoJdWeight = Object.values(noJdWeights).reduce((sum, w) => sum + w, 0);
if (Math.abs(totalNoJdWeight - 1.0) > 0.001) {
  console.warn(`Warning: No-JD Weights sum to ${totalNoJdWeight}, expected 1.0`);
}
