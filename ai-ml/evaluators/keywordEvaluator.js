import { weights } from "../config/weights.config.js";

import techKeywords from "../config/keywords.js";
import { normalizeSkill, normalizeSkillArray } from "../utils/skillNormalizer.js";

// --- Stop words (non-technical noise) ---
const STOP_WORDS = new Set([
  "the","and","or","with","for","in","on","at","a","an","to","of","is","are",
  "strong","modern","maintain","build","good","collaborate","participate",
  "understanding","knowledge","experience","familiarity","requirements",
  "responsibilities","working","ability","skills","developer","team",
  "existing","replaced","implementation","using","based","system","file","module",
  "looking","who","can","web","applications","such","work",
  "develop","application"
]);

// --- Normalize text ---
function normalizeText(text = "") {
  return text
    .toLowerCase()
    .replace(/[^\w\s.+#]/g, " ") // keep . + # (node.js, c++, c#)
    .replace(/\s+/g, " ")
    .trim();
}

// --- Improved Keyword Matching ---
function containsKeyword(text, keyword) {
  const k = keyword.toLowerCase();
  // For very short keywords, use word boundaries to avoid false positives (e.g., 'go' in 'mongodb')
  if (k.length <= 3) {
    const escaped = k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // This regex looks for the keyword surrounded by non-alphanumeric characters (or start/end of string)
    // but allows . + # which are common in tech (node.js, c++, c#)
    const regex = new RegExp(`(^|[^a-zA-Z0-9+#.])${escaped}([^a-zA-Z0-9+#.]|$)`, 'i');
    return regex.test(text);
  }
  return text.includes(k);
}

/**
 * Enhanced Keyword Evaluator:
 * 1. Extract keywords from JD (if provided)
 * 2. Use normalized skills from both Resume and JD for better matching
 * 3. Fallback to domain-specific keywords from config/keywords.js
 */
export const keywordEvaluator = ({
  resumeText = "",
  jobDescription = "",
  resumeSkills = [],
  jobSkills = [],
}) => {
  const lowerResume = normalizeText(resumeText);
  const lowerJD = normalizeText(jobDescription);

  // Apply Normalization to provided skill arrays
  const normResumeSkills = normalizeSkillArray(resumeSkills);
  const normJobSkills = normalizeSkillArray(jobSkills);

  // Combine JD keywords with our database keywords for broader detection
  const allDomainKeywords = Object.values(techKeywords).flat();
  
  // Extract keywords from JD by checking against our master list
  const jdKeywordsFound = allDomainKeywords.filter(k => 
    containsKeyword(lowerJD, k)
  );
  
  // Final set of keywords to search for: combination of explicit JD skills and extracted keywords
  const rawKeywordsToSearch = [...new Set([
    ...normJobSkills,
    ...jdKeywordsFound.map(k => k.toLowerCase())
  ])];

  // Normalize the search list to ensure synonyms match
  const keywordsToSearch = normalizeSkillArray(rawKeywordsToSearch);

  if (keywordsToSearch.length === 0) {
    return {
      key: "keyword_match",
      label: "Keyword Optimization",
      score: 0,
      summary: "No relevant technical keywords could be extracted from the job description.",
      details: {
        feedback: ["No extractable keywords found in the job description"],
        matchedKeywords: [],
        missingKeywords: [],
      },
      meta: {}
    };
  }

  const matchedKeywords = [];
  const missingKeywords = [];

  keywordsToSearch.forEach((keyword) => {
    // Match against normalized resume skills OR search in raw resume text
    const isMatchedInArray = normResumeSkills.includes(keyword);
    const isMatchedInText = containsKeyword(lowerResume, keyword) || 
                           (keyword === 'nodejs' && containsKeyword(lowerResume, 'node.js')) || 
                           (keyword === 'csharp' && containsKeyword(lowerResume, 'c#'));

    if (isMatchedInArray || isMatchedInText) {
      matchedKeywords.push(keyword);
    } else {
      missingKeywords.push(keyword);
    }
  });

  const total = keywordsToSearch.length;
  const score = total > 0 ? Math.round((matchedKeywords.length / total) * 100) : 100;

  const feedback = [];
  if (score < 50) {
    feedback.push("Your resume is missing many key industry keywords found in the job description.");
  } else if (score < 80) {
    feedback.push("Good keyword alignment, but adding a few more specific technologies could improve ATS ranking.");
  } else {
    feedback.push("Excellent keyword alignment with the job requirements.");
  }

  // Suggest up to 5 missing keywords in feedback
  missingKeywords.slice(0, 5).forEach(k => {
    feedback.push(`Consider adding: ${k}`);
  });

  return {
    key: "keyword_match",
    label: "Keyword Optimization",
    score,
    summary: score > 80 
      ? "Strong keyword alignment detected." 
      : `Missing ${missingKeywords.length} important keywords identified in the job description.`,
    details: {
      matchedKeywords: matchedKeywords.slice(0, 15),
      missingKeywords: missingKeywords.slice(0, 15),
      feedback
    },
    meta: {
      totalKeywordsAnalyzed: total
    }
  };
};
