export const themes = [
    { id: 'light', bg: '#FFFFFF', fg: '#333333', name: 'Light' },
    { id: 'sepia', bg: '#F4ECD8', fg: '#5B4636', name: 'Sepia' },
    { id: 'dark', bg: '#1A1A1A', fg: '#CCCCCC', name: 'Dark' },
    { id: 'night-blue', bg: '#111B21', fg: '#E4E5F1', name: 'Night Blue' },
    { id: 'forest', bg: '#2E3B33', fg: '#E8F5E9', name: 'Forest' },
    { id: 'solarized-light', bg: '#FDF6E3', fg: '#657B83', name: 'Solarized Light' },
    { id: 'solarized-dark', bg: '#002B36', fg: '#839496', name: 'Solarized Dark' },
    { id: 'nord', bg: '#2E3440', fg: '#D8DEE9', name: 'Nord' },
    { id: 'paper', bg: '#F5F5F0', fg: '#2A2A2A', name: 'Paper' },
    { id: 'lavender', bg: '#F3E5F5', fg: '#4A148C', name: 'Lavender' },
] as const;

export type ThemeId = typeof themes[number]['id'];

export const getTheme = (id: string) => themes.find((t) => t.id === id) || themes[0];
