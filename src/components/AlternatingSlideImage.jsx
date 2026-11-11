import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const AlternatingSlideImage = ({
  images = [],
  height = '420px',
  borderRadius = '8px',
  alt = 'Sasta Trust community service',
  objectFit = 'cover',
  showDots = true,
  className = '',
  style = {},
}) => {
  const [current, setCurrent] = useState(0);
  if (!images.length) return null;

  const move = (direction) => setCurrent(index => (index + direction + images.length) % images.length);
  const buttonStyle = (side) => ({
    position: 'absolute',
    top: '50%',
    [side]: 12,
    zIndex: 2,
    display: 'grid',
    placeItems: 'center',
    width: 38,
    height: 38,
    border: '1px solid rgba(255,255,255,.75)',
    borderRadius: '50%',
    background: 'rgba(20,37,61,.76)',
    color: '#fff',
    cursor: 'pointer',
    transform: 'translateY(-50%)',
  });

  return (
    <div
      className={className}
      role="region"
      aria-roledescription="carousel"
      aria-label={alt}
      style={{ position: 'relative', width: '100%', height, overflow: 'hidden', borderRadius, background: '#e9ecee', ...style }}
    >
      <img
        src={images[current]}
        alt={`${alt}, image ${current + 1} of ${images.length}`}
        style={{ display: 'block', width: '100%', height: '100%', objectFit }}
        onError={event => { event.currentTarget.style.visibility = 'hidden'; }}
      />
      {images.length > 1 && <>
        <button type="button" onClick={() => move(-1)} aria-label="Previous photo" style={buttonStyle('left')}><ChevronLeft size={20} /></button>
        <button type="button" onClick={() => move(1)} aria-label="Next photo" style={buttonStyle('right')}><ChevronRight size={20} /></button>
        {showDots && <div aria-label="Choose photo" style={{ position: 'absolute', left: '50%', bottom: 12, zIndex: 2, display: 'flex', gap: 6, padding: '6px 8px', borderRadius: 20, background: 'rgba(20,37,61,.7)', transform: 'translateX(-50%)' }}>
          {images.map((_, index) => <button
            key={index}
            type="button"
            onClick={() => setCurrent(index)}
            aria-label={`Show photo ${index + 1}`}
            aria-current={index === current ? 'true' : undefined}
            style={{ width: index === current ? 17 : 6, height: 6, padding: 0, border: 0, borderRadius: 5, background: index === current ? '#fff' : 'rgba(255,255,255,.6)', cursor: 'pointer' }}
          />)}
        </div>}
      </>}
    </div>
  );
};
