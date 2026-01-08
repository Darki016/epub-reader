'use client';

import { motion } from 'framer-motion';
import { Copy, Highlighter, Trash2, X, Underline as UnderlineIcon, BookOpen } from 'lucide-react';
import { useEffect, useRef } from 'react';

interface ContextMenuProps {
    x: number;
    y: number;
    onClose: () => void;
    onHighlight: (color: string) => void;
    onCopy: () => void;
    onDelete?: () => void;
    onDefine?: () => void;
    visible: boolean;
    isEditing?: boolean;
}

export const ContextMenu = ({ x, y, onClose, onHighlight, onCopy, onDelete, onDefine, visible, isEditing }: ContextMenuProps) => {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                onClose();
            }
        };
        if (visible) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [visible, onClose]);

    if (!visible) return null;

    // Colors: Yellow, Green, Blue, Pink/Red
    const colors = [
        { id: 'yellow', value: '#cfbd4d66', label: 'Yellow' }, // Yellow with opacity
        { id: 'green', value: '#4dcf8566', label: 'Green' },
        { id: 'blue', value: '#4da8cf66', label: 'Blue' },
        { id: 'pink', value: '#cf4d9766', label: 'Pink' },
    ];

    // Adjust position to keep on screen
    const style = {
        top: y - 60 < 0 ? y + 20 : y - 60, // Show above if space, else below
        // Center horizontally (assuming ~200px width, so -100px offset)
        // We can't know exact width before render, but 200px is a safe bet for this menu
        left: x - 100 < 10 ? 10 : (x - 100),
    };

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed z-50 bg-popover/95 backdrop-blur-md border border-border shadow-2xl rounded-xl p-2 flex items-center gap-2"
            style={style}
        >
            <div className="flex items-center gap-1 border-r border-border/50 pr-2 mr-1">
                {colors.map((c) => (
                    <button
                        key={c.id}
                        onClick={() => onHighlight(c.id)}
                        className="w-6 h-6 rounded-full border border-black/10 hover:scale-110 transition-transform shadow-sm"
                        style={{ backgroundColor: c.value.replace('66', '') }}
                        title={`Highlight ${c.label}`}
                    />
                ))}
            </div>



            <button
                onClick={() => onDefine?.()}
                className="p-2 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-colors"
                title="Define Word"
            >
                <BookOpen className="w-4 h-4" />
            </button>

            <button
                onClick={onCopy}
                className="p-2 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-colors"
                title="Copy Text"
            >
                <Copy className="w-4 h-4" />
            </button>

            {/* Conditional Delete Button */}
            {isEditing && (
                <button
                    onClick={onDelete}
                    className="p-2 hover:bg-destructive/10 rounded-lg text-muted-foreground hover:text-destructive transition-colors ml-1 border-l border-border/50 pl-2"
                    title="Delete Annotation"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            )}
        </motion.div>
    );
};
