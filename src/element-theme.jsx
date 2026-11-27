import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  applyLayout,
  corners,
  layoutControls,
  layerValue,
  sides,
} from './layer-properties';
import {
  editable,
  childrenOf,
  selectorFor,
  layerName,
  canReorder,
  orderedChildren,
  validGroup,
} from './layer-model';

import { selectionRoots } from './selection-geometry';
import { syncPlacements } from './page-layers';
const styleKeys = new Set([
  'base',
  'background',
  'transparent',
  'border',
  'radius',
  'thickness',
  'shadow',
  'font',
  'size',
  'borderStyle',
  'opacity',
  'weight',
  'fontStyle',
  'tracking',
  'leading',
  'align',
  'stroke',
  'fill',
  'strokeWidth',
  'textDecoration',
  'textTransform',
  'gradientType',
  'gradientColor',
  'gradientAngle',
  'filterBlur',
  'filterBrightness',
  'filterContrast',
  'filterGrayscale',
  'filterSaturate',
  'filterHueRotate',
  'flipH',
  'flipV',
  ...Object.keys(corners),
  ...Object.values(sides).flatMap((side) => [
    'border' + side,
    'padding' + side,
    'margin' + side,
  ]),
]);
function pastePatch(copied) {
  const patch = { ...copied };
  if (patch.radius !== undefined)
    for (const key of Object.keys(corners)) patch[key] = copied[key];
  if (patch.thickness !== undefined)
    for (const side of Object.values(sides))
      patch['border' + side] = copied['border' + side];
  if (patch.padding !== undefined)
    for (const side of Object.values(sides))
      patch['padding' + side] = copied['padding' + side];
  if (patch.margin !== undefined)
    for (const side of Object.values(sides))
      patch['margin' + side] = copied['margin' + side];
  return patch;
}
const storageKey = 'sasta-element-styles-v1';
function load() {
  try {
    const rows = JSON.parse(localStorage.getItem(storageKey));
    return Array.isArray(rows)
      ? rows.filter(
          (row) =>
            (row?.selector?.startsWith('#root > ') ||
              row?.selector?.startsWith('#root [data-layer-id=')) &&
            typeof row.path === 'string' &&
            row.metrics &&
            row.values
        )
      : [];
  } catch {
    return [];
  }
}
function save(rows) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(rows));
  } catch {
    /* Browser storage is optional. */
  }
}
function rgb(value, fallback) {
  const channels = value.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  return channels
    ? '#' +
        channels
          .slice(1)
          .map((n) => Number(n).toString(16).padStart(2, '0'))
          .join('')
    : fallback;
}
export function controlFor(name, controls) {
  if (name === 'radius') return { ...controls.radius, min: 0, max: 2000 };
  if (name === 'thickness') return { ...controls.thickness, min: 0, max: 200 };
  if (name === 'size') return { ...controls.size, min: 10, max: 1000 };
  return layoutControls[name] || controls[name];
}
const same = (a, b) => a?.selector === b?.selector && a?.path === b?.path;
let cloneSeq = 0;
const makeCloneId = () => `clone_${Date.now().toString(36)}_${++cloneSeq}`;
function pointsToSmoothPath(pts, ox, oy) {
  if (!pts.length) return '';
  if (pts.length === 1) {
    const x = +(pts[0].x - ox).toFixed(1);
    const y = +(pts[0].y - oy).toFixed(1);
    return `M ${x} ${y} L ${(x + 0.5).toFixed(1)} ${y}`;
  }
  const p0 = { x: pts[0].x - ox, y: pts[0].y - oy };
  let d = `M ${p0.x.toFixed(1)} ${p0.y.toFixed(1)}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const cur = { x: pts[i].x - ox, y: pts[i].y - oy };
    const next = { x: pts[i + 1].x - ox, y: pts[i + 1].y - oy };
    const midX = ((cur.x + next.x) / 2).toFixed(1);
    const midY = ((cur.y + next.y) / 2).toFixed(1);
    d += ` Q ${cur.x.toFixed(1)} ${cur.y.toFixed(1)} ${midX} ${midY}`;
  }
  const last = pts[pts.length - 1];
  d += ` L ${(last.x - ox).toFixed(1)} ${(last.y - oy).toFixed(1)}`;
  return d;
}
function findDrawContainer(clientPoint, fallbackNode) {
  const main = document.getElementById('main');
  if (clientPoint) {
    const lead = document.querySelector('figure.lead-photo');
    if (lead) {
      const r = lead.getBoundingClientRect();
      if (
        clientPoint.x >= r.left - 28 &&
        clientPoint.x <= r.right + 28 &&
        clientPoint.y >= r.top - 28 &&
        clientPoint.y <= r.bottom + 28 &&
        lead.dataset.layerId
      )
        return lead;
    }
    const stack = document.elementsFromPoint(clientPoint.x, clientPoint.y);
    for (const el of stack) {
      if (
        el.closest?.('[data-editor-ui],.theme-picker,[data-layer-added]') ||
        !editable(el)
      )
        continue;
      const host = el.closest(
        'section,article,.intro-grid,.visitor-grid,.info-grid,header,footer,#main'
      );
      if (host?.dataset?.layerId) return host;
    }
  }
  if (fallbackNode && editable(fallbackNode)) {
    const host = fallbackNode.closest(
      'figure.lead-photo,section,article,.intro-grid,.visitor-grid,.info-grid,header,footer,#main'
    );
    if (host?.dataset?.layerId) return host;
  }
  return main;
}
const containerTags = new Set([
  'div',
  'section',
  'article',
  'main',
  'aside',
  'ul',
  'ol',
  'header',
  'footer',
  'form',
]);
function canCloneNode(node) {
  return (
    !!node &&
    editable(node) &&
    node.id !== 'root' &&
    node.id !== 'main' &&
    !/^(header|footer)$/i.test(node.localName)
  );
}
function scrubCloneAttrs(el) {
  el.removeAttribute('data-layer-owner');
  el.removeAttribute('data-theme-selected');
  el.removeAttribute('data-theme-hover');
  el.removeAttribute('data-editor-reveal');
  el.removeAttribute('data-layer-drop');
}
function syncClones(entries, path) {
  const root = document.getElementById('root');
  if (!root) return;
  const desired = entries.filter(
    (row) => (row.path === '*' || row.path === path) && row.cloneHtml && row.id
  );
  const desiredIds = new Set(desired.map((row) => row.id));
  for (const existing of [...root.querySelectorAll('[data-layer-clone="1"]')]) {
    if (!desiredIds.has(existing.dataset.layerId)) existing.remove();
  }
  const main = document.getElementById('main');
  for (let pass = 0; pass < 2; pass++) {
    let attached = false;
    for (const row of desired) {
      let el = root.querySelector(
        `[data-layer-id=${CSS.escape(row.id)}][data-layer-clone="1"]`
      );
      if (!el) {
        const tpl = document.createElement('template');
        tpl.innerHTML = row.cloneHtml.trim();
        el = tpl.content.firstElementChild;
        if (!el) continue;
        el.setAttribute('data-layer-id', row.id);
        el.setAttribute('data-layer-clone', '1');
      }
      const parentId = row.values.parent || row.homeParent;
      const parentEl =
        (parentId &&
          root.querySelector(`[data-layer-id=${CSS.escape(parentId)}]`)) ||
        main;
      if (!parentEl || el.contains(parentEl)) continue;
      if (el.parentElement !== parentEl) {
        const afterEl =
          row.cloneAfterId &&
          root.querySelector(`[data-layer-id=${CSS.escape(row.cloneAfterId)}]`);
        if (afterEl && afterEl.parentElement === parentEl) afterEl.after(el);
        else parentEl.appendChild(el);
        attached = true;
      }
    }
    if (!attached) break;
  }
}
function leafText(node) {
  return (
    node &&
    node.childNodes.length &&
    [...node.childNodes].every((n) => n.nodeType === 3 || n.nodeName === 'BR')
  );
}
function ownText(node) {
  if (!node) return null;
  if (leafText(node)) return node.innerText ?? node.textContent;
  const direct = [...node.childNodes].filter((n) => n.nodeType === 3);
  return direct.some((n) => n.data.trim().length > 0)
    ? direct.map((n) => n.data).join('').trim()
    : null;
}
function readLayer(node, path, defaults) {
  const style = getComputedStyle(node),
    font = parseFloat(style.fontSize),
    value = (key) => parseFloat(style[key]) || 0;
  const padding = Object.values(sides).map((side) => value('padding' + side));
  const main = document.getElementById('main');
  const inPage = node.dataset.layerId?.startsWith('clone_')
    ? !!node.closest('#main')
    : node.dataset.layerId && main?.dataset.layerId
      ? node === main ||
        node.dataset.layerId.startsWith(main.dataset.layerId + '/')
      : !!node.closest('#main');
  const initial = {
    ...defaults,
    font: style.fontFamily.includes('BaskervilleTrust')
      ? 'classic'
      : style.fontFamily.includes('Georgia')
        ? 'traditional'
        : 'clean',
    transparent:
      style.backgroundImage === 'none' &&
      style.backgroundColor === 'rgba(0, 0, 0, 0)',
    base: rgb(style.color, defaults.base),
    background: rgb(style.backgroundColor, defaults.background),
    border: rgb(style.borderTopColor, defaults.border),
    radius: value('borderTopLeftRadius'),
    thickness: value('borderTopWidth'),
    width: Math.round(
      parseFloat(style.width) || node.getBoundingClientRect().width
    ),
    height: Math.round(
      parseFloat(style.height) || node.getBoundingClientRect().height
    ),
    opacity: Math.round(Number(style.opacity) * 100),
    padding: padding[0],
    margin: value('marginTop'),
    gap: value('gap'),
    order: value('order'),
    layer: value('zIndex'),
    weight: style.fontWeight,
    fontStyle: style.fontStyle,
    tracking: value('letterSpacing'),
    leading: Number((parseFloat(style.lineHeight) / font).toFixed(2)) || 1.2,
    strokeWidth: value('strokeWidth'),
    align: style.textAlign,
    fit: style.objectFit,
    overflow: style.overflow,
    borderStyle: style.borderTopStyle,
    textDecoration:
      style.textDecorationLine === 'none'
        ? 'none'
        : style.textDecorationLine.split(' ')[0] || 'none',
    textTransform: style.textTransform || 'none',
    gradientType: 'solid',
    gradientColor: defaults.base,
    gradientAngle: 135,
    filterBlur: 0,
    filterBrightness: 100,
    filterContrast: 100,
    filterGrayscale: 0,
    filterSaturate: 100,
    filterHueRotate: 0,
    text: ownText(node),
  };
  for (const [key, side] of Object.entries(corners))
    initial[key] = value(
      'border' +
        side
          .split(' ')
          .map((t) => t[0].toUpperCase() + t.slice(1))
          .join('') +
        'Radius'
    );
  for (const [index, side] of Object.values(sides).entries()) {
    initial['border' + side] = value('border' + side + 'Width');
    initial['padding' + side] = padding[index];
    initial['margin' + side] = value('margin' + side);
  }
  return {
    id: node.dataset.layerId,
    homeParent: node.parentElement.dataset.layerId,
    path: inPage ? path : '*',
    selector: selectorFor(node),
    name: node.localName + ' · ' + layerName(node),
    initial,
    metrics: {
      font,
      padding,
      inline: style.display === 'inline',
      position: style.position,
    },
    values: {},
  };
}
function styleLayer(sheet, entry, controls) {
  const rule =
    sheet.cssRules[
      sheet.insertRule(entry.selector + ' {}', sheet.cssRules.length)
    ];
  const set = (prop, value) => rule.style.setProperty(prop, value, 'important'),
    values = {};
  for (const [key, value] of Object.entries(entry.values)) {
    const prop = {
      base: 'color',
      background: 'background-color',
      border: 'border-color',
    }[key];
    if ((key === 'fill' || key === 'stroke') && /^#[0-9a-f]{6}$/i.test(value)) {
      set(key, value);
      continue;
    }
    if (prop && /^#[0-9a-f]{6}$/i.test(value)) {
      set(prop, value);
      if (
        key === 'background' &&
        (!entry.values.gradientType || entry.values.gradientType === 'solid')
      )
        set('background-image', 'none');
      continue;
    }
    const control = controlFor(key, controls);
    if (
      control &&
      (control.options
        ? Object.hasOwn(control.options, value)
        : Number.isFinite(value) &&
          value >= control.min &&
          value <= control.max)
    )
      values[key] = value;
  }
  if (entry.values.hidden === true) values.hidden = true;
  if (entry.values.flipH === true) values.flipH = true;
  if (entry.values.flipV === true) values.flipV = true;
  if (entry.values.transparent === true) {
    set('background-color', 'transparent');
    set('background-image', 'none');
  } else if (
    entry.values.gradientType === 'linear' ||
    entry.values.gradientType === 'radial'
  ) {
    const c1 = /^#[0-9a-f]{6}$/i.test(entry.values.background)
      ? entry.values.background
      : entry.initial?.background || '#fffdfa';
    const c2 = /^#[0-9a-f]{6}$/i.test(entry.values.gradientColor)
      ? entry.values.gradientColor
      : entry.initial?.gradientColor || '#623449';
    const angle = Number.isFinite(entry.values.gradientAngle)
      ? entry.values.gradientAngle
      : 135;
    set(
      'background-image',
      entry.values.gradientType === 'linear'
        ? `linear-gradient(${angle}deg, ${c1}, ${c2})`
        : `radial-gradient(circle, ${c1}, ${c2})`
    );
  }
  if (values.radius !== undefined) set('border-radius', values.radius + 'px');
  if (
    values.thickness !== undefined ||
    Object.keys(sides).some(
      (side) => values['border' + sides[side]] !== undefined
    )
  ) {
    set('border-style', 'solid');
    if (values.thickness !== undefined)
      set('border-width', values.thickness + 'px');
  }
  if (values.shadow)
    set(
      'box-shadow',
      {
        none: 'none',
        soft: '0 4px 14px #00000012',
        strong: '0 8px 24px #00000026',
      }[values.shadow]
    );
  if (values.font)
    set(
      'font-family',
      {
        classic: 'BaskervilleTrust, Georgia, serif',
        clean: 'Inter, Arial, sans-serif',
        traditional: 'Georgia, serif',
      }[values.font]
    );
  if (values.size !== undefined && Number.isFinite(entry.metrics.font))
    set('font-size', (entry.metrics.font * values.size) / 100 + 'px');
  if (values.spacing !== undefined && Array.isArray(entry.metrics.padding))
    set(
      'padding',
      entry.metrics.padding
        .map(
          (n) => ((Number.isFinite(n) ? n : 0) * values.spacing) / 100 + 'px'
        )
        .join(' ')
    );
  let metrics = entry.metrics;
  if (metrics.inline === undefined) {
    const el = document.querySelector(entry.selector);
    if (el) {
      const s = getComputedStyle(el);
      metrics = {
        ...metrics,
        inline: s.display === 'inline',
        position: s.position,
      };
    }
  }
  applyLayout(values, set, metrics);
  if (typeof entry.values.text === 'string') {
    set('white-space', 'pre-line');
    sheet.insertRule(
      entry.selector + ' > br {display:none !important}',
      sheet.cssRules.length
    );
  }
}
export function useElementTheme(
  location,
  menu,
  defaults,
  controls,
  palette,
  setPalette
) {
  const path = location.pathname;
  const [entries, setEntries] = useState(load),
    [selection, setSelection] = useState([]),
    [multiPick, setMultiPick] = useState(false),
    [copiedStyle, setCopiedStyle] = useState(null),
    [copiedElement, setCopiedElement] = useState(null),
    [clipboardMode, setClipboardMode] = useState('style'),
    [paintMode, setPaintMode] = useState(null),
    [drawTool, setDrawTool] = useState(null),
    [confirmingDelete, setConfirmingDelete] = useState(false),
    [editingText, setEditingText] = useState(null),
    [picking, setPicking] = useState(false),
    [editing, setEditing] = useState(false),
    [history, setHistory] = useState({ past: [], future: [] });
  const selectedRows = selection.map(
    (seed) => entries.find((row) => same(row, seed)) || seed
  );
  const selected = selectedRows.at(-1);
  const selectionKey = JSON.stringify(selection.map((row) => row.selector));
  const hasSelection = (node) =>
    selectedRows.some((row) => node?.matches(row.selector));
  function replaceSelection(rows) {
    setSelection(rows.map((row) => ({ ...row, values: {} })));
  }
  const latest = useRef(),
    gesture = useRef(null),
    historyRef = useRef(history);
  latest.current = { entries, palette };
  historyRef.current = history;
  function commitHistory(next) {
    historyRef.current = next;
    setHistory(next);
  }
  function remember(before = latest.current) {
    const h = historyRef.current;
    commitHistory({ past: [...h.past.slice(-59), before], future: [] });
  }
  function restore(snapshot) {
    latest.current = snapshot;
    setEntries(snapshot.entries);
    setPalette(snapshot.palette);
  }
  function undo() {
    const h = historyRef.current;
    if (!h.past.length) return;
    const target = h.past.at(-1),
      current = latest.current;
    restore(target);
    commitHistory({
      past: h.past.slice(0, -1),
      future: [current, ...h.future],
    });
  }
  function redo() {
    const h = historyRef.current;
    if (!h.future.length) return;
    const target = h.future[0],
      current = latest.current;
    restore(target);
    commitHistory({
      past: [...h.past, current],
      future: h.future.slice(1),
    });
  }
  const lookup = useRef({});
  const find = (node) => {
    const rows = latest.current.entries;
    if (lookup.current.rows !== rows || lookup.current.path !== path) {
      const ids = new Map(),
        legacy = [];
      for (const row of rows) {
        if (row.path !== '*' && row.path !== path) continue;
        if (row.id) ids.set(row.id, row);
        else legacy.push(row);
      }
      lookup.current = { rows, path, ids, legacy };
    }
    return (
      lookup.current.ids.get(node.dataset.layerId) ||
      lookup.current.legacy.find((row) => node.matches(row.selector))
    );
  };
  const rowFor = (node) => {
    const saved = find(node);
    if (!saved) return readLayer(node, path, defaults);
    const next =
      saved.id || !node.dataset.layerId
        ? saved
        : {
            ...saved,
            id: node.dataset.layerId,
            homeParent: node.parentElement.dataset.layerId,
          };
    if (next.initial?.text == null) {
      const detected = ownText(node);
      if (detected != null)
        return { ...next, initial: { ...next.initial, text: detected } };
    }
    return next;
  };
  function choose(node, add = false) {
    if (!editable(node)) return;
    const row = rowFor(node);
    if (add && editing) {
      setSelection((prev) =>
        prev.some((item) => same(item, row))
          ? prev.filter((item) => !same(item, row))
          : [...prev, { ...row, values: {} }]
      );
    } else replaceSelection([row]);
    setPicking(false);
    if (!editing && menu.current) menu.current.open = true;
    return row;
  }
  function selectNodes(nodes, add = false) {
    const next = nodes.filter(editable).map(rowFor);
    replaceSelection(
      add
        ? [
            ...selectedRows,
            ...next.filter(
              (row) => !selectedRows.some((item) => same(item, row))
            ),
          ]
        : next
    );
  }
  function change(changes, focus, record = true) {
    const rows = [...latest.current.entries];
    let modified = false;
    for (const [row, values] of changes) {
      const i = rows.findIndex((r) => same(r, row));
      const previous = (rows[i] || row).values;
      if (
        Object.entries(values).every(([key, value]) => previous[key] === value)
      )
        continue;
      modified = true;
      const merged = { ...previous, ...values };
      for (const key of Object.keys(merged))
        if (merged[key] === undefined) delete merged[key];
      const result = { ...row, values: merged };
      if (i < 0) rows.push(result);
      else rows[i] = result;
    }
    if (!modified) return;
    if (record) remember();
    latest.current = { ...latest.current, entries: rows };
    setEntries(rows);
    if (focus && !selection.some((item) => same(item, focus)))
      replaceSelection([focus]);
  }
  function locked(node) {
    for (let p = node; editable(p); p = p.parentElement) {
      if (find(p)?.values.locked) return true;
    }
    return false;
  }
  function editMany(changes, record = true) {
    if (!changes.length) return;
    for (const [row, values] of changes) {
      const node = document.querySelector(row.selector);
      if (!node || (locked(node) && !Object.hasOwn(values, 'locked'))) return;
    }
    change(changes, null, record);
  }
  function batch(values, record = true, target) {
    const rows = target ? [target] : selectedRows;
    editMany(
      rows.map((row) => [row, values]),
      record
    );
  }
  function update(key, value) {
    const changes = selectedRows.map((row) => {
      const patch = { [key]: value };
      if (key === 'layout' && value === 'original') patch.columns = undefined;
      if (key === 'background') patch.transparent = false;
      if (key === 'gradientType' && value !== 'solid') patch.transparent = false;
      if (
        (key === 'gradientColor' || key === 'gradientAngle') &&
        (!row.values.gradientType || row.values.gradientType === 'solid')
      ) {
        patch.gradientType = 'linear';
        patch.transparent = false;
      }
      if (key === 'spacing') patch.padding = undefined;
      if (
        value > 0 &&
        (key === 'thickness' ||
          Object.values(sides).some((s) => key === 'border' + s)) &&
        row.values.borderStyle === 'none'
      )
        patch.borderStyle = 'solid';
      if (key === 'radius')
        for (const name of Object.keys(corners)) patch[name] = undefined;
      if (key === 'thickness')
        for (const side of Object.values(sides))
          patch['border' + side] = undefined;
      if (key === 'padding')
        for (const side of Object.values(sides))
          patch['padding' + side] = undefined;
      if (key === 'margin')
        for (const side of Object.values(sides))
          patch['margin' + side] = undefined;
      return [row, patch];
    });
    editMany(changes);
  }
  function similarSiblings() {
    const node = selected && document.querySelector(selected.selector);
    if (!node) return [];
    const classes = [...node.classList].filter((c) => c !== 'active');
    return childrenOf(node.parentElement).filter(
      (n) =>
        n !== node &&
        n.localName === node.localName &&
        classes.every((c) => n.classList.contains(c))
    );
  }
  function selectSimilar() {
    replaceSelection([...similarSiblings().map(rowFor), selected]);
  }
  function pageSimilarNodes() {
    const node = selected && document.querySelector(selected.selector);
    if (!node) return [];
    const classes = [...node.classList].filter((c) => c !== 'active');
    const main = document.getElementById('main');
    const inMain = main && main.contains(node);
    const scope = inMain ? main : document.getElementById('root');
    return [...scope.querySelectorAll(node.localName)].filter(
      (n) =>
        n !== node &&
        editable(n) &&
        !find(n)?.values.deleted &&
        (!main || inMain || !main.contains(n)) &&
        classes.every((c) => n.classList.contains(c))
    );
  }
  function selectPageSimilar() {
    const matches = pageSimilarNodes();
    if (matches.length) replaceSelection([...matches.map(rowFor), selected]);
  }
  // Select all sibling layers in the current container, or top-level sections
  function selectAll() {
    const node = selected && document.querySelector(selected.selector);
    const parent = node?.parentElement;
    const siblings = parent && editable(parent) ? childrenOf(parent) : [];
    const target = (
      siblings.length > 1 && siblings.some((n) => !hasSelection(n))
        ? siblings
        : childrenOf(
            document.getElementById('main') || document.getElementById('root')
          )
    ).filter((n) => !find(n)?.values.deleted);
    replaceSelection(target.map(rowFor));
  }
  // Select all direct editable children of the selected element
  function selectChildren() {
    const node = selected && document.querySelector(selected.selector);
    if (!node) return;
    const kids = childrenOf(node).filter((n) => !find(n)?.values.deleted);
    if (kids.length) replaceSelection(kids.map(rowFor));
  }
  function moveSelectedTo(node, parent, target = null, after = true) {
    const moving = selectionRoots(selectedRows);
    if (!hasSelection(node) || selectedRows.length < 2) return false;
    if (
      !parent ||
      locked(parent) ||
      (target && (locked(target) || target.parentElement !== parent)) ||
      selectedRows.some((r) => locked(document.querySelector(r.selector)))
    )
      return false;
    const nodes = moving.map((i) => i.node);
    if (
      nodes.includes(target) ||
      nodes.some(
        (n) =>
          n.contains(parent) ||
          (n.parentElement === parent ? !canReorder(n) : !validGroup(n, parent))
      )
    )
      return false;
    const rest = orderedChildren(parent).filter((n) => !nodes.includes(n));
    const at = target ? rest.indexOf(target) + (after ? 1 : 0) : rest.length;
    const parents = [...new Set(nodes.map((n) => n.parentElement))];
    const ordered = parents.flatMap((p) =>
      orderedChildren(p).filter((n) => nodes.includes(n))
    );
    rest.splice(at, 0, ...ordered);
    const edits = rest.map((n, i) => {
      const row = rowFor(n),
        values = { order: i };
      if (nodes.includes(n) && n.parentElement !== parent)
        Object.assign(values, {
          parent:
            parent.dataset.layerId === row.homeParent
              ? undefined
              : parent.dataset.layerId,
          x: undefined,
          y: undefined,
        });
      return [row, values];
    });
    if (
      !/flex|grid/.test(getComputedStyle(parent).display) &&
      parent.id !== 'root'
    )
      edits.push([rowFor(parent), { layout: 'column' }]);
    change(edits, null);
    return true;
  }
  function reorder(node, target, after) {
    if (selectedRows.length > 1 && hasSelection(node))
      return moveSelectedTo(node, target?.parentElement, target, after);
    if (
      !canReorder(node) ||
      node === target ||
      node.parentElement !== target?.parentElement ||
      locked(node) ||
      locked(target)
    )
      return false;
    const parent = node.parentElement,
      siblings = orderedChildren(parent),
      rest = siblings.filter((n) => n !== node);
    rest.splice(rest.indexOf(target) + (after ? 1 : 0), 0, node);
    if (rest.every((n, i) => n === siblings[i])) return false;
    const edits = rest.map((n, i) => [rowFor(n), { order: i }]);
    if (!/flex|grid/.test(getComputedStyle(parent).display))
      edits.push([
        rowFor(parent),
        {
          layout: getComputedStyle(node).display.startsWith('inline')
            ? 'row'
            : 'column',
        },
      ]);
    change(edits, rowFor(node));
    return true;
  }
  function moveTo(node, parent, target = null, after = true) {
    if (selectedRows.length > 1 && hasSelection(node))
      return moveSelectedTo(node, parent, target, after);
    if (
      !validGroup(node, parent) ||
      locked(node) ||
      locked(parent) ||
      (target && target.parentElement !== parent)
    )
      return false;
    if (node.parentElement === parent) {
      if (target) return reorder(node, target, after);
      return false;
    }
    const row = rowFor(node),
      siblings = orderedChildren(parent);
    const at = target
      ? siblings.indexOf(target) + (after ? 1 : 0)
      : siblings.length;
    siblings.splice(at, 0, node);
    const edits = siblings.map((s, i) =>
      s === node
        ? [
            row,
            {
              parent:
                parent.dataset.layerId === row.homeParent
                  ? undefined
                  : parent.dataset.layerId,
              order: i,
              x: undefined,
              y: undefined,
            },
          ]
        : [rowFor(s), { order: i }]
    );
    if (target && !/flex|grid/.test(getComputedStyle(parent).display))
      edits.push([rowFor(parent), { layout: 'column' }]);
    change(edits, row);
    return true;
  }
  function stepOrder(node, step) {
    if (!node) return;
    const siblings = orderedChildren(node.parentElement),
      target = siblings[siblings.indexOf(node) + step];
    if (target) reorder(node, target, step > 0);
  }
  function stack(node, front) {
    if (!node || locked(node)) return;
    const siblings = orderedChildren(node.parentElement).filter(
      (n) => n !== node
    );
    const row = rowFor(node);
    const current = layerValue(row, 'layer') || 0;
    if (!siblings.length) {
      change([[row, { layer: front ? Math.min(10000, current + 1) : 0 }]], row);
      return;
    }
    const levels = siblings.map(
      (n) => parseInt(getComputedStyle(n).zIndex) || 0
    );
    // A non-negative level keeps a back layer above the group's background.
    const min = Math.min(...levels),
      max = Math.max(...levels);
    const edits = front
      ? [[row, { layer: Math.min(10000, Math.max(max + 1, current)) }]]
      : [
          ...siblings.map((n, i) => [
            rowFor(n),
            { layer: Math.min(10000, levels[i] - min + 1) },
          ]),
          [row, { layer: 0 }],
        ];
    change(edits, row);
  }
  useLayoutEffect(() => {
    syncClones(entries, path);
    syncPlacements(entries, path);
    if (!entries.some((r) => !r.id && (r.path === '*' || r.path === path)))
      return;
    let changed = false;
    const migrated = entries.map((row) => {
      if (row.id || (row.path !== '*' && row.path !== path)) return row;
      let node;
      try {
        node = document.querySelector(row.selector);
      } catch {
        return row;
      }
      if (!node?.dataset.layerId) return row;
      changed = true;
      return {
        ...row,
        id: node.dataset.layerId,
        selector: selectorFor(node),
        homeParent: node.parentElement.dataset.layerId,
      };
    });
    if (changed) setEntries(migrated);
  }, [entries, path]);
  function copyStyleFor(targetRow = selected, switchMode = true) {
    if (!targetRow) return null;
    const edited = Object.fromEntries(
      Object.entries(targetRow.values).filter(([key]) => styleKeys.has(key))
    );
    const snapshot = Object.keys(edited).length
      ? edited
      : {
          base: targetRow.initial?.base,
          background: targetRow.initial?.background,
          transparent: targetRow.initial?.transparent,
          border: targetRow.initial?.border,
          radius: targetRow.initial?.radius,
          thickness: targetRow.initial?.thickness,
          borderStyle: targetRow.initial?.borderStyle,
          font: targetRow.initial?.font,
          weight: targetRow.initial?.weight,
          fontStyle: targetRow.initial?.fontStyle,
          size: targetRow.metrics?.font
            ? Math.round(targetRow.metrics.font)
            : undefined,
        };
    for (const k of Object.keys(snapshot))
      if (snapshot[k] === undefined) delete snapshot[k];
    setCopiedStyle(snapshot);
    if (switchMode) setClipboardMode('style');
    return snapshot;
  }
  function snapshotElementRows(rows) {
    const items = [];
    for (const row of rows) {
      const node = document.querySelector(row.selector);
      if (!canCloneNode(node)) continue;
      const copy = node.cloneNode(true);
      scrubCloneAttrs(copy);
      copy.querySelectorAll('[data-layer-id]').forEach(scrubCloneAttrs);
      const descEdits = [...node.querySelectorAll('[data-layer-id]')].map(
        (desc) => {
          const dRow = find(desc);
          return dRow && Object.keys(dRow.values).length
            ? {
                sourceRow: dRow,
                directChild: desc.parentElement === node,
              }
            : null;
        }
      );
      items.push({
        sourceId: node.dataset.layerId,
        sourceTag: node.localName,
        sourceParentId: node.parentElement?.dataset.layerId || null,
        templateHtml: copy.outerHTML,
        sourceRow: row,
        descEdits,
      });
    }
    return items;
  }
  function copyElementFrom(rows = selectedRows, updateClipboardMode = true) {
    const roots = selectionRoots(rows).map((item) => item.row);
    const items = snapshotElementRows(roots);
    if (!items.length) return [];
    setCopiedElement(items);
    if (updateClipboardMode) setClipboardMode('element');
    return items;
  }
  function resolvePasteTarget(clip, targetNode, forceAfter = false) {
    const main = document.getElementById('main');
    const selectedNode = selected && document.querySelector(selected.selector);
    const target =
      targetNode && editable(targetNode)
        ? targetNode
        : selectedNode && editable(selectedNode)
          ? selectedNode
          : null;
    if (forceAfter && target && canCloneNode(target) && editable(target.parentElement)) {
      return { parentEl: target.parentElement, afterEl: target };
    }
    if (target) {
      const sameFamily =
        clip.sourceTag === target.localName &&
        clip.sourceParentId === target.parentElement?.dataset.layerId;
      const pasteInside =
        target.id === 'main' ||
        /^(header|footer|section|ul|ol)$/i.test(target.localName) ||
        (containerTags.has(target.localName) &&
          target.dataset.layerId !== clip.sourceId &&
          !sameFamily);
      if (pasteInside) return { parentEl: target, afterEl: null };
      if (editable(target.parentElement))
        return { parentEl: target.parentElement, afterEl: target };
    }
    const fallbackParent =
      (clip.sourceParentId &&
        document.querySelector(
          `[data-layer-id=${CSS.escape(clip.sourceParentId)}]`
        )) ||
      main;
    const sourceEl =
      clip.sourceId &&
      document.querySelector(`[data-layer-id=${CSS.escape(clip.sourceId)}]`);
    return {
      parentEl: fallbackParent,
      afterEl:
        sourceEl && sourceEl.parentElement === fallbackParent ? sourceEl : null,
    };
  }
  function insertClones(items, targetNode = null, forceAfter = false) {
    if (!items?.length) return [];
    const main = document.getElementById('main');
    const nextRows = [...latest.current.entries];
    const createdRoots = [];
    for (const clip of items) {
      const { parentEl, afterEl } = resolvePasteTarget(
        clip,
        targetNode,
        forceAfter
      );
      if (!parentEl?.dataset.layerId) continue;
      const cloneId = makeCloneId();
      const tpl = document.createElement('template');
      tpl.innerHTML = clip.templateHtml.trim();
      const copy = tpl.content.firstElementChild;
      if (!copy) continue;
      copy.setAttribute('data-layer-id', cloneId);
      copy.setAttribute('data-layer-clone', '1');
      const descNodes = [...copy.querySelectorAll('[data-layer-id]')];
      descNodes.forEach((el, idx) => {
        el.setAttribute('data-layer-id', `${cloneId}__${idx}`);
      });
      const inMain =
        parentEl === main ||
        !!parentEl.closest('#main');
      const rowPath = inMain ? path : '*';
      const baseValues = { ...clip.sourceRow.values };
      for (const k of ['x', 'y', 'parent', 'order', 'layer', 'deleted', 'locked', 'hidden'])
        delete baseValues[k];
      if (!baseValues.name) {
        const cleanName = (clip.sourceRow.values.name || clip.sourceRow.name || 'Layer')
          .replace(/^.*?\s·\s/, '')
          .replace(/ \(copy\)$/, '');
        baseValues.name = `${cleanName} (copy)`;
      }
      const selector = `#root [data-layer-id=${CSS.escape(cloneId)}]`;
      const newRow = {
        id: cloneId,
        homeParent: parentEl.dataset.layerId,
        path: rowPath,
        selector,
        name: `${clip.sourceTag} · ${baseValues.name}`,
        cloneAfterId: afterEl?.dataset.layerId || null,
        cloneHtml: copy.outerHTML,
        initial: { ...clip.sourceRow.initial },
        metrics: { ...clip.sourceRow.metrics },
        values: baseValues,
      };
      nextRows.push(newRow);
      createdRoots.push(newRow);
      clip.descEdits.forEach((edit, idx) => {
        if (!edit) return;
        const childId = `${cloneId}__${idx}`;
        const childValues = { ...edit.sourceRow.values };
        delete childValues.deleted;
        delete childValues.locked;
        nextRows.push({
          ...edit.sourceRow,
          id: childId,
          path: rowPath,
          selector: `#root [data-layer-id=${CSS.escape(childId)}]`,
          homeParent: edit.directChild ? cloneId : edit.sourceRow.homeParent,
          values: childValues,
        });
      });
    }
    if (!createdRoots.length) return [];
    remember();
    latest.current = { ...latest.current, entries: nextRows };
    setEntries(nextRows);
    replaceSelection(createdRoots);
    return createdRoots;
  }
  useEffect(() => {
    if (editing && paintMode)
      document.documentElement.setAttribute('data-paint-mode', paintMode);
    else document.documentElement.removeAttribute('data-paint-mode');
  }, [editing, paintMode]);
  useEffect(() => {
    if (editing && drawTool?.kind)
      document.documentElement.setAttribute('data-draw-tool', drawTool.kind);
    else document.documentElement.removeAttribute('data-draw-tool');
  }, [editing, drawTool]);
  function addPaintStroke({ points, color = '#e5c882', strokeWidth = 10 }) {
    if (!points?.length) return null;
    const xs = points.map((p) => p.x),
      ys = points.map((p) => p.y);
    const pad = Math.ceil(strokeWidth / 2) + 4;
    const boxLeft = Math.min(...xs) - pad;
    const boxTop = Math.min(...ys) - pad;
    const w = Math.max(24, Math.round(Math.max(...xs) + pad - boxLeft));
    const h = Math.max(24, Math.round(Math.max(...ys) + pad - boxTop));
    const parentEl = findDrawContainer(points[0], null);
    const main = document.getElementById('main');
    if (!parentEl?.dataset?.layerId) return null;
    const pr = parentEl.getBoundingClientRect();
    const relX = Math.round(boxLeft - pr.left);
    const relY = Math.round(boxTop - pr.top);
    const d = pointsToSmoothPath(points, boxLeft, boxTop);
    const id = makeCloneId();
    const inMain = parentEl === main || !!parentEl.closest('#main');
    const rowPath = inMain ? path : '*';
    const selector = `#root [data-layer-id=${CSS.escape(id)}]`;
    const html = `<svg data-layer-id="${id}" data-layer-clone="1" data-layer-added="paint-stroke" data-layer-overlay="1" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none"><path d="${d}" stroke-linecap="round" stroke-linejoin="round" /></svg>`;
    const initial = {
      ...defaults,
      base: color,
      background: color,
      transparent: true,
      border: color,
      strokeWidth,
      layer: 6,
      width: w,
      height: h,
      text: null,
    };
    const values = {
      name: 'Paint stroke',
      x: relX,
      y: relY,
      width: w,
      height: h,
      base: color,
      stroke: color,
      strokeWidth,
      transparent: true,
      layer: 6,
    };
    const newRow = {
      id,
      homeParent: parentEl.dataset.layerId,
      path: rowPath,
      selector,
      name: 'svg · Paint stroke',
      addedKind: 'paint',
      addedDefaults: { x: relX, y: relY, width: w, height: h },
      cloneHtml: html,
      initial,
      metrics: {
        font: 15,
        padding: [0, 0, 0, 0],
        inline: false,
        position: 'absolute',
      },
      values,
    };
    const nextRows = [...latest.current.entries, newRow];
    remember();
    latest.current = { ...latest.current, entries: nextRows };
    setEntries(nextRows);
    replaceSelection([newRow]);
    return newRow;
  }
  function addDiagram(
    preset = 'box',
    targetNode = null,
    clientPoint = null,
    color = '#e5c882'
  ) {
    const main = document.getElementById('main');
    const selectedNode = selected && document.querySelector(selected.selector);
    const refNode =
      targetNode && editable(targetNode)
        ? targetNode
        : selectedNode && editable(selectedNode)
          ? selectedNode
          : null;
    const parentEl = findDrawContainer(clientPoint, refNode);
    if (!parentEl?.dataset?.layerId) return null;
    const pr = parentEl.getBoundingClientRect();
    const specs = {
      splash: {
        label: 'Paint splash',
        tag: 'svg',
        w: 210,
        h: 88,
        html: (id) =>
          `<svg data-layer-id="${id}" data-layer-clone="1" data-layer-added="paint-fill" data-layer-overlay="1" viewBox="0 0 220 92" preserveAspectRatio="none"><path d="M18,52 C10,26 42,10 82,16 C118,22 146,6 184,14 C210,20 214,44 196,56 C214,66 204,84 176,82 C136,78 96,88 54,82 C24,78 4,68 18,52 Z"/><circle cx="24" cy="14" r="6"/><circle cx="204" cy="76" r="5"/><circle cx="152" cy="86" r="3.5"/></svg>`,
        values: { base: color, fill: color, transparent: true, layer: 5 },
      },
      highlight: {
        label: 'Brush wave',
        tag: 'svg',
        w: 220,
        h: 44,
        html: (id) =>
          `<svg data-layer-id="${id}" data-layer-clone="1" data-layer-added="paint-fill" data-layer-overlay="1" viewBox="0 0 240 48" preserveAspectRatio="none"><path d="M6,30 C44,12 96,10 144,18 C178,24 206,8 232,14 C238,16 238,26 226,32 C192,38 148,40 104,35 C58,30 28,42 10,38 C2,36 1,32 6,30 Z"/></svg>`,
        values: { base: color, fill: color, transparent: true, layer: 5 },
      },
      arrow: {
        label: 'Arrow',
        tag: 'svg',
        w: 170,
        h: 44,
        html: (id) =>
          `<svg data-layer-id="${id}" data-layer-clone="1" data-layer-added="paint-stroke" data-layer-overlay="1" viewBox="0 0 180 44" preserveAspectRatio="none"><path d="M10,22 L162,22 M144,8 L166,22 L144,36" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
        values: {
          base: color,
          stroke: color,
          strokeWidth: 4,
          transparent: true,
          layer: 6,
        },
      },
      box: {
        label: 'Diagram box',
        tag: 'div',
        w: 180,
        h: 100,
        text: 'Diagram',
        html: (id) =>
          `<div class="added-diagram added-box" data-layer-id="${id}" data-layer-clone="1" data-layer-added="diagram" data-layer-overlay="1">Diagram</div>`,
        values: {
          base: '#2f2a25',
          background: '#fffdfa',
          border: '#685531',
          thickness: 2,
          radius: 10,
          align: 'center',
          layer: 5,
        },
      },
      circle: {
        label: 'Circle diagram',
        tag: 'div',
        w: 120,
        h: 120,
        text: 'Note',
        html: (id) =>
          `<div class="added-diagram added-circle" data-layer-id="${id}" data-layer-clone="1" data-layer-added="diagram" data-layer-overlay="1">Note</div>`,
        values: {
          base: '#2f2a25',
          background: color,
          border: '#685531',
          thickness: 2,
          radius: 999,
          align: 'center',
          layer: 5,
        },
      },
      diamond: {
        label: 'Diamond',
        tag: 'div',
        w: 128,
        h: 128,
        html: (id) =>
          `<div class="added-diagram added-diamond" data-layer-id="${id}" data-layer-clone="1" data-layer-added="diagram" data-layer-overlay="1"></div>`,
        values: { base: '#2f2a25', background: color, layer: 5 },
      },
      star: {
        label: 'Star badge',
        tag: 'div',
        w: 104,
        h: 104,
        html: (id) =>
          `<div class="added-diagram added-star" data-layer-id="${id}" data-layer-clone="1" data-layer-added="diagram" data-layer-overlay="1"></div>`,
        values: { base: '#2f2a25', background: color, layer: 5 },
      },
    };
    const spec = specs[preset] || specs.box;
    const center = clientPoint || {
      x: pr.left + Math.min(pr.width / 2, 240),
      y: pr.top + Math.min(pr.height / 2, 160),
    };
    const relX = Math.max(
      -20,
      Math.round(center.x - pr.left - spec.w / 2)
    );
    const relY = Math.max(
      -20,
      Math.round(center.y - pr.top - spec.h / 2)
    );
    const id = makeCloneId();
    const inMain = parentEl === main || !!parentEl.closest('#main');
    const rowPath = inMain ? path : '*';
    const values = {
      name: spec.label,
      x: relX,
      y: relY,
      width: spec.w,
      height: spec.h,
      ...spec.values,
    };
    const newRow = {
      id,
      homeParent: parentEl.dataset.layerId,
      path: rowPath,
      selector: `#root [data-layer-id=${CSS.escape(id)}]`,
      name: `${spec.tag} · ${spec.label}`,
      addedKind: 'diagram',
      addedDefaults: { x: relX, y: relY, width: spec.w, height: spec.h },
      cloneHtml: spec.html(id),
      initial: {
        ...defaults,
        base: values.base || color,
        background: values.background || '#fffdfa',
        transparent: !!values.transparent,
        width: spec.w,
        height: spec.h,
        text: spec.text ?? null,
      },
      metrics: {
        font: 15,
        padding: [8, 8, 8, 8],
        inline: false,
        position: 'absolute',
      },
      values,
    };
    const nextRows = [...latest.current.entries, newRow];
    remember();
    latest.current = { ...latest.current, entries: nextRows };
    setEntries(nextRows);
    replaceSelection([newRow]);
    return newRow;
  }
  function addTextBlock(
    variant = 'paragraph',
    targetNode = null,
    clientPoint = null
  ) {
    const main = document.getElementById('main');
    const selectedNode = selected && document.querySelector(selected.selector);
    const refNode =
      targetNode && editable(targetNode)
        ? targetNode
        : selectedNode && editable(selectedNode)
          ? selectedNode
          : main;
    const isBadge = variant === 'badge';
    const isHeading = variant === 'heading';
    const containerTagsSet = new Set([
      'div',
      'section',
      'article',
      'main',
      'aside',
      'header',
      'footer',
      'form',
    ]);
    let parentEl = main;
    let afterEl = null;
    if (isBadge) {
      parentEl = findDrawContainer(clientPoint, refNode) || main;
    } else if (refNode && editable(refNode)) {
      if (
        refNode.id === 'main' ||
        /^(section|article|div|form)$/i.test(refNode.localName)
      ) {
        parentEl = refNode;
      } else if (
        editable(refNode.parentElement) &&
        containerTagsSet.has(refNode.parentElement.localName)
      ) {
        parentEl = refNode.parentElement;
        afterEl = refNode;
      } else {
        parentEl =
          refNode.closest('section,article,div,#main') || main;
      }
    }
    if (!parentEl?.dataset?.layerId) return null;
    const pr = parentEl.getBoundingClientRect();
    const id = makeCloneId();
    const inMain = parentEl === main || !!parentEl.closest('#main');
    const rowPath = inMain ? path : '*';
    const textContent = isHeading
      ? 'New heading'
      : isBadge
        ? 'Badge text'
        : 'New text block';
    const tag = isHeading ? 'h3' : isBadge ? 'div' : 'p';
    const html = isHeading
      ? `<h3 class="added-text added-heading" data-layer-id="${id}" data-layer-clone="1" data-layer-added="text">${textContent}</h3>`
      : isBadge
        ? `<div class="added-text added-text-badge" data-layer-id="${id}" data-layer-clone="1" data-layer-added="text" data-layer-overlay="1">${textContent}</div>`
        : `<p class="added-text" data-layer-id="${id}" data-layer-clone="1" data-layer-added="text">${textContent}</p>`;
    const badgePos = isBadge
      ? {
          x: Math.max(
            0,
            Math.round((clientPoint?.x ?? pr.left + 80) - pr.left - 55)
          ),
          y: Math.max(
            0,
            Math.round((clientPoint?.y ?? pr.top + 40) - pr.top - 18)
          ),
          layer: 6,
        }
      : {};
    const values = {
      name: isHeading ? 'Added heading' : isBadge ? 'Added badge' : 'Added text',
      text: textContent,
      ...(isBadge
        ? {
            background: '#e5c882',
            base: '#2f2a25',
            radius: 999,
            border: '#c49f52',
            thickness: 1,
          }
        : {}),
      ...badgePos,
    };
    const newRow = {
      id,
      homeParent: parentEl.dataset.layerId,
      path: rowPath,
      selector: `#root [data-layer-id=${CSS.escape(id)}]`,
      name: `${tag} · ${values.name}`,
      addedKind: 'text',
      addedDefaults: badgePos,
      cloneAfterId: afterEl?.dataset?.layerId || null,
      cloneHtml: html,
      initial: {
        ...defaults,
        base: values.base || palette.base || '#2f2a25',
        background: values.background || '#fffdfa',
        transparent: !isBadge,
        text: textContent,
      },
      metrics: {
        font: isHeading ? 22 : isBadge ? 13 : 15,
        padding: isBadge ? [6, 12, 6, 12] : [4, 0, 4, 0],
        inline: false,
        position: isBadge ? 'absolute' : 'static',
      },
      values,
    };
    const nextRows = [...latest.current.entries, newRow];
    remember();
    latest.current = { ...latest.current, entries: nextRows };
    setEntries(nextRows);
    replaceSelection([newRow]);
    requestAnimationFrame(() => {
      const el = document.querySelector(newRow.selector);
      if (el) setEditingText({ row: newRow, value: textContent });
    });
    return newRow;
  }
  useEffect(() => {
    if (!picking || editing) return;
    let hovered;
    function over(e) {
      hovered?.removeAttribute('data-theme-hover');
      hovered = editable(e.target) ? e.target : null;
      hovered?.setAttribute('data-theme-hover', '');
    }
    function click(e) {
      const node = e.target.closest('svg') || e.target;
      if (!editable(node)) return;
      e.preventDefault();
      e.stopPropagation();
      choose(node);
    }
    function key(e) {
      if (e.key === 'Escape') {
        setPicking(false);
        menu.current.open = true;
      } else if (e.key === 'Enter') click(e);
    }
    document.documentElement.setAttribute('data-theme-picking', '');
    document.addEventListener('pointerover', over, true);
    document.addEventListener('click', click, true);
    document.addEventListener('keydown', key, true);
    return () => {
      hovered?.removeAttribute('data-theme-hover');
      document.documentElement.removeAttribute('data-theme-picking');
      document.removeEventListener('pointerover', over, true);
      document.removeEventListener('click', click, true);
      document.removeEventListener('keydown', key, true);
    };
  }, [picking, editing, path, entries]);
  useEffect(() => {
    replaceSelection([]);
    setPicking(false);
  }, [path]);
  useLayoutEffect(() => {
    const sheet = document.createElement('style');
    sheet.dataset.elementTheme = '';
    document.head.append(sheet);
    for (const row of entries)
      if (row.path === '*' || row.path === path)
        try {
          styleLayer(sheet.sheet, row, controls);
        } catch {
          /* Ignore unrecognised legacy selectors. */
        }
    return () => sheet.remove();
  }, [entries, path, controls]);
  useEffect(() => {
    if (!gesture.current) save(entries);
  }, [entries]);
  useLayoutEffect(() => {
    const overrides = entries.filter(
      (r) =>
        (r.path === '*' || r.path === path) && typeof r.values.text === 'string'
    );
    if (!overrides.length) return;
    const originals = new Map();
    function apply() {
      for (const r of overrides) {
        const el = document.querySelector(r.selector);
        if (!el || ownText(el) === null) continue;
        const nodes = [...el.childNodes].filter((n) => n.nodeType === 3);
        if (leafText(el)) {
          nodes.forEach((node, i) => {
            const edited = i === 0 ? r.values.text : '';
            if (node.data === edited) return;
            originals.set(node, { original: node.data, edited });
            node.data = edited;
          });
        } else {
          const primary =
            nodes.find((n) => n.data.trim().length > 0) || nodes[0];
          nodes.forEach((node) => {
            const edited =
              node === primary
                ? (node.previousSibling?.nodeType === 1 &&
                  /^\s/.test(node.data)
                    ? ' '
                    : '') + r.values.text
                : '';
            if (node.data === edited) return;
            originals.set(node, { original: node.data, edited });
            node.data = edited;
          });
        }
      }
    }
    apply();
    const observer = new MutationObserver(apply);
    observer.observe(document.getElementById('root'), {
      childList: true,
      characterData: true,
      subtree: true,
    });
    return () => {
      observer.disconnect();
      for (const [node, { original, edited }] of originals)
        if (node.data === edited) node.data = original;
    };
  }, [entries, path, location.key]);
  useLayoutEffect(() => {
    if (!selection.length) return;
    let active = [];
    function mark() {
      const nodes = selection
        .map((row) => document.querySelector(row.selector))
        .filter(Boolean);
      for (const node of active)
        if (!nodes.includes(node)) node.removeAttribute('data-theme-selected');
      for (const node of nodes)
        node.setAttribute(
          'data-theme-selected',
          nodes.length > 1 ? 'multiple' : ''
        );
      active = nodes;
    }
    mark();
    const observer = new MutationObserver(mark);
    observer.observe(document.getElementById('root'), {
      childList: true,
      subtree: true,
    });
    return () => {
      observer.disconnect();
      for (const node of active) node.removeAttribute('data-theme-selected');
    };
  }, [selectionKey, path]);
  return {
    entries,
    hasSimilar: selectedRows.length === 1 && similarSiblings().length > 0,
    pageSimilarCount:
      selectedRows.length === 1 ? pageSimilarNodes().length : 0,
    mixed: (key) =>
      selectedRows.length > 1 &&
      selectedRows.some(
        (row) => layerValue(row, key) !== layerValue(selected, key)
      ),
    selected,
    selectedRows,
    selectionKey,
    hasSelection,
    selectNodes,
    multiPick,
    setMultiPick,
    selectSimilar,
    selectPageSimilar,
    selectAll,
    selectChildren,
    editMany,
    deselect: () => replaceSelection([]),
    copiedStyle,
    copiedElement,
    clipboardMode,
    paintMode,
    setPaintMode: (mode) => {
      setDrawTool(null);
      setPaintMode((prev) => (prev === mode ? null : mode));
    },
    drawTool,
    setDrawTool: (next) => {
      setPaintMode(null);
      setDrawTool(next);
    },
    addPaintStroke,
    addDiagram,
    addTextBlock,
    copyStyle: (switchMode = true) => copyStyleFor(selected, switchMode),
    canCopyStyle: !!selected,
    pasteStyle: () => {
      if (!copiedStyle) return;
      batch(pastePatch(copiedStyle));
    },
    pasteStyleAt: (node) => {
      if (!copiedStyle || !editable(node) || locked(node)) return false;
      editMany([[rowFor(node), pastePatch(copiedStyle)]]);
      return true;
    },
    canCopyElement:
      selectedRows.length > 0 &&
      selectedRows.some((r) => canCloneNode(document.querySelector(r.selector))),
    copyElement: (switchMode = true) => copyElementFrom(selectedRows, switchMode),
    pasteElement: (targetNode = null) => insertClones(copiedElement, targetNode),
    duplicateSelected: () => {
      const items = copyElementFrom(selectedRows, false);
      const created = insertClones(items, null, true);
      if (created.length) setClipboardMode('element');
      return created;
    },
    pasteStyleToSimilar: () => {
      if (!copiedStyle || !selected) return;
      const node = document.querySelector(selected.selector);
      if (!node) return;
      const patch = pastePatch(copiedStyle);
      const targets = [node, ...pageSimilarNodes()].filter((n) => !locked(n));
      editMany(targets.map((n) => [rowFor(n), patch]));
    },
    flipH: () =>
      editMany(
        selectedRows.map((row) => [row, { flipH: !row.values.flipH }])
      ),
    flipV: () =>
      editMany(
        selectedRows.map((row) => [row, { flipV: !row.values.flipV }])
      ),
    toggleFlag: (node, key) => {
      const row = rowFor(node);
      editMany([[row, { [key]: !row.values[key] }]]);
    },
    stepLayer: (delta) => {
      if (delta < 0 && selectedRows.length === 1) {
        const row = selectedRows[0];
        const current = layerValue(row, 'layer') || 0;
        if (current <= 0) {
          const node = document.querySelector(row.selector);
          const siblings = node
            ? orderedChildren(node.parentElement).filter((n) => n !== node)
            : [];
          if (siblings.length) {
            const edits = [
              ...siblings.map((n) => [
                rowFor(n),
                {
                  layer: Math.min(
                    10000,
                    Math.max(1, (parseInt(getComputedStyle(n).zIndex) || 0) + 1)
                  ),
                },
              ]),
              [row, { layer: 0 }],
            ];
            editMany(edits);
            return;
          }
        }
      }
      editMany(
        selectedRows.map((row) => [
          row,
          {
            layer: Math.max(
              0,
              Math.min(10000, (layerValue(row, 'layer') || 0) + delta)
            ),
          },
        ])
      );
    },
    centerInParent: () => {
      const changes = [];
      for (const { row, node } of selectionRoots(selectedRows)) {
        const parent = node.parentElement;
        if (!parent) continue;
        const r = node.getBoundingClientRect(),
          pr = parent.getBoundingClientRect();
        const dx = pr.left + pr.width / 2 - (r.left + r.width / 2);
        changes.push([
          row,
          { x: Math.round(((row.values.x || 0) + dx) * 100) / 100 },
        ]);
      }
      editMany(changes);
    },
    choose,
    editing,
    picking,
    batch,
    update,
    undo,
    redo,
    locked,
    find,
    reorder,
    moveTo,
    stepOrder,
    stack,
    canUndo: !!history.past.length,
    canRedo: !!history.future.length,
    beginGesture: () => {
      gesture.current = latest.current;
    },
    endGesture: (cancel = false) => {
      const before = gesture.current;
      gesture.current = null;
      if (before && before.entries !== latest.current.entries) {
        if (cancel) {
          restore(before);
          save(before.entries);
        } else {
          remember(before);
          save(latest.current.entries);
        }
      }
    },
    toggleEditing: (value) => {
      setEditing(value);
      setConfirmingDelete(false);
      setEditingText(null);
      setPaintMode(null);
      setDrawTool(null);
      if (!value) {
        replaceSelection([]);
        setMultiPick(false);
      }
      setPicking(false);
      if (menu.current) menu.current.open = value;
      document.documentElement.toggleAttribute('data-visual-editing', value);
    },
    editingText,
    startTextEdit: (targetRow = selected) => {
      if (!targetRow || targetRow.initial?.text == null) return;
      const el = document.querySelector(targetRow.selector);
      if (!el || locked(el)) return;
      setEditingText({
        row: targetRow,
        value: targetRow.values.text ?? targetRow.initial.text ?? '',
      });
    },
    stopTextEdit: () => setEditingText(null),
    confirmingDelete,
    canDelete:
      selectedRows.length > 0 &&
      selectedRows.every((row) => {
        const el = document.querySelector(row.selector);
        return el && el.id !== 'main' && !locked(el);
      }),
    askDelete: () => {
      if (
        selectedRows.length > 0 &&
        selectedRows.every((row) => {
          const el = document.querySelector(row.selector);
          return el && el.id !== 'main' && !locked(el);
        })
      )
        setConfirmingDelete(true);
    },
    cancelDelete: () => setConfirmingDelete(false),
    deleteSelected: () => {
      setConfirmingDelete(false);
      if (
        !selectedRows.length ||
        selectedRows.some((row) => {
          const el = document.querySelector(row.selector);
          return !el || el.id === 'main' || locked(el);
        })
      )
        return;
      editMany(
        selectedRows.map((row) => [row, { hidden: true, deleted: true }])
      );
      replaceSelection([]);
    },
    restoreDeleted: (row) => {
      editMany([[row, { hidden: undefined, deleted: undefined }]]);
    },
    deletedRows: entries.filter((r) => r.values.deleted && (r.path === '*' || r.path === path)),
    globalUpdate: (name, value) => {
      remember();
      const next = { ...latest.current.palette, [name]: value };
      latest.current = { ...latest.current, palette: next };
      setPalette(next);
    },
    start: () => {
      setPicking(true);
      if (menu.current) menu.current.open = false;
    },
    all: () => {
      replaceSelection([]);
      setPicking(false);
      setPaintMode(null);
      setDrawTool(null);
    },
    parent: () => {
      const el = selected && document.querySelector(selected.selector);
      choose(el?.parentElement);
    },
    clear: () => {
      if (!selected) return;
      if (
        selectedRows.some((row) => locked(document.querySelector(row.selector)))
      )
        return;
      remember();
      const next = latest.current.entries
        .map((row) => {
          if (!selectedRows.some((item) => same(item, row))) return row;
          if (!row.cloneHtml) return null;
          return {
            ...row,
            values: {
              ...(row.addedDefaults || {}),
              ...(row.values.text != null ? { text: row.values.text } : {}),
            },
          };
        })
        .filter(Boolean);
      latest.current = { ...latest.current, entries: next };
      setEntries(next);
      if (selectedRows.every((row) => !row.cloneHtml)) replaceSelection([]);
    },
    reset: () => {
      remember();
      latest.current = { ...latest.current, entries: [] };
      setEntries([]);
      replaceSelection([]);
      setPicking(false);
      setPaintMode(null);
      setDrawTool(null);
    },
    applyThemeSnapshot: (nextPalette, nextEntries) => {
      remember();
      const clean = Array.isArray(nextEntries) ? nextEntries : [];
      latest.current = { palette: nextPalette, entries: clean };
      setPalette(nextPalette);
      setEntries(clean);
      replaceSelection([]);
      setPicking(false);
      setPaintMode(null);
      setDrawTool(null);
    },
  };
}
