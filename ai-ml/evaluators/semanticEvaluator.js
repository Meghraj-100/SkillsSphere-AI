import OpenAI from "openai";
import { weights } from "../config/weights.config.js";

const cosineSimilarity = (a, b) => {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length || a.length === 0) {
    throw new Error("Invalid embeddings for cosine similarity");
  }

  let dot = 0;
  let magA = 0;
  let magB = 0;

  for (let i = 0; i < a.length; i += 1) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }

  const denominator = Math.sqrt(magA) * Math.sqrt(magB);
  if (!denominator) return 0;

  return dot / denominator;
};

const roundToTwo = (value) => Number(value.toFixed(2));

const getOpenAIClient = () => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY environment variable is not set");
  }

  return new OpenAI({ apiKey });
};

const generateEmbedding = async (text) => {
  if (!text || typeof text !== "string" || text.trim().length === 0) {
    throw new Error("Invalid text input for embedding generation");
  }

  const openai = getOpenAIClient();
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text.trim(),
  });

  if (!response.data || response.data.length === 0 || !response.data[0].embedding) {
    throw new Error("Failed to generate embedding from OpenAI API");
  }

  return response.data[0].embedding;
};

const WEIGHT = weights.semantic ?? 0.20;
const KEY = "semanticMatch";
const LABEL = "Semantic Match";

const buildFeedback = (score) => {
  if (score >= 85) {
    return "Strong semantic alignment between the resume and job description.";
  }
  if (score >= 65) {
    return "Moderate semantic alignment with several conceptually related skills and experiences.";
  }
  if (score >= 40) {
    return "Some semantic overlap is present, but the match is limited.";
  }
  return "Low semantic alignment between the resume and job description.";
};

export const semanticEvaluator = async ({ resumeText = "", jobDescription = "" }) => {
  if (!resumeText || typeof resumeText !== "string" || resumeText.trim().length === 0) {
    return {
      key: KEY,
      label: LABEL,
      score: 0,
      summary: "Semantic evaluation could not run because resume text was missing.",
      details: {},
      meta: {}
    };
  }

  if (!jobDescription || typeof jobDescription !== "string" || jobDescription.trim().length === 0) {
    return {
      key: KEY,
      label: LABEL,
      score: 0,
      summary: "Semantic evaluation could not run because job description was missing.",
      details: {},
      meta: {}
    };
  }

  const trimmedResume = resumeText.trim();
  const trimmedJob = jobDescription.trim();

  try {
    const [resumeEmbedding, jobEmbedding] = await Promise.all([
      generateEmbedding(trimmedResume),
      generateEmbedding(trimmedJob),
    ]);

    const similarity = cosineSimilarity(resumeEmbedding, jobEmbedding);
    const normalized = Math.max(0, Math.min(1, similarity));
    const score = roundToTwo(normalized * 100);

    const feedback = buildFeedback(score);

    return {
      key: KEY,
      label: LABEL,
      score,
      summary: feedback,
      details: {
        similarityRaw: similarity,
      },
      meta: {
        model: "text-embedding-3-small"
      }
    };
  } catch (error) {
    throw new Error(`Semantic evaluation failed: ${error.message}`);
  }
};
