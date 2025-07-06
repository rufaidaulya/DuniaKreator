import { GoogleGenAI } from "@google/genai";
import { getTextApiKey, getImageApiKey } from './geminiClient';

const SERVICE_ANALYSIS_INSTRUCTIONS = `
You are an expert marketing strategist AI. Your task is to analyze a brief description of a service or digital product and expand it into a concise, powerful paragraph that highlights its core value. This will be used for creating ad content.

**CRITICAL INSTRUCTIONS:**
1.  **Identify the Core Problem:** What problem does this service solve for the customer?
2.  **Define the Solution:** How does the service solve this problem? What are its key features or methods?
3.  **State the Key Benefit/Transformation:** What is the ultimate positive outcome for the customer? (e.g., 'save time', 'increase revenue', 'feel more confident').
4.  **Identify the Target Audience:** Who is this service for? (e.g., 'small business owners', 'busy professionals', 'students').
5.  **Synthesize into a Single Paragraph:** Combine these points into a smooth, compelling paragraph. Start with the problem or audience.
6.  **Output Format:** Your final output MUST be ONLY the single paragraph of text. Do not use markdown, titles, or any other formatting.

**Example:**
*INPUT:* Konsultan marketing digital untuk UMKM.
*OUTPUT:* Many small business owners struggle to be seen online, missing out on countless potential customers. Our digital marketing consultancy provides a clear roadmap to success, using targeted SEO, social media strategies, and data-driven advertising to dramatically increase your online visibility and drive more sales, allowing you to focus on what you do best.
`;

const SERVICE_AD_INSTRUCTIONS = `
You are a creative director for digital and service-based business advertisements. You will be given a "Service Description", a "Character Profile", a "Video Style", and optionally a "Mandatory Location Description". Your task is to synthesize ALL of these elements—the character (avatar) and the location setting—into a single, unified, cohesive, ultra-photorealistic image prompt for an advertisement.

**CRITICAL INSTRUCTIONS:**
1.  **Conceptual Representation:** Create a scene that visually represents the service being offered.
    *   For a 'Digital Marketing Consultant', show the character confidently pointing at a laptop screen with charts.
    *   For a 'Life Coach', show the character having an engaging, positive conversation with a client.
    *   For a 'Graphic Designer', show the character sketching on a tablet.
2.  **Environment (VERY IMPORTANT):**
    -   **Location Priority:**
        1.  If a **Mandatory Location Description** is provided, you **MUST** use it for the scene's environment.
        2.  If no location is provided, you **MUST** generate a location based *strictly* on the **[Video Style]**. For styles like 'Gaya Siaran Berita', 'Gaya Drama Korea', or 'Gaya Scifi/Masa Depan', the location is non-negotiable (e.g., a news studio, a Korean royal palace, or a futuristic lab with flying cars visible through the window). For other styles, create a fitting professional setting like a 'modern office', 'calm cafe', or 'creative studio'.
    -   **Clarity:** The location must be detailed and clearly visible, forming a cohesive and professional backdrop for the character's actions.
3.  **Character & Framing:** The main character (from the Character Profile) must be the focus. They must be **centered**, in a **medium shot (waist-up)** or **full-body shot**, and **facing the camera**.
4.  **Photographic Style:** The style must be 'ultra-photorealistic'. Use terms like 'professional corporate photography', '50mm lens', 'soft studio lighting', 'tack-sharp focus'. The aspect ratio must be **9:16 (portrait format)**.
5.  **Output Format:** Your final output MUST be ONLY the single paragraph image prompt. Do not use markdown or any other text.
`;

const REFERENCE_PROMPT_ENGINEERING_INSTRUCTIONS = `
You are a world-class character analyst for a film studio. Your task is to analyze a reference photo of a person's face and generate a highly detailed, concise, and descriptive text prompt that can be used by an image generation AI to recreate that person with high fidelity.

**CRITICAL INSTRUCTIONS:**
1.  **Focus on Identity:** Capture the unique essence of the person. Do not describe the photo's lighting, background, or quality. Describe the person themselves. The person MUST be facing the camera directly.
2.  **Be Specific and Detailed:** Use precise, descriptive adjectives.
    - **Face Shape:** (e.g., 'oval face', 'square jawline', 'prominent cheekbones', 'soft, round face').
    - **Eyes:** (e.g., 'deep-set almond-shaped blue eyes', 'bright, round hazel eyes with long eyelashes').
    - **Nose:** (e.g., 'a strong, straight nose', 'a small, slightly upturned nose').
    - **Mouth:** (e.g., 'thin lips with a defined cupid's bow', 'full lips with a gentle curve').
    - **Hair:** (e.g., 'thick, wavy, shoulder-length brunette hair parted on the side', 'short-cropped black hair with a slight fade').
    - **Skin:** (e.g., 'fair skin with light freckles across the nose', 'warm olive skin tone').
    - **Distinctive Features:** (e.g., 'a small mole above the left eyebrow', 'a faint scar on the chin', 'smile lines around the eyes').
    - **Ethnicity & Apparent Age:** (e.g., 'A Caucasian man in his late 30s', 'An East Asian woman in her early 20s').
3.  **Synthesize into a Coherent Prompt:** Combine all these details into a single, flowing paragraph. Start with the overall impression (age, gender, ethnicity) and then drill down into the details.
4.  **Output Format:** Your final output MUST be ONLY the text prompt. Do not include any other text, labels, or markdown formatting.

**Example:**
*INPUT:* (Image of a specific person)
*OUTPUT:* A photorealistic portrait of a Caucasian man in his late 30s with a square jawline and prominent cheekbones, facing the camera. He has deep-set, almond-shaped green eyes, a strong, straight nose, and thin lips. His hair is short, styled in a neat side-part, and is a dark brown color. He has a light stubble on his jaw and a confident, thoughtful expression.
`;

/**
 * Analyzes a service description and returns an enhanced marketing paragraph.
 * @param serviceDescription The user's brief description of the service.
 * @returns A promise resolving to an enhanced marketing description.
 */
export const analyzeServiceDescription = async (serviceDescription: string): Promise<string> => {
    const apiKey = getTextApiKey();
    const ai = new GoogleGenAI({ apiKey });
    const model = 'gemini-2.5-flash-preview-04-17';

    const contents = { parts: [{ text: SERVICE_ANALYSIS_INSTRUCTIONS }, { text: serviceDescription }] };

    const response = await ai.models.generateContent({ model, contents });

    return response.text.trim();
};

/**
 * Creates a scene prompt for a service-based advertisement.
 * @param serviceDescription The detailed description of the service.
 * @param avatarPrompt The detailed description of the avatar.
 * @param videoStyle The chosen video style that dictates the scene.
 * @param locationPrompt Optional description of a specific location to use.
 * @returns A promise resolving to a final image generation prompt for the service ad.
 */
export const createServiceAdPrompt = async (serviceDescription: string, avatarPrompt: string, videoStyle: string, locationPrompt?: string): Promise<string> => {
    const apiKey = getTextApiKey();
    const ai = new GoogleGenAI({ apiKey });
    const model = 'gemini-2.5-flash-preview-04-17';
    
    const userPrompt = `
    **Service Description:** ${serviceDescription}
    **Character Profile:** ${avatarPrompt}
    **Video Style:** ${videoStyle}
    ${locationPrompt ? `**Mandatory Location Description:** ${locationPrompt}` : ''}
    `;

    const contents = { parts: [{ text: SERVICE_AD_INSTRUCTIONS }, { text: userPrompt }] };

    const response = await ai.models.generateContent({ model, contents });
    
    return response.text.trim();
};

/**
 * Generates an image from a text prompt using the configured Image Generation AI.
 * @param prompt The detailed text prompt for image generation.
 * @returns A promise that resolves to the raw base64-encoded string of the generated JPEG image.
 */
export const generateImageFromPrompt = async (prompt: string): Promise<string> => {
    const apiKey = getImageApiKey();
    try {
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateImages({
            model: 'imagen-3.0-generate-002',
            prompt: prompt,
            config: { numberOfImages: 1, outputMimeType: 'image/jpeg' },
        });

        if (response.generatedImages && response.generatedImages.length > 0 && response.generatedImages[0].image?.imageBytes) {
            const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
            return base64ImageBytes;
        } else {
            throw new Error("AI tidak mengembalikan output gambar.");
        }
    } catch (e) {
        console.error("Image generation failed:", e);
        const errorMessage = e instanceof Error ? e.message : 'Kesalahan tidak diketahui';
        throw new Error(`Gagal menghasilkan gambar. Detail: ${errorMessage}`);
    }
};

/**
 * Generates a descriptive prompt from a reference image of a person or a full scene.
 * @param base64Image The base64-encoded image string.
 * @param mimeType The MIME type of the image.
 * @returns A promise that resolves to a text prompt for describing the image.
 */
export const generatePromptFromReferenceImage = async (base64Image: string, mimeType: string): Promise<string> => {
    const apiKey = getTextApiKey();
    const ai = new GoogleGenAI({ apiKey });
    
    const model = 'gemini-2.5-flash-preview-04-17';
    const imagePart = {
        inlineData: {
            data: base64Image,
            mimeType: mimeType,
        },
    };
    const contents = { parts: [{ text: REFERENCE_PROMPT_ENGINEERING_INSTRUCTIONS }, imagePart] };

    const response = await ai.models.generateContent({ model, contents });
    
    return response.text.trim();
};