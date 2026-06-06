import { Waves, Flame, CloudRain, Trees, Sailboat, AudioLines } from 'lucide-react';

// Bundled ambient loops. Drop matching .mp3 files into /public/audio/.
// The player is fully functional but silent for any file that is missing.
export const ASMR_TRACKS = [
  { id: 'waterfall', label: 'Waterfall', src: '/audio/waterfall.mp3', Icon: Waves },
  { id: 'fire', label: 'Fire crackling', src: '/audio/fire.mp3', Icon: Flame },
  { id: 'rain', label: 'Rain', src: '/audio/rain.mp3', Icon: CloudRain },
  { id: 'forest', label: 'Forest', src: '/audio/forest.mp3', Icon: Trees },
  { id: 'ocean', label: 'Ocean', src: '/audio/ocean.mp3', Icon: Sailboat },
  { id: 'white-noise', label: 'White noise', src: '/audio/white-noise.mp3', Icon: AudioLines },
];

export function getTrack(id) {
  return ASMR_TRACKS.find((t) => t.id === id) || null;
}
