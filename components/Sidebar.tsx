import React from 'react';
import { SparklesIcon, CogIcon, UserCircleIcon, HomeIcon, FaceSmileIcon, BriefcaseIcon, FilmIcon, BookOpenIcon, MusicIcon, PlayCircleIcon, BookmarkIcon, TagIcon, PackageIcon, HistoryIcon, LockIcon } from './IconComponents';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  isMobileOpen: boolean;
  onMobileClose: () => void;
  onFeatureLockedClick: () => void;
}

const NavItem: React.FC<{
  icon: React.ElementType;
  label: string;
  viewName: string;
  currentPage: string;
  onClick: (view: string) => void;
  isLocked?: boolean;
}> = ({ icon: Icon, label, viewName, currentPage, onClick, isLocked }) => {
  const isActive = currentPage === viewName;

  const handleClick = () => {
    onClick(viewName);
  };

  return (
    <button
      onClick={handleClick}
      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-left transition-colors ${
        isActive
          ? 'bg-brand-blue text-white font-semibold shadow-lg'
          : `text-brand-text-secondary hover:bg-brand-bg-light hover:text-brand-text-primary`
      }`}
    >
      <Icon className="w-5 h-5 flex-shrink-0" />
      <span className="flex-grow">{label}</span>
      {isLocked && <LockIcon className="w-4 h-4 text-yellow-400 flex-shrink-0" />}
    </button>
  );
};

export const Sidebar: React.FC<SidebarProps> = ({ currentPage, onNavigate, isMobileOpen, onMobileClose, onFeatureLockedClick }) => {
  const sidebarContent = (
    <>
      <div className="flex items-center gap-2 px-2 mb-8">
        <SparklesIcon className="w-7 h-7 text-yellow-400" />
        <h1 className="text-xl font-bold text-brand-text-primary">DuniaKreator</h1>
      </div>
      
      <nav className="flex-grow flex flex-col gap-2">
         <NavItem
          icon={HomeIcon}
          label="Beranda"
          viewName="home"
          currentPage={currentPage}
          onClick={onNavigate}
        />
        <NavItem
          icon={PlayCircleIcon}
          label="Materi"
          viewName="materi"
          currentPage={currentPage}
          onClick={onNavigate}
        />
        <NavItem
          icon={FaceSmileIcon}
          label="Buat Aset"
          viewName="buat-avatar"
          currentPage={currentPage}
          onClick={onNavigate}
        />
        <NavItem
          icon={UserCircleIcon}
          label="Buat Iklan Produk"
          viewName="buat-iklan-produk"
          currentPage={currentPage}
          onClick={onNavigate}
        />
         <NavItem
          icon={BriefcaseIcon}
          label="Iklan Jasa & Digital"
          viewName="iklan-jasa-digital"
          currentPage={currentPage}
          onClick={onNavigate}
        />
        <NavItem
          icon={TagIcon}
          label="Generator SEO"
          viewName="seo-generator"
          currentPage={currentPage}
          onClick={onNavigate}
        />
        <NavItem
          icon={FilmIcon}
          label="Buat Konten Viral"
          viewName="buat-konten-viral"
          currentPage={currentPage}
          onClick={onFeatureLockedClick}
          isLocked
        />
        <NavItem
          icon={BookOpenIcon}
          label="Buat Ebook"
          viewName="buat-ebook"
          currentPage={currentPage}
          onClick={onNavigate}
        />
        <NavItem
          icon={MusicIcon}
          label="Buat Lagu"
          viewName="buat-lagu"
          currentPage={currentPage}
          onClick={onNavigate}
        />
        <NavItem
          icon={PackageIcon}
          label="Aset Tersimpan"
          viewName="saved-assets"
          currentPage={currentPage}
          onClick={onNavigate}
        />
        <NavItem
          icon={HistoryIcon}
          label="Riwayat Prompt"
          viewName="prompt-history"
          currentPage={currentPage}
          onClick={onNavigate}
        />
      </nav>

      <div className="mt-auto">
        <NavItem
          icon={CogIcon}
          label="Pengaturan"
          viewName="pengaturan"
          currentPage={currentPage}
          onClick={onNavigate}
        />
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Sidebar (off-canvas) */}
      <div className={`fixed inset-0 z-40 lg:hidden transition-opacity duration-300 ${isMobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="fixed inset-0 bg-black/60" onClick={onMobileClose}></div>
        <div className={`relative w-64 bg-brand-bg-light border-r border-brand-border flex flex-col p-4 h-full transform transition-transform duration-300 ease-in-out ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          {sidebarContent}
        </div>
      </div>

      {/* Desktop Sidebar (static) */}
      <div className="w-64 bg-brand-bg-light border-r border-brand-border flex-col p-4 flex-shrink-0 h-screen sticky top-0 hidden lg:flex">
        {sidebarContent}
      </div>
    </>
  );
};