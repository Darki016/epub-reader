'use client';

import { useUIStore } from '@/store/useUIStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { translations } from '@/lib/translations';
import { List, Search, Type, Sun, Settings, BarChart2 } from 'lucide-react';
import { clsx } from 'clsx';
// Note: 'highlighter' is not a valid lucide import in some versions, simpler to use Highlighter or Pen.
// However, looking at the user image, it's specific icons.
import { Highlighter as HighlighterIcon } from 'lucide-react';

export const Sidebar = () => {
    const activeTab = useUIStore((state) => state.activeTab);
    const toggleSidebar = useUIStore((state) => state.toggleSidebar);
    const settings = useSettingsStore();
    const t = translations[settings.language || 'en'];

    const SidebarIcon = ({
        icon: Icon,
        tab,
        label
    }: {
        icon: any;
        tab: 'toc' | 'search' | 'annotations' | 'appearance' | 'themes' | 'settings' | 'stats';
        label: string
    }) => (
        <button
            onClick={() => toggleSidebar(tab)}
            className={clsx(
                "p-3 rounded-xl transition-all duration-200 group relative flex items-center justify-center w-10 h-10 hover:scale-110 active:scale-95",
                activeTab === tab
                    ? "text-primary bg-foreground/10 shadow-[0_0_15px_rgba(0,0,0,0.1)] dark:shadow-[0_0_15px_rgba(255,255,255,0.1)]"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
            title={label}
        >
            <Icon className="w-5 h-5 stroke-[1.5]" />
            {activeTab === tab && (
                <span className="absolute left-0 w-1 h-5 bg-primary rounded-r-full -ml-3 shadow-[0_0_10px_currentColor]" />
            )}
        </button>
    );

    return (
        <div className="h-full w-16 bg-background/60 backdrop-blur-md border-r border-border flex flex-col items-center py-6 gap-6 shadow-sm z-50">
            {/* Top Group */}
            <div className="flex flex-col gap-2">
                <SidebarIcon icon={List} tab="toc" label={t.sidebar.toc} />
                <SidebarIcon icon={Search} tab="search" label={t.sidebar.search} />
                <SidebarIcon icon={HighlighterIcon} tab="annotations" label={t.sidebar.annotations} />
            </div>

            <div className="flex-1" />

            {/* Bottom Group */}
            <div className="flex flex-col gap-2">
                <SidebarIcon icon={BarChart2} tab="stats" label="Statistics" />
                <SidebarIcon icon={Type} tab="appearance" label={t.sidebar.typography} />
                <SidebarIcon icon={Sun} tab="themes" label={t.sidebar.settings} />
                <button
                    onClick={() => toggleSidebar('settings')}
                    className={clsx(
                        "p-3 rounded-xl transition-all duration-200 group relative flex items-center justify-center w-10 h-10 hover:scale-110 active:scale-95",
                        activeTab === 'settings'
                            ? "text-primary bg-foreground/10"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                    title={t.sidebar.settings}
                >
                    <Settings className="w-5 h-5 stroke-[1.5]" />
                </button>
            </div>
        </div>
    );
};
