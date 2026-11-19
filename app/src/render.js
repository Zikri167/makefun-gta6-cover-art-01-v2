// Draws the cover: panels, grade, caption lettering, all on one canvas.
//
// `drawCover` renders at the export size times `scale` (scale 1 for the PNG
// the app exports, a smaller scale for the live preview, which is the same
// drawing at fewer pixels). Photos are drawn cover-fit into their panel,
// panned and zoomed by the panel's crop, then graded panel by panel.

import { gradeById, buildLookup, applyGrade } from './grades.js';
import { layoutById, panelRects } from './layouts.js';
import { SIZES } from './state.js';

const GUTTER = '#0a0612';
const temp = document.createElement('canvas');
const tempCtx = temp.getContext('2d');

/** Fits a font size so `text` fits inside `maxWidth` on `ctx`. */
function fitFont(ctx, text, family, start, maxWidth, weight) {
  let size = start;
  ctx.font = `${weight} ${size}px ${family}`;
  while (size > 10 && ctx.measureText(text).width > maxWidth) {
    size -= 2;
    ctx.font = `${weight} ${size}px ${family}`;
  }
  return size;
}

/** Draws one photo cover-fit into a rect, panned and zoomed by the panel. */
function drawPhotoInto(ctx, img, rect, panel) {
  const pw = rect.w;
  const ph = rect.h;
  const base = Math.max(pw / img.naturalWidth, ph / img.naturalHeight) * panel.zoom;
  const dw = img.naturalWidth * base;
  const dh = img.naturalHeight * base;
  // ox/oy are fractions of the panel, so a crop survives any export size.
  const dx = rect.x + (pw - dw) / 2 + panel.ox * pw;
  const dy = rect.y + (ph - dh) / 2 + panel.oy * ph;
  ctx.drawImage(img, dx, dy, dw, dh);
}

/** Draws the "no photo yet" placeholder for an empty panel. */
function drawEmptyPanel(ctx, rect, index) {
  const grad = ctx.createLinearGradient(rect.x, rect.y, rect.x + rect.w, rect.y + rect.h);
  grad.addColorStop(0, '#2a1440');
  grad.addColorStop(1, '#120a24');
  ctx.fillStyle = grad;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.font = `bold ${Math.max(14, rect.w * 0.05)}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText('ADD PHOTO', rect.x + rect.w / 2, rect.y + rect.h / 2);
  ctx.font = `${Math.max(11, rect.w * 0.03)}px sans-serif`;
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.fillText('panel ' + (index + 1), rect.x + rect.w / 2, rect.y + rect.h / 2 + rect.w * 0.06);
}

/** Grades one panel in place: photo -> temp canvas -> lookup -> back. */
function gradePanel(ctx, rect, lut, levels) {
  if (temp.width !== rect.w || temp.height !== rect.h) {
    temp.width = rect.w;
    temp.height = rect.h;
  }
  tempCtx.drawImage(ctx.canvas, rect.x, rect.y, rect.w, rect.h, 0, 0, rect.w, rect.h);
  const data = tempCtx.getImageData(0, 0, rect.w, rect.h);
  applyGrade(data, lut, levels);
  tempCtx.putImageData(data, 0, 0);
  ctx.drawImage(temp, rect.x, rect.y);
}

/** Draws the caption band: subtitle in script, caption in bold capitals. */
function drawLettering(ctx, W, H, caption, subtitle) {
  const bandTop = H * 0.76;
  const shade = ctx.createLinearGradient(0, bandTop, 0, H);
  shade.addColorStop(0, 'rgba(10,4,18,0)');
  shade.addColorStop(0.45, 'rgba(10,4,18,0.72)');
  shade.addColorStop(1, 'rgba(10,4,18,0.88)');
  ctx.fillStyle = shade;
  ctx.fillRect(0, bandTop, W, H - bandTop);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  const sub = (subtitle || '').trim();
  if (sub) {
    const subSize = fitFont(ctx, sub, 'Pacifico, cursive', Math.round(H * 0.052), W * 0.8, '400');
    ctx.font = `${subSize}px Pacifico, cursive`;
    ctx.fillStyle = '#ff7ad9';
    ctx.shadowColor = 'rgba(255, 60, 180, 0.8)';
    ctx.shadowBlur = subSize * 0.5;
    ctx.fillText(sub, W / 2, H * 0.845);
    ctx.shadowBlur = 0;
  }
  const cap = (caption || '').trim().toUpperCase();
  if (cap) {
    const capSize = fitFont(ctx, cap, 'Anton, sans-serif', Math.round(H * 0.115), W * 0.92, '400');
    ctx.font = `${capSize}px Anton, sans-serif`;
    ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(10,4,18,0.9)';
    ctx.lineWidth = Math.max(2, capSize * 0.14);
    ctx.strokeText(cap, W / 2, H * 0.95);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(cap, W / 2, H * 0.95);
  }
}

/**
 * Renders the whole cover onto `canvas` from `state`.
 * `scale` shrinks the backing store for the live preview; `highlight` (a
 * panel index, or -1) outlines one panel for the editor.
 */
export function drawCover(canvas, state, scale = 1, highlight = -1) {
  const size = SIZES[state.size] || SIZES.wide;
  const W = Math.round(size.w * scale);
  const H = Math.round(size.h * scale);
  if (canvas.width !== W || canvas.height !== H) {
    canvas.width = W;
    canvas.height = H;
  }
  const ctx = canvas.getContext('2d');
  const layout = layoutById(state.layout);
  const grade = gradeById(state.grade);
  const lut = buildLookup(grade);
  const g = Math.max(2, Math.round(W * 0.008));
  const rects = panelRects(layout, W, H, g);

  ctx.fillStyle = GUTTER;
  ctx.fillRect(0, 0, W, H);
  rects.forEach((rect, i) => {
    const panel = state.panels[i];
    ctx.save();
    ctx.beginPath();
    ctx.rect(rect.x, rect.y, rect.w, rect.h);
    ctx.clip();
    if (panel && panel.img) {
      drawPhotoInto(ctx, panel.img, rect, panel);
      gradePanel(ctx, rect, lut, state.posterise ? 5 : 0);
    } else {
      drawEmptyPanel(ctx, rect, i);
    }
    ctx.restore();
    ctx.strokeStyle = 'rgba(255,255,255,0.16)';
    ctx.lineWidth = 1;
    ctx.strokeRect(rect.x + 0.5, rect.y + 0.5, rect.w - 1, rect.h - 1);
    if (i === highlight) {
      ctx.strokeStyle = '#37e6ff';
      ctx.lineWidth = Math.max(2, g);
      ctx.strokeRect(rect.x + 1, rect.y + 1, rect.w - 2, rect.h - 2);
    }
  });

  // A soft vignette so the panels read as one poster.
  const vig = ctx.createRadialGradient(
    W / 2, H / 2, Math.min(W, H) * 0.45,
    W / 2, H / 2, Math.max(W, H) * 0.75,
  );
  vig.addColorStop(0, 'rgba(10,4,18,0)');
  vig.addColorStop(1, 'rgba(10,4,18,0.28)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, W, H);

  drawLettering(ctx, W, H, state.caption, state.subtitle);
  return canvas;
}

/** Renders the export-size cover onto a fresh canvas and returns it. */
export function exportCanvas(state) {
  return drawCover(document.createElement('canvas'), state, 1, -1);
}
