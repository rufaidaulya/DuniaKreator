import React, { useState, useCallback, useEffect, useRef } from 'react';
import { generateViralVideoScript, generateViralVideoScriptPro } from '../services/viralContentService';
import { getSavedAvatars, SavedAvatar, getSavedLocations, SavedLocation } from '../utils/localStorage';
import { SceneAccordion } from '../components/SceneAccordion';
import { saveVideoPromptHistory } from '../utils/historyStorage';
import { SparklesIcon, AlertTriangleIcon, FilmIcon, PlusCircleIcon, ChevronLeftIcon, TrashIcon, MapPinIcon } from '../components/IconComponents';

interface ViralContentCreatorPageProps {
  onNavigate: (page: string) => void;
}

type View = 'form' | 'loading' | 'result' | 'error';
type Tab = 'instan' | 'pro';

const videoStyleOptions = ["Sinematik", "Dokumenter", "Vlog", "Iklan Cepat", "Komedi", "Horor", "Drama", "Anime", "3D Animasi", "Gaya Pixar", "Gaya Ghibli", "Fantasi Epik"];
const videoMoodOptions = ["Default", "Bahagia", "Sedih", "Tegang", "Misterius", "Inspiratif", "Energik", "Romantis", "Seram"];
const dialogueLanguageOptions = ["Indonesia", "Inggris", "Jawa", "Sunda"];

interface ProDialogueEntry {
    id: number;
    actorId: string;
    text: string;
}

interface ProScene {
    id: number;
    description: string;
    location: string;
    actions: string;
    actorsInScene: SavedAvatar[];
    dialogues: ProDialogueEntry[];
    mood: string;
}

const AI_LOCATION_PLACEHOLDER: SavedLocation = {
  id: 'ai-location',
  name: 'AI Pilihan',
  imageUrl: '', // This won't be used
  prompt: '',
};

const ViralContentCreatorPage: React.FC<ViralContentCreatorPageProps> = ({ onNavigate }) => {
  const pageTopRef = useRef<HTMLDivElement>(null);

  // Mode State
  const [activeTab, setActiveTab] = useState<Tab>('instan');

  // Common Form State
  const [storyIdea, setStoryIdea] = useState('');
  const [savedAvatars, setSavedAvatars] = useState<SavedAvatar[]>([]);
  const [selectedAvatars, setSelectedAvatars] = useState<SavedAvatar[]>([]);
  const [dialogueLanguage, setDialogueLanguage] = useState('Indonesia');

  // Instant Mode State
  const [sceneCount, setSceneCount] = useState<number>(3);
  const [videoStyle, setVideoStyle] = useState('Sinematik');
  const [videoMood, setVideoMood] = useState('Default');
  const [savedLocations, setSavedLocations] = useState<SavedLocation[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<SavedLocation>(AI_LOCATION_PLACEHOLDER);

  // Pro Mode State
  const [proScenes, setProScenes] = useState<ProScene[]>([{ id: Date.now(), description: '', location: '', actions: '', actorsInScene: [], dialogues: [], mood: 'Default' }]);

  // View & Loading State
  const [view, setView] = useState<View>('form');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Result State
  const [generatedScript, setGeneratedScript] = useState<string[] | null>(null);
  const [openAccordionIndex, setOpenAccordionIndex] = useState<number | null>(null);


  useEffect(() => {
    setSavedAvatars(getSavedAvatars());
    setSavedLocations(getSavedLocations());
  }, []);
  
  const handleAvatarSelect = (avatar: SavedAvatar) => {
    setSelectedAvatars(prev => {
        const isSelected = prev.some(a => a.id === avatar.id);
        if (isSelected) {
            // Also remove from any pro scene it was in
            setProScenes(scenes => scenes.map(scene => ({
                ...scene,
                actorsInScene: scene.actorsInScene.filter(a => a.id !== avatar.id),
                dialogues: scene.dialogues.filter(d => d.actorId !== avatar.id)
            })));
            return prev.filter(a => a.id !== avatar.id);
        } else {
            return [...prev, avatar];
        }
    });
  };

  const scrollToTop = () => {
    pageTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  
  const handleGenerateClick = async () => {
    if (!storyIdea.trim() || selectedAvatars.length === 0) {
      let errorMsg = "Pastikan semua kolom terisi.";
      if (savedAvatars.length === 0) errorMsg = "Anda harus memiliki setidaknya satu avatar tersimpan. Silakan buat satu di halaman 'Buat Aset'.";
      else if (!storyIdea.trim()) errorMsg = "Silakan masukkan ide cerita Anda.";
      else if (selectedAvatars.length === 0) errorMsg = "Silakan pilih setidaknya satu avatar untuk konten Anda.";
      setError(errorMsg);
      setView('error');
      scrollToTop();
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setGeneratedScript(null);
    setOpenAccordionIndex(null);
    setView('loading');
    scrollToTop();

    try {
      let scriptJsonString: string;

      if (activeTab === 'instan') {
         const locationPrompt = selectedLocation.id !== 'ai-location' ? selectedLocation.prompt : undefined;
         scriptJsonString = await generateViralVideoScript(
            storyIdea,
            selectedAvatars,
            sceneCount,
            videoStyle,
            videoMood,
            dialogueLanguage,
            locationPrompt,
            setLoadingStep
          );
      } else { // Pro Mode
        const scenesForApi = proScenes.map(scene => {
            const dialogueContent = scene.dialogues.map(d => {
                const actor = selectedAvatars.find(a => a.id === d.actorId);
                return `- ${actor?.name}: "${d.text}"`;
            }).join('\n');
    
            return {
                scene_number: scene.id,
                description: scene.description,
                location: scene.location,
                actions: scene.actions,
                dialogue: dialogueContent,
                mood: scene.mood,
                actors_in_scene: scene.actorsInScene.map(a => a.name)
            };
        });

        scriptJsonString = await generateViralVideoScriptPro(
          storyIdea,
          selectedAvatars,
          dialogueLanguage,
          scenesForApi,
          setLoadingStep
        );
      }
      
      let parsedScript;
      try {
        parsedScript = JSON.parse(scriptJsonString);
      } catch (parseError) {
        console.error("JSON Parsing Error: ", parseError);
        const cleanedString = scriptJsonString.replace(/^```json\s*|```$/g, '').trim();
        parsedScript = JSON.parse(cleanedString);
      }

      if (parsedScript.video_script && Array.isArray(parsedScript.video_script)) {
        setGeneratedScript(parsedScript.video_script);
        setOpenAccordionIndex(null); // Accordions are closed by default
        setView('result');

        saveVideoPromptHistory({
          title: `Konten Viral: ${storyIdea.substring(0, 50)}${storyIdea.length > 50 ? '...' : ''}`,
          script: parsedScript.video_script,
        });
      } else {
        throw new Error("Menerima format skrip yang tidak valid dari AI.");
      }
    } catch (e) {
      console.error(e);
      const errorMessage = e instanceof Error ? e.message : 'Terjadi kesalahan yang tidak diketahui.';
      setError(`Gagal menghasilkan skrip. Detail: ${errorMessage}`);
      setView('error');
    } finally {
      setIsLoading(false);
      setLoadingStep('');
    }
  };

  const handleDialogueChange = (newPrompt: string, index: number) => {
    if (!generatedScript) return;
    const updatedScript = [...generatedScript];
    updatedScript[index] = newPrompt;
    setGeneratedScript(updatedScript);
  };
  
  const handleReorderScene = (index: number, direction: 'up' | 'down') => {
    if (!generatedScript) return;
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= generatedScript.length) return;
    const newScript = [...generatedScript];
    const temp = newScript[index];
    newScript[index] = newScript[newIndex];
    newScript[newIndex] = temp;
    setGeneratedScript(newScript);
  };

  const addProScene = () => {
    if (proScenes.length < 5) {
        setProScenes([...proScenes, { id: Date.now(), description: '', location: '', actions: '', actorsInScene: [], dialogues: [], mood: 'Default' }]);
    }
  };

  const removeProScene = (id: number) => {
    setProScenes(proScenes.filter(scene => scene.id !== id));
  };

  const handleProSceneChange = <K extends keyof Omit<ProScene, 'id' | 'actorsInScene' | 'dialogues'>>(id: number, field: K, value: ProScene[K]) => {
      setProScenes(proScenes.map(scene => scene.id === id ? { ...scene, [field]: value } : scene));
  };
  
  const useSavedLocationInProScene = (sceneId: number, locationPrompt: string) => {
      handleProSceneChange(sceneId, 'location', locationPrompt);
  };

  const handleSceneActorToggle = (sceneId: number, avatar: SavedAvatar) => {
    setProScenes(scenes => scenes.map(scene => {
        if (scene.id !== sceneId) return scene;

        const isSelected = scene.actorsInScene.some(a => a.id === avatar.id);
        let newActorsInScene;
        if (isSelected) {
            newActorsInScene = scene.actorsInScene.filter(a => a.id !== avatar.id);
        } else {
            newActorsInScene = [...scene.actorsInScene, avatar];
        }
        
        // Remove dialogue entries from actors who are no longer in the scene
        const newDialogues = scene.dialogues.filter(d => newActorsInScene.some(a => a.id === d.actorId));
        return { ...scene, actorsInScene: newActorsInScene, dialogues: newDialogues };
    }));
  };
  
  const addDialogueEntry = (sceneId: number) => {
      setProScenes(scenes => scenes.map(scene => {
          if (scene.id !== sceneId) return scene;
          const newDialogue: ProDialogueEntry = {
              id: Date.now(),
              actorId: scene.actorsInScene[0]?.id || '', // Default to first actor or empty
              text: '',
          };
          return { ...scene, dialogues: [...scene.dialogues, newDialogue] };
      }));
  };
  
  const removeDialogueEntry = (sceneId: number, dialogueId: number) => {
      setProScenes(scenes => scenes.map(scene => {
          if (scene.id !== sceneId) return scene;
          return { ...scene, dialogues: scene.dialogues.filter(d => d.id !== dialogueId) };
      }));
  };
  
  const updateDialogueEntry = (sceneId: number, dialogueId: number, field: 'actorId' | 'text', value: string) => {
       setProScenes(scenes => scenes.map(scene => {
          if (scene.id !== sceneId) return scene;
          const newDialogues = scene.dialogues.map(d => 
              d.id === dialogueId ? { ...d, [field]: value } : d
          );
          return { ...scene, dialogues: newDialogues };
       }));
  };


  const renderContent = () => {
    switch (view) {
        case 'loading':
            return (
                <div className="w-full h-full flex flex-col items-center justify-center text-center gap-4 text-brand-text-secondary m-auto">
                    <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-brand-blue"></div>
                    <p className="font-semibold text-lg text-brand-text-primary">Menyusun skrip sinematik Anda...</p>
                    <p className="text-sm">{loadingStep}</p>
                </div>
            );
        case 'error':
             const isApiKeyError = error?.includes("Kunci API Gemini belum diatur");
             return (
                <div className="w-full h-full flex flex-col items-center justify-center text-center text-red-400 m-auto bg-brand-bg-light p-6 rounded-2xl border border-brand-border shadow-2xl">
                  <AlertTriangleIcon className="w-12 h-12"/>
                  <p className="font-semibold mt-4">Gagal Menghasilkan</p>
                  <p className="text-sm text-red-300 max-w-md mt-1">{error}</p>
                   {isApiKeyError ? (
                        <button
                            onClick={() => onNavigate('pengaturan')}
                            className="mt-6 flex items-center justify-center gap-2 bg-brand-blue text-white font-bold py-2 px-6 rounded-lg transition-all duration-300 hover:bg-brand-blue-dark"
                        >
                            Pergi ke Pengaturan
                        </button>
                   ) : (
                        <button
                            onClick={() => { setView('form'); scrollToTop(); }}
                            className="mt-6 flex items-center justify-center gap-2 border-2 border-brand-blue text-brand-blue font-bold py-2 px-6 rounded-lg transition-all duration-300 hover:bg-brand-blue hover:text-white"
                        >
                            <ChevronLeftIcon className="w-5 h-5"/>
                            Kembali & Perbaiki
                        </button>
                   )}
                </div>
            );
        case 'result':
            return(
              <div className="flex flex-col h-full w-full animate-fade-in bg-brand-bg-light p-6 rounded-2xl border border-brand-border shadow-2xl">
                  <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                    <h2 className="text-2xl font-bold text-brand-text-primary">Skrip Konten Dihasilkan</h2>
                    <button onClick={handleGenerateClick} disabled={isLoading} className="flex items-center justify-center gap-2 bg-brand-blue hover:bg-brand-blue-dark disabled:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                        <SparklesIcon className="w-5 h-5"/> {isLoading ? 'Membuat ulang...' : 'Buat Ulang Skrip'}
                    </button>
                  </div>
                  
                  <div className="overflow-y-auto space-y-4 pr-2 -mr-2 flex-grow">
                      <h3 className="font-semibold text-brand-text-primary mb-2">Timeline & Editor Adegan</h3>
                      {generatedScript?.map((scenePrompt, index) => (
                         <SceneAccordion 
                              key={index}
                              index={index}
                              scenePrompt={scenePrompt}
                              isOpen={openAccordionIndex === index}
                              onToggle={() => setOpenAccordionIndex(openAccordionIndex === index ? null : index)}
                              onDialogueChange={(newPrompt) => handleDialogueChange(newPrompt, index)}
                              isReorderable={true}
                              onReorder={handleReorderScene}
                              isFirst={index === 0}
                              isLast={index === generatedScript.length - 1}
                              characters={selectedAvatars}
                         />
                      ))}
                  </div>
              </div>
            );
        default: // form
            return(
                <div className="w-full h-full flex flex-col gap-6 animate-fade-in">
                    <div className="w-full flex justify-center items-center gap-2 p-1 bg-brand-bg-dark rounded-lg max-w-sm mx-auto">
                        <button 
                            onClick={() => setActiveTab('instan')}
                            className={`w-1/2 px-4 py-2 text-sm font-semibold rounded-md transition-colors ${activeTab === 'instan' ? 'bg-brand-blue text-white' : 'text-brand-text-secondary hover:bg-brand-bg-light'}`}
                        >
                            Mode Instan
                        </button>
                        <button 
                            onClick={() => setActiveTab('pro')}
                            className={`w-1/2 px-4 py-2 text-sm font-semibold rounded-md transition-colors ${activeTab === 'pro' ? 'bg-brand-blue text-white' : 'text-brand-text-secondary hover:bg-brand-bg-light'}`}
                        >
                            Mode Pro
                        </button>
                    </div>

                    <div className="bg-brand-bg-light p-6 rounded-2xl border border-brand-border shadow-2xl flex flex-col gap-5">
                       <div>
                            <label className="block text-xl font-semibold mb-2 text-center">1. Tulis Ide Cerita Anda</label>
                            <textarea
                                value={storyIdea}
                                onChange={(e) => setStoryIdea(e.target.value)}
                                placeholder="contoh: seorang detektif yang menemukan petunjuk rahasia di sebuah kedai kopi tua."
                                className="w-full h-24 bg-brand-bg-dark border border-brand-border rounded-lg p-3 text-brand-text-primary focus:ring-2 focus:ring-brand-blue outline-none transition"
                            />
                        </div>
                    
                        <div>
                            <label className="block text-xl font-semibold mb-2 text-center">2. Pilih Aktor (Bisa lebih dari satu)</label>
                            <div className="bg-brand-bg-dark p-3 rounded-lg max-h-56 overflow-y-auto">
                                <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-3">
                                    <div className="flex flex-col items-center gap-1.5">
                                        <button onClick={() => onNavigate('buat-avatar')} className="relative aspect-square rounded-lg overflow-hidden border-2 border-dashed border-brand-border hover:border-brand-blue transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-brand-bg-dark focus:ring-brand-blue w-full">
                                            <div className="w-full h-full bg-brand-bg-light flex items-center justify-center rounded-md">
                                                <PlusCircleIcon className="w-8 h-8 text-brand-text-secondary" />
                                            </div>
                                        </button>
                                        <p className="text-xs text-center text-brand-text-secondary w-full truncate" title="Tambah Avatar">Tambah Avatar</p>
                                    </div>
                                    {savedAvatars.map(avatar => {
                                        const isSelected = selectedAvatars.some(a => a.id === avatar.id);
                                        return (
                                        <div key={avatar.id} className="flex flex-col items-center gap-1.5">
                                            <button onClick={() => handleAvatarSelect(avatar)} className="relative aspect-square rounded-lg overflow-hidden border-2 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-brand-bg-dark focus:ring-brand-blue w-full"
                                            style={{ borderColor: isSelected ? '#007BFF' : 'transparent' }}
                                            >
                                                <img src={avatar.imageUrl} alt={avatar.prompt} className="w-full h-full object-cover" />
                                                {isSelected && (
                                                    <div className="absolute inset-0 bg-brand-blue/50 flex items-center justify-center">
                                                        <SparklesIcon className="w-6 h-6 text-white"/>
                                                    </div>
                                                )}
                                            </button>
                                            <p className="text-xs text-center text-brand-text-secondary w-full truncate" title={avatar.name}>{avatar.name}</p>
                                        </div>
                                    )})}
                                </div>
                        </div>
                        </div>
                    </div>
                    
                    <div className="bg-brand-bg-light p-6 rounded-2xl border border-brand-border shadow-2xl flex flex-col gap-5">
                      <h3 className="text-xl font-semibold text-center">3. Atur Detail Skrip</h3>
                      
                      {activeTab === 'instan' ? (
                          <div className="animate-fade-in grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                              <label className="block text-sm font-medium text-brand-text-secondary mb-1">Bahasa Dialog</label>
                              <select value={dialogueLanguage} onChange={e => setDialogueLanguage(e.target.value)} className="w-full bg-brand-bg-dark border border-brand-border rounded-lg p-2.5 text-brand-text-primary focus:ring-2 focus:ring-brand-blue outline-none transition">
                                {dialogueLanguageOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-brand-text-secondary mb-1">Gaya Video</label>
                              <select value={videoStyle} onChange={e => setVideoStyle(e.target.value)} className="w-full bg-brand-bg-dark border border-brand-border rounded-lg p-2.5 text-brand-text-primary focus:ring-2 focus:ring-brand-blue outline-none transition">
                                {videoStyleOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-brand-text-secondary mb-1">Mood Video</label>
                              <select value={videoMood} onChange={e => setVideoMood(e.target.value)} className="w-full bg-brand-bg-dark border border-brand-border rounded-lg p-2.5 text-brand-text-primary focus:ring-2 focus:ring-brand-blue outline-none transition">
                                {videoMoodOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-brand-text-secondary mb-1">Jumlah Adegan</label>
                              <select value={sceneCount} onChange={e => setSceneCount(Number(e.target.value))} className="w-full bg-brand-bg-dark border border-brand-border rounded-lg p-2.5 text-brand-text-primary focus:ring-2 focus:ring-brand-blue outline-none transition">
                                {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n} adegan</option>)}
                              </select>
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-brand-text-secondary mb-2">Lokasi Keseluruhan (Opsional)</label>
                                <div className="bg-brand-bg-dark p-3 rounded-lg max-h-60 overflow-y-auto">
                                    <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3 justify-center">
                                        <div className="flex flex-col items-center gap-1.5">
                                            <button onClick={() => setSelectedLocation(AI_LOCATION_PLACEHOLDER)} className="relative aspect-square rounded-lg overflow-hidden border-2 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-brand-bg-dark focus:ring-brand-blue w-full"
                                            style={{ borderColor: selectedLocation.id === 'ai-location' ? '#007BFF' : 'transparent' }}>
                                                <div className="w-full h-full bg-brand-bg-light flex items-center justify-center rounded-md">
                                                    <SparklesIcon className="w-8 h-8 text-brand-text-secondary" />
                                                </div>
                                                    {selectedLocation.id === 'ai-location' && (
                                                    <div className="absolute inset-0 bg-brand-blue/50 flex items-center justify-center">
                                                        <SparklesIcon className="w-6 h-6 text-white"/>
                                                    </div>
                                                )}
                                            </button>
                                            <p className="text-xs text-center text-brand-text-secondary w-full truncate" title="AI Pilihan">AI Pilihan</p>
                                        </div>
                                        {savedLocations.map(loc => (
                                            <div key={loc.id} className="flex flex-col items-center gap-1.5">
                                                <button onClick={() => setSelectedLocation(loc)} className="relative aspect-square rounded-lg overflow-hidden border-2 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-brand-bg-dark focus:ring-brand-blue w-full"
                                                style={{ borderColor: selectedLocation.id === loc.id ? '#007BFF' : 'transparent' }}>
                                                    <img src={loc.imageUrl} alt={loc.name} className="w-full h-full object-cover" />
                                                    {selectedLocation.id === loc.id && (
                                                        <div className="absolute inset-0 bg-brand-blue/50 flex items-center justify-center">
                                                            <MapPinIcon className="w-6 h-6 text-white"/>
                                                        </div>
                                                    )}
                                                </button>
                                                <p className="text-xs text-center text-brand-text-secondary w-full truncate" title={loc.name}>{loc.name}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                          </div>
                      ) : ( // Pro Mode
                          <div className="animate-fade-in space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-brand-text-secondary mb-1">Bahasa Dialog</label>
                                <select value={dialogueLanguage} onChange={e => setDialogueLanguage(e.target.value)} className="w-full bg-brand-bg-dark border border-brand-border rounded-lg p-2.5 text-brand-text-primary focus:ring-2 focus:ring-brand-blue outline-none transition">
                                  {dialogueLanguageOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                </select>
                            </div>
                            <hr className="border-brand-border"/>
                            {proScenes.map((scene, index) => (
                               <div key={scene.id} className="p-4 bg-brand-bg-dark rounded-lg border border-brand-border space-y-3">
                                  <div className="flex justify-between items-center">
                                    <h4 className="font-bold text-brand-text-primary">Adegan {index + 1}</h4>
                                    {proScenes.length > 1 && <button onClick={() => removeProScene(scene.id)} className="p-1 text-red-500 hover:text-red-400"><TrashIcon className="w-4 h-4" /></button>}
                                  </div>
                                  <textarea value={scene.description} onChange={e => handleProSceneChange(scene.id, 'description', e.target.value)} placeholder="Deskripsi Adegan (Plot)" className="w-full h-20 bg-black/30 border border-brand-border rounded-lg p-2 text-brand-text-primary focus:ring-2 focus:ring-brand-blue outline-none transition"></textarea>
                                  
                                  <div className="relative">
                                    <input type="text" value={scene.location} onChange={e => handleProSceneChange(scene.id, 'location', e.target.value)} placeholder="Lokasi / Setting" className="w-full bg-black/30 border border-brand-border rounded-lg p-2 text-brand-text-primary focus:ring-2 focus:ring-brand-blue outline-none transition" />
                                    <details className="absolute top-1 right-1">
                                        <summary className="list-none cursor-pointer p-1 rounded-full bg-brand-bg-light hover:bg-brand-border">
                                            <MapPinIcon className="w-5 h-5 text-brand-text-secondary" />
                                        </summary>
                                        <div className="absolute right-0 mt-2 w-48 bg-brand-bg-dark border border-brand-border rounded-lg shadow-lg z-10">
                                            {savedLocations.length > 0 ? savedLocations.map(loc => (
                                                <button key={loc.id} onClick={() => useSavedLocationInProScene(scene.id, loc.prompt)} className="block w-full text-left px-3 py-2 text-sm text-brand-text-secondary hover:bg-brand-blue hover:text-white first:rounded-t-lg last:rounded-b-lg">
                                                    {loc.name}
                                                </button>
                                            )) : <p className="p-3 text-xs text-brand-text-secondary">Tidak ada lokasi tersimpan.</p>}
                                        </div>
                                    </details>
                                  </div>

                                  <textarea value={scene.actions} onChange={e => handleProSceneChange(scene.id, 'actions', e.target.value)} placeholder="Aksi Karakter & Ekspresi" className="w-full h-20 bg-black/30 border border-brand-border rounded-lg p-2 text-brand-text-primary focus:ring-2 focus:ring-brand-blue outline-none transition"></textarea>
                                  
                                  <div>
                                    <h5 className="text-sm font-semibold text-brand-text-secondary mb-2">Aktor dalam Adegan Ini</h5>
                                    {selectedAvatars.length > 0 ? (
                                        <div className="flex flex-wrap gap-2">
                                            {selectedAvatars.map(avatar => {
                                                const isChecked = scene.actorsInScene.some(a => a.id === avatar.id);
                                                return (
                                                    <button key={avatar.id} onClick={() => handleSceneActorToggle(scene.id, avatar)}
                                                        className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                                                            isChecked ? 'bg-blue-500 border-blue-500 text-white' : 'bg-brand-bg-light border-brand-border text-brand-text-secondary hover:bg-brand-border'
                                                        }`}
                                                    >
                                                        {avatar.name}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    ) : <p className="text-xs text-brand-text-secondary">Pilih aktor di Langkah 2 untuk menambahkannya ke adegan.</p>}
                                  </div>
                                  
                                  <div className="border-t border-brand-border/50 pt-3">
                                    <h5 className="text-sm font-semibold text-brand-text-secondary mb-2 mt-1">Urutan Dialog</h5>
                                    {scene.actorsInScene.length > 0 ? (
                                        <div className="space-y-3">
                                            {scene.dialogues.map((dialogue) => (
                                                <div key={dialogue.id} className="flex items-start gap-2">
                                                    <select 
                                                        value={dialogue.actorId} 
                                                        onChange={e => updateDialogueEntry(scene.id, dialogue.id, 'actorId', e.target.value)}
                                                        className="flex-shrink-0 w-28 bg-black/30 border border-brand-border rounded-lg p-2 text-brand-text-primary focus:ring-2 focus:ring-brand-blue outline-none transition text-sm"
                                                    >
                                                        {scene.actorsInScene.map(actor => (
                                                          <option key={actor.id} value={actor.id}>{actor.name}</option>
                                                        ))}
                                                    </select>
                                                    <textarea
                                                        value={dialogue.text}
                                                        onChange={e => updateDialogueEntry(scene.id, dialogue.id, 'text', e.target.value)}
                                                        placeholder={`Tulis dialog...`}
                                                        className="w-full h-16 bg-black/30 border border-brand-border rounded-lg p-2 text-brand-text-primary focus:ring-2 focus:ring-brand-blue outline-none transition text-sm"
                                                    />
                                                    <button onClick={() => removeDialogueEntry(scene.id, dialogue.id)} className="p-2 text-red-500 hover:text-red-400 flex-shrink-0"><TrashIcon className="w-4 h-4" /></button>
                                                </div>
                                            ))}
                                            <button onClick={() => addDialogueEntry(scene.id)} className="w-full text-xs flex items-center justify-center gap-1 border border-dashed border-brand-border hover:border-brand-blue text-brand-text-secondary hover:text-brand-blue font-bold py-1.5 px-2 rounded-lg transition-colors">
                                                <PlusCircleIcon className="w-4 h-4" /> Tambah Dialog
                                            </button>
                                        </div>
                                    ) : <p className="text-xs text-brand-text-secondary">Pilih aktor di atas untuk mulai menulis dialog.</p>}
                                  </div>
                                  
                                  <select value={scene.mood} onChange={e => handleProSceneChange(scene.id, 'mood', e.target.value)} className="w-full bg-black/30 border border-brand-border rounded-lg p-2.5 text-brand-text-primary focus:ring-2 focus:ring-brand-blue outline-none transition">
                                    <option value="Default" disabled>Pilih Mood Adegan</option>
                                    {videoMoodOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                  </select>
                               </div>
                            ))}
                            {proScenes.length < 5 && (
                                <button onClick={addProScene} className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-brand-border hover:border-brand-blue text-brand-text-secondary hover:text-brand-blue font-bold py-2 px-4 rounded-lg transition-colors">
                                  <PlusCircleIcon className="w-5 h-5"/> Tambah Adegan
                                </button>
                            )}
                          </div>
                      )}

                    </div>
                    
                     <div className="mt-auto">
                         <button
                            onClick={handleGenerateClick}
                            disabled={isLoading || !storyIdea.trim() || selectedAvatars.length === 0}
                            className="w-full flex items-center justify-center gap-2 bg-brand-blue hover:bg-brand-blue-dark disabled:bg-gray-500 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 disabled:scale-100"
                          >
                            <SparklesIcon className="w-5 h-5"/>
                            {isLoading ? 'Menghasilkan...' : 'Racik Jadi Prompt Video'}
                        </button>
                     </div>
                </div>
            );
    }
  }

  return (
    <div ref={pageTopRef} className="w-full h-full flex flex-col">
        <header className="w-full max-w-6xl text-center mb-8 mx-auto">
            <div className="flex items-center justify-center gap-3 mb-2">
                <FilmIcon className="w-8 h-8 text-purple-400" />
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
                    Buat Konten Viral
                </h1>
            </div>
            <p className="text-md sm:text-lg text-brand-text-secondary max-w-3xl mx-auto">
              Ubah ide cerita sederhana menjadi skrip video multi-adegan yang siap untuk menjadi viral.
            </p>
        </header>

        <main className="w-full max-w-7xl mx-auto flex flex-col gap-8 flex-grow">
            {renderContent()}
        </main>
    </div>
  );
};

export default ViralContentCreatorPage;