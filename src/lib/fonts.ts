
export interface FontDefinition {
    name: string;
    value: string;
    category: 'Serif' | 'Sans-Serif' | 'Display' | 'Handwriting' | 'Monospace';
    url?: string; // Google Fonts URL usually
}

export const AVAILABLE_FONTS: FontDefinition[] = [
    // Sans-Serif (Reading)
    { name: 'System UI', value: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif', category: 'Sans-Serif' },
    { name: 'Inter', value: '"Inter", sans-serif', category: 'Sans-Serif', url: 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;700&display=swap' },
    { name: 'Roboto', value: '"Roboto", sans-serif', category: 'Sans-Serif', url: 'https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap' },
    { name: 'Open Sans', value: '"Open Sans", sans-serif', category: 'Sans-Serif', url: 'https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;600&display=swap' },
    { name: 'Lato', value: '"Lato", sans-serif', category: 'Sans-Serif', url: 'https://fonts.googleapis.com/css2?family=Lato:wght@300;400;700&display=swap' },
    { name: 'Montserrat', value: '"Montserrat", sans-serif', category: 'Sans-Serif', url: 'https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;600&display=swap' },

    // Serif (Reading)
    { name: 'Merriweather', value: '"Merriweather", serif', category: 'Serif', url: 'https://fonts.googleapis.com/css2?family=Merriweather:wght@300;400;700&display=swap' },
    { name: 'Playfair Display', value: '"Playfair Display", serif', category: 'Serif', url: 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600&display=swap' },
    { name: 'Georgia', value: 'Georgia, serif', category: 'Serif' },
    { name: 'Times New Roman', value: '"Times New Roman", Times, serif', category: 'Serif' },
    { name: 'Lora', value: '"Lora", serif', category: 'Serif', url: 'https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;1,400&display=swap' },
    { name: 'Crimson Text', value: '"Crimson Text", serif', category: 'Serif', url: 'https://fonts.googleapis.com/css2?family=Crimson+Text:wght@400;600&display=swap' },

    // Display / Fancy
    { name: 'Lobster', value: '"Lobster", cursive', category: 'Display', url: 'https://fonts.googleapis.com/css2?family=Lobster&display=swap' },
    { name: 'Comfortaa', value: '"Comfortaa", cursive', category: 'Display', url: 'https://fonts.googleapis.com/css2?family=Comfortaa:wght@400;700&display=swap' },
    { name: 'Abril Fatface', value: '"Abril Fatface", cursive', category: 'Display', url: 'https://fonts.googleapis.com/css2?family=Abril+Fatface&display=swap' },

    // Handwriting / Cursive
    { name: 'Dancing Script', value: '"Dancing Script", cursive', category: 'Handwriting', url: 'https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400;700&display=swap' },
    { name: 'Pacifico', value: '"Pacifico", cursive', category: 'Handwriting', url: 'https://fonts.googleapis.com/css2?family=Pacifico&display=swap' },
    { name: 'Great Vibes', value: '"Great Vibes", cursive', category: 'Handwriting', url: 'https://fonts.googleapis.com/css2?family=Great+Vibes&display=swap' },
    { name: 'Caveat', value: '"Caveat", cursive', category: 'Handwriting', url: 'https://fonts.googleapis.com/css2?family=Caveat:wght@400;700&display=swap' },

    // Monospace
    { name: 'Fira Code', value: '"Fira Code", monospace', category: 'Monospace', url: 'https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;600&display=swap' },
    { name: 'Space Mono', value: '"Space Mono", monospace', category: 'Monospace', url: 'https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap' },
];

export const getFontUrl = (fontFamily: string) => {
    const font = AVAILABLE_FONTS.find(f => f.value === fontFamily || f.name === fontFamily);
    return font?.url;
};
