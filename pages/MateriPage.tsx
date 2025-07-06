import React, { useState } from 'react';
import { PlayCircleIcon, ChevronDownIcon } from '../components/IconComponents';

const mainTutorials = [
  {
    id: 'viueZwO8NKs',
    title: 'Login & Fitur DuniaKreator',
    description: 'Pelajari cara login dan jelajahi semua fitur canggih yang ada di DuniaKreator.'
  },
  {
    id: 'YXTqhY2uFg4',
    title: 'Buat Gemini Pro 1 bulan Gratis',
    description: 'Panduan langkah demi langkah untuk mendapatkan akses Gemini Pro gratis selama satu bulan.'
  },
  {
    id: 'q3S3h8u8y-0',
    title: 'Buat Avatar Unikmu',
    description: 'Tonton cara membuat avatar AI yang unik dan konsisten untuk semua kebutuhan konten Anda.'
  },
  {
    id: 'eQKmVkR7oYA',
    title: 'Buat Naskah/Prompt Mudah',
    description: 'Pelajari cara membuat naskah atau prompt yang efektif untuk hasil AI yang maksimal.'
  },
  {
    id: '8gIUSzE33Mk',
    title: 'Buat Video Di Veo3',
    description: 'Tutorial lengkap cara menggunakan Veo3 untuk mengubah prompt Anda menjadi video berkualitas tinggi.'
  },
  {
    id: '6uFzlY8ujUE',
    title: 'Edit Video Simple',
    description: 'Pelajari dasar-dasar editing video yang simpel untuk menyempurnakan video AI Anda.'
  }
];

const bonusTutorials = [
    {
        id: 'XcJ8YUkmVzA', // Ganti dengan ID video YouTube yang relevan
        title: '1. Trik Buat Veo3 Unlimited',
        description: 'Trik eksklusif untuk memaksimalkan penggunaan Veo3 tanpa batas untuk kreasi video Anda.'
    }
];

interface AccordionVideoItemProps {
    video: typeof mainTutorials[0];
    isOpen: boolean;
    onToggle: () => void;
}

const AccordionVideoItem: React.FC<AccordionVideoItemProps> = ({ video, isOpen, onToggle }) => {
    return (
        <div className="bg-brand-bg-light border border-brand-border rounded-xl shadow-lg overflow-hidden animate-fade-in transition-all duration-300">
            <button
                onClick={onToggle}
                className="w-full flex justify-between items-center text-left p-5 hover:bg-brand-bg-dark/50"
            >
                <h3 className="text-lg font-bold text-brand-text-primary">{video.title}</h3>
                <ChevronDownIcon className={`w-6 h-6 text-brand-text-secondary transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            <div
                className={`transition-all duration-500 ease-in-out overflow-hidden ${isOpen ? 'max-h-[600px]' : 'max-h-0'}`}
            >
                <div className="p-5 pt-0">
                    <p className="text-sm text-brand-text-secondary mb-4">{video.description}</p>
                    <div className="relative" style={{ paddingBottom: '56.25%' }}> {/* 16:9 Aspect Ratio */}
                        {isOpen && ( // Only render iframe when open to save resources
                            <iframe
                                src={`https://www.youtube.com/embed/${video.id}`}
                                title={video.title}
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                className="absolute top-0 left-0 w-full h-full rounded-lg"
                            ></iframe>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const MateriPage: React.FC = () => {
    // All accordions are closed by default
    const [openVideoId, setOpenVideoId] = useState<string | null>(null);

    const handleToggle = (videoId: string) => {
        setOpenVideoId(prevId => (prevId === videoId ? null : videoId));
    };

    return (
        <div className="w-full h-full flex flex-col animate-fade-in">
            <header className="w-full max-w-6xl text-center mb-10 mx-auto">
                <div className="flex items-center justify-center gap-3 mb-2">
                    <PlayCircleIcon className="w-8 h-8 text-indigo-400" />
                    <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500">
                        Pusat Materi & Tutorial
                    </h1>
                </div>
                <p className="text-md sm:text-lg text-brand-text-secondary max-w-3xl mx-auto">
                    Tonton video tutorial kami untuk memaksimalkan penggunaan semua fitur di DuniaKreator.
                </p>
            </header>
            
            <main className="w-full max-w-4xl mx-auto flex-grow space-y-12">
                <div>
                    <h2 className="text-2xl font-bold text-brand-text-primary mb-6">Tutorial Utama</h2>
                    <div className="space-y-4">
                        {mainTutorials.map(video => (
                            <AccordionVideoItem
                                key={video.id}
                                video={video}
                                isOpen={openVideoId === video.id}
                                onToggle={() => handleToggle(video.id)}
                            />
                        ))}
                    </div>
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-brand-text-primary mb-6">Bonus Tutorial</h2>
                    <div className="space-y-4">
                        {bonusTutorials.map(video => (
                           <AccordionVideoItem
                                key={video.id}
                                video={video}
                                isOpen={openVideoId === video.id}
                                onToggle={() => handleToggle(video.id)}
                            />
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default MateriPage;