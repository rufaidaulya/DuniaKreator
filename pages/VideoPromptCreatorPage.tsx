import React, { useState, useRef, useEffect } from 'react';
import { VideoContext } from '../App';
import { generateVideoPrompt } from '../services/videoPromptService';
import { SceneAccordion } from '../components/SceneAccordion';
import { saveVideoPromptHistory } from '../utils/historyStorage';
import { VideoIcon, SparklesIcon, AlertTriangleIcon, RefreshCwIcon } from '../components/IconComponents';

interface VideoPromptCreatorPageProps {
  context: VideoContext | null;
  onNavigateBack: () => void;
}

const VideoPromptCreatorPage: React.FC<VideoPromptCreatorPageProps> = ({ context, onNavigateBack }) => {
  const pageTopRef = useRef<HTMLDivElement>(null);
  
  const [videoStyle, setVideoStyle] = useState<string>('');
  const [sceneCount, setSceneCount] = useState<number>(3);
  const [dialogueLanguage, setDialogueLanguage] = useState<string>('Indonesia');
  const [callToAction, setCallToAction] = useState<string>('Cek keranjang kuning!');
  const [customCallToAction, setCustomCallToAction] = useState<string>('');
  const [avatarFraming, setAvatarFraming] = useState<string>('Default (bebas gaya campuran)');

  const [generatedScript, setGeneratedScript] = useState<string[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [openAccordionIndex, setOpenAccordionIndex] = useState<number | null>(null);
  
  useEffect(() => {
    if (context?.videoStyle) {
      setVideoStyle(context.videoStyle);
    }
  }, [context]);

  const scrollToTop = () => {
    pageTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };


  const handleGenerateClick = async () => {
    if (!context) {
      setError("Tidak ada konteks yang tersedia. Silakan kembali dan buat konten terlebih dahulu.");
      return;
    }
    const finalCTA = callToAction === 'Isi Sendiri' ? customCallToAction : callToAction;
    if (!finalCTA.trim()){
      setError("Silakan tentukan Call to Action (CTA).");
      return;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedScript(null);
    setOpenAccordionIndex(null);
    scrollToTop();

    try {
      const scriptJsonString = await generateVideoPrompt(
        context.sceneDescription,
        context.productDescription,
        videoStyle,
        dialogueLanguage,
        sceneCount,
        finalCTA,
        context.avatarName,
        avatarFraming,
        context.avatarPrompt,
        context.tvName,
        context.newsLocation,
        context.koreaLocation,
        context.majapahitLocation,
        context.scifiLocation
      );
      
      let jsonToParse = scriptJsonString.trim();
      const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
      const match = jsonToParse.match(fenceRegex);
      if (match && match[2]) {
        jsonToParse = match[2].trim();
      }
      
      let parsedScript;
      try {
        parsedScript = JSON.parse(jsonToParse);
      } catch (parseError) {
        console.error("JSON Parsing Error:", parseError);
        console.error("Invalid JSON string received:", jsonToParse);
        throw new Error("Gagal mem-parsing skrip dari AI karena formatnya tidak valid. Silakan coba buat ulang.");
      }

      if (parsedScript.video_script && Array.isArray(parsedScript.video_script)) {
        setGeneratedScript(parsedScript.video_script);
        setOpenAccordionIndex(null); // All accordions closed by default
        
        saveVideoPromptHistory({
          title: `Video Iklan: ${context.avatarName} - ${videoStyle}`,
          script: parsedScript.video_script,
        });
      } else {
        throw new Error("Menerima format skrip yang tidak valid dari AI. Kunci 'video_script' tidak ditemukan.");
      }
    } catch (e) {
      console.error(e);
      const errorMessage = e instanceof Error ? e.message : 'Terjadi kesalahan yang tidak diketahui.';
      setError(`Gagal membuat skrip video. Kesalahan: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleToggleAccordion = (index: number) => {
    setOpenAccordionIndex(openAccordionIndex === index ? null : index);
  };
  
  const handleDialogueChange = (newPrompt: string, index: number) => {
    if (!generatedScript) return;
    
    const updatedScript = [...generatedScript];
    updatedScript[index] = newPrompt;
    setGeneratedScript(updatedScript);
  };


  if (!context) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-center animate-fade-in text-brand-text-secondary">
          <VideoIcon className="w-24 h-24 mb-6 opacity-30"/>
          <h1 className="text-4xl font-bold text-brand-text-primary mb-2">Buat Prompt Video</h1>
          <p className="mt-4 max-w-md">
              Untuk membuat skrip video, Anda harus membuat konten jualan terlebih dahulu.
          </p>
          <button
              onClick={onNavigateBack}
              className="mt-6 inline-flex items-center justify-center gap-2 bg-brand-blue hover:bg-brand-blue-dark text-white font-bold py-3 px-6 rounded-full transition-colors"
          >
              Pergi ke Kreator Konten
          </button>
      </div>
    );
  }

  return (
    <div ref={pageTopRef} className="w-full h-full flex flex-col">
      <header className="w-full max-w-6xl text-center mb-8 mx-auto">
        <div className="flex items-center justify-center gap-3 mb-2">
            <VideoIcon className="w-8 h-8 text-purple-400" />
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
                Buat Prompt Video
            </h1>
        </div>
        <p className="text-md sm:text-lg text-brand-text-secondary max-w-3xl mx-auto">
          Hasilkan skrip detail untuk iklan video Anda berikutnya, siap untuk AI teks-ke-video seperti Veo.
        </p>
      </header>
      
      <main className="w-full max-w-6xl mx-auto flex flex-col lg:flex-row gap-8 flex-grow">
          <div className="w-full lg:w-1/3 flex-shrink-0 bg-brand-bg-light p-6 rounded-2xl border border-brand-border shadow-2xl flex flex-col gap-6">
              
               <div>
                  <label className="block text-xl font-semibold mb-3 text-center">1. Atur Detail Skrip</label>
                  <div className='space-y-4'>
                    <div>
                      <label htmlFor="sceneCount" className="block text-sm font-medium text-brand-text-secondary mb-1">Jumlah Adegan</label>
                      <select
                          id="sceneCount"
                          value={sceneCount}
                          onChange={e => setSceneCount(Number(e.target.value))}
                          className="w-full bg-brand-bg-dark border border-brand-border rounded-lg p-3 text-brand-text-primary focus:ring-2 focus:ring-brand-blue outline-none transition"
                      >
                          {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
                      </select>
                    </div>

                     {context.avatarName !== 'Narator' && (
                        <div className='animate-fade-in'>
                            <label htmlFor="avatarFraming" className="block text-sm font-medium text-brand-text-secondary mb-1">Tampilan Avatar</label>
                            <select
                                id="avatarFraming"
                                value={avatarFraming}
                                onChange={e => setAvatarFraming(e.target.value)}
                                className="w-full bg-brand-bg-dark border border-brand-border rounded-lg p-3 text-brand-text-primary focus:ring-2 focus:ring-brand-blue outline-none transition"
                            >
                                <option>Default (bebas gaya campuran)</option>
                                <option>Full Badan</option>
                                <option>Setengah Badan</option>
                            </select>
                        </div>
                    )}

                     <div>
                      <label htmlFor="dialogueLanguage" className="block text-sm font-medium text-brand-text-secondary mb-1">Bahasa & Logat Dialog</label>
                      <select
                          id="dialogueLanguage"
                          value={dialogueLanguage}
                          onChange={e => setDialogueLanguage(e.target.value)}
                          className="w-full bg-brand-bg-dark border border-brand-border rounded-lg p-3 text-brand-text-primary focus:ring-2 focus:ring-brand-blue outline-none transition"
                      >
                          <option>Indonesia</option>
                          <option>Indonesia dengan logat Jawa</option>
                          <option>Jawa</option>
                      </select>
                    </div>
                    <div>
                        <label htmlFor="callToAction" className="block text-sm font-medium text-brand-text-secondary mb-1">Call to Action (CTA)</label>
                        <select
                            id="callToAction"
                            value={callToAction}
                            onChange={e => setCallToAction(e.target.value)}
                            className="w-full bg-brand-bg-dark border border-brand-border rounded-lg p-3 text-brand-text-primary focus:ring-2 focus:ring-brand-blue outline-none transition"
                        >
                            <option>Cek keranjang kuning!</option>
                            <option>Klik link di bio!</option>
                            <option>Hubungi nomor di profil!</option>
                            <option value="Isi Sendiri">Isi Sendiri...</option>
                        </select>
                    </div>
                     {callToAction === 'Isi Sendiri' && (
                       <div className='animate-fade-in'>
                         <label htmlFor="customCallToAction" className="block text-sm font-medium text-brand-text-secondary mb-1">Tuliskan CTA Anda</label>
                         <input
                            id="customCallToAction"
                            type="text"
                            value={customCallToAction}
                            onChange={(e) => setCustomCallToAction(e.target.value)}
                            placeholder="contoh: Daftar sekarang!"
                            className="w-full bg-brand-bg-dark border border-brand-border rounded-lg p-3 text-brand-text-primary focus:ring-2 focus:ring-brand-blue outline-none transition"
                         />
                       </div>
                    )}
                  </div>
              </div>
              <div className="mt-auto">
                  <button
                      onClick={handleGenerateClick}
                      disabled={isLoading}
                      className="w-full flex items-center justify-center gap-2 bg-brand-blue hover:bg-brand-blue-dark disabled:bg-gray-500 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 disabled:scale-100"
                  >
                      <SparklesIcon className="w-5 h-5"/>
                      {isLoading ? 'Menghasilkan Skrip...' : '2. Hasilkan Skrip Video'}
                  </button>
              </div>
          </div>
          
           <div className="w-full lg:w-2/3 bg-brand-bg-light p-6 rounded-2xl border border-brand-border shadow-2xl flex flex-col min-h-[400px] lg:min-h-0">
               {error && (
                <div className="text-center text-red-400 flex flex-col items-center gap-3 m-auto">
                  <AlertTriangleIcon className="w-12 h-12"/>
                  <p className="font-semibold">Gagal Menghasilkan</p>
                  <p className="text-sm text-red-300 max-w-md">{error}</p>
                </div>
              )}
              {isLoading && (
                  <div className="flex flex-col items-center justify-center text-center gap-4 m-auto">
                      <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-brand-blue"></div>
                      <p className="font-semibold text-lg text-brand-text-primary">Menghasilkan skrip Anda...</p>
                  </div>
              )}
              {!error && !isLoading && generatedScript && (
                  <div className="flex flex-col h-full animate-fade-in">
                      <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                        <h2 className="text-2xl font-bold text-brand-text-primary">Skrip Video yang Dihasilkan</h2>
                        <button onClick={handleGenerateClick} className="flex items-center justify-center gap-2 bg-brand-blue hover:bg-brand-blue-dark text-white font-bold py-2 px-4 rounded-lg transition-colors">
                            <RefreshCwIcon className="w-5 h-5"/> Buat Ulang
                        </button>
                      </div>
                      <div className="overflow-y-auto space-y-4 pr-2 -mr-2 flex-grow">
                        {generatedScript.map((scenePrompt, index) => (
                           scenePrompt ? (
                             <SceneAccordion 
                                  key={index}
                                  index={index}
                                  scenePrompt={scenePrompt}
                                  isOpen={openAccordionIndex === index}
                                  onToggle={() => handleToggleAccordion(index)}
                                  onDialogueChange={(newPrompt) => handleDialogueChange(newPrompt, index)}
                             />
                           ) : null
                        ))}
                      </div>
                  </div>
              )}
               {!error && !isLoading && !generatedScript && (
                    <div className="m-auto text-center text-brand-text-secondary">
                        <VideoIcon className="w-24 h-24 mb-4 opacity-30 mx-auto"/>
                        <h3 className="text-xl font-semibold text-brand-text-primary">Skrip video Anda akan muncul di sini</h3>
                        <p className="mt-2 max-w-xs mx-auto">Pilih gaya dan atur detail Anda, lalu klik "Hasilkan" untuk membuat skrip Anda.</p>
                    </div>
               )}
           </div>
      </main>
    </div>
  );
};

export default VideoPromptCreatorPage;