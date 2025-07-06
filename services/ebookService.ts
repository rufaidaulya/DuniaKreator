import { GoogleGenAI } from "@google/genai";
import { getTextApiKey, getImageApiKey } from './geminiClient';

const EBOOK_OUTLINE_GENERATOR_INSTRUCTIONS = `
You are an expert author and editor AI. Your task is to take a user's Ebook idea and transform it into a compelling title and a well-structured, chapter-by-chapter outline.

**INPUTS PROVIDED:**
- **[Ebook Idea]:** The core concept of the book.
- **[Target Audience]:** Who the book is for.
- **[Writing Style]:** The desired tone and genre.
- **[Number of Chapters]:** The EXACT number of chapters to generate.

**CRITICAL INSTRUCTIONS:**
1.  **Generate a Catchy Title:** Create a main title that is intriguing and relevant. Also, create a subtitle that explains the book's core benefit.
2.  **Logical Chapter Flow & Style Adaptation:** Design a chapter structure that flows logically from introduction to conclusion. **Adapt the tone and style of the chapter titles to the specified [Writing Style]**. For example, a 'Novel' might have creative titles (e.g., "The Shadow in the Alley"), while a 'Karya Ilmiah' must have formal titles (e.g., "Bab 1: Pendahuluan"), and a 'Buku Pelatihan' should have action-oriented titles (e.g., "Langkah 1: Menyiapkan Alat Anda").
3.  **Actionable Chapter Titles:** Chapter titles should be descriptive and promise value to the reader, reflecting the book's overall style.
4.  **Adherence to Constraints:**
    - The outline **MUST** have exactly the number of chapters specified in **[Number of Chapters]**.
    - The tone of the titles must match the **[Writing Style]**.
5.  **Output Format:** Your entire response MUST be a single, valid JSON object. Do not add any text or markdown outside of this JSON structure. The JSON object must have one root key: "ebook_outline", containing:
    - "title": A string for the main title.
    - "subtitle": A string for the subtitle.
    - "chapters": An array of strings, where each string is a title for one chapter.
`;

const EBOOK_CHAPTER_WRITER_INSTRUCTIONS = `
You are a master ghostwriter AI. Your task is to write the full content for a single chapter of an Ebook with a natural, human-like quality.

**INPUTS PROVIDED:**
- **[Ebook Idea]:** The core concept of the entire book.
- **[Target Audience]:** Who the book is for.
- **[Writing Style]:** The desired tone and genre for the writing.
- **[Ebook Title]:** The main title of the Ebook.
- **[Chapter Title]:** The specific title of the chapter you are to write.
- **[Chapter Context]:** A summary of the previous chapters to ensure continuity. (Will be "Ini adalah bab pertama." for the first chapter).

**CRITICAL INSTRUCTIONS:**
1.  **Write Rich, In-Depth, Natural Content:** The chapter content must be comprehensive, well-researched, and provide genuine value. Aim for a substantial word count (approx. 700-1500 words). Write in a flowing, human-like style. Avoid robotic phrasing.
2.  **Maintain Tone & Style (VERY IMPORTANT):** The writing must strictly adhere to the specified **[Writing Style]** and be appropriate for the **[Target Audience]**. You MUST adapt your writing as follows:
    -   **Novel / Cerpen (Cerita Pendek) / Fiksi:** Gunakan deskripsi yang kaya, alur naratif, pengembangan karakter, dan dialog. Ciptakan dunia yang imersif.
    -   **Karya Ilmiah / Akademis (dengan referensi web):** Gunakan bahasa Indonesia yang formal, objektif, dan presisi. Strukturkan konten dengan argumen yang jelas didukung oleh data. **ANDA TERHUBUNG DENGAN GOOGLE SEARCH.**
        -   **WAJIB:** Gunakan informasi dari hasil pencarian untuk memberikan data faktual dan terkini.
        -   **WAJIB:** Sertakan kutipan dalam teks (in-text citation) jika relevan, contoh: (Santoso, 2023).
        -   **WAJIB:** Di akhir konten bab, buat bagian terpisah berjudul **"Daftar Pustaka"**.
        -   **WAJIB:** Di dalam "Daftar Pustaka", daftarkan semua sumber web yang Anda gunakan dengan format kutipan yang konsisten.
    -   **Buku Marketing & Bisnis:** Bersikaplah persuasif dan menarik. Gunakan studi kasus, saran yang dapat ditindaklanjuti, dan nada yang percaya diri.
    -   **Buku Pelatihan / Tutorial:** Harus jelas, langsung, dan instruksional. Gunakan panduan langkah demi langkah, bahasa sederhana, dan contoh praktis.
    -   **Biografi / Memoar:** Tulis dengan nada pribadi dan reflektif. Fokus pada penceritaan dan kebenaran emosional.
    -   **Puisi:** Fokus pada ritme, metafora, dan bahasa kiasan untuk membangkitkan emosi dan citra.
    -   **Naskah Drama / Skenario:** Format sebagai skenario, dengan fokus pada dialog, nama karakter, dan deskripsi adegan singkat.
    -   **Buku Anak-Anak:** Gunakan kalimat sederhana, kosakata yang sesuai dengan usia, dan nada yang imajinatif serta ramah.
    -   **Lainnya (Kasual, Formal, dll):** Ikuti nada yang ditentukan secara konsisten.
3.  **Stay Focused:** All content must be directly relevant to the **[Chapter Title]** and fit within the overall context of the **[Ebook Idea]**.
4.  **Smooth Transitions:** If **[Chapter Context]** is provided, ensure the beginning of your chapter connects smoothly with the end of the previous one.
5.  **Output Format & Final Polish (VERY STRICT):**
    - Your final output MUST be ONLY the raw, clean text content for the chapter.
    - **ABSOLUTELY NO MARKDOWN.** Do not use asterisks for bold/italics (\`*word*\`), do not use hashes for headers (\`# Header\`), and do not use hyphens or asterisks for bullet points.
    - Structure the text using clear paragraphs separated by double line breaks. This is crucial for readability and processing.
    - **DO NOT** include the chapter title again in your response.
    - **DO NOT** start with conversational filler like "Tentu, berikut adalah isi babnya...". Begin directly with the first sentence of the chapter content.
`;


const EBOOK_COVER_PROMPT_INSTRUCTIONS = `
You are a professional book cover designer and prompt engineer AI. Your task is to create a stunning, effective image generation prompt for an Ebook cover based on its title and summary.

**INPUTS PROVIDED:**
- **[Ebook Title]:** The main title of the book.
- **[Author Name]:** The name of the book's author.
- **[Ebook Summary]:** A short summary of the book's content.

**CRITICAL INSTRUCTIONS:**
1.  **Analyze the Core Concept:** Understand the essence of the book from its title and summary. Is it about business, fiction, self-help, technology?
2.  **Choose a Design Style:** Select a powerful and appropriate visual style.
    - For business/tech: 'Minimalist graphic design', 'Abstract geometric patterns', 'Clean and professional'.
    - For self-help/inspiration: 'Inspirational landscape photography', 'Soft, warm color palette', 'Uplifting and hopeful'.
    - For fiction/fantasy: 'Epic digital painting', 'Mysterious and atmospheric', 'Detailed character illustration'.
3.  **Incorporate Key Imagery:** Include symbolic visuals that relate to the book's topic. (e.g., a key for 'unlocking potential', a growing plant for 'personal growth', a path leading to a mountain for 'a journey').
4.  **Typography is Key:** Specify the typography style for BOTH the title and author name. The prompt **MUST** explicitly state that the text for "[Ebook Title]" and "[Author Name]" should be on the cover. Use terms like 'bold, modern sans-serif typography for the title', 'elegant serif font for the author name'. Ensure the text is clearly visible and well-placed.
5.  **Compose the Prompt:** Combine all elements into a single, cohesive prompt. Structure it for an image AI. Include details about color palettes, lighting, and composition. The prompt should explicitly state "book cover" or "Ebook cover" and be designed to produce a 9:16 portrait format image.
6.  **Output Format:** Your final output MUST be ONLY the single paragraph image prompt. Do not use markdown or any other text.

**Example:**
*INPUT:* Title: "The Silent Coder", Author: "Alex Doe", Summary: A programmer navigates corporate espionage.
*OUTPUT:* An ultra-minimalist, professional ebook cover design. A single, stylized, glowing green circuit board line traces a path across a deep matte black background. A subtle, shadowy hooded figure is barely visible in the corner. The title "The Silent Coder" is in a clean, modern, white sans-serif font at the top. The author name "Alex Doe" is in a smaller, complementary font at the bottom. The design is clean, high-tech, and mysterious. 9:16 portrait format.
`;

/**
 * Generates an Ebook outline (title, subtitle, chapters).
 * @returns A promise resolving to the JSON string of the Ebook outline.
 */
export const generateEbookOutline = async (
  idea: string,
  audience: string,
  style: string,
  numChapters: number
): Promise<string> => {
  const apiKey = getTextApiKey();
  const ai = new GoogleGenAI({ apiKey });
  const model = 'gemini-2.5-flash-preview-04-17';

  const userPrompt = `
    Here is the information for the Ebook outline:
    - **[Ebook Idea]:** ${idea}
    - **[Target Audience]:** ${audience}
    - **[Writing Style]:** ${style}
    - **[Number of Chapters]:** ${numChapters}

    Please generate the Ebook outline now based on these details.
    `;

  const contents = { parts: [{ text: EBOOK_OUTLINE_GENERATOR_INSTRUCTIONS }, { text: userPrompt }] };

  const response = await ai.models.generateContent({
    model,
    contents,
    config: {
      responseMimeType: 'application/json',
    },
  });

  let jsonStr = response.text.trim();
  const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
  const match = jsonStr.match(fenceRegex);
  if (match && match[2]) {
    jsonStr = match[2].trim();
  }
  return jsonStr;
};

/**
 * Generates the content for a single Ebook chapter.
 * @returns A promise resolving to the text content of the chapter.
 */
export const generateEbookChapterContent = async (
  ebookIdea: string,
  targetAudience: string,
  writingStyle: string,
  ebookTitle: string,
  chapterTitle: string,
  chapterContext: string
): Promise<string> => {
  const apiKey = getTextApiKey();
  const ai = new GoogleGenAI({ apiKey });
  const model = 'gemini-2.5-flash-preview-04-17';

  const userPrompt = `
    Here is the information for the chapter content:
    - **[Ebook Idea]:** ${ebookIdea}
    - **[Target Audience]:** ${targetAudience}
    - **[Writing Style]:** ${writingStyle}
    - **[Ebook Title]:** ${ebookTitle}
    - **[Chapter Title]:** ${chapterTitle}
    - **[Chapter Context]:** ${chapterContext}

    Please write the full content for this chapter now.
    `;

  const contents = { parts: [{ text: EBOOK_CHAPTER_WRITER_INSTRUCTIONS }, { text: userPrompt }] };

  const config: { tools?: any[], responseMimeType?: string } = {};
  if (writingStyle.includes('Karya Ilmiah')) {
      config.tools = [{ googleSearch: {} }];
  }

  const response = await ai.models.generateContent({ model, contents, config });
  return response.text;
};

/**
 * Generates a prompt for an Ebook cover image.
 * @returns A promise resolving to the image prompt string.
 */
export const generateEbookCoverPrompt = async (
  title: string,
  summary: string,
  authorName: string
): Promise<string> => {
  const apiKey = getTextApiKey();
  const ai = new GoogleGenAI({ apiKey });
  const model = 'gemini-2.5-flash-preview-04-17';

  const userPrompt = `
    - **[Ebook Title]:** ${title}
    - **[Author Name]:** ${authorName}
    - **[Ebook Summary]:** ${summary}
    `;

  const contents = { parts: [{ text: EBOOK_COVER_PROMPT_INSTRUCTIONS }, { text: userPrompt }] };

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