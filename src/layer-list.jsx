import React, { useEffect, useLayoutEffect, useMemo, useState } from 'react';
import {
  Layers,
  Type,
  SquareMousePointer,
  Image as ImageIcon,
  Box,
  ChevronRight,
  ChevronDown,
  GripVertical,
  Eye,
  EyeOff,
  LockKeyhole,
  Unlock,
  Search,
} from 'lucide-react';
import {
  editable,
  selectorFor,
  layerName,
  orderedChildren,
  canReorder,
  validGroup,
} from './layer-model';

function iconFor(tag) {
  if (/^(h[1-6]|p|small|b|strong|span|label|figcaption)$/.test(tag))
    return Type;
  if (/^(img|svg|video|iframe)$/.test(tag)) return ImageIcon;
  if (/^(button|a|input|textarea|select)$/.test(tag)) return SquareMousePointer;
  return Box;
}
export function LayerList({ elements, inspect }) {
  const [query, setQuery] = useState(''),
    [open, setOpen] = useState(
      () =>
        new Set(
          document.querySelector('#main')
            ? [selectorFor(document.querySelector('#main'))]
            : []
        )
    ),
    [version, refresh] = useState(0),
    [drag, setDrag] = useState(null),
    [drop, setDrop] = useState(null);
  useEffect(() => {
    const observer = new MutationObserver(() => refresh((v) => v + 1));
    observer.observe(document.getElementById('root'), {
      subtree: true,
      childList: true,
      characterData: true,
    });
    return () => observer.disconnect();
  }, []);
  const selected = elements.selected?.selector;
  useLayoutEffect(() => {
    if (!selected) return;
    const el = document.querySelector(selected);
    if (!el) return;
    setOpen((prev) => {
      const next = new Set(prev);
      for (let p = el.parentElement; editable(p); p = p.parentElement)
        next.add(selectorFor(p));
      return next;
    });
  }, [selected]);
  const tree = useMemo(() => {
    const needle = query.trim().toLowerCase().replace(/[-_]+/g, ' ');
    function build(parent) {
      return orderedChildren(parent, elements.find).flatMap((node) => {
        const key = selectorFor(node),
          row = elements.find(node),
          tag = node.localName,
          name = row?.values.name || layerName(node);
        if (row?.values.deleted) return [];
        const kids = build(node),
          matches = (
            tag +
            ' ' +
            name +
            ' ' +
            (node.getAttribute('class') || '')
          )
            .toLowerCase()
            .replace(/[-_]+/g, ' ')
            .includes(needle);
        return matches || kids.length
          ? [{ node, key, row, name, tag, kids }]
          : [];
      });
    }
    return build(document.getElementById('root'));
  }, [query, version, elements.entries]);
  function select(node, event) {
    elements.choose(node, event.shiftKey || elements.multiPick);
    const rect = node.getBoundingClientRect();
    if (
      rect.height &&
      (rect.bottom < 0 ||
        rect.top > innerHeight - 75 ||
        (rect.height < innerHeight - 130 && rect.bottom > innerHeight - 75))
    )
      node.scrollIntoView({ block: 'center', inline: 'nearest' });
  }
  function render(list, depth = 0) {
    return list.map(({ node, key, row, name, tag, kids }) => {
      const expanded = !!query.trim() || open.has(key),
        active = elements.hasSelection(node),
        Icon = iconFor(tag);
      return (
        <li key={key}>
          <div
            className={'layer-row' + (active ? ' is-selected' : '')}
            data-drop={drop?.key === key ? drop.side : undefined}
            style={{ '--layer-depth': Math.min(depth, 8) }}
            draggable={canReorder(node) && !elements.locked(node)}
            onDragStart={(e) => {
              e.dataTransfer.setData('text/plain', key);
              e.dataTransfer.effectAllowed = 'move';
              setDrag(node);
            }}
            onDragEnd={() => {
              setDrag(null);
              setDrop(null);
            }}
            onDragOver={(e) => {
              if (!drag || drag === node || elements.locked(node)) return;
              const r = e.currentTarget.getBoundingClientRect(),
                fraction = (e.clientY - r.top) / r.height;
              const side =
                validGroup(drag, node) && fraction > 0.28 && fraction < 0.72
                  ? 'inside'
                  : fraction > 0.5
                    ? 'after'
                    : 'before';
              if (
                side !== 'inside' &&
                drag.parentElement !== node.parentElement &&
                !validGroup(drag, node.parentElement)
              )
                return;
              e.preventDefault();
              setDrop({ key, side });
            }}
            onDrop={(e) => {
              e.preventDefault();
              if (drag && drop?.key === key) {
                if (drop.side === 'inside') elements.moveTo(drag, node);
                else if (drag.parentElement === node.parentElement)
                  elements.reorder(drag, node, drop.side === 'after');
                else
                  elements.moveTo(
                    drag,
                    node.parentElement,
                    node,
                    drop.side === 'after'
                  );
              }
              setDrag(null);
              setDrop(null);
            }}
          >
            {kids.length ? (
              <button
                className="layer-expand"
                aria-label={(expanded ? 'Collapse ' : 'Expand ') + name}
                aria-expanded={expanded}
                onClick={() =>
                  setOpen((prev) => {
                    const n = new Set(prev);
                    n.has(key) ? n.delete(key) : n.add(key);
                    return n;
                  })
                }
              >
                {expanded ? (
                  <ChevronDown size={13} />
                ) : (
                  <ChevronRight size={13} />
                )}
              </button>
            ) : (
              <span className="layer-expand" />
            )}
            <button
              className="layer-name"
              aria-pressed={active}
              title={`${tag} · ${name}`}
              onClick={(e) => select(node, e)}
              onDoubleClick={() => inspect()}
              onKeyDown={(e) => {
                if (e.shiftKey && ['Enter', ' '].includes(e.key)) {
                  e.preventDefault();
                  select(node, e);
                }
              }}
            >
              <Icon size={14} />
              <span>{name}</span>
            </button>
            <button
              type="button"
              className={
                'layer-quick-btn' + (row?.values.hidden ? ' is-active' : '')
              }
              title={row?.values.hidden ? 'Show layer' : 'Hide layer'}
              aria-label={(row?.values.hidden ? 'Show ' : 'Hide ') + name}
              aria-pressed={!!row?.values.hidden}
              onClick={(e) => {
                e.stopPropagation();
                elements.toggleFlag?.(node, 'hidden');
              }}
            >
              {row?.values.hidden ? <EyeOff size={12} /> : <Eye size={12} />}
            </button>
            <button
              type="button"
              className={
                'layer-quick-btn' + (row?.values.locked ? ' is-active' : '')
              }
              title={row?.values.locked ? 'Unlock layer' : 'Lock layer'}
              aria-label={(row?.values.locked ? 'Unlock ' : 'Lock ') + name}
              aria-pressed={!!row?.values.locked}
              onClick={(e) => {
                e.stopPropagation();
                elements.toggleFlag?.(node, 'locked');
              }}
            >
              {row?.values.locked ? (
                <LockKeyhole size={12} />
              ) : (
                <Unlock size={12} />
              )}
            </button>
            <GripVertical size={12} className="layer-grip" aria-hidden="true" />
          </div>
          {kids.length > 0 && expanded && <ul>{render(kids, depth + 1)}</ul>}
        </li>
      );
    });
  }
  return (
    <section className="layer-list" aria-label="Page layers">
      <label className="layer-search">
        <Search size={15} />
        <input
          aria-label="Search layers"
          placeholder="Find a layer…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </label>
      <div className="layer-list-bar">
        <button type="button" onClick={() => elements.selectAll?.()}>
          Select all
        </button>
        {elements.selectedRows.length > 0 && (
          <button type="button" onClick={() => elements.deselect?.()}>
            Deselect ({elements.selectedRows.length})
          </button>
        )}
      </div>
      <p className="theme-hint">
        Shift-click rows to add or remove layers. Drag to a row’s edge to
        reorder, or its centre to move into a group.
      </p>
      <ul aria-label="Layer hierarchy">{render(tree)}</ul>
      {!tree.length && <p>No matching layers.</p>}
      {selected && (
        <button className="layer-inspect" onClick={inspect}>
          <Layers size={14} />
          {elements.selectedRows.length > 1
            ? 'Edit ' + elements.selectedRows.length + ' layers'
            : 'Edit selected layer'}
        </button>
      )}
      {elements.deletedRows?.length > 0 && (
        <details className="deleted-layers">
          <summary>Deleted layers ({elements.deletedRows.length})</summary>
          <ul>
            {elements.deletedRows.map((row) => (
              <li key={row.path + row.selector}>
                <span>{row.values.name || row.name}</span>
                <button
                  type="button"
                  onClick={() => elements.restoreDeleted?.(row)}
                >
                  Restore
                </button>
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}
