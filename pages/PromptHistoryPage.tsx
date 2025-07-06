import React, { useState, useEffect, useCallback } from 'react';
import { getVideoPromptHistory, deleteVideoPromptHistoryItem, VideoPromptHistoryItem, MAX_PROMPT_HISTORY } from '../utils/historyStorage';
import { SceneAccordion } from '../components/SceneAccordion';
import { HistoryIcon, TrashIcon, ChevronDownIcon } from '../components/IconComponents';

const PromptHistoryItem: React.FC<{
    item: VideoPromptHistoryItem;
    onDelete: (id: string) => void;
}> = ({ item, onDelete }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [script, setScript] = useState(item.script);

    const handleToggle = () => setIsOpen(!isOpen);

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (window.confirm(`Apakah Anda yakin ingin menghapus riwayat "${item.title}"?`)) {
            onDelete(item.id);
        }
    };
    
    const handleDialogueChange = (newPrompt: string, index: number) => {
        const updatedScript = [...script];
        updatedScript[index] = newPrompt;
        setScript(updatedScript);
    };

    return (
        <div className="bg-brand-bg-light border border-brand-border rounded-xl shadow-lg overflow-hidden animate-fade-in transition-all duration-300">
            <div
                onClick={handleToggle}
                className="w-full flex justify-between items-center text-left p-5 cursor-pointer hover:bg-brand-bg-dark/50"
            >
                <div className="flex-grow min-w-0">
                    <p className="text-lg font-bold text-brand-text-primary truncate" title={item.title}>{item.title}</p>
                    <p className="text-xs text-brand-text-secondary mt-1">
                        {new Date(item.createdAt).toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' })}
                    </p>
                </div>
                <div className="flex items-center flex-shrink-0 ml-4">
                     <button
                        onClick={handleDelete}
                        className="text-red-500/70 hover:text-red-500 p-2 rounded-full transition-colors mr-2"
                        aria-label="Hapus riwayat"
                     >
                        <TrashIcon className="w-5 h-5" />
                    </button>
                    <ChevronDownIcon className={`w-6 h-6 text-brand-text-secondary transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                </div>
            </div>
            <div
                className={`transition-all duration-500 ease-in-out overflow-hidden ${isOpen ? 'max-h-[5000px]' : 'max-h-0'}`}
            >
                <div className="p-5 pt-0 space-y-3">
                    {script.map((scenePrompt, index) => (
                         <SceneAccordion 
                            key={index}
                            index={index}
                            scenePrompt={scenePrompt}
                            isOpen={true} // In this context, they are always open when parent is open
                            onToggle={() => {}} // No independent toggle
                            onDialogueChange={(newPrompt) => handleDialogueChange(newPrompt, index)}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

const PromptHistoryPage: React.FC = () => {
  const [history, setHistory] = useState<VideoPromptHistoryItem[]>([]);

  useEffect(() => {
    setHistory(getVideoPromptHistory());
  }, []);

  const handleDelete = useCallback((id: string) => {
    deleteVideoPromptHistoryItem(id);
    setHistory(currentHistory => currentHistory.filter(item => item.id !== id));
  }, []);

  return (
    <div className="w-full h-full flex flex-col animate-fade-in">
      <header className="w-full max-w-6xl text-center mb-10 mx-auto">
        <div className="flex items-center justify-center gap-3 mb-2">
            <HistoryIcon className="w-8 h-8 text-purple-400" />
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
                Riwayat Prompt Video
            </h1>
        </div>
        <p className="text-md sm:text-lg text-brand-text-secondary max-w-3xl mx-auto">
            Lihat kembali {MAX_PROMPT_HISTORY} skrip video terakhir yang Anda buat. Riwayat terlama akan otomatis terhapus jika sudah penuh.
        </p>
      </header>
      
      <main className="w-full max-w-4xl mx-auto flex-grow">
        {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center text-brand-text-secondary mt-16">
                <HistoryIcon className="w-24 h-24 mb-6 opacity-30"/>
                <h2 className="text-2xl font-bold text-brand-text-primary mb-2">Belum Ada Riwayat</h2>
                <p className="mt-2 max-w-md">
                   Setiap kali Anda membuat prompt video dari halaman 'Iklan Produk', 'Iklan Jasa', atau 'Konten Viral', hasilnya akan tersimpan di sini secara otomatis.
                </p>
            </div>
        ) : (
            <div className="space-y-4">
                {history.map(item => (
                    <PromptHistoryItem 
                        key={item.id}
                        item={item}
                        onDelete={handleDelete}
                    />
                ))}
            </div>
        )}
      </main>
    </div>
  );
};

export default PromptHistoryPage;
