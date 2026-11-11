import React, { useEffect, useState } from 'react';

export const InteractiveImageSlider = ({
  images = [],
  height = '520px',
  borderRadius = '8px',
  caption = null,
  alt = 'Sasta Trust community service',
}) => {
  const [current, setCurrent] = useState(0);
  const total = images.length;

  useEffect(() => {
    if (total < 2) return undefined;
    const interval = window.setInterval(() => {
      setCurrent(index => (index + 1) % total);
    }, 3000);
    return () => window.clearInterval(interval);
  }, [total]);

  if (!total) return null;

  const handleImageClick = (event) => {
    if (total < 2) return;
    const { left, width } = event.currentTarget.getBoundingClientRect();
    const clickedLeftSide = event.clientX - left < width / 2;
    setCurrent(index => (index + (clickedLeftSide ? -1 : 1) + total) % total);
  };

  const handleKeyDown = (event) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    setCurrent(index => (index + (event.key === 'ArrowLeft' ? -1 : 1) + total) % total);
  };

  return (
    <figure style={{ margin: 0 }}>
      <div
        className="trust-photo-carousel"
        role="group"
        aria-label={`${alt}. Click the left half for the previous photo, or the right half for the next photo.`}
        tabIndex={0}
        onClick={handleImageClick}
        onKeyDown={handleKeyDown}
        style={{ '--photo-height': height, borderRadius }}
      >
        <img
          key={current}
          src={images[current]}
          alt={`${alt}, image ${current + 1} of ${total}`}
          className="trust-photo-carousel-image trust-photo-fade"
        />
      </div>
      {caption && <figcaption style={{ marginTop: 9, color: '#66717e', fontSize: '.78rem' }}>{caption}</figcaption>}
    </figure>
  );
};
