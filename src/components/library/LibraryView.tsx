'use client';

import { useBookStore, BookMetadata } from '@/store/useBookStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { translations, getGreeting } from '@/lib/translations';
import { motion, AnimatePresence } from 'framer-motion';
import { Book as BookIcon, Trash2, Clock, BookOpen, Star, Library, Upload, ArrowUpDown, ChevronDown, Check } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

// Ambient Background
const AmbientBackground = () => (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-purple-500/5 rounded-full blur-[120px]" />
    </div>
);

// 3D Book Card Component (Touch Adaptive)
const Book3D = ({ book, onClick, onDelete, isTouch }: { book: BookMetadata; onClick: () => void; onDelete: (e: React.MouseEvent) => void; isTouch: boolean }) => {
    return (
        <div
            className="group relative w-full aspect-[2/3] cursor-pointer perspective-[1000px]"
            onClick={onClick}
        >
            {/* Shelf shadow (Desktop Only) */}
            {!isTouch && (
                <div className="absolute -bottom-4 left-2 right-2 h-4 bg-black/20 blur-md rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            )}

            <motion.div
                layoutId={`cover-${book.key}`}
                className="relative w-full h-full transition-all duration-500 ease-out origin-bottom transform-style-3d"
                initial={{ rotateX: 0, rotateY: 0, z: 0 }}
                // Conditional Animation Props
                {...(isTouch ? {
                    whileTap: { scale: 0.96 }
                } : {
                    whileHover: {
                        z: 50,
                        y: -30,
                        rotateY: -15,
                        rotateX: 5,
                        scale: 1.1,
                        boxShadow: '20px 20px 30px -5px rgba(0, 0, 0, 0.3)'
                    }
                })}
            >
                {/* Book Spine (3D Effect) - Reduced opacity on mobile if desired, but fine to keep structure */}
                <div
                    className="absolute left-0 top-0 bottom-0 w-[12px] bg-muted origin-left transform -rotate-y-90 -translate-x-full"
                    style={{ background: 'linear-gradient(to right, rgba(255,255,255,0.2), rgba(0,0,0,0.1))' }}
                />

                {/* Pages */}
                <div
                    className="absolute right-1 top-1 bottom-1 w-[10px] bg-white rounded-r-sm shadow-inner"
                    style={{ transform: 'translateZ(-2px)' }}
                />

                {/* Front Cover */}
                <div className="absolute inset-0 rounded-sm overflow-hidden bg-card border border-white/10 shadow-md">
                    {book.cover ? (
                        <div className="relative w-full h-full">
                            <img src={book.cover} alt={book.title} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-tr from-black/20 via-transparent to-white/10 pointer-events-none" />
                            <div className="absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-black/40 to-transparent pointer-events-none" />
                        </div>
                    ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 text-center">
                            <BookIcon className="w-12 h-12 text-primary/50 mb-2" />
                            <span className="text-xs font-bold text-foreground/80 uppercase tracking-widest leading-relaxed line-clamp-3">
                                {book.title}
                            </span>
                        </div>
                    )}
                </div>

                {/* Info Overlay (Desktop: Hover, Mobile: Always visible below or removed to keep clean) */}
                {/* We'll keep the desktop hover behavior for simplicity, on mobile users usually tap to open */}
                {!isTouch && (
                    <div className="absolute -bottom-16 left-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none text-center">
                        <p className="text-xs font-bold text-foreground line-clamp-1">{book.title}</p>
                        <p className="text-[10px] text-muted-foreground line-clamp-1">{book.author}</p>
                    </div>
                )}

                {/* Delete Button - Always visible on mobile maybe? Or long press? For now, keep top right but larger tap target */}
                <button
                    onClick={onDelete}
                    className={`absolute -top-3 -right-3 z-50 p-2 rounded-full bg-destructive text-destructive-foreground shadow-lg transition-all duration-200 
                        ${isTouch ? 'opacity-100 scale-100' : 'opacity-0 group-hover:opacity-100 hover:scale-110'}
                    `}
                    title="Delete Book"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </motion.div>

            {/* Mobile Title below book since hover info is gone */}
            {isTouch && (
                <div className="mt-4 text-center">
                    <p className="text-xs font-bold text-foreground line-clamp-1">{book.title}</p>
                    <p className="text-[10px] text-muted-foreground line-clamp-1">{book.author}</p>
                </div>
            )}
        </div>
    );
};

// Custom Liquid Glass Dropdown
const SortDropdown = ({ value, onChange }: { value: string, onChange: (v: any) => void }) => {
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const settings = useSettingsStore();
    const t = translations[settings.language || 'en'];

    const options = [
        { value: 'newest', label: t.library.sort.newest },
        { value: 'oldest', label: t.library.sort.oldest },
        { value: 'title', label: t.library.sort.title },
        { value: 'author', label: t.library.sort.author },
    ];

    const currentLabel = options.find(o => o.value === value)?.label;

    return (
        <div className="relative z-50" ref={ref}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-background/30 backdrop-blur-sm border border-border/50 hover:bg-background/50 hover:border-primary/30 transition-all text-sm font-medium text-foreground/80 hover:text-foreground active:scale-95"
            >
                <ArrowUpDown className="w-3.5 h-3.5 opacity-70" />
                <span>{currentLabel}</span>
                <ChevronDown className={`w-3.5 h-3.5 opacity-50 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="absolute right-0 mt-2 w-48 rounded-2xl bg-background/60 backdrop-blur-xl border border-white/10 shadow-2xl overflow-hidden ring-1 ring-black/5"
                    >
                        <div className="p-1.5 space-y-0.5">
                            {options.map((option) => (
                                <button
                                    key={option.value}
                                    onClick={() => {
                                        onChange(option.value);
                                        setIsOpen(false);
                                    }}
                                    className={`
                                        w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all group
                                        ${value === option.value
                                            ? 'bg-foreground/10 text-foreground'
                                            : 'text-muted-foreground hover:bg-foreground/5 hover:text-foreground'
                                        }
                                    `}
                                >
                                    {option.label}
                                    {value === option.value && (
                                        <motion.div layoutId="check">
                                            <Check className="w-3.5 h-3.5" />
                                        </motion.div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export const LibraryView = () => {
    const library = useBookStore((state) => state.library);
    const searchQuery = useBookStore((state) => state.searchQuery);
    const openBook = useBookStore((state) => state.openBook);
    const deleteBook = useBookStore((state) => state.deleteBook);
    // @ts-ignore
    const addBook = useBookStore((state) => state.addBook);

    const [greeting, setGreeting] = useState('Welcome Back');
    const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'title' | 'author'>('newest');
    const [isTouch, setIsTouch] = useState(false);

    const settings = useSettingsStore();
    const t = translations[settings.language || 'en'];

    // Initial greeting and Touch detection
    useEffect(() => {
        // Touch Detection
        const checkTouch = () => {
            setIsTouch(window.matchMedia('(hover: none) and (pointer: coarse)').matches);
        };
        checkTouch();
        window.addEventListener('resize', checkTouch);

        // Greeting Logic
        setGreeting(getGreeting(settings.language || 'en'));

        return () => window.removeEventListener('resize', checkTouch);
    }, [settings.language]); // Re-run when language changes

    const filteredLibrary = library.filter((book) => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return book.title.toLowerCase().includes(q) || book.author.toLowerCase().includes(q);
    });

    const sortedLibrary = [...filteredLibrary].sort((a, b) => {
        switch (sortBy) {
            case 'newest': return (b.addedAt || 0) - (a.addedAt || 0);
            case 'oldest': return (a.addedAt || 0) - (b.addedAt || 0);
            case 'title': return a.title.localeCompare(b.title);
            case 'author': return a.author.localeCompare(b.author);
            default: return 0;
        }
    });

    const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.type !== 'application/epub+zip' && !file.name.endsWith('.epub')) {
                alert('Please upload a valid .epub file');
                return;
            }
            try {
                await addBook(file);
            } catch (err) {
                console.error(err);
                alert('Failed to read file');
            }
        }
    };

    const recentBook = library.find(b => (b.progress || 0) > 0);

    // Drag & Drop State
    const [isDragging, setIsDragging] = useState(false);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDragEnter = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        // Only set to false if leaving the main container
        if (e.currentTarget === e.target) {
            setIsDragging(false);
        }
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const files = Array.from(e.dataTransfer.files);
        const epubFiles = files.filter(f => f.type === 'application/epub+zip' || f.name.endsWith('.epub'));

        if (epubFiles.length === 0) {
            alert('Please drop valid .epub files');
            return;
        }

        for (const file of epubFiles) {
            try {
                await addBook(file);
            } catch (err) {
                console.error('Failed to add book:', err);
            }
        }
    };

    return (
        <div
            className="relative h-full overflow-y-auto bg-background/50 custom-scrollbar"
            onDragOver={handleDragOver}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            <AmbientBackground />

            {/* Drag & Drop Overlay */}
            {isDragging && (
                <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center pointer-events-none">
                    <div className="p-8 rounded-2xl bg-primary/10 border-2 border-dashed border-primary text-center space-y-4">
                        <Upload className="w-16 h-16 mx-auto text-primary animate-bounce" />
                        <p className="text-2xl font-bold text-foreground">Drop EPUB files here</p>
                        <p className="text-sm text-muted-foreground">Multiple files supported</p>
                    </div>
                </div>
            )}

            <div className="relative z-10 max-w-7xl mx-auto p-6 md:p-10 lg:p-14 space-y-12 pb-32">

                {/* Header Section */}
                <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-3">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-foreground/5 text-foreground/80 text-xs font-medium border border-foreground/10">
                            <Star className="w-3 h-3 fill-current" />
                            <span>{t.library.title}</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground bg-clip-text text-transparent bg-gradient-to-r from-foreground via-foreground/80 to-foreground/20 w-full md:min-w-[400px] py-2 pr-2">
                            {greeting}
                        </h1>
                        <p className="text-muted-foreground text-lg max-w-md">
                            {t.library.subtitle}
                        </p>
                    </div>

                    {/* Minimal Import Button */}
                    <div className="flex items-center">
                        <label className="cursor-pointer group inline-flex items-center gap-2 px-5 py-2.5 bg-background/80 hover:bg-background text-foreground rounded-full text-sm font-medium transition-all shadow-sm hover:shadow-md border border-border/50 hover:border-primary/30 active:scale-95">
                            <div className="p-1 rounded-full bg-foreground/10 text-foreground group-hover:bg-primary/20 group-hover:text-primary group-hover:scale-110 transition-all">
                                <Upload className="w-3.5 h-3.5" />
                            </div>
                            <span>{t.library.import}</span>
                            <input type="file" className="hidden" accept=".epub,application/epub+zip" onChange={handleFile} />
                        </label>
                    </div>
                </header>

                {/* Continue Reading Hero */}
                {recentBook && !searchQuery && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="relative rounded-2xl overflow-hidden bg-card border border-border shadow-2xl p-6 md:p-8 flex flex-col md:flex-row gap-8 items-center group"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent pointer-events-none" />

                        <div className="relative w-32 md:w-48 aspect-[2/3] rounded-lg shadow-xl overflow-hidden flex-shrink-0 cursor-pointer hover:scale-[1.02] transition-transform ring-1 ring-border/50" onClick={() => openBook(recentBook.key)}>
                            {recentBook.cover ? (
                                <img src={recentBook.cover} alt={recentBook.title} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-muted flex items-center justify-center">
                                    <BookIcon className="w-12 h-12 opacity-20" />
                                </div>
                            )}
                        </div>

                        <div className="flex-1 space-y-6 text-center md:text-left w-full">
                            <div className="space-y-2">
                                <span className="text-xs font-bold text-foreground/70 uppercase tracking-wider">{t.library.continue}</span>
                                <h2 className="text-2xl md:text-3xl font-bold text-foreground font-serif tracking-tight">{recentBook.title}</h2>
                                <p className="text-muted-foreground font-medium">{recentBook.author}</p>
                            </div>

                            {/* Progress Bar with adaptive colors */}
                            <div className="space-y-2 max-w-md mx-auto md:mx-0">
                                <div className="flex justify-between text-xs font-medium text-muted-foreground">
                                    <span>{t.library.progress}</span>
                                    <span>{recentBook.progress || 0}% {t.library.read}</span>
                                </div>
                                <div className="h-2 w-full bg-foreground/10 rounded-full overflow-hidden">
                                    <div className="h-full bg-foreground transition-all duration-1000 ease-out" style={{ width: `${recentBook.progress || 0}%` }} />
                                </div>
                            </div>

                            {/* Button with adaptive icon color */}
                            <button
                                onClick={() => openBook(recentBook.key)}
                                className="inline-flex items-center gap-2 px-8 py-3 bg-foreground text-background rounded-full font-medium shadow-lg hover:bg-foreground/90 transition-all hover:scale-105 active:scale-95"
                            >
                                <BookOpen className="w-4 h-4 text-background" />
                                {t.library.resume}
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* Main Grid with 3D Books */}
                <div className="space-y-8">
                    <div className="flex items-center justify-between border-b border-border/50 pb-4">
                        <h3 className="text-xl font-semibold flex items-center gap-3">
                            <BookIcon className="w-5 h-5 text-muted-foreground" />
                            {t.library.allBooks}
                            <span className="text-xs font-normal text-muted-foreground ml-1 px-2.5 py-0.5 bg-muted rounded-full border border-border">{filteredLibrary.length}</span>
                        </h3>

                        <SortDropdown value={sortBy} onChange={setSortBy} />
                    </div>

                    {sortedLibrary.length > 0 ? (
                        <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 px-1 md:px-0 ${isTouch ? 'gap-x-4 gap-y-10' : 'gap-x-8 gap-y-16 perspective-[2000px]'}`}>
                            {sortedLibrary.map((book) => (
                                <div key={book.key} className="relative group">
                                    <Book3D
                                        book={book}
                                        onClick={() => openBook(book.key)}
                                        onDelete={(e) => {
                                            e.stopPropagation();
                                            deleteBook(book.key);
                                        }}
                                        isTouch={isTouch}
                                    />
                                    {!isTouch && (
                                        <div className="absolute -bottom-6 -left-4 -right-4 h-4 bg-gradient-to-b from-muted to-muted/50 rounded-sm shadow-sm -z-10 group-hover:from-primary/10 transition-colors duration-500">
                                            <div className="absolute top-0 left-0 right-0 h-[1px] bg-white/20" />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="py-24 text-center space-y-6">
                            <div className="w-24 h-24 bg-muted/20 rounded-full flex items-center justify-center mx-auto border border-border/50">
                                <Library className="w-10 h-10 text-muted-foreground/40" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-xl font-medium text-foreground">{t.library.empty}</h3>
                                <p className="text-muted-foreground max-w-sm mx-auto">
                                    {searchQuery ? `${t.library.noResults} "${searchQuery}"` : t.library.emptyDesc}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
