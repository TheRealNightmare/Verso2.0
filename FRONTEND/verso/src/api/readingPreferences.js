import { apiFetch } from './auth';

// Reader settings (font size, background theme, ASMR audio, narrator voice/speed)
// synced to the user's account. Shaped server-side with camelCase keys:
//   { fontScale, theme, bgColor, textColor, asmrTrack, asmrVolume,
//     narratorVoice, narratorRate }

export function getReadingPreferences() {
  return apiFetch('/reading-preferences');
}

export function updateReadingPreferences(partial) {
  // Convert camelCase keys back to the snake_case the API validates.
  const map = {
    fontScale: 'font_scale',
    theme: 'theme',
    bgColor: 'bg_color',
    textColor: 'text_color',
    asmrTrack: 'asmr_track',
    asmrVolume: 'asmr_volume',
    narratorVoice: 'narrator_voice',
    narratorRate: 'narrator_rate',
  };
  const body = {};
  for (const [key, value] of Object.entries(partial)) {
    if (map[key]) body[map[key]] = value;
  }
  return apiFetch('/reading-preferences', {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}
