export interface VideoPromptHistoryItem {
  id: string;
  title: string;
  script: string[];
  createdAt: string; // ISO string
}

const VIDEO_PROMPT_HISTORY_KEY = 'kreator-ai-video-prompt-history';
export const MAX_PROMPT_HISTORY = 5;

export const getVideoPromptHistory = (): VideoPromptHistoryItem[] => {
  try {
    const storedHistory = localStorage.getItem(VIDEO_PROMPT_HISTORY_KEY);
    return storedHistory ? JSON.parse(storedHistory) : [];
  } catch (error) {
    console.error("Could not parse video prompt history from localStorage:", error);
    return [];
  }
};

export const saveVideoPromptHistory = (item: Omit<VideoPromptHistoryItem, 'id' | 'createdAt'>): void => {
  const currentHistory = getVideoPromptHistory();
  
  const newItem: VideoPromptHistoryItem = {
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
    ...item,
  };

  // Add to the front
  let updatedHistory = [newItem, ...currentHistory];
  
  // Enforce the limit
  if (updatedHistory.length > MAX_PROMPT_HISTORY) {
    updatedHistory = updatedHistory.slice(0, MAX_PROMPT_HISTORY);
  }

  localStorage.setItem(VIDEO_PROMPT_HISTORY_KEY, JSON.stringify(updatedHistory));
};

export const deleteVideoPromptHistoryItem = (id: string): void => {
  const currentHistory = getVideoPromptHistory();
  const updatedHistory = currentHistory.filter(item => item.id !== id);
  localStorage.setItem(VIDEO_PROMPT_HISTORY_KEY, JSON.stringify(updatedHistory));
};

export const clearVideoPromptHistory = (): void => {
    localStorage.removeItem(VIDEO_PROMPT_HISTORY_KEY);
};
