import { jdWeights, noJdWeights } from "../config/weights.config.js";

export function aggregateResults(evaluations, isJDProvided = true) {
  let totalWeight = 0;
  let weightedScoreSum = 0;
  const breakdown = {};

  // Dynamic Weights Map
  const weights = isJDProvided ? jdWeights : noJdWeights;

  evaluations.forEach((evalResult) => {
    if (!evalResult || (evalResult.score === null && isJDProvided)) return;

    // Use dynamic weight defined in the map, default to 0
    const weight = weights[evalResult.name] || 0;

    // Pass resolved weight back into each evaluator result
    evalResult.weight = weight;
    evalResult.weightedScore = evalResult.score !== null ? Math.round(evalResult.score * weight) : 0;

    if (weight > 0 && evalResult.score !== null) {
      totalWeight += weight;
      weightedScoreSum += evalResult.score * weight;
    }

    breakdown[evalResult.name] = evalResult.score;
  });

  const finalScore =
    totalWeight > 0 ? Math.round(weightedScoreSum / totalWeight) : 0;

  return {
    score: finalScore,
    breakdown,
  };
}

