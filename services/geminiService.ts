import { GoogleGenAI, Type } from "@google/genai";
import { QuestionType, AIQuizGenerationParams, Language } from "../types";

// Vite environment variables must be prefixed with VITE_ and accessed via import.meta.env
const apiKey = import.meta.env.VITE_API_KEY || '';

export const generateAIQuiz = async (params: AIQuizGenerationParams) => {
  if (!apiKey) {
    console.warn("No API Key found. Returning mock data.");
    return getMockQuizData();
  }

  const ai = new GoogleGenAI({ apiKey });

  // Format the breakdown of questions
  const typeBreakdown = Object.entries(params.typeCounts)
    .map(([type, count]) => `${count} questions of type ${type}`)
    .join(', ');

  // Construct prompt with explicit language instructions
  const languageInstruction = params.language === Language.AR
    ? `
    LANGUAGE REQUIREMENT - CRITICAL:
    - Generate ALL content in ARABIC language (العربية)
    - This includes: question text, all options, correct answers, and explanations
    - Use proper Arabic grammar and vocabulary
    - Ensure all text is suitable for RTL (Right-to-Left) display
    - Use Arabic numerals (١، ٢، ٣) where appropriate
    `
    : `
    LANGUAGE REQUIREMENT:
    - Generate ALL content in ENGLISH language
    - This includes: question text, all options, correct answers, and explanations
    `;

  const prompt = `
    ${languageInstruction}
    
    CRITICAL: You are creating a quiz based EXCLUSIVELY on the content in the attached images/files.
    
    EXTRACTION RULES:
    1. READ the attached images/files CAREFULLY and extract questions EXACTLY as they appear
    2. If the image contains existing questions, use those questions VERBATIM (but translate to ${params.language} if needed)
    3. If the image contains educational content (text, diagrams, etc.), create questions that DIRECTLY test understanding of that SPECIFIC content
    4. DO NOT create generic questions - every question must be directly related to the uploaded content
    5. Use the exact terminology, names, numbers, and facts from the images
    6. If there are diagrams or charts, create questions about the SPECIFIC data shown
    
    Additional Context/Instructions: ${params.topic}
    (Use this ONLY as supplementary instructions, NOT as the primary source of content)
    
    Target Grade Level: ${params.gradeLevel}
    Difficulty: ${params.difficulty}
    
    Generate exactly the following distribution of questions:
    ${typeBreakdown}
    
    QUESTION FORMAT REQUIREMENTS:
    ⚠️ CRITICAL: EVERY question MUST have a 'correct_answer' field set. This is MANDATORY!
    ⚠️ ALL TEXT MUST BE IN ${params.language.toUpperCase()}!
    
    1. 'TRUE_FALSE': 
       - Provide 'options': ${params.language === Language.AR ? '["صحيح", "خطأ"]' : '["True", "False"]'}
       - Set 'correct_answer' to either ${params.language === Language.AR ? '"صحيح" or "خطأ"' : '"True" or "False"'}
       
    2. 'SINGLE_CHOICE': 
       - Provide 3-4 plausible options in 'options' array (in ${params.language})
       - Set 'correct_answer' to the EXACT text of the correct option
       
    3. 'MULTIPLE_CHOICE': 
       - Provide 3-4 options in 'options' array (in ${params.language})
       - Set 'correct_answer' to a comma-separated string of correct options
       
    4. 'ORDERING': 
       - Provide correct order in 'correct_answer' as comma-separated string
       - Provide shuffled list in 'options'
       
    5. 'MATCHING': 
       - Provide pairs in 'options' as [item1, match1, item2, match2, ...]
       - CRITICAL: Store correct pairs in 'correct_answer' as a JSON string like: "{\"item1\": \"match1\", \"item2\": \"match2\"}"
       - Example: options: ["France", "Paris", "Italy", "Rome"], correct_answer: "{\"France\": \"Paris\", \"Italy\": \"Rome\"}"
       
    6. 'GRAPHICAL': 
       - Generate SVG in 'svg_content' if needed
       - Provide 'options' if multiple choice (in ${params.language})
       - Set 'correct_answer' to the correct option text
       
    7. 'NUMERICAL': 
       - Set 'correct_answer' to the exact number (as string)
       
    8. 'SHORT_ANSWER' / 'FILL_BLANK': 
       - Set 'correct_answer' to the expected answer text (in ${params.language})
       
    9. 'ESSAY': 
       - Set 'correct_answer' to key points or model answer (in ${params.language})
       - Provide detailed guidance in 'explanation' (in ${params.language})
    
    QUALITY REQUIREMENTS:
    - Each question MUST have a clear 'correct_answer' field - NO EXCEPTIONS
    - Each question must have a clear 'explanation' that references the source material (in ${params.language})
    - Points should reflect question difficulty (2-10 points)
    - Questions must be unambiguous and have one clear correct answer
    - All content must be factually accurate to the uploaded material
    - The correct answer should be marked so teachers can review and use immediately
    - REMEMBER: ALL TEXT CONTENT MUST BE IN ${params.language.toUpperCase()}
    
    Return a JSON object with a 'questions' array.
  `;

  const parts: any[] = [{ text: prompt }];

  // Add resources
  params.resources.forEach(res => {
    parts.push({
      inlineData: {
        mimeType: res.mimeType,
        data: res.data
      }
    });
  });

  // Retry logic for API overload
  const maxRetries = 3;
  let lastError: any = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Gemini API attempt ${attempt}/${maxRetries}...`);

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              questions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    text: { type: Type.STRING },
                    type: { type: Type.STRING, enum: Object.values(QuestionType) },
                    options: { type: Type.ARRAY, items: { type: Type.STRING } },
                    correct_answer: { type: Type.STRING },
                    points: { type: Type.NUMBER },
                    explanation: { type: Type.STRING },
                    svg_content: { type: Type.STRING },
                    option_visuals: { type: Type.ARRAY, items: { type: Type.STRING } }
                  },
                  required: ["text", "type", "points"]
                }
              }
            }
          }
        }
      });

      if (response.text) {
        const sanitized = response.text.replace(/```json\n?|```/g, '');
        console.log("✓ Gemini API succeeded");
        return JSON.parse(sanitized).questions;
      }
      throw new Error("No response text");

    } catch (e: any) {
      lastError = e;
      console.error(`Gemini API attempt ${attempt} failed:`, e.message);

      // Check if it's a 503 overload error
      if (e.message?.includes('503') || e.message?.includes('overloaded') || e.message?.includes('UNAVAILABLE')) {
        if (attempt < maxRetries) {
          const waitTime = Math.pow(2, attempt) * 1000; // Exponential backoff: 2s, 4s, 8s
          console.log(`API overloaded. Retrying in ${waitTime / 1000} seconds...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        } else {
          throw new Error(`Gemini API is currently overloaded. This usually happens when processing many large images. Please try:\n1. Reduce the number of images (try 5-8 at a time)\n2. Wait a few minutes and try again\n3. Use smaller image files`);
        }
      }

      // For other errors, throw immediately
      throw e;
    }
  }

  // If all retries failed
  throw lastError;
};

export const regenerateSingleQuestion = async (
  params: Omit<AIQuizGenerationParams, 'typeCounts'>,
  type: QuestionType,
  avoidText?: string
) => {
  if (!apiKey) return getMockQuizData()[0]; // Simple fallback

  const ai = new GoogleGenAI({ apiKey });
  const prompt = `Generate ONE NEW question of type '${type}' based on: ${params.topic}. Avoid: "${avoidText}".`;
  const parts: any[] = [{ text: prompt }];

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts },
      config: { responseMimeType: "application/json" } // Simplified
    });
    const sanitized = response.text?.replace(/```json\n?|```/g, '') || "{}";
    return JSON.parse(sanitized);
  } catch (e) {
    return getMockQuizData()[0];
  }
};

export const generateTeachingGuide = async (topic: string, resources: any[], language: string) => {
  if (!apiKey) return getMockTeachingGuide();

  try {
    const ai = new GoogleGenAI({ apiKey });
    const parts: any[] = [{ text: `Create teaching guide for: ${topic} in ${language}` }];
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts },
      config: { responseMimeType: "application/json" }
    });
    const sanitized = response.text?.replace(/```json\n?|```/g, '') || "{}";
    return JSON.parse(sanitized);
  } catch (e) {
    return getMockTeachingGuide();
  }
};

// Fallbacks
const getMockQuizData = () => [
  {
    id: 'q1',
    text: 'What is the powerhouse of the cell?',
    type: QuestionType.SINGLE_CHOICE,
    options: ['Mitochondria', 'Nucleus', 'Ribosome', 'Golgi'],
    correct_answer: 'Mitochondria',
    points: 5,
    explanation: 'Mitochondria generate most of the chemical energy.'
  },
  {
    id: 'q2',
    text: 'Is the sky blue?',
    type: QuestionType.TRUE_FALSE,
    options: ['True', 'False'],
    correct_answer: 'True',
    points: 5,
    explanation: 'Rayleigh scattering causes the blue hue.'
  }
];

const getMockTeachingGuide = () => ({
  title: "Sample Guide",
  summary: "A comprehensive guide covering the topic.",
  key_points: ["Concept 1", "Concept 2", "Concept 3"],
  teaching_steps: [
    { step: "Introduction", detail: "Start with a hook." },
    { step: "Core Concepts", detail: "Explain the main ideas." }
  ],
  suggestions: ["Group activity", "Discussion"]
});
