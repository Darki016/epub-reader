'use client';

import { useEffect, useState, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ReactReader, IReactReaderStyle, ReactReaderStyle } from 'react-reader';
import { useBookStore } from '@/store/useBookStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useUIStore } from '@/store/useUIStore';
import { useStatsStore } from '@/store/useStatsStore';
import { Loader2, Maximize2, Minimize2 } from 'lucide-react';
import { themes, getTheme } from '@/lib/themes';
import { getFontUrl } from '@/lib/fonts';
import { ContextMenu } from './ContextMenu';
import { DefinitionModal } from './DefinitionModal';
import { Annotation } from '@/store/useBookStore';

export const ReaderView = () => {
    // const file = useBookStore((state) => state.file); // Removed from store
    const bookData = useBookStore((state) => state.bookData);
    const currentLocation = useBookStore((state) => state.currentLocation);
    const updateLocation = useBookStore((state) => state.updateLocation);
    const closeBook = useBookStore((state) => state.closeBook);

    const setToc = useBookStore((state) => state.setToc);
    const isSidebarOpen = useUIStore((state) => state.isSidebarOpen);
    const [url, setUrl] = useState<string | null>(null);
    const [rendition, setRendition] = useState<any>(null);

    const [isMobile, setIsMobile] = useState(false);

    // Stats Tracking: Start session when book opens, end when unmounts
    const startSession = useStatsStore((state) => state.startSession);
    const endSession = useStatsStore((state) => state.endSession);

    useEffect(() => {
        if (bookData) {
            startSession();
        }
        return () => {
            endSession();
        };
    }, [bookData, startSession, endSession]);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // ...

    // Handle Resize on Sidebar Toggle
    // Handle Resize on Sidebar Toggle
    useEffect(() => {
        if (rendition) {
            // Save current location before resizing to prevent page jumps
            let cfi: string | null = null;
            try {
                if (rendition && typeof rendition.currentLocation === 'function') {
                    const location = rendition.currentLocation();
                    if (location && location.start) {
                        cfi = location.start.cfi;
                    }
                }
            } catch (err) {
                // If rendition is not ready, just ignore
            }

            // Wait for transition to finish (0.2s in AppLayout)
            const timer = setTimeout(() => {
                try {
                    if (rendition && typeof rendition.resize === 'function') {
                        rendition.resize();
                    }
                    // Restore exact location
                    if (cfi) {
                        rendition.display(cfi);
                    }
                } catch (e) {
                    // Ignore resize errors
                }
            }, 250);
            return () => clearTimeout(timer);
        }
    }, [isSidebarOpen, rendition]);

    const renditionRef = useRef<any>(undefined);
    const lastNavTime = useRef<number>(0);
    const renderedAnnotationsRef = useRef<Map<string, { cfiRange: string, type: string }>>(new Map());

    const isNavigating = useRef<boolean>(false);

    const updateBookProgress = useBookStore((state) => state.updateBookProgress);
    const currentBookKey = useBookStore((state) => state.currentBookKey);
    const [progress, setProgress] = useState<number>(0);
    // Use global focus mode state
    const isFocusMode = useUIStore((state) => state.isFocusMode);
    const setFocusMode = useUIStore((state) => state.setFocusMode);

    const [selection, setSelection] = useState<{ x: number, y: number, cfiRange: string, text: string, id?: string, isEditing?: boolean } | null>(null);
    const addAnnotation = useBookStore((state) => state.addAnnotation);
    const removeAnnotation = useBookStore((state) => state.removeAnnotation);
    const library = useBookStore((state) => state.library);

    // Annotations Logic
    useEffect(() => {
        if (!rendition || !currentBookKey) return;

        const book = library.find(b => b.key === currentBookKey);
        const currentAnnotations = book?.annotations || [];
        const rendered = renderedAnnotationsRef.current;
        const currentIds = new Set(currentAnnotations.map(a => a.id));

        // 1. Remove orphaned
        rendered.forEach((value, id) => {
            if (!currentIds.has(id)) {
                try {
                    rendition.annotations.remove(value.cfiRange, value.type);
                    rendered.delete(id);
                } catch (e) { }
            }
        });

        // 2. Add missing
        currentAnnotations.forEach(a => {
            if (!rendered.has(a.id)) {
                try {
                    const type = a.type || 'highlight';
                    const colorMap: Record<string, string> = {
                        yellow: '#cfbd4d',
                        green: '#4dcf85',
                        blue: '#4da8cf',
                        pink: '#cf4d97'
                    };
                    const props = {
                        fill: colorMap[a.color] || a.color,
                        'fill-opacity': '0.3',
                        'mix-blend-mode': 'multiply',
                        'rx': '4px',
                        'ry': '4px',
                        'pointer-events': 'visible' // Ensure clicks register
                    };
                    const className = `highlight-${a.color}`;

                    rendition.annotations.add(type, a.cfiRange, { id: a.id, type }, null, className, props);

                    rendered.set(a.id, { cfiRange: a.cfiRange, type });
                } catch (e) { }
            }
        });

        const onMarkClicked = (cfiRange: string, data: any, contents: any) => {
            setSelection(null);

            const range = rendition.getRange(cfiRange);
            const text = range.toString();

            if (!range) return;

            const rect = range.getBoundingClientRect();
            const iframe = document.querySelector('iframe');
            if (iframe) {
                const iframeRect = iframe.getBoundingClientRect();
                setSelection({
                    x: rect.left + iframeRect.left + (rect.width / 2),
                    y: rect.top + iframeRect.top,
                    cfiRange,
                    text: text || data?.text || '',
                    id: data?.id,
                    isEditing: true
                });
            }
        };

        const onSelected = (cfiRange: string, contents: any) => {
            setSelection(null); // Reset

            // Get coordinates
            const range = rendition.getRange(cfiRange);
            const text = range.toString();

            if (!text) return;

            // We need to calculate position relative to the viewport
            // The range.getBoundingClientRect() is relative to the iframe's viewport
            const rect = range.getBoundingClientRect();

            // Find the iframe
            const iframe = document.querySelector('iframe');
            // Note: This matches the first iframe. Since we only have one Reader, it's fine.
            if (iframe) {
                const iframeRect = iframe.getBoundingClientRect();
                setSelection({
                    x: rect.left + iframeRect.left + (rect.width / 2),
                    y: rect.top + iframeRect.top,
                    cfiRange,
                    text
                });
            }

            // Clear browser selection to allow our menu to handle it without native overlap if desired?
            // Actually, keeping standard selection is fine.
        };

        rendition.on('selected', onSelected);
        rendition.on('markClicked', onMarkClicked);

        return () => {
            rendition.off('selected', onSelected);
            rendition.off('markClicked', onMarkClicked);
        };
    }, [rendition, currentBookKey, library]); // Re-run if library updates (e.g. annotation added)

    const handleHighlight = (color: string) => {
        if (!selection || !currentBookKey) return;

        // If editing, remove old annotation first
        if (selection.isEditing && selection.id) {
            removeAnnotation(currentBookKey, selection.id);
        }

        const annotation: Annotation = {
            id: Date.now().toString(),
            cfiRange: selection.cfiRange,
            text: selection.text,
            color,
            type: 'highlight',
            created: Date.now()
        };

        addAnnotation(currentBookKey, annotation);

        setSelection(null);
        (window as any).getSelection()?.removeAllRanges();
        const iframe = document.querySelector('iframe');
        if (iframe && iframe.contentWindow) {
            iframe.contentWindow.getSelection()?.removeAllRanges();
        }
    };



    const handleDelete = () => {
        if (!selection || !currentBookKey || !selection.id) return;

        removeAnnotation(currentBookKey, selection.id);

        setSelection(null);
    };

    const handleCopy = () => {
        if (!selection) return;
        navigator.clipboard.writeText(selection.text);
        setSelection(null);
        const iframe = document.querySelector('iframe');
        if (iframe && iframe.contentWindow) {
            iframe.contentWindow.getSelection()?.removeAllRanges();
        }
    };

    const handleDefine = () => {
        if (!selection) return;
        // Clean text (remove trailing punctuation if only one word selected)
        const text = selection.text.trim();
        useUIStore.getState().openDefinition(text, { x: selection.x, y: selection.y });
        setSelection(null); // Close menu
    };

    const locationChanged = (epubcifi: string | number) => {
        updateLocation(epubcifi);

        // Calculate Progress
        if (rendition) {
            const loc = rendition.currentLocation();
            if (loc && loc.start) {
                const p = loc.start.percentage;
                if (typeof p === 'number') {
                    const pct = Math.floor(p * 100);
                    setProgress(pct);
                    if (currentBookKey) {
                        updateBookProgress(currentBookKey, pct);
                    }
                }
            }
        }
    };

    const handleWheel = async (e: WheelEvent) => {
        const now = Date.now();
        if (now - lastNavTime.current < 250) return;
        if (isNavigating.current) return;

        if (e.deltaY > 0) {
            // Forward
            isNavigating.current = true;
            lastNavTime.current = now;
            try {
                await renditionRef.current?.next();
            } finally {
                isNavigating.current = false;
            }
        } else if (e.deltaY < 0) {
            // Backward
            isNavigating.current = true;
            lastNavTime.current = now;
            try {
                await renditionRef.current?.prev();
            } finally {
                isNavigating.current = false;
            }
        }
    };

    // Custom minimal styles removed as we are using default + customization via props

    // Persist bookData and location during exit animation
    const [persistedBookData, setPersistedBookData] = useState<ArrayBuffer | null>(bookData);
    const [persistedLocation, setPersistedLocation] = useState<string | number | null>(currentLocation);

    useEffect(() => {
        if (bookData) {
            setPersistedBookData(bookData);
        }
    }, [bookData]);

    useEffect(() => {
        if (currentLocation) {
            setPersistedLocation(currentLocation);
        }
    }, [currentLocation]);

    useEffect(() => {
        if (persistedBookData) {
            const blob = new Blob([persistedBookData], { type: 'application/epub+zip' });
            const createdUrl = URL.createObjectURL(blob);
            setUrl(createdUrl);
            return () => URL.revokeObjectURL(createdUrl);
        }
    }, [persistedBookData]);

    const settings = useSettingsStore();

    // Apply Settings

    useEffect(() => {
        if (rendition) {
            const { theme, fontSize, fontFamily, fontWeight, lineHeight } = settings;

            // Get Theme Colors
            const activeTheme = getTheme(theme);
            const colors = { bg: activeTheme.bg, fg: activeTheme.fg };

            // Inject Font into active views manually (for immediate update)
            const fontUrl = getFontUrl(fontFamily);
            if (fontUrl) {
                rendition.getContents().forEach((c: any) => {
                    const doc = c.document;
                    if (!doc) return;
                    const existing = doc.getElementById('reader-font-link');
                    if (existing) existing.remove();

                    const link = doc.createElement('link');
                    link.id = 'reader-font-link';
                    link.rel = 'stylesheet';
                    link.href = fontUrl;
                    doc.head.appendChild(link);
                });
            }

            // Theme applied globally in AppLayout

            // Register and select theme for Reader Content
            rendition.themes.default({
                'body': {
                    'color': `${colors.fg} !important`,
                    'background': `${colors.bg} !important`,
                    'font-family': `${fontFamily} !important`,
                    'font-size': `${fontSize}% !important`,
                    'font-weight': `${fontWeight} !important`,
                    'line-height': `${lineHeight} !important`,
                    'padding-top': '20px !important', // Add some breathing room
                    'padding-bottom': '20px !important',
                    '-webkit-touch-callout': 'none !important', // Disable native Android menu
                    '-webkit-user-select': 'text !important', // Ensure selection still works
                    'user-select': 'text !important',
                },
                'p': {
                    'font-family': `${fontFamily} !important`,
                    'font-size': `${fontSize}% !important`,
                    'line-height': `${lineHeight} !important`,
                    'font-weight': `${fontWeight} !important`,
                },
                'span': {
                    'font-family': `${fontFamily} !important`,
                    'font-weight': `${fontWeight} !important`,
                },
                'div': {
                    'font-family': `${fontFamily} !important`,
                },
                '.search-result-highlight': {
                    'fill': 'yellow',
                    'fill-opacity': '0.4',
                    'mix-blend-mode': 'multiply'
                },
                '.highlight-yellow': { 'fill': '#cfbd4d !important', 'fill-opacity': '0.3 !important', 'mix-blend-mode': 'multiply' },
                '.highlight-green': { 'fill': '#4dcf85 !important', 'fill-opacity': '0.3 !important', 'mix-blend-mode': 'multiply' },
                '.highlight-blue': { 'fill': '#4da8cf !important', 'fill-opacity': '0.3 !important', 'mix-blend-mode': 'multiply' },
                '.highlight-pink': { 'fill': '#cf4d97 !important', 'fill-opacity': '0.3 !important', 'mix-blend-mode': 'multiply' }
            });

            // Apply Page View (Spread)
            const effectiveSpread = isMobile ? 'none' : (settings.pageView === 'single' ? 'none' : 'auto');
            rendition.spread(effectiveSpread);

            // Force redraw to ensure spread matches
            if (rendition.manager) {
                // Resize triggers a layout recalculation
                rendition.resize();
            }

            // Generate locations for accurate progress
            rendition.book.ready.then(() => {
                // 1000 chars per location is standard
                return rendition.book.locations.generate(1000);
            }).then(() => {
                // Force update progress after locations are ready
                const loc = rendition.currentLocation();
                if (loc && loc.start) {
                    const p = loc.start.percentage;
                    if (typeof p === 'number') {
                        const pct = Math.floor(p * 100);
                        setProgress(pct);
                    }
                }
            }).catch(() => { });
        }
    }, [settings, rendition, isMobile]); // Re-apply when settings change or rendition becomes available

    // Handle Resize on Focus Mode / Sidebar Toggle
    // The sidebar has a transition duration of ~300ms, so we need to wait before resizing
    useEffect(() => {
        if (!rendition) return;
        const timer = setTimeout(() => {
            if (rendition && typeof rendition.resize === 'function') {
                rendition.resize();
            }
        }, 350); // > 300ms transition
        return () => clearTimeout(timer);
    }, [isFocusMode, useUIStore.getState().isSidebarOpen, rendition]);

    const searchQuery = useBookStore((state) => state.searchQuery);
    const setSearchResults = useBookStore((state) => state.setSearchResults);
    const setIsSearching = useBookStore((state) => state.setIsSearching);
    const temporaryHighlight = useBookStore((state) => state.temporaryHighlight);
    const setTemporaryHighlight = useBookStore((state) => state.setTemporaryHighlight);

    // Temporary Highlight Effect
    useEffect(() => {
        if (!rendition || !temporaryHighlight) return;

        // Add highlight
        // Note: 'search-result-highlight' class must be defined in global css or injected
        rendition.annotations.add('highlight', temporaryHighlight, {}, null, 'search-result-highlight');

        // Remove after 3s
        const timer = setTimeout(() => {
            rendition.annotations.remove(temporaryHighlight, 'highlight');
            setTemporaryHighlight(null);
        }, 3000);

        return () => {
            clearTimeout(timer);
            // Cleanup on unmount or change
            if (rendition) {
                try {
                    rendition.annotations.remove(temporaryHighlight, 'highlight');
                } catch (e) { }
            }
        };
    }, [temporaryHighlight, rendition]);

    // Search Effect
    useEffect(() => {
        if (!rendition) return;

        if (!searchQuery || searchQuery.length < 2) {
            setSearchResults([]);
            return;
        }

        const doSearch = async () => {
            setIsSearching(true);
            setSearchResults([]);
            try {
                // @ts-ignore
                const spineItems = rendition.book.spine.spineItems;
                const results: any[] = [];

                // Case-sensitivity workaround: try common variations
                const variations = new Set([
                    searchQuery,
                    searchQuery.toLowerCase(),
                    searchQuery.charAt(0).toUpperCase() + searchQuery.slice(1).toLowerCase(), // Title Case
                    searchQuery.toUpperCase()
                ]);
                const queries = Array.from(variations).filter(q => q.length >= 2);

                for (const section of spineItems) {
                    try {
                        for (const q of queries) {
                            const matches = await section.find(q);
                            if (matches && matches.length > 0) {
                                results.push(...matches);
                            }
                        }
                    } catch (err) {
                        // ignore
                    }
                }

                // Deduplicate by CFI
                const uniqueResults = new Map();
                results.forEach(r => {
                    if (!uniqueResults.has(r.cfi)) {
                        uniqueResults.set(r.cfi, r);
                    }
                });

                setSearchResults(Array.from(uniqueResults.values()).map((r: any) => ({
                    cfi: r.cfi,
                    excerpt: r.excerpt
                })));
            } catch (e) {
                console.error("Search failed", e);
                setSearchResults([]);
            } finally {
                setIsSearching(false);
            }
        };


        const timeout = setTimeout(doSearch, 800); // Debounce
        return () => clearTimeout(timeout);
    }, [searchQuery, rendition]);

    if (!persistedBookData) {
        return (
            <div className="h-screen w-full flex items-center justify-center">
                <Loader2 className="animate-spin" />
            </div>
        );
    }

    if (!url) return (
        <div className="h-screen w-full flex items-center justify-center">
            <Loader2 className="animate-spin" />
        </div>
    );

    const activeTheme = getTheme(settings.theme);
    const ownStyles: IReactReaderStyle = {
        ...ReactReaderStyle,
        container: {
            ...ReactReaderStyle.container,
            overflow: 'hidden',
            width: '100%',
            height: '100%',
        },
        readerArea: {
            ...ReactReaderStyle.readerArea,
            backgroundColor: activeTheme.bg,
            transition: 'background-color 0.3s ease',
        },
        titleArea: {
            ...ReactReaderStyle.titleArea,
            color: activeTheme.fg,
        },
        tocArea: {
            ...ReactReaderStyle.tocArea,
            color: activeTheme.fg,
            backgroundColor: activeTheme.bg,
        },
        tocButtonExpanded: {
            ...ReactReaderStyle.tocButtonExpanded,
            color: activeTheme.fg,
        },
        tocButtonBar: {
            ...ReactReaderStyle.tocButtonBar,
            background: activeTheme.fg,
        },
        arrow: {
            ...ReactReaderStyle.arrow,
            color: activeTheme.fg,
            display: isMobile ? 'none' : 'block',
            zIndex: 10, // Boost z-index for Firefox
            cursor: 'pointer',
            pointerEvents: 'auto',
        }
    };

    return (
        <div className="h-screen w-full bg-background relative">
            <AnimatePresence>
                {/* Controls Container */}
                {/* Controls Container */}
                {(!isFocusMode || isMobile) && (
                    <>
                        {/* Close Button */}
                        <motion.button
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            onClick={closeBook}
                            className={`
                            absolute z-[100] p-2 bg-background/80 backdrop-blur-md rounded-full border border-border/50 shadow-sm text-foreground hover:bg-accent transition-colors
                            ${isMobile ? 'top-3 left-3' : 'top-5 left-6'}
                        `}
                            title="Back to Library"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="m15 18-6-6 6-6" />
                            </svg>
                            <span className="sr-only">Close Book</span>
                        </motion.button>

                        {/* Focus Mode Toggle (Desktop Only) */}
                        {!isMobile && (
                            <motion.button
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                onClick={() => {
                                    setFocusMode(true);
                                }}
                                className="absolute z-[100] top-5 left-20 p-2 bg-background/80 backdrop-blur-md rounded-full border border-border/50 shadow-sm text-foreground hover:bg-accent transition-colors"
                                title="Enter Focus Mode"
                            >
                                <Maximize2 className="w-5 h-5" />
                            </motion.button>
                        )}
                    </>
                )}
            </AnimatePresence>

            {/* Exit Focus Mode Button (Only when controls hidden) */}
            {isFocusMode && !isMobile && (
                <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    whileHover={{ scale: 1.1 }}
                    onClick={() => setFocusMode(false)}
                    className="absolute z-[100] top-5 right-6 p-2 bg-background/50 backdrop-blur-md rounded-full border border-border/20 shadow-sm text-muted-foreground hover:text-foreground hover:bg-background/80 transition-all"
                    title="Exit Focus Mode"
                >
                    <Minimize2 className="w-5 h-5" />
                </motion.button>
            )}

            <div style={{ height: '100vh', position: 'relative' }}>
                <ReactReader
                    url={url}
                    swipeable={false} // Custom edge-swipe implemented manually
                    location={persistedLocation}
                    locationChanged={locationChanged}
                    tocChanged={(toc) => setToc(toc)}
                    showToc={false}
                    readerStyles={ownStyles}
                    getRendition={(rendition) => {
                        renditionRef.current = rendition;
                        setRendition(rendition);
                        if (rendition?.hooks?.content) {
                            rendition.hooks.content.register((contents: any) => {
                                const w = contents.window;
                                w.addEventListener('wheel', handleWheel);

                                // Custom Edge Swipe Logic (to allow text selection in center)
                                let touchStartX = 0;
                                let touchStartY = 0;

                                w.addEventListener('touchstart', (e: any) => {
                                    touchStartX = e.changedTouches[0].clientX; // use clientX for internal coords
                                    touchStartY = e.changedTouches[0].clientY;
                                }, { passive: true });

                                w.addEventListener('touchend', (e: any) => {
                                    const touchEndX = e.changedTouches[0].clientX;
                                    const touchEndY = e.changedTouches[0].clientY;

                                    const diffX = touchStartX - touchEndX;
                                    const diffY = touchStartY - touchEndY;

                                    // Use innerWidth of the iframe window
                                    const width = w.innerWidth;

                                    // Ignore if mostly vertical gesture
                                    if (Math.abs(diffY) > Math.abs(diffX)) return;

                                    // Threshold
                                    if (Math.abs(diffX) < 40) return;

                                    // Edge Zones: 20%
                                    const isEdge = touchStartX < width * 0.2 || touchStartX > width * 0.8;

                                    if (isEdge) {
                                        if (diffX > 0) {
                                            rendition.next();
                                        } else {
                                            rendition.prev();
                                        }
                                    }
                                }, { passive: true });

                                // DISABLE NATIVE MENU
                                w.document.addEventListener('contextmenu', (e: Event) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    return false;
                                });

                                // Inject Font on load
                                const { fontFamily } = useSettingsStore.getState();
                                const fontUrl = getFontUrl(fontFamily);
                                const doc = contents.document;

                                // Inject Font Link
                                if (fontUrl) {
                                    const link = doc.createElement('link');
                                    link.id = 'reader-font-link';
                                    link.rel = 'stylesheet';
                                    link.href = fontUrl;
                                    doc.head.appendChild(link);
                                }

                            });
                        }
                    }}
                    epubInitOptions={{
                        openAs: 'epub',
                    }}
                />
            </div>

            <AnimatePresence>
                {(!isFocusMode || isMobile) && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="absolute bottom-0 left-0 right-0 z-40 pointer-events-none"
                    >
                        <div className="h-1 w-full bg-foreground/10 backdrop-blur-sm">
                            <div
                                className="h-full bg-primary transition-all duration-300 ease-out"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        <div className="absolute bottom-3 left-6 text-[10px] font-medium text-muted-foreground bg-background/50 backdrop-blur-md px-2 py-1 rounded-full border border-border/20">
                            {progress}% Read
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Context Menu */}
            <ContextMenu
                visible={!!selection}
                x={selection?.x || 0}
                y={selection?.y || 0}
                onClose={() => setSelection(null)}
                onHighlight={handleHighlight}
                onCopy={handleCopy}
                onDelete={handleDelete}
                onDefine={handleDefine}
                isEditing={selection?.isEditing}
            />

            {/* Definition Modal */}
            <DefinitionModal />
        </div>
    );
};
