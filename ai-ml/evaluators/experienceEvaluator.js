import { weights } from "../config/weights.config.js";

const roundToTwo = (value) => Number(value.toFixed(2));
// --- Normalize text ---
function normalize(text = "") {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

// --- Month mapping ---
const MONTH_MAP = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11
};

// --- Calculate months difference ---
function calculateMonths(startMonth, startYear, endMonth, endYear) {
  return (endYear - startYear) * 12 + (endMonth - startMonth);
}

// --- Extract experience in YEARS ---
export function extractExperienceInYears(text = "") {
  if (!text) return 0;

  const clean = normalize(text);
  let maxYears = 0;

  let match;

  // ================================
  // 1. DATE RANGE HANDLING (NEW 🔥)
  // ================================
  const dateRangeRegex =
    /(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s*(\d{4})\s*[-–]\s*(present|current|(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s*(\d{4}))/gi;

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  while ((match = dateRangeRegex.exec(clean))) {
    const startMonth = MONTH_MAP[match[1]];
    const startYear = parseInt(match[2]);

    let endMonth, endYear;

    if (match[3].includes("present") || match[3].includes("current")) {
      endMonth = currentMonth;
      endYear = currentYear;
    } else {
      endMonth = MONTH_MAP[match[4]];
      endYear = parseInt(match[5]);
    }

    const months = calculateMonths(startMonth, startYear, endMonth, endYear);
    const years = months / 12;

    maxYears = Math.max(maxYears, years);
  }

  // ================================
  // 2. COMBINED (1 year 6 months)
  // ================================
  const combinedRegex = /(\d+)\s*(year|years|yr|yrs)\s*(\d+)\s*(month|months|mo|mos)/g;
  while ((match = combinedRegex.exec(clean))) {
    const years = parseInt(match[1]);
    const months = parseInt(match[3]);
    maxYears = Math.max(maxYears, years + months / 12);
  }

  // ================================
  // 3. RANGE (3-5 years)
  // ================================
  const rangePattern = /(\d+(?:\.\d+)?)\s*(?:-|–|to)\s*(\d+(?:\.\d+)?)\s*\+?\s*(?:year|years|yr|yrs)/gi;
  const combinedMatchedIndices = [];
  
  for (const match of clean.matchAll(rangePattern)) {
    const lower = parseFloat(match[1]);
    const upper = parseFloat(match[2]);
    maxYears = Math.max(maxYears, (lower + upper) / 2);
    combinedMatchedIndices.push({
      start: match.index,
      end: match.index + match[0].length,
    });
  }

  const isOverlapping = (index) => 
    combinedMatchedIndices.some(range => index >= range.start && index <= range.end);

  // ================================
  // 4. PLUS (2+ years)
  // ================================
  const plusRegex = /(\d+)\+?\s*(year|years|yr|yrs)/g;
  while ((match = plusRegex.exec(clean))) {
    if (isOverlapping(match.index)) continue;
    maxYears = Math.max(maxYears, parseInt(match[1]));
  }

  // ================================
  // 5. MONTHS ONLY (18 months)
  // ================================
  const monthRegex = /(\d+)\s*(month|months|mo|mos)/g;
  while ((match = monthRegex.exec(clean))) {
    if (isOverlapping(match.index)) continue;
    maxYears = Math.max(maxYears, parseInt(match[1]) / 12);
  }

  return maxYears;
}

// --- MAIN EVALUATOR ---
export function experienceEvaluator({
  candidateExperienceText = "",
  jobDescription = "",
} = {}) {
  const candidateYears = extractExperienceInYears(candidateExperienceText);
  const requiredYears = extractExperienceInYears(jobDescription);

  if (requiredYears === 0) {
    return {
      key: "experience_match",
      label: "Experience Match",
      score: 100,
      summary: "No specific years of experience required for this role.",
      details: {
        feedback: ["Could not detect required experience from the job description"],
        candidateExperience: Number(candidateYears.toFixed(2)),
        requiredExperience: 0,
        experienceGap: 0,
      },
      meta: {}
    };
  }

  let score =
    candidateYears >= requiredYears
      ? 100
      : (candidateYears / requiredYears) * 100;

  score = Math.min(100, Number(score.toFixed(2)));

  const gap = Math.max(0, requiredYears - candidateYears);

  const feedback = [];

  if (score === 100) {
    feedback.push("Candidate meets or exceeds required experience");
  } else if (score >= 50) {
    feedback.push("Candidate experience partially matches job requirements");
  } else {
    feedback.push("Candidate has significantly less experience than required");
  }

  feedback.push(`Required experience: ${requiredYears} years`);
  feedback.push(`Candidate experience: ${candidateYears.toFixed(2)} years`);
  feedback.push(`Experience gap: ${gap.toFixed(2)} years`);

  return {
    key: "experience_match",
    label: "Experience Match",
    score,
    summary: score === 100 
      ? "Candidate meets the required experience level."
      : `Candidate is short by approximately ${gap.toFixed(1)} years of experience.`,
    details: {
      candidateExperience: Number(candidateYears.toFixed(2)),
      requiredExperience: Number(requiredYears.toFixed(2)),
      experienceGap: Number(gap.toFixed(2)),
      feedback
    },
    meta: {
      isSeniorRole: requiredYears >= 5
    }
  };
}
