import { create } from 'zustand';
import { get as idbGet, set as idbSet, del as idbDel } from 'idb-keyval';
import ePub from 'epubjs';

export interface BookMetadata {
    key: string;
    title: string;
    author: string;
    addedAt: number;
    cover?: string | null; // Base64 or Blob URL for cover
    progress?: number; // 0-100 percentage
    annotations?: Annotation[];
}

export interface Annotation {
    id: string;
    cfiRange: string;
    text: string;
    color: string;
    type?: 'highlight' | 'underline';
    chapter?: string;
    created: number;
}

interface BookStore {
    // Library State
    library: BookMetadata[];
    isLibraryLoaded: boolean;

    // Reader State
    currentBookKey: string | null;
    bookData: ArrayBuffer | null;
    currentLocation: string | number | null;

    toc: any[]; // Table of Contents

    // Search State
    searchQuery: string;
    searchResults: { cfi: string; excerpt: string; }[];

    isSearching: boolean;
    temporaryHighlight: string | null;

    // Actions
    initLibrary: () => Promise<void>;
    addBook: (file: File) => Promise<void>;
    deleteBook: (key: string) => Promise<void>;
    openBook: (key: string) => Promise<void>;
    closeBook: () => void;
    updateLocation: (location: string | number) => void;
    updateBookProgress: (key: string, progress: number) => Promise<void>;

    setToc: (toc: any[]) => void;
    setSearchQuery: (query: string) => void;
    setSearchResults: (results: { cfi: string; excerpt: string; }[]) => void;

    setIsSearching: (isSearching: boolean) => void;
    setTemporaryHighlight: (cfi: string | null) => void;

    addAnnotation: (bookKey: string, annotation: Annotation) => void;
    removeAnnotation: (bookKey: string, id: string) => void;
}

export const useBookStore = create<BookStore>((set, get) => ({
    library: [],
    isLibraryLoaded: false,
    currentBookKey: null,
    bookData: null,
    currentLocation: null,

    toc: [],
    searchQuery: '',
    searchResults: [],

    isSearching: false,
    temporaryHighlight: null,

    setToc: (toc: any[]) => set({ toc }),
    setSearchQuery: (query: string) => set({ searchQuery: query }),
    setSearchResults: (results: any[]) => set({ searchResults: results }),

    setIsSearching: (isSearching: boolean) => set({ isSearching }),
    setTemporaryHighlight: (cfi: string | null) => set({ temporaryHighlight: cfi }),

    initLibrary: async () => {
        const library = await idbGet<BookMetadata[]>('library_index') || [];
        set({ library, isLibraryLoaded: true });
    },

    addBook: async (file: File) => {
        try {
            const buffer = await file.arrayBuffer();
            const key = `${file.name}-${file.size}`;

            // Basic Metadata Extraction using epubjs
            const book = ePub(buffer);
            const metadata = await book.loaded.metadata;
            const coverUrl = await book.coverUrl();

            let coverBase64: string | null = null;
            if (coverUrl) {
                try {
                    const response = await fetch(coverUrl);
                    const blob = await response.blob();
                    coverBase64 = await new Promise((resolve) => {
                        const reader = new FileReader();
                        reader.onloadend = () => resolve(reader.result as string);
                        reader.readAsDataURL(blob);
                    });
                } catch (e) {
                    console.warn('Failed to convert cover to base64', e);
                }
            }

            const newBook: BookMetadata = {
                key,
                title: metadata.title || file.name.replace('.epub', ''),
                author: metadata.creator || 'Unknown Author',
                addedAt: Date.now(),
                cover: coverBase64,
                annotations: [],
            };

            // Save Book Data
            await idbSet(`book_${key}`, buffer);

            // Update Library Index
            const currentLibrary = get().library;
            const updatedLibrary = [...currentLibrary.filter(b => b.key !== key), newBook];
            await idbSet('library_index', updatedLibrary);

            set({ library: updatedLibrary });

        } catch (err) {
            console.error('Failed to add book:', err);
        }
    },

    deleteBook: async (key: string) => {
        await idbDel(`book_${key}`);
        localStorage.removeItem(`loc_${key}`); // Fixed: Remove from LocalStorage, not IDB

        const updatedLibrary = get().library.filter(b => b.key !== key);
        await idbSet('library_index', updatedLibrary);

        set({ library: updatedLibrary });
        if (get().currentBookKey === key) {
            set({ currentBookKey: null, bookData: null, currentLocation: null });
        }
    },

    openBook: async (key: string) => {
        const buffer = await idbGet<ArrayBuffer>(`book_${key}`);
        if (buffer) {
            const savedLocation = localStorage.getItem(`loc_${key}`);
            // Safety check against "null" string or invalid data
            const validLocation = (savedLocation && savedLocation !== 'null' && savedLocation !== 'undefined')
                ? savedLocation
                : null;

            set({
                currentBookKey: key,
                bookData: buffer,
                currentLocation: validLocation
            });
        }
    },

    closeBook: () => {
        set({ currentBookKey: null, bookData: null, currentLocation: null, toc: [] });
    },

    updateLocation: (location: string | number) => {
        const { currentBookKey } = get();
        if (currentBookKey && location) {
            localStorage.setItem(`loc_${currentBookKey}`, String(location));
            set({ currentLocation: location });
        }
    },

    updateBookProgress: async (key: string, progress: number) => {
        const library = get().library;
        const bookIndex = library.findIndex(b => b.key === key);
        if (bookIndex === -1) return;

        const updatedBook = { ...library[bookIndex], progress };
        const updatedLibrary = [...library];
        updatedLibrary[bookIndex] = updatedBook;

        await idbSet('library_index', updatedLibrary);
        set({ library: updatedLibrary });
    },

    addAnnotation: async (bookKey, annotation) => {
        const library = get().library;
        const bookIndex = library.findIndex(b => b.key === bookKey);
        if (bookIndex === -1) return;

        const book = library[bookIndex];
        const updatedAnnotations = [...(book.annotations || []), annotation];
        const updatedBook = { ...book, annotations: updatedAnnotations };

        const updatedLibrary = [...library];
        updatedLibrary[bookIndex] = updatedBook;

        await idbSet('library_index', updatedLibrary);
        set({ library: updatedLibrary });
    },

    removeAnnotation: async (bookKey, id) => {
        const library = get().library;
        const bookIndex = library.findIndex(b => b.key === bookKey);
        if (bookIndex === -1) return;

        const book = library[bookIndex];
        const updatedAnnotations = (book.annotations || []).filter(a => a.id !== id);
        const updatedBook = { ...book, annotations: updatedAnnotations };

        const updatedLibrary = [...library];
        updatedLibrary[bookIndex] = updatedBook;

        await idbSet('library_index', updatedLibrary);
        set({ library: updatedLibrary });
    }
}));
