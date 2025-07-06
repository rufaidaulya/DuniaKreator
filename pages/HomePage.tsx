import React from 'react';
import { SparklesIcon, FaceSmileIcon, UserCircleIcon, BookmarkIcon, BriefcaseIcon, FilmIcon, BookOpenIcon, MusicIcon, PlayCircleIcon, TagIcon, PackageIcon, HistoryIcon, LockIcon } from '../components/IconComponents';

interface HomePageProps {
  onNavigate: (page: string) => void;
  onFeatureLockedClick: () => void;
}

const NavCard: React.FC<{ 
    title: string; 
    description: string; 
    icon: React.ElementType;
    pageName: string; 
    onClick: () => void;
    colorClass: string;
    isLocked?: boolean;
}> = ({ title, description, icon: Icon, pageName, onClick, colorClass, isLocked }) => {
    const handleClick = () => {
        onClick();
    };

    return (
    <button 
        onClick={handleClick}
        className={`bg-brand-bg-light p-5 rounded-xl border border-brand-border transform transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-brand-blue/20 hover:border-brand-blue/50 animate-fade-in text-left flex flex-col`}
    >
        <div className="flex items-center mb-3">
            <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${colorClass} text-white mr-4`}>
                <Icon className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-brand-text-primary flex-grow">{title}</h3>
            {isLocked && <LockIcon className="w-5 h-5 text-yellow-400 flex-shrink-0" />}
        </div>
        <p className="text-brand-text-secondary text-sm flex-grow">{description}</p>
    </button>
    );
};

const StepCard: React.FC<{
    step: number;
    title: string;
    description: string;
}> = ({ step, title, description }) => {
    return (
        <div className="bg-brand-bg-light p-5 rounded-xl border border-brand-border flex items-start gap-4 transform transition-all duration-300 hover:border-brand-blue/50">
            <div className="flex-shrink-0 text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-blue-400 to-purple-500">
                {step}
            </div>
            <div>
                <h3 className="font-bold text-brand-text-primary">{title}</h3>
                <p className="text-sm text-brand-text-secondary mt-1">{description}</p>
            </div>
        </div>
    );
}


const HomePage: React.FC<HomePageProps> = ({ onNavigate, onFeatureLockedClick }) => {
  return (
    <div className="w-full h-full flex flex-col justify-center animate-fade-in">
        <div className="text-center max-w-6xl mx-auto">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-brand-text-primary mb-4">
                Selamat Datang di <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">DuniaKreator</span>
            </h1>
            <p className="text-lg sm:text-xl text-brand-text-secondary max-w-3xl mx-auto mb-10">
                Platform lengkap untuk membuat avatar konsisten, iklan, skrip video, Ebook, dan lagu dalam hitungan menit.
            </p>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-12 text-left">
                <NavCard pageName="materi" title="Materi & Tutorial" description="Tonton video panduan untuk memaksimalkan fitur AI." icon={PlayCircleIcon} onClick={() => onNavigate('materi')} colorClass="bg-indigo-500" />
                <NavCard pageName="buat-avatar" title="Buat Aset" description="Ciptakan avatar, produk, dan lokasi dari teks atau foto." icon={FaceSmileIcon} onClick={() => onNavigate('buat-avatar')} colorClass="bg-yellow-500" />
                <NavCard pageName="buat-iklan-produk" title="Iklan Produk" description="Gabungkan avatar dengan produk untuk membuat foto model." icon={UserCircleIcon} onClick={() => onNavigate('buat-iklan-produk')} colorClass="bg-blue-500" />
                <NavCard pageName="iklan-jasa-digital" title="Iklan Jasa" description="Buat visual promosi untuk layanan atau produk digital Anda." icon={BriefcaseIcon} onClick={() => onNavigate('iklan-jasa-digital')} colorClass="bg-teal-500" />
                <NavCard pageName="seo-generator" title="Generator SEO" description="Buat deskripsi & tagar SEO untuk konten Anda secara otomatis." icon={TagIcon} onClick={() => onNavigate('seo-generator')} colorClass="bg-green-500" />
                <NavCard pageName="buat-konten-viral" title="Konten Viral" description="Ubah ide cerita menjadi skrip video sinematik berkualitas." icon={FilmIcon} onClick={onFeatureLockedClick} colorClass="bg-purple-500" isLocked />
                <NavCard pageName="buat-ebook" title="Buat Ebook" description="Ubah ide Anda menjadi naskah Ebook lengkap dengan sampul." icon={BookOpenIcon} onClick={() => onNavigate('buat-ebook')} colorClass="bg-orange-500" />
                <NavCard pageName="buat-lagu" title="Buat Lagu" description="Tulis lirik lagu orisinal lengkap dengan sampulnya." icon={MusicIcon} onClick={() => onNavigate('buat-lagu')} colorClass="bg-red-500" />
                <NavCard pageName="saved-assets" title="Aset Tersimpan" description="Kelola koleksi Avatar, Produk, dan Lokasi yang tersimpan." icon={PackageIcon} onClick={() => onNavigate('saved-assets')} colorClass="bg-lime-500" />
                <NavCard pageName="prompt-history" title="Riwayat Prompt" description="Lihat kembali skrip video yang pernah Anda buat." icon={HistoryIcon} onClick={() => onNavigate('prompt-history')} colorClass="bg-pink-500" />
            </div>
            
            <div className="mt-12 text-center">
                <h2 className="text-3xl font-bold text-brand-text-primary mb-8">4 Step Mudah Buat Konten</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left max-w-5xl mx-auto">
                   <StepCard
                        step={1}
                        title="Buat Aset Anda"
                        description="Ciptakan Avatar, Produk, dan Lokasi yang konsisten."
                    />
                    <StepCard
                        step={2}
                        title="Rakit & Buat Naskah"
                        description="Gabungkan aset Anda dan buat skrip video atau iklan."
                    />
                     <StepCard
                        step={3}
                        title="Copy Paste ke AI Video"
                        description="Gunakan naskah untuk menghasilkan video AI yang memukau."
                    />
                     <StepCard
                        step={4}
                        title="Edit Tipis & Posting"
                        description="Sempurnakan video Anda lalu bagikan ke media sosial."
                    />
                </div>
            </div>
        </div>
    </div>
  );
};

export default HomePage;