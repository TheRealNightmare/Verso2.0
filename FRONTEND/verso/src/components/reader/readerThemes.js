// Coordinated background + text colour presets for the reader. Each preset keeps
// text readable against its background. The custom theme uses the user-picked
// bgColor / textColor instead.

export const READER_THEMES = [
  { id: 'light', label: 'Light', bg: '#f8f6f2', text: '#2c3e50' },
  { id: 'sepia', label: 'Sepia', bg: '#f4ecd8', text: '#5b4636' },
  { id: 'mist', label: 'Mist', bg: '#e7edf2', text: '#2c3e50' },
  { id: 'dark', label: 'Dark', bg: '#1c1f24', text: '#d7dae0' },
];

export const DEFAULT_CUSTOM_BG = '#f8f6f2';
export const DEFAULT_CUSTOM_TEXT = '#2c3e50';

// Resolve the active { bg, text } pair from the current settings.
export function getThemeColors({ theme, bgColor, textColor } = {}) {
  if (theme === 'custom') {
    return {
      bg: bgColor || DEFAULT_CUSTOM_BG,
      text: textColor || DEFAULT_CUSTOM_TEXT,
    };
  }
  const preset = READER_THEMES.find((t) => t.id === theme) || READER_THEMES[0];
  return { bg: preset.bg, text: preset.text };
}
