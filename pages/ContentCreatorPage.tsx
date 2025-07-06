import React, { useState, useCallback, useEffect, useRef } from 'react';
import { analyzeProductImage, createScenePrompt, generateImageFromPrompt, createProductOnlyScenePrompt } from '../services/iklanProdukService';
import { fileToBase64 } from '../utils/fileUtils';
import { getSavedAvatars, SavedAvatar, getSavedProducts, SavedProduct, saveProduct, MAX_PRODUCTS, getSavedLocations, SavedLocation } from '../utils/localStorage';
import { ImageUploader } from '../components/ImageUploader';
import { GeneratedImageViewer } from '../components/GeneratedImageViewer';
import { SparklesIcon, AlertTriangleIcon, UserCircleIcon, VideoIcon, PencilIcon, ImageIcon, ChevronLeftIcon, RefreshCwIcon, BookmarkIcon, PackageIcon, PlusCircleIcon, MapPinIcon, DownloadIcon, ClipboardIcon } from '../components/IconComponents';
import { VideoContext } from '../App';
import { ResultPreviewModal, HistoryPrompt } from '../components/ResultPreviewModal';

interface IklanProdukPageProps {
  onProceedToVideo: (context: VideoContext) => void;
  onNavigate: (page: string) => void;
}

type View = 'form' | 'loading' | 'result' | 'error';
type ProductInputMode = 'upload' | 'saved';

const NO_AVATAR_PLACEHOLDER: SavedAvatar = {
  id: 'no-avatar',
  name: 'Tanpa Avatar',
  imageUrl: '', // This won't be used as an img src
  prompt: 'product_only',
};

const AI_LOCATION_PLACEHOLDER: SavedLocation = {
  id: 'ai-location',
  name: 'AI Pilihan',
  imageUrl: '',
  prompt: '',
};

const videoStyles = [
  { title: 'Kasih Solusi', description: 'Menampilkan masalah dan menawarkan produk sebagai solusi.' },
  { title: 'Storytelling', description: 'Menggunakan narasi yang menyentuh untuk koneksi emosional.' },
  { title: 'Komedi/Lucu', description: 'Menggunakan humor untuk membuat iklan yang mudah diingat.' },
  { title: 'Gaya Siaran Berita', description: 'Menyajikan informasi produk seolah-olah liputan berita eksklusif.' },
  { title: 'Gaya Drama Korea', description: 'Mengemas cerita dalam format drama sejarah (sageuk) khas Korea.' },
  { title: 'Gaya Kerajaan Majapahit', description: 'Mengambil seting dan nuansa kerajaan nusantara kuno.' },
  { title: 'Gaya Scifi/Masa Depan', description: 'Menampilkan produk dalam seting futuristik dan inovatif.' }
];

const newsLocationOptions = ["Studio TV Modern", "Ruang Redaksi (Newsroom)", "Ruang Rapat Formal", "Luar Ruangan (Wawancara Lapangan)"];
const koreaLocationOptions = ["Istana Kerajaan Korea", "Pasar Tradisional Korea", "Pedesaan dengan Rumah Hanok", "Paviliun di Tepi Danau"];
const majapahitLocationOptions = ["Pendopo Agung Kerajaan", "Area Candi/Stupa Batu", "Pasar Rakyat Jawa Kuno", "Taman Sari Kerajaan"];
const scifiLocationOptions = ["Gedung Pencakar Langit Futuristik", "Laboratorium Robot Canggih", "Bengkel Mobil Terbang", "Interior Pesawat Luar Angkasa"];


const specialStyles = ['Gaya Siaran Berita', 'Gaya Drama Korea', 'Gaya Kerajaan Majapahit', 'Gaya Scifi/Masa Depan'];

const StyleCard: React.FC<{
  title: string;
  description: string;
  isSelected: boolean;
  onClick: () => void;
}> = ({ title, description, isSelected, onClick }) => (
    <button onClick={onClick} className={`w-full p-3 text-left rounded-lg border-2 transition-all duration-200 ${ isSelected ? 'bg-brand-blue/20 border-brand-blue shadow-md' : 'bg-brand-bg-dark border-brand-border hover:border-gray-600'}`}>
        <h3 className="font-semibold text-brand-text-primary text-sm">{title}</h3>
    </button>
);


const IklanProdukPage: React.FC<IklanProdukPageProps> = ({ onProceedToVideo, onNavigate }) => {
  const pageTopRef = useRef<HTMLDivElement>(null);

  // Form State
  const [productInputMode, setProductInputMode] = useState<ProductInputMode>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [productType, setProductType] = useState<string>('');
  
  const [savedAvatars, setSavedAvatars] = useState<SavedAvatar[]>([]);
  const [selectedAvatar, setSelectedAvatar] = useState<SavedAvatar | null>(null);

  const [savedProducts, setSavedProducts] = useState<SavedProduct[]>([]);
  const [selectedSavedProduct, setSelectedSavedProduct] = useState<SavedProduct | null>(null);

  const [savedLocations, setSavedLocations] = useState<SavedLocation[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<SavedLocation>(AI_LOCATION_PLACEHOLDER);
  const [videoStyle, setVideoStyle] = useState<string>(videoStyles[0].title);
  
  // Style Specific State
  const [tvName, setTvName] = useState('');
  const [newsLocation, setNewsLocation] = useState<string>(newsLocationOptions[0]);
  const [koreaLocation, setKoreaLocation] = useState<string>(koreaLocationOptions[0]);
  const [majapahitLocation, setMajapahitLocation] = useState<string>(majapahitLocationOptions[0]);
  const [scifiLocation, setScifiLocation] = useState<string>(scifiLocationOptions[0]);
  
  // View & Loading State
  const [view, setView] = useState<View>('form');
  const [loadingStep, setLoadingStep] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Result State
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [resultPrompts, setResultPrompts] = useState<HistoryPrompt[]>([]);
  const [videoCreationContext, setVideoCreationContext] = useState<VideoContext | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Save as Product State
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const [newProductName, setNewProductName] = useState('');
  const [isProductSaved, setIsProductSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Download State
  const [isDownloadingImage, setIsDownloadingImage] = useState(false);
  const [downloadImageUrl, setDownloadImageUrl] = useState<string | null>(null);
  const [downloadImageError, setDownloadImageError] = useState<string | null>(null);
  const [copiedDownloadLink, setCopiedDownloadLink] = useState(false);


  useEffect(() => {
    setSavedAvatars(getSavedAvatars());
    if (!selectedAvatar) {
      setSelectedAvatar(NO_AVATAR_PLACEHOLDER);
    }
    setSavedProducts(getSavedProducts());
    setSavedLocations(getSavedLocations());
  }, []);

  const scrollToTop = () => {
    pageTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  
  const resetGenerationResult = useCallback(() => {
    setGeneratedImageUrl(null);
    setResultPrompts([]);
    setVideoCreationContext(null);
    setIsSavingProduct(false);
    setNewProductName('');
    setIsProductSaved(false);
    setIsPreviewOpen(false);
    setSaveError(null);
    setDownloadImageUrl(null);
    setDownloadImageError(null);
    setIsDownloadingImage(false);
    setCopiedDownloadLink(false);
  }, []);
  
  const handleCreateNew = useCallback(() => {
    resetGenerationResult();
    setSelectedFile(null);
    setProductType('');
    setProductInputMode('upload');
    setSelectedSavedProduct(null);
    setSelectedLocation(AI_LOCATION_PLACEHOLDER);
    if(previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
    }
    setView('form');
    scrollToTop();
  }, [previewUrl, resetGenerationResult]);

  const handleFileSelect = useCallback((file: File | null) => {
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setSelectedSavedProduct(null); // Deselect saved product when uploading
    }
  }, []);

  const handleSelectSavedProduct = (product: SavedProduct) => {
    setSelectedSavedProduct(product);
    setSelectedFile(null); // Deselect file when choosing saved product
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };


  const handleGenerateClick = async () => {
    const isReady = (productInputMode === 'upload' && selectedFile) || (productInputMode === 'saved' && selectedSavedProduct);
    if (!isReady || !selectedAvatar || !productType.trim()) {
      let errorMsg = "Pastikan semua kolom terisi.";
      if (!isReady) errorMsg = "Silakan unggah produk baru atau pilih produk yang tersimpan.";
      else if (!productType.trim()) errorMsg = "Silakan tentukan detail produk.";
      else if (!selectedAvatar) errorMsg = "Silakan pilih avatar atau opsi 'Tanpa Avatar'.";
      setError(errorMsg);
      setView('error');
      scrollToTop();
      return;
    }
    
    resetGenerationResult();
    setError(null);
    setView('loading');
    scrollToTop();

    try {
      let productDescription: string;
      if (productInputMode === 'upload') {
        if (!selectedFile) throw new Error("File tidak dipilih dalam mode unggah.");
        const base64ProductImage = await fileToBase64(selectedFile);
        const mimeType = selectedFile.type;
        setLoadingStep('Langkah 1/4: Menganalisis produk Anda...');
        productDescription = await analyzeProductImage(base64ProductImage, mimeType);
      } else {
        if (!selectedSavedProduct) throw new Error("Produk tersimpan tidak dipilih.");
        productDescription = selectedSavedProduct.dna;
        setLoadingStep('Langkah 1/4: Memuat DNA produk...');
      }

      let scenePrompt: string;
      let finalAvatarName: string;
      const isLocationLocked = specialStyles.includes(videoStyle);
      const locationPrompt = !isLocationLocked && selectedLocation.id !== 'ai-location' ? selectedLocation.prompt : undefined;


      if (selectedAvatar.id === 'no-avatar') {
        setLoadingStep('Langkah 2/4: Merancang adegan produk...');
        scenePrompt = await createProductOnlyScenePrompt(productDescription, productType, videoStyle, locationPrompt);
        finalAvatarName = 'Narator';
      } else {
        setLoadingStep('Langkah 2/4: Merancang adegan kreatif...');
        scenePrompt = await createScenePrompt(productDescription, selectedAvatar.prompt, productType, videoStyle, locationPrompt);
        finalAvatarName = selectedAvatar.name;
      }

      setLoadingStep('Langkah 3/4: Menghasilkan gambar akhir...');
      const generatedImageBase64 = await generateImageFromPrompt(scenePrompt);
      const finalImageUrl = `data:image/jpeg;base64,${generatedImageBase64}`;
      setGeneratedImageUrl(finalImageUrl);
      
      const promptsForModal: HistoryPrompt[] = [
          { title: 'Analisis DNA Produk', prompt: productDescription },
      ];
      if (locationPrompt) {
          promptsForModal.push({ title: 'Prompt Lokasi Pilihan', prompt: locationPrompt });
      }
      promptsForModal.push({ title: 'Prompt Generasi Adegan Final', prompt: scenePrompt });
      setResultPrompts(promptsForModal);

      setVideoCreationContext({
        productDescription: productDescription,
        sceneDescription: scenePrompt,
        avatarName: finalAvatarName,
        videoStyle: videoStyle,
        avatarPrompt: selectedAvatar.prompt,
        tvName: videoStyle === 'Gaya Siaran Berita' ? tvName : undefined,
        newsLocation: videoStyle === 'Gaya Siaran Berita' ? newsLocation : undefined,
        koreaLocation: videoStyle === 'Gaya Drama Korea' ? koreaLocation : undefined,
        majapahitLocation: videoStyle === 'Gaya Kerajaan Majapahit' ? majapahitLocation : undefined,
        scifiLocation: videoStyle === 'Gaya Scifi/Masa Depan' ? scifiLocation : undefined,
      });

      setView('result');

    } catch (e) {
      console.error(e);
      const errorMessage = e instanceof Error ? e.message : 'Terjadi kesalahan yang tidak diketahui.';
      setError(`Gagal menghasilkan gambar. Detail: ${errorMessage}`);
      setView('error');
    } finally {
      setLoadingStep('');
    }
  };
  
  const handleProceedClick = () => {
    if (!videoCreationContext) return;
    onProceedToVideo(videoCreationContext);
  }

  const handleSaveProduct = async () => {
    if (!generatedImageUrl || !newProductName.trim() || !videoCreationContext) return;
    
    setSaveError(null);
    setIsSavingProduct(true);
    try {
        saveProduct({
            id: Date.now().toString(),
            name: newProductName.trim(),
            imageUrl: generatedImageUrl,
            dna: videoCreationContext.productDescription,
        });
        setIsProductSaved(true);
        setSavedProducts(getSavedProducts()); // Refresh list for form view

    } catch (e) {
        console.error("Failed to save new product:", e);
        const errorMessage = e instanceof Error ? e.message : 'Terjadi kesalahan yang tidak diketahui.';
        setSaveError(`Gagal menyimpan produk. Detail: ${errorMessage}`);
    } finally {
        setIsSavingProduct(false);
    }
  };
  
  const handleDownloadImage = async () => {
      if (!generatedImageUrl) return;

      setIsDownloadingImage(true);
      setDownloadImageUrl(null);
      setDownloadImageError(null);
      setCopiedDownloadLink(false);

      try {
          const res = await fetch(generatedImageUrl);
          const blob = await res.blob();
          const fileName = `duniakreator_iklan_${Date.now()}.jpg`;
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
              setDownloadImageUrl(finalUrl);
          } else {
              throw new Error('Gagal mendapatkan URL unduhan. ' + (result.data?.error || ''));
          }

      } catch (e) {
          console.error(e);
          const errorMessage = e instanceof Error ? e.message : 'Terjadi kesalahan saat mengunggah gambar.';
          setDownloadImageError(errorMessage);
      } finally {
          setIsDownloadingImage(false);
      }
  };

  const handleCopyDownloadLink = () => {
      if (!downloadImageUrl) return;
      navigator.clipboard.writeText(downloadImageUrl);
      setCopiedDownloadLink(true);
      setTimeout(() => setCopiedDownloadLink(false), 2000);
  };



  const renderContent = () => {
    switch (view) {
        case 'loading':
            return (
                <div className="w-full h-full flex items-center justify-center bg-brand-bg-light p-6 rounded-2xl border border-brand-border shadow-2xl">
                    <GeneratedImageViewer imageUrl={null} isLoading={true} loadingStep={loadingStep} />
                </div>
            );
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
        case 'result':
            return (
                <>
                <div className="w-full h-full flex flex-col xl:flex-row gap-6 bg-brand-bg-light p-6 rounded-2xl border border-brand-border shadow-2xl animate-fade-in">
                    {/* Left Side: Image Preview */}
                    <div className='flex-shrink-0 xl:w-1/2 flex flex-col items-center justify-center bg-brand-bg-dark p-4 rounded-lg'>
                       <h3 className="text-lg font-semibold text-brand-text-secondary mb-4">Hasil Generasi</h3>
                        {generatedImageUrl && (
                            <button onClick={() => setIsPreviewOpen(true)} className="w-full max-w-sm aspect-[9/16] relative group">
                                <img src={generatedImageUrl} alt="Generated AI model" className="w-full h-full object-contain rounded-lg shadow-2xl"/>
                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                                    <p className="text-white font-bold">Lihat Detail</p>
                                </div>
                            </button>
                        )}
                    </div>

                    {/* Right Side: Actions & Details */}
                    <div className="flex-grow xl:w-1/2 flex flex-col gap-4">
                        {/* Main Actions */}
                        <div className="w-full flex flex-col gap-3 mt-2">
                           {videoCreationContext && (
                                <button onClick={handleProceedClick} className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-105">
                                    <VideoIcon className="w-5 h-5"/> Lanjut Buat Video
                                </button>
                           )}
                           <div className="w-full flex gap-3">
                               <button onClick={handleGenerateClick} className="w-full flex items-center justify-center gap-2 bg-brand-blue hover:bg-brand-blue-dark text-white font-bold py-3 px-4 rounded-lg transition-colors">
                                    <RefreshCwIcon className="w-5 h-5"/> Generate Ulang
                                </button>
                           </div>
                        </div>
                        
                        {/* Download Section */}
                        <div className="w-full bg-brand-bg-dark border border-brand-border rounded-lg p-4">
                          <h3 className="text-md font-semibold text-brand-text-primary mb-3">Unduh Gambar</h3>
                          <button
                              onClick={handleDownloadImage}
                              disabled={isDownloadingImage}
                              className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-500 disabled:cursor-not-allowed text-white font-bold py-2.5 px-4 rounded-lg transition-colors"
                          >
                              <DownloadIcon className="w-5 h-5"/>
                              {isDownloadingImage ? 'Mengunggah...' : 'Dapatkan Link Unduhan'}
                          </button>
                          {isDownloadingImage && (
                              <div className="w-full bg-gray-700/50 rounded-full h-1.5 mt-2.5">
                                  <div className="bg-brand-blue h-1.5 rounded-full animate-pulse"></div>
                              </div>
                          )}
                          {downloadImageUrl && (
                              <div className="mt-4 p-3 bg-black/30 rounded-lg animate-fade-in">
                                  <p className="text-sm text-green-400 font-semibold mb-2">✔️ Link unduhan berhasil dibuat!</p>
                                  <div className="flex items-center gap-2">
                                      <input type="text" readOnly value={downloadImageUrl} className="w-full bg-brand-bg-light border border-brand-border rounded-lg p-2 text-brand-text-secondary text-sm" />
                                      <button onClick={handleCopyDownloadLink} className="flex-shrink-0 bg-brand-blue hover:bg-brand-blue-dark text-white font-bold py-2 px-3 rounded-lg text-sm">
                                          {copiedDownloadLink ? 'Tersalin!' : <ClipboardIcon className="w-4 h-4"/>}
                                      </button>
                                  </div>
                              </div>
                          )}
                          {downloadImageError && (
                              <div className="mt-3 text-sm text-red-400 flex items-center gap-2">
                                  <AlertTriangleIcon className="w-4 h-4" />
                                  <span>{downloadImageError}</span>
                              </div>
                          )}
                        </div>


                        {/* Save as Product Section - Only show if NO avatar was used */}
                        {videoCreationContext?.avatarName === 'Narator' && (
                          <div className="w-full bg-brand-bg-dark border border-brand-border rounded-lg p-4 mt-2">
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="text-md font-semibold text-brand-text-primary">Simpan Produk Ini</h3>
                                <p className="text-xs font-mono text-brand-text-secondary">{savedProducts.length}/{MAX_PRODUCTS}</p>
                           </div>
                            {isProductSaved ? (
                                <p className='text-green-400 font-semibold'>Produk baru berhasil disimpan!</p>
                            ) : (
                                <div className='animate-fade-in space-y-3'>
                                    <input
                                        type="text"
                                        value={newProductName}
                                        onChange={(e) => setNewProductName(e.target.value)}
                                        placeholder="Beri nama produk baru Anda..."
                                        className="w-full bg-black/30 border border-brand-border rounded-lg p-2 text-brand-text-primary focus:ring-2 focus:ring-brand-blue outline-none transition"
                                    />
                                    <button
                                      onClick={handleSaveProduct}
                                      disabled={!newProductName.trim() || isSavingProduct}
                                      className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-500 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-lg transition-colors"
                                    >
                                      <BookmarkIcon className="w-5 h-5"/>
                                      {isSavingProduct ? 'Menyimpan...' : 'Simpan Produk'}
                                    </button>
                                </div>
                            )}
                            {saveError && <p className="text-xs text-red-400 mt-1">{saveError}</p>}
                          </div>
                        )}
                        
                        <button onClick={handleCreateNew} className="w-full flex items-center justify-center gap-2 border-2 border-gray-600 text-gray-300 font-bold py-3 px-4 rounded-lg transition-all duration-300 hover:bg-gray-600 hover:text-white mt-auto">
                            <PencilIcon className="w-5 h-5"/> Buat Iklan Baru
                        </button>
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
            )
        default: // form
            const isLocationLocked = specialStyles.includes(videoStyle);
            const isGenerateDisabled = !selectedAvatar || !productType.trim() || (productInputMode === 'upload' && !selectedFile) || (productInputMode === 'saved' && !selectedSavedProduct);
            const TabButton: React.FC<{ mode: ProductInputMode, children: React.ReactNode }> = ({ mode, children }) => (
                <button
                    onClick={() => setProductInputMode(mode)}
                    className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors w-1/2 ${productInputMode === mode ? 'bg-brand-blue text-white' : 'bg-brand-bg-dark text-brand-text-secondary hover:bg-brand-bg-light'}`}
                >
                  {children}
                </button>
            );

            return(
                <>
                <div className="w-full lg:w-1/3 flex-shrink-0 bg-brand-bg-light p-6 rounded-2xl border border-brand-border shadow-2xl flex flex-col gap-6 animate-fade-in">
                    <div>
                        <h2 className="text-xl font-semibold mb-3 text-center">1. Pilih Sumber Produk</h2>
                        <div className="flex items-center justify-center gap-2 p-1 bg-brand-bg-dark rounded-lg">
                            <TabButton mode="upload">Unggah Baru</TabButton>
                            <TabButton mode="saved">Gunakan Tersimpan</TabButton>
                        </div>
                        <div className="mt-3">
                            {productInputMode === 'upload' ? (
                                <ImageUploader onFileSelect={handleFileSelect} previewUrl={previewUrl} />
                            ) : (
                                <div className="bg-brand-bg-dark p-3 rounded-lg max-h-60 overflow-y-auto">
                                    {savedProducts.length > 0 ? (
                                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                                            {savedProducts.map(product => (
                                                <div key={product.id} className="flex flex-col items-center gap-1.5">
                                                    <button onClick={() => handleSelectSavedProduct(product)} className="relative aspect-square rounded-lg overflow-hidden border-2 transition-colors duration-200 w-full"
                                                        style={{ borderColor: selectedSavedProduct?.id === product.id ? '#007BFF' : 'transparent' }}
                                                    >
                                                        <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover"/>
                                                        {selectedSavedProduct?.id === product.id && (
                                                            <div className="absolute inset-0 bg-brand-blue/50 flex items-center justify-center">
                                                                <SparklesIcon className="w-6 h-6 text-white"/>
                                                            </div>
                                                        )}
                                                    </button>
                                                    <p className="text-xs text-center text-brand-text-secondary w-full truncate" title={product.name}>{product.name}</p>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-center text-sm text-brand-text-secondary py-4">Belum ada produk tersimpan.</p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                    
                    <div>
                        <h2 className="text-xl font-semibold mb-2 text-center">2. Detail Produk</h2>
                        <input
                            type="text"
                            value={productType}
                            onChange={(e) => setProductType(e.target.value)}
                            placeholder="Contoh: ini adalah baju kaos katun."
                            className="w-full bg-brand-bg-dark border border-brand-border rounded-lg p-3 text-brand-text-primary focus:ring-2 focus:ring-brand-blue outline-none transition"
                        />
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold mb-4 text-center">3. Pilih Avatar</h2>
                        <div className="bg-brand-bg-dark p-3 rounded-lg max-h-60 overflow-y-auto">
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 justify-center">
                                <div className="flex flex-col items-center gap-1.5">
                                    <button onClick={() => onNavigate('buat-avatar')} className="relative aspect-square rounded-lg overflow-hidden border-2 border-dashed border-brand-border hover:border-brand-blue transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-brand-bg-dark focus:ring-brand-blue w-full">
                                        <div className="w-full h-full bg-brand-bg-light flex items-center justify-center rounded-md">
                                            <PlusCircleIcon className="w-8 h-8 text-brand-text-secondary" />
                                        </div>
                                    </button>
                                    <p className="text-xs text-center text-brand-text-secondary w-full truncate" title="Tambah Avatar">Tambah Avatar</p>
                                </div>
                                <div className="flex flex-col items-center gap-1.5">
                                    <button onClick={() => setSelectedAvatar(NO_AVATAR_PLACEHOLDER)} className="relative aspect-square rounded-lg overflow-hidden border-2 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-brand-bg-dark focus:ring-brand-blue w-full"
                                    style={{ borderColor: selectedAvatar?.id === NO_AVATAR_PLACEHOLDER.id ? '#007BFF' : 'transparent' }}
                                    >
                                        <div className="w-full h-full bg-brand-bg-light flex items-center justify-center rounded-md">
                                            <PackageIcon className="w-8 h-8 text-brand-text-secondary" />
                                        </div>
                                        {selectedAvatar?.id === NO_AVATAR_PLACEHOLDER.id && (
                                            <div className="absolute inset-0 bg-brand-blue/50 flex items-center justify-center">
                                                <SparklesIcon className="w-6 h-6 text-white"/>
                                            </div>
                                        )}
                                    </button>
                                    <p className="text-xs text-center text-brand-text-secondary w-full truncate" title={NO_AVATAR_PLACEHOLDER.name}>{NO_AVATAR_PLACEHOLDER.name}</p>
                                </div>
                                {savedAvatars.map(avatar => (
                                    <div key={avatar.id} className="flex flex-col items-center gap-1.5">
                                        <button onClick={() => setSelectedAvatar(avatar)} className="relative aspect-square rounded-lg overflow-hidden border-2 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-brand-bg-dark focus:ring-brand-blue w-full"
                                        style={{ borderColor: selectedAvatar?.id === avatar.id ? '#007BFF' : 'transparent' }}
                                        >
                                            <img src={avatar.imageUrl} alt={avatar.prompt} className="w-full h-full object-cover"/>
                                            {selectedAvatar?.id === avatar.id && (
                                                <div className="absolute inset-0 bg-brand-blue/50 flex items-center justify-center">
                                                    <SparklesIcon className="w-6 h-6 text-white"/>
                                                </div>
                                            )}
                                        </button>
                                        <p className="text-xs text-center text-brand-text-secondary w-full truncate" title={avatar.name}>{avatar.name}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    
                    <div>
                        <h2 className="text-xl font-semibold mb-4 text-center">4. Pilih Gaya Video</h2>
                        <div className="grid grid-cols-2 gap-2">
                             {videoStyles.map((style) => (
                                <StyleCard
                                    key={style.title}
                                    title={style.title}
                                    description={style.description}
                                    isSelected={videoStyle === style.title}
                                    onClick={() => setVideoStyle(style.title)}
                                />
                            ))}
                        </div>
                        {videoStyle === 'Gaya Siaran Berita' && (
                            <div className="animate-fade-in space-y-3 mt-4 p-3 bg-brand-bg-dark rounded-lg border border-brand-border">
                                <h3 className="text-md font-semibold text-center text-brand-text-primary">Detail Siaran Berita</h3>
                                <div>
                                    <label className="block text-sm font-medium text-brand-text-secondary mb-1">Nama Stasiun TV</label>
                                    <input 
                                        type="text" 
                                        value={tvName} 
                                        onChange={(e) => setTvName(e.target.value)} 
                                        placeholder="Contoh: TV-ONE, Kreator News"
                                        className="w-full bg-black/30 border border-brand-border rounded-lg p-2 text-brand-text-primary focus:ring-2 focus:ring-brand-blue outline-none transition"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-brand-text-secondary mb-1">Lokasi Berita</label>
                                    <select
                                        value={newsLocation}
                                        onChange={(e) => setNewsLocation(e.target.value)}
                                        className="w-full bg-black/30 border border-brand-border rounded-lg p-2 text-brand-text-primary focus:ring-2 focus:ring-brand-blue outline-none transition"
                                    >
                                        {newsLocationOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                    </select>
                                </div>
                            </div>
                        )}
                        {videoStyle === 'Gaya Drama Korea' && (
                            <div className="animate-fade-in space-y-3 mt-4 p-3 bg-brand-bg-dark rounded-lg border border-brand-border">
                                <label className="block text-sm font-medium text-brand-text-secondary mb-1">Pilih Lokasi Drama Korea</label>
                                <select value={koreaLocation} onChange={(e) => setKoreaLocation(e.target.value)} className="w-full bg-black/30 border border-brand-border rounded-lg p-2 text-brand-text-primary focus:ring-2 focus:ring-brand-blue outline-none transition">
                                    {koreaLocationOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                </select>
                            </div>
                        )}
                        {videoStyle === 'Gaya Kerajaan Majapahit' && (
                             <div className="animate-fade-in space-y-3 mt-4 p-3 bg-brand-bg-dark rounded-lg border border-brand-border">
                                <label className="block text-sm font-medium text-brand-text-secondary mb-1">Pilih Lokasi Kerajaan</label>
                                <select value={majapahitLocation} onChange={(e) => setMajapahitLocation(e.target.value)} className="w-full bg-black/30 border border-brand-border rounded-lg p-2 text-brand-text-primary focus:ring-2 focus:ring-brand-blue outline-none transition">
                                    {majapahitLocationOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                </select>
                            </div>
                        )}
                        {videoStyle === 'Gaya Scifi/Masa Depan' && (
                             <div className="animate-fade-in space-y-3 mt-4 p-3 bg-brand-bg-dark rounded-lg border border-brand-border">
                                <label className="block text-sm font-medium text-brand-text-secondary mb-1">Pilih Lokasi Scifi</label>
                                <select value={scifiLocation} onChange={(e) => setScifiLocation(e.target.value)} className="w-full bg-black/30 border border-brand-border rounded-lg p-2 text-brand-text-primary focus:ring-2 focus:ring-brand-blue outline-none transition">
                                    {scifiLocationOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                </select>
                            </div>
                        )}
                    </div>

                    <div className={`${isLocationLocked ? 'opacity-50' : ''}`}>
                        <h2 className={`text-xl font-semibold mb-4 text-center ${isLocationLocked ? 'text-gray-500' : ''}`}>
                            5. Pilih Lokasi {isLocationLocked ? '(Otomatis oleh AI)' : '(Opsional)'}
                        </h2>
                        <div className={`bg-brand-bg-dark p-3 rounded-lg max-h-60 overflow-y-auto ${isLocationLocked ? 'pointer-events-none' : ''}`}>
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 justify-center">
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
                    
                    <div className="mt-auto flex flex-col gap-3">
                    <button
                        onClick={handleGenerateClick}
                        disabled={isGenerateDisabled}
                        className="w-full flex items-center justify-center gap-2 bg-brand-blue hover:bg-brand-blue-dark disabled:bg-gray-500 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 disabled:scale-100"
                    >
                        <SparklesIcon className="w-5 h-5"/>
                        6. Hasilkan Gambar
                    </button>
                    </div>
                </div>

                <div className="bg-brand-bg-light p-6 rounded-2xl border border-brand-border shadow-2xl flex flex-col items-center justify-center min-h-[400px] lg:min-h-0 w-full lg:w-2/3">
                    <div className="m-auto text-center text-brand-text-secondary">
                        <ImageIcon className="w-24 h-24 mb-4 opacity-30 mx-auto"/>
                        <h3 className="text-xl font-semibold text-brand-text-primary">Konten Anda akan muncul di sini</h3>
                        <p className="mt-2 max-w-xs mx-auto">Isi formulir dan klik "Hasilkan" untuk memulai.</p>
                    </div>
                </div>
                </>
            )
    }
  }

  return (
    <div ref={pageTopRef} className="w-full h-full flex flex-col">
        <header className="w-full max-w-6xl text-center mb-8 mx-auto">
            <div className="flex items-center justify-center gap-3 mb-2">
                <UserCircleIcon className="w-8 h-8 text-blue-400" />
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
                    Buat Iklan Produk
                </h1>
            </div>
            <p className="text-md sm:text-lg text-brand-text-secondary max-w-3xl mx-auto">
              Buat visual yang menakjubkan dengan menggabungkan produk Anda dengan avatar dan lokasi yang tersimpan.
            </p>
        </header>

        <main className="w-full max-w-7xl mx-auto flex flex-col lg:flex-row gap-8 flex-grow">
            {renderContent()}
        </main>
    </div>
  );
};

export default IklanProdukPage;