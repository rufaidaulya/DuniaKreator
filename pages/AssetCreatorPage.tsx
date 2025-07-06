import React, { useState, useCallback, useRef, useEffect } from 'react';
import { 
    generateImageFromPrompt, 
    generatePromptFromReferenceImage, 
    optimizeUserPrompt, 
    generateReplicationPromptFromImage,
    analyzeProductImage,
    analyzeLocationImage,
    createProductOnlyScenePrompt
} from '../services/assetCreatorService';
import { fileToBase64, fileToDataUrl } from '../utils/fileUtils';
import { saveAvatar, getSavedAvatars, MAX_AVATARS, saveProduct, getSavedProducts, MAX_PRODUCTS, saveLocation, getSavedLocations, MAX_LOCATIONS } from '../utils/localStorage';
import { ImageUploader } from '../components/ImageUploader';
import { GeneratedImageViewer } from '../components/GeneratedImageViewer';
import { AvatarDetailsViewer } from '../components/AvatarDetailsViewer';
import { SparklesIcon, AlertTriangleIcon, FaceSmileIcon, BookmarkIcon, PencilIcon, RefreshCwIcon, ChevronLeftIcon, PackageIcon, MapPinIcon, DownloadIcon, ClipboardIcon } from '../components/IconComponents';
import { ResultPreviewModal, HistoryPrompt } from '../components/ResultPreviewModal';


export interface AssetCreatorPageProps {
  onNavigate: (page: string) => void;
}

type Mode = 'avatar' | 'product' | 'location';
type View = 'form' | 'loading' | 'result' | 'error';
type AvatarMode = 'text' | 'image';
type ImageAnalysisMode = 'replicate' | 'classic';

const avatarStyleOptions = [
    'Default (Photorealistic)', 'Cinematic Film', 'Anime / Manga', 'Disney / Pixar 3D', 'Video Game Character',
    'Vintage Portrait (Foto Jadul)', 'Watercolor Painting (Lukisan Cat Air)', 'Pencil Sketch (Sketsa Pensil)', 'Cyberpunk / Sci-Fi'
];

export const AssetCreatorPage: React.FC<AssetCreatorPageProps> = ({ onNavigate }) => {
    const pageTopRef = useRef<HTMLDivElement>(null);
    const [activeTab, setActiveTab] = useState<Mode>('avatar');
    const [view, setView] = useState<View>('form');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [loadingStep, setLoadingStep] = useState<string>('');
    const [error, setError] = useState<string | null>(null);

    // Common state for all asset types
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
    const [finalPrompt, setFinalPrompt] = useState<string | null>(null);
    const [assetName, setAssetName] = useState('');
    const [isSaved, setIsSaved] = useState<boolean>(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [resultPrompts, setResultPrompts] = useState<HistoryPrompt[]>([]);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    
    // Avatar-specific state
    const [avatarMode, setAvatarMode] = useState<AvatarMode>('text');
    const [userPrompt, setUserPrompt] = useState('');
    const [avatarStyle, setAvatarStyle] = useState<string>(avatarStyleOptions[0]);
    const [additionalInstructions, setAdditionalInstructions] = useState<string>('');
    const [imageAnalysisMode, setImageAnalysisMode] = useState<ImageAnalysisMode>('replicate');
    const [avatarCount, setAvatarCount] = useState(0);

    // Product & Location specific state
    const [productCount, setProductCount] = useState(0);
    const [locationCount, setLocationCount] = useState(0);

    // Download State
    const [isDownloading, setIsDownloading] = useState(false);
    const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
    const [downloadError, setDownloadError] = useState<string | null>(null);
    const [copiedLink, setCopiedLink] = useState(false);
    
    useEffect(() => {
        setAvatarCount(getSavedAvatars().length);
        setProductCount(getSavedProducts().length);
        setLocationCount(getSavedLocations().length);
    }, []);

    const scrollToTop = () => pageTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

    const resetFormState = useCallback(() => {
        setView('form');
        setIsLoading(false);
        setError(null);
        setSelectedFile(null);
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
            setPreviewUrl(null);
        }
        setGeneratedImageUrl(null);
        setFinalPrompt(null);
        setAssetName('');
        setIsSaved(false);
        setSaveError(null);
        setResultPrompts([]);
        setIsPreviewOpen(false);
        // Avatar specific reset
        setUserPrompt('');
        setAvatarStyle(avatarStyleOptions[0]);
        setAdditionalInstructions('');
        setImageAnalysisMode('replicate');
        // Download state reset
        setIsDownloading(false);
        setDownloadUrl(null);
        setDownloadError(null);
        setCopiedLink(false);
    }, [previewUrl]);

    const handleTabChange = (tab: Mode) => {
        setActiveTab(tab);
        resetFormState();
    };
    
    const handleFileSelect = useCallback((file: File | null) => {
        if (file) {
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    }, []);

    const handleGenerateClick = async () => {
        setView('loading');
        setError(null);
        scrollToTop();
        setIsLoading(true);

        // Reset download state before generation
        setIsDownloading(false);
        setDownloadUrl(null);
        setDownloadError(null);
        setCopiedLink(false);

        try {
            switch(activeTab) {
                case 'avatar': await generateAvatar(); break;
                case 'product': await generateProduct(); break;
                case 'location': await generateLocation(); break;
            }
        } catch (e) {
            console.error(e);
            const errorMessage = e instanceof Error ? e.message : 'Terjadi kesalahan yang tidak diketahui.';
            setError(`Gagal membuat aset. Detail: ${errorMessage}`);
            setView('error');
        } finally {
            setIsLoading(false);
            setLoadingStep('');
        }
    };

    const generateAvatar = async () => {
        let promptsForHistory: HistoryPrompt[] = [];
        let finalImageGenPrompt: string, newImageBase64: string, newImageUrl: string, consistencyPrompt: string;
        
        if (avatarMode === 'text') {
            if (!userPrompt.trim()) throw new Error("Silakan masukkan deskripsi untuk avatar Anda.");
            setLoadingStep('Langkah 1/3: Mengoptimalkan prompt...');
            finalImageGenPrompt = await optimizeUserPrompt(userPrompt, avatarStyle);
            promptsForHistory = [
                { title: 'Ide Awal', prompt: userPrompt },
                { title: 'Gaya', prompt: avatarStyle },
                { title: 'Prompt Generasi', prompt: finalImageGenPrompt },
            ];
        } else { // image mode
            if (!selectedFile) throw new Error("Silakan unggah gambar referensi.");
            const base64Image = await fileToBase64(selectedFile);
            setLoadingStep(imageAnalysisMode === 'replicate' ? 'Langkah 1/3: Menganalisis foto...' : 'Langkah 1/3: Menganalisis wajah...');
            finalImageGenPrompt = imageAnalysisMode === 'replicate'
                ? await generateReplicationPromptFromImage(base64Image, selectedFile.type)
                : await generatePromptFromReferenceImage(base64Image, selectedFile.type);

            if (additionalInstructions.trim()) finalImageGenPrompt += ` ${additionalInstructions.trim()}`;
            promptsForHistory = [
                { title: 'Mode Analisis', prompt: imageAnalysisMode },
                { title: 'Instruksi Tambahan', prompt: additionalInstructions },
                { title: 'Prompt Generasi Final', prompt: finalImageGenPrompt },
            ];
        }

        setLoadingStep('Langkah 2/3: Menghasilkan gambar...');
        newImageBase64 = await generateImageFromPrompt(finalImageGenPrompt);
        newImageUrl = `data:image/jpeg;base64,${newImageBase64}`;
        setGeneratedImageUrl(newImageUrl);

        setLoadingStep('Langkah 3/3: Menganalisis untuk konsistensi...');
        consistencyPrompt = await generatePromptFromReferenceImage(newImageBase64, 'image/jpeg');
        setFinalPrompt(consistencyPrompt);
        promptsForHistory.push({ title: 'Prompt Konsistensi Final', prompt: consistencyPrompt });
        
        setResultPrompts(promptsForHistory);
        setView('result');
    };
    
    const generateProduct = async () => {
        if (!selectedFile) throw new Error("Silakan unggah gambar produk.");
        const base64Image = await fileToBase64(selectedFile);
        
        setLoadingStep('Langkah 1/2: Menganalisis DNA produk...');
        const productDna = await analyzeProductImage(base64Image, selectedFile.type);
        setFinalPrompt(productDna);

        setLoadingStep('Langkah 2/2: Menghasilkan gambar produk...');
        const scenePrompt = await createProductOnlyScenePrompt(productDna, "product photo");
        const newImageBase64 = await generateImageFromPrompt(scenePrompt);
        setGeneratedImageUrl(`data:image/jpeg;base64,${newImageBase64}`);

        setResultPrompts([
            { title: 'DNA Produk (Hasil Analisis)', prompt: productDna },
            { title: 'Prompt Generasi Gambar', prompt: scenePrompt }
        ]);
        setView('result');
    };

    const generateLocation = async () => {
        if (!selectedFile) throw new Error("Silakan unggah gambar lokasi.");
        const base64Image = await fileToBase64(selectedFile);

        setLoadingStep('Langkah 1/1: Menganalisis detail lokasi...');
        const locationPrompt = await analyzeLocationImage(base64Image, selectedFile.type);
        setFinalPrompt(locationPrompt);

        // For location, the "generated" image is just the uploaded one.
        setGeneratedImageUrl(previewUrl);
        
        setResultPrompts([{ title: 'Deskripsi Lokasi (Hasil Analisis)', prompt: locationPrompt }]);
        setView('result');
    };


    const handleSave = async () => {
        if (!finalPrompt || !assetName.trim()) return;
        if (activeTab !== 'location' && !generatedImageUrl) return;

        setSaveError(null);
        try {
            switch(activeTab) {
                case 'avatar':
                    if (!generatedImageUrl) throw new Error("Image URL is missing for avatar.");
                    saveAvatar({ id: Date.now().toString(), name: assetName.trim(), imageUrl: generatedImageUrl, prompt: finalPrompt });
                    setAvatarCount(getSavedAvatars().length);
                    break;
                case 'product':
                    if (!generatedImageUrl) throw new Error("Image URL is missing for product.");
                    saveProduct({ id: Date.now().toString(), name: assetName.trim(), imageUrl: generatedImageUrl, dna: finalPrompt });
                    setProductCount(getSavedProducts().length);
                    break;
                case 'location':
                    if (!selectedFile) throw new Error("File for location is not available for saving.");
                    const imageUrl = await fileToDataUrl(selectedFile);
                    saveLocation({ id: Date.now().toString(), name: assetName.trim(), prompt: finalPrompt, imageUrl: imageUrl });
                    setLocationCount(getSavedLocations().length);
                    break;
            }
            setIsSaved(true);
        } catch(e) {
            const errorMessage = e instanceof Error ? e.message : 'Terjadi kesalahan tidak diketahui.';
            setSaveError(errorMessage);
        }
    };

    const handleDownload = async () => {
        let imageUrlToDownload = generatedImageUrl;
        let assetType = activeTab;

        if (activeTab === 'location' && previewUrl) {
            imageUrlToDownload = previewUrl;
        }

        if (!imageUrlToDownload) return;

        setIsDownloading(true);
        setDownloadUrl(null);
        setDownloadError(null);
        setCopiedLink(false);

        try {
            const res = await fetch(imageUrlToDownload);
            const blob = await res.blob();
            const fileName = `duniakreator_${assetType}_${Date.now()}.jpg`;
            const file = new File([blob], fileName, { type: 'image/jpeg' });
            
            const formData = new FormData();
            formData.append('file', file);

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
                throw new Error('Gagal mendapatkan URL unduhan. ' + (result.data?.error || ''));
            }
        } catch (e) {
            console.error(e);
            const errorMessage = e instanceof Error ? e.message : 'Terjadi kesalahan saat mengunggah gambar.';
            setDownloadError(errorMessage);
        } finally {
            setIsDownloading(false);
        }
    };
    
    const handleCopyLink = () => {
        if (!downloadUrl) return;
        navigator.clipboard.writeText(downloadUrl);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
    };
    
    // UI Components
    const TabButton: React.FC<{ targetTab: Mode, icon: React.ElementType, children: React.ReactNode }> = ({ targetTab, icon: Icon, children }) => (
        <button
          onClick={() => handleTabChange(targetTab)}
          className={`flex-1 flex justify-center items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-md transition-colors ${activeTab === targetTab ? 'bg-brand-blue text-white' : 'bg-brand-bg-dark text-brand-text-secondary hover:bg-brand-bg-light'}`}
        >
          <Icon className="w-5 h-5" /> {children}
        </button>
    );

    const AnalysisModeOption: React.FC<{ mode: ImageAnalysisMode, title: string, description: string }> = ({ mode, title, description }) => (
        <button
            onClick={() => setImageAnalysisMode(mode)}
            className={`w-full text-left p-3 border-2 rounded-lg transition-all ${imageAnalysisMode === mode ? 'border-brand-blue bg-blue-900/30' : 'border-brand-border bg-brand-bg-dark hover:border-gray-600'}`}
        >
            <p className={`font-semibold ${imageAnalysisMode === mode ? 'text-brand-blue' : 'text-brand-text-primary'}`}>{title}</p>
            <p className="text-xs text-brand-text-secondary">{description}</p>
        </button>
    );

    const renderFormContent = () => {
        const isGenerateDisabled = isLoading ||
            (activeTab === 'avatar' && avatarMode === 'text' && !userPrompt.trim()) ||
            (activeTab === 'avatar' && avatarMode === 'image' && !selectedFile) ||
            (activeTab === 'product' && !selectedFile) ||
            (activeTab === 'location' && !selectedFile);

        let formTitle = '';
        let formContent;

        switch(activeTab) {
            case 'avatar':
                formTitle = 'Buat Avatar Baru';
                formContent = (
                    <>
                        <div className="flex items-center justify-center gap-2 p-1 bg-black/20 rounded-lg">
                            <button onClick={() => setAvatarMode('text')} className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors w-1/2 ${avatarMode === 'text' ? 'bg-brand-blue text-white' : 'text-brand-text-secondary'}`}>Dari Teks</button>
                            <button onClick={() => setAvatarMode('image')} className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors w-1/2 ${avatarMode === 'image' ? 'bg-brand-blue text-white' : 'text-brand-text-secondary'}`}>Dari Foto</button>
                        </div>
                        {avatarMode === 'text' ? (
                            <div className="animate-fade-in space-y-4">
                                <div><label className="block font-semibold mb-2">1. Deskripsi Avatar</label><textarea value={userPrompt} onChange={e => setUserPrompt(e.target.value)} placeholder="Wanita tua ceria berkacamata..." className="w-full h-28 bg-brand-bg-dark border border-brand-border rounded-lg p-3"/></div>
                                <div><label className="block font-semibold mb-2">2. Gaya Avatar</label><select value={avatarStyle} onChange={e => setAvatarStyle(e.target.value)} className="w-full bg-brand-bg-dark border border-brand-border rounded-lg p-3">{avatarStyleOptions.map(o => <option key={o}>{o}</option>)}</select></div>
                            </div>
                        ) : (
                            <div className="animate-fade-in space-y-4">
                                <div><label className="block font-semibold mb-2">1. Unggah Foto Referensi</label><ImageUploader onFileSelect={handleFileSelect} previewUrl={previewUrl} /></div>
                                <div><label className="block font-semibold mb-2">2. Metode Analisis</label><div className="space-y-2"><AnalysisModeOption mode="replicate" title="Replikasi Foto Persis" description="Meniru semua aspek foto: orang, pakaian, gaya, dll."/><AnalysisModeOption mode="classic" title="Ekstrak Wajah (Klasik)" description="Fokus utama hanya pada fitur wajah dasar."/></div></div>
                                <div><label className="block font-semibold mb-2">3. Instruksi Tambahan (Opsional)</label><textarea value={additionalInstructions} onChange={e => setAdditionalInstructions(e.target.value)} placeholder="Ubah latar menjadi pantai..." className="w-full h-20 bg-brand-bg-dark border border-brand-border rounded-lg p-3"/></div>
                            </div>
                        )}
                    </>
                );
                break;
            case 'product':
                formTitle = 'Buat Produk Baru';
                formContent = <div><label className="block font-semibold mb-2">Unggah Foto Produk</label><p className="text-xs text-brand-text-secondary mb-2">Pastikan produk terlihat jelas dan dominan dalam gambar.</p><ImageUploader onFileSelect={handleFileSelect} previewUrl={previewUrl} /></div>;
                break;
            case 'location':
                formTitle = 'Buat Lokasi Baru';
                formContent = <div><label className="block font-semibold mb-2">Unggah Foto Lokasi/Adegan</label><p className="text-xs text-brand-text-secondary mb-2">Gambar pemandangan atau interior akan dianalisis.</p><ImageUploader onFileSelect={handleFileSelect} previewUrl={previewUrl} /></div>;
                break;
        }

        return (
            <div className="w-full lg:w-2/5 flex-shrink-0 bg-brand-bg-light p-6 rounded-2xl border border-brand-border shadow-2xl flex flex-col animate-fade-in">
                <h3 className="text-xl font-bold text-center mb-4">{formTitle}</h3>
                <div className="flex-grow flex flex-col gap-4 overflow-y-auto pr-2 -mr-4">{formContent}</div>
                <div className="mt-6 text-center">
                    <button onClick={handleGenerateClick} disabled={isGenerateDisabled} className="w-full flex items-center justify-center gap-2 bg-brand-blue hover:bg-brand-blue-dark disabled:bg-gray-500 text-white font-bold py-3 rounded-lg transition-transform transform hover:scale-105">
                        <SparklesIcon className="w-5 h-5"/> {isLoading ? 'Membuat...' : 'Buat Aset'}
                    </button>
                </div>
            </div>
        );
    };

    const renderResultContent = () => {
        let title, saveLabel, promptTitle, count, max_count, icon;
        switch(activeTab) {
            case 'avatar': 
                title = 'Avatar Dihasilkan'; 
                saveLabel = 'Simpan Avatar';
                promptTitle = 'Prompt Konsistensi';
                count = avatarCount; max_count = MAX_AVATARS; icon = <BookmarkIcon className="w-5 h-5"/>;
                break;
            case 'product': 
                title = 'Produk Dianalisis'; 
                saveLabel = 'Simpan Produk';
                promptTitle = 'DNA Produk';
                count = productCount; max_count = MAX_PRODUCTS; icon = <PackageIcon className="w-5 h-5"/>;
                break;
            case 'location': 
                title = 'Lokasi Dianalisis'; 
                saveLabel = 'Simpan Lokasi';
                promptTitle = 'Deskripsi Lokasi';
                count = locationCount; max_count = MAX_LOCATIONS; icon = <MapPinIcon className="w-5 h-5"/>;
                break;
        }
        
        return (
            <>
            <div className="w-full h-full flex flex-col xl:flex-row gap-6 bg-brand-bg-light p-6 rounded-2xl border border-brand-border shadow-2xl animate-fade-in">
                <div className='flex-shrink-0 xl:w-1/2 flex flex-col items-center justify-center bg-brand-bg-dark p-4 rounded-lg'>
                    <h3 className="text-lg font-semibold text-brand-text-secondary mb-4">{title}</h3>
                    {generatedImageUrl && (
                        <button onClick={() => setIsPreviewOpen(true)} className="w-full max-w-sm aspect-square relative group">
                            <img src={generatedImageUrl} alt="Generated AI asset" className="w-full h-full object-contain rounded-lg shadow-2xl"/>
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                                    <p className="text-white font-bold">Lihat Detail</p>
                                </div>
                        </button>
                    )}
                </div>
                <div className="flex-grow xl:w-1/2 flex flex-col gap-4">
                    <div className="flex-grow space-y-4">
                        <AvatarDetailsViewer title={promptTitle} prompt={finalPrompt} />

                        <div className="w-full bg-brand-bg-dark border border-brand-border rounded-lg p-4">
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="text-md font-semibold text-brand-text-primary">{saveLabel}</h3>
                                <p className="text-xs font-mono text-brand-text-secondary">{count}/{max_count}</p>
                            </div>
                            {isSaved ? (
                                <p className='text-green-400 font-semibold'>Aset berhasil disimpan!</p>
                            ) : (
                                <div className='animate-fade-in space-y-3'>
                                    <input type="text" value={assetName} onChange={(e) => setAssetName(e.target.value)} placeholder={`Beri nama ${activeTab} baru Anda...`} className="w-full bg-black/30 border border-brand-border rounded-lg p-2 text-brand-text-primary focus:ring-2 focus:ring-brand-blue outline-none transition" />
                                    <button onClick={handleSave} disabled={!assetName.trim() || isLoading} className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                                      {icon} {isLoading ? 'Menyimpan...' : saveLabel}
                                    </button>
                                </div>
                            )}
                            {saveError && <p className="text-xs text-red-400 mt-1">{saveError}</p>}
                        </div>

                         <div className="w-full bg-brand-bg-dark border border-brand-border rounded-lg p-4">
                            <h3 className="text-md font-semibold text-brand-text-primary mb-3">Unduh Gambar</h3>
                            <button onClick={handleDownload} disabled={isDownloading} className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                                <DownloadIcon className="w-5 h-5"/> {isDownloading ? 'Mengunggah...' : 'Dapatkan Link Unduhan'}
                            </button>
                            {isDownloading && (
                                <div className="w-full bg-gray-700/50 rounded-full h-1.5 mt-2.5"><div className="bg-brand-blue h-1.5 rounded-full animate-pulse"></div></div>
                            )}
                            {downloadUrl && (
                                <div className="mt-4 p-3 bg-black/30 rounded-lg animate-fade-in">
                                    <p className="text-sm text-green-400 font-semibold mb-2">✔️ Link unduhan berhasil dibuat!</p>
                                    <div className="flex items-center gap-2">
                                        <input type="text" readOnly value={downloadUrl} className="w-full bg-brand-bg-light border border-brand-border rounded-lg p-2 text-brand-text-secondary text-sm" />
                                        <button onClick={handleCopyLink} className="flex-shrink-0 bg-brand-blue hover:bg-brand-blue-dark text-white font-bold py-2 px-3 rounded-lg text-sm">
                                            {copiedLink ? 'Tersalin!' : <ClipboardIcon className="w-4 h-4"/>}
                                        </button>
                                    </div>
                                </div>
                            )}
                             {downloadError && (
                                <div className="mt-3 text-sm text-red-400 flex items-center gap-2"><AlertTriangleIcon className="w-4 h-4" /><span>{downloadError}</span></div>
                            )}
                        </div>

                    </div>
                    <div className="w-full flex gap-3 mt-auto">
                        <button onClick={resetFormState} className="w-full flex items-center justify-center gap-2 border-2 border-gray-600 text-gray-300 font-bold py-3 px-4 rounded-lg transition-colors hover:bg-gray-600 hover:text-white">
                            <PencilIcon className="w-5 h-5"/> Buat Lagi
                        </button>
                        <button onClick={handleGenerateClick} disabled={activeTab === 'location'} className="w-full flex items-center justify-center gap-2 bg-brand-blue hover:bg-brand-blue-dark text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed">
                            <RefreshCwIcon className="w-5 h-5"/> Generate Ulang
                        </button>
                    </div>
                </div>
            </div>
            {isPreviewOpen && generatedImageUrl && (
                <ResultPreviewModal
                    imageUrl={generatedImageUrl}
                    prompts={resultPrompts}
                    onClose={() => setIsPreviewOpen(false)}
                />
            )}
            </>
        );
    };

    const renderEmptyState = () => (
        <div className="m-auto text-center text-brand-text-secondary">
             <FaceSmileIcon className="w-24 h-24 mb-4 opacity-30 mx-auto"/>
            <h3 className="text-xl font-semibold text-brand-text-primary">Aset Anda akan muncul di sini</h3>
            <p className="mt-2 max-w-xs mx-auto">Isi formulir dan klik "Buat Aset" untuk memulai.</p>
        </div>
    );
    
    const renderContent = () => {
        switch (view) {
            case 'form': return <>{renderFormContent()} <div className="bg-brand-bg-light p-6 rounded-2xl border border-brand-border shadow-2xl flex flex-col items-center justify-center min-h-[400px] lg:min-h-0 w-full lg:w-3/5">{renderEmptyState()}</div></>;
            case 'loading': return <div className="w-full h-full flex items-center justify-center bg-brand-bg-light p-6 rounded-2xl border border-brand-border shadow-2xl"><GeneratedImageViewer imageUrl={null} isLoading={true} loadingStep={loadingStep} /></div>;
            case 'result': return renderResultContent();
            case 'error':
                const isApiKeyError = error?.includes("Kunci API");
                return (
                    <div className="w-full h-full flex flex-col items-center justify-center text-center text-red-400 bg-brand-bg-light p-6 rounded-2xl border border-brand-border shadow-2xl">
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
        }
    };

    return (
        <div ref={pageTopRef} className="w-full h-full flex flex-col">
            <header className="w-full max-w-6xl text-center mb-8 mx-auto">
                <div className="flex items-center justify-center gap-3 mb-2">
                    <FaceSmileIcon className="w-8 h-8 text-yellow-400" />
                    <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">
                        Pencipta Aset AI
                    </h1>
                </div>
                <p className="text-md sm:text-lg text-brand-text-secondary max-w-3xl mx-auto">
                    Buat dan kelola aset fundamental Anda: Avatar (karakter), Produk, dan Lokasi (latar).
                </p>
            </header>

            <div className="w-full max-w-5xl mx-auto flex justify-center items-center gap-2 p-1.5 bg-brand-bg-dark rounded-lg mb-8">
                <TabButton targetTab="avatar" icon={FaceSmileIcon}>Avatar</TabButton>
                <TabButton targetTab="product" icon={PackageIcon}>Produk</TabButton>
                <TabButton targetTab="location" icon={MapPinIcon}>Lokasi</TabButton>
            </div>

            <main className="w-full max-w-7xl mx-auto flex flex-col lg:flex-row gap-8 flex-grow">
                {renderContent()}
            </main>
        </div>
    );
};