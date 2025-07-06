import { GoogleGenAI } from "@google/genai";
import { getTextApiKey, getImageApiKey } from './geminiClient';

const SONG_LYRICS_GENERATOR_INSTRUCTIONS = `
You are a world-class songwriter AI. Your task is to write a complete song based on user-provided details.

**INPUTS PROVIDED:**
- **[Song Idea]:** The core theme or story.
- **[Genre]:** The musical genre.
- **[Mood]:** The emotional tone.
- **[Language]:** The language for the lyrics.
- **[Artist Name]:** The name of the artist for the song.
- **[Structure]:** (Optional) The desired song structure, e.g., "Verse, Chorus, Verse, Chorus".

**CRITICAL INSTRUCTIONS:**
1.  **Language Adherence:** The lyrics and title **MUST** be written entirely in the specified **[Language]**. Do not mix languages.
2.  **Generate Title and Use Artist Name:** Create a catchy, relevant song title in the specified **[Language]**. The artist's name is provided in **[Artist Name]** and **MUST** be used exactly as given in the output.
3.  **Write Compelling Lyrics:** The lyrics MUST be creative, emotionally resonant, and tell a coherent story based on the **[Song Idea]**.
4.  **Match Genre and Mood:** The lyrical style, vocabulary, and themes must perfectly align with the specified **[Genre]** and **[Mood]**.
5.  **Use Song Structure:** Structure the lyrics using standard markers like \`[Verse 1]\`, \`[Chorus]\`, \`[Bridge]\`, \`[Outro]\`. If a specific **[Structure]** is provided, follow it. If not, use a common structure (e.g., Verse 1, Chorus, Verse 2, Chorus, Bridge, Chorus, Outro).
6.  **Rhyme and Rhythm (CRITICAL):** You **MUST** use a clear and consistent rhyming scheme (e.g., AABB, ABAB) within each stanza. The rhymes at the end of the lines must be **perfect rhymes** (rima sempurna), not just similar-sounding words. This is essential for a high-quality, professional result.
7.  **Output Format:** Your entire response MUST be a single, valid JSON object. Do not add any text or markdown outside this structure. The JSON must have a root key "song", containing:
    - "title": A string for the song title.
    - "artist": The artist's name, exactly as provided in the input.
    - "lyrics": A single string containing the full lyrics, formatted with markers.

**Example:**
*INPUT:* Ide: Perpisahan di stasiun kereta, Genre: Pop Akustik, Mood: Sedih & Melankolis, Language: Indonesia, Artist Name: Senja & Hujan
*OUTPUT:*
\`\`\`json
{
  "song": {
    "title": "Gerbong Terakhir",
    "artist": "Senja & Hujan",
    "lyrics": "[Verse 1]\\nLampu peron memudar, senja di pelupuk mata\\nKau genggam tanganku, tapi terasa hampa\\nKata-kata tercekat, di riuh suara kereta\\nIni pemberhentian terakhir untuk kita\\n\\n[Chorus]\\nDan peluit panjang itu, membelah dada\\nKau lepas perlahan, senyummu penuh luka\\nDi gerbong terakhir ini, aku hanya bisa terdiam\\nMelihat mimpiku pergi, tenggelam dalam kelam\\n\\n[Verse 2]\\nKu ingat janjimu, di bawah langit yang sama\\nKatanya selamanya, takkan ada kata pisah\\nKini semua hanya gema, di stasiun tua yang bisu\\nCerita kita tamat, sebelum waktunya tiba\\n\\n[Chorus]\\nDan peluit panjang itu, membelah dada\\nKau lepas perlahan, senyummu penuh luka\\nDi gerbong terakhir ini, aku hanya bisa terdiam\\nMelihat mimpiku pergi, tenggelam dalam kelam\\n\\n[Bridge]\\nPintu tertutup, roda mulai berputar\\nMembawamu jauh, hatiku ikut pudar\\nTak ada lambaian tangan, hanya tatapan yang nanar\\n\\n[Outro]\\nGerbong terakhir... menghilang...\\nKisah kita... tinggal kenang..."
  }
}
\`\`\`
`;

const SONG_COVER_PROMPT_INSTRUCTIONS = `
You are a professional art director and prompt engineer specializing in album cover art. Your task is to create a stunning, effective image generation prompt for a song cover.

**INPUTS PROVIDED:**
- **[Song Title]:** The title of the song.
- **[Artist Name]:** The name of the artist.
- **[Lyrics Summary]:** A brief summary of the song's lyrics and themes.
- **[Genre]:** The song's genre.
- **[Mood]:** The song's emotional tone.

**CRITICAL INSTRUCTIONS:**
1.  **Translate Music to Visuals:** Deeply analyze all inputs to capture the song's core essence.
2.  **Choose a Powerful Art Style:** Select a visual style that perfectly matches the **[Genre]** and **[Mood]**.
    - For Pop: 'Vibrant digital illustration', 'glossy photorealistic portrait', 'bold colors'.
    - For Rock: 'Gritty, high-contrast black and white photography', 'textured, abstract painting'.
    - For Akustik: 'Soft, warm-toned film photography', 'nostalgic, gentle landscape'.
    - For Hip-Hop: 'Bold graphic design', 'street art style', 'dynamic typography'.
3.  **Incorporate Symbolic Imagery:** Weave in visual metaphors and symbols from the **[Lyrics Summary]**. (e.g., a broken clock for 'lost time', a single train on a track for 'a long journey').
4.  **Typography is Crucial:** Specify the style for the text. Use descriptive terms like 'The song title "[Song Title]" is written in a clean, minimalist sans-serif font. The artist name "[Artist Name]" is smaller below it.'.
5.  **Compose the Prompt:** Combine all elements into a single, cohesive paragraph. Include details about color palette, lighting, and composition. The prompt MUST explicitly state "album cover art" or "song cover design" and be designed to produce a 9:16 portrait format image.
6.  **Output Format:** Your final output MUST be ONLY the single paragraph image prompt. Do not use markdown or any other text.

**Example:**
*INPUT:* Title: "Gerbong Terakhir", Artist: "Senja & Hujan", Summary: A sad farewell at a train station.
*OUTPUT:* A melancholy, cinematic album cover art for "Gerbong Terakhir" by "Senja & Hujan". A single, empty vintage train carriage window, rain-streaked, looking out onto a blurry, rain-soaked station platform at dusk. The mood is nostalgic and somber, with a desaturated color palette of blues and greys. Soft, moody lighting from a single lamp on the platform. The title "Gerbong Terakhir" is written in a delicate, white serif font across the top. The artist name "Senja & Hujan" is in a smaller font at the bottom. Style of a cinematic film still, 9:16 portrait format.
`;

/**
 * Generates song lyrics, title, and artist name.
 * @returns A promise resolving to the JSON string of the song details.
 */
export const generateSongLyrics = async (
  idea: string,
  genre: string,
  mood: string,
  language: string,
  structure: string,
  artistName: string
): Promise<string> => {
  const apiKey = getTextApiKey();
  const ai = new GoogleGenAI({ apiKey });
  const model = 'gemini-2.5-flash-preview-04-17';

  const userPrompt = `
    - **[Song Idea]:** ${idea}
    - **[Genre]:** ${genre}
    - **[Mood]:** ${mood}
    - **[Language]:** ${language}
    - **[Artist Name]:** ${artistName}
    - **[Structure]:** ${structure || 'Default'}
    `;

  const contents = { parts: [{ text: SONG_LYRICS_GENERATOR_INSTRUCTIONS }, { text: userPrompt }] };

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
 * Generates a prompt for a song cover image.
 * @returns A promise resolving to the image prompt string.
 */
export const generateSongCoverPrompt = async (
  title: string,
  artist: string,
  lyricsSummary: string,
  genre: string,
  mood: string
): Promise<string> => {
  const apiKey = getTextApiKey();
  const ai = new GoogleGenAI({ apiKey });
  const model = 'gemini-2.5-flash-preview-04-17';

  const userPrompt = `
    - **[Song Title]:** ${title}
    - **[Artist Name]:** ${artist}
    - **[Lyrics Summary]:** ${lyricsSummary}
    - **[Genre]:** ${genre}
    - **[Mood]:** ${mood}
    `;

  const contents = { parts: [{ text: SONG_COVER_PROMPT_INSTRUCTIONS }, { text: userPrompt }] };

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