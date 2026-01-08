import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface SettingsStore {
    theme: 'light' | 'dark' | 'sepia' | 'night-blue' | 'forest' | 'solarized-light' | 'solarized-dark' | 'nord' | 'paper' | 'lavender';
    fontSize: number;
    fontFamily: string;
    fontWeight: number;
    lineHeight: number;
    pageView: 'single' | 'double';

    setTheme: (theme: SettingsStore['theme']) => void;
    setFontSize: (size: number) => void;
    setFontFamily: (family: string) => void;
    setFontWeight: (weight: number) => void;
    setLineHeight: (height: number) => void;
    setPageView: (view: 'single' | 'double') => void;

    language: 'en' | 'es' | 'de' | 'zh' | 'ja';
    setLanguage: (lang: 'en' | 'es' | 'de' | 'zh' | 'ja') => void;
}

export const useSettingsStore = create<SettingsStore>()(
    persist(
        (set) => ({
            theme: 'light',
            fontSize: 100,
            fontFamily: 'Helvetica, Arial, sans-serif',
            fontWeight: 400,
            lineHeight: 1.5,
            pageView: 'double',

            setTheme: (theme) => set({ theme }),
            setFontSize: (fontSize) => set({ fontSize }),
            setFontFamily: (fontFamily) => set({ fontFamily }),
            setFontWeight: (fontWeight) => set({ fontWeight }),
            setLineHeight: (lineHeight) => set({ lineHeight }),
            setPageView: (pageView) => set({ pageView }),

            language: 'en',
            setLanguage: (language) => set({ language }),
        }),
        {
            name: 'reader-settings',
        }
    )
);
