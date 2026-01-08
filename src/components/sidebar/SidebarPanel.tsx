'use client';

import { useUIStore } from '@/store/useUIStore';
import { useBookStore } from '@/store/useBookStore';
import { motion, AnimatePresence } from 'framer-motion';

import { useSettingsStore } from '@/store/useSettingsStore';
import { useStatsStore } from '@/store/useStatsStore';
import { Minus, Plus, RotateCcw, Trash2, Highlighter as HighlighterIcon, Clock, BookOpen, Layers, Play } from 'lucide-react';
import { themes } from '@/lib/themes';
import { AVAILABLE_FONTS } from '@/lib/fonts';
import { SearchPanel } from './SearchPanel';
import { translations } from '@/lib/translations';
import { BackupManager } from '@/lib/backup';
import { Upload, Download, Loader2 } from 'lucide-react';
import { useState } from 'react';

// Helper for Typography Controls
interface NumberControlProps {
    label: string;
    value: number;
    min: number;
    max: number;
    step: number;
    onChange: (val: number) => void;
    defaultValue: number;
    unit?: string;
}

const NumberControl = ({ label, value, min, max, step, onChange, defaultValue, unit = '' }: NumberControlProps) => {
    const updateValue = (newValue: number) => {
        // Fix floating point precision issues (e.g. 1.2 - 0.1 = 1.0999999)
        const cleanValue = Number(newValue.toFixed(1));
        if (cleanValue >= min && cleanValue <= max) {
            onChange(cleanValue);
        }
    };

    return (
        <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">{label}</label>
            <div className="flex items-center gap-2 border border-border rounded-md p-1 bg-background/50">
                <span className="flex-1 px-2 text-sm">{Number(value).toFixed(step < 1 ? 1 : 0)}{unit}</span>
                <button
                    onClick={() => updateValue(value - step)}
                    className="p-1 hover:bg-accent rounded text-muted-foreground hover:text-foreground"
                    title="Decrease"
                >
                    <Minus className="w-3 h-3" />
                </button>
                <button
                    onClick={() => updateValue(value + step)}
                    className="p-1 hover:bg-accent rounded text-muted-foreground hover:text-foreground"
                    title="Increase"
                >
                    <Plus className="w-3 h-3" />
                </button>
                <button
                    onClick={() => onChange(defaultValue)}
                    className="p-1 hover:bg-accent rounded text-muted-foreground hover:text-primary transition-colors"
                    title="Reset to Default"
                >
                    <RotateCcw className="w-3 h-3" />
                </button>
            </div>
        </div>
    );
};

const BackupControls = () => {
    const [status, setStatus] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleExport = async () => {
        setIsLoading(true);
        setStatus('Preparing backup...');
        try {
            await BackupManager.createBackup((msg) => setStatus(msg));
            setTimeout(() => setStatus(null), 3000);
        } catch (err) {
            setStatus('Export failed');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsLoading(true);
        setStatus('Reading file...');
        try {
            await BackupManager.restoreBackup(file, (msg) => setStatus(msg));
            setStatus('Restore Complete! Reloading...');
            setTimeout(() => window.location.reload(), 1500);
        } catch (err) {
            setStatus('Import failed: ' + (err as Error).message);
            console.error(err);
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
                <button
                    onClick={handleExport}
                    disabled={isLoading}
                    className="flex flex-col items-center justify-center p-3 rounded-xl bg-background border border-border hover:border-primary/50 hover:bg-accent/50 transition-all font-medium text-xs gap-2 group"
                >
                    <Download className="w-4 h-4 text-muted-foreground group-hover:text-primary mb-1" />
                    <span>Export Data</span>
                </button>

                <label className="flex flex-col items-center justify-center p-3 rounded-xl bg-background border border-border hover:border-primary/50 hover:bg-accent/50 transition-all cursor-pointer font-medium text-xs gap-2 group">
                    <Upload className="w-4 h-4 text-muted-foreground group-hover:text-primary mb-1" />
                    <span>Import Data</span>
                    <input type="file" accept=".zip" className="hidden" onChange={handleImport} disabled={isLoading} />
                </label>
            </div>

            {status && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary/50 p-2 rounded-lg animate-in fade-in slide-in-from-bottom-1">
                    {isLoading && <Loader2 className="w-3 h-3 animate-spin" />}
                    <span className="truncate">{status}</span>
                </div>
            )}
        </div>
    );
};

export const SidebarPanel = () => {
    const activeTab = useUIStore((state) => state.activeTab);
    const toc = useBookStore((state) => state.toc);
    const library = useBookStore((state) => state.library);
    const currentBookKey = useBookStore((state) => state.currentBookKey);
    const updateLocation = useBookStore((state) => state.updateLocation);
    const openBook = useBookStore((state) => state.openBook);
    const removeAnnotation = useBookStore((state) => state.removeAnnotation);

    const settings = useSettingsStore();
    const t = translations[settings.language || 'en'];

    const handleTocClick = (href: string) => {
        updateLocation(href);
    };

    return (
        <div className="h-full w-80 flex flex-col bg-background/80 backdrop-blur-xl border-r border-border shadow-2xl">
            {/* Header */}
            <div className="p-6 border-b border-border/50 bg-background/50 backdrop-blur-md sticky top-0 z-10">
                <h2 className="text-lg font-semibold capitalize tracking-tight flex items-center gap-2">
                    {activeTab === 'toc'
                        ? (currentBookKey ? 'Contents' : 'My Library')
                        : activeTab}
                </h2>
            </div>

            {/* Content Scroller */}
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-8">

                {/* TABLE OF CONTENTS / LIBRARY LIST */}
                {activeTab === 'toc' && (
                    <div className="space-y-1">
                        {currentBookKey ? (
                            // Book Mode: Show Chapters
                            toc.length > 0 ? (
                                toc.map((item, index) => (
                                    <button
                                        key={index}
                                        onClick={() => handleTocClick(item.href)}
                                        className="w-full text-left px-4 py-3 text-sm text-muted-foreground hover:text-foreground hover:bg-accent/50 hover:translate-x-1 transition-all duration-200 rounded-lg truncate"
                                    >
                                        {item.label}
                                    </button>
                                ))
                            ) : (
                                <p className="text-sm text-muted-foreground p-4 text-center">No chapters.</p>
                            )
                        ) : (
                            // Library Mode: Show Books
                            library.length > 0 ? (
                                library.map((book) => (
                                    <button
                                        key={book.key}
                                        onClick={() => openBook(book.key)}
                                        className="w-full text-left px-4 py-3 text-sm text-muted-foreground hover:text-foreground hover:bg-accent/50 hover:translate-x-1 transition-all duration-200 rounded-lg truncate"
                                    >
                                        {book.title}
                                    </button>
                                ))
                            ) : (
                                <p className="text-sm text-muted-foreground p-4 text-center">No books.</p>
                            )
                        )}
                    </div>
                )}

                {/* SEARCH */}
                {activeTab === 'search' && (
                    <SearchPanel />
                )}

                {/* ANNOTATIONS */}
                {activeTab === 'annotations' && (
                    <div className="space-y-4 animate-in slide-in-from-left-2 fade-in duration-300">
                        {library.find(b => b.key === currentBookKey)?.annotations?.length ? (
                            library.find(b => b.key === currentBookKey)!.annotations!.slice().reverse().map((note) => {
                                const colorMap: Record<string, string> = {
                                    yellow: '#cfbd4d',
                                    green: '#4dcf85',
                                    blue: '#4da8cf',
                                    pink: '#cf4d97'
                                };
                                const displayColor = colorMap[note.color] || note.color;
                                return (
                                    <div key={note.id} className="group relative p-3 rounded-lg bg-background/50 border border-border/50 hover:border-primary/30 transition-all">
                                        <div
                                            className="cursor-pointer"
                                            onClick={() => updateLocation(note.cfiRange)}
                                        >
                                            <p className="text-sm italic text-foreground/80 line-clamp-3 mb-2" style={{ borderLeft: `3px solid ${displayColor}` }}>
                                                <span className="pl-2">"{note.text}"</span>
                                            </p>
                                            <p className="text-[10px] text-muted-foreground flex items-center justify-between">
                                                <span>{new Date(note.created).toLocaleDateString()}</span>
                                                {note.chapter && <span>{note.chapter}</span>}
                                            </p>
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (currentBookKey) removeAnnotation(currentBookKey, note.id);
                                            }}
                                            className="absolute top-2 right-2 p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-all"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="text-center py-8 space-y-3">
                                <div className="w-12 h-12 bg-muted/30 rounded-full flex items-center justify-center mx-auto">
                                    <HighlighterIcon className="w-5 h-5 text-muted-foreground/50" />
                                </div>
                                <p className="text-sm text-muted-foreground">Select text to highlight it.</p>
                            </div>
                        )}
                    </div>
                )}

                {/* TYPOGRAPHY (APPEARANCE) */}
                {activeTab === 'appearance' && (
                    <div className="space-y-6 animate-in slide-in-from-left-2 fade-in duration-300">
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-muted-foreground">Page View</label>
                            <select
                                value={settings.pageView}
                                onChange={(e) => settings.setPageView(e.target.value as any)}
                                className="w-full bg-background border border-border rounded-md p-2 text-sm"
                            >
                                <option value="single">Single Page</option>
                                <option value="double">Double Page</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-medium text-muted-foreground">Font Family</label>
                            <select
                                value={settings.fontFamily}
                                onChange={(e) => settings.setFontFamily(e.target.value)}
                                className="w-full bg-background border border-border rounded-md p-2 text-sm"
                            >
                                {['Sans-Serif', 'Serif', 'Display', 'Handwriting', 'Monospace'].map((category) => (
                                    <optgroup key={category} label={category}>
                                        {AVAILABLE_FONTS.filter(f => f.category === category).map(f => (
                                            <option key={f.name} value={f.value}>{f.name}</option>
                                        ))}
                                    </optgroup>
                                ))}
                            </select>
                        </div>

                        <NumberControl
                            label="Font Size"
                            value={settings.fontSize}
                            min={50} max={200} step={10} unit="%"
                            defaultValue={100}
                            onChange={settings.setFontSize}
                        />

                        <NumberControl
                            label="Font Weight"
                            value={settings.fontWeight}
                            min={100} max={900} step={100}
                            defaultValue={400}
                            onChange={settings.setFontWeight}
                        />

                        <NumberControl
                            label="Line Height"
                            value={settings.lineHeight}
                            min={1} max={3} step={0.1}
                            defaultValue={1.5}
                            onChange={settings.setLineHeight}
                        />
                    </div>
                )}

                {/* THEMES (SETTINGS) */}
                {/* THEMES */}
                {activeTab === 'themes' && (
                    <div className="space-y-6 animate-in slide-in-from-left-2 fade-in duration-300">
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-muted-foreground">{t.settings.theme}</label>
                            <div className="grid grid-cols-2 gap-3">
                                {themes.map((t) => (
                                    <button
                                        key={t.id}
                                        onClick={() => settings.setTheme(t.id as any)}
                                        className={`
                                            relative p-3 rounded-lg border text-left transition-all hover:scale-[1.02]
                                            ${settings.theme === t.id ? 'ring-2 ring-primary border-transparent' : 'border-border/50 hover:border-border'}
                                        `}
                                        style={{ backgroundColor: t.bg }}
                                    >
                                        <span className="text-xs font-medium" style={{ color: t.fg }}>{t.name}</span>
                                        {settings.theme === t.id && (
                                            <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* SETTINGS (LANGUAGE) */}
                {activeTab === 'settings' && (
                    <div className="space-y-8 animate-in slide-in-from-left-2 fade-in duration-300">
                        {/* Language Selector */}
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-muted-foreground">{t.settings.language}</label>
                            <select
                                value={settings.language}
                                onChange={(e) => settings.setLanguage(e.target.value as any)}
                                className="w-full bg-background border border-border rounded-md p-2 text-sm"
                            >
                                <option value="en">English (US)</option>
                                <option value="es">Español</option>
                                <option value="de">Deutsch</option>
                                <option value="zh">中文 (Simplified)</option>
                                <option value="ja">日本語 (Japanese)</option>
                            </select>
                        </div>

                        {/* Data & Storage */}
                        <div className="space-y-3 pt-4 border-t border-border/40">
                            <h3 className="text-sm font-semibold text-foreground">Data & Storage</h3>
                            <BackupControls />
                        </div>
                    </div>
                )}

                {/* STATISTICS */}
                {activeTab === 'stats' && (
                    <StatsPanel />
                )}
            </div>
        </div>
    );
};

// Stats Panel Component
const StatsPanel = () => {
    const stats = useStatsStore();
    const library = useBookStore((state) => state.library);

    // Format time
    const formatTime = (ms: number) => {
        const totalMinutes = Math.floor(ms / 60000);
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        if (hours === 0) return `${minutes}m`;
        return `${hours}h ${minutes}m`;
    };

    const statCards = [
        {
            icon: Clock,
            label: 'Reading Time',
            value: formatTime(stats.totalReadingTimeMs),
            color: 'text-blue-500'
        },
        {
            icon: BookOpen,
            label: 'Books in Library',
            value: library.length.toString(),
            color: 'text-green-500'
        },
        {
            icon: Layers,
            label: 'Chapters Read',
            value: stats.chaptersRead.toString(),
            color: 'text-purple-500'
        },
        {
            icon: Play,
            label: 'Reading Sessions',
            value: stats.sessionsCount.toString(),
            color: 'text-orange-500'
        }
    ];

    return (
        <div className="space-y-6 animate-in slide-in-from-left-2 fade-in duration-300">
            <div className="grid grid-cols-2 gap-3">
                {statCards.map((stat, i) => (
                    <div
                        key={i}
                        className="p-4 rounded-xl bg-background border border-border/50 hover:border-border transition-colors space-y-2"
                    >
                        <stat.icon className={`w-5 h-5 ${stat.color}`} />
                        <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                        <p className="text-xs text-muted-foreground">{stat.label}</p>
                    </div>
                ))}
            </div>

            <div className="pt-4 border-t border-border/40">
                <button
                    onClick={() => {
                        if (confirm('Are you sure you want to reset all reading statistics?')) {
                            stats.resetStats();
                        }
                    }}
                    className="w-full text-xs text-muted-foreground hover:text-destructive transition-colors py-2"
                >
                    Reset Statistics
                </button>
            </div>
        </div>
    );
};
