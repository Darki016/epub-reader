import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface StatsStore {
    // Aggregated Stats
    totalReadingTimeMs: number;
    booksFinished: number;
    chaptersRead: number;
    sessionsCount: number;

    // Current Session
    currentSessionStartTime: number | null;

    // Actions
    startSession: () => void;
    endSession: () => void;
    incrementChaptersRead: () => void;
    incrementBooksFinished: () => void;
    resetStats: () => void;
}

export const useStatsStore = create<StatsStore>()(
    persist(
        (set, get) => ({
            totalReadingTimeMs: 0,
            booksFinished: 0,
            chaptersRead: 0,
            sessionsCount: 0,
            currentSessionStartTime: null,

            startSession: () => {
                if (!get().currentSessionStartTime) {
                    set({ currentSessionStartTime: Date.now() });
                }
            },

            endSession: () => {
                const startTime = get().currentSessionStartTime;
                if (startTime) {
                    const duration = Date.now() - startTime;
                    set((state) => ({
                        totalReadingTimeMs: state.totalReadingTimeMs + duration,
                        sessionsCount: state.sessionsCount + 1,
                        currentSessionStartTime: null
                    }));
                }
            },

            incrementChaptersRead: () => {
                set((state) => ({ chaptersRead: state.chaptersRead + 1 }));
            },

            incrementBooksFinished: () => {
                set((state) => ({ booksFinished: state.booksFinished + 1 }));
            },

            resetStats: () => {
                set({
                    totalReadingTimeMs: 0,
                    booksFinished: 0,
                    chaptersRead: 0,
                    sessionsCount: 0,
                    currentSessionStartTime: null
                });
            }
        }),
        {
            name: 'reading-stats'
        }
    )
);
