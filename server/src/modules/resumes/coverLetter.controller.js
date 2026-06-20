import Resume from "../../database/models/Resume.js";
import CoverLetter from "../../database/models/CoverLetter.js";
import { buildCoverLetterPrompt } from "../../utils/coverLetterPromptBuilder.js";
import { generateCoverLetter } from "../../utils/geminiService.js";
import { COVER_LETTER_LIMIT } from "../../validations/coverLetterValidation.js";

import logger from "../../utils/logger.js";
import AppError from "../../utils/AppError.js";

/**
 * Generate an AI cover letter based on a parsed resume and a target job description.
 */
export const generateCoverLetterForResume = async (req, res, next) => {
  try {
    const resumeId = req.params.id;
    const { jobDescription, tone, language } = req.body;
    const userId = req.user?.id || req.user?._id;

    if (!jobDescription?.trim()) {
      return next(new AppError("Job description is required to generate a targeted cover letter.", 400));
    }

    const resume = await Resume.findById(resumeId);
    if (!resume) {
      return next(new AppError("Resume not found.", 404));
    }

    // Security check: ensure the user owns the resume
    if (resume.user.toString() !== userId.toString()) {
      return next(new AppError("Unauthorized access to this resume.", 403));
    }

    const coverLetterCount = await CoverLetter.countDocuments({ user: userId });
    if (coverLetterCount >= COVER_LETTER_LIMIT) {
      return next(new AppError(`Maximum limit of ${COVER_LETTER_LIMIT} cover letters reached. Please delete an existing one to generate a new one.`, 400));
    }

    logger.debug("[cover-letter] Building prompt", {
      resumeId: resume._id?.toString(),
      userId: userId?.toString(),
      jobDescriptionLength: jobDescription.length,
      tone: tone || "default",
      language: language || "default",
    });

    // Build the dynamic prompt using the parsed resume data
    const prompt = buildCoverLetterPrompt({
      resumeData: resume,
      analysisData: {
        skills: { present: resume.skills },
        atsAnalysis: resume.atsOptimization
      },
      jobDescription,
      tone,
      language
    });

    // Generate the cover letter using the Gemini service
    const aiResult = await generateCoverLetter(prompt);

    logger.debug("[cover-letter] Generation completed", {
      resumeId: resume._id?.toString(),
      userId: userId?.toString(),
      success: Boolean(aiResult.success),
      generatedTextLength: aiResult.text?.length || 0,
    });

    if (!aiResult.success) {
      return next(new AppError(aiResult.error || "Unknown AI Generation Error", 500));
    }

    // Persist the generated cover letter to the database
    const newCoverLetter = new CoverLetter({
      user: userId,
      resume: resumeId,
      jobDescription,
      generatedText: aiResult.text
    });

    await newCoverLetter.save();

    // Return the successful response
    return res.status(200).json({
      success: true,
      coverLetter: newCoverLetter
    });
  } catch (error) {
    logger.error("Cover Letter Generation Error:", error);
    return next(new AppError(error.message || "Failed to generate cover letter", 500));
  }
};
