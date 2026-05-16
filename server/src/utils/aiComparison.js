import OpenAI from 'openai';
import dotenv from 'dotenv';
dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Generates a strategic comparison between two resume versions.
 */
export const generateComparisonInsights = async (v1, v2) => {
  if (!process.env.OPENAI_API_KEY) {
    return "AI-powered strategic insights are currently unavailable (missing API key). However, structural improvements in skills and gaps are visible in the diff below.";
  }

  const prompt = `
    Compare these two resume analysis versions and provide a strategic career growth summary.
    
    Version 1 (Older):
    - Score: ${v1.score}%
    - Classification: ${v1.classification}
    - Skills: ${v1.skills?.join(', ') || 'N/A'}
    - Missing Skills: ${v1.missingSkills?.join(', ') || 'N/A'}
    
    Version 2 (Newer):
    - Score: ${v2.score}%
    - Classification: ${v2.classification}
    - Skills: ${v2.skills?.join(', ') || 'N/A'}
    - Missing Skills: ${v2.missingSkills?.join(', ') || 'N/A'}
    
    Provide a concise (3-4 sentence) strategic summary of the evolution. 
    Focus on which additions were most impactful and what the student should prioritize next.
    Keep the tone professional and encouraging.
  `;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are an expert career coach and technical recruiter." },
        { role: "user", content: prompt }
      ],
      max_tokens: 200,
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error("AI Comparison Error:", error);
    return "Unable to generate AI insights at this time. Structural diff is available below.";
  }
};
