'use client';

import { useState, useCallback } from 'react';
import { useBookStore } from '@/store/useBookStore';
import { Upload, FileText, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const DropZone = () => {
    // @ts-ignore
    const addBook = useBookStore((state) => state.addBook);
    const [isDragOver, setIsDragOver] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleFile = useCallback(async (file: File) => {
        if (file.type !== 'application/epub+zip' && !file.name.endsWith('.epub')) {
            setError('Please upload a valid .epub file');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            await addBook(file);
        } catch (err) {
            setError('Failed to read file');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [addBook]);

    const onDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    }, [handleFile]);

    const onDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    }, []);

    const onDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
    }, []);

    const onFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
        }
    }, [handleFile]);

    return (
        <div className="w-full max-w-xl mx-auto px-4">
            <motion.div
                layout
                className={`
          relative border-2 border-dashed rounded-3xl p-12 text-center transition-colors duration-300
          flex flex-col items-center justify-center gap-4 min-h-[300px] cursor-pointer
          ${isDragOver
                        ? 'border-primary bg-primary/5 scale-[1.02]'
                        : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/10'
                    }
          ${error ? 'border-destructive/50 bg-destructive/5' : ''}
        `}
                onDrop={onDrop}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onClick={() => document.getElementById('epub-input')?.click()}
            >
                <input
                    type="file"
                    id="epub-input"
                    className="hidden"
                    accept=".epub,application/epub+zip"
                    onChange={onFileInput}
                />

                <AnimatePresence mode="wait">
                    {isLoading ? (
                        <motion.div
                            key="loading"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="flex flex-col items-center gap-3"
                        >
                            <Loader2 className="w-12 h-12 text-primary animate-spin" />
                            <p className="text-lg font-medium text-muted-foreground">Opening your book...</p>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="idle"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="flex flex-col items-center gap-3"
                        >
                            <div className={`
                p-4 rounded-full transition-colors duration-300
                ${isDragOver ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}
              `}>
                                {error ? <FileText className="w-8 h-8" /> : <Upload className="w-8 h-8" />}
                            </div>

                            <div className="space-y-1">
                                <h3 className="text-xl font-semibold tracking-tight">
                                    {error ? 'Invalid File' : 'Drop your EPUB here'}
                                </h3>
                                <p className="text-sm text-muted-foreground max-w-[280px]">
                                    {error || 'Drag & drop your local .epub file, or click to browse files'}
                                </p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
};
