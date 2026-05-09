/**
 * Evaluates the "Impact" of a resume by looking for quantifiable achievements.
 * Searches for metrics like percentages, currency, multipliers, and time.
 */
export const impactEvaluator = ({ resumeText = "" }) => {
  const metrics = {
    percentage: /(?:\d+%|percent)/gi,
    currency: /(?:\$|usd|inr|€|£)\s?\d+(?:[kKmMbB]|\s?million|billion)?/gi,
    multiplier: /\d+x/gi,
    numbers: /(?:\bmanaged\b|\bscaled\b|\bled\b|\bsaved\b|\breduced\b|\bincreased\b)\s+\d+/gi,
  };

  const actionVerbs = [
    "pioneered", "orchestrated", "transformed", "architected", 
    "spearheaded", "revitalized", "overhauled", "surpassed"
  ];

  const findings = {
    percentage: resumeText.match(metrics.percentage) || [],
    currency: resumeText.match(metrics.currency) || [],
    multiplier: resumeText.match(metrics.multiplier) || [],
    numbers: resumeText.match(metrics.numbers) || [],
    powerVerbs: actionVerbs.filter(verb => resumeText.toLowerCase().includes(verb))
  };

  const totalFindings = 
    findings.percentage.length + 
    findings.currency.length + 
    findings.multiplier.length + 
    findings.numbers.length;
  
  const powerVerbCount = findings.powerVerbs.length;

  let score = 0;
  const feedback = [];

  // Base score for power verbs (up to 30 points)
  score += Math.min(30, powerVerbCount * 5);

  // Metric score (up to 70 points)
  if (totalFindings >= 6) score += 70;
  else if (totalFindings >= 3) score += 50;
  else if (totalFindings >= 1) score += 20;

  score = Math.round(score);

  if (score >= 80) {
    feedback.push("Excellent impact! You use both strong action verbs and quantifiable metrics.");
  } else if (score >= 40) {
    feedback.push("Good professional tone, but lacks enough data-driven results. Try to quantify more accomplishments.");
  } else {
    feedback.push("Your resume is descriptive but lacks measurable impact. Recruiters look for numbers and results.");
  }

  const suggestions = [];
  if (score < 100) {
    suggestions.push("Identify 3 key projects and add specific numbers (e.g., users reached, money saved, time reduced).");
    suggestions.push("Use phrases like 'resulting in', 'achieved by', or 'led to' followed by a metric.");
  }

  return {
    key: "impact_match",
    label: "Measurable Impact",
    score,
    summary: score > 80 
      ? "Strong evidence of quantifiable impact." 
      : "The resume describes duties but lacks enough quantifiable results (numbers, %, $).",
    details: {
      totalFindings,
      findings,
      feedback,
      suggestions
    },
    meta: {
      powerVerbCount
    }
  };
};
