import React, { useState, useRef, useEffect } from 'react';
import { generateEbookOutline, generateEbookChapterContent, generateEbookCoverPrompt, generateImageFromPrompt } from '../services/ebookService';
import { SparklesIcon, AlertTriangleIcon, BookOpenIcon, PencilIcon, ChevronDownIcon, ChevronLeftIcon, DownloadIcon, ClipboardIcon } from '../components/IconComponents';
import { ResultPreviewModal, HistoryPrompt } from '../components/ResultPreviewModal';
import jsPDF from 'jspdf';


interface EbookCreatorPageProps {
  onNavigate: (page: string) => void;
}

type View = 'form' | 'loading' | 'result' | 'error';

const EBOOK_LAST_GENERATED_KEY = 'ebookLastGeneratedTimestamp';

const writingStyleOptions = {
    'Fiksi Kreatif': [
        'Novel',
        'Cerpen (Cerita Pendek)',
        'Puisi',
        'Naskah Drama / Skenario',
    ],
    'Non-Fiksi & Profesional': [
        'Karya Ilmiah / Akademis (dengan referensi web)',
        'Buku Marketing & Bisnis',
        'Buku Pelatihan / Tutorial',
        'Biografi / Memoar',
        'Jurnalisme Investigasi',
    ],
    'Lainnya': [
        'Buku Anak-Anak',
        'Kasual & Ramah (Gaya Blog)',
        'Formal & Profesional',
    ]
};

interface Chapter {
    title: string;
    content: string;
}

interface Outline {
    title: string;
    subtitle: string;
    chapters: string[];
}

const LoadingSpinner: React.FC = () => (
    <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-brand-blue"></div>
);

const ChapterEditorAccordion: React.FC<{
    chapter: Chapter;
    index: number;
    isOpen: boolean;
    onToggle: () => void;
    onContentChange: (newContent: string) => void;
}> = ({ chapter, index, isOpen, onToggle, onContentChange }) => {
    return (
        <div className="bg-brand-bg-dark rounded-lg border border-brand-border overflow-hidden">
            <button
                onClick={onToggle}
                className="w-full flex justify-between items-center p-4 text-left"
            >
                <h4 className="font-semibold text-brand-text-primary">{chapter.title}</h4>
                <ChevronDownIcon className={`w-6 h-6 text-brand-text-secondary transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            <div className={`transition-all duration-500 ease-in-out ${isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="p-4 pt-0">
                    <textarea
                        value={chapter.content}
                        onChange={(e) => onContentChange(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full h-96 bg-black/40 border border-brand-blue/50 rounded-md p-3 text-sm text-brand-text-secondary focus:ring-2 focus:ring-brand-blue outline-none transition resize-y"
                    />
                </div>
            </div>
        </div>
    );
};

const EbookCreatorPage: React.FC<EbookCreatorPageProps> = ({ onNavigate }) => {
    const pageTopRef = useRef<HTMLDivElement>(null);

    // Form State
    const [ebookIdea, setEbookIdea] = useState('');
    const [targetAudience, setTargetAudience] = useState('');
    const [authorName, setAuthorName] = useState('');
    const [writingStyle, setWritingStyle] = useState<string>('Kasual & Ramah (Gaya Blog)');
    const [numChapters, setNumChapters] = useState<number>(5);

    // View & Loading State
    const [view, setView] = useState<View>('form');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [loadingStep, setLoadingStep] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isGenerationLimited, setIsGenerationLimited] = useState(false);
    const [timeUntilNext, setTimeUntilNext] = useState('');

    // Result State
    const [generatedOutline, setGeneratedOutline] = useState<Outline | null>(null);
    const [generatedChapters, setGeneratedChapters] = useState<Chapter[]>([]);
    const [generatedCoverUrl, setGeneratedCoverUrl] = useState<string | null>(null);
    const [resultPrompts, setResultPrompts] = useState<HistoryPrompt[]>([]);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [openChapterIndex, setOpenChapterIndex] = useState<number | null>(0);
    
    // PDF Download state
    const [isDownloading, setIsDownloading] = useState<boolean>(false);
    const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
    const [downloadError, setDownloadError] = useState<string | null>(null);
    const [copiedDownloadLink, setCopiedDownloadLink] = useState<boolean>(false);
    
    // Cover Image Download State
    const [isDownloadingCover, setIsDownloadingCover] = useState<boolean>(false);
    const [coverDownloadUrl, setCoverDownloadUrl] = useState<string | null>(null);
    const [coverDownloadError, setCoverDownloadError] = useState<string | null>(null);
    const [copiedCoverLink, setCopiedCoverLink] = useState<boolean>(false);


    useEffect(() => {
        const checkLimit = () => {
            const lastGeneratedString = localStorage.getItem(EBOOK_LAST_GENERATED_KEY);
            if (lastGeneratedString) {
                const lastGeneratedTime = new Date(lastGeneratedString).getTime();
                const now = new Date().getTime();
                const twentyFourHours = 24 * 60 * 60 * 1000;
                const timeSince = now - lastGeneratedTime;

                if (timeSince < twentyFourHours) {
                    setIsGenerationLimited(true);
                    const timeLeft = twentyFourHours - timeSince;
                    const hours = Math.floor(timeLeft / (1000 * 60 * 60));
                    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
                    setTimeUntilNext(`${hours} jam ${minutes} menit lagi`);
                } else {
                    setIsGenerationLimited(false);
                    setTimeUntilNext('');
                    localStorage.removeItem(EBOOK_LAST_GENERATED_KEY);
                }
            } else {
                 setIsGenerationLimited(false);
            }
        };

        checkLimit();
        const interval = setInterval(checkLimit, 60000); // Check every minute
        return () => clearInterval(interval);
    }, []);

    const scrollToTop = () => {
        pageTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const handleCreateNew = () => {
        setEbookIdea('');
        setTargetAudience('');
        setAuthorName('');
        setWritingStyle('Kasual & Ramah (Gaya Blog)');
        setNumChapters(5);
        setGeneratedOutline(null);
        setGeneratedChapters([]);
        setGeneratedCoverUrl(null);
        setError(null);
        setView('form');
        setIsPreviewOpen(false);
        setResultPrompts([]);
        setOpenChapterIndex(0);
        
        setIsDownloading(false);
        setDownloadUrl(null);
        setDownloadError(null);
        setCopiedDownloadLink(false);

        setIsDownloadingCover(false);
        setCoverDownloadUrl(null);
        setCoverDownloadError(null);
        setCopiedCoverLink(false);

        scrollToTop();
    };

    const handleGenerateClick = async () => {
        if (isGenerationLimited) {
            setError(`Anda telah mencapai batas pembuatan Ebook (1 kali per hari). Coba lagi dalam ${timeUntilNext}.`);
            setView('error');
            scrollToTop();
            return;
        }

        if (!ebookIdea.trim() || !targetAudience.trim() || !authorName.trim()) {
            setError("Silakan isi ide Ebook, target pembaca, dan nama pengarang.");
            setView('error');
            scrollToTop();
            return;
        }

        setIsLoading(true);
        setView('loading');
        setError(null);
        scrollToTop();

        try {
            setLoadingStep('Langkah 1: Membuat judul dan kerangka bab...');
            const outlineJson = await generateEbookOutline(ebookIdea, targetAudience, writingStyle, numChapters);
            const parsedOutline = JSON.parse(outlineJson).ebook_outline as Outline;
            setGeneratedOutline(parsedOutline);

            let allChapters: Chapter[] = [];
            let allReferences: string[] = [];
            let chapterContext = "Ini adalah bab pertama.";
            for (let i = 0; i < parsedOutline.chapters.length; i++) {
                const chapterTitle = parsedOutline.chapters[i];
                setLoadingStep(`Langkah 2: Menulis konten untuk "${chapterTitle}"...`);
                let chapterContent = await generateEbookChapterContent(
                    ebookIdea, targetAudience, writingStyle, parsedOutline.title, chapterTitle, chapterContext
                );

                chapterContent = chapterContent.replace(/\*/g, '');

                if (writingStyle.includes('Karya Ilmiah')) {
                    const referenceHeader = "Daftar Pustaka";
                    const regex = new RegExp(`(\\n|\\A)${referenceHeader}:?([\\s\\S]*)`, 'i');
                    const match = chapterContent.match(regex);

                    if (match && match[2]) {
                        const referencesText = match[2].trim();
                        if (referencesText) {
                            const chapterRefs = referencesText.split('\n').filter(ref => ref.trim());
                            allReferences.push(...chapterRefs);
                        }
                        chapterContent = chapterContent.substring(0, match.index).trim();
                    }
                }

                const newChapter = { title: chapterTitle, content: chapterContent };
                allChapters.push(newChapter);
                setGeneratedChapters([...allChapters]);

                chapterContext = `Konten dari bab sebelumnya ("${chapterTitle}") adalah: ${chapterContent.substring(0, 300)}...`;
            }
            
            if (allReferences.length > 0) {
                const uniqueReferences = [...new Set(allReferences.map(ref => ref.trim()))];
                const bibliographyContent = uniqueReferences.join('\n');
                allChapters.push({ title: "Daftar Pustaka", content: bibliographyContent });
            }
            setGeneratedChapters(allChapters);

            setLoadingStep('Langkah 3: Mendesain sampul Ebook...');
            const summaryForCover = `Ide: ${ebookIdea}. Pembaca: ${targetAudience}. Judul: ${parsedOutline.title}. Kerangka: ${parsedOutline.chapters.join(', ')}`;
            const coverPrompt = await generateEbookCoverPrompt(parsedOutline.title, summaryForCover, authorName);
            const coverImageBase64 = await generateImageFromPrompt(coverPrompt);
            const coverImageUrl = `data:image/jpeg;base64,${coverImageBase64}`;
            setGeneratedCoverUrl(coverImageUrl);
            
            const promptsForHistory: HistoryPrompt[] = [
                { title: 'Ide Ebook', prompt: ebookIdea },
                { title: 'Target Pembaca', prompt: targetAudience },
                { title: 'Nama Pengarang', prompt: authorName },
                { title: 'Gaya Penulisan', prompt: writingStyle },
                { title: 'Prompt Sampul Ebook', prompt: coverPrompt },
            ];
            setResultPrompts(promptsForHistory);

            localStorage.setItem(EBOOK_LAST_GENERATED_KEY, new Date().toISOString());
            setIsGenerationLimited(true);

            setView('result');

        } catch (e) {
            console.error(e);
            const errorMessage = e instanceof Error ? e.message : 'Terjadi kesalahan yang tidak diketahui.';
            setError(`Gagal membuat Ebook. Detail: ${errorMessage}`);
            setView('error');
        } finally {
            setIsLoading(false);
            setLoadingStep('');
        }
    };
    
    const handleDownloadPdf = async () => {
        if (!generatedOutline || !generatedChapters.length) return;

        setIsDownloading(true);
        setDownloadUrl(null);
        setDownloadError(null);
        setCopiedDownloadLink(false);

        try {
            const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            const margin = 20;
            const textWidth = pageWidth - margin * 2;

            if (generatedCoverUrl) {
                doc.addImage(generatedCoverUrl, 'JPEG', 0, 0, pageWidth, pageHeight);
            }

            doc.addPage();
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(28);
            doc.text(generatedOutline.title, pageWidth / 2, 80, { align: 'center', maxWidth: textWidth });
            
            doc.setFont('helvetica', 'italic');
            doc.setFontSize(18);
            doc.text(generatedOutline.subtitle, pageWidth / 2, 100, { align: 'center', maxWidth: textWidth });
            
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(14);
            doc.text(`oleh ${authorName}`, pageWidth / 2, 120, { align: 'center', maxWidth: textWidth });
            
            for(const chapter of generatedChapters){
                doc.addPage();
                let yPos = margin;

                doc.setFont('helvetica', 'bold');
                doc.setFontSize(20);
                doc.text(chapter.title, pageWidth / 2, yPos, { align: 'center' });
                yPos += 20;
                
                doc.setFont('times', 'normal');
                doc.setFontSize(12);
                doc.setTextColor(40, 40, 40);
                
                const cleanedContent = chapter.content.replace(/\*/g, '');
                const lines = doc.splitTextToSize(cleanedContent, textWidth);
                
                for (const line of lines) {
                    if (yPos + 7 > pageHeight - margin) {
                        doc.addPage();
                        yPos = margin;
                    }
                    doc.text(line, margin, yPos);
                    yPos += 7;
                }
            }

            const pageCount = doc.internal.pages.length;
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10);
            doc.setTextColor(150, 150, 150);
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                if (i > 1) {
                    const pageNumText = `${i - 1}`;
                    doc.text(pageNumText, pageWidth / 2, pageHeight - 10, { align: 'center' });
                }
            }

            const pdfBlob = doc.output('blob');
            const pdfFile = new File([pdfBlob], `${generatedOutline.title.replace(/[^\w\s]/gi, '').replace(/ /g, '_')}.pdf`, { type: 'application/pdf' });
            
            const formData = new FormData();
            formData.append('file', pdfFile);

            const response = await fetch('https://tmpfiles.org/api/v1/upload', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Gagal mengunggah file: ${response.status} ${errorText}`);
            }

            const result = await response.json();
            if (result.status === 'success' && result.data.url) {
                const finalUrl = result.data.url.replace('/file/', '/dl/');
                setDownloadUrl(finalUrl);
            } else {
                throw new Error('Gagal mendapatkan URL unduhan dari server. ' + (result.data?.error || ''));
            }

        } catch (e) {
            console.error(e);
            const errorMessage = e instanceof Error ? e.message : 'Terjadi kesalahan saat membuat atau mengunggah PDF.';
            setDownloadError(errorMessage);
        } finally {
            setIsDownloading(false);
        }
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
          const fileName = `duniakreator_ebook_cover_${Date.now()}.jpg`;
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
    
    const handleCopyDownloadLink = () => {
        if (!downloadUrl) return;
        navigator.clipboard.writeText(downloadUrl);
        setCopiedDownloadLink(true);
        setTimeout(() => setCopiedDownloadLink(false), 2000);
    };

    const handleCopyCoverLink = () => {
        if (!coverDownloadUrl) return;
        navigator.clipboard.writeText(coverDownloadUrl);
        setCopiedCoverLink(true);
        setTimeout(() => setCopiedCoverLink(false), 2000);
    };

    const handleChapterContentChange = (newContent: string, index: number) => {
        const updatedChapters = [...generatedChapters];
        updatedChapters[index].content = newContent;
        setGeneratedChapters(updatedChapters);
    };

    const renderContent = () => {
        switch (view) {
            case 'loading':
                return (
                    <div className="flex-grow flex flex-col items-center justify-center text-center gap-4 text-brand-text-secondary m-auto">
                        <LoadingSpinner />
                        <p className="font-semibold text-lg text-brand-text-primary">Membuat Ebook Anda...</p>
                        <p className="text-sm max-w-md">{loadingStep}</p>
                    </div>
                );
            case 'error':
                const isApiKeyError = error?.includes("Kunci API");
                return (
                    <div className="w-full flex flex-col items-center justify-center text-center text-red-400 m-auto bg-brand-bg-light p-6 rounded-2xl border border-brand-border shadow-2xl">
                        <AlertTriangleIcon className="w-12 h-12" />
                        <p className="font-semibold mt-4">Gagal Membuat Ebook</p>
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
                    <div className="w-full h-full flex flex-col gap-6 bg-brand-bg-light p-6 rounded-2xl border border-brand-border shadow-2xl animate-fade-in">
                        <div className="flex flex-col md:flex-row gap-6">
                             {generatedCoverUrl && (
                                 <div className="flex-shrink-0 md:w-1/3 flex flex-col items-center">
                                    <button onClick={() => setIsPreviewOpen(true)} className="w-full max-w-xs aspect-[9/16] relative group">
                                        <img src={generatedCoverUrl} alt="Ebook Cover" className="w-full h-full object-cover rounded-lg shadow-2xl"/>
                                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                                            <p className="text-white font-bold">Lihat Detail</p>
                                        </div>
                                    </button>
                                     <div className="w-full max-w-xs mt-3 space-y-2">
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
                                 </div>
                             )}
                            <div className="flex-grow flex flex-col">
                                <h2 className="text-3xl font-bold text-brand-text-primary">{generatedOutline?.title}</h2>
                                <h3 className="text-lg text-brand-text-secondary mb-4">{generatedOutline?.subtitle}</h3>
                                  <div className="w-full bg-brand-bg-dark border border-brand-border rounded-lg p-4 mt-4">
                                      <h3 className="text-md font-semibold text-brand-text-primary mb-3">Unduh & Bagikan Ebook (PDF)</h3>
                                      <button
                                          onClick={handleDownloadPdf}
                                          disabled={isDownloading}
                                          className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-500 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-colors"
                                      >
                                          <DownloadIcon className="w-5 h-5"/>
                                          {isDownloading ? 'Membuat & Mengunggah PDF...' : 'Unduh sebagai PDF'}
                                      </button>
                                      {isDownloading && (
                                          <div className="w-full bg-gray-700/50 rounded-full h-2.5 mt-2">
                                              <div className="bg-brand-blue h-2.5 rounded-full animate-pulse"></div>
                                          </div>
                                      )}
                                      {downloadUrl && (
                                          <div className="mt-4 p-3 bg-black/30 rounded-lg animate-fade-in">
                                              <p className="text-sm text-green-400 font-semibold mb-2">✔️ PDF berhasil diunggah! Salin dan bagikan link di bawah ini.</p>
                                              <div className="flex items-center gap-2">
                                                  <input type="text" readOnly value={downloadUrl} className="w-full bg-brand-bg-light border border-brand-border rounded-lg p-2 text-brand-text-secondary text-sm" />
                                                  <button onClick={handleCopyDownloadLink} className="flex-shrink-0 bg-brand-blue hover:bg-brand-blue-dark text-white font-bold py-2 px-3 rounded-lg text-sm">
                                                    
                                                    {copiedDownloadLink ? 'Tersalin!' : <ClipboardIcon className="w-4 h-4"/>}
                                                  </button>
                                              </div>
                                          </div>
                                      )}
                                      {downloadError && (
                                          <div className="mt-3 text-sm text-red-400 flex items-center gap-2">
                                              <AlertTriangleIcon className="w-4 h-4" />
                                              <span>{downloadError}</span>
                                          </div>
                                      )}
                                  </div>

                                 <div className="flex flex-col sm:flex-row gap-3 mt-auto pt-4">
                                       <button
                                          onClick={handleCreateNew}
                                          className="w-full flex items-center justify-center gap-2 border-2 border-gray-600 text-gray-300 font-bold py-3 px-4 rounded-lg transition-all duration-300 hover:bg-gray-600 hover:text-white"
                                      >
                                          <PencilIcon className="w-5 h-5" />
                                          Buat Ebook Baru
                                      </button>
                                  </div>
                            </div>
                        </div>

                        <div className="mt-4 space-y-3">
                            <h3 className="text-xl font-bold text-brand-text-primary">Editor Bab</h3>
                            {generatedChapters.map((chapter, index) => (
                                <ChapterEditorAccordion 
                                    key={index}
                                    index={index}
                                    chapter={chapter}
                                    isOpen={openChapterIndex === index}
                                    onToggle={() => setOpenChapterIndex(openChapterIndex === index ? null : index)}
                                    onContentChange={(newContent) => handleChapterContentChange(newContent, index)}
                                />
                            ))}
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
                                <label className="block text-xl font-semibold mb-2 text-center">1. Apa Ide Ebook Anda?</label>
                                <textarea
                                    value={ebookIdea}
                                    onChange={(e) => setEbookIdea(e.target.value)}
                                    placeholder="contoh: Sebuah buku panduan tentang cara menanam sayuran organik di halaman belakang rumah."
                                    className="w-full h-28 bg-brand-bg-dark border border-brand-border rounded-lg p-3 text-brand-text-primary focus:ring-2 focus:ring-brand-blue outline-none transition"
                                />
                            </div>
                            <div>
                                <label className="block text-xl font-semibold mb-2 text-center">2. Siapa Target Pembaca Anda?</label>
                                <input
                                    type="text"
                                    value={targetAudience}
                                    onChange={(e) => setTargetAudience(e.target.value)}
                                    placeholder="contoh: Pemula yang belum pernah berkebun."
                                    className="w-full bg-brand-bg-dark border border-brand-border rounded-lg p-3 text-brand-text-primary focus:ring-2 focus:ring-brand-blue outline-none transition"
                                />
                            </div>
                            <div>
                                <label className="block text-xl font-semibold mb-2 text-center">3. Siapa Nama Pengarangnya?</label>
                                <input
                                    type="text"
                                    value={authorName}
                                    onChange={(e) => setAuthorName(e.target.value)}
                                    placeholder="contoh: Andrea Hirata"
                                    className="w-full bg-brand-bg-dark border border-brand-border rounded-lg p-3 text-brand-text-primary focus:ring-2 focus:ring-brand-blue outline-none transition"
                                />
                            </div>
                             <div>
                                <label className="block text-xl font-semibold mb-2 text-center">4. Atur Detail Buku</label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                     <div>
                                        <label htmlFor="writingStyle" className="block text-sm font-medium text-brand-text-secondary mb-1">Gaya Penulisan</label>
                                        <select
                                            id="writingStyle"
                                            value={writingStyle}
                                            onChange={(e) => setWritingStyle(e.target.value)}
                                            className="w-full bg-brand-bg-dark border border-brand-border rounded-lg p-3 text-brand-text-primary focus:ring-2 focus:ring-brand-blue outline-none transition"
                                        >
                                            {Object.entries(writingStyleOptions).map(([groupLabel, options]) => (
                                                <optgroup label={groupLabel} key={groupLabel}>
                                                    {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                                </optgroup>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label htmlFor="numChapters" className="block text-sm font-medium text-brand-text-secondary mb-1">Jumlah Bab</label>
                                        <select
                                            id="numChapters"
                                            value={numChapters}
                                            onChange={(e) => setNumChapters(Number(e.target.value))}
                                            className="w-full bg-brand-bg-dark border border-brand-border rounded-lg p-3 text-brand-text-primary focus:ring-2 focus:ring-brand-blue outline-none transition"
                                        >
                                            {[3, 4, 5, 6, 7, 8, 9, 10].map(n => <option key={n} value={n}>{n} Bab</option>)}
                                        </select>
                                    </div>
                                </div>
                            </div>
                             <div className="mt-auto">
                                <button
                                    onClick={handleGenerateClick}
                                    disabled={isLoading || isGenerationLimited || !ebookIdea.trim() || !targetAudience.trim() || !authorName.trim()}
                                    className="w-full mt-auto flex items-center justify-center gap-2 bg-brand-blue hover:bg-brand-blue-dark disabled:bg-gray-500 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 disabled:scale-100"
                                >
                                    <SparklesIcon className="w-5 h-5" />
                                    {isGenerationLimited ? 'Batas Harian Tercapai' : '5. Buat Ebook Saya'}
                                </button>
                                {isGenerationLimited && (
                                    <p className="text-center text-yellow-400 text-sm mt-2">
                                        Anda dapat membuat Ebook lagi dalam {timeUntilNext}.
                                    </p>
                                )}
                            </div>
                        </div>
                        <div className="w-full lg:w-1/2 flex items-center justify-center">
                             <div className="m-auto text-center text-brand-text-secondary">
                                <BookOpenIcon className="w-24 h-24 mb-4 opacity-30 mx-auto"/>
                                <h3 className="text-xl font-semibold text-brand-text-primary">Ebook Anda akan muncul di sini</h3>
                                <p className="mt-2 max-w-xs mx-auto">Isi formulir dan biarkan AI menulis buku untuk Anda.</p>
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
                    <BookOpenIcon className="w-8 h-8 text-orange-400" />
                    <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500">
                        Buat Ebook
                    </h1>
                </div>
                <p className="text-md sm:text-lg text-brand-text-secondary max-w-3xl mx-auto">
                    Ubah ide sederhana menjadi naskah Ebook yang terstruktur, lengkap dengan sampul yang menarik.
                </p>
            </header>
            <main className="w-full max-w-7xl mx-auto flex flex-col lg:flex-row gap-8 flex-grow">
                {renderContent()}
            </main>
        </div>
    );
};

export default EbookCreatorPage;