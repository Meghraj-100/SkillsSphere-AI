import { z } from 'zod';

export const renameResumeSchema = z.object({
  name: z.string({ required_error: "Name is required" }).min(1, "Name cannot be empty")
});

export const compareResumesSchema = z.object({
  versionAId: z.string({ required_error: "versionAId is required" }),
  versionBId: z.string({ required_error: "versionBId is required" })
});

export const generateCoverLetterSchema = z.object({
  jobDescription: z.string({ required_error: "Job description is required" }).min(10, "Job description must be at least 10 characters")
});
