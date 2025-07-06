import React from 'react';
import { ImageIcon } from './IconComponents';

interface GeneratedImageViewerProps {
  imageUrl: string | null;
  isLoading: boolean;
  loadingStep: string;
}

const LoadingSpinner: React.FC = () => (
    <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-brand-blue"></div>
);

export const GeneratedImageViewer: React.FC<GeneratedImageViewerProps> = ({ imageUrl, isLoading, loadingStep }) => {
  if (isLoading) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center text-center gap-4 text-brand-text-secondary">
        <LoadingSpinner />
        <p className="font-semibold text-lg text-brand-text-primary">Menghasilkan gambar Anda...</p>
        <p className="text-sm">{loadingStep}</p>
      </div>
    );
  }

  if (imageUrl) {
    return (
      <div className="w-full flex-grow flex items-center justify-center min-h-[300px]">
        <img src={imageUrl} alt="Generated AI model" className="max-h-full max-w-full object-contain rounded-lg shadow-2xl"/>
      </div>
    );
  }

  return (
    <div className="flex-grow flex flex-col items-center justify-center text-center text-brand-text-secondary">
      <ImageIcon className="w-24 h-24 mb-4 opacity-50"/>
      <h3 className="text-xl font-semibold text-brand-text-primary">Model yang Anda hasilkan akan muncul di sini</h3>
      <p className="mt-2 max-w-xs">Unggah gambar produk dan klik "Hasilkan" untuk melihat keajaibannya.</p>
    </div>
  );
};