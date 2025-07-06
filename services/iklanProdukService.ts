import { GoogleGenAI } from "@google/genai";
import { getTextApiKey, getImageApiKey } from './geminiClient';

const PRODUCT_ANALYSIS_INSTRUCTIONS = `
You are a forensic product analyst AI. Your task is to analyze the provided product image and generate a single paragraph of hyper-detailed, descriptive text. This text is the product's "DNA" and will be used to recreate it with 99% fidelity.

**CRITICAL INSTRUCTIONS:**
1.  **Focus ONLY on the product.** Ignore any background, lighting, or context.
2.  **Be Extremely Specific:**
    - **Material & Texture:** Use precise terms like 'full-grain leather with a visible pebbled texture', 'high-gloss patent leather', 'thick-weave ballistic nylon', 'brushed stainless steel with a subtle circular pattern'.
    - **Color Palette:** Use precise color names. 'Matte black', 'ivory white', 'burnt sienna brown', 'cobalt blue'.
    - **Shape & Structure:** Describe the exact form. 'A structured rectangular tote with a rigid base', 'a low-top sneaker with a chunky, serrated sole'.
    - **Key Features & Hardware:** Detail every single element. 'Polished silver-tone zipper pulls', 'a magnetic snap closure', 'an engraved minimalist logo on a small leather patch', 'contrasting white stitching along the seams'.
3.  **Output Format:** Your final output MUST be ONLY the single paragraph of text. Do not use markdown, titles, or any other formatting.
`;

const SCENE_CREATION_INSTRUCTIONS = `
You are a creative director AI for a high-end photoshoot. You will be given a "Product DNA", a "Character Profile", a "Product Category", a "Video Style", and optionally a "Mandatory Location Description". Your task is to synthesize ALL of these elements—avatar, product, and location setting—into a single, unified, cohesive, ultra-photorealistic image prompt.

**CRITICAL INSTRUCTIONS:**
1.  **Natural Interaction:** The character MUST be interacting with the product in a natural, compelling way. The scene should tell a micro-story relevant to the product.
2.  **Character & Product Fidelity:** The character and product must strictly adhere to their provided profiles.
3.  **Scene Setting (VERY IMPORTANT):**
    -   **Location Priority:**
        1.  If a **Mandatory Location Description** is provided, you **MUST** use it for the scene's environment.
        2.  If no location is provided, you **MUST** generate a location based *strictly* on the **[Video Style]**. For styles like 'Gaya Kerajaan Majapahit', 'Gaya Drama Korea', or 'Gaya Scifi/Masa Depan', the location is non-negotiable (e.g., a majestic ancient temple for Majapahit, a beautiful Korean palace pavilion for Drama Korea, or a sleek spaceship interior for Scifi). For other styles, create a fitting background (e.g., 'chic urban street' for Storytelling, 'modern kitchen' for Komedi).
    -   **Clarity:** The background and environment MUST be described clearly and contribute to the overall aesthetic; they should not be an afterthought.
    -   **Pose & Framing (NON-NEGOTIABLE):** The model MUST be facing the camera directly (frontal view). Their full face must be clearly visible and well-lit. The shot MUST be either a **medium shot (waist-up)** or a **full-body shot**. The model must be **centered** in the frame.
    -   **Photographic Style:** The style must be 'ultra-photorealistic lifestyle photography'. Use terms like '50mm lens', 'golden hour lighting', 'tack-sharp focus'. The final image aspect ratio **MUST be 9:16 (portrait format).**
4.  **Output Format:** Your final output MUST be ONLY the single paragraph image prompt. Do not use markdown or any other text.
`;

const PRODUCT_ONLY_SCENE_INSTRUCTIONS = `
You are a creative director AI for a high-end product photoshoot. You will be given a "Product DNA", a "Product Category", a "Video Style", and optionally a "Mandatory Location Description". Your task is to synthesize ALL of these elements—the product and its location setting—into a single, unified, cohesive, ultra-photorealistic image prompt focusing ONLY on the product.

**CRITICAL INSTRUCTIONS:**
1.  **Product as the Hero:** The product is the absolute center of attention. There must be NO people, hands, or other characters in the image.
2.  **Product Fidelity:** The product must strictly adhere to its provided "Product DNA" description.
3.  **Scene Setting (VERY IMPORTANT):**
    -   **Location Priority:**
        1.  If a **Mandatory Location Description** is provided, you **MUST** use it for the scene's environment.
        2.  If no location is provided, you **MUST** generate a location based *strictly* on the **[Video Style]**. For styles like 'Gaya Kerajaan Majapahit', 'Gaya Drama Korea', or 'Gaya Scifi/Masa Depan', the location is non-negotiable (e.g., a majestic ancient temple for Majapahit, a beautiful Korean palace pavilion for Drama Korea, or a sleek spaceship interior for Scifi). For other styles, create a fitting background that enhances the product's appeal (e.g., for a 'Watch' in a 'Storytelling' style, use a 'vintage wooden desk with soft morning light').
    -   **Clarity:** The background and environment MUST be described clearly and contribute to the overall aesthetic; they should not be an afterthought.
    -   **Composition & Framing:** Use professional product photography composition. Employ techniques like the rule of thirds, leading lines, or centered focus depending on what best showcases the product. Use close-up or medium shots.
    -   **Photographic Style:** The style must be 'ultra-photorealistic commercial product photography'. Use terms like 'macro lens', 'studio softbox lighting', 'tack-sharp focus on product texture', 'subtle bokeh background'. The final image aspect ratio **MUST be 9:16 (portrait format).**
4.  **Output Format:** Your final output MUST be ONLY the single paragraph image prompt. Do not use markdown or any other text.
`;

/**
 * Analyzes a product image and returns a detailed text description.
 * @param base64Image The base64-encoded image string.
 * @param mimeType The MIME type of the image (e.g., 'image/jpeg').
 * @returns A promise resolving to a detailed text description of the product.
 */
export const analyzeProductImage = async (base64Image: string, mimeType: string): Promise<string> => {
    const apiKey = getTextApiKey();
    const ai = new GoogleGenAI({ apiKey });
    
    const model = 'gemini-2.5-flash-preview-04-17';
    const imagePart = {
        inlineData: {
            data: base64Image,
            mimeType: mimeType,
        },
    };
    const contents = { parts: [{ text: PRODUCT_ANALYSIS_INSTRUCTIONS }, imagePart] };

    const response = await ai.models.generateContent({ model, contents });
    
    return response.text.trim();
};

/**
 * Creates a scene prompt by combining a product description and an avatar prompt.
 * @param productDescription The detailed description of the product.
 * @param avatarPrompt The detailed description of the avatar.
 * @param productType The category of the product (e.g., "Baju", "Makanan").
 * @param videoStyle The chosen video style that dictates the scene.
 * @param locationPrompt Optional description of a specific location to use.
 * @returns A promise resolving to a final image generation prompt.
 */
export const createScenePrompt = async (productDescription: string, avatarPrompt: string, productType: string, videoStyle: string, locationPrompt?: string): Promise<string> => {
    const apiKey = getTextApiKey();
    const ai = new GoogleGenAI({ apiKey });
    const model = 'gemini-2.5-flash-preview-04-17';
    
    const userPrompt = `
    **Product DNA:** ${productDescription}
    **Character Profile:** ${avatarPrompt}
    **Product Category:** ${productType}
    **Video Style:** ${videoStyle}
    ${locationPrompt ? `**Mandatory Location Description:** ${locationPrompt}` : ''}
    `;

    const contents = { parts: [{ text: SCENE_CREATION_INSTRUCTIONS }, { text: userPrompt }] };

    const response = await ai.models.generateContent({ model, contents });
    
    return response.text.trim();
};

/**
 * Creates a scene prompt for a product without any characters.
 * @param productDescription The detailed description of the product.
 * @param productType The category of the product.
 * @param videoStyle The chosen video style that dictates the scene.
 * @param locationPrompt Optional description of a specific location to use.
 * @returns A promise resolving to a final image generation prompt.
 */
export const createProductOnlyScenePrompt = async (productDescription: string, productType: string, videoStyle: string, locationPrompt?: string): Promise<string> => {
    const apiKey = getTextApiKey();
    const ai = new GoogleGenAI({ apiKey });
    const model = 'gemini-2.5-flash-preview-04-17';
    
    const userPrompt = `
    **Product DNA:** ${productDescription}
    **Product Category:** ${productType}
    **Video Style:** ${videoStyle}
    ${locationPrompt ? `**Mandatory Location Description:** ${locationPrompt}` : ''}
    `;

    const contents = { parts: [{ text: PRODUCT_ONLY_SCENE_INSTRUCTIONS }, { text: userPrompt }] };

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