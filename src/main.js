const storageKey = 'mindmap-studio-v5';
const state = {
  version: 5,
  nodes: [],
  edges: [],
  relations: [],
  selected: null,
  theme: 'dark',
  zoom: 1,
  panX: 0,
  panY: 0,
  focusRootId: null,
  relationMode: false,
  relationStart: null
};
const history = { undo: [], redo: [] };

const canvas = document.getElementById('canvas');
const edgesSvg = document.getElementById('edges');
const wrap = document.getElementById('canvas-wrap');
const viewport = document.getElementById('viewport');

const labelInput = document.getElementById('node-label');
const noteInput = document.getElementById('node-note');
const colorInput = document.getElementById('node-color');
const priorityInput = document.getElementById('node-priority');
const progressInput = document.getElementById('node-progress');
const progressLabel = document.getElementById('progress-label');
const searchInput = document.getElementById('search-node');
const status = document.getElementById('status');

const toggleCollapseButton = document.getElementById('toggle-collapse');
const focusButton = document.getElementById('focus-mode');
const relationButton = document.getElementById('relation-mode');

const templatesDialog = document.getElementById('templates-dialog');
const commandDialog = document.getElementById('command-dialog');
const commandSearchInput = document.getElementById('command-search');
const commandList = document.getElementById('command-list');

const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
const id = () => crypto.randomUUID();

function makeSnapshot() {
  return {
    nodes: structuredClone(state.nodes),
    edges: structuredClone(state.edges),
    relations: structuredClone(state.relations),
    selected: state.selected,
    zoom: state.zoom,
    panX: state.panX,
    panY: state.panY,
    focusRootId: state.focusRootId,
    relationMode: state.relationMode,
    relationStart: state.relationStart
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
  state.relations = snapshot.relations || [];
  state.selected = snapshot.selected;
  state.zoom = snapshot.zoom;
  state.panX = snapshot.panX;
  state.panY = snapshot.panY;
  state.focusRootId = snapshot.focusRootId || null;
  state.relationMode = Boolean(snapshot.relationMode);
  state.relationStart = snapshot.relationStart || null;
  render();
  syncEditor();
  save();
}

function save() {
  localStorage.setItem(storageKey, JSON.stringify({
    version: state.version,
    nodes: state.nodes,
    edges: state.edges,
    relations: state.relations,
    selected: state.selected,
    theme: state.theme,
    zoom: state.zoom,
    panX: state.panX,
    panY: state.panY,
    focusRootId: state.focusRootId
  }));
}

function setStatus(message) { status.textContent = message; }
function byId(nodeId) { return state.nodes.find((n) => n.id === nodeId); }
function getChildren(parentId) { return state.nodes.filter((n) => n.parentId === parentId); }

function createNode({ label, note = '', color = '#2563eb', x = 980, y = 700, parentId = null, collapsed = false, priority = 0, progress = 0 }) {
  const node = { id: id(), label, note, color, x, y, parentId, collapsed, priority, progress };
  state.nodes.push(node);
  if (parentId) state.edges.push({ id: id(), source: parentId, target: node.id });
  return node;
}

function seed() {
  state.nodes = [];
  state.edges = [];
  state.relations = [];
  state.focusRootId = null;
  state.relationMode = false;
  state.relationStart = null;
  const root = createNode({ label: 'Central Topic', color: '#2563eb', x: 1200, y: 850 });
  state.selected = root.id;
  state.zoom = 1;
  state.panX = 0;
  state.panY = 0;
}

function load() {
  const raw = localStorage.getItem(storageKey)
    || localStorage.getItem('mindmap-studio-v4')
    || localStorage.getItem('mindmap-studio-v3')
    || localStorage.getItem('mindmap-studio-v2');
  if (!raw) return seed();
  try {
    const data = JSON.parse(raw);
    if (!Array.isArray(data.nodes) || !Array.isArray(data.edges)) throw new Error('invalid data');
    state.nodes = data.nodes.map((n) => ({ ...n, collapsed: Boolean(n.collapsed), priority: Number(n.priority) || 0, progress: Number(n.progress) || 0 }));
    state.edges = data.edges;
    state.relations = Array.isArray(data.relations) ? data.relations : [];
    state.selected = data.selected || data.nodes[0]?.id || null;
    state.theme = data.theme || 'dark';
    state.zoom = clamp(Number(data.zoom) || 1, 0.35, 2.5);
    state.panX = Number(data.panX) || 0;
    state.panY = Number(data.panY) || 0;
    state.focusRootId = data.focusRootId || null;
    state.relationMode = false;
    state.relationStart = null;
    if (!state.nodes.length) seed();
  } catch {
    seed();
    setStatus('Corrupted data detected. Started a clean map.');
  }
}

function syncEditor() {
  const n = byId(state.selected);
  labelInput.value = n?.label || '';
  noteInput.value = n?.note || '';
  colorInput.value = n?.color || '#2563eb';
  priorityInput.value = String(n?.priority || 0);
  progressInput.value = String(n?.progress || 0);
  progressLabel.textContent = `${n?.progress || 0}%`;
  document.getElementById('delete-node').disabled = !n || n.parentId === null;
  toggleCollapseButton.disabled = !n || !getChildren(n.id).length;
  toggleCollapseButton.textContent = n?.collapsed ? 'Expand branch' : 'Collapse branch';
  focusButton.textContent = state.focusRootId ? 'Exit Focus' : 'Focus';
  relationButton.textContent = `Relation: ${state.relationMode ? 'On' : 'Off'}`;
}

function select(nodeId) {
  state.selected = nodeId;
  syncEditor();
  render();
}

function isDescendant(nodeId, ancestorId) {
  let current = byId(nodeId);
  while (current?.parentId) {
    if (current.parentId === ancestorId) return true;
    current = byId(current.parentId);
  }
  return false;
}

function isVisibleNode(node) {
  if (state.focusRootId && node.id !== state.focusRootId && !isDescendant(node.id, state.focusRootId)) return false;
  let parentId = node.parentId;
  while (parentId) {
    const parent = byId(parentId);
    if (!parent) return false;
    if (parent.collapsed) return false;
    parentId = parent.parentId;
  }
  return true;
}
function visibleNodes() { return state.nodes.filter(isVisibleNode); }

function applyViewport() { viewport.style.transform = `translate(${state.panX}px, ${state.panY}px) scale(${state.zoom})`; }

function drawPaths(visibleIds) {
  edgesSvg.innerHTML = '<defs><marker id="rel-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#f59e0b" /></marker></defs>';
  for (const e of state.edges) {
    if (!visibleIds.has(e.source) || !visibleIds.has(e.target)) continue;
    const a = byId(e.source); const b = byId(e.target);
    if (!a || !b) continue;
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const x1 = a.x + 100; const y1 = a.y + 26; const x2 = b.x + 100; const y2 = b.y + 26;
    const mid = (x1 + x2) / 2;
    path.setAttribute('d', `M ${x1} ${y1} C ${mid} ${y1}, ${mid} ${y2}, ${x2} ${y2}`);
    path.setAttribute('stroke', '#64748b'); path.setAttribute('stroke-width', '2'); path.setAttribute('fill', 'none');
    edgesSvg.appendChild(path);
  }
  for (const r of state.relations) {
    if (!visibleIds.has(r.source) || !visibleIds.has(r.target)) continue;
    const a = byId(r.source); const b = byId(r.target);
    if (!a || !b) continue;
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const x1 = a.x + 100; const y1 = a.y + 26; const x2 = b.x + 100; const y2 = b.y + 26;
    const dx = Math.abs(x2 - x1) * 0.25 + 60;
    path.setAttribute('d', `M ${x1} ${y1} C ${x1 + dx} ${y1 - 40}, ${x2 - dx} ${y2 + 40}, ${x2} ${y2}`);
    path.setAttribute('stroke', '#f59e0b'); path.setAttribute('stroke-width', '2.2'); path.setAttribute('fill', 'none');
    path.setAttribute('stroke-dasharray', '7 6');
    path.setAttribute('marker-end', 'url(#rel-arrow)');
    edgesSvg.appendChild(path);
  }
}

function handleRelationClick(nodeId) {
  if (!state.relationMode) return false;
  if (!state.relationStart) {
    state.relationStart = nodeId;
    setStatus('Relation mode: select target topic.');
    return true;
  }
  if (state.relationStart === nodeId) {
    state.relationStart = null;
    setStatus('Relation canceled.');
    return true;
  }
  const exists = state.relations.some((r) => r.source === state.relationStart && r.target === nodeId);
  if (!exists) {
    pushHistory();
    state.relations.push({ id: id(), source: state.relationStart, target: nodeId });
    save();
  }
  state.relationStart = null;
  render();
  return true;
}

function dragNode(el, node) {
  let startX = 0; let startY = 0; let originX = 0; let originY = 0;
  const pointerMove = (ev) => {
    node.x = originX + (ev.clientX - startX) / state.zoom;
    node.y = originY + (ev.clientY - startY) / state.zoom;
    el.style.left = `${node.x}px`; el.style.top = `${node.y}px`;
    drawPaths(new Set(visibleNodes().map((n) => n.id)));
  };
  const pointerUp = () => {
    window.removeEventListener('pointermove', pointerMove);
    window.removeEventListener('pointerup', pointerUp);
    save();
  };
  el.addEventListener('pointerdown', (ev) => {
    if (ev.button !== 0 || ev.target.closest('.collapse-toggle') || state.relationMode) return;
    pushHistory(); select(node.id);
    startX = ev.clientX; startY = ev.clientY; originX = node.x; originY = node.y;
    window.addEventListener('pointermove', pointerMove);
    window.addEventListener('pointerup', pointerUp);
  });
}

function render() {
  canvas.innerHTML = '';
  const q = searchInput.value.trim().toLowerCase();
  const shownNodes = visibleNodes();
  const shownIds = new Set(shownNodes.map((n) => n.id));

  for (const node of shownNodes) {
    const el = document.createElement('div');
    el.className = `node ${state.selected === node.id ? 'active' : ''}`;
    if (q && node.label.toLowerCase().includes(q)) el.classList.add('search-hit');
    el.style.left = `${node.x}px`; el.style.top = `${node.y}px`; el.style.background = node.color;

    const label = document.createElement('span');
    label.className = 'node-main';
    label.textContent = node.label;
    el.appendChild(label);

    const children = getChildren(node.id);
    if (children.length) {
      const collapseToggle = document.createElement('button');
      collapseToggle.className = 'collapse-toggle';
      collapseToggle.type = 'button';
      collapseToggle.textContent = node.collapsed ? '+' : '−';
      collapseToggle.onclick = (event) => {
        event.stopPropagation(); pushHistory(); node.collapsed = !node.collapsed;
        render(); syncEditor(); save();
      };
      el.appendChild(collapseToggle);
    } else {
      const spacer = document.createElement('span'); spacer.textContent = '';
      el.appendChild(spacer);
    }

    const meta = document.createElement('div');
    meta.className = 'node-meta';
    if (node.priority) {
      const b = document.createElement('span'); b.className = 'badge'; b.textContent = `P${node.priority}`; meta.appendChild(b);
    }
    if (node.progress) {
      const b = document.createElement('span'); b.className = 'badge'; b.textContent = `${node.progress}%`; meta.appendChild(b);
    }
    if (meta.children.length) el.appendChild(meta);

    el.onclick = () => {
      if (handleRelationClick(node.id)) return;
      select(node.id);
    };
    dragNode(el, node);
    canvas.appendChild(el);
  }

  drawPaths(shownIds);
  applyViewport();
  const relMode = state.relationMode ? (state.relationStart ? ' • pick target' : ' • pick source') : '';
  setStatus(`${shownNodes.length}/${state.nodes.length} visible • ${state.relations.length} relations • ${Math.round(state.zoom * 100)}% zoom${state.focusRootId ? ' • Focus' : ''}${relMode}`);
}

function subtreeLevels(rootId) {
  const root = byId(rootId);
  if (!root) return [];
  const levels = [[root]];
  const used = new Set([root.id]);
  while (levels.at(-1)?.length) {
    const next = [];
    for (const n of levels.at(-1)) {
      const children = state.nodes.filter((x) => x.parentId === n.id && !used.has(x.id));
      for (const c of children) { used.add(c.id); next.push(c); }
    }
    if (!next.length) break;
    levels.push(next);
  }
  return levels;
}

function layout(direction) {
  pushHistory();
  const root = state.focusRootId ? byId(state.focusRootId) : (state.nodes.find((n) => n.parentId === null) || state.nodes[0]);
  if (!root) return;
  const levels = subtreeLevels(root.id);
  const gapX = 290; const gapY = 110;
  levels.forEach((level, i) => {
    const total = (level.length - 1) * gapY;
    level.forEach((n, index) => {
      if (direction === 'horizontal') { n.x = 220 + i * gapX; n.y = 830 - total / 2 + index * gapY; }
      else { n.x = 1200 - ((level.length - 1) * gapX) / 2 + index * gapX; n.y = 140 + i * gapY; }
    });
  });
  render(); save();
}

function layoutMindmapBalanced() {
  pushHistory();
  const root = state.nodes.find((n) => n.parentId === null) || state.nodes[0];
  if (!root) return;
  root.x = 1200; root.y = 850;
  const children = getChildren(root.id);
  const left = children.filter((_, i) => i % 2 === 0);
  const right = children.filter((_, i) => i % 2 === 1);

  const placeBranch = (branchRoots, dir) => {
    branchRoots.forEach((branchRoot, index) => {
      branchRoot.x = root.x + dir * 340;
      branchRoot.y = root.y - ((branchRoots.length - 1) * 130) / 2 + index * 130;
      const levels = subtreeLevels(branchRoot.id);
      levels.slice(1).forEach((level, depth) => {
        level.forEach((node, idx) => {
          node.x = branchRoot.x + dir * (depth + 1) * 300;
          node.y = branchRoot.y - ((level.length - 1) * 95) / 2 + idx * 95;
        });
      });
    });
  };

  placeBranch(left, -1);
  placeBranch(right, 1);
  render(); save(); fitView();
}

function fitView() {
  const shownNodes = visibleNodes(); if (!shownNodes.length) return;
  const xs = shownNodes.map((n) => n.x); const ys = shownNodes.map((n) => n.y);
  const minX = Math.min(...xs); const maxX = Math.max(...xs) + 210;
  const minY = Math.min(...ys); const maxY = Math.max(...ys) + 70;
  const boxW = Math.max(maxX - minX, 320); const boxH = Math.max(maxY - minY, 240);
  const w = wrap.clientWidth; const h = wrap.clientHeight;
  state.zoom = clamp(Math.min(w / boxW, h / boxH) * 0.9, 0.35, 2.2);
  state.panX = (w - boxW * state.zoom) / 2 - minX * state.zoom;
  state.panY = (h - boxH * state.zoom) / 2 - minY * state.zoom;
  render(); save();
}

function undo() { const snap = history.undo.pop(); if (!snap) return; history.redo.push(makeSnapshot()); restoreSnapshot(snap); }
function redo() { const snap = history.redo.pop(); if (!snap) return; history.undo.push(makeSnapshot()); restoreSnapshot(snap); }

function addChild() {
  pushHistory();
  const base = byId(state.selected) || state.nodes[0]; if (!base) return;
  base.collapsed = false;
  const n = createNode({ label: 'New topic', color: base.color, x: base.x + 250, y: base.y + 90, parentId: base.id });
  select(n.id); save();
}
function addSibling() {
  pushHistory();
  const current = byId(state.selected); if (!current || current.parentId === null) return;
  const n = createNode({ label: 'Sibling topic', color: current.color, x: current.x, y: current.y + 120, parentId: current.parentId });
  select(n.id); save();
}
function addFloating() {
  pushHistory();
  const n = createNode({ label: 'Floating topic', color: '#0ea5e9', x: 760 + Math.random() * 420, y: 560 + Math.random() * 260, parentId: null });
  select(n.id); save();
}
function deleteSelectedNode() {
  const current = byId(state.selected); if (!current || current.parentId === null) return;
  pushHistory();
  const deleted = new Set([current.id]);
  let added = true;
  while (added) {
    added = false;
    for (const n of state.nodes) {
      if (n.parentId && deleted.has(n.parentId) && !deleted.has(n.id)) { deleted.add(n.id); added = true; }
    }
  }
  state.nodes = state.nodes.filter((n) => !deleted.has(n.id));
  state.edges = state.edges.filter((e) => !deleted.has(e.source) && !deleted.has(e.target));
  state.relations = state.relations.filter((r) => !deleted.has(r.source) && !deleted.has(r.target));
  if (state.focusRootId && !byId(state.focusRootId)) state.focusRootId = null;
  select(state.nodes[0]?.id || null); save();
}
function duplicateSubtree() {
  const original = byId(state.selected); if (!original) return;
  pushHistory();
  const descendants = []; const stack = [original];
  while (stack.length) { const current = stack.pop(); descendants.push(current); stack.push(...getChildren(current.id)); }
  const idMap = new Map(); descendants.forEach((node) => idMap.set(node.id, id()));
  for (const node of descendants) {
    state.nodes.push({ ...node, id: idMap.get(node.id), x: node.x + 40, y: node.y + 40, parentId: node.parentId && idMap.has(node.parentId) ? idMap.get(node.parentId) : node.parentId });
  }
  for (const node of descendants) {
    const cloneId = idMap.get(node.id); if (!node.parentId) continue;
    const parent = idMap.has(node.parentId) ? idMap.get(node.parentId) : node.parentId;
    state.edges.push({ id: id(), source: parent, target: cloneId });
  }
  select(idMap.get(original.id)); save();
}
function toggleCollapse() {
  const current = byId(state.selected); if (!current || !getChildren(current.id).length) return;
  pushHistory(); current.collapsed = !current.collapsed; render(); syncEditor(); save();
}
function toggleFocusMode() {
  const current = byId(state.selected); if (!current) return;
  pushHistory(); state.focusRootId = state.focusRootId ? null : current.id; fitView(); syncEditor(); save();
}
function toggleRelationMode() {
  state.relationMode = !state.relationMode;
  state.relationStart = null;
  syncEditor(); render();
}

function exportMap() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = `mindmap-${Date.now()}.json`; a.click();
  URL.revokeObjectURL(url);
}
function toMarkdown() {
  const roots = state.nodes.filter((n) => n.parentId === null);
  const lines = [];
  const walk = (node, depth) => {
    lines.push(`${'  '.repeat(depth)}- ${node.label}`);
    if (node.note?.trim()) lines.push(`${'  '.repeat(depth + 1)}- _note: ${node.note.trim()}_`);
    getChildren(node.id).forEach((c) => walk(c, depth + 1));
  };
  roots.forEach((r) => walk(r, 0));
  return lines.join('\n');
}
function exportMarkdown() {
  const md = toMarkdown();
  const blob = new Blob([md], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = `mindmap-${Date.now()}.md`; a.click();
  URL.revokeObjectURL(url);
}
function importMarkdownText(markdown) {
  const lines = markdown.split('\n').filter((line) => line.trim().startsWith('- '));
  if (!lines.length) throw new Error('invalid markdown outline');
  const parsed = lines.map((line) => {
    const indent = line.match(/^\s*/)?.[0].length || 0;
    return { depth: Math.floor(indent / 2), content: line.trim().slice(2).trim() };
  });
  const nodes = []; const edges = []; const stack = [];
  for (const item of parsed) {
    if (item.content.startsWith('_note:') && stack.length) {
      stack.at(-1).node.note = item.content.replace(/^_note:\s*/i, '').replace(/_$/, '').trim();
      continue;
    }
    while (stack.length > item.depth) stack.pop();
    const parent = stack.at(-1)?.node || null;
    const node = { id: id(), label: item.content || 'Untitled', note: '', color: parent?.color || '#2563eb', x: 340 + item.depth * 300, y: 220 + nodes.length * 70, parentId: parent?.id || null, collapsed: false, priority: 0, progress: 0 };
    nodes.push(node);
    if (parent) edges.push({ id: id(), source: parent.id, target: node.id });
    stack.push({ depth: item.depth, node });
  }
  state.nodes = nodes; state.edges = edges; state.relations = []; state.selected = nodes[0]?.id || null; state.focusRootId = null;
  render(); syncEditor(); fitView(); save(); setStatus('Markdown imported.');
}

function applyTemplate(kind) {
  pushHistory(); state.nodes = []; state.edges = []; state.relations = []; state.focusRootId = null;
  const templates = {
    project: ['Scope', 'Timeline', 'Team', 'Risks', 'Budget'],
    study: ['Overview', 'Key Concepts', 'Examples', 'Exercises', 'Revision'],
    content: ['Audience', 'Channels', 'Calendar', 'Assets', 'KPIs']
  };
  const root = createNode({ label: kind === 'study' ? 'Study Topic' : kind === 'content' ? 'Content Strategy' : 'Project Launch', x: 1200, y: 850 });
  templates[kind].forEach((label, i) => createNode({ label, x: 1500, y: 520 + i * 125, parentId: root.id, color: ['#2563eb','#16a34a','#dc2626','#7c3aed','#0891b2'][i % 5] }));
  state.selected = root.id;
  layoutMindmapBalanced();
}

function isTypingInInput(target) {
  return target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement || target.isContentEditable;
}

function openCommandPalette() {
  renderCommandList(); commandDialog.showModal(); commandSearchInput.value = ''; commandSearchInput.focus();
}
function closeCommandPalette() { if (commandDialog.open) commandDialog.close(); }
function commandItems() {
  return [
    { name: 'Add Child', run: addChild },
    { name: 'Add Sibling', run: addSibling },
    { name: 'Add Floating Topic', run: addFloating },
    { name: 'Duplicate Subtree', run: duplicateSubtree },
    { name: 'Toggle Collapse', run: toggleCollapse },
    { name: 'Toggle Focus Mode', run: toggleFocusMode },
    { name: 'Toggle Relation Mode', run: toggleRelationMode },
    { name: 'Layout MindMap Balanced', run: layoutMindmapBalanced },
    { name: 'Layout Tree Horizontal', run: () => layout('horizontal') },
    { name: 'Layout Tree Vertical', run: () => layout('vertical') },
    { name: 'Export JSON', run: exportMap },
    { name: 'Export Markdown', run: exportMarkdown }
  ];
}
function renderCommandList() {
  const query = commandSearchInput.value.trim().toLowerCase(); commandList.innerHTML = '';
  commandItems().filter((item) => item.name.toLowerCase().includes(query)).forEach((item) => {
    const button = document.createElement('button'); button.className = 'command-item'; button.textContent = item.name;
    button.onclick = () => { item.run(); closeCommandPalette(); }; commandList.appendChild(button);
  });
}

document.getElementById('add-child').onclick = addChild;
document.getElementById('add-sibling').onclick = addSibling;
document.getElementById('add-floating').onclick = addFloating;
document.getElementById('duplicate-node').onclick = duplicateSubtree;
document.getElementById('toggle-collapse').onclick = toggleCollapse;
document.getElementById('focus-mode').onclick = toggleFocusMode;
document.getElementById('relation-mode').onclick = toggleRelationMode;
document.getElementById('delete-node').onclick = deleteSelectedNode;
document.getElementById('layout-mindmap').onclick = layoutMindmapBalanced;
document.getElementById('layout-horizontal').onclick = () => layout('horizontal');
document.getElementById('layout-vertical').onclick = () => layout('vertical');

document.getElementById('zoom-in').onclick = () => { state.zoom = clamp(state.zoom + 0.1, 0.35, 2.5); render(); save(); };
document.getElementById('zoom-out').onclick = () => { state.zoom = clamp(state.zoom - 0.1, 0.35, 2.5); render(); save(); };
document.getElementById('fit-view').onclick = fitView;
document.getElementById('undo').onclick = undo;
document.getElementById('redo').onclick = redo;
document.getElementById('export-map').onclick = exportMap;
document.getElementById('export-md').onclick = exportMarkdown;
document.getElementById('command-palette').onclick = openCommandPalette;

document.getElementById('templates').onclick = () => templatesDialog.showModal();
document.getElementById('close-templates').onclick = () => templatesDialog.close();
document.querySelectorAll('[data-template]').forEach((button) => {
  button.onclick = () => { applyTemplate(button.dataset.template); templatesDialog.close(); };
});

document.getElementById('close-command').onclick = closeCommandPalette;
commandSearchInput.oninput = renderCommandList;

document.getElementById('import-map').onchange = (event) => {
  const file = event.target.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const incoming = JSON.parse(String(reader.result));
      if (!Array.isArray(incoming.nodes) || !Array.isArray(incoming.edges)) throw new Error('invalid');
      pushHistory();
      state.nodes = incoming.nodes.map((n) => ({ ...n, collapsed: Boolean(n.collapsed), priority: Number(n.priority) || 0, progress: Number(n.progress) || 0 }));
      state.edges = incoming.edges;
      state.relations = Array.isArray(incoming.relations) ? incoming.relations : [];
      state.selected = incoming.selected || state.nodes[0]?.id || null;
      state.zoom = clamp(Number(incoming.zoom) || 1, 0.35, 2.5);
      state.panX = Number(incoming.panX) || 0;
      state.panY = Number(incoming.panY) || 0;
      state.focusRootId = incoming.focusRootId || null;
      render(); syncEditor(); save(); setStatus('Map imported.');
    } catch { setStatus('Invalid map file.'); }
  };
  reader.readAsText(file); event.target.value = '';
};

document.getElementById('import-md').onchange = (event) => {
  const file = event.target.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try { pushHistory(); importMarkdownText(String(reader.result)); }
    catch { setStatus('Invalid Markdown outline.'); }
  };
  reader.readAsText(file); event.target.value = '';
};

document.getElementById('reset-map').onclick = () => { pushHistory(); seed(); render(); syncEditor(); save(); };

labelInput.oninput = (e) => { const current = byId(state.selected); if (!current) return; current.label = e.target.value.slice(0, 80); render(); save(); };
noteInput.oninput = (e) => { const current = byId(state.selected); if (!current) return; current.note = e.target.value; save(); };
colorInput.oninput = (e) => { const current = byId(state.selected); if (!current) return; current.color = e.target.value; render(); save(); };
priorityInput.oninput = (e) => { const current = byId(state.selected); if (!current) return; current.priority = Number(e.target.value) || 0; render(); save(); };
progressInput.oninput = (e) => {
  const current = byId(state.selected); if (!current) return;
  current.progress = Number(e.target.value) || 0;
  progressLabel.textContent = `${current.progress}%`;
  render(); save();
};

searchInput.oninput = () => {
  render();
  const q = searchInput.value.trim().toLowerCase(); if (!q) return;
  const hit = visibleNodes().find((n) => n.label.toLowerCase().includes(q));
  if (hit) select(hit.id);
};

document.getElementById('toggle-theme').onclick = () => { state.theme = state.theme === 'dark' ? 'light' : 'dark'; applyTheme(); save(); };
function applyTheme() { document.body.className = state.theme; document.getElementById('toggle-theme').textContent = state.theme === 'dark' ? '☀️' : '🌙'; }

let panning = false; let panStartX = 0; let panStartY = 0; let panOriginX = 0; let panOriginY = 0;
wrap.addEventListener('pointerdown', (ev) => {
  if (ev.target.closest('.node')) return;
  panning = true; panStartX = ev.clientX; panStartY = ev.clientY; panOriginX = state.panX; panOriginY = state.panY;
});
window.addEventListener('pointermove', (ev) => {
  if (!panning) return;
  state.panX = panOriginX + (ev.clientX - panStartX); state.panY = panOriginY + (ev.clientY - panStartY); applyViewport();
});
window.addEventListener('pointerup', () => { if (panning) save(); panning = false; });

wrap.addEventListener('wheel', (ev) => {
  ev.preventDefault();
  const prev = state.zoom;
  state.zoom = clamp(state.zoom + (ev.deltaY < 0 ? 0.06 : -0.06), 0.35, 2.5);
  const rect = wrap.getBoundingClientRect();
  const mx = ev.clientX - rect.left; const my = ev.clientY - rect.top;
  state.panX = mx - ((mx - state.panX) / prev) * state.zoom;
  state.panY = my - ((my - state.panY) / prev) * state.zoom;
  render(); save();
}, { passive: false });

window.addEventListener('keydown', (ev) => {
  if (isTypingInInput(ev.target) && ev.key !== 'Escape') return;
  const ctrl = ev.ctrlKey || ev.metaKey;
  const selectedNode = byId(state.selected);

  if (ev.key === 'Escape') {
    if (commandDialog.open) commandDialog.close();
    if (templatesDialog.open) templatesDialog.close();
    state.relationStart = null;
    return;
  }
  if (ctrl && ev.key.toLowerCase() === 'k') { ev.preventDefault(); openCommandPalette(); return; }
  if (ctrl && ev.key.toLowerCase() === 'z') { ev.preventDefault(); if (ev.shiftKey) redo(); else undo(); return; }
  if (ctrl && ev.key.toLowerCase() === 'y') { ev.preventDefault(); redo(); return; }
  if (ctrl && ev.key.toLowerCase() === 'd') { ev.preventDefault(); duplicateSubtree(); return; }
  if (ev.key.toLowerCase() === 'f') { ev.preventDefault(); toggleFocusMode(); return; }
  if (ev.key.toLowerCase() === 'r') { ev.preventDefault(); toggleRelationMode(); return; }
  if (ev.key === 'Tab') { ev.preventDefault(); addChild(); return; }
  if (ev.key === 'Enter') { ev.preventDefault(); addSibling(); return; }
  if (ev.key === ' ') { ev.preventDefault(); toggleCollapse(); return; }
  if (ev.key === 'Delete') { ev.preventDefault(); deleteSelectedNode(); return; }
  if (!selectedNode) return;

  if (ev.key === 'ArrowLeft' && selectedNode.parentId) { ev.preventDefault(); select(selectedNode.parentId); }
  if (ev.key === 'ArrowRight') { ev.preventDefault(); const firstChild = getChildren(selectedNode.id)[0]; if (firstChild) select(firstChild.id); }
  if (ev.key === 'ArrowUp' && selectedNode.parentId) {
    ev.preventDefault(); const siblings = getChildren(selectedNode.parentId); const index = siblings.findIndex((n) => n.id === selectedNode.id);
    if (index > 0) select(siblings[index - 1].id);
  }
  if (ev.key === 'ArrowDown' && selectedNode.parentId) {
    ev.preventDefault(); const siblings = getChildren(selectedNode.parentId); const index = siblings.findIndex((n) => n.id === selectedNode.id);
    if (index >= 0 && index < siblings.length - 1) select(siblings[index + 1].id);
  }
});

load();
applyTheme();
render();
syncEditor();
fitView();
