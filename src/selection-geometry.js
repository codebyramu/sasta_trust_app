import { flushSync } from 'react-dom';
import { axes, boxOf } from './layer-model';

// A selected child follows its selected parent during a transform.
export function selectionRoots(rows) {
  const items = rows
    .map((row) => ({ row, node: document.querySelector(row.selector) }))
    .filter((item) => item.node);
  return items.filter(
    (item) =>
      !items.some((other) => other !== item && other.node.contains(item.node))
  );
}
export function measureSelection(rows) {
  return selectionRoots(rows)
    .filter(({ node }) => node.getClientRects().length)
    .map(({ row, node }) => ({
      row,
      node,
      rect: node.getBoundingClientRect(),
      box: boxOf(node),
      inverse: axes(node.parentElement).inverse(),
    }));
}
export function boundsOf(rects) {
  if (!rects.length) return null;
  const x = Math.min(...rects.map((r) => r.left)),
    y = Math.min(...rects.map((r) => r.top));
  return {
    x,
    y,
    width: Math.max(...rects.map((r) => r.right)) - x,
    height: Math.max(...rects.map((r) => r.bottom)) - y,
    a: 1,
    b: 0,
    c: 0,
    d: 1,
  };
}
const bounded = (n) =>
  Math.max(-100000, Math.min(100000, Math.round(n * 100) / 100));
function translation(values, matrix, x, y) {
  const d = matrix.transformPoint({ x, y });
  return {
    x: bounded((values.x || 0) + d.x),
    y: bounded((values.y || 0) + d.y),
  };
}
export function moveSelection(model, items, dx, dy, record = true) {
  model.editMany(
    items.map(({ row, inverse }) => [
      row,
      translation(row.values, inverse, dx, dy),
    ]),
    record
  );
}
export function arrangeSelection(model, action) {
  const items = measureSelection(model.selectedRows);
  if (items.length < 2) return;
  const ref =
    items.find(({ node }) =>
      node.contains(document.querySelector(model.selected.selector))
    ) || items.at(-1);
  if (action === 'width' || action === 'height') {
    model.editMany(
      items
        .filter((i) => i !== ref)
        .map(({ row }) => [row, { [action]: ref.box[action] }])
    );
    return;
  }
  const horizontal = ['left', 'centerX', 'right', 'spaceX'].includes(action);
  const start = horizontal ? 'left' : 'top',
    size = horizontal ? 'width' : 'height';
  const position = (rect) =>
    rect[start] +
    rect[size] *
      ({ centerX: 0.5, centerY: 0.5, right: 1, bottom: 1 }[action] || 0);
  let offsets;
  if (action === 'spaceX' || action === 'spaceY') {
    if (items.length < 3) return;
    const sorted = [...items].sort((a, b) => a.rect[start] - b.rect[start]);
    let cursor = sorted[0].rect[start];
    const last = sorted.at(-1).rect;
    const gap =
      (last[start] +
        last[size] -
        cursor -
        sorted.reduce((sum, i) => sum + i.rect[size], 0)) /
      (items.length - 1);
    offsets = sorted.slice(0, -1).map((item) => {
      const delta = cursor - item.rect[start];
      cursor += item.rect[size] + gap;
      return [item, delta];
    });
  } else
    offsets = items
      .filter((item) => item !== ref)
      .map((item) => [item, position(ref.rect) - position(item.rect)]);
  model.editMany(
    offsets
      .filter(([, delta]) => Math.abs(delta) > 0.01)
      .map(([{ row, inverse }, delta]) => [
        row,
        translation(
          row.values,
          inverse,
          horizontal ? delta : 0,
          horizontal ? 0 : delta
        ),
      ])
  );
}

// Reflow can move neighbours as their sizes change. Commit all dimensions
// together, then correct each centre in its own parent's coordinate space.
export function transformSelection(
  model,
  items,
  { sx = 1, sy = 1, degrees, originX, originY, scrollX, scrollY }
) {
  const rotating = degrees !== undefined;
  const angle = ((degrees || 0) * Math.PI) / 180,
    cos = Math.cos(angle),
    sin = Math.sin(angle);
  const changes = items.map(({ row, box }) => [
    row,
    rotating
      ? { rotation: (((row.values.rotation || 0) + degrees + 540) % 360) - 180 }
      : {
          width: Math.max(1, Math.min(100000, box.width * sx)),
          height: Math.max(1, Math.min(100000, box.height * sy)),
        },
  ]);
  flushSync(() => model.editMany(changes, false));
  const corrections = [];
  for (const { row, node, inverse, rect } of items) {
    const dx = rect.left + rect.width / 2 - originX,
      dy = rect.top + rect.height / 2 - originY;
    const actual = node.getBoundingClientRect();
    const x =
      originX +
      dx * sx * cos -
      dy * sy * sin -
      scrollX -
      (actual.left + actual.width / 2);
    const y =
      originY +
      dx * sx * sin +
      dy * sy * cos -
      scrollY -
      (actual.top + actual.height / 2);
    if (Math.abs(x) > 0.005 || Math.abs(y) > 0.005)
      corrections.push([
        row,
        translation(model.find(node)?.values || row.values, inverse, x, y),
      ]);
  }
  if (corrections.length) model.editMany(corrections, false);
}
