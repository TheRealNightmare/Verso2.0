# Ambient (ASMR) reading sounds

Drop looping `.mp3` files here to power the reader's "Ambient sound" picker.
The player references these exact filenames (see
`src/components/reader/asmrTracks.js`):

- `waterfall.mp3` — Waterfall
- `fire.mp3` — Fire crackling
- `rain.mp3` — Rain
- `forest.mp3` — Forest
- `ocean.mp3` — Ocean
- `white-noise.mp3` — White noise

Files are served statically at `/audio/<name>.mp3`. Use seamless loops
(short, gapless clips work best). Any missing file simply shows in the UI
but stays silent until the file is added.
