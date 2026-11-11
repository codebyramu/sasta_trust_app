import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const arrowStyle = {
  position: 'absolute',
  top: '50%',
  zIndex: 2,
  display: 'grid',
  placeItems: 'center',
  width: 42,
  height: 42,
  border: '1px solid rgba(255,255,255,.72)',
  borderRadius: '50%',
  background: 'rgba(20,37,61,.78)',
  color: '#fff',
  cursor: 'pointer',
  transform: 'translateY(-50%)',
};

export const InteractiveImageSlider = ({
  images = [],
  height = '520px',
  borderRadius = '8px',
  caption = null,
  alt = 'Sasta Trust community service',
}) => {
  const [current, setCurrent] = useState(0);
  if (!images.length) return null;

  const showPrevious = () => setCurrent(index => (index - 1 + images.length) % images.length);
  const showNext = () => setCurrent(index => (index + 1) % images.length);

  return (
    <figure style={{ margin: 0 }}>
      <div
        role="region"
        aria-roledescription="carousel"
        aria-label="Sasta Trust photographs"
        style={{ position: 'relative', width: '100%', height, overflow: 'hidden', borderRadius, background: '#e9ecee' }}
      >
        <img
          src={images[current]}
          alt={`${alt}, image ${current + 1} of ${images.length}`}
          style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover' }}
        />
        {images.length > 1 && <>
          <button type="button" onClick={showPrevious} aria-label="Previous photo" style={{ ...arrowStyle, left: 16 }}><ChevronLeft size={22} /></button>
          <button type="button" onClick={showNext} aria-label="Next photo" style={{ ...arrowStyle, right: 16 }}><ChevronRight size={22} /></button>
          <div aria-label="Choose photo" style={{ position: 'absolute', bottom: 15, left: '50%', zIndex: 2, display: 'flex', gap: 6, padding: '6px 8px', borderRadius: 20, background: 'rgba(20,37,61,.7)', transform: 'translateX(-50%)' }}>
            {images.map((_, index) => <button
              key={index}
              type="button"
              onClick={() => setCurrent(index)}
              aria-label={`Show photo ${index + 1}`}
              aria-current={index === current ? 'true' : undefined}
              style={{ width: index === current ? 18 : 7, height: 7, padding: 0, border: 0, borderRadius: 5, background: index === current ? '#fff' : 'rgba(255,255,255,.58)', cursor: 'pointer' }}
            />)}
          </div>
        </>}
      </div>
      {caption && <figcaption style={{ marginTop: 9, color: '#66717e', fontSize: '.78rem' }}>{caption}</figcaption>}
    </figure>
  );
};
