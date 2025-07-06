import React, { useState, useCallback, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import HomePage from './pages/HomePage';
import IklanProdukPage from './pages/ContentCreatorPage';
import { AssetCreatorPage } from './pages/AssetCreatorPage';
import VideoPromptCreatorPage from './pages/VideoPromptCreatorPage';
import ServiceAdsCreatorPage from './pages/ServiceAdsCreatorPage';
import ViralContentCreatorPage from './pages/ViralContentCreatorPage';
import EbookCreatorPage from './pages/EbookCreatorPage';
import SongCreatorPage from './pages/SongCreatorPage';
import SettingsPage from './pages/SettingsPage';
import MateriPage from './pages/MateriPage';
import SeoGeneratorPage from './pages/SeoGeneratorPage';
import SavedAssetsPage from './pages/SavedAssetsPage';
import PromptHistoryPage from './pages/PromptHistoryPage';
import { BottomNavBar } from './components/BottomNavBar';
import { FeatureLockedModal } from './components/FeatureLockedModal';

export interface VideoContext {
  productDescription: string;
  sceneDescription: string; 
  avatarName: string;
  videoStyle: string;
  avatarPrompt?: string;
  // Style-specific details
  tvName?: string;
  newsLocation?: string;
  koreaLocation?: string;
  majapahitLocation?: string;
  scifiLocation?: string;
}

function App() {
  const [activePage, setActivePage] = useState('home');
  const [isMobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [videoContext, setVideoContext] = useState<VideoContext | null>(null);
  const [isFeatureLockedModalOpen, setFeatureLockedModalOpen] = useState(false);


  const handleNavigate = (page: string) => {
    setActivePage(page);
    setMobileSidebarOpen(false);
    window.scrollTo(0, 0);
  };

  const handleNavigateToVideoCreator = (context: VideoContext) => {
    setVideoContext(context);
    handleNavigate('buat-prompt-video');
  };

  const handleFeatureLockedClick = () => {
    setFeatureLockedModalOpen(true);
  };

  const renderCurrentPage = () => {
    switch (activePage) {
      case 'home':
        return <HomePage onNavigate={handleNavigate} onFeatureLockedClick={handleFeatureLockedClick} />;
      case 'materi':
        return <MateriPage />;
      case 'buat-avatar':
        return <AssetCreatorPage onNavigate={handleNavigate} />;
      case 'buat-konten-viral':
        // This page is now locked, but we keep the route for potential direct access or future unlocking
        return <ViralContentCreatorPage onNavigate={handleNavigate} />;
      case 'buat-iklan-produk':
        return <IklanProdukPage 
                  onProceedToVideo={handleNavigateToVideoCreator}
                  onNavigate={handleNavigate}
                />;
       case 'iklan-jasa-digital':
        return <ServiceAdsCreatorPage
                  onProceedToVideo={handleNavigateToVideoCreator}
                  onNavigate={handleNavigate}
               />;
      case 'prompt-history':
        return <PromptHistoryPage />;
      case 'saved-assets':
        return <SavedAssetsPage />;
      case 'buat-prompt-video':
        return <VideoPromptCreatorPage 
                  context={videoContext} 
                  onNavigateBack={() => handleNavigate('buat-iklan-produk')}
                />;
      case 'buat-ebook':
        return <EbookCreatorPage onNavigate={handleNavigate} />;
      case 'buat-lagu':
        return <SongCreatorPage onNavigate={handleNavigate} />;
      case 'seo-generator':
        return <SeoGeneratorPage onNavigate={handleNavigate} />;
      case 'pengaturan':
        return <SettingsPage />;
      default:
        return <HomePage onNavigate={handleNavigate} onFeatureLockedClick={handleFeatureLockedClick}/>;
    }
  };
  
  return (
    <>
      <div className="min-h-screen bg-brand-bg-dark text-brand-text-primary font-sans flex">
        <Sidebar 
          currentPage={activePage}
          onNavigate={handleNavigate}
          isMobileOpen={isMobileSidebarOpen}
          onMobileClose={() => setMobileSidebarOpen(false)}
          onFeatureLockedClick={handleFeatureLockedClick}
        />
        
        <div className="flex-1 flex flex-col min-w-0">
          <Header onMenuClick={() => setMobileSidebarOpen(true)} onHistoryClick={() => handleNavigate('prompt-history')} />
          <main className="flex-grow p-4 sm:p-6 md:p-8 overflow-y-auto lg:pb-8 pb-20">
            {renderCurrentPage()}
          </main>
        </div>
      </div>
      <BottomNavBar currentPage={activePage} onNavigate={handleNavigate} />
      <FeatureLockedModal 
        isOpen={isFeatureLockedModalOpen} 
        onClose={() => setFeatureLockedModalOpen(false)} 
      />
    </>
  );
}

export default App;