'use client';

import { useBookStore } from '@/store/useBookStore';
import { LibraryView } from '@/components/library/LibraryView';
import { ReaderView } from '@/components/reader/ReaderView';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';

export default function Home() {
  const currentBookKey = useBookStore((state) => state.currentBookKey);
  const initLibrary = useBookStore((state) => state.initLibrary);

  useEffect(() => {
    initLibrary();
  }, [initLibrary]);

  return (
    <AppLayout>
      <AnimatePresence mode="wait">
        {!currentBookKey ? (
          <motion.div
            key="library"
            // Coming back to library: Scale UP from 0.9 (Zoom out effect)
            initial={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            // Going to book: Scale UP to 1.1 (Zoom in effect)
            exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
            transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
            className="w-full h-full"
          >
            <LibraryView />
          </motion.div>
        ) : (
          <motion.div
            key="reader"
            // Opening book: Scale DOWN from 1.1 (Landing effect)
            initial={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            // Closing book: Scale DOWN to 0.95 (Shrinking away)
            exit={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
            transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
            className="w-full h-full"
          >
            <ReaderView />
          </motion.div>
        )}
      </AnimatePresence>
    </AppLayout>
  );
}
