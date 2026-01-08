import { useBookStore } from '@/store/useBookStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { Search, BookOpen, Library } from 'lucide-react';
import { motion } from 'framer-motion';

export const SearchPanel = () => {
    const searchQuery = useBookStore((state) => state.searchQuery);
    const setSearchQuery = useBookStore((state) => state.setSearchQuery);
    const searchResults = useBookStore((state) => state.searchResults);
    const isSearching = useBookStore((state) => state.isSearching);
    const currentBookKey = useBookStore((state) => state.currentBookKey);
    const updateLocation = useBookStore((state) => state.updateLocation);
    const setTemporaryHighlight = useBookStore((state) => state.setTemporaryHighlight);

    // Derived state for display
    const mode = currentBookKey ? 'book' : 'library';

    return (
        <div className="flex flex-col h-full">
            <header className="mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2 mb-1">
                    <Search className="w-5 h-5 text-primary" />
                    Search
                </h2>
                <p className="text-xs text-muted-foreground">
                    {mode === 'book' ? 'Find in current book' : 'Filter library collection'}
                </p>
            </header>

            {/* Input Area */}
            <div className="relative mb-6">
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={mode === 'book' ? "Search content..." : "Search titles & authors..."}
                    className="w-full bg-muted/50 border border-border rounded-lg py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-muted-foreground/50"
                    autoFocus
                />
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground/50" />
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar -mx-2 px-2">
                {mode === 'library' && (
                    <div className="text-center text-sm text-muted-foreground py-8">
                        <Library className="w-8 h-8 mx-auto mb-3 opacity-20" />
                        <p>Type above to filter your library.</p>
                        <p className="text-xs opacity-50 mt-1">Results show in the main view.</p>
                    </div>
                )}

                {mode === 'book' && (
                    <div className="space-y-4">
                        {isSearching && (
                            <div className="text-center py-8">
                                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                                <p className="text-xs text-muted-foreground">Searching book...</p>
                            </div>
                        )}

                        {!isSearching && searchQuery && searchResults.length === 0 && (
                            <div className="text-center py-8 text-muted-foreground">
                                <p>No matches found.</p>
                            </div>
                        )}

                        <div className="space-y-2">
                            {searchResults.map((result, idx) => (
                                <motion.button
                                    key={idx}
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    onClick={() => {
                                        updateLocation(result.cfi);
                                        setTemporaryHighlight(result.cfi);
                                    }}
                                    className="w-full text-left p-3 rounded-lg hover:bg-muted/50 transition-colors border border-transparent hover:border-border group"
                                >
                                    <p className="text-sm font-serif leading-relaxed line-clamp-3 text-foreground/90 mb-1">
                                        "...{result.excerpt.trim()}..."
                                    </p>
                                    <div className="flex items-center justify-between mt-2">
                                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium group-hover:text-primary transition-colors">
                                            Jump to Match
                                        </span>
                                        <BookOpen className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                </motion.button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
