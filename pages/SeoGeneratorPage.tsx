import React, { useState, useRef } from 'react';
import { generateSeoContent } from '../services/seoService';
import { SparklesIcon, AlertTriangleIcon, TagIcon, ClipboardIcon, ChevronLeftIcon, LinkIcon } from '../components/IconComponents';

interface SeoGeneratorPageProps {
  onNavigate: (page: string) => void;
}

interface SeoResult {
    description: string;
    hashtags: string[];
    sources: { web: { uri: string; title: string; } }[];
}

const LoadingSpinner: React.FC = () => (
    <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-brand-blue"></div>
);

const SeoGeneratorPage: React.FC<SeoGeneratorPageProps> = ({ onNavigate }) => {
    const pageTopRef = useRef<HTMLDivElement>(null);

    // Form State
    const [topic, setTopic] = useState('');

    // View & Loading State
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    // Result State
    const [result, setResult] = useState<SeoResult | null>(null);
    const [copiedDescription, setCopiedDescription] = useState(false);
    const [copiedHashtags, setCopiedHashtags] = useState(false);

    const scrollToTop = () => {
        pageTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
    
    const handleGenerateClick = async () => {
        if (!topic.trim()) {
            setError("Silakan masukkan topik atau kata kunci.");
            return;
        }

        setIsLoading(true);
        setError(null);
        setResult(null);
        scrollToTop();

        try {
            const seoData = await generateSeoContent(topic);
            setResult(seoData);
        } catch (e) {
            console.error(e);
            const errorMessage = e instanceof Error ? e.message : 'Terjadi kesalahan yang tidak diketahui.';
            setError(`Gagal membuat konten SEO. Detail: ${errorMessage}`);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleCopy = (text: string, type: 'description' | 'hashtags') => {
        navigator.clipboard.writeText(text);
        if (type === 'description') {
            setCopiedDescription(true);
            setTimeout(() => setCopiedDescription(false), 2000);
        } else {
            setCopiedHashtags(true);
            setTimeout(() => setCopiedHashtags(false), 2000);
        }
    };

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="flex-grow flex flex-col items-center justify-center text-center gap-4 text-brand-text-secondary m-auto">
                    <LoadingSpinner />
                    <p className="font-semibold text-lg text-brand-text-primary">Mencari ide terbaik untuk Anda...</p>
                    <p className="text-sm">AI sedang menganalisis tren menggunakan Google Search.</p>
                </div>
            );
        }

        if (error) {
            const isApiKeyError = error?.includes("Kunci API");
            return (
                <div className="w-full flex flex-col items-center justify-center text-center text-red-400 m-auto bg-brand-bg-light p-6 rounded-2xl border border-brand-border shadow-2xl">
                    <AlertTriangleIcon className="w-12 h-12" />
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
                            onClick={() => { setError(null); scrollToTop(); }}
                            className="mt-6 flex items-center justify-center gap-2 border-2 border-brand-blue text-brand-blue font-bold py-2 px-6 rounded-lg transition-all duration-300 hover:bg-brand-blue hover:text-white"
                        >
                            <ChevronLeftIcon className="w-5 h-5" />
                            Kembali & Coba Lagi
                        </button>
                   )}
                </div>
            );
        }

        if (result) {
            return (
                <div className="w-full flex flex-col gap-6 animate-fade-in">
                    <div className="bg-brand-bg-light p-6 rounded-2xl border border-brand-border shadow-2xl">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="text-xl font-bold text-brand-text-primary">Deskripsi SEO</h3>
                            <button onClick={() => handleCopy(result.description, 'description')} className="flex items-center gap-2 text-sm bg-brand-border hover:bg-gray-600 text-brand-text-secondary font-semibold py-1.5 px-3 rounded-md transition-colors">
                                <ClipboardIcon className="w-4 h-4" />
                                {copiedDescription ? 'Tersalin!' : 'Salin'}
                            </button>
                        </div>
                        <p className="text-brand-text-secondary">{result.description}</p>
                    </div>

                     <div className="bg-brand-bg-light p-6 rounded-2xl border border-brand-border shadow-2xl">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="text-xl font-bold text-brand-text-primary">Tagar (Hashtag) Relevan</h3>
                            <button onClick={() => handleCopy(result.hashtags.join(' '), 'hashtags')} className="flex items-center gap-2 text-sm bg-brand-border hover:bg-gray-600 text-brand-text-secondary font-semibold py-1.5 px-3 rounded-md transition-colors">
                                <ClipboardIcon className="w-4 h-4" />
                                {copiedHashtags ? 'Tersalin!' : 'Salin Semua'}
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {result.hashtags.map((tag, i) => (
                                <span key={i} className="bg-blue-500/20 text-blue-300 text-sm font-semibold px-3 py-1 rounded-full">{tag}</span>
                            ))}
                        </div>
                    </div>
                    
                    {result.sources.length > 0 && (
                        <div className="bg-brand-bg-light p-6 rounded-2xl border border-brand-border shadow-2xl">
                            <h3 className="text-xl font-bold text-brand-text-primary mb-3">Sumber Referensi Web</h3>
                            <ul className="space-y-2">
                                {result.sources.map((source, i) => (
                                    <li key={i} className="flex items-start gap-3">
                                        <LinkIcon className="w-4 h-4 text-brand-text-secondary mt-1 flex-shrink-0" />
                                        <a href={source.web.uri} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline text-sm break-all" title={source.web.title}>
                                            {source.web.title || source.web.uri}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            );
        }

        return (
            <div className="m-auto text-center text-brand-text-secondary">
                <TagIcon className="w-24 h-24 mb-4 opacity-30 mx-auto"/>
                <h3 className="text-xl font-semibold text-brand-text-primary">Hasil SEO Anda akan muncul di sini</h3>
                <p className="mt-2 max-w-xs mx-auto">Masukkan topik atau kata kunci, dan biarkan AI membuat konten yang dioptimalkan untuk Anda.</p>
            </div>
        );
    };

    return (
        <div ref={pageTopRef} className="w-full h-full flex flex-col">
            <header className="w-full max-w-6xl text-center mb-8 mx-auto">
                <div className="flex items-center justify-center gap-3 mb-2">
                    <TagIcon className="w-8 h-8 text-green-400" />
                    <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-teal-500">
                        Generator Deskripsi & Tagar SEO
                    </h1>
                </div>
                <p className="text-md sm:text-lg text-brand-text-secondary max-w-3xl mx-auto">
                    Buat deskripsi dan tagar yang dioptimalkan untuk postingan media sosial atau artikel blog Anda dalam hitungan detik.
                </p>
            </header>
            <main className="w-full max-w-4xl mx-auto flex flex-col gap-8 flex-grow">
                <div className="bg-brand-bg-light p-6 rounded-2xl border border-brand-border shadow-2xl flex flex-col gap-4">
                    <div>
                        <label htmlFor="topic" className="block text-xl font-semibold mb-2 text-center">Masukkan Topik atau Kata Kunci</label>
                        <textarea
                            id="topic"
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            placeholder="contoh: tips fotografi malam hari dengan smartphone"
                            className="w-full h-24 bg-brand-bg-dark border border-brand-border rounded-lg p-3 text-brand-text-primary focus:ring-2 focus:ring-brand-blue outline-none transition"
                        />
                    </div>
                    <button
                        onClick={handleGenerateClick}
                        disabled={isLoading || !topic.trim()}
                        className="w-full flex items-center justify-center gap-2 bg-brand-blue hover:bg-brand-blue-dark disabled:bg-gray-500 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 disabled:scale-100"
                    >
                        <SparklesIcon className="w-5 h-5" />
                        {isLoading ? 'Menghasilkan...' : 'Buat Konten SEO'}
                    </button>
                </div>
                
                <div className="flex-grow flex">
                    {renderContent()}
                </div>
            </main>
        </div>
    );
};

export default SeoGeneratorPage;