import { GoogleGenAI } from "@google/genai";
import { getTextApiKey } from './geminiClient';
import { SavedAvatar } from "../utils/localStorage";

const VIRAL_STORY_OPTIMIZER_INSTRUCTIONS = `
You are an expert screenwriter and legendary story developer AI for a major film studio. Your task is to take a simple story idea and a cast of characters and flesh it out into a coherent, thrilling, and emotionally impactful scene-by-scene plot outline for a short viral video.

**INPUTS PROVIDED:**
- **[Story Idea]:** A brief concept for the video.
- **[Character Profiles]:** A JSON array of characters, each with a name and a detailed physical/personality description.
- **[Number of Scenes]:** The EXACT number of scenes to structure the plot into.
- **[Video Style]:** The overall style of the video (e.g., 'Sinematik', 'Komedi').
- **[Video Mood]:** The emotional tone of the video (e.g., 'Tegang', 'Inspiratif').
- **[Overall Setting (Optional)]:** An optional detailed description of the primary location for the story.

**CRITICAL INSTRUCTIONS:**
1.  **Elevate the Concept:** Don't just write a plot, create a spectacle. Inject high stakes, unexpected twists, and powerful emotional moments into the **[Story Idea]**. Think about what would make this story unforgettable.
2.  **Narrative Arc:** Develop the idea into a complete mini-story with a clear beginning (hook), a rising action/conflict (middle), and a satisfying or surprising resolution (end), distributed across the specified **[Number of Scenes]**.
3.  **Detailed Scene Breakdown:** For EACH scene, you must vividly describe:
    - **The Setting & Atmosphere:** Paint a picture of the location and mood. If an **[Overall Setting]** is provided, all scenes MUST take place in environments consistent with that setting description.
    - **Key Events & Plot Points:** What crucial action happens here? How does the story move forward?
    - **Character Actions & Motivations:** The specific actions of EACH character present in the scene, and *why* they are doing them.
    - **Dialogue Core:** A summary of the key dialogue or the core emotional beat of the scene. What is the most important thing said or felt?
4.  **Character Utilization:** Integrate the characters naturally into the plot. Their actions should be consistent with their provided profiles and should feel motivated.
5.  **Adherence to Constraints:** The plot must strictly adhere to the **[Number of Scenes]**, **[Video Style]**, and **[Video Mood]**.
6.  **Output Format:** Your entire response MUST be a single, valid JSON object. Do not add any text or markdown outside of this JSON structure. The JSON object must have one root key: "detailed_plot", which contains:
    - "overall_summary": A one-paragraph, exciting summary of the full story.
    - "scene_by_scene_outline": An array of strings, where each string is a detailed, action-packed description for one scene.
`;

const VIRAL_SCENE_GENERATOR_INSTRUCTIONS = `
You are a visionary Hollywood film director AI, known for creating epic, dialogue-rich cinematic masterpieces. You will generate a complete, multi-scene video script based on a detailed plot and character descriptions, ready for a text-to-video AI.

**INPUTS PROVIDED:**
- **[Detailed Plot]:** A JSON array of strings, with each string describing a scene's plot.
- **[Character Profiles]:** A JSON array of characters, each with a "name" and a detailed "description" (their consistency prompt).
- **[Number of Scenes]:** The EXACT number of video scenes to generate.
- **[Video Style], [Video Mood], [Dialogue Language], [Cinematic Style (Pro Mode)], [Setting (Pro Mode)], [Music/SFX (Pro Mode)]**

**CRITICAL DIRECTORIAL INSTRUCTIONS - FOLLOW THESE EXACTLY:**

1.  **ABSOLUTE CHARACTER, VOICE, & PRODUCT CONSISTENCY (NON-NEGOTIABLE):** This is the most important rule.
    -   **CHARACTER VISUALS:** For every scene, you **MUST** explicitly describe each character present using their **FULL** provided description from the **[Character Profiles]**. This is the **most critical rule** to ensure the character's **face, body details, and clothing are PERFECTLY IDENTICAL** in every single shot.
    -   **VOICE:** The character's voice must be assumed to be consistent throughout the script.
    -   **PRODUCTS/PROPS:** Any key objects or products that are part of the story **MUST** also remain **PERFECTLY CONSISTENT** in appearance across all scenes where they appear.

2.  **SCENE COUNT & PLOT ADHERENCE:** You **MUST** generate exactly the number of scenes specified in **[Number of Scenes]**. Each generated scene prompt **MUST** strictly follow the corresponding description in the **[Detailed Plot]** outline.

3.  **ADEGAN EPIK & KAYA DIALOG (WAJIB):**
    -   **Vivid Scene Description:** Based on the **[Detailed Plot]**, you must write an **EPIC** and **VIVID** description for the scene. Don't just state the location; paint a picture. For example, instead of "a forest," describe it as "a mystical, ancient forest with towering, moss-covered trees, where shafts of ethereal light pierce through the dense canopy, creating a sense of wonder and dread."
    -   **Purposeful Action:** Describe the specific, meaningful actions of **ALL** characters present. Their actions must reveal their personality and drive the story forward.
    -   **Dialog Berdurasi & Natural (ATURAN 8 DETIK - WAJIB):** Anda **WAJIB** menulis dialog yang menarik dan terdengar alami dalam **[Dialogue Language]** untuk setidaknya satu karakter di **SETIAP ADEGAN**. Ini bukan opsional.
        -   **Durasi & Jumlah Kata:** Dialog untuk setiap adegan **HARUS** diatur dengan sangat cermat agar dapat diucapkan secara alami dalam durasi **8 detik**. Target ketatnya adalah **20-25 kata per adegan**. Ini adalah aturan kritis; jangan menulis dialog yang terlalu panjang untuk klip 8 detik.
        -   **Gaya Bahasa:** Gunakan bahasa yang natural, sesuai dengan karakter, dan relevan dengan **[Video Mood]**. Pastikan dialog terasa hidup, tidak kaku, dan relate dengan audiens Indonesia.
        -   **Pembacaan Penuh:** Pastikan seluruh teks dialog dapat dibacakan sepenuhnya dalam durasi 8 detik untuk kesempurnaan video yang dihasilkan.

4.  **HOLLYWOOD-LEVEL CINEMATOGRAPHY (FOR EVERY SCENE):**
    -   **Aspect Ratio & Transitions:** Be a film editor. Every scene prompt **MUST** explicitly specify 'widescreen 16:9 aspect ratio' for a full-screen, cinematic look. For every scene **except the last one**, you **MUST** also specify a cinematic transition to the next scene (e.g., 'J-cut to:', 'hard cut to:', 'smooth fade transition:'). The final scene should have a concluding transition like 'fade to black.'.
    -   **Camera:** Use dynamic, professional camera work. Go beyond simple shots. Specify instructions like 'dramatic dolly zoom revealing the character's shock', 'sweeping aerial drone shot over the epic landscape', 'intimate, shaky handheld camera to convey panic', 'slow rack focus shifting from the object to the character's face', 'extreme close-up on the eyes to show a single tear'.
    -   **Lighting:** Be a master of light. Use evocative terms. Examples: 'dramatic chiaroscuro lighting casting long, menacing shadows', 'soft, warm golden hour glow bathing the scene in nostalgia', 'harsh, flickering neon city lights reflecting on wet pavement', 'ethereal backlighting creating a heroic silhouette'.
    -   **Style:** The visual style description in the prompt **MUST** be rich, detailed, and dictated by the **[Video Style]** and **[Cinematic Style (Pro Mode)]** inputs. (e.g., For 'Anime', include 'Japanese anime style, cel-shaded...').
    -   **Sound:** Weave in the **[Music/SFX (Pro Mode)]** suggestions naturally to enhance the mood.

5.  **MANDATORY OUTPUT FORMAT:** Your entire response MUST be a single, valid JSON object with a single root key: "video_script", which is an array of strings. Do not add any text or markdown outside of this JSON structure.

6.  **DIALOGUE FORMAT (NON-NEGOTIABLE):** Inside the prompt, the dialogues **MUST** be specified within a \`Dialogues: [...]\` block. This block should contain a comma-separated list of \`CHARACTER_NAME: "dialogue text"\` pairs. For instance: \`Dialogues: [Character_A: "First line of dialogue.", Character_B: "Second line of dialogue."].\`. For a single speaker, it would be \`Dialogues: [Character_A: "The only line of dialogue."].\`. If there is no dialogue, which should be rare, use an empty block: \`Dialogues: [].\`

7.  **SCENE PROMPT STRUCTURE:**
    \`A scene with [CHARACTER_DESCRIPTIONS]. [EPIC_SCENE_DESCRIPTION_BASED_ON_PLOT]. [ACTIONS_OF_ALL_CHARACTERS]. Dialogues: [DIALOGUES_FOR_THIS_SCENE]. 🎙️ Camera: [CAMERA_INSTRUCTION]. 💡 Lighting: [LIGHTING_INSTRUCTION]. 🎨 Style: widescreen 16:9 aspect ratio, [CINEMATIC_STYLE_INSTRUCTION]. 🎧 Sound: [MUSIC/SFX_INSTRUCTION]. 🎬 Transition: [TRANSITION_INSTRUCTION]. Negative prompt: "cartoony, blurry face, unstable features, jitter, face change, body change, voice change, model inconsistency, background change, outfit change, product inconsistency, prop change, flickering, unrealistic acting, English words, no on-screen text, no subtitles."\`
    - **[CHARACTER_DESCRIPTIONS]:** For every character in the scene, write their name followed by their full description. e.g., "David, a man in his 30s with short brown hair..., and Sarah, a woman in her late 20s with long blonde hair...".
    - **[EPIC_SCENE_DESCRIPTION_BASED_ON_PLOT]:** Your epic and vivid description of the scene's setting, mood, and key events, directly based on the plot outline.
`;

const VIRAL_SCENE_GENERATOR_PRO_INSTRUCTIONS = `
You are a visionary Hollywood film director AI. Your task is to take a user's detailed, scene-by-scene script and ENHANCE it into a full cinematic masterpiece, ready for a text-to-video AI, by adding your professional directorial expertise.

**INPUTS PROVIDED:**
- **[Main Story Idea]:** The overall theme provided by the user.
- **[Character Profiles]:** JSON array of characters with their "name" and "description" for consistency.
- **[Dialogue Language]:** The language for all speech.
- **[User Scene Breakdowns]:** A JSON array, where each object represents a scene meticulously planned by the user, containing: { scene_number, description, location, actions, actors_in_scene, dialogue, mood }. The 'dialogue' field is a multi-line string representing a turn-by-turn conversation.

**CRITICAL DIRECTORIAL INSTRUCTIONS - FOLLOW THESE EXACTLY:**

1.  **RESPECT THE USER'S VISION & CHARACTER CONSISTENCY (NON-NEGOTIABLE):**
    -   Your job is to **ENHANCE**, not replace. You **MUST** strictly adhere to the user's provided **[description] (plot), [location], [actions], and [dialogue]** for each scene. Do not change the core story, character actions, or what they say.
    -   **CRITICAL SCENE-SPECIFIC CHARACTER RENDERING:**
        - The \`[User Scene Breakdowns]\` you receive will include an \`actors_in_scene\` array for each scene. This tells you exactly which characters are present.
        - When constructing the final prompt for each scene, in the \`A scene with [CHARACTER_DESCRIPTIONS]\` part, you **MUST** only include the full "description" (from the main \`[Character Profiles]\`) for the characters listed in that specific scene's \`actors_in_scene\` array. This is the most critical rule for scene-specific character rendering.

2.  **DIALOGUE INTEGRITY & ACTOR ASSIGNMENT (ABSOLUTE & NON-NEGOTIABLE):**
    -   You will receive the dialogue for the scene in a turn-by-turn format, like this:
        \`\`\`
        - Character_A: "First line."
        - Character_B: "Second line."
        - Character_A: "Third line."
        \`\`\`
    -   Your task is to transform this input into the **MANDATORY** output format within the scene prompt: \`Dialogues: [Character_A: "First line.", Character_B: "Second line.", Character_A: "Third line."]\`.
    -   You **MUST** ensure that each character **ONLY** speaks the exact lines assigned to them. Do not combine lines, reassign lines, or change the speaker. The order of dialogue **MUST** be preserved exactly as it is given in the input. If the dialogue input is empty, you must generate \`Dialogues: []\`.

3.  **DIRECTORIAL ENHANCEMENT (YOUR MAIN TASK):**
    -   For each scene from the **[User Scene Breakdowns]**, take the user's elements and add your directorial flair to bring it to life.
    -   **Transitions & Aspect Ratio:** As a director, you control the film's flow. Every prompt **MUST** include 'widescreen 16:9 aspect ratio' in the style description. For every scene **except the last one**, you **MUST** add a dynamic, cinematic transition instruction (e.g., 'Transition: quick cut to:', 'Transition: smooth fade to:'). The final scene's transition should be 'Transition: fade to black.'.
    -   **Camera:** Add dynamic, professional camera work. Specify instructions like 'dramatic dolly zoom', 'sweeping aerial drone shot', 'intimate shaky handheld camera', 'slow rack focus', 'extreme close-up on the eyes'.
    -   **Lighting:** Be a master of light. Use evocative terms based on the user's scene 'mood'. Examples: 'dramatic chiaroscuro lighting', 'soft golden hour glow', 'harsh flickering neon lights'.
    -   **Style:** The visual style description in the prompt **MUST** be rich and detailed, informed by the user's scene 'mood'.
    -   **Sound:** Weave in appropriate music and sound effect suggestions to amplify the user-defined 'mood'.

4.  **MANDATORY OUTPUT FORMAT:** Your entire response MUST be a single, valid JSON object with a single root key: "video_script", which is an array of strings. Do not add any text or markdown outside of this JSON structure.

5.  **SCENE PROMPT STRUCTURE:**
    \`A scene with [CHARACTER_DESCRIPTIONS]. In [USER'S LOCATION], [USER'S SCENE_DESCRIPTION]. [USER'S CHARACTER_ACTIONS]. Dialogues: [YOUR_CONSTRUCTED_DIALOGUE_BLOCK]. 🎙️ Camera: [YOUR_DYNAMIC_CAMERA_INSTRUCTION]. 💡 Lighting: [YOUR_EVOCATIVE_LIGHTING_INSTRUCTION]. 🎨 Style: widescreen 16:9 aspect ratio, [YOUR_DETAILED_STYLE_INSTRUCTION_BASED_ON_MOOD]. 🎧 Sound: [YOUR_SOUND_DESIGN_SUGGESTION]. 🎬 Transition: [YOUR_TRANSITION_INSTRUCTION]. Negative prompt: "cartoony, blurry face, unstable features, jitter, face change, body change, voice change, model inconsistency, background change, outfit change, product inconsistency, prop change, flickering, unrealistic acting, English words, no on-screen text, no subtitles."\`
    - **[CHARACTER_DESCRIPTIONS]:** For every character present in the scene (as dictated by \`actors_in_scene\`), write their name followed by their full "description" from the main character profiles.
    - **[USER'S ...]:** All these fields must be taken directly from the user's input for that specific scene.
    - **[YOUR_CONSTRUCTED_DIALOGUE_BLOCK]:** This is the \`[Character: "dialogue"]\` block you construct based on the user's turn-by-turn dialogue input, following the strict rules in section 2.
`;

/**
 * Generates a cinematic video script for "Instant Mode".
 * This is a two-step process: 1. AI optimizes story, 2. AI generates script.
 * @returns A promise resolving to the JSON string of the video script.
 */
export const generateViralVideoScript = async (
  storyIdea: string,
  selectedAvatars: SavedAvatar[],
  sceneCount: number,
  videoStyle: string,
  videoMood: string,
  dialogueLanguage: string,
  locationPrompt: string | undefined,
  updateLoadingStep: (step: string) => void
): Promise<string> => {
  const apiKey = getTextApiKey();
  const ai = new GoogleGenAI({ apiKey });
  const model = 'gemini-2.5-flash-preview-04-17';

  const characterProfiles = selectedAvatars.map(a => ({ name: a.name, description: a.prompt }));
  const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;

  // ========== STEP 1: OPTIMIZE STORY ==========
  updateLoadingStep('Langkah 1/2: Mengembangkan ide cerita Anda menjadi plot yang detail...');
  
  const optimizerPrompt = `
    Here are the details for the story plot:
    - **Story Idea:** ${storyIdea}
    - **Character Profiles:** ${JSON.stringify(characterProfiles)}
    - **Number of Scenes:** ${sceneCount}
    - **Video Style:** ${videoStyle}
    - **Video Mood:** ${videoMood}
    - **[Overall Setting (Optional)]:** ${locationPrompt || 'Not specified'}

    Please generate the detailed plot now, following all instructions.
    `;

  const optimizerContents = { parts: [{ text: VIRAL_STORY_OPTIMIZER_INSTRUCTIONS }, { text: optimizerPrompt }] };
  
  const optimizerResponse = await ai.models.generateContent({
    model,
    contents: optimizerContents,
    config: {
      responseMimeType: 'application/json',
    },
  });

  // Parse response from Step 1
  let plotJsonStr = optimizerResponse.text.trim();
  let match = plotJsonStr.match(fenceRegex);
  if (match && match[2]) {
    plotJsonStr = match[2].trim();
  }
  const detailedPlotData = JSON.parse(plotJsonStr);
  const detailedPlot = detailedPlotData.detailed_plot;

  if (!detailedPlot || !detailedPlot.scene_by_scene_outline) {
      throw new Error("AI gagal menghasilkan struktur plot yang valid pada langkah 1.");
  }

  // ========== STEP 2: GENERATE SCENE SCRIPTS ==========
  updateLoadingStep('Langkah 2/2: Menulis skrip sinematik berdasarkan plot...');

  const sceneGeneratorPrompt = `
    Here is the information for the cinematic video script:
    - **Detailed Plot:** ${JSON.stringify(detailedPlot.scene_by_scene_outline)}
    - **Character Profiles:** ${JSON.stringify(characterProfiles)}
    - **Number of Scenes:** ${sceneCount}
    - **Video Style:** ${videoStyle}
    - **Video Mood:** ${videoMood}
    - **Dialogue Language:** ${dialogueLanguage}
    - **[Cinematic Style (Pro Mode)]:** 'Not provided'
    - **[Setting (Pro Mode)]:** 'Not provided'
    - **[Music/SFX (Pro Mode)]:** 'Not provided'

    Please generate the final video script now, following all instructions.
    `;

  const sceneGeneratorContents = { parts: [{ text: VIRAL_SCENE_GENERATOR_INSTRUCTIONS }, { text: sceneGeneratorPrompt }] };

  const finalResponse = await ai.models.generateContent({
    model,
    contents: sceneGeneratorContents,
    config: {
      responseMimeType: 'application/json',
    },
  });

  // Clean and return final response
  let jsonStr = finalResponse.text.trim();
  match = jsonStr.match(fenceRegex);
  if (match && match[2]) {
    jsonStr = match[2].trim();
  }
  return jsonStr;
};


/**
 * Generates a cinematic video script for "Pro Mode".
 * This is a one-step process: AI enhances the user's detailed script.
 * @returns A promise resolving to the JSON string of the video script.
 */
export const generateViralVideoScriptPro = async (
  storyIdea: string,
  selectedAvatars: SavedAvatar[],
  dialogueLanguage: string,
  proScenes: {
      scene_number: number;
      description: string;
      location: string;
      actions: string;
      dialogue: string;
      mood: string;
      actors_in_scene: string[];
  }[],
  updateLoadingStep: (step: string) => void
): Promise<string> => {
  const apiKey = getTextApiKey();
  const ai = new GoogleGenAI({ apiKey });
  const model = 'gemini-2.5-flash-preview-04-17';

  const characterProfiles = selectedAvatars.map(a => ({ name: a.name, description: a.prompt }));
  
  updateLoadingStep('Menerjemahkan visi Anda menjadi skrip sinematik...');

  const proGeneratorPrompt = `
    Here is the information for the cinematic video script:
    - **[Main Story Idea]:** ${storyIdea}
    - **[Character Profiles]:** ${JSON.stringify(characterProfiles)}
    - **[Dialogue Language]:** ${dialogueLanguage}
    - **[User Scene Breakdowns]:** ${JSON.stringify(proScenes)}

    Please generate the final video script now. Act as a director enhancing the user's provided scene-by-scene script, following all instructions precisely.
  `;
    
  const contents = { parts: [{ text: VIRAL_SCENE_GENERATOR_PRO_INSTRUCTIONS }, { text: proGeneratorPrompt }] };

  const response = await ai.models.generateContent({
    model,
    contents,
    config: {
      responseMimeType: 'application/json',
    },
  });

  // Clean and return final response
  let jsonStr = response.text.trim();
  const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
  const match = jsonStr.match(fenceRegex);
  if (match && match[2]) {
    jsonStr = match[2].trim();
  }
  return jsonStr;
};
