// The six multi-panel layouts of Neon Palms Cover Studio.
//
// A layout is a list of panels in unit space (fractions of the cover), so the
// same layout works at every export size. The renderer turns the unit rects
// into pixels and leaves a dark gutter between panels, the poster-grid look.

export const LAYOUTS = [
  {
    id: 'solo',
    name: 'Solo Hero',
    hint: 'One photo, full bleed',
    panels: [{ x: 0, y: 0, w: 1, h: 1 }],
  },
  {
    id: 'duo',
    name: 'Duo Split',
    hint: 'Two photos, side by side',
    panels: [
      { x: 0, y: 0, w: 0.5, h: 1 },
      { x: 0.5, y: 0, w: 0.5, h: 1 },
    ],
  },
  {
    id: 'triptych',
    name: 'Triptych',
    hint: 'Three tall strips',
    panels: [
      { x: 0, y: 0, w: 1 / 3, h: 1 },
      { x: 1 / 3, y: 0, w: 1 / 3, h: 1 },
      { x: 2 / 3, y: 0, w: 1 / 3, h: 1 },
    ],
  },
  {
    id: 'quad',
    name: 'Quad Grid',
    hint: 'Four photos, two by two',
    panels: [
      { x: 0, y: 0, w: 0.5, h: 0.5 },
      { x: 0.5, y: 0, w: 0.5, h: 0.5 },
      { x: 0, y: 0.5, w: 0.5, h: 0.5 },
      { x: 0.5, y: 0.5, w: 0.5, h: 0.5 },
    ],
  },
  {
    id: 'stack',
    name: 'Skyline Stack',
    hint: 'One wide hero, two below',
    panels: [
      { x: 0, y: 0, w: 1, h: 0.58 },
      { x: 0, y: 0.58, w: 0.5, h: 0.42 },
      { x: 0.5, y: 0.58, w: 0.5, h: 0.42 },
    ],
  },
  {
    id: 'banner',
    name: 'Wide Banner',
    hint: 'Tall portrait beside two wides',
    panels: [
      { x: 0, y: 0, w: 0.42, h: 1 },
      { x: 0.42, y: 0, w: 0.58, h: 0.5 },
      { x: 0.42, y: 0.5, w: 0.58, h: 0.5 },
    ],
  },
];

/** Finds a layout by id, falling back to the first one. */
export function layoutById(id) {
  return LAYOUTS.find((l) => l.id === id) || LAYOUTS[0];
}

/**
 * Turns a layout's unit rects into pixel rects for a cover of W x H, leaving
 * a gutter of `g` pixels between panels (and none at the outer edge).
 */
export function panelRects(layout, W, H, g) {
  return layout.panels.map((p) => {
    const x = Math.round(p.x * W + (p.x > 0 ? g / 2 : 0));
    const y = Math.round(p.y * H + (p.y > 0 ? g / 2 : 0));
    const w = Math.round(p.w * W - (p.x > 0 ? g / 2 : 0) - (p.x + p.w < 1 ? g / 2 : 0));
    const h = Math.round(p.h * H - (p.y > 0 ? g / 2 : 0) - (p.y + p.h < 1 ? g / 2 : 0));
    return { x, y, w, h };
  });
}
