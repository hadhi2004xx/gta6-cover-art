// Vice Poster renderer: draws a multi-panel GTA-style poster cover on a canvas.
// Every shape here is drawn from scratch in code — the sun, the palm silhouettes,
// the diagonal panel splits and the caption lettering are all original art.
// No Rockstar logo, artwork or font is used anywhere in this app.

export const GRADES = {
  sunset: {
    skyTop: 'rgba(255, 94, 98, 0.34)', skyBottom: 'rgba(255, 170, 60, 0.30)',
    sunInner: '#ffd76a', sunOuter: '#ff5e62', palm: '#200a33', accent: '#ff7a3d',
  },
  neon: {
    skyTop: 'rgba(150, 60, 255, 0.42)', skyBottom: 'rgba(0, 229, 255, 0.30)',
    sunInner: '#8ef6ff', sunOuter: '#b14bff', palm: '#0d0221', accent: '#00e5ff',
  },
  gold: {
    skyTop: 'rgba(255, 196, 66, 0.30)', skyBottom: 'rgba(0, 160, 150, 0.30)',
    sunInner: '#fff3b0', sunOuter: '#f2a900', palm: '#1c1408', accent: '#f2c14e',
  },
};

export const TEMPLATES = ['solo', 'duo', 'trio', 'quad'];

export function panelCount(template) {
  return { solo: 1, duo: 2, trio: 3, quad: 4 }[template] ?? 1;
}

/** Diagonal-split panel outlines for a canvas of w x h. Each panel is a polygon. */
export function panelShapes(w, h, template) {
  if (template === 'duo') {
    return [
      [[0, 0], [w * 0.62, 0], [w * 0.38, h], [0, h]],
      [[w * 0.62, 0], [w, 0], [w, h], [w * 0.38, h]],
    ];
  }
  if (template === 'trio') {
    return [
      [[0, 0], [w * 0.36, 0], [w * 0.26, h], [0, h]],
      [[w * 0.36, 0], [w * 0.70, 0], [w * 0.60, h], [w * 0.26, h]],
      [[w * 0.70, 0], [w, 0], [w, h], [w * 0.60, h]],
    ];
  }
  if (template === 'quad') {
    const my = h * 0.5;
    return [
      [[0, 0], [w * 0.54, 0], [w * 0.46, my], [0, my + h * 0.02]],
      [[w * 0.54, 0], [w, 0], [w, my - h * 0.02], [w * 0.46, my]],
      [[0, my + h * 0.02], [w * 0.46, my], [w * 0.40, h], [0, h]],
      [[w * 0.46, my], [w, my - h * 0.02], [w, h], [w * 0.40, h]],
    ];
  }
  return [[[0, 0], [w, 0], [w, h], [0, h]]];
}

function polygonPath(ctx, poly) {
  ctx.beginPath();
  ctx.moveTo(poly[0][0], poly[0][1]);
  for (let i = 1; i < poly.length; i++) ctx.lineTo(poly[i][0], poly[i][1]);
  ctx.closePath();
}

function panelBounds(poly) {
  const xs = poly.map((p) => p[0]);
  const ys = poly.map((p) => p[1]);
  return {
    x: Math.min(...xs), y: Math.min(...ys),
    w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys),
  };
}

function pointInPolygon(x, y, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (((yi > y) !== (yj > y)) && (x < ((xj - xi) * (y - yi)) / (yj - yi) + xi)) inside = !inside;
  }
  return inside;
}

/** Index of the panel containing (x, y) in canvas pixels, or -1. */
export function panelAt(w, h, template, x, y) {
  const shapes = panelShapes(w, h, template);
  for (let i = 0; i < shapes.length; i++) {
    if (pointInPolygon(x, y, shapes[i])) return i;
  }
  return -1;
}

function drawPhotoInPanel(ctx, photo, poly, zoom, offX, offY) {
  if (!photo || !photo.naturalWidth) return;
  const b = panelBounds(poly);
  const base = Math.max(b.w / photo.naturalWidth, b.h / photo.naturalHeight);
  const scale = base * Math.max(1, zoom);
  const pw = photo.naturalWidth * scale;
  const ph = photo.naturalHeight * scale;
  ctx.save();
  polygonPath(ctx, poly);
  ctx.clip();
  ctx.drawImage(photo, b.x + (b.w - pw) / 2 + offX * b.w, b.y + (b.h - ph) / 2 + offY * b.h, pw, ph);
  // Soft inner shade so panels read as one poster, not four photos.
  const shade = ctx.createLinearGradient(0, b.y, 0, b.y + b.h);
  shade.addColorStop(0, 'rgba(20, 4, 40, 0.10)');
  shade.addColorStop(1, 'rgba(20, 4, 40, 0.28)');
  ctx.fillStyle = shade;
  ctx.fillRect(b.x, b.y, b.w, b.h);
  ctx.restore();
}

function drawSun(ctx, w, h, grade) {
  const cx = w * 0.74;
  const cy = h * 0.30;
  const r = Math.min(w, h) * 0.13;
  ctx.save();
  ctx.shadowColor = grade.sunOuter;
  ctx.shadowBlur = r * 0.9;
  const g = ctx.createLinearGradient(cx, cy - r, cx, cy + r);
  g.addColorStop(0, grade.sunInner);
  g.addColorStop(1, grade.sunOuter);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  // Retro slats across the sun's lower half, cut in the dusk backdrop colour.
  ctx.save();
  ctx.fillStyle = '#1c0a33';
  for (let i = 0; i < 3; i++) {
    const y = cy + r * (0.15 + i * 0.28);
    const half = Math.sqrt(Math.max(0, r * r - (y - cy) * (y - cy)));
    ctx.fillRect(cx - half, y, half * 2, r * 0.07);
  }
  ctx.restore();
}

function drawPalm(ctx, x, y, s, lean, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 9;
  ctx.lineCap = 'round';
  // Curved trunk leaning away from the corner.
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(lean * 18, -70, lean * 42, -118);
  ctx.stroke();
  const topX = lean * 42;
  const topY = -118;
  // Six drooping fronds fanning from the crown.
  for (let i = 0; i < 6; i++) {
    const a = (-Math.PI * 0.15) - (i * Math.PI) / 7.2;
    const tipX = topX + Math.cos(a) * 74;
    const tipY = topY + Math.sin(a) * 46 + 26;
    ctx.beginPath();
    ctx.moveTo(topX, topY);
    ctx.quadraticCurveTo(topX + Math.cos(a) * 42, topY + Math.sin(a) * 30 - 14, tipX, tipY);
    ctx.lineWidth = 7;
    ctx.stroke();
  }
  // Coconut cluster at the crown.
  ctx.beginPath();
  ctx.arc(topX - 6, topY + 8, 6, 0, Math.PI * 2);
  ctx.arc(topX + 6, topY + 8, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function fitFont(ctx, text, maxWidth, startSize, family) {
  let size = startSize;
  ctx.font = `900 ${size}px ${family}`;
  while (size > 14 && ctx.measureText(text).width > maxWidth) {
    size -= 2;
    ctx.font = `900 ${size}px ${family}`;
  }
  return size;
}

function drawCaption(ctx, w, h, title, subtitle, lettering, grade) {
  const family = '"Arial Narrow", Impact, "Helvetica Neue", Arial, sans-serif';
  const bandH = h * 0.24;
  const bandY = h - bandH;
  // Dark caption band with a hard diagonal top edge.
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(0, bandY + h * 0.035);
  ctx.lineTo(w, bandY);
  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.closePath();
  ctx.fillStyle = 'rgba(16, 3, 30, 0.88)';
  ctx.fill();
  ctx.restore();
  // Accent rule above the band.
  ctx.fillStyle = grade.accent;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(0, bandY + h * 0.035);
  ctx.lineTo(w, bandY);
  ctx.lineTo(w, bandY + h * 0.008);
  ctx.lineTo(0, bandY + h * 0.043);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  const text = (title || 'VICE CITY').trim().toUpperCase();
  const sub = (subtitle || '').trim().toUpperCase();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  if (ctx.letterSpacing !== undefined) ctx.letterSpacing = '2px';

  const titleSize = fitFont(ctx, text, w * 0.88, h * 0.105, family);
  const titleY = bandY + bandH * 0.52;
  ctx.lineJoin = 'round';
  ctx.lineWidth = Math.max(2, titleSize * 0.09);
  if (lettering === 'neon') {
    ctx.shadowColor = '#ff2fb3';
    ctx.shadowBlur = titleSize * 0.45;
    ctx.strokeStyle = '#2a0033';
    ctx.strokeText(text, w / 2, titleY);
    ctx.fillStyle = '#8ef6ff';
    ctx.fillText(text, w / 2, titleY);
    ctx.shadowBlur = 0;
  } else if (lettering === 'gold') {
    const gold = ctx.createLinearGradient(0, titleY - titleSize, 0, titleY);
    gold.addColorStop(0, '#fff3b0');
    gold.addColorStop(0.55, '#f2c14e');
    gold.addColorStop(1, '#b97d10');
    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur = titleSize * 0.12;
    ctx.strokeStyle = '#241505';
    ctx.strokeText(text, w / 2, titleY);
    ctx.fillStyle = gold;
    ctx.fillText(text, w / 2, titleY);
    ctx.shadowBlur = 0;
  } else {
    ctx.shadowColor = 'rgba(0,0,0,0.65)';
    ctx.shadowBlur = titleSize * 0.14;
    ctx.strokeStyle = '#12041f';
    ctx.strokeText(text, w / 2, titleY);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(text, w / 2, titleY);
    ctx.shadowBlur = 0;
  }
  if (ctx.letterSpacing !== undefined) ctx.letterSpacing = '6px';
  if (sub) {
    const subSize = fitFont(ctx, sub, w * 0.8, h * 0.038, family);
    ctx.font = `700 ${subSize}px ${family}`;
    ctx.fillStyle = grade.accent;
    ctx.fillText(sub, w / 2, bandY + bandH * 0.82);
  }
  if (ctx.letterSpacing !== undefined) ctx.letterSpacing = '0px';
}

/**
 * Draws the whole poster onto `canvas` (its own pixel size is the output size).
 * opts: { photos, panels, template, grade, lettering, title, subtitle }
 * photos: array of images (or null entries); panels[i] = { photo, zoom, x, y }.
 */
export function drawPoster(canvas, opts) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const grade = GRADES[opts.grade] ?? GRADES.sunset;
  const shapes = panelShapes(w, h, opts.template || 'solo');

  // Backdrop: deep violet dusk.
  ctx.fillStyle = '#1c0a33';
  ctx.fillRect(0, 0, w, h);

  const panels = opts.panels || [];
  shapes.forEach((poly, i) => {
    const p = panels[i] || { photo: 0, zoom: 1, x: 0, y: 0 };
    const photo = (opts.photos || [])[p.photo] ?? null;
    if (photo) drawPhotoInPanel(ctx, photo, poly, p.zoom, p.x, p.y);
    else {
      // Empty panel: painted dusk gradient so the poster never shows a hole.
      ctx.save();
      polygonPath(ctx, poly);
      ctx.clip();
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, '#3d1658');
      g.addColorStop(1, '#12041f');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      ctx.restore();
    }
  });

  // White gutters between panels, drawn along each shared edge.
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.92)';
  ctx.lineWidth = Math.max(3, w * 0.006);
  ctx.lineJoin = 'round';
  shapes.forEach((poly) => {
    polygonPath(ctx, poly);
    ctx.stroke();
  });
  ctx.restore();

  // Sunset / neon colour grade over everything.
  ctx.save();
  ctx.globalCompositeOperation = 'overlay';
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, grade.skyTop);
  sky.addColorStop(1, grade.skyBottom);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();

  drawSun(ctx, w, h, grade);
  drawPalm(ctx, w * 0.045, h * 0.985, Math.min(w, h) / 950, 1, grade.palm);
  drawPalm(ctx, w * 0.955, h * 0.985, Math.min(w, h) / 1150, -1, grade.palm);

  // Vignette to pull the eye to the middle.
  const vig = ctx.createRadialGradient(w / 2, h * 0.42, Math.min(w, h) * 0.35, w / 2, h / 2, Math.max(w, h) * 0.75);
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(10,2,24,0.42)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, w, h);

  drawCaption(ctx, w, h, opts.title, opts.subtitle, opts.lettering || 'block', grade);

  // Thin poster frame.
  ctx.strokeStyle = 'rgba(255,255,255,0.85)';
  ctx.lineWidth = Math.max(2, w * 0.004);
  ctx.strokeRect(ctx.lineWidth / 2, ctx.lineWidth / 2, w - ctx.lineWidth, h - ctx.lineWidth);
}

/** Renders the poster at an exact export size and returns the offscreen canvas. */
export function renderPoster(width, height, opts) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  drawPoster(canvas, opts);
  return canvas;
}
