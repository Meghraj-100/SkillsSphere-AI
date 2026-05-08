import mongoose from "mongoose";

const jobApplicationSchema = new mongoose.Schema(
  {
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "JobPosting",
      required: [true, "Job reference is required"],
      index: true,
    },

    applicant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Applicant reference is required"],
      index: true,
    },

    resume: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Resume",
      default: null,
    },

    status: {
      type: String,
      enum: ["pending", "reviewed", "shortlisted", "rejected", "withdrawn"],
      default: "pending",
    },

    coverNote: {
      type: String,
      trim: true,
      maxlength: [1000, "Cover note cannot exceed 1000 characters"],
      default: "",
    },
  },
  { timestamps: true }
);

// Prevent duplicate applications: one applicant per job
jobApplicationSchema.index({ job: 1, applicant: 1 }, { unique: true });

// Index for recruiter analytics queries
jobApplicationSchema.index({ job: 1, status: 1 });

const JobApplication = mongoose.model("JobApplication", jobApplicationSchema);
export default JobApplication;
