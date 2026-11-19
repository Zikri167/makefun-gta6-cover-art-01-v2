// The cover's state: one object the editor edits and the renderer draws.
//
// A panel holds the photo assigned to it (an HTMLImageElement or null) plus
// its crop: `zoom` scales the cover-fit photo, `ox`/`oy` pan it as fractions
// of the panel, so a crop survives every export size.

export const SIZES = {
  square: { id: 'square', name: 'Square 1080 x 1080', w: 1080, h: 1080 },
  portrait: { id: 'portrait', name: 'Portrait 1080 x 1350', w: 1080, h: 1350 },
  wide: { id: 'wide', name: 'Wide 1920 x 1080', w: 1920, h: 1080 },
};

export const SAMPLES = [
  { id: 'pier', name: 'Pier', file: 'samples/pier.jpg' },
  { id: 'boulevard', name: 'Boulevard', file: 'samples/boulevard.jpg' },
  { id: 'sunset-strip', name: 'Sunset Strip', file: 'samples/sunset-strip.jpg' },
  { id: 'neon-alley', name: 'Neon Alley', file: 'samples/neon-alley.jpg' },
  { id: 'palm-dusk', name: 'Palm Dusk', file: 'samples/palm-dusk.jpg' },
];

/** Four panel slots; a layout uses the first of them it needs. */
export function emptyPanels() {
  return [
    { img: null, src: '', zoom: 1, ox: 0, oy: 0 },
    { img: null, src: '', zoom: 1, ox: 0, oy: 0 },
    { img: null, src: '', zoom: 1, ox: 0, oy: 0 },
    { img: null, src: '', zoom: 1, ox: 0, oy: 0 },
  ];
}

export function freshState() {
  return {
    layout: 'triptych',
    grade: 'vice',
    posterise: false,
    size: 'wide',
    caption: 'NEON PALMS',
    subtitle: 'Vice City nights',
    panels: emptyPanels(),
    selected: 0,
  };
}

/** Loads an image from a URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('could not load ' + url));
    img.src = url;
  });
}
