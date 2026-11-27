import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal, flushSync } from 'react-dom';
import {
  Move,
  ListChecks,
  RotateCw,
  Undo2,
  Redo2,
  Check,
  Layers,
  SlidersHorizontal,
  LockKeyhole,
  EyeOff,
  ChevronUp,
  ChevronDown,
  FlipHorizontal,
  FlipVertical,
  Keyboard,
  Trash2,
  Type,
  Copy,
  ClipboardPaste,
  Paintbrush,
  Pencil,
  Shapes,
  X,
} from 'lucide-react';
import {
  axes,
  anchor,
  boxOf,
  editable,
  childrenOf,
  layerName,
  canReorder,
  orderedChildren,
  validGroup,
  groupAtPoint,
} from './layer-model';
import { layoutControls, corners, sides, layerValue } from './layer-properties';

import {
  measureSelection,
  boundsOf,
  moveSelection,
  transformSelection,
  arrangeSelection,
  selectionRoots,
} from './selection-geometry';

const handles = {
  se: 'bottom right',
  s: 'bottom',
  sw: 'bottom left',
  w: 'left',
  nw: 'top left',
  n: 'top',
  ne: 'top right',
  e: 'right',
};
const isUI = (target) => target.closest('[data-editor-ui],.theme-picker');
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

// ── Keyboard shortcut help modal ──────────────────────────────────────────────
const SHORTCUTS = [
  ['Click', 'Select layer'],
  ['Shift+Click', 'Add/remove from selection'],
  ['Ctrl+A', 'Select all layers'],
  ['Ctrl+C', 'Copy selected element (and style)'],
  ['Ctrl+V', 'Paste copied element (or copied style)'],
  ['Ctrl+D', 'Duplicate selected element'],
  ['Delete / Backspace', 'Delete selected layers (with confirmation)'],
  ['Escape', 'Stop paste-on-click / deselect / exit'],
  ['Arrow keys', 'Nudge 1 px'],
  ['Shift+Arrow', 'Nudge 10 px'],
  ['Ctrl+Z', 'Undo'],
  ['Ctrl+Shift+Z / Ctrl+Y', 'Redo'],
  ['Drag handle', 'Move layer'],
  ['Drag corner/edge', 'Resize layer'],
  ['Drag rotation handle', 'Rotate layer'],
  ['Hold Shift while resize', 'Lock aspect ratio'],
  ['Double-click text', 'Edit text inline'],
  ['Alt+Drag', 'Reorder into group'],
  ['Box-select drag', 'Multi-select region'],
  ['?', 'Toggle this help'],
];
function ShortcutHelp({ onClose }) {
  return createPortal(
    <div className="shortcut-overlay" data-editor-ui role="dialog" aria-label="Keyboard shortcuts">
      <div className="shortcut-modal">
        <div className="shortcut-head">
          <strong>Keyboard shortcuts</strong>
          <button aria-label="Close" onClick={onClose}><X size={16} /></button>
        </div>
        <table>
          <tbody>
            {SHORTCUTS.map(([key, desc]) => (
              <tr key={key}>
                <td><kbd>{key}</kbd></td>
                <td>{desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>,
    document.body
  );
}

function ConfirmDeleteModal({ elements }) {
  const rows = elements.selectedRows;
  if (!elements.confirmingDelete || !rows.length) return null;
  const label =
    rows.length === 1
      ? `“${rows[0].values.name || rows[0].name}”`
      : `${rows.length} selected layers`;
  return createPortal(
    <div
      className="shortcut-overlay"
      data-editor-ui
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="confirm-delete-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) elements.cancelDelete();
      }}
    >
      <div className="shortcut-modal delete-modal">
        <div className="shortcut-head">
          <strong id="confirm-delete-title">Delete {label}?</strong>
          <button aria-label="Cancel" onClick={elements.cancelDelete}>
            <X size={16} />
          </button>
        </div>
        <p className="delete-copy">
          Are you sure you want to delete {label}? You can undo with{' '}
          <kbd>Ctrl+Z</kbd> or restore it later from Layers.
        </p>
        <p className="delete-hint">
          Press <kbd>Enter</kbd> to delete, or <kbd>Escape</kbd> to cancel.
        </p>
        <div className="delete-actions">
          <button
            type="button"
            className="delete-cancel"
            onClick={elements.cancelDelete}
          >
            Cancel
          </button>
          <button
            type="button"
            className="delete-confirm"
            autoFocus
            onClick={elements.deleteSelected}
          >
            <Trash2 size={14} />
            Delete
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function InlineTextEditor({ elements }) {
  const active = elements.editingText;
  const [draft, setDraft] = useState('');
  const committed = useRef(false);
  useEffect(() => {
    committed.current = false;
    setDraft(active?.value ?? '');
  }, [active?.row?.selector, active?.value]);
  if (!active) return null;
  const node = document.querySelector(active.row.selector);
  if (!node) return null;
  const r = node.getBoundingClientRect();
  const s = getComputedStyle(node);
  function commit() {
    if (committed.current) return;
    committed.current = true;
    const current = active.row.values.text ?? active.row.initial?.text ?? '';
    if (draft !== current) elements.editMany([[active.row, { text: draft }]]);
    elements.stopTextEdit();
  }
  return createPortal(
    <textarea
      data-editor-ui
      className="inline-text-editor"
      aria-label="Edit text inline"
      autoFocus
      value={draft}
      onFocus={(e) => e.currentTarget.select()}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          e.stopPropagation();
          committed.current = true;
          elements.stopTextEdit();
        } else if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          e.stopPropagation();
          commit();
        }
      }}
      style={{
        left: Math.max(8, Math.min(r.left, innerWidth - Math.max(200, r.width) - 8)),
        top: Math.max(8, r.top),
        width: Math.max(180, Math.min(r.width + 16, innerWidth - 16)),
        minHeight: Math.max(40, r.height + 10),
        fontFamily: s.fontFamily,
        fontSize: s.fontSize,
        fontWeight: s.fontWeight,
        fontStyle: s.fontStyle,
        lineHeight: s.lineHeight,
        textAlign: s.textAlign,
      }}
    />,
    document.body
  );
}

// ── Context menu ──────────────────────────────────────────────────────────────
function ContextMenu({ items, x, y, onClose }) {
  const ref = useRef();
  useEffect(() => {
    function outside(e) {
      if (!ref.current?.contains(e.target)) onClose();
    }
    function esc(e) { if (e.key === 'Escape') onClose(); }
    window.addEventListener('pointerdown', outside, true);
    window.addEventListener('keydown', esc, true);
    return () => {
      window.removeEventListener('pointerdown', outside, true);
      window.removeEventListener('keydown', esc, true);
    };
  }, [onClose]);
  // keep the menu on screen
  const style = {
    left: Math.min(x, innerWidth - 220),
    top: Math.min(y, innerHeight - items.length * 34 - 12),
  };
  return createPortal(
    <ul className="ctx-menu" data-editor-ui ref={ref} style={style} role="menu">
      {items.map(({ label, action, disabled, divider }) =>
        divider
          ? <li key={label} className="ctx-divider" role="separator" />
          : <li key={label} role="menuitem">
              <button disabled={!!disabled} onClick={() => { action(); onClose(); }}>{label}</button>
            </li>
      )}
    </ul>,
    document.body
  );
}

export function VisualEditor({ elements, showPanel, panel, onCanvasSelect }) {
  const [box, setBox] = useState(null),
    [snap, setSnap] = useState(true),
    [ratio, setRatio] = useState(false),
    [dragMode, setDragMode] = useState('move'),
    [dropLabel, setDropLabel] = useState('');
  const [marquee, setMarquee] = useState(null);
  const [showHelp, setShowHelp] = useState(false);
  const [showAddDrawer, setShowAddDrawer] = useState(false);
  const [brushColor, setBrushColor] = useState('#e5c882');
  const [brushSize, setBrushSize] = useState(10);
  const [paintDraft, setPaintDraft] = useState(null);
  const [ctxMenu, setCtxMenu] = useState(null); // { x, y }
  const gesture = useRef(null),
    api = useRef(),
    canvasSelect = useRef(),
    modals = useRef({});
  api.current = elements;
  canvasSelect.current = onCanvasSelect;
  modals.current = { showHelp, ctxMenu, showAddDrawer };
  const selector = elements.selected?.selector;
  const requestMeasure = useRef(null);
  useLayoutEffect(() => {
    if (!elements.editing || !selector) {
      setBox(null);
      return;
    }
    let frame,
      observed = [];
    const resize = new ResizeObserver(schedule);
    function measure() {
      frame = 0;
      const nodes = selectionRoots(api.current.selectedRows).map(
        (item) => item.node
      );
      if (
        nodes.length !== observed.length ||
        nodes.some((n, i) => observed[i] !== n)
      ) {
        resize.disconnect();
        observed = nodes;
        for (const node of nodes)
          for (let p = node; p; p = p.parentElement) resize.observe(p);
      }
      const visible = nodes.filter((node) => node.getClientRects().length);
      const next =
        visible.length && api.current.selectedRows.length === 1
          ? boxOf(visible[0])
          : boundsOf(visible.map((n) => n.getBoundingClientRect()));
      setBox((prev) =>
        next &&
        prev &&
        Object.keys(next).every((key) => next[key] === prev[key])
          ? prev
          : next
      );
    }
    function schedule() {
      if (!frame) frame = requestAnimationFrame(measure);
    }
    const observer = new MutationObserver(schedule);
    observer.observe(document.getElementById('root'), {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: [
        'class',
        'open',
        'hidden',
        'style',
        'data-editor-reveal',
      ],
    });
    requestMeasure.current = schedule;
    schedule();
    window.addEventListener('scroll', schedule, true);
    window.addEventListener('resize', schedule);
    document.addEventListener('load', schedule, true);
    document.fonts?.addEventListener('loadingdone', schedule);
    return () => {
      requestMeasure.current = null;
      cancelAnimationFrame(frame);
      resize.disconnect();
      observer.disconnect();
      window.removeEventListener('scroll', schedule, true);
      window.removeEventListener('resize', schedule);
      document.removeEventListener('load', schedule, true);
      document.fonts?.removeEventListener('loadingdone', schedule);
    };
  }, [elements.editing, elements.selectionKey]);
  useLayoutEffect(() => {
    requestMeasure.current?.();
  });
  // Selecting a closed gallery or collapsed navigation layer previews its box.
  // Restore the authored open/closed state as soon as the selection changes.
  useLayoutEffect(() => {
    if (!elements.editing || !selector) return;
    const node = document.querySelector(selector),
      cleanups = [];
    for (let p = node; editable(p); p = p.parentElement) {
      if (api.current.find(p)?.values.hidden) break;
      if (p.matches('dialog:not([open]),details:not([open])')) {
        p.setAttribute('open', '');
        const container = p;
        cleanups.push(() => container.removeAttribute('open'));
      } else if (getComputedStyle(p).display === 'none') {
        p.setAttribute('data-editor-reveal', '');
        const container = p;
        cleanups.push(() => container.removeAttribute('data-editor-reveal'));
      }
    }
    if (cleanups.length)
      requestAnimationFrame(() => {
        if (node?.isConnected && !node.getBoundingClientRect().height) return;
        node?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      });
    return () => cleanups.reverse().forEach((fn) => fn());
  }, [elements.editing, selector]);
  useEffect(() => {
    if (!elements.editing) return;
    function startBox(e, target) {
      if (gesture.current) return;
      const id = e.pointerId,
        x = e.clientX,
        y = e.clientY,
        add = e.shiftKey || api.current.multiPick;
      let moved = false;
      function bounds(event) {
        return {
          left: Math.min(x, event.clientX),
          top: Math.min(y, event.clientY),
          width: Math.abs(event.clientX - x),
          height: Math.abs(event.clientY - y),
        };
      }
      function move(event) {
        if (event.pointerId !== id) return;
        const r = bounds(event);
        if (r.width + r.height > 5) moved = true;
        if (moved) setMarquee(r);
      }
      function finish(event) {
        if (event.pointerId !== id) return;
        move(event);
        if (moved) {
          const r = bounds(event),
            nodes = [];
          for (const n of document.querySelectorAll('#root [data-layer-id]')) {
            if (!editable(n) || nodes.some((parent) => parent.contains(n)))
              continue;
            const b = n.getBoundingClientRect();
            if (
              b.width &&
              b.height &&
              b.left >= r.left &&
              b.top >= r.top &&
              b.right <= r.left + r.width &&
              b.bottom <= r.top + r.height &&
              getComputedStyle(n).visibility === 'visible'
            )
              nodes.push(n);
          }
          api.current.selectNodes(nodes, add);
        } else api.current.choose(target, add);
        cancel();
        canvasSelect.current();
      }
      function cancel() {
        setMarquee(null);
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', finish);
        window.removeEventListener('pointercancel', cancel);
        window.removeEventListener('blur', cancel);
        gesture.current = null;
      }
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', finish);
      window.addEventListener('pointercancel', cancel);
      window.addEventListener('blur', cancel);
      gesture.current = { cancel };
    }
    document.documentElement.toggleAttribute(
      'data-box-select',
      dragMode === 'box'
    );
    function startPaint(e) {
      if (gesture.current) return;
      const id = e.pointerId;
      const { color = '#e5c882', size = 10 } = api.current.drawTool || {};
      let pts = [{ x: e.clientX, y: e.clientY }];
      setPaintDraft({ points: pts, color, size });
      function move(event) {
        if (event.pointerId !== id) return;
        const prev = pts[pts.length - 1];
        if (Math.hypot(event.clientX - prev.x, event.clientY - prev.y) < 3) return;
        pts = [...pts, { x: event.clientX, y: event.clientY }];
        setPaintDraft({ points: pts, color, size });
      }
      function finish(event) {
        if (event.pointerId !== id) return;
        const last = pts[pts.length - 1];
        if (Math.hypot(event.clientX - last.x, event.clientY - last.y) >= 1)
          pts = [...pts, { x: event.clientX, y: event.clientY }];
        cleanup();
        api.current.addPaintStroke?.({
          points: pts,
          color,
          strokeWidth: size,
        });
      }
      function cancel() {
        cleanup();
      }
      function cleanup() {
        setPaintDraft(null);
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', finish);
        window.removeEventListener('pointercancel', cancel);
        window.removeEventListener('blur', cancel);
        gesture.current = null;
      }
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', finish);
      window.addEventListener('pointercancel', cancel);
      window.addEventListener('blur', cancel);
      gesture.current = { cancel };
    }
    function start(e) {
      const activeDraw = api.current?.drawTool;
      if (
        !e.isPrimary ||
        e.button !== 0 ||
        isUI(e.target) ||
        (e.pointerType === 'touch' &&
          dragMode !== 'box' &&
          activeDraw?.kind !== 'paint')
      )
        return;
      if (activeDraw?.kind === 'paint') {
        e.preventDefault();
        e.stopPropagation();
        startPaint(e);
        return;
      }
      if (activeDraw?.kind === 'diagram') {
        e.preventDefault();
        e.stopPropagation();
        api.current.addDiagram?.(
          activeDraw.preset,
          e.target.closest('svg') || e.target,
          { x: e.clientX, y: e.clientY },
          activeDraw.color
        );
        api.current.setDrawTool?.(null);
        canvasSelect.current();
        return;
      }
      if (activeDraw?.kind === 'text') {
        e.preventDefault();
        e.stopPropagation();
        api.current.addTextBlock?.(
          activeDraw.variant || 'paragraph',
          e.target.closest('svg') || e.target,
          { x: e.clientX, y: e.clientY }
        );
        api.current.setDrawTool?.(null);
        canvasSelect.current();
        return;
      }
      const target = e.target.closest('svg') || e.target;
      if (dragMode === 'box') {
        e.preventDefault();
        e.stopPropagation();
        startBox(e, target);
        return;
      }
      if (!editable(target)) return;
      e.preventDefault();
      e.stopPropagation();
      const model = api.current;
      if (model.paintMode === 'style') {
        model.pasteStyleAt?.(target);
        model.choose(target);
        return;
      }
      if (model.paintMode === 'element') {
        model.pasteElement?.(target);
        return;
      }
      if (e.shiftKey || model.multiPick) {
        model.choose(target, true);
        canvasSelect.current();
        return;
      }
      const member =
        model.selectedRows.length > 1 &&
        model.selectedRows.find((row) =>
          document.querySelector(row.selector)?.contains(target)
        );
      const row = member || model.choose(target);
      if (row) {
        canvasSelect.current();
        begin(
          e,
          'move',
          row,
          member ? model.selectedRows : [row],
          member ? target : null
        );
      }
    }
    function click(e) {
      if (isUI(e.target)) return;
      e.preventDefault();
      e.stopPropagation();
      if (dragMode !== 'box' && e.pointerType === 'touch') {
        const target = e.target.closest('svg') || e.target;
        const model = api.current;
        if (model.drawTool?.kind === 'diagram') {
          model.addDiagram?.(
            model.drawTool.preset,
            target,
            { x: e.clientX, y: e.clientY },
            model.drawTool.color
          );
          model.setDrawTool?.(null);
          canvasSelect.current();
          return;
        }
        if (model.drawTool?.kind === 'text') {
          model.addTextBlock?.(
            model.drawTool.variant || 'paragraph',
            target,
            { x: e.clientX, y: e.clientY }
          );
          model.setDrawTool?.(null);
          canvasSelect.current();
          return;
        }
        if (model.paintMode === 'style' && editable(target)) {
          model.pasteStyleAt?.(target);
          model.choose(target);
          return;
        }
        if (model.paintMode === 'element' && editable(target)) {
          model.pasteElement?.(target);
          return;
        }
        if (model.choose(target, e.shiftKey || model.multiPick))
          canvasSelect.current();
      }
    }
    function keys(e) {
      const model = api.current;
      if (model.confirmingDelete) {
        if (e.key === 'Escape') {
          e.preventDefault();
          e.stopPropagation();
          model.cancelDelete();
        } else if (e.key === 'Enter' && !e.target.closest('.delete-cancel')) {
          e.preventDefault();
          e.stopPropagation();
          model.deleteSelected();
        }
        return;
      }
      if (model.editingText) {
        if (e.key === 'Escape') {
          e.preventDefault();
          e.stopPropagation();
          model.stopTextEdit();
        }
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        if (modals.current.showHelp) setShowHelp(false);
        else if (modals.current.showAddDrawer) setShowAddDrawer(false);
        else if (modals.current.ctxMenu) setCtxMenu(null);
        else if (model.drawTool) model.setDrawTool(null);
        else if (model.paintMode) model.setPaintMode(null);
        else if (gesture.current) gesture.current.cancel();
        else if (model.selectedRows.length > 1) model.deselect();
        else model.toggleEditing(false);
        return;
      }
      // Allow normal text editing inside text/number inputs, textareas, and selects
      if (
        e.target.closest(
          'textarea, [contenteditable], input:not([type=checkbox],[type=radio],[type=range],[type=color],[type=button],[type=submit])'
        ) &&
        isUI(e.target)
      )
        return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        e.shiftKey ? model.redo() : model.undo();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        model.redo();
        return;
      }
      // Ctrl+A – select all
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        model.selectAll();
        canvasSelect.current();
        return;
      }
      // Ctrl+C – copy selected element (default) and snapshot its style
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c' && model.selected) {
        e.preventDefault();
        if (e.shiftKey) {
          model.copyStyle(true);
        } else if (model.canCopyElement) {
          model.copyElement?.(true);
          model.copyStyle(false);
        } else {
          model.copyStyle(true);
        }
        return;
      }
      // Ctrl+V – paste copied element or copied style
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v') {
        if (e.shiftKey && model.copiedElement) {
          e.preventDefault();
          model.pasteElement?.();
          return;
        }
        if (model.clipboardMode === 'element' && model.copiedElement) {
          e.preventDefault();
          model.pasteElement?.();
          return;
        }
        if (model.copiedStyle) {
          e.preventDefault();
          model.pasteStyle();
          return;
        }
      }
      // Ctrl+D – duplicate selected element(s)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd' && model.canCopyElement) {
        e.preventDefault();
        model.duplicateSelected?.();
        return;
      }
      // Delete / Backspace – ask before deleting selected elements
      if ((e.key === 'Delete' || e.key === 'Backspace') && model.selected) {
        e.preventDefault();
        model.askDelete();
        return;
      }
      // ? – toggle help
      if (e.key === '?') {
        e.preventDefault();
        setShowHelp((v) => !v);
        return;
      }

      if (!isUI(e.target) && ['Enter', ' '].includes(e.key)) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      const step = {
        ArrowLeft: [-1, 0],
        ArrowRight: [1, 0],
        ArrowUp: [0, -1],
        ArrowDown: [0, 1],
      }[e.key];
      if (step && model.selected) {
        e.preventDefault();
        const n = e.shiftKey ? 10 : 1;
        moveSelection(
          model,
          measureSelection(model.selectedRows),
          step[0] * n,
          step[1] * n
        );
      }
    }
    // Right-click context menu on canvas
    function contextmenu(e) {
      if (isUI(e.target)) return;
      const target = e.target.closest('svg') || e.target;
      if (!editable(target)) return;
      e.preventDefault();
      // select if not already
      if (!api.current.hasSelection(target)) api.current.choose(target);
      setCtxMenu({ x: e.clientX, y: e.clientY });
    }
    // Double-click text element to edit inline
    function dblclick(e) {
      if (isUI(e.target)) return;
      const target = e.target.closest('svg') || e.target;
      if (!editable(target) || api.current.locked(target)) return;
      e.preventDefault();
      e.stopPropagation();
      const row = api.current.choose(target);
      if (row?.initial?.text != null) {
        canvasSelect.current();
        api.current.startTextEdit(row);
      }
    }
    document.addEventListener('pointerdown', start, true);
    document.addEventListener('click', click, true);
    document.addEventListener('keydown', keys, true);
    document.addEventListener('contextmenu', contextmenu, true);
    document.addEventListener('dblclick', dblclick, true);
    return () => {
      document.documentElement.removeAttribute('data-box-select');
      document.removeEventListener('pointerdown', start, true);
      document.removeEventListener('click', click, true);
      document.removeEventListener('keydown', keys, true);
      document.removeEventListener('contextmenu', contextmenu, true);
      document.removeEventListener('dblclick', dblclick, true);
      gesture.current?.cancel();
    };
  }, [elements.editing, snap, ratio, dragMode]);
  function begin(
    e,
    mode,
    row = api.current.selected,
    rows = api.current.selectedRows,
    clickTarget = null
  ) {
    if (!row || gesture.current || e.button !== 0 || e.isPrimary === false)
      return;
    const node = document.querySelector(row.selector);
    if (
      !node ||
      rows.some((r) => api.current.locked(document.querySelector(r.selector)))
    )
      return;
    const multiple = rows.length > 1;
    const members = multiple ? measureSelection(rows) : null;
    if (multiple && !members.length) return;
    e.preventDefault();
    e.stopPropagation();
    const id = e.pointerId,
      startX = e.clientX,
      startY = e.clientY,
      scrollX = window.scrollX,
      scrollY = window.scrollY;
    const initial = multiple
        ? boundsOf(members.map((i) => i.rect))
        : boxOf(node),
      basis = multiple ? new DOMMatrix() : axes(node).inverse(),
      parentBasis = multiple
        ? new DOMMatrix()
        : axes(node.parentElement).inverse(),
      x = row.values.x || 0,
      y = row.values.y || 0;
    const placing = mode === 'move' && (dragMode === 'arrange' || e.altKey);
    const centre = anchor(initial, 0.5, 0.5);
    const angle = (px, py) => {
      const point = parentBasis.transformPoint({
        x: px - centre.x,
        y: py - centre.y,
      });
      return (Math.atan2(point.y, point.x) * 180) / Math.PI;
    };
    let destination = null;
    const west = mode.includes('w'),
      north = mode.includes('n'),
      horizontal = west || mode.includes('e'),
      vertical = north || mode.includes('s');
    const origin = anchor(initial, west ? 1 : 0, north ? 1 : 0),
      round = (n) => (snap ? Math.round(n / 8) * 8 : Math.round(n)),
      vector = (m, x, y) => m.transformPoint({ x, y });
    let latest,
      frame,
      edgeFrame,
      lastEvent,
      moved = false;
    api.current.beginGesture();
    function apply() {
      frame = 0;
      if (!latest) return;
      const sx = window.scrollX - scrollX,
        sy = window.scrollY - scrollY,
        dx = latest.clientX - startX + sx,
        dy = latest.clientY - startY + sy;
      const shift = latest.shiftKey,
        pointerX = latest.clientX,
        pointerY = latest.clientY;
      latest = null;
      if (!moved && Math.hypot(dx, dy) < 3) return;
      moved = true;
      if (placing) {
        destination?.group.removeAttribute('data-layer-drop');
        destination = groupAtPoint(
          node,
          pointerX,
          pointerY,
          api.current.locked
        );
        if (
          multiple &&
          destination &&
          members.some(
            (i) =>
              i.node.contains(destination.group) ||
              i.node === destination.child ||
              (i.node.parentElement !== destination.group &&
                !validGroup(i.node, destination.group))
          )
        )
          destination = null;
        destination?.group.setAttribute('data-layer-drop', '');
        setDropLabel(
          destination
            ? 'Release in ' + layerName(destination.group)
            : 'Drag over a destination group'
        );
        return;
      }
      if (mode === 'rotate') {
        const degrees =
          (row.values.rotation || 0) +
          angle(pointerX + sx, pointerY + sy) -
          angle(startX, startY);
        const amount =
          shift || snap ? Math.round(degrees / 15) * 15 : Math.round(degrees);
        if (multiple) {
          transformSelection(api.current, members, {
            degrees: amount - (row.values.rotation || 0),
            originX: centre.x,
            originY: centre.y,
            scrollX: sx,
            scrollY: sy,
          });
          return;
        }
        api.current.batch(
          { rotation: ((amount + 540) % 360) - 180 },
          false,
          row
        );
        return;
      }
      if (mode === 'move') {
        if (multiple) {
          moveSelection(api.current, members, round(dx), round(dy), false);
          return;
        }
        const delta = vector(parentBasis, dx, dy);
        api.current.batch(
          {
            x: clamp(round(x + delta.x), -100000, 100000),
            y: clamp(round(y + delta.y), -100000, 100000),
          },
          false,
          row
        );
        return;
      }
      const delta = vector(basis, dx, dy);
      const changes = {};
      if (horizontal)
        changes.width = clamp(
          round(initial.width + (west ? -delta.x : delta.x)),
          1,
          100000
        );
      if (vertical)
        changes.height = clamp(
          round(initial.height + (north ? -delta.y : delta.y)),
          1,
          100000
        );
      if (
        (shift ||
          ratio ||
          (multiple &&
            members.some(
              (i) => Math.abs(i.box.b) + Math.abs(i.box.c) > 0.001
            ))) &&
        initial.width &&
        initial.height
      ) {
        const aspect = initial.width / initial.height;
        if (
          !vertical ||
          (horizontal &&
            Math.abs(delta.x / initial.width) >=
              Math.abs(delta.y / initial.height))
        )
          changes.height = clamp(Math.round(changes.width / aspect), 1, 100000);
        else
          changes.width = clamp(Math.round(changes.height * aspect), 1, 100000);
      }
      if (multiple) {
        transformSelection(api.current, members, {
          sx: changes.width / initial.width || 1,
          sy: changes.height / initial.height || 1,
          originX: origin.x,
          originY: origin.y,
          scrollX: sx,
          scrollY: sy,
        });
        return;
      }
      // A centred flex/grid item shifts when its size changes. Measure its new
      // anchor before correcting translation, also for rotated parent groups.
      flushSync(() => api.current.batch(changes, false, row));
      const actual = anchor(boxOf(node), west ? 1 : 0, north ? 1 : 0);
      const correction = vector(
          parentBasis,
          origin.x - sx - actual.x,
          origin.y - sy - actual.y
        ),
        current = api.current.selected?.values || row.values;
      if (Math.abs(correction.x) > 0.02 || Math.abs(correction.y) > 0.02)
        api.current.batch(
          {
            x: Number(((current.x || 0) + correction.x).toFixed(2)),
            y: Number(((current.y || 0) + correction.y).toFixed(2)),
          },
          false,
          row
        );
    }
    function scrollAtEdge() {
      edgeFrame = 0;
      if (!moved || !lastEvent) return;
      const margin = 40;
      const speed = (position, extent) =>
        position < margin
          ? -Math.min(20, Math.ceil((margin - position) / 3))
          : position > extent - margin
            ? Math.min(20, Math.ceil((position - extent + margin) / 3))
            : 0;
      const dx = speed(lastEvent.clientX, innerWidth),
        dy = speed(lastEvent.clientY, innerHeight);
      if (!dx && !dy) return;
      const prevX = window.scrollX,
        prevY = window.scrollY;
      window.scrollBy(dx, dy);
      if (prevX === window.scrollX && prevY === window.scrollY) return;
      latest = lastEvent;
      apply();
      edgeFrame = requestAnimationFrame(scrollAtEdge);
    }
    function move(event) {
      if (event.pointerId !== id) return;
      latest = event;
      lastEvent = event;
      if (!frame) frame = requestAnimationFrame(apply);
      if (!edgeFrame) edgeFrame = requestAnimationFrame(scrollAtEdge);
    }
    function finish(event) {
      if (event.pointerId !== id) return;
      latest = event;
      cancelAnimationFrame(frame);
      apply();
      cleanup();
      api.current.endGesture();
      if (!moved && clickTarget) api.current.choose(clickTarget);
      if (placing && moved && destination)
        api.current.moveTo(
          node,
          destination.group,
          destination.child,
          destination.after
        );
    }
    function cancel() {
      cleanup();
      api.current.endGesture(true);
    }
    function cleanup() {
      destination?.group.removeAttribute('data-layer-drop');
      setDropLabel('');
      cancelAnimationFrame(frame);
      cancelAnimationFrame(edgeFrame);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', finish);
      window.removeEventListener('pointercancel', cancel);
      window.removeEventListener('blur', cancel);
      gesture.current = null;
    }
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', finish);
    window.addEventListener('pointercancel', cancel);
    window.addEventListener('blur', cancel);
    gesture.current = { cancel };
  }
  if (!elements.editing) return null;
  const locked = elements.selectedRows.some((r) =>
    elements.locked(document.querySelector(r.selector))
  );
  return createPortal(
    <>
      <div
        className="editor-toolbar"
        data-editor-ui
        role="toolbar"
        aria-label="Visual editor"
      >
        <b>
          <Move size={16} />
          Visual editor
        </b>
        <span role="status">
          {dropLabel ||
            (elements.drawTool?.kind === 'paint'
              ? 'Drag anywhere to paint strokes (Esc to stop)'
              : elements.drawTool?.kind === 'diagram'
                ? 'Click anywhere to place diagram (Esc to cancel)'
                : elements.drawTool?.kind === 'text'
                  ? 'Click anywhere to place text (Esc to cancel)'
                  : elements.paintMode === 'style'
                    ? 'Click any layer to paste style (Esc to stop)'
                    : elements.paintMode === 'element'
                      ? 'Click anywhere to paste element (Esc to stop)'
                      : dragMode === 'box'
                        ? 'Drag around layers to select them'
                        : dragMode === 'arrange'
                          ? 'Drag a layer onto a group'
                          : elements.selectedRows.length > 1
                            ? elements.selectedRows.length + ' layers selected'
                            : 'Shift-click to select more layers')}
        </span>
        <button
          disabled={!elements.canUndo}
          onClick={elements.undo}
          title="Undo (Ctrl+Z)"
          aria-label="Undo"
        >
          <Undo2 size={16} />
        </button>
        <button
          disabled={!elements.canRedo}
          onClick={elements.redo}
          title="Redo (Ctrl+Shift+Z / Ctrl+Y)"
          aria-label="Redo"
        >
          <Redo2 size={16} />
        </button>
        <button
          aria-pressed={elements.multiPick}
          title="Tap layers to add or remove them from the selection"
          onClick={() => elements.setMultiPick(!elements.multiPick)}
        >
          <ListChecks size={15} />
          Multi-select
        </button>
        <label>
          Drag
          <select
            value={dragMode}
            onChange={(e) => setDragMode(e.target.value)}
          >
            <option value="move">Free move</option>
            <option value="arrange">Into group</option>
            <option value="box">Box select</option>
          </select>
        </label>
        <label title="Snap movement and size to an 8 pixel grid">
          <input
            type="checkbox"
            checked={snap}
            onChange={(e) => setSnap(e.target.checked)}
          />
          Snap 8px
        </label>
        <label title="Keep proportions during resize (or hold Shift)">
          <input
            type="checkbox"
            checked={ratio}
            onChange={(e) => setRatio(e.target.checked)}
          />
          Lock ratio
        </label>
        <button
          aria-pressed={elements.drawTool?.kind === 'paint'}
          title="Freehand paint brush around elements or images"
          onClick={() => {
            setShowAddDrawer(false);
            elements.setDrawTool(
              elements.drawTool?.kind === 'paint'
                ? null
                : { kind: 'paint', color: brushColor, size: brushSize }
            );
          }}
        >
          <Pencil size={15} />
          {elements.drawTool?.kind === 'paint' ? 'Painting' : 'Paint'}
        </button>
        <button
          aria-pressed={showAddDrawer || elements.drawTool?.kind === 'diagram'}
          title="Add paint splashes, shapes, arrows, and diagrams"
          onClick={() => setShowAddDrawer((v) => !v)}
        >
          <Shapes size={15} />
          Diagrams
        </button>
        <button
          aria-pressed={elements.drawTool?.kind === 'text'}
          title="Click anywhere on the page to add editable text"
          onClick={() => {
            setShowAddDrawer(false);
            elements.setDrawTool(
              elements.drawTool?.kind === 'text'
                ? null
                : { kind: 'text', variant: 'paragraph', color: brushColor }
            );
          }}
        >
          <Type size={15} />
          Add text
        </button>
        {elements.canCopyElement && (
          <button
            title="Copy selected element (Ctrl+C)"
            onClick={() => {
              elements.copyElement?.(true);
              elements.copyStyle?.(false);
            }}
          >
            <Copy size={15} />
            Copy
          </button>
        )}
        {elements.clipboardMode === 'element' && elements.copiedElement && (
          <>
            <button
              title="Paste copied element at or inside selected spot (Ctrl+V)"
              onClick={() => elements.pasteElement?.()}
            >
              <ClipboardPaste size={15} />
              Paste
            </button>
            <button
              aria-pressed={elements.paintMode === 'element'}
              title="Click any spot on the page to paste this element there (Esc to stop)"
              onClick={() => elements.setPaintMode('element')}
            >
              <ClipboardPaste size={15} />
              {elements.paintMode === 'element' ? 'Pasting on click' : 'Paste on click'}
            </button>
          </>
        )}
        {elements.clipboardMode === 'style' && elements.copiedStyle && (
          <button
            aria-pressed={elements.paintMode === 'style'}
            title="Click any layer on the page to apply the copied styling only (Esc to stop)"
            onClick={() => elements.setPaintMode('style')}
          >
            <Paintbrush size={15} />
            {elements.paintMode === 'style' ? 'Painting style' : 'Paste style on click'}
          </button>
        )}
        <button
          onClick={() => showPanel('layers')}
          aria-pressed={panel === 'layers'}
        >
          <Layers size={15} />
          Layers
        </button>
        <button
          onClick={() => showPanel('properties')}
          aria-pressed={panel === 'properties'}
        >
          <SlidersHorizontal size={15} />
          Properties
        </button>
        <button
          className="editor-done"
          onClick={() => elements.toggleEditing(false)}
        >
          <Check size={15} />
          Done
        </button>
        <button
          title="Keyboard shortcuts (?)"
          aria-pressed={showHelp}
          onClick={() => setShowHelp((v) => !v)}
        >
          <Keyboard size={15} />
        </button>
      </div>
      {marquee && (
        <div data-editor-ui className="editor-marquee" style={marquee} />
      )}
      {paintDraft && (
        <svg
          data-editor-ui
          className="paint-draft-overlay"
          viewBox={`0 0 ${window.innerWidth} ${window.innerHeight}`}
        >
          <path
            d={paintDraft.points
              .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
              .join(' ')}
            fill="none"
            stroke={paintDraft.color}
            strokeWidth={paintDraft.size}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
      {showAddDrawer && (
        <div
          data-editor-ui
          className="add-drawer"
          role="dialog"
          aria-label="Add paint, diagrams, and text"
        >
          <div className="add-drawer-head">
            <strong>Add paint, diagrams &amp; text</strong>
            <button
              aria-label="Close drawer"
              onClick={() => setShowAddDrawer(false)}
            >
              <X size={14} />
            </button>
          </div>
          <div className="add-brush-row">
            <label>
              Color
              <input
                type="color"
                aria-label="Brush color"
                value={brushColor}
                onChange={(e) => {
                  const nextColor = e.target.value;
                  setBrushColor(nextColor);
                  if (elements.drawTool)
                    elements.setDrawTool({
                      ...elements.drawTool,
                      color: nextColor,
                    });
                }}
              />
            </label>
            <label>
              Size ({brushSize}px)
              <input
                type="range"
                aria-label="Brush size"
                min="2"
                max="28"
                value={brushSize}
                onChange={(e) => {
                  const nextSize = Number(e.target.value);
                  setBrushSize(nextSize);
                  if (elements.drawTool?.kind === 'paint')
                    elements.setDrawTool({
                      ...elements.drawTool,
                      size: nextSize,
                    });
                }}
              />
            </label>
          </div>
          <div className="add-drawer-grid">
            <button
              aria-pressed={elements.drawTool?.kind === 'paint'}
              onClick={() => {
                elements.setDrawTool({
                  kind: 'paint',
                  color: brushColor,
                  size: brushSize,
                });
                setShowAddDrawer(false);
              }}
            >
              Freehand brush
            </button>
            {[
              ['splash', 'Paint splash'],
              ['highlight', 'Brush wave'],
              ['arrow', 'Arrow'],
              ['box', 'Box diagram'],
              ['circle', 'Circle'],
              ['diamond', 'Diamond'],
              ['star', 'Star'],
            ].map(([preset, label]) => (
              <button
                key={preset}
                onClick={() => {
                  elements.setDrawTool({
                    kind: 'diagram',
                    preset,
                    color: brushColor,
                  });
                  setShowAddDrawer(false);
                }}
              >
                {label}
              </button>
            ))}
            {[
              ['heading', 'Add heading'],
              ['paragraph', 'Add paragraph'],
              ['badge', 'Add badge'],
            ].map(([variant, label]) => (
              <button
                key={variant}
                onClick={() => {
                  elements.setDrawTool({
                    kind: 'text',
                    variant,
                    color: brushColor,
                  });
                  setShowAddDrawer(false);
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}
      {showHelp && <ShortcutHelp onClose={() => setShowHelp(false)} />}
      <ConfirmDeleteModal elements={elements} />
      <InlineTextEditor elements={elements} />
      {ctxMenu && elements.selected && (
        <ContextMenu
          x={ctxMenu.x}
          y={ctxMenu.y}
          onClose={() => setCtxMenu(null)}
          items={[
            { label: 'Properties', action: () => { showPanel('properties'); canvasSelect.current(); } },
            { label: 'Layers panel', action: () => showPanel('layers') },
            ...(elements.selected?.initial?.text != null
              ? [{ label: 'Edit text', action: () => elements.startTextEdit?.() }]
              : []),
            { label: 'Add text here', action: () => elements.addTextBlock?.('paragraph') },
            { label: 'Add diagram box', action: () => elements.addDiagram?.('box') },
            { label: 'd1', divider: true },
            { label: 'Select parent', action: () => elements.parent() },
            { label: 'Select children', action: () => { elements.selectChildren?.(); canvasSelect.current(); }, disabled: !childrenOf(document.querySelector(elements.selected.selector)).length },
            { label: 'Select similar (page)', action: () => { elements.selectPageSimilar?.(); canvasSelect.current(); } },
            { label: 'Select all (Ctrl+A)', action: () => { elements.selectAll?.(); canvasSelect.current(); } },
            { label: 'd2', divider: true },
            { label: 'Copy element', action: () => elements.copyElement?.(true), disabled: !elements.canCopyElement },
            { label: 'Duplicate (Ctrl+D)', action: () => elements.duplicateSelected?.(), disabled: !elements.canCopyElement },
            { label: 'Paste element here', action: () => elements.pasteElement?.(), disabled: !elements.copiedElement },
            {
              label: elements.paintMode === 'element' ? 'Stop paste element on click' : 'Paste element on click',
              action: () => elements.setPaintMode('element'),
              disabled: !elements.copiedElement,
            },
            { label: 'd2b', divider: true },
            { label: 'Copy style (Ctrl+C)', action: () => elements.copyStyle(), disabled: !elements.canCopyStyle },
            { label: 'Paste style (Ctrl+V)', action: () => elements.pasteStyle(), disabled: !elements.copiedStyle },
            {
              label: elements.paintMode === 'style' ? 'Stop paste style on click' : 'Paste style on click',
              action: () => elements.setPaintMode('style'),
              disabled: !elements.copiedStyle,
            },
            { label: 'Paste style to similar', action: () => elements.pasteStyleToSimilar?.(), disabled: !elements.copiedStyle },
            { label: 'd3', divider: true },
            { label: 'Bring forward (+1 layer)', action: () => elements.stepLayer?.(1) },
            { label: 'Send backward (-1 layer)', action: () => elements.stepLayer?.(-1) },
            { label: 'Flip horizontal', action: () => elements.flipH?.() },
            { label: 'Flip vertical', action: () => elements.flipV?.() },
            { label: 'd4', divider: true },
            {
              label: elements.selectedRows.some((r) => r.values.locked) ? 'Unlock' : 'Lock',
              action: () => elements.batch({ locked: !elements.selectedRows.some((r) => r.values.locked) }),
            },
            {
              label: elements.selectedRows.some((r) => r.values.hidden) ? 'Show' : 'Hide',
              action: () => elements.batch({ hidden: !elements.selectedRows.some((r) => r.values.hidden) }),
            },
            { label: 'd5', divider: true },
            { label: 'Clear style edits', action: () => elements.clear(), disabled: !elements.selected },
            { label: 'Delete layer (Del)', action: () => elements.askDelete?.(), disabled: !elements.canDelete },
          ]}
        />
      )}
      {box && (
        <div
          className="editor-box"
          data-editor-ui
          style={{
            left: box.x,
            top: box.y,
            width: box.width,
            height: box.height,
            transformOrigin: '0 0',
            transform: `matrix(${box.a},${box.b},${box.c},${box.d},0,0)`,
          }}
        >
          {elements.selectedRows.length > 1 && (
            <span className="selection-count">
              {elements.selectedRows.length} layers
            </span>
          )}
          {!locked && (
            <>
              <button
                className="editor-drag"
                title="Drag to move"
                aria-label={
                  elements.selectedRows.length > 1
                    ? 'Move selection'
                    : 'Move selected element'
                }
                onPointerDown={(e) => begin(e, 'move')}
              >
                <Move size={14} />
              </button>
              <button
                className="editor-rotate"
                aria-label={
                  elements.selectedRows.length > 1
                    ? 'Rotate selection'
                    : 'Rotate selected element'
                }
                title="Drag to rotate"
                onPointerDown={(e) => begin(e, 'rotate')}
              >
                <RotateCw size={13} />
              </button>
              {Object.entries(handles).map(([key, label]) => (
                <button
                  key={key}
                  className="editor-resize"
                  data-direction={key}
                  aria-label={'Resize from ' + label}
                  title={'Resize from ' + label}
                  onPointerDown={(e) => begin(e, key)}
                />
              ))}
            </>
          )}
        </div>
      )}
    </>,
    document.body
  );
}

function NumberField({ label, value, onChange, control, mixed }) {
  const [draft, setDraft] = useState(mixed ? '' : String(value ?? ''));
  useEffect(() => setDraft(mixed ? '' : String(value ?? '')), [value, mixed]);
  function commit() {
    if (draft.trim() && Number.isFinite(Number(draft))) {
      const n = clamp(Number(draft), control.min, control.max);
      if (mixed || n !== Number(value)) onChange(n);
      setDraft(String(n));
    } else setDraft(mixed ? '' : String(value ?? ''));
  }
  return (
    <label>
      {label}
      <input
        type="number"
        min={control.min}
        max={control.max}
        step={control.step}
        value={draft}
        placeholder={mixed ? 'Mixed' : undefined}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.currentTarget.blur();
        }}
      />
    </label>
  );
}
export function PropertyFields({ names, elements }) {
  const row = elements.selected;
  if (!row) return null;
  return (
    <div className="editor-number-grid">
      {names.map((key) => {
        const control = layoutControls[key],
          value = layerValue(row, key),
          mixed = elements.mixed(key);
        return control.options ? (
          <label key={key}>
            {control.label}
            <select
              value={
                mixed
                  ? ''
                  : Object.hasOwn(control.options, value)
                    ? value
                    : Object.keys(control.options)[0]
              }
              onChange={(e) => elements.update(key, e.target.value)}
            >
              {mixed && (
                <option value="" disabled>
                  Mixed
                </option>
              )}
              {Object.entries(control.options).map(([v, t]) => (
                <option value={v} key={v}>
                  {t}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <NumberField
            key={row.selector + key}
            label={control.label}
            value={value}
            control={control}
            mixed={mixed}
            onChange={(v) => elements.update(key, v)}
          />
        );
      })}
    </div>
  );
}
export function EdgeProperties({ elements }) {
  return (
    <details className="layout-properties">
      <summary>Individual corners and edges</summary>
      <PropertyFields
        elements={elements}
        names={[
          ...Object.keys(corners),
          ...Object.values(sides).map((s) => 'border' + s),
        ]}
      />
    </details>
  );
}
export function LayoutProperties({ elements }) {
  const row = elements.selected;
  if (!row) return null;
  const node = document.querySelector(row.selector),
    hasChildren = childrenOf(node).length > 0;
  return (
    <>
      <PropertyFields
        names={[
          'width',
          'height',
          'x',
          'y',
          'rotation',
          'layer',
          'scaleX',
          'scaleY',
        ]}
        elements={elements}
      />
      <div className="editor-quick">
        <button
          onClick={() =>
            elements.batch({ width: undefined, height: undefined })
          }
        >
          Auto size
        </button>
        <button
          onClick={() =>
            elements.batch({
              x: undefined,
              y: undefined,
              rotation: undefined,
              scaleX: undefined,
              scaleY: undefined,
              flipH: undefined,
              flipV: undefined,
            })
          }
        >
          Reset position
        </button>
        <button onClick={() => elements.centerInParent?.()}>
          Center in parent
        </button>
      </div>
      <details className="layout-properties" open>
        <summary>Spacing &amp; layout</summary>
        <PropertyFields
          names={[
            'padding',
            'margin',
            'overflow',
            ...(hasChildren
              ? ['layout', 'columns', 'gap', 'items', 'justify']
              : []),
            ...(['img', 'video'].includes(node?.localName) ? ['fit'] : []),
          ]}
          elements={elements}
        />
      </details>
      <details className="layout-properties">
        <summary>Individual padding &amp; margin</summary>
        <PropertyFields
          elements={elements}
          names={[
            ...Object.values(sides).map((s) => 'padding' + s),
            ...Object.values(sides).map((s) => 'margin' + s),
          ]}
        />
      </details>
    </>
  );
}
export function LayerActions({ elements }) {
  const [notice, setNotice] = useState('');
  const row = elements.selected;
  useEffect(() => {
    setNotice('');
  }, [row?.selector]);
  if (!row) return null;
  const node = document.querySelector(row.selector);
  if (!node) return null;
  const rows = elements.selectedRows,
    multi = rows.length > 1;
  const roots = multi ? selectionRoots(rows).map((i) => i.node) : [node];
  const locked = rows.some((r) =>
    elements.locked(document.querySelector(r.selector))
  );
  const anyLocked = rows.some((r) => r.values.locked),
    anyHidden = rows.some((r) => r.values.hidden);
  const hasSimilar = elements.hasSimilar;
  const currentLayer = layerValue(row, 'layer') || 0;
  const groups = [...document.querySelectorAll('#root [data-layer-id]')].filter(
    (p) =>
      !elements.locked(p) &&
      roots.every((n) => validGroup(n, p)) &&
      roots.some((n) => n.parentElement !== p)
  );
  const siblings = orderedChildren(node.parentElement, elements.find),
    i = siblings.indexOf(node),
    reorder = canReorder(node) && !elements.locked(node);
  return (
    <div className="layer-actions">
      {multi && (
        <div className="selection-tools">
          <div className="selection-heading">
            <strong>{rows.length} layers selected</strong>
            <button onClick={elements.deselect}>Deselect</button>
          </div>
          <small>Align and match to the last layer you selected.</small>
          <div
            className="selection-command-grid"
            role="group"
            aria-label="Align layers"
          >
            {[
              ['left', 'Align left'],
              ['centerX', 'Center horizontally'],
              ['right', 'Align right'],
              ['top', 'Align top'],
              ['centerY', 'Center vertically'],
              ['bottom', 'Align bottom'],
            ].map(([key, label]) => (
              <button
                key={key}
                disabled={locked || roots.length < 2}
                onClick={() => arrangeSelection(elements, key)}
              >
                {label}
              </button>
            ))}
          </div>
          <div
            className="selection-command-grid pairs"
            role="group"
            aria-label="Space and size layers"
          >
            {[
              ['spaceX', 'Space horizontally'],
              ['spaceY', 'Space vertically'],
              ['width', 'Match width'],
              ['height', 'Match height'],
            ].map(([key, label]) => (
              <button
                key={key}
                disabled={
                  locked || roots.length < (key.startsWith('space') ? 3 : 2)
                }
                onClick={() => arrangeSelection(elements, key)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}
      <button
        aria-pressed={anyLocked}
        onClick={() => elements.batch({ locked: !anyLocked })}
      >
        <LockKeyhole size={13} />
        {anyLocked ? 'Unlock' : 'Lock'}
      </button>
      <button
        disabled={locked}
        aria-pressed={anyHidden}
        onClick={() => elements.batch({ hidden: !anyHidden })}
      >
        <EyeOff size={13} />
        {anyHidden ? 'Show' : 'Hide'}
      </button>
      <button
        className="layer-delete-btn"
        disabled={!elements.canDelete}
        title="Delete selected elements (Delete key)"
        onClick={elements.askDelete}
      >
        <Trash2 size={13} />
        Delete
      </button>
      {!multi && row.initial?.text != null && (
        <button
          disabled={locked}
          title="Edit text directly on the page (or double-click text)"
          onClick={() => elements.startTextEdit?.()}
        >
          <Type size={13} />
          Edit text
        </button>
      )}
      {!multi && (
        <>
          <button
            disabled={!reorder || i <= 0}
            title="Move earlier in this group"
            onClick={() => {
              elements.stepOrder(node, -1);
              setNotice('Moved earlier in group');
            }}
          >
            <ChevronUp size={14} />
            Earlier
          </button>
          <button
            disabled={!reorder || i === siblings.length - 1}
            title="Move later in this group"
            onClick={() => {
              elements.stepOrder(node, 1);
              setNotice('Moved later in group');
            }}
          >
            <ChevronDown size={14} />
            Later
          </button>
          <button
            disabled={!reorder}
            title="Move above siblings (z-index)"
            onClick={() => {
              elements.stack(node, true);
              setNotice('Moved to front of group');
            }}
          >
            Bring to front
          </button>
          <button
            disabled={!reorder}
            title="Move behind siblings (z-index)"
            onClick={() => {
              elements.stack(node, false);
              setNotice('Moved to back of group');
            }}
          >
            Send to back
          </button>
        </>
      )}
      {!multi && hasSimilar && (
        <button onClick={elements.selectSimilar}>
          Select similar siblings
        </button>
      )}
      {!multi && childrenOf(node).length > 0 && (
        <button onClick={elements.selectChildren}>Select children</button>
      )}
      {!multi && elements.pageSimilarCount > 0 && (
        <button
          title={`Select all ${elements.pageSimilarCount + 1} similar layers here`}
          onClick={elements.selectPageSimilar}
        >
          Select similar (page)
        </button>
      )}
      <button
        disabled={locked}
        title={`Increase stack level (current: ${currentLayer})`}
        onClick={() => {
          elements.stepLayer?.(1);
          setNotice(`Stack level: ${currentLayer + 1}`);
        }}
      >
        Bring forward
      </button>
      <button
        disabled={locked}
        title={`Decrease stack level (current: ${currentLayer})`}
        onClick={() => {
          elements.stepLayer?.(-1);
          setNotice(
            currentLayer > 0
              ? `Stack level: ${currentLayer - 1}`
              : 'Moved behind siblings (level 0)'
          );
        }}
      >
        Send backward
      </button>
      <button
        disabled={locked}
        aria-pressed={rows.some((r) => r.values.flipH)}
        onClick={() => {
          elements.flipH();
          setNotice(row.values.flipH ? 'Unflipped horizontally' : 'Flipped horizontally');
        }}
      >
        <FlipHorizontal size={13} />
        Flip H
      </button>
      <button
        disabled={locked}
        aria-pressed={rows.some((r) => r.values.flipV)}
        onClick={() => {
          elements.flipV();
          setNotice(row.values.flipV ? 'Unflipped vertically' : 'Flipped vertically');
        }}
      >
        <FlipVertical size={13} />
        Flip V
      </button>
      <button
        title="Copy selected element so you can paste clones anywhere"
        disabled={!elements.canCopyElement}
        onClick={() => {
          elements.copyElement?.(true);
          setNotice('Element copied — click Paste or Paste element on click');
        }}
      >
        <Copy size={13} />
        Copy element
      </button>
      <button
        title="Duplicate selected element right next to it (Ctrl+D)"
        disabled={!elements.canCopyElement}
        onClick={() => {
          const created = elements.duplicateSelected?.();
          if (created?.length) setNotice('Duplicated element');
        }}
      >
        Duplicate
      </button>
      {elements.copiedElement && (
        <>
          <button
            title="Paste copied element at or inside the selected target"
            onClick={() => {
              const created = elements.pasteElement?.();
              if (created?.length) setNotice('Element pasted');
            }}
          >
            <ClipboardPaste size={13} />
            Paste element
          </button>
          <button
            aria-pressed={elements.paintMode === 'element'}
            title="Click anywhere on the page to paste a clone there"
            onClick={() => {
              elements.setPaintMode('element');
              setNotice(
                elements.paintMode === 'element'
                  ? 'Stopped paste-on-click'
                  : 'Click anywhere on the page to paste clones (Esc to stop)'
              );
            }}
          >
            <ClipboardPaste size={13} />
            Paste on click
          </button>
        </>
      )}
      {!multi && (
        <button
          title="Copy this layer’s appearance"
          disabled={!elements.canCopyStyle}
          onClick={() => {
            elements.copyStyle();
            setNotice('Style copied — select a layer or use Paste style on click');
          }}
        >
          Copy styling edits
        </button>
      )}
      {elements.copiedStyle && (
        <>
          <button
            disabled={locked}
            onClick={() => {
              elements.pasteStyle();
              setNotice('Pasted styling edits');
            }}
          >
            Paste styling edits
          </button>
          <button
            aria-pressed={elements.paintMode === 'style'}
            title="Click any layer on the page to paste this style onto it"
            onClick={() => {
              elements.setPaintMode('style');
              setNotice(
                elements.paintMode === 'style'
                  ? 'Stopped format painter'
                  : 'Format painter on — click layers to paste style (Esc to stop)'
              );
            }}
          >
            <Paintbrush size={13} />
            Paste style on click
          </button>
        </>
      )}
      {elements.copiedStyle && !multi && elements.pageSimilarCount > 0 && (
        <button
          disabled={locked}
          onClick={() => {
            elements.pasteStyleToSimilar();
            setNotice(`Pasted to ${elements.pageSimilarCount + 1} similar layers`);
          }}
        >
          Paste to all similar
        </button>
      )}
      {notice && (
        <small className="layer-action-status" role="status">
          {notice}
        </small>
      )}
      {!!groups.length && (
        <label>
          Move into group
          <select
            value=""
            disabled={locked}
            onChange={(e) => {
              const parent = groups[Number(e.target.value)];
              if (parent) {
                elements.moveTo(node, parent);
                setNotice('Moved into ' + layerName(parent));
              }
            }}
          >
            <option value="" disabled>
              Choose a destination…
            </option>
            {groups.map((p, j) => (
              <option key={p.dataset.layerId} value={j}>
                {layerName(p.parentElement)} › {layerName(p)}
              </option>
            ))}
          </select>
        </label>
      )}
    </div>
  );
}
export function ElementNavigator({ elements }) {
  const row = elements.selected;
  const [text, setText] = useState(''),
    [name, setName] = useState('');
  useEffect(() => {
    setText(row?.values.text ?? row?.initial?.text ?? '');
    setName(row?.values.name ?? '');
  }, [row?.selector, row?.path, row?.values.text, row?.values.name]);
  if (!row) return null;
  const node = document.querySelector(row.selector),
    children = childrenOf(node);
  return (
    <div className="element-navigation">
      <label>
        Layer name
        <input
          value={name}
          placeholder={node ? layerName(node) : ''}
          maxLength={80}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => {
            if (name !== (row.values.name || ''))
              elements.update('name', name.trim() || undefined);
          }}
        />
      </label>
      {!!children.length && (
        <label>
          Inside this element
          <select
            value=""
            onChange={(e) => elements.choose(children[Number(e.target.value)])}
          >
            <option value="" disabled>
              Select a child…
            </option>
            {children.map((n, i) => (
              <option key={i} value={i}>
                {n.localName} · {layerName(n)}
              </option>
            ))}
          </select>
        </label>
      )}
      {row.initial?.text != null && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            elements.update('text', text);
          }}
        >
          <label>
            Text
            <textarea
              rows="3"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </label>
          <button>Apply text</button>
        </form>
      )}
    </div>
  );
}
