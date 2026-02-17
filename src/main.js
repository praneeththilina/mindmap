const storageKey = 'mindmap-studio-v2';
const state = {
  version: 2,
  nodes: [],
  edges: [],
  selected: null,
  theme: 'dark',
  zoom: 1,
  panX: 0,
  panY: 0
};
const history = { undo: [], redo: [] };

const canvas = document.getElementById('canvas');
const edgesSvg = document.getElementById('edges');
const wrap = document.getElementById('canvas-wrap');
const viewport = document.getElementById('viewport');
const labelInput = document.getElementById('node-label');
const noteInput = document.getElementById('node-note');
const colorInput = document.getElementById('node-color');
const searchInput = document.getElementById('search-node');
const status = document.getElementById('status');

const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
const id = () => crypto.randomUUID();

function makeSnapshot() {
  return {
    nodes: structuredClone(state.nodes),
    edges: structuredClone(state.edges),
    selected: state.selected,
    zoom: state.zoom,
    panX: state.panX,
    panY: state.panY
  };
}

function pushHistory() {
  history.undo.push(makeSnapshot());
  if (history.undo.length > 80) history.undo.shift();
  history.redo.length = 0;
}

function restoreSnapshot(snapshot) {
  state.nodes = snapshot.nodes;
  state.edges = snapshot.edges;
  state.selected = snapshot.selected;
  state.zoom = snapshot.zoom;
  state.panX = snapshot.panX;
  state.panY = snapshot.panY;
  render();
  syncEditor();
  save();
}

function save() {
  const payload = {
    version: state.version,
    nodes: state.nodes,
    edges: state.edges,
    selected: state.selected,
    theme: state.theme,
    zoom: state.zoom,
    panX: state.panX,
    panY: state.panY
  };
  localStorage.setItem(storageKey, JSON.stringify(payload));
}

function setStatus(message) {
  status.textContent = message;
}

function createNode({ label, note = '', color = '#2563eb', x = 980, y = 700, parentId = null }) {
  const node = { id: id(), label, note, color, x, y, parentId };
  state.nodes.push(node);
  if (parentId) state.edges.push({ id: id(), source: parentId, target: node.id });
  return node;
}

function seed() {
  state.nodes = [];
  state.edges = [];
  const root = createNode({ label: 'Central Idea', color: '#2563eb', x: 980, y: 700 });
  state.selected = root.id;
  state.zoom = 1;
  state.panX = 0;
  state.panY = 0;
}

function load() {
  const raw = localStorage.getItem(storageKey);
  if (!raw) return seed();
  try {
    const data = JSON.parse(raw);
    if (!Array.isArray(data.nodes) || !Array.isArray(data.edges)) throw new Error('invalid data');
    state.nodes = data.nodes;
    state.edges = data.edges;
    state.selected = data.selected || data.nodes[0]?.id || null;
    state.theme = data.theme || 'dark';
    state.zoom = clamp(Number(data.zoom) || 1, 0.4, 2.5);
    state.panX = Number(data.panX) || 0;
    state.panY = Number(data.panY) || 0;
    if (!state.nodes.length) seed();
  } catch {
    seed();
    setStatus('Corrupted data detected. Started a clean map.');
  }
}

function byId(nodeId) {
  return state.nodes.find((n) => n.id === nodeId);
}

function syncEditor() {
  const n = byId(state.selected);
  labelInput.value = n?.label || '';
  noteInput.value = n?.note || '';
  colorInput.value = n?.color || '#2563eb';
  document.getElementById('delete-node').disabled = !n || n.parentId === null;
}

function select(nodeId) {
  state.selected = nodeId;
  syncEditor();
  render();
}

function applyViewport() {
  viewport.style.transform = `translate(${state.panX}px, ${state.panY}px) scale(${state.zoom})`;
}

function drawEdges() {
  edgesSvg.innerHTML = '';
  for (const e of state.edges) {
    const a = byId(e.source);
    const b = byId(e.target);
    if (!a || !b) continue;
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const x1 = a.x + 95;
    const y1 = a.y + 26;
    const x2 = b.x + 95;
    const y2 = b.y + 26;
    const mid = (x1 + x2) / 2;
    path.setAttribute('d', `M ${x1} ${y1} C ${mid} ${y1}, ${mid} ${y2}, ${x2} ${y2}`);
    path.setAttribute('stroke', '#64748b');
    path.setAttribute('stroke-width', '2');
    path.setAttribute('fill', 'none');
    edgesSvg.appendChild(path);
  }
}

function dragNode(el, node) {
  let startX = 0;
  let startY = 0;
  let originX = 0;
  let originY = 0;
  const pointerMove = (ev) => {
    node.x = originX + (ev.clientX - startX) / state.zoom;
    node.y = originY + (ev.clientY - startY) / state.zoom;
    el.style.left = `${node.x}px`;
    el.style.top = `${node.y}px`;
    drawEdges();
  };
  const pointerUp = () => {
    window.removeEventListener('pointermove', pointerMove);
    window.removeEventListener('pointerup', pointerUp);
    save();
  };
  el.addEventListener('pointerdown', (ev) => {
    if (ev.button !== 0) return;
    pushHistory();
    select(node.id);
    startX = ev.clientX;
    startY = ev.clientY;
    originX = node.x;
    originY = node.y;
    window.addEventListener('pointermove', pointerMove);
    window.addEventListener('pointerup', pointerUp);
  });
}

function render() {
  canvas.innerHTML = '';
  const q = searchInput.value.trim().toLowerCase();
  for (const node of state.nodes) {
    const el = document.createElement('div');
    el.className = `node ${state.selected === node.id ? 'active' : ''}`;
    if (q && node.label.toLowerCase().includes(q)) el.classList.add('search-hit');
    el.style.left = `${node.x}px`;
    el.style.top = `${node.y}px`;
    el.style.background = node.color;
    el.textContent = node.label;
    el.onclick = () => select(node.id);
    dragNode(el, node);
    canvas.appendChild(el);
  }
  drawEdges();
  applyViewport();
  setStatus(`${state.nodes.length} nodes • ${Math.round(state.zoom * 100)}% zoom`);
}

function layout(direction) {
  pushHistory();
  const root = state.nodes.find((n) => n.parentId === null) || state.nodes[0];
  if (!root) return;
  const levels = [[root]];
  const used = new Set([root.id]);
  while (levels.at(-1)?.length) {
    const next = [];
    for (const n of levels.at(-1)) {
      const children = state.nodes.filter((x) => x.parentId === n.id && !used.has(x.id));
      for (const c of children) {
        used.add(c.id);
        next.push(c);
      }
    }
    if (!next.length) break;
    levels.push(next);
  }

  const gapX = 300;
  const gapY = 120;
  levels.forEach((level, i) => {
    const total = (level.length - 1) * gapY;
    level.forEach((n, index) => {
      if (direction === 'horizontal') {
        n.x = 220 + i * gapX;
        n.y = 700 - total / 2 + index * gapY;
      } else {
        n.x = 980 - ((level.length - 1) * gapX) / 2 + index * gapX;
        n.y = 130 + i * gapY;
      }
    });
  });

  render();
  save();
}

function fitView() {
  if (!state.nodes.length) return;
  const xs = state.nodes.map((n) => n.x);
  const ys = state.nodes.map((n) => n.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs) + 190;
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys) + 52;
  const boxW = Math.max(maxX - minX, 300);
  const boxH = Math.max(maxY - minY, 200);
  const w = wrap.clientWidth;
  const h = wrap.clientHeight;
  state.zoom = clamp(Math.min(w / boxW, h / boxH) * 0.9, 0.4, 2.2);
  state.panX = (w - boxW * state.zoom) / 2 - minX * state.zoom;
  state.panY = (h - boxH * state.zoom) / 2 - minY * state.zoom;
  render();
  save();
}

function undo() {
  const snap = history.undo.pop();
  if (!snap) return;
  history.redo.push(makeSnapshot());
  restoreSnapshot(snap);
}

function redo() {
  const snap = history.redo.pop();
  if (!snap) return;
  history.undo.push(makeSnapshot());
  restoreSnapshot(snap);
}

document.getElementById('add-child').onclick = () => {
  pushHistory();
  const base = byId(state.selected) || state.nodes[0];
  if (!base) return;
  const n = createNode({ label: 'New idea', color: base.color, x: base.x + 220, y: base.y + 80, parentId: base.id });
  select(n.id);
  save();
};

document.getElementById('add-sibling').onclick = () => {
  pushHistory();
  const current = byId(state.selected);
  if (!current || current.parentId === null) return;
  const n = createNode({ label: 'Sibling idea', color: current.color, x: current.x, y: current.y + 120, parentId: current.parentId });
  select(n.id);
  save();
};

document.getElementById('delete-node').onclick = () => {
  const current = byId(state.selected);
  if (!current || current.parentId === null) return;
  pushHistory();
  const deleted = new Set([current.id]);
  let added = true;
  while (added) {
    added = false;
    for (const n of state.nodes) {
      if (n.parentId && deleted.has(n.parentId) && !deleted.has(n.id)) {
        deleted.add(n.id);
        added = true;
      }
    }
  }
  state.nodes = state.nodes.filter((n) => !deleted.has(n.id));
  state.edges = state.edges.filter((e) => !deleted.has(e.source) && !deleted.has(e.target));
  select(state.nodes[0]?.id || null);
  save();
};

document.getElementById('layout-horizontal').onclick = () => layout('horizontal');
document.getElementById('layout-vertical').onclick = () => layout('vertical');

document.getElementById('zoom-in').onclick = () => { state.zoom = clamp(state.zoom + 0.1, 0.4, 2.5); render(); save(); };
document.getElementById('zoom-out').onclick = () => { state.zoom = clamp(state.zoom - 0.1, 0.4, 2.5); render(); save(); };
document.getElementById('fit-view').onclick = fitView;
document.getElementById('undo').onclick = undo;
document.getElementById('redo').onclick = redo;

document.getElementById('export-map').onclick = () => {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `mindmap-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

document.getElementById('import-map').onchange = (event) => {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const incoming = JSON.parse(String(reader.result));
      if (!Array.isArray(incoming.nodes) || !Array.isArray(incoming.edges)) throw new Error('invalid');
      pushHistory();
      state.nodes = incoming.nodes;
      state.edges = incoming.edges;
      state.selected = incoming.selected || state.nodes[0]?.id || null;
      state.zoom = clamp(Number(incoming.zoom) || 1, 0.4, 2.5);
      state.panX = Number(incoming.panX) || 0;
      state.panY = Number(incoming.panY) || 0;
      render();
      syncEditor();
      save();
      setStatus('Map imported successfully.');
    } catch {
      setStatus('Invalid map file.');
    }
  };
  reader.readAsText(file);
  event.target.value = '';
};

document.getElementById('reset-map').onclick = () => {
  pushHistory();
  seed();
  render();
  syncEditor();
  save();
};

labelInput.oninput = (e) => {
  const current = byId(state.selected);
  if (!current) return;
  current.label = e.target.value.slice(0, 80);
  render();
  save();
};

noteInput.oninput = (e) => {
  const current = byId(state.selected);
  if (!current) return;
  current.note = e.target.value;
  save();
};

colorInput.oninput = (e) => {
  const current = byId(state.selected);
  if (!current) return;
  current.color = e.target.value;
  render();
  save();
};

searchInput.oninput = () => {
  render();
  const q = searchInput.value.trim().toLowerCase();
  if (!q) return;
  const hit = state.nodes.find((n) => n.label.toLowerCase().includes(q));
  if (hit) select(hit.id);
};

document.getElementById('toggle-theme').onclick = () => {
  state.theme = state.theme === 'dark' ? 'light' : 'dark';
  applyTheme();
  save();
};

function applyTheme() {
  document.body.className = state.theme;
  document.getElementById('toggle-theme').textContent = state.theme === 'dark' ? '☀️' : '🌙';
}

let panning = false;
let panStartX = 0;
let panStartY = 0;
let panOriginX = 0;
let panOriginY = 0;
wrap.addEventListener('pointerdown', (ev) => {
  if (ev.target.closest('.node')) return;
  panning = true;
  panStartX = ev.clientX;
  panStartY = ev.clientY;
  panOriginX = state.panX;
  panOriginY = state.panY;
});
window.addEventListener('pointermove', (ev) => {
  if (!panning) return;
  state.panX = panOriginX + (ev.clientX - panStartX);
  state.panY = panOriginY + (ev.clientY - panStartY);
  applyViewport();
});
window.addEventListener('pointerup', () => {
  if (panning) save();
  panning = false;
});

wrap.addEventListener('wheel', (ev) => {
  ev.preventDefault();
  const prev = state.zoom;
  state.zoom = clamp(state.zoom + (ev.deltaY < 0 ? 0.06 : -0.06), 0.4, 2.5);
  const rect = wrap.getBoundingClientRect();
  const mx = ev.clientX - rect.left;
  const my = ev.clientY - rect.top;
  state.panX = mx - ((mx - state.panX) / prev) * state.zoom;
  state.panY = my - ((my - state.panY) / prev) * state.zoom;
  render();
  save();
}, { passive: false });

window.addEventListener('keydown', (ev) => {
  const ctrl = ev.ctrlKey || ev.metaKey;
  if (ctrl && ev.key.toLowerCase() === 'z') {
    ev.preventDefault();
    if (ev.shiftKey) redo(); else undo();
  }
  if (ctrl && ev.key.toLowerCase() === 'y') {
    ev.preventDefault();
    redo();
  }
  if (ev.key === 'Delete') {
    document.getElementById('delete-node').click();
  }
});

load();
applyTheme();
render();
syncEditor();
fitView();
