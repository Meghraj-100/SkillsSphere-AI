import { normalizeSkillArray } from "../utils/skillNormalizer.js";

export const skillEvaluator = ({ resumeSkills = [], jobSkills = [] }) => {
  if (jobSkills.length === 0) {
    return {
      score: 0,
      weight: 1.0,
      feedback: ["No job skills provided for comparison"],
      matchedSkills: [],
      missingSkills: [],
      extraSkills: resumeSkills,
    };
  }

  // Use the optimized normalizer
  const normResume = normalizeSkillArray(resumeSkills);
  const normJob = normalizeSkillArray(jobSkills);

  // Matched: intersection
  const matched = normJob.filter(s => normResume.includes(s));

  // Missing from job
  const missing = normJob.filter(s => !normResume.includes(s));

  // Extra in resume
  const extra = normResume.filter(s => !normJob.includes(s));

  // Score: (matched / job.length) * 100, adjusted
  const score = jobSkills.length > 0 ? Math.round((matched.length / normJob.length) * 100) : 0;

  // Feedback
  const feedback = [];
  if (matched.length > 0) feedback.push(`Great! ${matched.length}/${normJob.length} job skills match.`);
  if (missing.length > 0) feedback.push(`Add these job skills: ${missing.slice(0,3).join(', ')}${missing.length > 3 ? '...' : ''}`);
  if (extra.length > 0) feedback.push(`Consider prioritizing job-relevant skills over extras.`);

  return {
    score,
    weight: 1.0,
    feedback,
    matchedSkills: matched,
    missingSkills: missing,
    extraSkills: extra,
  };
};

