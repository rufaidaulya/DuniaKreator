import React, { useState, useRef } from 'react';
import { generateSongLyrics, generateSongCoverPrompt, generateImageFromPrompt } from '../services/songService';
import { SparklesIcon, AlertTriangleIcon, MusicIcon, PencilIcon, ClipboardIcon, ChevronLeftIcon, DownloadIcon } from '../components/IconComponents';
import { ResultPreviewModal, HistoryPrompt } from '../components/ResultPreviewModal';

interface SongCreatorPageProps {
  onNavigate: (page: string) => void;
}

type View = 'form' | 'loading' | 'result' | 'error';

const genreOptions = ['Pop', 'Rock', 'Dangdut', 'Hip-Hop/Rap', 'R&B', 'Jazz', 'Akustik Santai', 'Lagu Anak-Anak'];
const moodOptions = ['Senang & Ceria', 'Sedih & Melankolis', 'Semangat & Motivasi', 'Romantis', 'Marah & Protes', 'Misterius', 'Damai & Tenang'];
const languageOptions = ['Indonesia', 'Inggris (English)', 'Jawa', 'Sunda', 'Spanyol (Español)'];

interface SongResult {
    title: string;
    artist: string;
    lyrics: string;
}

const LoadingSpinner: React.FC = () => (
    <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-brand-blue"></div>
);

const SongCreatorPage: React.FC<SongCreatorPageProps> = ({ onNavigate }) => {
    const pageTopRef = useRef<HTMLDivElement>(null);

    // Form State
    const [songIdea, setSongIdea] = useState('');
    const [artistName, setArtistName] = useState('');
    const [genre, setGenre] = useState<string>(genreOptions[0]);
    const [mood, setMood] = useState<string>(moodOptions[0]);
    const [language, setLanguage] = useState<string>(languageOptions[0]);
    const [structure, setStructure] = useState<string>('');

    // View & Loading State
    const [view, setView] = useState<View>('form');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [loadingStep, setLoadingStep] = useState('');
    const [error, setError] = useState<string | null>(null);

    // Result State
    const [generatedSong, setGeneratedSong] = useState<SongResult | null>(null);
    const [editableLyrics, setEditableLyrics] = useState<string>('');
    const [generatedCoverUrl, setGeneratedCoverUrl] = useState<string | null>(null);
    const [resultPrompts, setResultPrompts] = useState<HistoryPrompt[]>([]);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [copied, setCopied] = useState(false);

    // Download State
    const [isDownloadingCover, setIsDownloadingCover] = useState<boolean>(false);
    const [coverDownloadUrl, setCoverDownloadUrl] = useState<string | null>(null);
    const [coverDownloadError, setCoverDownloadError] = useState<string | null>(null);
    const [copiedCoverLink, setCopiedCoverLink] = useState<boolean>(false);


    const scrollToTop = () => {
        pageTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const handleCreateNew = () => {
        setSongIdea('');
        setArtistName('');
        setGenre(genreOptions[0]);
        setMood(moodOptions[0]);
        setLanguage(languageOptions[0]);
        setStructure('');
        setGeneratedSong(null);
        setEditableLyrics('');
        setGeneratedCoverUrl(null);
        setError(null);
        setView('form');
        setIsPreviewOpen(false);
        setResultPrompts([]);
        setIsDownloadingCover(false);
        setCoverDownloadUrl(null);
        setCoverDownloadError(null);
        setCopiedCoverLink(false);
        scrollToTop();
    };

    const handleGenerateClick = async () => {
        if (!songIdea.trim() || !artistName.trim()) {
            setError("Silakan isi ide lagu dan nama artis.");
            setView('error');
            scrollToTop();
            return;
        }

        setIsLoading(true);
        setView('loading');
        setError(null);
        scrollToTop();

        try {
            // Step 1: Generate Lyrics
            setLoadingStep('Langkah 1/3: Menulis lirik lagu...');
            const lyricsJson = await generateSongLyrics(songIdea, genre, mood, language, structure, artistName);
            const parsedSong = JSON.parse(lyricsJson).song as SongResult;
            setGeneratedSong(parsedSong);
            setEditableLyrics(parsedSong.lyrics);

            // Step 2: Generate Cover Prompt
            setLoadingStep('Langkah 2/3: Mendesain prompt untuk sampul lagu...');
            const lyricsSummary = `Sebuah lagu ${genre} yang ${mood.toLowerCase()} berjudul "${parsedSong.title}" oleh ${parsedSong.artist}. Liriknya tentang: ${songIdea}`;
            const coverPrompt = await generateSongCoverPrompt(parsedSong.title, parsedSong.artist, lyricsSummary, genre, mood);

            // Step 3: Generate Cover Image
            setLoadingStep('Langkah 3/3: Menghasilkan gambar sampul...');
            const coverImageBase64 = await generateImageFromPrompt(coverPrompt);
            const coverImageUrl = `data:image/jpeg;base64,${coverImageBase64}`;
            setGeneratedCoverUrl(coverImageUrl);
            
            const promptsForHistory: HistoryPrompt[] = [
                { title: 'Ide Lagu', prompt: songIdea },
                { title: 'Nama Artis', prompt: artistName },
                { title: 'Genre', prompt: genre },
                { title: 'Mood', prompt: mood },
                { title: 'Bahasa', prompt: language },
                { title: 'Prompt Sampul Lagu', prompt: coverPrompt },
            ];
            setResultPrompts(promptsForHistory);

            setView('result');

        } catch (e) {
            console.error(e);
            const errorMessage = e instanceof Error ? e.message : 'Terjadi kesalahan yang tidak diketahui.';
            setError(`Gagal membuat lagu. Detail: ${errorMessage}`);
            setView('error');
        } finally {
            setIsLoading(false);
            setLoadingStep('');
        }
    };
    
    const handleCopyLyrics = () => {
        if (!editableLyrics) return;
        navigator.clipboard.writeText(editableLyrics);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    
    const handleDownloadCoverImage = async () => {
      if (!generatedCoverUrl) return;

      setIsDownloadingCover(true);
      setCoverDownloadUrl(null);
      setCoverDownloadError(null);
      setCopiedCoverLink(false);

      try {
          const res = await fetch(generatedCoverUrl);
          const blob = await res.blob();
          const fileName = `duniakreator_song_cover_${Date.now()}.jpg`;
          const file = new File([blob], fileName, { type: 'image/jpeg' });
          
          const formData = new FormData();
          formData.append('file', file);

          const response = await fetch('https://tmpfiles.org/api/v1/upload', {
              method: 'POST',
              body: formData,
          });

          if (!response.ok) {
              const errorText = await response.text();
              throw new Error(`Gagal mengunggah gambar sampul: ${response.status} ${errorText}`);
          }

          const result = await response.json();
          if (result.status === 'success' && result.data.url) {
              const finalUrl = result.data.url.replace('/file/', '/dl/');
              setCoverDownloadUrl(finalUrl);
          } else {
              throw new Error('Gagal mendapatkan URL unduhan sampul. ' + (result.data?.error || ''));
          }

      } catch (e) {
          console.error(e);
          const errorMessage = e instanceof Error ? e.message : 'Terjadi kesalahan saat mengunggah gambar sampul.';
          setCoverDownloadError(errorMessage);
      } finally {
          setIsDownloadingCover(false);
      }
    };

    const handleCopyCoverLink = () => {
        if (!coverDownloadUrl) return;
        navigator.clipboard.writeText(coverDownloadUrl);
        setCopiedCoverLink(true);
        setTimeout(() => setCopiedCoverLink(false), 2000);
    };

    const renderContent = () => {
        switch (view) {
            case 'loading':
                return (
                    <div className="flex-grow flex flex-col items-center justify-center text-center gap-4 text-brand-text-secondary m-auto">
                        <LoadingSpinner />
                        <p className="font-semibold text-lg text-brand-text-primary">Menciptakan Mahakarya...</p>
                        <p className="text-sm max-w-md">{loadingStep}</p>
                    </div>
                );
            case 'error':
                const isApiKeyError = error?.includes("Kunci API");
                return (
                    <div className="w-full flex flex-col items-center justify-center text-center text-red-400 m-auto bg-brand-bg-light p-6 rounded-2xl border border-brand-border shadow-2xl">
                        <AlertTriangleIcon className="w-12 h-12" />
                        <p className="font-semibold mt-4">Gagal Membuat Lagu</p>
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
                                <ChevronLeftIcon className="w-5 h-5" />
                                Kembali & Perbaiki
                            </button>
                       )}
                    </div>
                );
            case 'result':
                return (
                    <>
                    <div className="w-full h-full flex flex-col xl:flex-row gap-6 bg-brand-bg-light p-6 rounded-2xl border border-brand-border shadow-2xl animate-fade-in">
                        {/* Left Side: Cover Art */}
                        <div className="flex-shrink-0 xl:w-1/3 flex flex-col items-center gap-4">
                            {generatedCoverUrl ? (
                                <button onClick={() => setIsPreviewOpen(true)} className="w-full max-w-sm aspect-square relative group">
                                     <img src={generatedCoverUrl} alt="Song Cover Art" className="w-full h-full object-cover rounded-lg shadow-2xl"/>
                                     <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                                        <p className="text-white font-bold">Lihat Detail</p>
                                    </div>
                                </button>
                            ) : (
                                <div className="rounded-lg shadow-2xl w-full max-w-sm aspect-square object-cover bg-brand-bg-dark flex items-center justify-center">
                                    <MusicIcon className="w-24 h-24 text-brand-text-secondary"/>
                                </div>
                            )}
                            
                            {generatedCoverUrl && (
                                <div className="w-full max-w-sm space-y-2">
                                    <button
                                        onClick={handleDownloadCoverImage}
                                        disabled={isDownloadingCover}
                                        className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-500 disabled:cursor-not-allowed text-white font-bold py-2.5 px-4 rounded-lg transition-colors"
                                    >
                                        <DownloadIcon className="w-5 h-5"/>
                                        {isDownloadingCover ? 'Mengunggah...' : 'Unduh Gambar Sampul'}
                                    </button>
                                    {isDownloadingCover && <div className="w-full bg-gray-700/50 rounded-full h-1.5"><div className="bg-purple-500 h-1.5 rounded-full animate-pulse"></div></div>}
                                    {coverDownloadUrl && (
                                        <div className="p-2 bg-black/30 rounded-lg animate-fade-in">
                                            <p className="text-xs text-green-400 font-semibold mb-1.5">✔️ Link sampul berhasil dibuat!</p>
                                            <div className="flex items-center gap-2">
                                                <input type="text" readOnly value={coverDownloadUrl} className="w-full bg-brand-bg-light border border-brand-border rounded-md p-1.5 text-brand-text-secondary text-xs" />
                                                <button onClick={handleCopyCoverLink} className="flex-shrink-0 bg-brand-blue hover:bg-brand-blue-dark text-white font-bold py-1.5 px-2 rounded-md text-xs">
                                                    {copiedCoverLink ? 'Tersalin' : <ClipboardIcon className="w-4 h-4"/>}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                    {coverDownloadError && (
                                        <div className="text-xs text-red-400 flex items-center gap-1.5">
                                            <AlertTriangleIcon className="w-4 h-4" />
                                            <span>{coverDownloadError}</span>
                                        </div>
                                    )}
                                </div>
                            )}

                             <button onClick={handleCreateNew} className="mt-auto w-full max-w-sm flex items-center justify-center gap-2 border-2 border-gray-600 text-gray-300 font-bold py-3 px-4 rounded-lg transition-all duration-300 hover:bg-gray-600 hover:text-white">
                                <PencilIcon className="w-5 h-5"/> Buat Lagu Baru
                            </button>
                        </div>

                        {/* Right Side: Lyrics */}
                        <div className="flex-grow xl:w-2/3 flex flex-col">
                            <h2 className="text-3xl font-bold text-brand-text-primary">{generatedSong?.title}</h2>
                            <h3 className="text-lg text-brand-text-secondary mb-3">oleh {generatedSong?.artist}</h3>
                            <div className="relative flex-grow">
                               <textarea
                                   value={editableLyrics}
                                   onChange={e => setEditableLyrics(e.target.value)}
                                   className="w-full h-full min-h-[300px] bg-brand-bg-dark border border-brand-border rounded-lg p-4 text-brand-text-secondary whitespace-pre-wrap resize-y focus:ring-2 focus:ring-brand-blue outline-none"
                               />
                               <button
                                   onClick={handleCopyLyrics}
                                   className="absolute top-3 right-3 flex items-center justify-center gap-2 bg-brand-border hover:bg-gray-600 text-brand-text-secondary font-bold py-2 px-3 rounded-lg transition-colors"
                                >
                                    <ClipboardIcon className="w-5 h-5"/>
                                    {copied ? 'Tersalin!' : 'Salin Lirik'}
                                </button>
                            </div>
                        </div>
                    </div>
                     {isPreviewOpen && generatedCoverUrl && (
                        <ResultPreviewModal 
                            imageUrl={generatedCoverUrl}
                            prompts={resultPrompts}
                            onClose={() => setIsPreviewOpen(false)}
                        />
                    )}
                    </>
                );
            default: // form
                return (
                    <>
                        <div className="w-full lg:w-1/2 flex-shrink-0 bg-brand-bg-light p-6 rounded-2xl border border-brand-border shadow-2xl flex flex-col gap-5 animate-fade-in">
                            <div>
                                <label className="block text-xl font-semibold mb-2 text-center">1. Apa Ide atau Tema Lagu Anda?</label>
                                <textarea
                                    value={songIdea}
                                    onChange={(e) => setSongIdea(e.target.value)}
                                    placeholder="contoh: Lagu tentang persahabatan yang tak lekang oleh waktu, melewati suka dan duka bersama."
                                    className="w-full h-28 bg-brand-bg-dark border border-brand-border rounded-lg p-3 text-brand-text-primary focus:ring-2 focus:ring-brand-blue outline-none transition"
                                />
                            </div>
                            <div>
                                <label className="block text-xl font-semibold mb-2 text-center">2. Siapa Nama Artisnya?</label>
                                <input
                                    type="text"
                                    value={artistName}
                                    onChange={(e) => setArtistName(e.target.value)}
                                    placeholder="contoh: Senja & Hujan"
                                    className="w-full bg-brand-bg-dark border border-brand-border rounded-lg p-3 text-brand-text-primary focus:ring-2 focus:ring-brand-blue outline-none transition"
                                />
                            </div>
                             <div>
                                <label className="block text-xl font-semibold mb-2 text-center">3. Atur Detail Lagu</label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                     <div>
                                        <label htmlFor="genre" className="block text-sm font-medium text-brand-text-secondary mb-1">Genre</label>
                                        <select
                                            id="genre"
                                            value={genre}
                                            onChange={(e) => setGenre(e.target.value)}
                                            className="w-full bg-brand-bg-dark border border-brand-border rounded-lg p-3 text-brand-text-primary focus:ring-2 focus:ring-brand-blue outline-none transition"
                                        >
                                            {genreOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label htmlFor="mood" className="block text-sm font-medium text-brand-text-secondary mb-1">Mood</label>
                                        <select
                                            id="mood"
                                            value={mood}
                                            onChange={(e) => setMood(e.target.value)}
                                            className="w-full bg-brand-bg-dark border border-brand-border rounded-lg p-3 text-brand-text-primary focus:ring-2 focus:ring-brand-blue outline-none transition"
                                        >
                                            {moodOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                        </select>
                                    </div>
                                    <div className="md:col-span-2">
                                        <label htmlFor="language" className="block text-sm font-medium text-brand-text-secondary mb-1">Bahasa</label>
                                        <select
                                            id="language"
                                            value={language}
                                            onChange={(e) => setLanguage(e.target.value)}
                                            className="w-full bg-brand-bg-dark border border-brand-border rounded-lg p-3 text-brand-text-primary focus:ring-2 focus:ring-brand-blue outline-none transition"
                                        >
                                            {languageOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                        </select>
                                    </div>
                                    <div className="md:col-span-2">
                                        <label htmlFor="structure" className="block text-sm font-medium text-brand-text-secondary mb-1">Struktur Lagu (Opsional)</label>
                                        <input
                                            type="text"
                                            id="structure"
                                            value={structure}
                                            onChange={(e) => setStructure(e.target.value)}
                                            placeholder="contoh: Verse, Chorus, Verse, Chorus, Bridge"
                                            className="w-full bg-brand-bg-dark border border-brand-border rounded-lg p-3 text-brand-text-primary focus:ring-2 focus:ring-brand-blue outline-none transition"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="mt-auto">
                                <button
                                    onClick={handleGenerateClick}
                                    disabled={isLoading || !songIdea.trim() || !artistName.trim()}
                                    className="w-full mt-auto flex items-center justify-center gap-2 bg-brand-blue hover:bg-brand-blue-dark disabled:bg-gray-500 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 disabled:scale-100"
                                >
                                    <SparklesIcon className="w-5 h-5" />
                                    {isLoading ? 'Menciptakan...' : '4. Buat Lagu Saya'}
                                </button>
                            </div>
                        </div>
                        <div className="w-full lg:w-1/2 flex items-center justify-center">
                             <div className="m-auto text-center text-brand-text-secondary">
                                <MusicIcon className="w-24 h-24 mb-4 opacity-30 mx-auto"/>
                                <h3 className="text-xl font-semibold text-brand-text-primary">Lagu Anda akan muncul di sini</h3>
                                <p className="mt-2 max-w-xs mx-auto">Isi formulir dan biarkan AI menulis mahakarya musik untuk Anda.</p>
                            </div>
                        </div>
                    </>
                );
        }
    };
    
    return (
        <div ref={pageTopRef} className="w-full h-full flex flex-col">
            <header className="w-full max-w-6xl text-center mb-8 mx-auto">
                <div className="flex items-center justify-center gap-3 mb-2">
                    <MusicIcon className="w-8 h-8 text-red-400" />
                    <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-pink-500">
                        Buat Lagu
                    </h1>
                </div>
                <p className="text-md sm:text-lg text-brand-text-secondary max-w-3xl mx-auto">
                    Ubah ide sederhana menjadi lirik lagu orisinal, lengkap dengan judul, artis, dan sampul yang memukau.
                </p>
            </header>
            <main className="w-full max-w-7xl mx-auto flex flex-col xl:flex-row gap-8 flex-grow">
                {renderContent()}
            </main>
        </div>
    );
};

export default SongCreatorPage;