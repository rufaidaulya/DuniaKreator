import React, { useCallback, useRef, useState } from 'react';
import { UploadIcon } from './IconComponents';

interface ImageUploaderProps {
  onFileSelect: (file: File | null) => void;
  previewUrl: string | null;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ onFileSelect, previewUrl }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      onFileSelect(files[0]);
    }
  }, [onFileSelect]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onFileSelect(files[0]);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
      className={`relative w-full h-64 border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-center p-4 cursor-pointer transition-all duration-300 ${
        isDragging ? 'border-brand-blue bg-blue-900/20' : 'border-brand-border hover:border-brand-blue'
      }`}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/png, image/jpeg, image/webp"
      />
      {previewUrl ? (
        <img src={previewUrl} alt="Product Preview" className="max-h-full max-w-full object-contain rounded-md" />
      ) : (
        <div className="flex flex-col items-center text-brand-text-secondary">
          <UploadIcon className="w-12 h-12 mb-2" />
          <p className="font-semibold">Seret & Lepas atau Klik untuk Mengunggah</p>
          <p className="text-sm">PNG, JPG, atau WEBP</p>
        </div>
      )}
    </div>
  );
};