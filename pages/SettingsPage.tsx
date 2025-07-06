

import React, { useState, useEffect } from 'react';
import { ALL_SERVERS, ServerId } from '../backend/api';
import { CogIcon, CheckCircleIcon } from '../components/IconComponents';

const SettingsPage: React.FC = () => {
  const [selectedServer, setSelectedServer] = useState<ServerId | null>(null);

  useEffect(() => {
    const currentServer = localStorage.getItem('selectedServer') as ServerId | null;
    setSelectedServer(currentServer || 'server1');
  }, []);

  const handleSelectServer = (serverId: ServerId) => {
    setSelectedServer(serverId);
    localStorage.setItem('selectedServer', serverId);
  };
  
  const serverName = (id: ServerId) => {
      return `Server ${id.replace('server', '')}`;
  }
  
  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col animate-fade-in p-4">
      <header className="w-full text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-2">
          <CogIcon className="w-8 h-8 text-gray-400" />
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-gray-300 to-gray-500">
            Pengaturan
          </h1>
        </div>
        <p className="text-md sm:text-lg text-brand-text-secondary max-w-3xl mx-auto">
          Kelola kunci API Anda dan konfigurasikan preferensi aplikasi di sini.
        </p>
      </header>

      <main className="space-y-12">
        {/* Image Generation Server Section */}
        <section className="bg-brand-bg-light p-6 rounded-2xl border border-brand-border shadow-lg">
          <h2 className="text-2xl font-bold text-brand-text-primary mb-2">Pengaturan Server AI</h2>
          <p className="text-brand-text-secondary mb-6">
            Pilih server yang ingin Anda gunakan untuk semua fitur AI. Jika satu server sibuk atau lambat, coba pilih yang lain untuk hasil terbaik.
          </p>

          <div className="space-y-4">
            {ALL_SERVERS.map((serverId) => {
              const isSelected = selectedServer === serverId;
              return (
                <button
                  key={serverId}
                  onClick={() => handleSelectServer(serverId)}
                  className={`w-full text-left p-4 border-2 rounded-xl transition-all duration-300 flex items-center gap-4 ${
                      isSelected ? 'border-brand-blue bg-blue-900/40 shadow-md' : 'border-brand-border bg-brand-bg-dark hover:border-gray-600'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center border-2 ${isSelected ? 'bg-brand-blue border-brand-blue' : 'border-gray-500'}`}>
                      {isSelected && <div className="w-3 h-3 bg-white rounded-full"></div>}
                  </div>
                  <div className="flex-grow">
                      <h3 className={`font-bold text-lg ${isSelected ? 'text-brand-blue' : 'text-brand-text-primary'}`}>
                          {serverName(serverId)}
                      </h3>
                      <p className="text-sm text-brand-text-secondary">
                          {isSelected ? 'Terpilih saat ini' : 'Tersedia untuk dipilih'}
                      </p>
                  </div>
                   {isSelected && <CheckCircleIcon className="w-8 h-8 text-green-400 flex-shrink-0" />}
                </button>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
};

export default SettingsPage;