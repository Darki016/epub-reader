'use client';

import { useEffect, useState } from 'react';
import { useUIStore } from '@/store/useUIStore';
import { fetchDefinition, DictionaryResult } from '@/lib/dictionary';
import { X, Volume2, BookOpen, ExternalLink, ThumbsUp, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const DefinitionModal = () => {
    const { definitionModal, closeDefinition } = useUIStore();
    const { isOpen, word, position } = definitionModal;

    const [data, setData] = useState<DictionaryResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'standard' | 'urban'>('standard');

    useEffect(() => {
        if (isOpen && word) {
            setLoading(true);
            setData(null);
            fetchDefinition(word).then(result => {
                setData(result);
                // Default to standard if available, else urban
                if (result && !result.meanings.length && result.urbanDefinitions?.length) {
                    setActiveTab('urban');
                } else {
                    setActiveTab('standard');
                }
            }).finally(() => setLoading(false));
        }
    }, [isOpen, word]);

    if (!isOpen) return null;

    // Calculate position to keep it on screen
    // Simple logic: default to right of selection, flip if too close to edge
    // Ideally we would use a library like floating-ui, but custom logic works for now.
    const modalStyle = {
        top: Math.min(Math.max(position.y + 20, 20), window.innerHeight - 400),
        left: Math.min(Math.max(position.x, 20), window.innerWidth - 320)
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop - clicking closes */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-40"
                        onClick={closeDefinition}
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="fixed z-50 w-80 max-h-[400px] flex flex-col bg-background/90 backdrop-blur-xl border border-border rounded-xl shadow-2xl overflow-hidden"
                        style={{ top: modalStyle.top, left: modalStyle.left }}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-border/50 bg-secondary/30">
                            <div className="flex items-center gap-2">
                                <h3 className="font-serif font-bold text-xl capitalize">{word}</h3>
                                {data?.phonetic && <span className="text-muted-foreground text-sm font-mono">{data.phonetic}</span>}
                            </div>
                            <div className="flex items-center gap-1">
                                {data?.audio && (
                                    <button
                                        onClick={() => new Audio(data.audio).play()}
                                        className="p-1.5 rounded-full hover:bg-background text-primary transition-colors"
                                    >
                                        <Volume2 className="w-4 h-4" />
                                    </button>
                                )}
                                <button
                                    onClick={closeDefinition}
                                    className="p-1.5 rounded-full hover:bg-destructive/10 hover:text-destructive transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar min-h-[150px]">
                            {loading ? (
                                <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground">
                                    <Loader2 className="w-6 h-6 animate-spin text-foreground" />
                                    <span className="text-xs">Searching...</span>
                                </div>
                            ) : !data ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <p>No definitions found.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {/* Tabs */}
                                    {(data.meanings.length > 0 && data.urbanDefinitions?.length) ? (
                                        <div className="flex gap-2 border-b border-border/50 pb-2">
                                            <button
                                                onClick={() => setActiveTab('standard')}
                                                className={`text-xs font-medium px-3 py-1.5 rounded-md transition-colors ${activeTab === 'standard' ? 'bg-foreground/10 text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
                                            >
                                                Dictionary
                                            </button>
                                            <button
                                                onClick={() => setActiveTab('urban')}
                                                className={`text-xs font-medium px-3 py-1.5 rounded-md transition-colors ${activeTab === 'urban' ? 'bg-foreground/10 text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
                                            >
                                                Urban / Slang
                                            </button>
                                        </div>
                                    ) : null}

                                    {/* Standard Definitions */}
                                    {activeTab === 'standard' && data.meanings.map((meaning, i) => (
                                        <div key={i} className="space-y-2">
                                            <span className="inline-block text-[10px] font-bold text-foreground/80 uppercase tracking-widest bg-foreground/5 px-2 py-1 rounded border border-border/50">
                                                {meaning.partOfSpeech}
                                            </span>
                                            <ul className="space-y-3 mt-1">
                                                {meaning.definitions.slice(0, 3).map((def, j) => (
                                                    <li key={j} className="text-sm leading-relaxed text-foreground/90">
                                                        <p>{def.definition}</p>
                                                        {def.example && (
                                                            <p className="text-xs text-muted-foreground mt-1 italic pl-2 border-l-2 border-foreground/20">
                                                                "{def.example}"
                                                            </p>
                                                        )}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    ))}

                                    {/* Urban Definitions */}
                                    {activeTab === 'urban' && data.urbanDefinitions?.map((def, i) => (
                                        <div key={i} className="space-y-2 pb-4 border-b border-border/30 last:border-0">
                                            <p className="text-sm leading-relaxed text-foreground/90">{def.definition}</p>
                                            <p className="text-xs text-muted-foreground italic">"{def.example}"</p>
                                            <div className="flex items-center gap-4 text-[10px] text-muted-foreground mt-2">
                                                <span className="flex items-center gap-1 text-green-500">
                                                    <ThumbsUp className="w-3 h-3" /> {def.thumbs_up}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    By {def.author}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
