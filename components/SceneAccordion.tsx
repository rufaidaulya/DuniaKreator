
import React, { useState } from 'react';
import { ClipboardIcon, ChevronDownIcon, ArrowUpIcon, ArrowDownIcon } from './IconComponents';
import { SavedAvatar } from '../utils/localStorage';

interface SceneAccordionProps {
    scenePrompt: string;
    index: number;
    isOpen: boolean;
    onToggle: () => void;
    onDialogueChange: (newPrompt: string) => void;
    isReorderable?: boolean;
    onReorder?: (index: number, direction: 'up' | 'down') => void;
    isFirst?: boolean;
    isLast?: boolean;
    characters?: SavedAvatar[]; // Kept for prop compatibility, but not used in logic
}

export const SceneAccordion: React.FC<SceneAccordionProps> = ({
    scenePrompt,
    index,
    isOpen,
    onToggle,
    onDialogueChange,
    isReorderable,
    onReorder,
    isFirst,
    isLast,
}) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = (e: React.MouseEvent) => {
        e.stopPropagation();
        navigator.clipboard.writeText(scenePrompt);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleReorderClick = (e: React.MouseEvent, direction: 'up' | 'down') => {
        e.stopPropagation();
        onReorder?.(index, direction);
    };
    
    const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        onDialogueChange(e.target.value);
    };

    return (
        <div className="bg-brand-bg-dark rounded-lg border border-brand-border overflow-hidden">
            <button
                onClick={onToggle}
                className="w-full flex justify-between items-center p-4 text-left"
            >
                <div className="flex items-center gap-3">
                   {isReorderable && (
                        <div className="flex flex-col gap-1">
                            <button
                                onClick={(e) => handleReorderClick(e, 'up')}
                                disabled={isFirst}
                                className="text-brand-text-secondary hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                                aria-label="Pindah ke atas"
                            >
                                <ArrowUpIcon className="w-5 h-5" />
                            </button>
                            <button
                                onClick={(e) => handleReorderClick(e, 'down')}
                                disabled={isLast}
                                className="text-brand-text-secondary hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                                aria-label="Pindah ke bawah"
                            >
                                <ArrowDownIcon className="w-5 h-5" />
                            </button>
                        </div>
                    )}
                    <h3 className="font-bold text-lg text-brand-blue">Adegan {index + 1}</h3>
                </div>
                <div className='flex items-center gap-4'>
                     <button
                        onClick={handleCopy}
                        className="flex items-center gap-2 text-sm bg-brand-border hover:bg-gray-600 text-brand-text-secondary font-semibold py-1.5 px-3 rounded-md transition-colors z-10"
                    >
                        <ClipboardIcon className="w-4 h-4" />
                        {copied ? 'Tersalin!' : 'Salin Adegan'}
                    </button>
                    <ChevronDownIcon className={`w-6 h-6 text-brand-text-secondary transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                </div>
            </button>
            <div className={`transition-all duration-500 ease-in-out ${isOpen ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="p-4 pt-0">
                    <div className="space-y-3">
                        <div>
                            <label className="text-xs font-bold text-brand-text-secondary">PROMPT ADEGAN LENGKAP (Bisa Diedit)</label>
                            <textarea
                                value={scenePrompt}
                                onChange={handlePromptChange}
                                onClick={(e) => e.stopPropagation()}
                                className="w-full mt-1 bg-black/40 border border-brand-blue/50 rounded-md p-3 text-sm text-yellow-300 focus:ring-2 focus:ring-brand-blue outline-none transition resize-y font-mono"
                                rows={15}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
