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

const PRODUCT_ONLY_SCENE_INSTRUCTIONS = `
You are a creative director AI for a high-end product photoshoot. You will be given a "Product DNA" and a "Product Category". Your task is to synthesize these into a single, cohesive, ultra-photorealistic image prompt focusing ONLY on the product.

**CRITICAL INSTRUCTIONS:**
1.  **Product as the Hero:** The product is the absolute center of attention. There must be NO people, hands, or other characters in the image.
2.  **Product Fidelity:** The product must strictly adhere to its provided "Product DNA" description.
3.  **Scene Setting:**
    - **Environment:** Create a background that fits the Product Category and enhances the product's appeal (e.g., for a 'Watch', use a 'dark, textured slate surface with dramatic side lighting'; for 'Skincare', use a 'minimalist bathroom counter with a single droplet of water nearby'). The environment should be aesthetically pleasing but not distracting.
    - **Composition & Framing:** Use professional product photography composition. Employ techniques like the rule of thirds, leading lines, or centered focus depending on what best showcases the product. Use close-up or medium shots.
    - **Photographic Style:**
        - The style must be 'ultra-photorealistic commercial product photography'.
        - Use terms like 'macro lens', 'studio softbox lighting', 'tack-sharp focus on product texture', 'subtle bokeh background'.
        - **The final image aspect ratio MUST be 9:16 (portrait format).**
4.  **Output Format:** Your final output MUST be ONLY the single paragraph image prompt. Do not use markdown or any other text.
`;

const LOCATION_ANALYSIS_INSTRUCTIONS = `
You are a world-class location scout and cinematographer AI. Your mission is to analyze a reference photograph of a location and generate a hyper-detailed, comprehensive text prompt that can be used by an image generation AI to recreate the scene with maximum fidelity and atmosphere. You must capture EVERY aspect of the environment.

**CRITICAL INSTRUCTIONS:**

1.  **Analyze EVERYTHING:** Your analysis must be holistic. Describe the entire scene and its mood.
2.  **Scene & Environment Description:**
    -   **Setting Type:** Identify the type of location. Is it a 'bustling futuristic cyberpunk city street at night', 'a serene, misty forest at dawn', 'a cozy, sun-drenched cafe with vintage decor', 'a minimalist, modern art gallery'?
    -   **Key Elements & Objects:** Detail every significant object. 'ornate wrought-iron benches', 'towering skyscrapers with holographic advertisements', 'ancient, gnarled oak trees covered in moss', 'a worn leather armchair next to a fireplace'.
    -   **Architecture & Materials:** Describe structures and textures. 'Brutalist concrete buildings', 'polished marble floors', 'exposed brick walls', 'cobblestone streets'.
3.  **Atmosphere & Lighting:**
    -   **Lighting:** Describe the lighting in detail. Use terms like 'soft, diffused sunlight filtering through a large window', 'dramatic, hard shadows cast by a low sun', 'warm, ambient glow from string lights', 'harsh, flickering neon signs reflecting on wet pavement'.
    -   **Color & Tone:** Describe the color palette and overall mood. (e.g., 'a monochromatic, desaturated color scheme creating a somber mood', 'a vibrant, high-contrast palette of electric blues and pinks', 'a warm, earthy palette of greens and browns evoking a sense of calm').
    -   **Atmospherics:** Describe any weather or atmospheric effects. 'thick fog clinging to the ground', 'gentle rain creating ripples in puddles', 'dust motes dancing in sunbeams'.
4.  **Composition & Perspective:**
    -   **Shot Type:** Describe the camera's viewpoint. (e.g., 'a wide-angle establishing shot', 'a low-angle shot making the buildings seem immense', 'a view from a high vantage point looking down on the city').
5.  **Output Format:** Your final output MUST be a single, flowing paragraph that combines all these elements into a cohesive and rich prompt. Do not use markdown, titles, or any other formatting.
`;

const HIGH_FIDELITY_REPLICATION_INSTRUCTIONS = `
You are a world-class photographic analyst AI. Your mission is to analyze a reference photograph and generate a hyper-detailed, comprehensive text prompt that can be used by an image generation AI to recreate the image with maximum fidelity. You must capture EVERY aspect of the image.

**CRITICAL INSTRUCTIONS:**

1.  **Analyze EVERYTHING:** Your analysis must be holistic. Describe not just the person, but the entire photographic composition.
2.  **Subject Description (The Person):**
    -   **Identity & Face:** Be extremely specific about facial features (eyes, nose, mouth, face shape, skin tone, hair style and color, age, ethnicity, expression). Use descriptive adjectives (e.g., 'deep-set almond-shaped hazel eyes', 'a warm, genuine smile showing teeth').
    -   **Clothing & Accessories:** Detail the exact clothing worn. Describe the type of garment, fabric, texture, color, and pattern (e.g., 'a thick-knit, oversized wool sweater in a cream color', 'a tailored navy blue blazer with brass buttons', 'wearing a silver watch with a leather strap').
    -   **Pose:** Describe the person's pose precisely (e.g., 'sitting on a wooden stool, leaning slightly forward', 'standing with one hand in their pocket', 'frontal portrait, looking at the camera').
3.  **Photographic Style & Composition:**
    -   **Image Style:** Identify the overall style. Is it a 'professional studio headshot', 'a candid outdoor portrait', 'a dramatic black and white photo', 'a vintage-style sepia photograph', 'a brightly lit fashion shot'?
    -   **Lighting:** Describe the lighting in detail. Use terms like 'soft, diffused window light coming from the left', 'dramatic chiaroscuro lighting with harsh shadows', 'warm golden hour backlighting creating a halo effect', 'flat, even studio lighting from a softbox'.
    -   **Color & Tone:** Describe the color palette and overall mood. (e.g., 'a warm, earthy color palette with muted greens and browns', 'vibrant, saturated colors with high contrast', 'a desaturated, moody color scheme').
    -   **Framing & Camera:** Describe the shot type and lens characteristics. (e.g., 'a medium close-up shot', 'a full-body portrait', 'shot with a shallow depth of field, creating a blurry bokeh background', 'a wide-angle shot with slight distortion').
4.  **Background & Environment:**
    -   Describe the background, even if it's blurry. (e.g., 'background is an out-of-focus urban street scene at night', 'against a solid, textured grey studio backdrop').
5.  **Output Format:** Your final output MUST be a single, flowing paragraph that combines all these elements into a cohesive and rich prompt. Do not use markdown, titles, or any other formatting. The prompt must be designed to produce a 9:16 portrait format image.
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

const PROMPT_OPTIMIZER_INSTRUCTIONS = `
You are a professional prompt engineer for a versatile image generation AI. Your task is to take a user's character idea and a desired artistic style, and then synthesize them into a single, rich, detailed, and effective prompt.

**CRITICAL INSTRUCTIONS:**
1.  **Combine Idea and Style:** Seamlessly merge the user's core character idea with the specified artistic style. The style should dictate the overall aesthetic, medium, and artistic direction of the final prompt.
2.  **Mandatory Pose:** The character **MUST** be facing the camera directly (a frontal portrait). Their full face must be clearly visible, and they should be looking at the camera. This is a critical requirement. Ensure the final prompt includes phrases like "facing the camera", "frontal portrait", "looking directly at the camera".
3.  **Enhance, Don't Replace:** Keep the user's core concept, but build upon it with details that fit the chosen style.
4.  **Add Artistic/Photographic Detail:** Incorporate terms relevant to the chosen style.
    - For 'Default (Photorealistic)' or 'Cinematic Film', use camera terms: "ultra-photorealistic", "50mm lens", "studio lighting", "golden hour", "tack-sharp focus".
    - For 'Anime / Manga', use terms like: "digital anime art", "cel-shaded", "sharp lines", "vibrant colors", "in the style of Makoto Shinkai".
    - For 'Watercolor Painting', use terms like: "soft watercolor painting", "bleeding colors", "on textured paper".
5.  **Add Character Detail:** Add plausible details to the character description that match both the concept and the style.
6.  **Output Format:** Your final output **MUST** be ONLY the enhanced text prompt. Do not include any other text, labels, or markdown formatting. The prompt must be designed to produce a 9:16 portrait format image.

**Example 1:**
*INPUT:*
**User Idea:** Seorang astronot pemberani
**Desired Style:** Cinematic Film
*OUTPUT:* A cinematic, photorealistic frontal portrait of a courageous female astronaut in her mid-30s, looking directly at the camera with determined brown eyes. She's wearing a detailed, modern white and blue spacesuit. Shot on 35mm film with an anamorphic lens, creating subtle lens flare. The lighting is dramatic studio lighting, casting soft shadows, against a dark, minimalist background. 9:16 portrait format.

**Example 2:**
*INPUT:*
**User Idea:** Koki Italia yang ceria
**Desired Style:** Disney / Pixar 3D
*OUTPUT:* A charming 3D render in the style of Disney/Pixar of a cheerful Italian chef in his 50s, looking directly at the camera with a warm, wrinkly smile. He has a stylized, round face, a big bushy mustache, and kind, expressive eyes. He is wearing a classic white chef's hat and uniform. Rendered with soft, global illumination and vibrant colors. 9:16 portrait format.
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

/**
 * Optimizes a user's simple prompt into a detailed one with a specific style.
 * @param userPrompt The user's basic prompt.
 * @param style The desired artistic style.
 * @returns A promise resolving to the optimized prompt string.
 */
export const optimizeUserPrompt = async (userPrompt: string, style: string): Promise<string> => {
    const apiKey = getTextApiKey();
    const ai = new GoogleGenAI({ apiKey });
    const model = 'gemini-2.5-flash-preview-04-17';
    
    const fullPrompt = `
    **User Idea:** ${userPrompt}
    **Desired Style:** ${style}
    `;

    const contents = { parts: [{ text: PROMPT_OPTIMIZER_INSTRUCTIONS }, { text: fullPrompt }] };

    const response = await ai.models.generateContent({ model, contents });
    
    return response.text.trim();
};

/**
 * Generates a hyper-detailed prompt from a reference image to replicate it with high fidelity.
 * @param base64Image The base64-encoded image string.
 * @param mimeType The MIME type of the image.
 * @returns A promise that resolves to a text prompt for replicating the image.
 */
export const generateReplicationPromptFromImage = async (base64Image: string, mimeType: string): Promise<string> => {
    const apiKey = getTextApiKey();
    const ai = new GoogleGenAI({ apiKey });
    
    const model = 'gemini-2.5-flash-preview-04-17';
    const imagePart = {
        inlineData: {
            data: base64Image,
            mimeType: mimeType,
        },
    };
    const contents = { parts: [{ text: HIGH_FIDELITY_REPLICATION_INSTRUCTIONS }, imagePart] };

    const response = await ai.models.generateContent({ model, contents });
    
    return response.text.trim();
};

/**
 * Analyzes a location image and returns a detailed text description for recreation.
 * @param base64Image The base64-encoded image string.
 * @param mimeType The MIME type of the image.
 * @returns A promise resolving to a detailed text description of the location.
 */
export const analyzeLocationImage = async (base64Image: string, mimeType: string): Promise<string> => {
    const apiKey = getTextApiKey();
    const ai = new GoogleGenAI({ apiKey });
    const model = 'gemini-2.5-flash-preview-04-17';

    const imagePart = {
        inlineData: {
            data: base64Image,
            mimeType: mimeType,
        },
    };
    const contents = { parts: [{ text: LOCATION_ANALYSIS_INSTRUCTIONS }, imagePart] };

    const response = await ai.models.generateContent({ model, contents });
    return response.text.trim();
};

/**
 * Creates a scene prompt for a product without any characters.
 * @param productDescription The detailed description of the product.
 * @param productType The category of the product.
 * @param locationPrompt Optional description of a specific location to use.
 * @returns A promise resolving to a final image generation prompt.
 */
export const createProductOnlyScenePrompt = async (productDescription: string, productType: string, locationPrompt?: string): Promise<string> => {
    const apiKey = getTextApiKey();
    const ai = new GoogleGenAI({ apiKey });
    const model = 'gemini-2.5-flash-preview-04-17';
    
    const userPrompt = `
    **Product DNA:** ${productDescription}
    **Product Category:** ${productType}
    ${locationPrompt ? `**Mandatory Location Description:** ${locationPrompt}` : ''}
    `;

    const contents = { parts: [{ text: PRODUCT_ONLY_SCENE_INSTRUCTIONS }, { text: userPrompt }] };

    const response = await ai.models.generateContent({ model, contents });
    
    return response.text.trim();
};