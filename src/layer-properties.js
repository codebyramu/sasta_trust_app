function number(label, min, max, initial, step = 1) {
  return { label, min, max, initial, step };
}
const choices = (label, options) => ({ label, options });
export const layoutControls = {
  x: number('Horizontal position', -100000, 100000, 0),
  y: number('Vertical position', -100000, 100000, 0),
  width: number('Width', 1, 100000, 100),
  height: number('Height', 1, 100000, 100),
  rotation: number('Rotation (°)', -180, 180, 0),
  opacity: number('Opacity (%)', 0, 100, 100),
  layer: number('Stack level', -10000, 10000, 0),
  order: number('Order', -10000, 10000, 0),
  padding: number('Inner spacing', 0, 1000, 0),
  margin: number('Outer spacing', -1000, 1000, 0),
  gap: number('Item spacing', 0, 1000, 0),
  columns: number('Columns', 1, 24, 2),
  layout: choices('Layout', {
    original: 'Original',
    row: 'Row',
    column: 'Column',
    grid: 'Grid',
  }),
  items: choices('Align items', {
    stretch: 'Stretch',
    start: 'Start',
    center: 'Center',
    end: 'End',
  }),
  justify: choices('Distribute items', {
    start: 'Start',
    center: 'Center',
    end: 'End',
    'space-between': 'Space between',
    'space-around': 'Space around',
  }),
  overflow: choices('Overflow', {
    visible: 'Show outside edges',
    hidden: 'Clip at edges',
    auto: 'Scroll inside',
  }),
  align: choices('Text alignment', {
    start: 'Start',
    left: 'Left',
    center: 'Center',
    right: 'Right',
    justify: 'Justified',
  }),
  fit: choices('Image fit', {
    cover: 'Crop to fill',
    contain: 'Fit inside',
    fill: 'Stretch',
    none: 'Original size',
    'scale-down': 'Scale down',
  }),
  borderStyle: choices('Border style', {
    solid: 'Solid',
    dashed: 'Dashed',
    dotted: 'Dotted',
    double: 'Double',
    none: 'None',
  }),
  weight: choices('Font weight', {
    400: 'Regular',
    500: 'Medium',
    600: 'Semibold',
    700: 'Bold',
    800: 'Extra bold',
  }),
  fontStyle: choices('Font style', { normal: 'Regular', italic: 'Italic' }),
  leading: number('Line height (×)', 0.2, 8, 1.5, 0.05),
  tracking: number('Letter spacing (px)', -20, 100, 0, 0.25),
  scaleX: number('Horizontal scale (%)', 1, 1000, 100),
  scaleY: number('Vertical scale (%)', 1, 1000, 100),
  strokeWidth: number('Icon stroke width', 0, 24, 2, 0.25),
  textDecoration: choices('Decoration', {
    none: 'None',
    underline: 'Underline',
    'line-through': 'Strikethrough',
    overline: 'Overline',
  }),
  textTransform: choices('Text case', {
    none: 'Normal',
    uppercase: 'UPPERCASE',
    lowercase: 'lowercase',
    capitalize: 'Capitalize',
  }),
  gradientType: choices('Background fill', {
    solid: 'Solid color',
    linear: 'Linear gradient',
    radial: 'Radial gradient',
  }),
  gradientAngle: number('Gradient angle (°)', 0, 360, 135),
  // Filters
  filterBlur: number('Blur (px)', 0, 100, 0, 0.5),
  filterBrightness: number('Brightness (%)', 0, 500, 100),
  filterContrast: number('Contrast (%)', 0, 500, 100),
  filterGrayscale: number('Grayscale (%)', 0, 100, 0),
  filterSaturate: number('Saturate (%)', 0, 500, 100),
  filterHueRotate: number('Hue rotate (°)', -360, 360, 0),
};
export const corners = {
  tl: 'Top left',
  tr: 'Top right',
  br: 'Bottom right',
  bl: 'Bottom left',
};
export const sides = {
  top: 'Top',
  right: 'Right',
  bottom: 'Bottom',
  left: 'Left',
};
for (const [key, name] of Object.entries(corners))
  layoutControls[key] = number(name + ' radius', 0, 2000, 0);
for (const [key, name] of Object.entries(sides)) {
  layoutControls['border' + name] = number(name + ' border', 0, 200, 0);
  layoutControls['padding' + name] = number(name + ' padding', 0, 1000, 0);
  layoutControls['margin' + name] = number(name + ' margin', -1000, 1000, 0);
}
export function applyLayout(values, set, metrics) {
  const px = (key, prop = key) => {
    if (Number.isFinite(values[key])) set(prop, values[key] + 'px');
  };
  const prop = (key, property) => {
    if (values[key] !== undefined) set(property, String(values[key]));
  };
  const { x, y, width, height, layout, columns } = values;
  if (x !== undefined || y !== undefined)
    set('translate', `${x ?? 0}px ${y ?? 0}px`);
  if (
    [
      width,
      height,
      x,
      y,
      values.rotation,
      values.scaleX,
      values.scaleY,
      values.flipH,
      values.flipV,
    ].some((v) => v !== undefined) &&
    metrics.inline
  )
    set('display', 'inline-block');
  for (const dimension of ['width', 'height'])
    if (values[dimension] !== undefined) {
      px(dimension);
      set('max-' + dimension, 'none');
      set('min-' + dimension, '0');
      set('box-sizing', 'border-box');
      set('flex', '0 0 auto');
    }
  if (
    values.scaleX !== undefined ||
    values.scaleY !== undefined ||
    values.flipH !== undefined ||
    values.flipV !== undefined
  ) {
    const sx = ((values.scaleX ?? 100) / 100) * (values.flipH ? -1 : 1);
    const sy = ((values.scaleY ?? 100) / 100) * (values.flipV ? -1 : 1);
    set('scale', `${sx} ${sy}`);
  }
  if (values.rotation !== undefined) set('rotate', values.rotation + 'deg');
  if (values.opacity !== undefined)
    set('opacity', String(values.opacity / 100));
  if (values.layer !== undefined) {
    if (!metrics.position || metrics.position === 'static')
      set('position', 'relative');
    prop('layer', 'z-index');
  }
  prop('order', 'order');
  for (const key of ['padding', 'margin', 'gap']) px(key);
  if (
    layout === 'grid' ||
    (columns !== undefined && !['row', 'column'].includes(layout))
  ) {
    set('display', 'grid');
    set('grid-template-columns', `repeat(${columns ?? 2},minmax(0,1fr))`);
  }
  if (layout === 'row' || layout === 'column') {
    set('display', 'flex');
    set('flex-direction', layout);
    set('flex-wrap', layout === 'column' ? 'nowrap' : 'wrap');
  }
  prop('items', 'align-items');
  prop('justify', 'justify-content');
  prop('align', 'text-align');
  prop('fit', 'object-fit');
  prop('overflow', 'overflow');
  prop('weight', 'font-weight');
  prop('fontStyle', 'font-style');
  prop('leading', 'line-height');
  px('tracking', 'letter-spacing');
  prop('strokeWidth', 'stroke-width');
  prop('borderStyle', 'border-style');
  for (const [key, corner] of Object.entries(corners))
    px(key, 'border-' + corner.toLowerCase().replace(' ', '-') + '-radius');
  for (const [key, side] of Object.entries(sides)) {
    px('border' + side, 'border-' + key + '-width');
    px('padding' + side, 'padding-' + key);
    px('margin' + side, 'margin-' + key);
  }
  if (values.hidden === true) set('display', 'none');
  // CSS filter composition
  const filterParts = [];
  if (values.filterBlur !== undefined && values.filterBlur !== 0)
    filterParts.push(`blur(${values.filterBlur}px)`);
  if (values.filterBrightness !== undefined && values.filterBrightness !== 100)
    filterParts.push(`brightness(${values.filterBrightness}%)`);
  if (values.filterContrast !== undefined && values.filterContrast !== 100)
    filterParts.push(`contrast(${values.filterContrast}%)`);
  if (values.filterGrayscale !== undefined && values.filterGrayscale !== 0)
    filterParts.push(`grayscale(${values.filterGrayscale}%)`);
  if (values.filterSaturate !== undefined && values.filterSaturate !== 100)
    filterParts.push(`saturate(${values.filterSaturate}%)`);
  if (values.filterHueRotate !== undefined && values.filterHueRotate !== 0)
    filterParts.push(`hue-rotate(${values.filterHueRotate}deg)`);
  if (filterParts.length) set('filter', filterParts.join(' '));
  prop('textDecoration', 'text-decoration');
  prop('textTransform', 'text-transform');
}

export function layerValue(row, key) {
  if (row.values[key] !== undefined) return row.values[key];
  if (Object.hasOwn(corners, key) && row.values.radius !== undefined)
    return row.values.radius;
  if (
    Object.values(sides).some((side) => key === 'border' + side) &&
    row.values.thickness !== undefined
  )
    return row.values.thickness;
  if (
    Object.values(sides).some((side) => key === 'padding' + side) &&
    row.values.padding !== undefined
  )
    return row.values.padding;
  if (
    Object.values(sides).some((side) => key === 'margin' + side) &&
    row.values.margin !== undefined
  )
    return row.values.margin;
  if (
    key === 'borderStyle' &&
    (row.values.thickness ||
      Object.values(sides).some((side) => row.values['border' + side]))
  )
    return 'solid';
  return row.initial?.[key] ?? layoutControls[key]?.initial;
}
