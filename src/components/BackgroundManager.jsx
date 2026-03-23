import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Volume2, VolumeX } from 'lucide-react';

// Load all videos from public folder
const videoFilesMap = import.meta.glob('/public/videos_to_play/*.{mp4,webm,mov}', { eager: true, query: '?url', import: 'default' });
const videoList = Object.values(videoFilesMap);

export const BackgroundManager = () => {
  const location = useLocation();
  const [currentVideoIdx, setCurrentVideoIdx] = useState(0);
  const [isMuted, setIsMuted] = useState(false); // Default to ON as requested
  const videoRef = useRef(null);

  useEffect(() => {
    const handleFirstInteraction = () => {
      if (videoRef.current && !isMuted) {
          videoRef.current.play().catch(() => {});
      }
      document.removeEventListener('click', handleFirstInteraction);
    };
    document.addEventListener('click', handleFirstInteraction);
    return () => document.removeEventListener('click', handleFirstInteraction);
  }, [isMuted]);

  // The video is VISIBLE only on the landing page (root path /)
  const isLandingPage = location.pathname === '/';

  const handleVideoEnd = () => {
    if (videoList.length > 0) {
      setCurrentVideoIdx((prev) => (prev + 1) % videoList.length);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
      if (!videoRef.current.muted) {
        videoRef.current.volume = 1.0;
        videoRef.current.play().catch(() => {});
      }
    }
  };

  if (videoList.length === 0) return null;

  return (
    <>
      <div 
        style={{ 
          position: 'fixed', inset: 0, zIndex: -2, overflow: 'hidden',
          // We don't unmount the video, just hide it so audio keeps playing
          visibility: isLandingPage ? 'visible' : 'hidden',
          opacity: isLandingPage ? 1 : 0,
          transition: 'opacity 0.5s ease',
          pointerEvents: 'none'
        }}
      >
        <video
          ref={videoRef}
          key={videoList[currentVideoIdx]}
          src={videoList[currentVideoIdx]}
          autoPlay
          muted={isMuted}
          onLoadedData={(e) => { e.target.muted = isMuted; if (!isMuted) e.target.volume = 1.0; }}
          onEnded={handleVideoEnd}
          style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.7)' }}
          playsInline
        />
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.45)' }} />
      </div>

      {/* Mute button stays visible globally so user can control background audio on any page */}
      <button
        onClick={toggleMute}
        className="btn btn-outline"
        style={{ 
            position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 1000, 
            borderRadius: '50%', width: '50px', height: '50px', padding: 0, 
            display: 'flex', alignItems: 'center', justifyContent: 'center', 
            background: 'white', boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
            border: '2px solid var(--accent-primary)',
            opacity: 0.8
        }}
        title={isMuted ? 'Unmute' : 'Mute'}
      >
        {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
      </button>
    </>
  );
};
