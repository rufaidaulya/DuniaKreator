import React, { useState } from 'react';
import { ClipboardIcon, ChevronDownIcon } from './IconComponents';

interface DetailsAccordionProps {
  title: string;
  prompt: string | null;
}

export const AvatarDetailsViewer: React.FC<DetailsAccordionProps> = ({ title, prompt }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!prompt) return;
    navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!prompt) {
    return null;
  }

  return (
    <div className="w-full bg-brand-bg-dark border border-brand-border rounded-lg">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center p-4 text-left"
      >
        <h4 className="text-lg font-semibold text-brand-text-primary">{title}</h4>
        <ChevronDownIcon className={`w-5 h-5 text-brand-text-secondary transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="px-4 pb-4 animate-fade-in">
          <div className="flex justify-end mb-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 text-sm bg-brand-border hover:bg-gray-600 text-brand-text-secondary font-semibold py-1.5 px-3 rounded-md transition-colors"
            >
              <ClipboardIcon className="w-4 h-4" />
              {copied ? 'Tersalin!' : 'Salin Detail'}
            </button>
          </div>
          <p className="text-sm text-brand-text-primary bg-brand-bg-light p-3 rounded-md whitespace-pre-wrap break-words font-mono">
            {prompt}
          </p>
        </div>
      )}
    </div>
  );
};