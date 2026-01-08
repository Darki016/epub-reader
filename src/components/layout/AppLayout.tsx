'use client';

import { ReactNode } from 'react';
import { Sidebar } from '../sidebar/Sidebar';
import { SidebarPanel } from '../sidebar/SidebarPanel';
import { motion, AnimatePresence } from 'framer-motion';
import { useUIStore } from '@/store/useUIStore';
import { useEffect, useState } from 'react';
import { useSettingsStore } from '@/store/useSettingsStore';
import { getTheme } from '@/lib/themes';

export const AppLayout = ({ children }: { children: ReactNode }) => {
    const isSidebarOpen = useUIStore((state) => state.isSidebarOpen);

    const settings = useSettingsStore();

    useEffect(() => {
        const { theme } = settings;
        const activeTheme = getTheme(theme);
        const colors = { bg: activeTheme.bg, fg: activeTheme.fg };

        // Helper for Hex Alpha
        const addAlpha = (hex: string, alpha: string) => {
            if (hex.match(/^#[0-9A-Fa-f]{6}$/)) return `${hex}${alpha}`;
            return hex;
        };

        // Apply Global Theme Constants
        document.documentElement.style.setProperty('--background', colors.bg);
        document.documentElement.style.setProperty('--foreground', colors.fg);
        document.documentElement.style.setProperty('--card', colors.bg);
        document.documentElement.style.setProperty('--card-foreground', colors.fg);
        document.documentElement.style.setProperty('--popover', colors.bg);
        document.documentElement.style.setProperty('--popover-foreground', colors.fg);

        document.documentElement.style.setProperty('--muted', addAlpha(colors.fg, '10'));
        document.documentElement.style.setProperty('--muted-foreground', addAlpha(colors.fg, '99'));
        document.documentElement.style.setProperty('--border', addAlpha(colors.fg, '20'));
        document.documentElement.style.setProperty('--input', addAlpha(colors.fg, '20'));
    }, [settings.theme]);

    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    return (
        <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground transition-colors duration-300 relative">
            {/* 1. Persistent Icon Strip (Left) */}
            <AnimatePresence>
                {!useUIStore((state) => state.isFocusMode) && (
                    <motion.div
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: 'auto', opacity: 1 }}
                        exit={{ width: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="flex-shrink-0 z-50 h-full bg-background border-r border-border overflow-hidden"
                    >
                        <Sidebar />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 2. Expandable Panel (Slide out) */}
            <AnimatePresence>
                {isSidebarOpen && (
                    <motion.div
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: isMobile ? 'calc(100vw - 4rem)' : 320, opacity: 1 }}
                        exit={{ width: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                        className={`flex-shrink-0 border-r border-border bg-card overflow-hidden z-40 shadow-xl ${isMobile ? 'absolute left-16 h-full' : 'relative'}`}
                    >
                        <div className="w-full h-full overflow-hidden">
                            <SidebarPanel />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 3. Main Content Area */}
            <div className="flex-1 relative overflow-hidden transition-all duration-300">
                {children}
            </div>
        </div>
    );
};
