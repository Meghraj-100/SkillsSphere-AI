import express from "express";
import { protect, authorizeRoles } from "../../middleware/authMiddleware.js";
import {
  createJobPosting,
  getRecruiterJobs,
  getJobPostingById,
  getJobs,
  getRecommendations,
  getRecruiterAnalytics,
  applyToJobPosting,
  getApplications,
  getMyApplications,
  getMyApplicationsDetailed,
} from "./controller.js";

const router = express.Router();

// Protect all routes
router.use(protect);

// Public job discovery (for all authenticated users)
router.get("/", getJobs);
router.get("/recommendations", getRecommendations);

// Recruiter-only routes
router.get("/recruiter", authorizeRoles("recruiter"), getRecruiterJobs);
router.get("/recruiter/analytics", authorizeRoles("recruiter"), getRecruiterAnalytics);
router.post("/", authorizeRoles("recruiter"), createJobPosting);

// Student application routes (must be before /:id to avoid route conflict)
router.get("/my-applications", authorizeRoles("student"), getMyApplications);
router.get("/my-applications/details", authorizeRoles("student"), getMyApplicationsDetailed);

// Job-specific routes
router
  .route("/:id")
  .get(authorizeRoles("recruiter"), getJobPostingById);

// Application routes
router.post("/:id/apply", authorizeRoles("student"), applyToJobPosting);
router.get("/:id/applications", authorizeRoles("recruiter"), getApplications);

export default router;
