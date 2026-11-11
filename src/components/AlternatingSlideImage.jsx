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

  return (
    <div
      className={`trust-photo-carousel ${className}`.trim()}
      role="region"
      aria-roledescription="carousel"
      aria-label={alt}
      style={{ '--photo-height': height, borderRadius, ...style }}
    >
      <img
        src={images[current]}
        alt={`${alt}, image ${current + 1} of ${images.length}`}
        className="trust-photo-carousel-image"
        style={{ objectFit }}
        onError={event => { event.currentTarget.style.visibility = 'hidden'; }}
      />
      {images.length > 1 && <>
        <button type="button" className="photo-click-zone photo-click-zone-left" onClick={() => move(-1)} aria-label="Previous photo">
          <span className="photo-click-cue"><ChevronLeft size={18} /></span>
        </button>
        <button type="button" className="photo-click-zone photo-click-zone-right" onClick={() => move(1)} aria-label="Next photo">
          <span className="photo-click-cue"><ChevronRight size={18} /></span>
        </button>
        {showDots && <div className="photo-carousel-dots" aria-label="Choose photo">
          {images.map((_, index) => <button
            key={index}
            type="button"
            onClick={() => setCurrent(index)}
            aria-label={`Show photo ${index + 1}`}
            aria-current={index === current ? 'true' : undefined}
            className={index === current ? 'active' : ''}
          />)}
        </div>}
      </>}
    </div>
  );
};
