import React, { useCallback, useEffect, useRef, useState } from 'react';

const SLIDE_INTERVAL_MS = 6000;
const SLIDE_DURATION_MS = 1500;

export const InteractiveImageSlider = ({
  images = [],
  height = '520px',
  borderRadius = '8px',
  caption = null,
  alt = 'Sasta Trust community service',
}) => {
  const [current, setCurrent] = useState(0);
  const [previous, setPrevious] = useState(null);
  const [direction, setDirection] = useState(1);
  const currentRef = useRef(0);
  const clearTransitionRef = useRef(null);
  const total = images.length;

  const changeTo = useCallback((nextIndex, moveDirection) => {
    if (total < 2 || nextIndex === currentRef.current) return;
    setPrevious(currentRef.current);
    setDirection(moveDirection);
    currentRef.current = nextIndex;
    setCurrent(nextIndex);
    window.clearTimeout(clearTransitionRef.current);
    clearTransitionRef.current = window.setTimeout(() => setPrevious(null), SLIDE_DURATION_MS);
  }, [total]);

  useEffect(() => {
    if (total < 2) return undefined;
    const interval = window.setInterval(() => {
      changeTo((currentRef.current + 1) % total, 1);
    }, SLIDE_INTERVAL_MS);
    return () => {
      window.clearInterval(interval);
      window.clearTimeout(clearTransitionRef.current);
    };
  }, [changeTo, total]);

  if (!total) return null;

  const handleImageClick = (event) => {
    if (total < 2) return;
    const { left, width } = event.currentTarget.getBoundingClientRect();
    const clickedLeftSide = event.clientX - left < width / 2;
    const next = (currentRef.current + (clickedLeftSide ? -1 : 1) + total) % total;
    changeTo(next, clickedLeftSide ? -1 : 1);
  };

  const handleKeyDown = (event) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    const moveDirection = event.key === 'ArrowLeft' ? -1 : 1;
    changeTo((currentRef.current + moveDirection + total) % total, moveDirection);
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
        {previous !== null && <img
          key={`previous-${previous}`}
          src={images[previous]}
          alt=""
          aria-hidden="true"
          className={`trust-photo-carousel-image trust-photo-slide-old ${direction > 0 ? 'slide-next' : 'slide-previous'}`}
        />}
        <img
          key={`current-${current}`}
          src={images[current]}
          alt={`${alt}, image ${current + 1} of ${total}`}
          className={`trust-photo-carousel-image trust-photo-slide-current ${direction > 0 ? 'slide-next' : 'slide-previous'}`}
        />
      </div>
      {caption && <figcaption style={{ marginTop: 9, color: '#66717e', fontSize: '.78rem' }}>{caption}</figcaption>}
    </figure>
  );
};
