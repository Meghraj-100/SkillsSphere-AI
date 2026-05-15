import JobPosting from "../../database/models/JobPosting.js";
import MatchResult from "../../database/models/MatchResult.js";
import { runPipeline } from "../../../../ai-ml/pipeline/runPipeline.js";

/**
 * Evaluate a resume against all open jobs and return ranked recommendations.
 * 
 * @param {Object} user - The user object
 * @param {Object} resume - The parsed resume data (Mongoose document)
 * @returns {Promise<Object>} The saved MatchResult document
 */
export const evaluateMatches = async (user, resume) => {
  // 1. Fetch all open jobs
  const openJobs = await JobPosting.find({ status: "open" });

  // 2. Evaluate each job using the AI/ML pipeline in parallel
  console.time(`Matching evaluation for ${openJobs.length} jobs`);
  const recommendations = await Promise.all(
    openJobs.map(async (job) => {
      const pipelineResult = await runPipeline({
        resumeData: resume,
        jobSkills: job.skills,
        jobDescription: job.description,
      });

      return {
        job: job._id,
        score: pipelineResult.score,
        breakdown: pipelineResult.breakdown,
        skillMatch: pipelineResult.skillMatch,
        keywordMatch: pipelineResult.keywordMatch,
        experienceMatch: pipelineResult.experienceMatch,
      };
    })
  );
  console.timeEnd(`Matching evaluation for ${openJobs.length} jobs`);

  // 3. Sort by score (highest first)
  recommendations.sort((a, b) => b.score - a.score);

  // 4. Persist MatchResult for analytics and retrieval
  const matchResult = await MatchResult.create({
    user: user._id,
    resume: resume._id,
    recommendations,
  });

  return matchResult;
};

/**
 * Fetch the latest ranked recommendations for a user.
 * 
 * @param {string} userId - The ID of the user
 * @returns {Promise<Object|null>} The latest MatchResult document with populated job details
 */
export const getLatestRecommendations = async (userId) => {
  return await MatchResult.findOne({ user: userId })
    .sort({ createdAt: -1 })
    .populate("recommendations.job")
    .lean();
};
