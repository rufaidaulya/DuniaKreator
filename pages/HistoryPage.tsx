import React, { useState, useEffect, useCallback } from 'react';
import { getSavedAvatars, deleteAvatar, SavedAvatar, MAX_AVATARS } from '../utils/localStorage';
import { TrashIcon, ClipboardIcon, BookmarkIcon, XIcon } from '../components/IconComponents';

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

const SavedAvatarsPage: React.FC = () => {
  const [savedAvatars, setSavedAvatars] = useState<SavedAvatar[]>([]);
  const [previewAvatar, setPreviewAvatar] = useState<SavedAvatar | null>(null);

  useEffect(() => {
      setSavedAvatars(getSavedAvatars());
  }, []);

  const handleDeleteAvatar = useCallback((e: React.MouseEvent, avatarId: string) => {
      e.stopPropagation();
      if (window.confirm("Apakah Anda yakin ingin menghapus avatar ini?")) {
        deleteAvatar(avatarId);
        setSavedAvatars(currentAvatars => currentAvatars.filter(avatar => avatar.id !== avatarId));
      }
  }, []);
  
  return (
    <div className="w-full h-full flex flex-col animate-fade-in">
      <header className="w-full max-w-6xl text-center mb-10 mx-auto">
        <div className="flex items-center justify-center gap-3 mb-2">
            <BookmarkIcon className="w-8 h-8 text-cyan-400" />
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                Avatar Tersimpan ({savedAvatars.length}/{MAX_AVATARS})
            </h1>
        </div>
        <p className="text-md sm:text-lg text-brand-text-secondary max-w-3xl mx-auto">
            Kelola dan lihat koleksi avatar yang telah Anda buat dan simpan. Batas maksimal adalah {MAX_AVATARS} avatar.
        </p>
      </header>

      <main className="w-full max-w-7xl mx-auto flex-grow">
        {savedAvatars.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center text-brand-text-secondary mt-16">
                <BookmarkIcon className="w-24 h-24 mb-6 opacity-30"/>
                <h2 className="text-2xl font-bold text-brand-text-primary mb-2">Belum Ada Avatar yang Disimpan</h2>
                <p className="mt-2 max-w-md">
                    Pergi ke halaman "Buat Avatar" untuk membuat dan menyimpan karakter pertama Anda. Mereka akan muncul di sini setelah disimpan.
                </p>
            </div>
        ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-4">
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
        )}
      </main>
      {previewAvatar && <AvatarPreviewModal avatar={previewAvatar} onClose={() => setPreviewAvatar(null)} />}
    </div>
  );
};

export default SavedAvatarsPage;