// Sunset and neon gradient-map grades for Neon Palms Cover Studio.
//
// A grade is a colour ramp: a photo's luminance is remapped through the ramp,
// which is what gives a cover its Vice City sunset or neon look. The ramp is
// baked into a 256-entry lookup table, so applying it is one pass over the
// panel's pixels. Posterise is a separate switch: it quantises the graded
// colours into a few flat levels for the ink-poster look.

export const GRADES = [
  {
    id: 'vice',
    name: 'Vice Sunset',
    stops: [
      [0.0, [26, 8, 44]],
      [0.35, [120, 30, 110]],
      [0.62, [235, 80, 110]],
      [0.85, [255, 170, 90]],
      [1.0, [255, 240, 200]],
    ],
  },
  {
    id: 'neon',
    name: 'Neon Pink',
    stops: [
      [0.0, [8, 4, 20]],
      [0.3, [70, 10, 90]],
      [0.55, [200, 30, 140]],
      [0.8, [255, 90, 190]],
      [1.0, [255, 220, 240]],
    ],
  },
  {
    id: 'drive',
    name: 'Ocean Drive',
    stops: [
      [0.0, [6, 24, 32]],
      [0.35, [16, 90, 110]],
      [0.6, [40, 170, 180]],
      [0.85, [150, 220, 200]],
      [1.0, [255, 240, 210]],
    ],
  },
  {
    id: 'gold',
    name: 'Gold Hour',
    stops: [
      [0.0, [30, 16, 8]],
      [0.35, [120, 70, 20]],
      [0.6, [220, 140, 40]],
      [0.85, [255, 200, 110]],
      [1.0, [255, 244, 214]],
    ],
  },
  {
    id: 'midnight',
    name: 'Midnight Drive',
    stops: [
      [0.0, [4, 6, 24]],
      [0.35, [24, 30, 90]],
      [0.6, [70, 70, 180]],
      [0.85, [140, 150, 255]],
      [1.0, [220, 235, 255]],
    ],
  },
  {
    id: 'bubble',
    name: 'Bubblegum',
    stops: [
      [0.0, [40, 8, 50]],
      [0.35, [140, 40, 110]],
      [0.6, [250, 110, 160]],
      [0.85, [255, 190, 190]],
      [1.0, [255, 248, 240]],
    ],
  },
];

/** Finds a grade by id, falling back to the first one. */
export function gradeById(id) {
  return GRADES.find((g) => g.id === id) || GRADES[0];
}

/** Builds the 256-entry lookup table for a grade's ramp. */
export function buildLookup(grade) {
  const lut = new Uint8Array(256 * 3);
  const stops = grade.stops;
  for (let i = 0; i < 256; i++) {
    const t = i / 255;
    let a = stops[0];
    let b = stops[stops.length - 1];
    for (let s = 0; s < stops.length - 1; s++) {
      if (t >= stops[s][0] && t <= stops[s + 1][0]) {
        a = stops[s];
        b = stops[s + 1];
        break;
      }
    }
    const span = b[0] - a[0] || 1;
    const f = Math.min(1, Math.max(0, (t - a[0]) / span));
    for (let c = 0; c < 3; c++) {
      lut[i * 3 + c] = Math.round(a[1][c] + (b[1][c] - a[1][c]) * f);
    }
  }
  return lut;
}

/**
 * Remaps an ImageData's pixels through the lookup table. When `levels` is a
 * number, the graded colours are quantised to that many flat levels first
 * (the posterise ink mode).
 */
export function applyGrade(imageData, lut, levels) {
  const px = imageData.data;
  const quant = levels && levels > 1 ? 255 / (levels - 1) : 0;
  for (let i = 0; i < px.length; i += 4) {
    const lum = Math.round(0.2126 * px[i] + 0.7152 * px[i + 1] + 0.0722 * px[i + 2]);
    const base = lum * 3;
    let r = lut[base];
    let g = lut[base + 1];
    let b = lut[base + 2];
    if (quant) {
      r = Math.round(r / quant) * quant;
      g = Math.round(g / quant) * quant;
      b = Math.round(b / quant) * quant;
    }
    px[i] = r;
    px[i + 1] = g;
    px[i + 2] = b;
  }
  return imageData;
}
