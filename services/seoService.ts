import { GoogleGenAI } from "@google/genai";
import { getTextApiKey } from './geminiClient';

const SEO_CONTENT_GENERATOR_INSTRUCTIONS = `
You are an expert SEO and social media marketing AI specializing in the **Indonesian market**. Your task is to take a given topic/keyword and generate a high-quality description and hashtag list optimized specifically for **TikTok and YouTube Shorts in Indonesia**. You MUST use Google Search to find up-to-date, relevant information and trends.

**CRITICAL INSTRUCTIONS:**

1.  **Analyze the Topic for Indonesian Audience:** Understand the core intent and what would resonate with an Indonesian audience.
2.  **Generate Engaging Description (Bahasa Indonesia):**
    -   Write a compelling and natural-sounding description in **Bahasa Indonesia**. Use a friendly, conversational, and slightly informal tone suitable for social media captions.
    -   The description should be 2-4 sentences, keyword-rich, and end with a question or a call to interaction to boost engagement (e.g., "Kalian tim mana? Komen di bawah ya!").
    -   **DO NOT** write a stiff, formal, or robotic description. It must feel human.
3.  **Generate Hashtags for TikTok & YouTube (Indonesia):**
    -   Create a list of **15-20 relevant hashtags**.
    -   The list **MUST** include a strategic mix for the Indonesian audience:
        -   **Broad/Popular Indonesian Tags:** Include 2-3 very popular tags like \`#fyp\`, \`#samasamabelajar\`, \`#viralditiktok\`, \`#tipskeren\`.
        -   **Topic-Specific Indonesian Tags:** The majority of tags should be highly relevant to the user's topic, in Bahasa Indonesia.
        -   **Niche/Community Tags:** Include a few tags that target a specific community within the topic.
4.  **MANDATORY OUTPUT FORMAT:** Your entire response MUST be a single, valid JSON object. Do not add any text or markdown outside of this JSON structure. The JSON object must have one root key: "seo_content", containing:
    - "description": A string for the SEO-optimized description in Bahasa Indonesia.
    - "hashtags": An array of strings, where each string is a single hashtag (including the '#').

**Example Output (for topic: "tips fotografi malam hari dengan smartphone"):**
\`\`\`json
{
  "seo_content": {
    "description": "Mau hasil foto malam hari pake HP jadi sekeren ini? Ternyata gampang banget loh, gak perlu kamera mahal! Cukup atur setting ini di HP kamu, dan hasilnya dijamin anti-noise dan super jernih. Udah pernah coba tips nomor berapa aja nih? Komen di bawah ya!",
    "hashtags": [
      "#fotografimalam",
      "#mobilephotography",
      "#tipsfotografi",
      "#fotopakehp",
      "#nightphotography",
      "#tutorialfoto",
      "#fyp",
      "#samasamabelajar",
      "#kelastekno",
      "#gadgetindonesia",
      "#androidtips",
      "#iphonetips",
      "#kontenkreator",
      "#belajarfotografi",
      "#viralditiktok"
    ]
  }
}
\`\`\`
`;

/**
 * Generates an SEO description and hashtags for a topic using Google Search.
 * @param topic The user's topic or keyword.
 * @returns A promise resolving to an object with description, hashtags, and sources.
 */
export const generateSeoContent = async (topic: string): Promise<{ description: string; hashtags: string[]; sources: any[] }> => {
  const apiKey = getTextApiKey();
  const ai = new GoogleGenAI({ apiKey });
  const model = 'gemini-2.5-flash-preview-04-17';

  const userPrompt = `
    Topic: "${topic}"
    Please generate the SEO content based on this topic.
    `;

  const contents = { parts: [{ text: SEO_CONTENT_GENERATOR_INSTRUCTIONS }, { text: userPrompt }] };
  
  const response = await ai.models.generateContent({
    model,
    contents,
    config: {
      tools: [{ googleSearch: {} }],
    },
  });

  let jsonStr = response.text.trim();
  const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
  const match = jsonStr.match(fenceRegex);
  if (match && match[2]) {
    jsonStr = match[2].trim();
  }
  
  const parsedData = JSON.parse(jsonStr);
  const seoContent = parsedData.seo_content;

  const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

  if (!seoContent || !seoContent.description || !Array.isArray(seoContent.hashtags)) {
    throw new Error("AI returned invalid data format for SEO content.");
  }

  return {
    description: seoContent.description,
    hashtags: seoContent.hashtags,
    sources: sources,
  };
};
