import mongoose from "mongoose";
import JobPosting from "../../database/models/JobPosting.js";
import JobApplication from "../../database/models/JobApplication.js";
import * as resumeService from "../resumes/service.js";
import * as matchingService from "../matching/service.js";
import { generateRecommendations } from "../../../../ai-ml/pipeline/recommendationEngine.js";
import AppError from "../../utils/AppError.js";

/**
 * Create a new job posting
 * @param {Object} jobData - Job data
 * @param {string} recruiterId - ID of the recruiter posting the job
 * @returns {Promise<Object>} - Created job
 */
export const createJob = async (jobData, recruiterId) => {
  const job = await JobPosting.create({
    ...jobData,
    recruiter: recruiterId,
  });
  return job;
};

/**
 * Get all published jobs with optional filtering
 * @param {Object} queryParams - Query filters (minSalary, maxSalary, designation, postedWithin)
 * @returns {Promise<Array>} - List of jobs
 */
export const getAllJobs = async (queryParams = {}) => {
  const { minSalary, maxSalary, designation, postedWithin } = queryParams;

  // Base filter: only show open jobs
  const filters = { status: "open" };

  // Filter by designation (case-insensitive regex search on title)
  if (designation) {
    filters.title = { $regex: designation, $options: "i" };
  }

  // Filter by Salary Range
  if (minSalary || maxSalary) {
    // If minSalary is provided, ensure job's min salary is >= minSalary
    // Or more commonly: ensure the job's max salary is at least the user's min expectation
    if (minSalary) {
      filters["salary.min"] = { $gte: Number(minSalary) };
    }
    if (maxSalary) {
      filters["salary.max"] = { $lte: Number(maxSalary) };
    }
  }

  // Filter by Date Posted
  if (postedWithin) {
    const now = new Date();
    let cutoffDate;

    switch (postedWithin) {
      case "1d":
        cutoffDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case "7d":
        cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "30d":
        cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        cutoffDate = null;
    }

    if (cutoffDate) {
      filters.createdAt = { $gte: cutoffDate };
    }
  }

  const jobs = await JobPosting.find(filters)
    .populate("recruiter", "name email company")
    .sort("-createdAt");

  return jobs;
};

/**
 * Get job by ID
 * @param {string} id - Job ID
 * @returns {Promise<Object>} - Job details
 */
export const getJobById = async (id) => {
  const job = await JobPosting.findById(id).populate("recruiter", "name email company");

  if (!job) {
    throw new AppError("Job not found", 404);
  }

  return job;
};

/**
 * Update a job posting
 * @param {string} id - Job ID
 * @param {Object} updateData - Data to update
 * @param {string} recruiterId - ID of the recruiter
 * @returns {Promise<Object>} - Updated job
 */
export const updateJob = async (id, updateData, recruiterId) => {
  const job = await JobPosting.findById(id);

  if (!job) {
    throw new AppError("Job not found", 404);
  }

  // Check if the recruiter owns this job
  if (job.recruiter.toString() !== recruiterId.toString()) {
    throw new AppError("You do not have permission to update this job", 403);
  }

  const updatedJob = await JobPosting.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });

  return updatedJob;
};

/**
 * Delete a job posting
 * @param {string} id - Job ID
 * @param {string} recruiterId - ID of the recruiter
 * @returns {Promise<void>}
 */
export const deleteJob = async (id, recruiterId) => {
  const job = await JobPosting.findById(id);

  if (!job) {
    throw new AppError("Job not found", 404);
  }

  // Check if the recruiter owns this job
  if (job.recruiter.toString() !== recruiterId.toString()) {
    throw new AppError("You do not have permission to delete this job", 403);
  }

  await JobPosting.findByIdAndDelete(id);
};

/**
 * Get personalized job recommendations for a student based on their resume.
 * 
 * @param {Object} user - The authenticated user object
 * @returns {Promise<Object>} Recommendations and status message
 */
export const getJobRecommendations = async (user) => {
  // 1. Get the latest parsed resume for the user
  const resume = await resumeService.getLatestResume(user._id, true);

  if (!resume) {
    return {
      success: true,
      message: "Please upload a resume to see personalized matches.",
      jobs: [],
      hasResume: false
    };
  }

  // 2. Perform fresh matching evaluation using the new AI/ML Recommendation Engine
  const openJobs = await JobPosting.find({ status: "open" });
  const rankedResults = await generateRecommendations(resume, openJobs);

  // 3. Persist the MatchResult for analytics (keeping sync with matching module)
  await matchingService.evaluateMatches(user, resume);

  if (!rankedResults || rankedResults.length === 0) {
    return {
      success: true,
      message: "No suitable jobs found matching your profile yet.",
      jobs: [],
      hasResume: true
    };
  }

  // Format the results for the API response
  // We re-attach the full job details from the DB
  const jobMap = new Map(openJobs.map(j => [j._id.toString(), j]));
  
  const jobsWithDetails = rankedResults.map(rec => ({
    ...jobMap.get(rec.jobId.toString())._doc,
    matchScore: rec.score,
    matchBreakdown: rec.breakdown,
    relevanceInsights: rec.relevanceInsights
  }));

  return {
    success: true,
    message: "Personalized matches found by SkillSphere AI",
    jobs: jobsWithDetails,
    hasResume: true
  };
};

/**
 * Get aggregated analytics for a recruiter's job postings
 * @param {string} recruiterId - ID of the recruiter
 * @returns {Promise<Object>} - Analytics data
 */
export const getRecruiterAnalytics = async (recruiterId) => {
  // Get all jobs for this recruiter
  const allJobs = await JobPosting.find({ recruiter: recruiterId })
    .sort({ createdAt: -1 })
    .lean();

  // Status breakdown
  const statusBreakdown = { open: 0, draft: 0, closed: 0 };
  allJobs.forEach((job) => {
    const status = job.status || "draft";
    if (statusBreakdown[status] !== undefined) {
      statusBreakdown[status] += 1;
    }
  });

  // Jobs by month (last 6 months)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const jobsByMonthAgg = await JobPosting.aggregate([
    {
      $match: {
        recruiter: new mongoose.Types.ObjectId(recruiterId),
        createdAt: { $gte: sixMonthsAgo },
      },
    },
    {
      $group: {
        _id: {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { "_id.year": 1, "_id.month": 1 } },
  ]);

  const jobsByMonth = jobsByMonthAgg.map((item) => ({
    month: `${item._id.year}-${String(item._id.month).padStart(2, "0")}`,
    count: item.count,
  }));

  // Top skills across all jobs
  const skillCount = {};
  allJobs.forEach((job) => {
    (job.skills || []).forEach((skill) => {
      const normalized = skill.toLowerCase().trim();
      if (normalized) {
        skillCount[normalized] = (skillCount[normalized] || 0) + 1;
      }
    });
  });

  const topSkills = Object.entries(skillCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([skill, count]) => ({ skill, count }));

  // Recent jobs (last 5)
  const recentJobs = allJobs.slice(0, 5).map((job) => ({
    _id: job._id,
    title: job.title,
    status: job.status,
    location: job.location,
    salary: job.salary,
    createdAt: job.createdAt,
  }));

  return {
    totalJobs: allJobs.length,
    statusBreakdown,
    jobsByMonth,
    topSkills,
    recentJobs,
  };
};

/**
 * Apply to a job posting (for students)
 * @param {string} jobId - ID of the job
 * @param {string} applicantId - ID of the student
 * @param {Object} options - Optional fields (resumeId, coverNote)
 * @returns {Promise<Object>} - Created application
 */
export const applyToJob = async (jobId, applicantId, options = {}) => {
  const job = await JobPosting.findById(jobId);
  if (!job) {
    throw new AppError("Job not found", 404);
  }

  if (job.status !== "open") {
    throw new AppError("This job is not accepting applications", 400);
  }

  // Check for duplicate application
  const existing = await JobApplication.findOne({ job: jobId, applicant: applicantId });
  if (existing) {
    throw new AppError("You have already applied to this job", 409);
  }

  const application = await JobApplication.create({
    job: jobId,
    applicant: applicantId,
    resume: options.resumeId || null,
    coverNote: options.coverNote || "",
  });

  return application;
};

/**
 * Get all applications for a specific job (for recruiters)
 * @param {string} jobId - ID of the job
 * @param {string} recruiterId - ID of the recruiter (for ownership check)
 * @returns {Promise<Array>} - List of applications
 */
export const getJobApplications = async (jobId, recruiterId) => {
  const job = await JobPosting.findById(jobId);
  if (!job) {
    throw new AppError("Job not found", 404);
  }

  if (job.recruiter.toString() !== recruiterId.toString()) {
    throw new AppError("You do not have permission to view these applications", 403);
  }

  const applications = await JobApplication.find({ job: jobId })
    .populate("applicant", "name email")
    .populate("resume", "fileName")
    .sort({ createdAt: -1 });

  return applications;
};

/**
 * Get applicant analytics for a recruiter's jobs
 * @param {string} recruiterId - ID of the recruiter
 * @returns {Promise<Object>} - Applicant analytics
 */
export const getApplicantAnalytics = async (recruiterId) => {
  // Get all jobs for this recruiter
  const recruiterJobIds = await JobPosting.find({ recruiter: recruiterId })
    .select("_id")
    .lean();
  const jobIds = recruiterJobIds.map((j) => j._id);

  if (jobIds.length === 0) {
    return {
      totalApplicants: 0,
      applicantsByStatus: { pending: 0, reviewed: 0, shortlisted: 0, rejected: 0 },
      applicantsPerJob: [],
    };
  }

  // Total applicant count
  const totalApplicants = await JobApplication.countDocuments({ job: { $in: jobIds } });

  // Applicants by status
  const statusAgg = await JobApplication.aggregate([
    { $match: { job: { $in: jobIds } } },
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);

  const applicantsByStatus = { pending: 0, reviewed: 0, shortlisted: 0, rejected: 0 };
  statusAgg.forEach((item) => {
    if (applicantsByStatus[item._id] !== undefined) {
      applicantsByStatus[item._id] = item.count;
    }
  });

  // Applicants per job (top 10 by count)
  const perJobAgg = await JobApplication.aggregate([
    { $match: { job: { $in: jobIds } } },
    { $group: { _id: "$job", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 10 },
    {
      $lookup: {
        from: "jobpostings",
        localField: "_id",
        foreignField: "_id",
        as: "jobInfo",
      },
    },
    { $unwind: "$jobInfo" },
    {
      $project: {
        _id: 1,
        count: 1,
        title: "$jobInfo.title",
        status: "$jobInfo.status",
      },
    },
  ]);

  return {
    totalApplicants,
    applicantsByStatus,
    applicantsPerJob: perJobAgg,
  };
};
