// Keep React in charge of the DOM. Layer edits are keyed to the original page
// structure, so changing visual order never changes another layer's identity.
const excluded =
  '.theme-picker,[data-editor-ui],script,style,br,option,optgroup,source,track,input[type="hidden"],.skip,.sr';
export function editable(node) {
  return (
    node instanceof Element &&
    node.id !== 'root' &&
    !!node.closest('#root') &&
    !node.closest(excluded) &&
    (!node.ownerSVGElement || node.tagName.toLowerCase() === 'svg')
  );
}
export function childrenOf(node) {
  return [...(node?.children || [])].filter(editable);
}
export function selectorFor(element) {
  if (element.dataset.layerId)
    return '#root [data-layer-id=' + CSS.escape(element.dataset.layerId) + ']';
  const parts = [];
  for (
    let node = element;
    node && node.id !== 'root';
    node = node.parentElement
  ) {
    if (node.id === 'main') {
      parts.unshift('#main');
      break;
    }
    const tag = node.localName;
    if (node.hasAttribute('data-layer-key')) {
      parts.unshift(
        `${tag}[data-layer-key=${CSS.escape(node.dataset.layerKey)}]`
      );
    } else {
      const siblings = [...node.parentElement.children].filter(
        (child) => child.localName === tag
      );
      parts.unshift(`${tag}:nth-of-type(${siblings.indexOf(node) + 1})`);
    }
  }
  return '#root > ' + parts.join(' > ');
}
export function layerName(node) {
  const tag = node.localName;
  const title =
    node.getAttribute('aria-label') ||
    node.getAttribute('alt') ||
    node.getAttribute('placeholder') ||
    node.getAttribute('name');
  if (title) return title;
  if (tag === 'svg')
    return (
      node.getAttribute('class')?.match(/lucide-([\w-]+)/)?.[1] || 'Icon'
    ).replaceAll('-', ' ');
  const ownText = [...node.childNodes]
    .filter((n) => n.nodeType === 3)
    .map((n) => n.textContent.trim())
    .filter(Boolean)
    .join(' ');
  if (ownText) return ownText.replace(/\s+/g, ' ').slice(0, 72);
  if (tag === 'img') return node.src.split('/').pop() || 'Image';
  if (['a', 'button', 'label', 'summary'].includes(tag)) {
    const caption = (node.querySelector('h1,h2,h3,h4') || node).textContent
      .trim()
      .replace(/\s+/g, ' ');
    if (caption) return caption.slice(0, 72);
  }
  const names = {
    header: 'Header',
    footer: 'Footer',
    main: 'Page content',
    nav: 'Navigation',
    h1: 'Page title',
    figure: 'Photograph',
    section: 'Section',
    form: 'Form',
    div: 'Group',
    span: 'Group',
  };
  const className =
    [...node.classList].find((c) => !['wrap', 'paper', 'btn'].includes(c)) ||
    node.classList[0];
  const label = className?.replaceAll('-', ' ') || names[tag] || tag;
  return label.charAt(0).toUpperCase() + label.slice(1);
}
export function orderedChildren(parent, entryFor) {
  return childrenOf(parent)
    .map((node) => {
      const entry = entryFor?.(node);
      const order = entryFor
        ? (entry?.values.order ?? entry?.initial?.order ?? 0)
        : Number(getComputedStyle(node).order) || 0;
      return { node, order };
    })
    .sort((a, b) => a.order - b.order)
    .map((item) => item.node);
}
export function canReorder(node) {
  return (
    editable(node) &&
    !/^(table|thead|tbody|tfoot|tr|select|picture|video|audio)$/i.test(
      node.parentElement.localName
    )
  );
}

// CSS transforms act about each box's origin. Its bounding rectangle gives
// the transformed centre; its local dimensions and the linear transform give
// all four corners, including when an ancestor has been rotated.
export function axes(node) {
  const ancestors = [];
  for (let n = node; n && n !== document.documentElement; n = n.parentElement)
    ancestors.unshift(n);
  let matrix = new DOMMatrix();
  for (const n of ancestors) {
    const style = getComputedStyle(n);
    if (style.rotate !== 'none')
      matrix = matrix.rotate(parseFloat(style.rotate) || 0);
    if (style.scale !== 'none') {
      const [sx, sy] = style.scale.split(' ').map(Number);
      matrix = matrix.scale(Math.abs(sx), Math.abs(sy ?? sx));
    }
    if (style.transform !== 'none')
      matrix = matrix.multiply(new DOMMatrix(style.transform));
  }
  return new DOMMatrix([matrix.a, matrix.b, matrix.c, matrix.d, 0, 0]);
}
export function boxOf(node) {
  const r = node.getBoundingClientRect(),
    style = getComputedStyle(node),
    m = axes(node);
  const width = parseFloat(style.width) || node.offsetWidth || r.width;
  const height = parseFloat(style.height) || node.offsetHeight || r.height;
  return {
    x: r.x + r.width / 2 - (m.a * width + m.c * height) / 2,
    y: r.y + r.height / 2 - (m.b * width + m.d * height) / 2,
    width,
    height,
    a: m.a,
    b: m.b,
    c: m.c,
    d: m.d,
  };
}
export function anchor(box, fx, fy) {
  return {
    x: box.x + fx * box.width * box.a + fy * box.height * box.c,
    y: box.y + fx * box.width * box.b + fy * box.height * box.d,
  };
}

export function validGroup(node, parent) {
  if (
    !editable(node) ||
    !editable(parent) ||
    !node.dataset.layerId ||
    !parent.dataset.layerId ||
    node.contains(parent) ||
    node.parentElement?.id === 'root'
  )
    return false;
  if (parent.dataset.layerId.startsWith(node.dataset.layerId + '/'))
    return false;
  if (
    !/^(main|nav|header|footer|section|article|aside|div|figure|fieldset|form|ul|ol)$/.test(
      parent.localName
    )
  )
    return false;
  if (/^(th|td|tr|thead|tbody|tfoot|option|legend)$/.test(node.localName))
    return false;
  if ((node.localName === 'li') !== /^(ol|ul)$/.test(parent.localName))
    return false;
  if (node.localName === 'figcaption' && parent.localName !== 'figure')
    return false;
  if (node.parentElement.closest('form') !== parent.closest('form'))
    return false;
  if (
    parent.closest('a,button,label,summary') !==
    node.parentElement.closest('a,button,label,summary')
  )
    return false;
  // A portal still depends on its React owner. Check both parent chains when
  // groups have already moved, including content passed through a Page wrapper.
  const pending = [parent],
    seen = new Set();
  while (pending.length) {
    const current = pending.pop();
    if (!current || seen.has(current)) continue;
    if (current === node) return false;
    seen.add(current);
    const visual = current.parentElement,
      owner = current.dataset.layerOwner;
    if (visual?.dataset.layerId) pending.push(visual);
    if (owner && owner !== visual?.dataset.layerId)
      pending.push(
        document.querySelector('[data-layer-id=' + CSS.escape(owner) + ']')
      );
  }
  return true;
}

export function groupAtPoint(source, x, y, locked) {
  const hits = document.elementsFromPoint(x, y);
  if (hits[0]?.closest('.theme-panel,.editor-toolbar')) return null;
  for (const hit of hits) {
    if (!editable(hit) || source.contains(hit)) continue;
    let child = null;
    for (
      let group = hit;
      editable(group);
      child = group, group = group.parentElement
    ) {
      if (!validGroup(source, group) || locked(group)) continue;
      if (group === source.parentElement && (!child || child === source))
        continue;
      const rect = child?.getBoundingClientRect(),
        style = getComputedStyle(group);
      const across =
        style.display.includes('grid') ||
        (style.display.includes('flex') && style.flexDirection === 'row');
      const after =
        !rect ||
        (across
          ? x > rect.left + rect.width / 2
          : y > rect.top + rect.height / 2);
      return { group, child, after };
    }
  }
  return null;
}
