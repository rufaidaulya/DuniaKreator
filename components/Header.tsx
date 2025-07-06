import React from 'react';
import { MenuIcon, SparklesIcon, HistoryIcon } from './IconComponents';

interface HeaderProps {
    onMenuClick: () => void;
    onHistoryClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick, onHistoryClick }) => {
    return (
        <header className="lg:hidden sticky top-0 z-20 bg-brand-bg-light/80 backdrop-blur-sm border-b border-brand-border p-4 flex items-center justify-between">
            {/* Menu Button on the left */}
            <button onClick={onMenuClick} className="p-1 text-brand-text-secondary hover:text-brand-text-primary w-8">
                <MenuIcon className="w-6 h-6" />
            </button>
            
            {/* Centered Title */}
            <div className="flex-grow flex justify-center items-center gap-2">
                <SparklesIcon className="w-6 h-6 text-yellow-400" />
                <h1 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
                  DuniaKreator
                </h1>
            </div>

            {/* Prompt History Button on the right */}
            <button onClick={onHistoryClick} className="p-1 text-brand-text-secondary hover:text-brand-text-primary w-8" aria-label="Riwayat Prompt">
                <HistoryIcon className="w-6 h-6" />
            </button>
        </header>
    );
};