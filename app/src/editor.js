// Wires the editor: every control edits the state, every state change
// redraws the live preview. The preview canvas is the cover itself — click a
// panel to pick it, drag to pan its photo, scroll to zoom it.

import { LAYOUTS, layoutById, panelRects } from './layouts.js';
import { GRADES, gradeById } from './grades.js';
import { SIZES, SAMPLES, loadImage } from './state.js';
import { drawCover, exportCanvas } from './render.js';

/** The preview backing store is at most 960 px on its long side. */
function previewScale(state) {
  const size = SIZES[state.size] || SIZES.wide;
  return Math.min(1, 960 / Math.max(size.w, size.h));
}

function el(tag, text, cls) {
  const n = document.createElement(tag);
  if (text !== undefined) n.textContent = text;
  if (cls) n.className = cls;
  return n;
}

export function initEditor(state, canvas) {
  const $ = (id) => document.getElementById(id);
  let raf = 0;
  let lastPhoto = null;

  function redraw() {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      drawCover(canvas, state, previewScale(state), state.selected);
    });
  }

  // --- layout chips -------------------------------------------------------
  const layoutBox = $('layouts');
  LAYOUTS.forEach((l) => {
    const b = el('button', l.name, 'chip');
    b.type = 'button';
    b.title = l.hint;
    b.addEventListener('click', () => {
      state.layout = l.id;
      state.selected = 0;
      syncChips();
      redraw();
    });
    layoutBox.appendChild(b);
  });

  // --- grade chips + posterise --------------------------------------------
  const gradeBox = $('grades');
  GRADES.forEach((g) => {
    const b = el('button', g.name, 'chip');
    b.type = 'button';
    b.addEventListener('click', () => {
      state.grade = g.id;
      syncChips();
      redraw();
    });
    gradeBox.appendChild(b);
  });
  $('posterise').addEventListener('change', (e) => {
    state.posterise = e.target.checked;
    redraw();
  });

  // --- size chips -----------------------------------------------------------
  const sizeBox = $('sizes');
  Object.values(SIZES).forEach((s) => {
    const b = el('button', s.name, 'chip');
    b.type = 'button';
    b.addEventListener('click', () => {
      state.size = s.id;
      syncChips();
      redraw();
    });
    sizeBox.appendChild(b);
  });

  // --- words ----------------------------------------------------------------
  $('caption').addEventListener('input', (e) => {
    state.caption = e.target.value;
    redraw();
  });
  $('subtitle').addEventListener('input', (e) => {
    state.subtitle = e.target.value;
    redraw();
  });

  // --- panel tabs -----------------------------------------------------------
  const tabsBox = $('panelTabs');
  function syncTabs() {
    tabsBox.replaceChildren();
    const layout = layoutById(state.layout);
    layout.panels.forEach((_, i) => {
      const b = el('button', 'Panel ' + (i + 1), 'chip' + (i === state.selected ? ' on' : ''));
      b.type = 'button';
      b.addEventListener('click', () => {
        state.selected = i;
        syncTabs();
        syncZoom();
        redraw();
      });
      tabsBox.appendChild(b);
    });
  }

  // --- photo: upload, samples, fill all -------------------------------------
  $('upload').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const img = await loadImage(URL.createObjectURL(file));
      assignPhoto(img, file.name);
    } catch {
      $('status').textContent = 'That file did not load as a photo.';
    }
  });

  const sampleBox = $('samples');
  SAMPLES.forEach((s) => {
    const b = el('button', s.name, 'chip');
    b.type = 'button';
    b.addEventListener('click', async () => {
      try {
        const img = await loadImage(s.file);
        assignPhoto(img, s.id);
      } catch {
        $('status').textContent = 'Sample ' + s.name + ' did not load.';
      }
    });
    sampleBox.appendChild(b);
  });

  $('fillAll').addEventListener('click', () => {
    const src = state.panels[state.selected];
    if (!src.img) return;
    state.panels.forEach((p) => {
      p.img = src.img;
      p.src = src.src;
      p.zoom = 1;
      p.ox = 0;
      p.oy = 0;
    });
    redraw();
  });

  function assignPhoto(img, src) {
    const p = state.panels[state.selected];
    p.img = img;
    p.src = src;
    p.zoom = 1;
    p.ox = 0;
    p.oy = 0;
    lastPhoto = { img, src };
    syncZoom();
    redraw();
  }

  // --- zoom slider + reset ---------------------------------------------------
  const zoom = $('zoom');
  function syncZoom() {
    zoom.value = String(state.panels[state.selected].zoom);
  }
  zoom.addEventListener('input', () => {
    state.panels[state.selected].zoom = Number(zoom.value);
    redraw();
  });
  $('resetView').addEventListener('click', () => {
    const p = state.panels[state.selected];
    p.zoom = 1;
    p.ox = 0;
    p.oy = 0;
    syncZoom();
    redraw();
  });

  // --- export ------------------------------------------------------------------
  $('export').addEventListener('click', () => {
    const size = SIZES[state.size];
    exportCanvas(state).toBlob((blob) => {
      if (!blob) return;
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `neon-palms-${size.w}x${size.h}.png`;
      a.click();
      $('status').textContent = `Saved neon-palms-${size.w}x${size.h}.png`;
    }, 'image/png');
  });

  // --- pointer: pick, drag, zoom on the preview --------------------------------
  let drag = null;
  function canvasPoint(e) {
    const r = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - r.left) / r.width) * canvas.width,
      y: ((e.clientY - r.top) / r.height) * canvas.height,
    };
  }
  function rectsNow() {
    const size = SIZES[state.size] || SIZES.wide;
    const scale = previewScale(state);
    return panelRects(
      layoutById(state.layout),
      Math.round(size.w * scale),
      Math.round(size.h * scale),
      Math.max(2, Math.round(size.w * scale * 0.008)),
    );
  }
  canvas.addEventListener('pointerdown', (e) => {
    const pt = canvasPoint(e);
    const rects = rectsNow();
    const hit = rects.findIndex(
      (r) => pt.x >= r.x && pt.x < r.x + r.w && pt.y >= r.y && pt.y < r.y + r.h,
    );
    if (hit < 0) return;
    state.selected = hit;
    syncTabs();
    syncZoom();
    drag = { panel: state.panels[hit], rect: rects[hit], x: pt.x, y: pt.y };
    canvas.setPointerCapture(e.pointerId);
    redraw();
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const pt = canvasPoint(e);
    drag.panel.ox += (pt.x - drag.x) / drag.rect.w;
    drag.panel.oy += (pt.y - drag.y) / drag.rect.h;
    drag.panel.ox = Math.max(-0.6, Math.min(0.6, drag.panel.ox));
    drag.panel.oy = Math.max(-0.6, Math.min(0.6, drag.panel.oy));
    drag.x = pt.x;
    drag.y = pt.y;
    redraw();
  });
  canvas.addEventListener('pointerup', () => { drag = null; });
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const p = state.panels[state.selected];
    p.zoom = Math.max(1, Math.min(3, p.zoom * Math.exp(-e.deltaY * 0.0012)));
    syncZoom();
    redraw();
  }, { passive: false });

  // --- chip highlight ---------------------------------------------------------
  function syncChips() {
    [...layoutBox.children].forEach((b, i) => b.classList.toggle('on', LAYOUTS[i].id === state.layout));
    [...gradeBox.children].forEach((b, i) => b.classList.toggle('on', GRADES[i].id === state.grade));
    [...sizeBox.children].forEach((b) => b.classList.toggle('on', b.textContent === SIZES[state.size].name));
    syncTabs();
  }

  // Exposed for screenshots and tests: the same export path as the button.
  window.__neonPalms = {
    state,
    redraw,
    exportPNG() {
      return new Promise((resolve) => {
        exportCanvas(state).toBlob((blob) => {
          const r = new FileReader();
          r.onload = () => resolve(r.result);
          r.readAsDataURL(blob);
        }, 'image/png');
      });
    },
    lastPhoto: () => lastPhoto,
  };

  syncChips();
  syncZoom();
  redraw();
  return { redraw };
}
