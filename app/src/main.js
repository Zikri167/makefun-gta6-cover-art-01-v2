// Boots Neon Palms Cover Studio: fonts, a starter scene, the editor.
//
// A `?shot=` query sets up a fixed scene for a screenshot instead of the
// default editor: `shot=cover` hides the controls and paints one cover,
// `shot=editor` shows the editor with a photo loaded. Either way,
// `window.__shotReady` is set once the cover is painted.

import { freshState, loadImage, SAMPLES } from './state.js';
import { layoutById } from './layouts.js';
import { gradeById } from './grades.js';
import { SIZES } from './state.js';
import { drawCover } from './render.js';
import { initEditor } from './editor.js';

const canvas = document.getElementById('cover');
const state = freshState();

/** Loads the bundled fonts so the lettering draws in Anton and Pacifico. */
async function readyFonts() {
  try {
    await Promise.all([
      document.fonts.load('400 40px Anton'),
      document.fonts.load('400 40px Pacifico'),
      document.fonts.ready,
    ]);
  } catch {
    // The cover still draws with the fallback fonts.
  }
}

/** Assigns sample photos to the first panels of the current layout. */
async function loadSamples(ids) {
  const layout = layoutById(state.layout);
  for (let i = 0; i < layout.panels.length; i++) {
    const sample = SAMPLES.find((s) => s.id === ids[i % ids.length]);
    if (!sample) continue;
    try {
      state.panels[i].img = await loadImage(sample.file);
      state.panels[i].src = sample.id;
    } catch {
      // A missing sample leaves its panel empty.
    }
  }
}

/** Paints once, then flags the shot ready for the screenshot runner. */
function finishShot() {
  requestAnimationFrame(() => requestAnimationFrame(() => {
    window.__shotReady = true;
  }));
}

async function boot() {
  await readyFonts();
  const query = new URLSearchParams(location.search);
  const shot = query.get('shot');
  const photos = (query.get('photos') || 'pier,boulevard,sunset-strip').split(',');
  state.layout = layoutById(query.get('layout') || 'triptych').id;
  state.grade = gradeById(query.get('grade') || 'vice').id;
  state.posterise = query.get('posterise') === '1';
  state.size = (SIZES[query.get('size')] || SIZES.wide).id;
  state.caption = query.get('caption') || 'NEON PALMS';
  state.subtitle = query.get('subtitle') || 'Vice City nights';
  await loadSamples(photos);

  if (shot === 'cover') {
    document.body.classList.add('shot-cover');
    drawCover(canvas, state, 1, -1);
    finishShot();
    return;
  }
  if (shot === 'editor') {
    initEditor(state, canvas);
    finishShot();
    return;
  }
  initEditor(state, canvas);
}

boot();
