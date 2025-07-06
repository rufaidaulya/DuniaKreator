import React, { useState, useEffect, useCallback } from 'react';
import { 
    getSavedProducts, deleteProduct, SavedProduct, MAX_PRODUCTS,
    getSavedLocations, deleteLocation, SavedLocation, MAX_LOCATIONS,
    getSavedAvatars, deleteAvatar, SavedAvatar, MAX_AVATARS
} from '../utils/localStorage';
import { TrashIcon, ClipboardIcon, PackageIcon, XIcon, MapPinIcon, BookmarkIcon } from '../components/IconComponents';


const AvatarPreviewModal: React.FC<{
    avatar: SavedAvatar;
    onClose: () => void;
}> = ({ avatar, onClose }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(avatar.prompt);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-brand-bg-light w-full max-w-lg lg:max-w-3xl rounded-2xl border border-brand-border shadow-2xl flex flex-col md:flex-row animate-fade-in max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <img src={avatar.imageUrl} alt={avatar.name} className="w-full md:w-1/2 h-auto aspect-square object-cover rounded-t-2xl md:rounded-l-2xl md:rounded-tr-none" />
                <div className="p-6 flex flex-col flex-grow overflow-y-auto">
                    <div className="flex justify-between items-start">
                        <h2 className="text-2xl font-bold text-brand-text-primary mb-2">{avatar.name}</h2>
                        <button onClick={onClose} className="text-brand-text-secondary hover:text-white transition-colors">
                            <XIcon className="w-6 h-6"/>
                        </button>
                    </div>
                    <p className="text-sm font-semibold text-brand-text-secondary mb-2">Prompt Konsistensi</p>
                    <textarea 
                        readOnly 
                        value={avatar.prompt}
                        className="w-full h-full flex-grow bg-brand-bg-dark border border-brand-border rounded-lg p-3 text-brand-text-primary text-sm resize-none mb-4 whitespace-pre-wrap break-words"
                        rows={6}
                    />
                    <button
                        onClick={handleCopy}
                        className="w-full flex items-center justify-center gap-2 bg-brand-blue hover:bg-brand-blue-dark text-white font-bold py-2.5 px-4 rounded-lg transition-colors mt-auto"
                    >
                        <ClipboardIcon className="w-4 h-4"/>
                        {copied ? 'Tersalin!' : 'Salin Prompt'}
                    </button>
                </div>
            </div>
        </div>
    );
}

const ProductPreviewModal: React.FC<{
    product: SavedProduct;
    onClose: () => void;
}> = ({ product, onClose }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(product.dna);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-brand-bg-light w-full max-w-lg lg:max-w-3xl rounded-2xl border border-brand-border shadow-2xl flex flex-col md:flex-row animate-fade-in max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <div className="w-full md:w-1/2 flex items-center justify-center p-4 bg-brand-bg-dark rounded-t-2xl md:rounded-l-2xl md:rounded-tr-none">
                  <img src={product.imageUrl} alt={product.name} className="w-full h-auto max-h-full object-contain rounded-lg" />
                </div>
                <div className="p-6 flex flex-col flex-grow overflow-y-auto w-full md:w-1/2">
                    <div className="flex justify-between items-start">
                        <h2 className="text-2xl font-bold text-brand-text-primary mb-2">{product.name}</h2>
                        <button onClick={onClose} className="text-brand-text-secondary hover:text-white transition-colors">
                            <XIcon className="w-6 h-6"/>
                        </button>
                    </div>
                    <p className="text-sm font-semibold text-brand-text-secondary mb-2">DNA Produk</p>
                    <textarea 
                        readOnly 
                        value={product.dna}
                        className="w-full h-full flex-grow bg-brand-bg-dark border border-brand-border rounded-lg p-3 text-brand-text-primary text-sm resize-none mb-4 whitespace-pre-wrap break-words"
                        rows={6}
                    />
                    <button
                        onClick={handleCopy}
                        className="w-full flex items-center justify-center gap-2 bg-brand-blue hover:bg-brand-blue-dark text-white font-bold py-2.5 px-4 rounded-lg transition-colors mt-auto"
                    >
                        <ClipboardIcon className="w-4 h-4"/>
                        {copied ? 'Tersalin!' : 'Salin DNA'}
                    </button>
                </div>
            </div>
        </div>
    );
}

const LocationPreviewModal: React.FC<{
    location: SavedLocation;
    onClose: () => void;
}> = ({ location, onClose }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(location.prompt);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-brand-bg-light w-full max-w-xl rounded-2xl border border-brand-border shadow-2xl flex flex-col animate-fade-in max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <div className="p-6 flex flex-col flex-grow overflow-y-auto">
                    <div className="flex justify-between items-start">
                        <h2 className="text-2xl font-bold text-brand-text-primary mb-2">{location.name}</h2>
                        <button onClick={onClose} className="text-brand-text-secondary hover:text-white transition-colors">
                            <XIcon className="w-6 h-6"/>
                        </button>
                    </div>
                    <p className="text-sm font-semibold text-brand-text-secondary mb-2">Prompt Deskripsi Lokasi</p>
                    <textarea 
                        readOnly 
                        value={location.prompt}
                        className="w-full h-full flex-grow bg-brand-bg-dark border border-brand-border rounded-lg p-3 text-brand-text-primary text-sm resize-none mb-4 whitespace-pre-wrap break-words"
                        rows={10}
                    />
                    <button
                        onClick={handleCopy}
                        className="w-full flex items-center justify-center gap-2 bg-brand-blue hover:bg-brand-blue-dark text-white font-bold py-2.5 px-4 rounded-lg transition-colors mt-auto"
                    >
                        <ClipboardIcon className="w-4 h-4"/>
                        {copied ? 'Tersalin!' : 'Salin Prompt'}
                    </button>
                </div>
            </div>
        </div>
    );
}


const SavedAssetsPage: React.FC = () => {
  type Tab = 'avatars' | 'products' | 'locations';
  const [activeTab, setActiveTab] = useState<Tab>('avatars');

  const [savedAvatars, setSavedAvatars] = useState<SavedAvatar[]>([]);
  const [previewAvatar, setPreviewAvatar] = useState<SavedAvatar | null>(null);

  const [savedProducts, setSavedProducts] = useState<SavedProduct[]>([]);
  const [previewProduct, setPreviewProduct] = useState<SavedProduct | null>(null);

  const [savedLocations, setSavedLocations] = useState<SavedLocation[]>([]);
  const [previewLocation, setPreviewLocation] = useState<SavedLocation | null>(null);

  useEffect(() => {
    setSavedAvatars(getSavedAvatars());
    setSavedProducts(getSavedProducts());
    setSavedLocations(getSavedLocations());
  }, []);

  const handleDeleteAvatar = useCallback((e: React.MouseEvent, avatarId: string) => {
    e.stopPropagation();
    if (window.confirm("Apakah Anda yakin ingin menghapus avatar ini?")) {
      deleteAvatar(avatarId);
      setSavedAvatars(currentAvatars => currentAvatars.filter(avatar => avatar.id !== avatarId));
    }
  }, []);

  const handleDeleteProduct = useCallback((e: React.MouseEvent, productId: string) => {
    e.stopPropagation();
    if (window.confirm("Apakah Anda yakin ingin menghapus produk ini?")) {
      deleteProduct(productId);
      setSavedProducts(currentProducts => currentProducts.filter(product => product.id !== productId));
    }
  }, []);

  const handleDeleteLocation = useCallback((e: React.MouseEvent, locationId: string) => {
    e.stopPropagation();
    if (window.confirm("Apakah Anda yakin ingin menghapus lokasi ini?")) {
      deleteLocation(locationId);
      setSavedLocations(currentLocations => currentLocations.filter(loc => loc.id !== locationId));
    }
  }, []);

  const TabButton: React.FC<{ tab: Tab, icon: React.ElementType, children: React.ReactNode }> = ({ tab, icon: Icon, children }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`flex-1 flex justify-center items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-md transition-colors ${activeTab === tab ? 'bg-brand-blue text-white' : 'bg-brand-bg-dark text-brand-text-secondary hover:bg-brand-bg-light'}`}
    >
      <Icon className="w-5 h-5" /> {children}
    </button>
  );

  return (
    <div className="w-full h-full flex flex-col animate-fade-in">
      <header className="w-full max-w-6xl text-center mb-10 mx-auto">
        <div className="flex items-center justify-center gap-3 mb-2">
          <PackageIcon className="w-8 h-8 text-lime-400" />
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-lime-400 to-green-500">
            Aset Tersimpan
          </h1>
        </div>
        <p className="text-md sm:text-lg text-brand-text-secondary max-w-3xl mx-auto">
          Kelola semua avatar, produk, dan lokasi yang telah Anda simpan. Gunakan kembali aset ini untuk mempercepat pembuatan konten Anda.
        </p>
      </header>
      
      <div className="w-full max-w-lg mx-auto flex justify-center items-center gap-2 p-1.5 bg-brand-bg-dark rounded-lg mb-8">
        <TabButton tab="avatars" icon={BookmarkIcon}>Avatar ({savedAvatars.length}/{MAX_AVATARS})</TabButton>
        <TabButton tab="products" icon={PackageIcon}>Produk ({savedProducts.length}/{MAX_PRODUCTS})</TabButton>
        <TabButton tab="locations" icon={MapPinIcon}>Lokasi ({savedLocations.length}/{MAX_LOCATIONS})</TabButton>
      </div>

      <main className="w-full max-w-7xl mx-auto flex-grow">
        {activeTab === 'avatars' && (
            savedAvatars.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center text-brand-text-secondary mt-16 animate-fade-in">
                    <BookmarkIcon className="w-24 h-24 mb-6 opacity-30"/>
                    <h2 className="text-2xl font-bold text-brand-text-primary mb-2">Belum Ada Avatar yang Disimpan</h2>
                    <p className="mt-2 max-w-md">
                        Pergi ke halaman "Buat Aset" untuk membuat dan menyimpan karakter pertama Anda. Mereka akan muncul di sini.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-4 animate-fade-in">
                    {savedAvatars.map(avatar => (
                        <div 
                            key={avatar.id} 
                            onClick={() => setPreviewAvatar(avatar)}
                            className="group bg-brand-bg-light border border-brand-border rounded-xl shadow-lg transition-transform duration-300 hover:-translate-y-1 flex flex-col cursor-pointer"
                        >
                            <div className="relative">
                                <img src={avatar.imageUrl} alt={`Saved avatar ${avatar.name}`} className="w-full h-auto aspect-square object-cover rounded-t-xl" />
                                <button
                                    onClick={(e) => handleDeleteAvatar(e, avatar.id)}
                                    className="absolute top-2 right-2 bg-red-600/70 hover:bg-red-600 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 transform scale-75 group-hover:scale-100 z-10"
                                    aria-label="Delete avatar"
                                >
                                    <TrashIcon className="w-4 h-4"/>
                                </button>
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            </div>
                            <div className="p-3 text-center">
                                <p className="text-brand-text-primary font-semibold truncate text-sm" title={avatar.name}>{avatar.name}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )
        )}
        {activeTab === 'products' && (
          savedProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center text-brand-text-secondary mt-16 animate-fade-in">
              <PackageIcon className="w-24 h-24 mb-6 opacity-30"/>
              <h2 className="text-2xl font-bold text-brand-text-primary mb-2">Belum Ada Produk yang Disimpan</h2>
              <p className="mt-2 max-w-md">
                Pergi ke halaman "Buat Iklan Produk", hasilkan gambar produk (tanpa avatar), lalu simpan. Produk akan muncul di sini.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6 animate-fade-in">
              {savedProducts.map(product => (
                <div 
                  key={product.id} 
                  onClick={() => setPreviewProduct(product)}
                  className="group bg-brand-bg-light border border-brand-border rounded-xl shadow-lg transition-transform duration-300 hover:-translate-y-1 flex flex-col cursor-pointer"
                >
                  <div className="relative">
                    <img src={product.imageUrl} alt={`Saved product ${product.name}`} className="w-full h-auto aspect-[16/9] object-cover rounded-t-xl" />
                    <button
                      onClick={(e) => handleDeleteProduct(e, product.id)}
                      className="absolute top-2 right-2 bg-red-600/70 hover:bg-red-600 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 transform scale-75 group-hover:scale-100 z-10"
                      aria-label="Delete product"
                    >
                      <TrashIcon className="w-4 h-4"/>
                    </button>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>
                  <div className="p-3 text-center">
                    <p className="text-brand-text-primary font-semibold truncate text-sm" title={product.name}>{product.name}</p>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
        {activeTab === 'locations' && (
          savedLocations.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center text-brand-text-secondary mt-16 animate-fade-in">
                <MapPinIcon className="w-24 h-24 mb-6 opacity-30"/>
                <h2 className="text-2xl font-bold text-brand-text-primary mb-2">Belum Ada Lokasi yang Disimpan</h2>
                <p className="mt-2 max-w-md">
                    Pergi ke halaman "Buat Aset", pilih tab "Lokasi", unggah gambar referensi, dan simpan. Lokasi akan muncul di sini.
                </p>
            </div>
          ) : (
            <div className="space-y-3 animate-fade-in">
              {savedLocations.map(loc => (
                <div 
                  key={loc.id} 
                  onClick={() => setPreviewLocation(loc)}
                  className="group bg-brand-bg-light border border-brand-border rounded-xl shadow-lg transition-all duration-300 hover:border-brand-blue/50 hover:bg-brand-bg-dark/20 flex items-center p-4 gap-4 cursor-pointer"
                >
                  <div className="flex-shrink-0 p-3 bg-brand-bg-dark rounded-full">
                    <MapPinIcon className="w-6 h-6 text-pink-400"/>
                  </div>
                  <div className="flex-grow min-w-0">
                    <p className="text-brand-text-primary font-semibold truncate text-md" title={loc.name}>{loc.name}</p>
                  </div>
                  <button
                    onClick={(e) => handleDeleteLocation(e, loc.id)}
                    className="flex-shrink-0 bg-red-600/70 hover:bg-red-600 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 transform scale-75 group-hover:scale-100"
                    aria-label="Delete location"
                  >
                    <TrashIcon className="w-4 h-4"/>
                  </button>
                </div>
              ))}
            </div>
          )
        )}
      </main>
      {previewAvatar && <AvatarPreviewModal avatar={previewAvatar} onClose={() => setPreviewAvatar(null)} />}
      {previewProduct && <ProductPreviewModal product={previewProduct} onClose={() => setPreviewProduct(null)} />}
      {previewLocation && <LocationPreviewModal location={previewLocation} onClose={() => setPreviewLocation(null)} />}
    </div>
  );
};

export default SavedAssetsPage;