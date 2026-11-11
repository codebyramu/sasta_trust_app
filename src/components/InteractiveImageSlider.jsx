import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

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
        className="trust-photo-carousel"
        role="region"
        aria-roledescription="carousel"
        aria-label="Sasta Trust photographs"
        style={{ '--photo-height': height, borderRadius }}
      >
        <img
          src={images[current]}
          alt={`${alt}, image ${current + 1} of ${images.length}`}
          className="trust-photo-carousel-image"
        />
        {images.length > 1 && <>
          <button type="button" className="photo-click-zone photo-click-zone-left" onClick={showPrevious} aria-label="Previous photo">
            <span className="photo-click-cue"><ChevronLeft size={20} /></span>
          </button>
          <button type="button" className="photo-click-zone photo-click-zone-right" onClick={showNext} aria-label="Next photo">
            <span className="photo-click-cue"><ChevronRight size={20} /></span>
          </button>
          <div className="photo-carousel-dots" aria-label="Choose photo">
            {images.map((_, index) => <button
              key={index}
              type="button"
              onClick={() => setCurrent(index)}
              aria-label={`Show photo ${index + 1}`}
              aria-current={index === current ? 'true' : undefined}
              className={index === current ? 'active' : ''}
            />)}
          </div>
        </>}
      </div>
      {caption && <figcaption style={{ marginTop: 9, color: '#66717e', fontSize: '.78rem' }}>{caption}</figcaption>}
    </figure>
  );
};
