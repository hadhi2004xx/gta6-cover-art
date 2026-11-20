// Vice Poster editor wiring: photos, panel templates, caption, grades and PNG export.
// Photos are read with FileReader / object URLs on this machine only and never uploaded.
import { drawPoster, renderPoster, panelCount, panelAt } from './cover.js';
import { applyShot } from './shots.js';

const canvas = document.getElementById('poster');
const statusEl = document.getElementById('status');
const trayEl = document.getElementById('tray');
const panelPick = document.getElementById('panelPick');
const zoomEl = document.getElementById('zoom');
const posXEl = document.getElementById('posX');
const posYEl = document.getElementById('posY');
const titleEl = document.getElementById('title');
const subtitleEl = document.getElementById('subtitle');
const sizeEl = document.getElementById('size');

const SIZES = {
  '1080x1080': [1080, 1080],
  '1080x1350': [1080, 1350],
  '1920x1080': [1920, 1080],
};

const state = {
  template: 'trio',
  grade: 'sunset',
  lettering: 'block',
  title: 'VICE CITY',
  subtitle: 'SUNSET HEIST',
  photos: [], // { img, name }
  selectedPhoto: 0,
  selectedPanel: 0,
  panels: [],
};

function freshPanels(template) {
  const n = panelCount(template);
  const old = state.panels;
  const next = [];
  for (let i = 0; i < n; i++) {
    next.push(old[i] ? { ...old[i] } : { photo: state.selectedPhoto, zoom: 1, x: 0, y: 0 });
  }
  return next;
}

function redraw() {
  drawPoster(canvas, {
    photos: state.photos.map((p) => p.img),
    panels: state.panels,
    template: state.template,
    grade: state.grade,
    lettering: state.lettering,
    title: state.title,
    subtitle: state.subtitle,
  });
}

function refreshPanelPick() {
  panelPick.innerHTML = '';
  state.panels.forEach((_, i) => {
    const opt = document.createElement('option');
    opt.value = String(i);
    opt.textContent = `Panel ${i + 1}`;
    panelPick.appendChild(opt);
  });
  panelPick.value = String(state.selectedPanel);
  const p = state.panels[state.selectedPanel];
  if (p) {
    zoomEl.value = String(p.zoom);
    posXEl.value = String(p.x);
    posYEl.value = String(p.y);
  }
}

function refreshTray() {
  trayEl.innerHTML = '';
  state.photos.forEach((p, i) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'thumb' + (i === state.selectedPhoto ? ' selected' : '');
    btn.title = `${p.name} — click to select, then use Prev/Next photo or "One photo, all panels"`;
    const img = document.createElement('img');
    img.src = p.img.src;
    img.alt = p.name;
    btn.appendChild(img);
    btn.addEventListener('click', () => {
      state.selectedPhoto = i;
      refreshTray();
    });
    trayEl.appendChild(btn);
  });
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not load image'));
    img.src = url;
  });
}

async function addPhotoFile(file) {
  const url = URL.createObjectURL(file);
  const img = await loadImage(url);
  state.photos.push({ img, name: file.name });
  state.selectedPhoto = state.photos.length - 1;
  refreshTray();
}

async function loadSamples() {
  state.photos = [];
  for (const [file, label] of [['samples/boulevard.jpg', 'Boulevard (sample)'], ['samples/pier.jpg', 'Pier (sample)']]) {
    try {
      const img = await loadImage(file);
      state.photos.push({ img, name: label });
    } catch {
      // A missing sample must not block the editor; uploads still work.
    }
  }
  state.selectedPhoto = 0;
  state.selectedPanel = 0;
  state.panels = freshPanels(state.template);
  refreshTray();
  refreshPanelPick();
  redraw();
}

function setTemplate(template) {
  state.template = template;
  state.panels = freshPanels(template);
  if (state.selectedPanel >= state.panels.length) state.selectedPanel = 0;
  document.querySelectorAll('#templates button').forEach((b) => {
    b.classList.toggle('active', b.dataset.template === template);
  });
  refreshPanelPick();
  redraw();
}

function setGrade(grade) {
  state.grade = grade;
  document.querySelectorAll('#grades button').forEach((b) => {
    b.classList.toggle('active', b.dataset.grade === grade);
  });
  redraw();
}

function setLettering(lettering) {
  state.lettering = lettering;
  document.querySelectorAll('#lettering button').forEach((b) => {
    b.classList.toggle('active', b.dataset.letter === lettering);
  });
  redraw();
}

function setSize(key) {
  const [w, h] = SIZES[key] || SIZES['1080x1080'];
  canvas.width = w;
  canvas.height = h;
  redraw();
}

function cyclePhoto(dir) {
  if (!state.photos.length) return;
  const p = state.panels[state.selectedPanel];
  if (!p) return;
  p.photo = (p.photo + dir + state.photos.length) % state.photos.length;
  state.selectedPhoto = p.photo;
  refreshTray();
  redraw();
}

function exportPNG() {
  const [w, h] = SIZES[sizeEl.value] || SIZES['1080x1080'];
  const out = renderPoster(w, h, {
    photos: state.photos.map((p) => p.img),
    panels: state.panels,
    template: state.template,
    grade: state.grade,
    lettering: state.lettering,
    title: state.title,
    subtitle: state.subtitle,
  });
  out.toBlob((blob) => {
    if (!blob) {
      statusEl.textContent = 'Export failed — try again.';
      return;
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `vice-poster-${w}x${h}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    statusEl.textContent = `Saved vice-poster-${w}x${h}.png`;
  }, 'image/png');
}

// --- Control wiring -------------------------------------------------------
document.getElementById('photos').addEventListener('change', async (e) => {
  const files = [...e.target.files];
  for (const f of files) {
    try {
      await addPhotoFile(f);
    } catch {
      statusEl.textContent = `Could not read ${f.name}.`;
    }
  }
  redraw();
  e.target.value = '';
});

document.getElementById('spread').addEventListener('click', () => {
  state.panels.forEach((p) => { p.photo = state.selectedPhoto; });
  redraw();
  statusEl.textContent = 'One photo now fills every panel.';
});

document.getElementById('sampleBtn').addEventListener('click', loadSamples);

document.querySelectorAll('#templates button').forEach((b) => {
  b.addEventListener('click', () => setTemplate(b.dataset.template));
});
document.querySelectorAll('#grades button').forEach((b) => {
  b.addEventListener('click', () => setGrade(b.dataset.grade));
});
document.querySelectorAll('#lettering button').forEach((b) => {
  b.addEventListener('click', () => setLettering(b.dataset.letter));
});
document.querySelectorAll('[data-assign]').forEach((b) => {
  b.addEventListener('click', () => cyclePhoto(b.dataset.assign === 'next' ? 1 : -1));
});

panelPick.addEventListener('change', () => {
  state.selectedPanel = Number(panelPick.value);
  refreshPanelPick();
});
zoomEl.addEventListener('input', () => {
  const p = state.panels[state.selectedPanel];
  if (p) { p.zoom = Number(zoomEl.value); redraw(); }
});
posXEl.addEventListener('input', () => {
  const p = state.panels[state.selectedPanel];
  if (p) { p.x = Number(posXEl.value); redraw(); }
});
posYEl.addEventListener('input', () => {
  const p = state.panels[state.selectedPanel];
  if (p) { p.y = Number(posYEl.value); redraw(); }
});

titleEl.addEventListener('input', () => { state.title = titleEl.value; redraw(); });
subtitleEl.addEventListener('input', () => { state.subtitle = subtitleEl.value; redraw(); });
sizeEl.addEventListener('change', () => setSize(sizeEl.value));
document.getElementById('export').addEventListener('click', exportPNG);

// --- Drag to position, scroll to zoom -------------------------------------
let dragging = null;
function canvasPoint(e) {
  const r = canvas.getBoundingClientRect();
  return {
    x: ((e.clientX - r.left) / r.width) * canvas.width,
    y: ((e.clientY - r.top) / r.height) * canvas.height,
  };
}
canvas.addEventListener('pointerdown', (e) => {
  const pt = canvasPoint(e);
  const idx = panelAt(canvas.width, canvas.height, state.template, pt.x, pt.y);
  if (idx < 0) return;
  dragging = { idx, lastX: pt.x, lastY: pt.y };
  state.selectedPanel = idx;
  refreshPanelPick();
  canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener('pointermove', (e) => {
  if (!dragging) return;
  const pt = canvasPoint(e);
  const p = state.panels[dragging.idx];
  if (!p) return;
  p.x += (pt.x - dragging.lastX) / canvas.width;
  p.y += (pt.y - dragging.lastY) / canvas.height;
  p.x = Math.max(-0.5, Math.min(0.5, p.x));
  p.y = Math.max(-0.5, Math.min(0.5, p.y));
  dragging.lastX = pt.x;
  dragging.lastY = pt.y;
  refreshPanelPick();
  redraw();
});
canvas.addEventListener('pointerup', () => { dragging = null; });
canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  const pt = canvasPoint(e);
  const idx = panelAt(canvas.width, canvas.height, state.template, pt.x, pt.y);
  if (idx < 0) return;
  const p = state.panels[idx];
  p.zoom = Math.max(1, Math.min(3, p.zoom + (e.deltaY < 0 ? 0.1 : -0.1)));
  state.selectedPanel = idx;
  refreshPanelPick();
  redraw();
}, { passive: false });

// --- Boot -----------------------------------------------------------------
state.panels = freshPanels(state.template);
setTemplate('trio');
setGrade('sunset');
setLettering('block');
setSize('1080x1080');

const params = new URLSearchParams(location.search);
if (params.get('shot')) {
  applyShot(params.get('shot'), params, {
    loadSamples,
    setState(next) {
      Object.assign(state, next);
      state.panels = freshPanels(state.template);
      state.panels.forEach((p, i) => {
        if (next.panels && next.panels[i]) Object.assign(p, next.panels[i]);
      });
      titleEl.value = state.title;
      subtitleEl.value = state.subtitle;
      sizeEl.value = next.sizeKey || '1080x1080';
      setTemplate(state.template);
      setGrade(state.grade);
      setLettering(state.lettering);
      setSize(sizeEl.value);
      refreshTray();
      refreshPanelPick();
      redraw();
      requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
    },
  });
} else {
  loadSamples();
}
