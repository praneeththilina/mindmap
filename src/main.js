const storageKey = 'mindmap-studio-v1';
const state = {
  nodes: [],
  edges: [],
  selected: null,
  theme: 'dark'
};

const canvas = document.getElementById('canvas');
const edgesSvg = document.getElementById('edges');
const wrap = document.getElementById('canvas-wrap');
const labelInput = document.getElementById('node-label');
const noteInput = document.getElementById('node-note');
const colorInput = document.getElementById('node-color');

function id() {
  return crypto.randomUUID();
}

function createNode({ label, note = '', color = '#2563eb', x = 620, y = 380, parentId = null }) {
  const node = { id: id(), label, note, color, x, y, parentId };
  state.nodes.push(node);
  if (parentId) state.edges.push({ id: id(), source: parentId, target: node.id });
  return node;
}

function seed() {
  state.nodes = [];
  state.edges = [];
  const root = createNode({ label: 'Central Idea', color: '#2563eb', x: 620, y: 420 });
  state.selected = root.id;
}

function save() {
  localStorage.setItem(storageKey, JSON.stringify(state));
}

function load() {
  const raw = localStorage.getItem(storageKey);
  if (!raw) return seed();
  try {
    const data = JSON.parse(raw);
    state.nodes = data.nodes || [];
    state.edges = data.edges || [];
    state.selected = data.selected || state.nodes[0]?.id || null;
    state.theme = data.theme || 'dark';
    if (!state.nodes.length) seed();
  } catch {
    seed();
  }
}

function byId(nodeId) {
  return state.nodes.find((n) => n.id === nodeId);
}

function select(nodeId) {
  state.selected = nodeId;
  const n = byId(nodeId);
  labelInput.value = n?.label || '';
  noteInput.value = n?.note || '';
  colorInput.value = n?.color || '#2563eb';
  document.getElementById('delete-node').disabled = !n || n.parentId === null;
  render();
}

function drawEdges() {
  edgesSvg.innerHTML = '';
  for (const e of state.edges) {
    const a = byId(e.source);
    const b = byId(e.target);
    if (!a || !b) continue;
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const x1 = a.x + 90;
    const y1 = a.y + 26;
    const x2 = b.x + 90;
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
    node.x = originX + (ev.clientX - startX);
    node.y = originY + (ev.clientY - startY);
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
  for (const node of state.nodes) {
    const el = document.createElement('div');
    el.className = `node ${state.selected === node.id ? 'active' : ''}`;
    el.style.left = `${node.x}px`;
    el.style.top = `${node.y}px`;
    el.style.background = node.color;
    el.textContent = node.label;
    el.onclick = () => select(node.id);
    dragNode(el, node);
    canvas.appendChild(el);
  }
  drawEdges();
}

function layout(direction) {
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

  const gapX = 260;
  const gapY = 120;
  levels.forEach((level, i) => {
    const total = (level.length - 1) * gapY;
    level.forEach((n, index) => {
      if (direction === 'horizontal') {
        n.x = 180 + i * gapX;
        n.y = 420 - total / 2 + index * gapY;
      } else {
        n.x = 620 - ((level.length - 1) * gapX) / 2 + index * gapX;
        n.y = 130 + i * gapY;
      }
    });
  });

  render();
  save();
}

document.getElementById('add-child').onclick = () => {
  const base = byId(state.selected) || state.nodes[0];
  if (!base) return;
  const n = createNode({
    label: 'New idea',
    color: base.color,
    x: base.x + 220,
    y: base.y + 80,
    parentId: base.id
  });
  select(n.id);
  save();
};

document.getElementById('add-sibling').onclick = () => {
  const current = byId(state.selected);
  if (!current || current.parentId === null) return;
  const n = createNode({
    label: 'Sibling idea',
    color: current.color,
    x: current.x,
    y: current.y + 120,
    parentId: current.parentId
  });
  select(n.id);
  save();
};

document.getElementById('delete-node').onclick = () => {
  const current = byId(state.selected);
  if (!current || current.parentId === null) return;
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
      state.nodes = incoming.nodes || [];
      state.edges = incoming.edges || [];
      state.selected = incoming.selected || state.nodes[0]?.id || null;
      render();
      select(state.selected);
      save();
    } catch {
      alert('Invalid file');
    }
  };
  reader.readAsText(file);
  event.target.value = '';
};

document.getElementById('reset-map').onclick = () => {
  seed();
  render();
  select(state.selected);
  save();
};

labelInput.oninput = (e) => {
  const current = byId(state.selected);
  if (!current) return;
  current.label = e.target.value;
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

document.getElementById('toggle-theme').onclick = () => {
  state.theme = state.theme === 'dark' ? 'light' : 'dark';
  applyTheme();
  save();
};

function applyTheme() {
  document.body.className = state.theme;
  document.getElementById('toggle-theme').textContent = state.theme === 'dark' ? '☀️' : '🌙';
}

wrap.addEventListener('click', (ev) => {
  if (ev.target === wrap || ev.target === canvas) {
    state.selected = null;
    render();
    labelInput.value = '';
    noteInput.value = '';
  }
});

load();
applyTheme();
render();
select(state.selected);
