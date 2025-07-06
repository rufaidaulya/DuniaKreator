import React, { useState } from 'react';
import { XIcon, ClipboardIcon } from './IconComponents';

export interface HistoryPrompt {
    title: string;
    prompt: string;
}

interface ResultPreviewModalProps {
    imageUrl: string;
    prompts: HistoryPrompt[];
    onClose: () => void;
}

export const ResultPreviewModal: React.FC<ResultPreviewModalProps> = ({ imageUrl, prompts, onClose }) => {
    const [copiedStates, setCopiedStates] = useState<boolean[]>(new Array(prompts.length).fill(false));

    const handleCopy = (text: string, index: number) => {
        navigator.clipboard.writeText(text);
        const newCopiedStates = [...copiedStates];
        newCopiedStates[index] = true;
        setCopiedStates(newCopiedStates);
        setTimeout(() => {
            const resetStates = [...newCopiedStates];
            resetStates[index] = false;
            setCopiedStates(resetStates);
        }, 2000);
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-brand-bg-light w-full max-w-4xl rounded-2xl border border-brand-border shadow-2xl flex flex-col md:flex-row animate-fade-in max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <div className="w-full md:w-1/2 flex items-center justify-center p-4 bg-brand-bg-dark rounded-t-2xl md:rounded-l-2xl md:rounded-tr-none">
                   <img src={imageUrl} alt="Generated result" className="w-full h-auto max-h-full object-contain rounded-lg" />
                </div>
                <div className="p-6 flex flex-col flex-grow overflow-y-auto w-full md:w-1/2">
                    <div className="flex justify-between items-start mb-4">
                        <h2 className="text-2xl font-bold text-brand-text-primary">Detail Hasil</h2>
                        <button onClick={onClose} className="text-brand-text-secondary hover:text-white transition-colors">
                            <XIcon className="w-6 h-6"/>
                        </button>
                    </div>
                    <div className="space-y-3">
                        {prompts.filter(p => p.prompt && p.prompt.trim() !== '').map((p, index) => (
                             <div key={index} className="bg-brand-bg-dark p-3 rounded-lg">
                                <div className="flex justify-between items-center mb-1">
                                    <h4 className="text-sm font-bold text-brand-text-secondary">{p.title}</h4>
                                    <button onClick={() => handleCopy(p.prompt, index)} className="text-xs text-brand-text-secondary hover:text-white flex items-center gap-1">
                                        <ClipboardIcon className="w-3 h-3"/> {copiedStates[index] ? 'Tersalin' : 'Salin'}
                                    </button>
                                </div>
                                <p className="text-sm text-brand-text-primary/80 font-mono whitespace-pre-wrap break-words">{p.prompt || 'Tidak ada input'}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}