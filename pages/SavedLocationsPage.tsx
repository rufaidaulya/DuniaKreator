import React, { useState, useEffect, useCallback } from 'react';
import { getSavedLocations, deleteLocation, SavedLocation, MAX_LOCATIONS } from '../utils/localStorage';
import { TrashIcon, ClipboardIcon, MapPinIcon, XIcon } from '../components/IconComponents';

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
            <div className="bg-brand-bg-light w-full max-w-lg lg:max-w-3xl rounded-2xl border border-brand-border shadow-2xl flex flex-col md:flex-row animate-fade-in max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <div className="w-full md:w-1/2 flex items-center justify-center p-4 bg-brand-bg-dark rounded-t-2xl md:rounded-l-2xl md:rounded-tr-none">
                  <img src={location.imageUrl} alt={location.name} className="w-full h-auto max-h-full object-contain rounded-lg" />
                </div>
                <div className="p-6 flex flex-col flex-grow overflow-y-auto w-full md:w-1/2">
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

const SavedLocationsPage: React.FC = () => {
  const [savedLocations, setSavedLocations] = useState<SavedLocation[]>([]);
  const [previewLocation, setPreviewLocation] = useState<SavedLocation | null>(null);

  useEffect(() => {
      setSavedLocations(getSavedLocations());
  }, []);

  const handleDeleteLocation = useCallback((e: React.MouseEvent, locationId: string) => {
      e.stopPropagation();
      if (window.confirm("Apakah Anda yakin ingin menghapus lokasi ini?")) {
        deleteLocation(locationId);
        setSavedLocations(currentLocations => currentLocations.filter(loc => loc.id !== locationId));
      }
  }, []);
  
  return (
    <div className="w-full h-full flex flex-col animate-fade-in">
      <header className="w-full max-w-6xl text-center mb-10 mx-auto">
        <div className="flex items-center justify-center gap-3 mb-2">
            <MapPinIcon className="w-8 h-8 text-pink-400" />
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-500">
                Lokasi Tersimpan ({savedLocations.length}/{MAX_LOCATIONS})
            </h1>
        </div>
        <p className="text-md sm:text-lg text-brand-text-secondary max-w-3xl mx-auto">
            Kelola koleksi lokasi atau latar belakang adegan. Anda dapat menggunakan kembali lokasi ini untuk memberikan konteks pada iklan atau konten Anda.
        </p>
      </header>

      <main className="w-full max-w-7xl mx-auto flex-grow">
        {savedLocations.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center text-brand-text-secondary mt-16">
                <MapPinIcon className="w-24 h-24 mb-6 opacity-30"/>
                <h2 className="text-2xl font-bold text-brand-text-primary mb-2">Belum Ada Lokasi yang Disimpan</h2>
                <p className="mt-2 max-w-md">
                    Pergi ke halaman "Buat Aset", pilih tab "Lokasi", unggah gambar referensi, dan simpan. Lokasi akan muncul di sini.
                </p>
            </div>
        ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
                {savedLocations.map(loc => (
                    <div 
                        key={loc.id} 
                        onClick={() => setPreviewLocation(loc)}
                        className="group bg-brand-bg-light border border-brand-border rounded-xl shadow-lg transition-transform duration-300 hover:-translate-y-1 flex flex-col cursor-pointer"
                    >
                        <div className="relative">
                            <img src={loc.imageUrl} alt={`Saved location ${loc.name}`} className="w-full h-auto aspect-[16/9] object-cover rounded-t-xl" />
                            <button
                                onClick={(e) => handleDeleteLocation(e, loc.id)}
                                className="absolute top-2 right-2 bg-red-600/70 hover:bg-red-600 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 transform scale-75 group-hover:scale-100 z-10"
                                aria-label="Delete location"
                            >
                                <TrashIcon className="w-4 h-4"/>
                            </button>
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        </div>
                        <div className="p-3 text-center">
                            <p className="text-brand-text-primary font-semibold truncate text-sm" title={loc.name}>{loc.name}</p>
                        </div>
                    </div>
                ))}
            </div>
        )}
      </main>
      {previewLocation && <LocationPreviewModal location={previewLocation} onClose={() => setPreviewLocation(null)} />}
    </div>
  );
};

export default SavedLocationsPage;
