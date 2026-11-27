import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Palette,
  Copy,
  Download,
  Upload,
  RotateCcw,
  Layers,
  SlidersHorizontal,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import {
  VisualEditor,
  LayoutProperties,
  ElementNavigator,
  LayerActions,
  EdgeProperties,
  PropertyFields,
} from './visual-editor';
import { useElementTheme, controlFor } from './element-theme';
import { LayerList } from './layer-list';
import { useLocation } from 'react-router-dom';

const controls = {
  radius: {
    label: 'Corner radius',
    min: 0,
    max: 32,
    step: 1,
    initial: 10,
    unit: 'px',
  },
  thickness: {
    label: 'Border thickness',
    min: 0,
    max: 5,
    step: 1,
    initial: 1,
    unit: 'px',
  },
  shadow: {
    label: 'Card shadows',
    initial: 'none',
    options: { none: 'None', soft: 'Soft', strong: 'Strong' },
  },
  font: {
    label: 'Heading font',
    initial: 'classic',
    options: {
      classic: 'Libre Baskerville',
      clean: 'Inter',
      traditional: 'Georgia',
    },
  },
  size: {
    label: 'Text size',
    min: 85,
    max: 125,
    step: 5,
    initial: 100,
    unit: '%',
  },
  spacing: {
    label: 'Spacing',
    min: 75,
    max: 140,
    step: 5,
    initial: 100,
    unit: '%',
  },
  width: {
    label: 'Page width',
    min: 960,
    max: 1600,
    step: 32,
    initial: 1312,
    unit: 'px',
  },
};
const colors = { base: '#190003', background: '#f4f2f1', border: '#dfd5d3' };
const labels = {
  base: 'Base color',
  background: 'Background',
  border: 'Border color',
};
const defaults = {
  ...colors,
  ...Object.fromEntries(
    Object.entries(controls).map(([key, control]) => [key, control.initial])
  ),
};
const storageKey = 'sasta-theme-preview-v1';
const savedThemesKey = 'sasta-saved-themes-v1';
const activeThemeKey = 'sasta-active-theme-v1';
const hex = /^#[0-9a-f]{6}$/i;

function loadSavedThemes() {
  try {
    const raw = JSON.parse(localStorage.getItem(savedThemesKey));
    return Array.isArray(raw)
      ? raw.filter(
          (t) =>
            t &&
            typeof t.id === 'string' &&
            typeof t.name === 'string' &&
            t.palette &&
            Array.isArray(t.entries)
        )
      : [];
  } catch {
    return [];
  }
}
function loadActiveThemeId() {
  try {
    return localStorage.getItem(activeThemeKey) || 'default';
  } catch {
    return 'default';
  }
}

function loadPalette() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    const restored = { ...defaults };
    for (const key of Object.keys(colors)) {
      if (hex.test(saved?.[key])) restored[key] = saved[key];
    }
    for (const [key, control] of Object.entries(controls)) {
      const value = saved?.[key];
      if (
        control.options
          ? Object.hasOwn(control.options, value)
          : typeof value === 'number' &&
            Number.isFinite(value) &&
            value >= control.min &&
            value <= control.max
      ) {
        restored[key] = value;
      }
    }
    return restored;
  } catch {
    /* Browser storage is optional. */
  }
  return defaults;
}

function luminance(color) {
  const [r, g, b] = color
    .slice(1)
    .match(/../g)
    .map((pair) => {
      const x = parseInt(pair, 16) / 255;
      return x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
    });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function foreground(color) {
  return luminance(color) > 0.179 ? '#101010' : '#ffffff';
}

function ColorField({
  name,
  label = labels[name],
  value,
  onChange,
  mixed = false,
}) {
  const [draft, setDraft] = useState(mixed ? '' : value);
  useEffect(() => setDraft(mixed ? '' : value), [value, mixed]);
  function edit(text) {
    setDraft(text);
    const normalized = text.startsWith('#') ? text : '#' + text;
    if (hex.test(normalized)) onChange(normalized.toLowerCase());
  }
  return (
    <div className="theme-field">
      <label htmlFor={'theme-' + name}>{label}</label>
      <input
        id={'theme-' + name}
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <input
        className="hex-field"
        aria-label={label + ' hex value'}
        value={draft}
        maxLength={7}
        spellCheck={false}
        onChange={(e) => edit(e.target.value)}
        placeholder={mixed ? 'Mixed' : undefined}
        onBlur={() => setDraft(mixed ? '' : value)}
      />
    </div>
  );
}

function QuickTextBox({ elements, disabled }) {
  const row = elements.selected;
  const savedText = row?.values.text ?? row?.initial?.text ?? '';
  const [draft, setDraft] = useState(savedText);
  useEffect(() => {
    setDraft(savedText);
  }, [row?.selector, row?.path, savedText]);
  if (!row || row.initial?.text == null) return null;
  function commit() {
    if (draft !== savedText) elements.update('text', draft);
  }
  return (
    <div className="quick-text-box">
      <label>
        Edit text
        <textarea
          rows="2"
          disabled={disabled}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              commit();
            }
          }}
        />
      </label>
      <button
        type="button"
        disabled={disabled || draft === savedText}
        onClick={commit}
      >
        Apply text
      </button>
    </div>
  );
}

export function ThemePicker() {
  const [palette, setPalette] = useState(loadPalette);
  const [savedThemes, setSavedThemes] = useState(loadSavedThemes);
  const [activeThemeId, setActiveThemeId] = useState(loadActiveThemeId);
  const [newThemeName, setNewThemeName] = useState('');
  const [exportOpen, setExportOpen] = useState(false);
  const [importDraft, setImportDraft] = useState('');
  const [feedback, setFeedback] = useState('');
  const [tab, setTab] = useState('style');
  const [panel, setPanel] = useState('properties');
  const [, refreshLayers] = useState(0);
  const menu = useRef(null);
  const location = useLocation();
  const elements = useElementTheme(
    location,
    menu,
    defaults,
    controls,
    palette,
    setPalette
  );
  // Keep the currently selected custom theme synced with live color & layout changes
  useEffect(() => {
    try {
      localStorage.setItem(savedThemesKey, JSON.stringify(savedThemes));
    } catch {
      /* Browser storage is optional. */
    }
  }, [savedThemes]);
  useEffect(() => {
    try {
      localStorage.setItem(activeThemeKey, activeThemeId);
    } catch {
      /* Browser storage is optional. */
    }
  }, [activeThemeId]);
  useEffect(() => {
    if (activeThemeId === 'default') return;
    setSavedThemes((prev) =>
      prev.map((t) =>
        t.id === activeThemeId
          ? { ...t, palette, entries: elements.entries }
          : t
      )
    );
  }, [activeThemeId, palette, elements.entries]);
  function createSavedTheme(e) {
    e.preventDefault();
    const name = newThemeName.trim();
    if (!name) return;
    const id = 'theme-' + Date.now().toString(36);
    const snapshot = {
      id,
      name,
      palette: { ...palette },
      entries: elements.entries.map((row) => ({
        ...row,
        values: { ...row.values },
      })),
    };
    setSavedThemes((prev) => [...prev, snapshot]);
    setActiveThemeId(id);
    setNewThemeName('');
    setFeedback(`Saved theme "${name}".`);
  }
  function switchTheme(id) {
    if (id === 'default') {
      setActiveThemeId('default');
      elements.applyThemeSnapshot(defaults, []);
      setFeedback('Switched to Default theme.');
      return;
    }
    const found = savedThemes.find((t) => t.id === id);
    if (!found) return;
    setActiveThemeId(found.id);
    elements.applyThemeSnapshot(
      { ...defaults, ...found.palette },
      found.entries
    );
    setFeedback(`Previewing "${found.name}".`);
  }
  function removeSavedTheme(id) {
    const target = savedThemes.find((t) => t.id === id);
    setSavedThemes((prev) => prev.filter((t) => t.id !== id));
    if (activeThemeId === id) setActiveThemeId('default');
    if (target) setFeedback(`Deleted theme "${target.name}".`);
  }
  const current = elements.selected
    ? { ...palette, ...elements.selected.initial, ...elements.selected.values }
    : palette;
  useLayoutEffect(() => {
    if (!elements.editing) return;
    const observer = new MutationObserver(() => refreshLayers((i) => i + 1));
    observer.observe(document.getElementById('root'), {
      subtree: true,
      childList: true,
    });
    return () => observer.disconnect();
  }, [elements.editing]);
  const node =
    elements.selected && document.querySelector(elements.selected.selector);
  const multiple = elements.selectedRows.length > 1;
  const activeTab = multiple && tab === 'content' ? 'style' : tab;
  const isLocked = elements.selectedRows.some((r) =>
    elements.locked(document.querySelector(r.selector))
  );
  const onlyIcons =
    !!node &&
    elements.selectedRows.every(
      (r) => document.querySelector(r.selector)?.localName === 'svg'
    );
  function showPanel(name) {
    setPanel((old) => (old === name ? null : name));
  }
  function openEditor() {
    setPanel(matchMedia('(max-width:690px)').matches ? null : 'layers');
    elements.toggleEditing(true);
  }
  function update(name, value) {
    if (elements.selected) elements.update(name, value);
    else elements.globalUpdate(name, value);
    setFeedback('');
  }
  useLayoutEffect(() => {
    const root = document.documentElement;
    const custom = Object.keys(defaults).some(
      (key) => palette[key] !== defaults[key]
    );
    for (const key of Object.keys(defaults)) {
      root.toggleAttribute('data-theme-' + key, palette[key] !== defaults[key]);
    }
    root.toggleAttribute('data-theme-preview', custom);
    root.dataset.themeFont = palette.font;
    root.style.setProperty('--preview-radius', palette.radius + 'px');
    root.style.setProperty('--preview-border', palette.thickness + 'px');
    root.style.setProperty('--preview-size', palette.size / 100);
    root.style.setProperty('--preview-spacing', palette.spacing / 100);
    root.style.setProperty('--preview-width', palette.width + 'px');
    const shadows = {
      none: 'none',
      soft: '0 4px 14px #00000012',
      strong: '0 8px 24px #00000026',
    };
    root.style.setProperty('--preview-shadow', shadows[palette.shadow]);
    const base = palette.base,
      paper = palette.background;
    const ink = foreground(paper);
    const a = luminance(base),
      b = luminance(paper);
    const contrast = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    const vars = {
      '--accent': base,
      '--paper': paper,
      '--line': palette.border,
      '--on-accent': foreground(base),
      '--text': paper === defaults.background ? null : ink,
      '--deep':
        base === defaults.base
          ? null
          : 'color-mix(in srgb, var(--accent) 40%, black)',
      '--muted':
        paper === defaults.background
          ? null
          : 'color-mix(in srgb, var(--text) 80%, var(--paper))',
      '--wash':
        paper === defaults.background
          ? null
          : 'color-mix(in srgb, var(--paper) 94%, var(--text))',
      '--link-ink': contrast >= 4.5 ? base : ink,
    };
    for (const [key, value] of Object.entries(vars)) {
      if (custom && value) root.style.setProperty(key, value);
      else root.style.removeProperty(key);
    }
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', base);
    try {
      if (custom) localStorage.setItem(storageKey, JSON.stringify(palette));
      else localStorage.removeItem(storageKey);
    } catch {
      /* Preview also works without storage. */
    }
  }, [palette]);
  useEffect(() => {
    if (menu.current && !elements.editing) menu.current.open = false;
  }, [location.key]);
  useEffect(() => {
    function outside(e) {
      if (
        menu.current &&
        !menu.current.contains(e.target) &&
        !document.documentElement.hasAttribute('data-visual-editing')
      )
        menu.current.open = false;
    }
    function escape(e) {
      if (
        e.key === 'Escape' &&
        menu.current?.open &&
        !document.documentElement.hasAttribute('data-visual-editing')
      ) {
        menu.current.open = false;
        menu.current.querySelector('summary').focus();
      }
    }
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('keydown', escape);
    };
  }, []);
  function buildThemeScript(options = {}) {
    const onlyChanges = options.onlyChanges ?? true;
    const activeName =
      savedThemes.find((t) => t.id === activeThemeId)?.name || 'Custom theme';

    let exportedPalette = palette;
    if (onlyChanges) {
      exportedPalette = {};
      for (const [key, val] of Object.entries(palette)) {
        if (val !== defaults[key]) exportedPalette[key] = val;
      }
    }

    const modifiedRows = elements.entries.filter((row) => {
      if (row.addedKind || row.cloneHtml) return true;
      if (!row.values) return false;
      return Object.keys(row.values).some(
        (k) => row.values[k] !== undefined && row.values[k] !== ''
      );
    });

    const exportedElements = onlyChanges
      ? modifiedRows.map((row) => {
          const item = {
            id: row.id,
            name: row.values?.name || row.name,
            selector: row.selector,
          };
          if (row.path && row.path !== '*') item.path = row.path;
          if (row.values && Object.keys(row.values).length > 0)
            item.values = row.values;
          if (row.addedKind) item.addedKind = row.addedKind;
          if (row.cloneHtml) item.cloneHtml = row.cloneHtml;
          return item;
        })
      : elements.entries.map((row) => ({
          id: row.id,
          name: row.values?.name || row.name,
          path: row.path,
          selector: row.selector,
          homeParent: row.homeParent,
          metrics: row.metrics,
          values: row.values,
          ...(row.addedKind ? { addedKind: row.addedKind } : {}),
          ...(row.cloneHtml ? { cloneHtml: row.cloneHtml } : {}),
        }));

    return JSON.stringify(
      {
        version: 1,
        name: activeName,
        palette: exportedPalette,
        elements: exportedElements,
      },
      null,
      2
    );
  }
  async function copy(onlyChanges = true) {
    const text = buildThemeScript({ onlyChanges });
    const activeName =
      savedThemes.find((t) => t.id === activeThemeId)?.name || 'Custom theme';
    let palCount = 0;
    let elemCount = 0;
    try {
      const parsed = JSON.parse(text);
      palCount = Object.keys(parsed.palette || {}).length;
      elemCount = (parsed.elements || []).length;
    } catch {}
    try {
      await navigator.clipboard.writeText(text);
      setFeedback(
        onlyChanges
          ? `Copied changes only (${palCount} palette settings, ${elemCount} modified elements) for "${activeName}". Paste in chat!`
          : `Copied complete theme script (${elemCount} elements) for "${activeName}".`
      );
    } catch {
      setImportDraft(text);
      setExportOpen(true);
      setFeedback('Copy the JSON script from the box below.');
    }
  }
  function downloadTheme() {
    const activeName =
      savedThemes.find((t) => t.id === activeThemeId)?.name || 'custom';
    const slug =
      activeName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') || 'custom';
    const blob = new Blob([buildThemeScript({ onlyChanges: true })], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${slug}-theme.json`;
    a.click();
    URL.revokeObjectURL(url);
    setFeedback(`Downloaded ${slug}-theme.json.`);
  }
  function importThemeScript() {
    try {
      const parsed = JSON.parse(importDraft);
      if (!parsed || typeof parsed !== 'object') {
        setFeedback('Invalid theme JSON. Needs palette or elements.');
        return;
      }
      const nextPalette = { ...defaults };
      if (parsed.palette && typeof parsed.palette === 'object') {
        for (const key of Object.keys(colors)) {
          if (hex.test(parsed.palette[key])) nextPalette[key] = parsed.palette[key];
        }
        for (const [key, control] of Object.entries(controls)) {
          const v = parsed.palette[key];
          if (
            control.options
              ? Object.hasOwn(control.options, v)
              : typeof v === 'number' &&
                Number.isFinite(v) &&
                v >= control.min &&
                v <= control.max
          )
            nextPalette[key] = v;
        }
      }
      const rawElements = Array.isArray(parsed.elements) ? parsed.elements : [];
      const nextEntries = rawElements
        .filter(
          (r) =>
            r &&
            (r.id || r.selector) &&
            (r.values || r.addedKind || r.cloneHtml)
        )
        .map((r) => {
          const id =
            r.id ||
            r.selector?.match(/data-layer-id=([^\]]+)/)?.[1]?.replace(/\\/g, '') ||
            '';
          const selector =
            r.selector || (id ? `#root [data-layer-id=${CSS.escape(id)}]` : '');
          const existing = elements.entries.find(
            (e) => (id && e.id === id) || (selector && e.selector === selector)
          );
          return {
            id: id || existing?.id || 'elem-' + Math.random().toString(36).slice(2, 8),
            name: r.name || existing?.name || 'Element',
            path: r.path || existing?.path || '*',
            selector: selector || existing?.selector || '',
            homeParent: r.homeParent || existing?.homeParent || '',
            metrics: r.metrics || existing?.metrics || {
              font: 15,
              padding: [0, 0, 0, 0],
              inline: false,
              position: 'relative',
            },
            values: { ...(existing?.values || {}), ...(r.values || {}) },
            ...(r.cloneHtml || existing?.cloneHtml
              ? { cloneHtml: r.cloneHtml || existing?.cloneHtml }
              : {}),
            ...(r.addedKind || existing?.addedKind
              ? { addedKind: r.addedKind || existing?.addedKind }
              : {}),
          };
        });
      const name = (parsed.name || 'Imported theme').slice(0, 40);
      const id = 'theme-' + Date.now().toString(36);
      setSavedThemes((prev) => [
        ...prev,
        { id, name, palette: nextPalette, entries: nextEntries },
      ]);
      setActiveThemeId(id);
      elements.applyThemeSnapshot(nextPalette, nextEntries);
      setExportOpen(false);
      setFeedback(
        `Imported theme "${name}" with ${nextEntries.length} element changes.`
      );
    } catch {
      setFeedback('Could not parse theme JSON.');
    }
  }
  const picker = (
    <details
      className={
        'theme-picker' +
        (elements.editing ? ' visual-active' : ' theme-launcher')
      }
      ref={menu}
      open={elements.editing ? !!panel : undefined}
    >
      <summary aria-label="Customize theme">
        <Palette size={14} /> Theme
      </summary>
      <section aria-label="Theme customization" className="theme-panel">
        {elements.editing ? (
          <div className="studio-head">
            <div>
              <button
                aria-pressed={panel === 'layers'}
                onClick={() => setPanel('layers')}
              >
                <Layers size={15} />
                Layers
              </button>
              <button
                aria-pressed={panel === 'properties'}
                onClick={() => setPanel('properties')}
              >
                <SlidersHorizontal size={15} />
                Properties
              </button>
            </div>
            <button aria-label="Close panel" onClick={() => setPanel(null)}>
              <X size={16} />
            </button>
          </div>
        ) : (
          <>
            <h2>Customize theme</h2>
            <button className="visual-start" type="button" onClick={openEditor}>
              <Layers size={15} />
              Open visual editor
            </button>
          </>
        )}
        {elements.editing && panel === 'layers' ? (
          <>
            <LayerList
              elements={elements}
              inspect={() => setPanel('properties')}
            />
            {elements.selected && <LayerActions elements={elements} />}
          </>
        ) : (
          <>
            {!elements.editing && (
              <div className="theme-history">
                <button disabled={!elements.canUndo} onClick={elements.undo}>
                  Undo
                </button>
                <button disabled={!elements.canRedo} onClick={elements.redo}>
                  Redo
                </button>
              </div>
            )}
            <div className="saved-themes" aria-label="Saved themes">
              <div className="saved-themes-head">
                <strong>Saved themes</strong>
                <small>Switch to compare</small>
              </div>
              <div className="saved-theme-list">
                <button
                  type="button"
                  className="saved-theme-chip"
                  aria-pressed={activeThemeId === 'default'}
                  onClick={() => switchTheme('default')}
                >
                  Default
                </button>
                {savedThemes.map((t) => (
                  <div
                    key={t.id}
                    className={
                      'saved-theme-item' +
                      (activeThemeId === t.id ? ' is-active' : '')
                    }
                  >
                    <button
                      type="button"
                      className="saved-theme-chip"
                      aria-pressed={activeThemeId === t.id}
                      onClick={() => switchTheme(t.id)}
                    >
                      {t.name}
                    </button>
                    <button
                      type="button"
                      className="saved-theme-delete"
                      aria-label={'Delete ' + t.name}
                      title={'Delete ' + t.name}
                      onClick={() => removeSavedTheme(t.id)}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
              <form className="create-theme-form" onSubmit={createSavedTheme}>
                <input
                  aria-label="New theme name"
                  placeholder="Theme name (e.g. Brown theme)"
                  maxLength={40}
                  value={newThemeName}
                  onChange={(e) => setNewThemeName(e.target.value)}
                />
                <button type="submit" disabled={!newThemeName.trim()}>
                  <Plus size={13} />
                  Create theme
                </button>
              </form>
              <div className="saved-theme-export">
                <button
                  type="button"
                  title="Copy only what changed (palette & modified elements) - compact script to share"
                  onClick={() => copy(true)}
                >
                  <Copy size={12} />
                  Copy changes
                </button>
                <button
                  type="button"
                  title="Copy complete theme snapshot with all elements and metrics"
                  onClick={() => copy(false)}
                >
                  <Copy size={12} />
                  Copy all
                </button>
                <button
                  type="button"
                  title="Download theme as JSON file"
                  onClick={downloadTheme}
                >
                  <Download size={12} />
                  Download
                </button>
                <button
                  type="button"
                  aria-expanded={exportOpen}
                  onClick={() => {
                    if (!exportOpen)
                      setImportDraft(buildThemeScript({ onlyChanges: true }));
                    setExportOpen((v) => !v);
                  }}
                >
                  <Upload size={12} />
                  {exportOpen ? 'Hide script' : 'View / Import'}
                </button>
              </div>
              {exportOpen && (
                <div className="theme-script-box">
                  <textarea
                    rows="5"
                    aria-label="Theme JSON script"
                    value={importDraft}
                    onFocus={(e) => e.currentTarget.select()}
                    onChange={(e) => setImportDraft(e.target.value)}
                  />
                  <div>
                    <button type="button" onClick={importThemeScript}>
                      Import JSON as theme
                    </button>
                  </div>
                </div>
              )}
            </div>
            <div
              className="theme-scope"
              role="group"
              aria-label="Apply theme to"
            >
              <button
                type="button"
                aria-pressed={!elements.selected}
                onClick={elements.all}
              >
                Whole site
              </button>
              <button
                type="button"
                aria-pressed={!!elements.selected}
                onClick={() => {
                  if (elements.editing) setPanel('layers');
                  else elements.start();
                }}
              >
                {elements.editing ? 'Select layer' : 'Pick an element'}
              </button>
            </div>
            {elements.selected && (
              <div className="theme-selection">
                <strong>
                  {multiple ? 'Reference · ' : ''}
                  {elements.selected.values.name || elements.selected.name}
                </strong>
                <small>
                  {elements.selected.path === '*'
                    ? 'Shared across pages'
                    : elements.selected.path}
                </small>
                <div>
                  {!multiple && (
                    <button type="button" onClick={elements.parent}>
                      Select parent
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={isLocked}
                    onClick={elements.clear}
                  >
                    {multiple ? 'Clear selected edits' : 'Clear element style'}
                  </button>
                </div>
                {!multiple && (
                  <QuickTextBox elements={elements} disabled={isLocked} />
                )}
              </div>
            )}
            {elements.editing && <LayerActions elements={elements} />}
            <p className="theme-hint">
              {elements.picking
                ? 'Click an element on the page. Press Escape to cancel.'
                : elements.selected
                  ? isLocked
                    ? 'Unlock this layer or its parent to edit it.'
                    : multiple
                      ? 'Changes apply to all selected layers.'
                      : 'Changes apply to the selected layer.'
                  : 'Whole-site settings apply across pages. Individual element styles take priority.'}
            </p>
            {elements.selected && (
              <div
                className="editor-tabs"
                role="group"
                aria-label="Element properties"
              >
                {(multiple
                  ? ['style', 'layout']
                  : ['style', 'layout', 'content']
                ).map((name) => (
                  <button
                    key={name}
                    aria-pressed={activeTab === name}
                    onClick={() => setTab(name)}
                  >
                    {name}
                  </button>
                ))}
              </div>
            )}
            <fieldset className="layer-fields" disabled={isLocked}>
              <div hidden={!!elements.selected && activeTab !== 'style'}>
                {Object.keys(labels).map((name) => (
                  <ColorField
                    key={name}
                    name={name}
                    label={
                      elements.selected && name === 'base'
                        ? 'Text / icon color'
                        : labels[name]
                    }
                    mixed={elements.mixed(name)}
                    value={current[name]}
                    onChange={(color) => {
                      update(name, color);
                    }}
                  />
                ))}
                {onlyIcons &&
                  ['stroke', 'fill'].map((key) => (
                    <ColorField
                      key={key}
                      name={key}
                      label={key === 'stroke' ? 'Icon stroke' : 'Icon fill'}
                      mixed={elements.mixed(key)}
                      value={current[key] || current.base}
                      onChange={(color) => update(key, color)}
                    />
                  ))}
                {elements.selected && (
                  <>
                    <label className="layer-toggle">
                      <input
                        type="checkbox"
                        ref={(input) => {
                          if (input)
                            input.indeterminate = elements.mixed('transparent');
                        }}
                        checked={
                          elements.selected.values.transparent ??
                          (elements.selected.values.background
                            ? false
                            : !!current.transparent)
                        }
                        onChange={(e) => {
                          if (e.target.checked) update('transparent', true);
                          else update('background', current.background);
                        }}
                      />
                      Transparent background
                    </label>
                    <details className="layout-properties">
                      <summary>Gradient fill</summary>
                      <PropertyFields
                        elements={elements}
                        names={[
                          'gradientType',
                          ...(current.gradientType &&
                          current.gradientType !== 'solid'
                            ? ['gradientAngle']
                            : []),
                        ]}
                      />
                      {current.gradientType &&
                        current.gradientType !== 'solid' && (
                          <ColorField
                            name="gradientColor"
                            label="Gradient 2nd color"
                            mixed={elements.mixed('gradientColor')}
                            value={current.gradientColor || palette.base}
                            onChange={(color) => update('gradientColor', color)}
                          />
                        )}
                    </details>
                  </>
                )}
                <div className="theme-options">
                  {Object.entries(controls)
                    .filter(([key]) => !elements.selected || key !== 'width')
                    .map(([key, globalControl]) => {
                      const control = elements.selected
                        ? controlFor(key, controls)
                        : globalControl;
                      return (
                        <label
                          className="theme-option"
                          key={key}
                          htmlFor={'theme-' + key}
                        >
                          <span>
                            {elements.selected
                              ? { font: 'Font family', shadow: 'Shadow' }[
                                  key
                                ] || control.label
                              : control.label}
                            {!control.options && (
                              <output>
                                {elements.mixed(key)
                                  ? 'Mixed'
                                  : current[key] + control.unit}
                              </output>
                            )}
                          </span>
                          {control.options ? (
                            <select
                              id={'theme-' + key}
                              value={elements.mixed(key) ? '' : current[key]}
                              onChange={(e) => {
                                update(key, e.target.value);
                              }}
                            >
                              {elements.mixed(key) && (
                                <option value="" disabled>
                                  Mixed
                                </option>
                              )}
                              {Object.entries(control.options).map(
                                ([value, label]) => (
                                  <option key={value} value={value}>
                                    {label}
                                  </option>
                                )
                              )}
                            </select>
                          ) : (
                            <input
                              id={'theme-' + key}
                              type={
                                elements.selected &&
                                ['radius', 'thickness'].includes(key)
                                  ? 'number'
                                  : 'range'
                              }
                              min={control.min}
                              max={control.max}
                              step={control.step}
                              placeholder={
                                elements.mixed(key) ? 'Mixed' : undefined
                              }
                              value={
                                elements.mixed(key) &&
                                ['radius', 'thickness'].includes(key)
                                  ? ''
                                  : current[key]
                              }
                              onChange={(e) => {
                                const n = e.target.valueAsNumber;
                                if (Number.isFinite(n))
                                  update(
                                    key,
                                    Math.min(
                                      control.max,
                                      Math.max(control.min, n)
                                    )
                                  );
                              }}
                            />
                          )}
                        </label>
                      );
                    })}
                </div>
                {elements.selected && (
                  <>
                    <PropertyFields
                      elements={elements}
                      names={[
                        'borderStyle',
                        'opacity',
                        ...(onlyIcons ? ['strokeWidth'] : []),
                      ]}
                    />
                    <div className="editor-quick">
                      <button
                        type="button"
                        onClick={() => update('radius', 0)}
                      >
                        Sharp (0px)
                      </button>
                      <button
                        type="button"
                        onClick={() => update('radius', 12)}
                      >
                        Soft (12px)
                      </button>
                      <button
                        type="button"
                        onClick={() => update('radius', 999)}
                      >
                        Pill (999px)
                      </button>
                    </div>
                    <EdgeProperties elements={elements} />
                    <details className="layout-properties">
                      <summary>Typography</summary>
                      <PropertyFields
                        elements={elements}
                        names={[
                          'align',
                          'weight',
                          'fontStyle',
                          'textDecoration',
                          'textTransform',
                          'tracking',
                          'leading',
                        ]}
                      />
                    </details>
                    <details className="layout-properties">
                      <summary>Effects &amp; filters</summary>
                      <PropertyFields
                        elements={elements}
                        names={[
                          'filterBlur',
                          'filterBrightness',
                          'filterContrast',
                          'filterGrayscale',
                          'filterSaturate',
                          'filterHueRotate',
                        ]}
                      />
                      <div className="editor-quick">
                        <button
                          type="button"
                          onClick={() =>
                            elements.batch({
                              filterBlur: undefined,
                              filterBrightness: undefined,
                              filterContrast: undefined,
                              filterGrayscale: undefined,
                              filterSaturate: undefined,
                              filterHueRotate: undefined,
                            })
                          }
                        >
                          Reset effects
                        </button>
                      </div>
                    </details>
                  </>
                )}
              </div>
              <div hidden={!elements.selected || activeTab !== 'content'}>
                {!multiple && <ElementNavigator elements={elements} />}
              </div>
              <div hidden={!elements.selected || activeTab !== 'layout'}>
                <LayoutProperties elements={elements} />
              </div>
            </fieldset>
            <div className="theme-actions">
              <button type="button" onClick={copy}>
                <Copy size={14} />
                Copy theme
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveThemeId('default');
                  setPalette(defaults);
                  elements.reset();
                  setFeedback('Default theme restored.');
                }}
              >
                <RotateCcw size={13} />
                Reset
              </button>
            </div>
            {feedback && <p role="status">{feedback}</p>}
          </>
        )}
      </section>
    </details>
  );
  return (
    <>
      <VisualEditor
        elements={elements}
        onCanvasSelect={() => setPanel((old) => (old ? 'properties' : null))}
        showPanel={showPanel}
        panel={panel}
      />
      {createPortal(picker, document.body)}
    </>
  );
}
