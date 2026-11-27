import React, {
  createContext,
  useContext,
  useLayoutEffect,
  useState,
  useSyncExternalStore,
} from 'react';
import { createPortal } from 'react-dom';

// IDs describe the authored tree, independent of its visual arrangement.
// Keep the actual React element and its handlers when rendering in a new group.
const Scope = createContext('');
const Owner = createContext(null);
let placements = new Map();
const listeners = new Set();
const subscribe = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};
export function syncPlacements(entries, path) {
  const next = new Map();
  for (const row of entries)
    if (
      (row.path === '*' || row.path === path) &&
      row.id &&
      typeof row.values.parent === 'string'
    )
      next.set(row.id, row.values.parent);
  if (
    next.size === placements.size &&
    [...next].every(([key, val]) => placements.get(key) === val)
  )
    return;
  placements = next;
  for (const fn of listeners) fn();
}
function Movable({ id, element }) {
  const owner = useContext(Owner);
  const parent = useSyncExternalStore(
    subscribe,
    () => placements.get(id) || null
  );
  const [target, setTarget] = useState(null);
  useLayoutEffect(() => {
    if (!parent) {
      setTarget(null);
      return;
    }
    const root = document.getElementById('root');
    function resolve() {
      const dest = root.querySelector(
        '[data-layer-id=' + CSS.escape(parent) + ']'
      );
      setTarget((prev) => (prev === dest ? prev : dest));
    }
    resolve();
    const observer = new MutationObserver(resolve);
    observer.observe(root, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [parent]);
  const content = React.cloneElement(element, {
    'data-layer-id': id,
    'data-layer-owner': owner,
  });
  const placed =
    parent && target?.isConnected && target.dataset.layerId === parent
      ? createPortal(content, target, id)
      : content;
  return <Owner.Provider value={id}>{placed}</Owner.Provider>;
}
function mapped(children, scope, wrapText = false) {
  return React.Children.map(children, (child, index) => {
    if (!React.isValidElement(child)) {
      if (
        wrapText &&
        ((typeof child === 'string' && child.trim()) ||
          typeof child === 'number')
      )
        return (
          <Movable
            id={`${scope}/text-${index}`}
            element={<span data-layer-text="">{child}</span>}
          />
        );
      return child;
    }
    if (child.type === Movable || child.type === Scope.Provider) return child;
    const part =
        child.key == null ? index : 'k' + encodeURIComponent(child.key),
      id =
        scope +
        '/' +
        (typeof child.type === 'string' ? child.type : 'c') +
        '-' +
        part,
      props = child.props;
    const host =
      typeof child.type === 'string' ||
      child.type?.$$typeof === Symbol.for('react.forward_ref');
    const hasMixed =
      host &&
      ![
        'select',
        'option',
        'textarea',
        'table',
        'tbody',
        'thead',
        'tr',
        'ul',
        'ol',
      ].includes(child.type) &&
      React.Children.toArray(props.children).some(
        (c) => React.isValidElement(c) && c.type !== 'br'
      );
    const inner =
      props.children == null
        ? child
        : React.cloneElement(child, {}, mapped(props.children, id, hasMixed));
    if (child.type === React.Fragment) return inner;
    if (host) return <Movable key={child.key} id={id} element={inner} />;
    return (
      <Scope.Provider key={child.key} value={id}>
        {inner}
      </Scope.Provider>
    );
  });
}
function LayerDocument({ name, children }) {
  const parent = useContext(Scope);
  return mapped(children, parent + '/' + name);
}
export function pageLayers(name, children) {
  return <LayerDocument name={name}>{children}</LayerDocument>;
}
