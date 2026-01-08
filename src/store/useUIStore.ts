import { create } from 'zustand';

type Tab = 'toc' | 'search' | 'annotations' | 'appearance' | 'themes' | 'settings' | 'stats' | null;

interface UIStore {
    isSidebarOpen: boolean;
    activeTab: Tab;
    isFocusMode: boolean;
    toggleSidebar: (tab?: Tab) => void;
    closeSidebar: () => void;
    setFocusMode: (isFocus: boolean) => void;
    definitionModal: {
        isOpen: boolean;
        word: string;
        position: { x: number; y: number };
    };
    openDefinition: (word: string, position: { x: number; y: number }) => void;
    closeDefinition: () => void;
}

export const useUIStore = create<UIStore>((set, get) => ({
    isSidebarOpen: false,
    activeTab: null,
    isFocusMode: false,

    toggleSidebar: (tab) => {
        const { isSidebarOpen, activeTab } = get();

        // If clicking the same tab, toggle close
        if (isSidebarOpen && activeTab === tab) {
            set({ isSidebarOpen: false, activeTab: null });
        }
        // If sidebar is closed, open it with tab
        else {
            set({ isSidebarOpen: true, activeTab: tab || 'toc', isFocusMode: false }); // Exit focus mode if opening sidebar
        }
    },

    closeSidebar: () => {
        set({ isSidebarOpen: false, activeTab: null });
    },

    setFocusMode: (isFocus: boolean) => {
        set({ isFocusMode: isFocus, isSidebarOpen: isFocus ? false : get().isSidebarOpen });
    },

    definitionModal: {
        isOpen: false,
        word: '',
        position: { x: 0, y: 0 }
    },

    openDefinition: (word: string, position: { x: number, y: number }) => {
        set({ definitionModal: { isOpen: true, word, position } });
    },

    closeDefinition: () => {
        set((state) => ({
            definitionModal: { ...state.definitionModal, isOpen: false }
        }));
    }
}));
