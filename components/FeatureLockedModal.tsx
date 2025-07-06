import React from 'react';
import { XIcon, LockIcon } from './IconComponents';

interface FeatureLockedModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FeatureLockedModal: React.FC<FeatureLockedModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div 
        className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" 
        aria-modal="true" 
        role="dialog"
        onClick={onClose}
    >
      <div 
        className="bg-brand-bg-light w-full max-w-md rounded-2xl border border-brand-border shadow-2xl p-8 relative text-center animate-fade-in"
        onClick={e => e.stopPropagation()}
      >
        <button 
            onClick={onClose} 
            className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors" 
            aria-label="Close modal"
        >
          <XIcon className="w-6 h-6" />
        </button>
        
        <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-red-500/10 mb-4 border-2 border-red-500/30">
            <LockIcon className="w-10 h-10 text-red-500" />
        </div>
        
        <h2 className="text-2xl font-bold mb-3 text-brand-text-primary">Fitur Dalam Pengembangan</h2>
        <p className="text-brand-text-secondary mb-8">
          Fitur ini sedang kami siapkan untuk Anda dan akan segera dirilis. Terima kasih atas kesabaran Anda!
        </p>
        
        <button
          onClick={onClose}
          className="w-full bg-brand-blue hover:bg-brand-blue-dark text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-105"
        >
          Saya Mengerti
        </button>
      </div>
    </div>
  );
};