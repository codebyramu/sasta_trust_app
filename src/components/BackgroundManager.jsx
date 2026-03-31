import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Volume2, VolumeX } from 'lucide-react';

const videoFilesMap = import.meta.glob('/public/videos_to_play/*.{mp4,webm,mov}', { eager: true, query: '?url', import: 'default' });
const videoList = Object.values(videoFilesMap);

const musicFilesMap = import.meta.glob('/public/music_to_play/*.{mp3,wav,ogg,m4a}', { eager: true, query: '?url', import: 'default' });
const musicList = Object.values(musicFilesMap);

export const BackgroundManager = () => {
  const location = useLocation();
  const [currentVideoIdx, setCurrentVideoIdx] = useState(0);
  const [currentMusicIdx, setCurrentMusicIdx] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const videoRef = useRef(null);
  const audioRef = useRef(null);

  useEffect(() => {
    const handleFirstInteraction = () => {
      if (videoRef.current && !isMuted) {
        videoRef.current.play().catch(() => {});
      }
      if (audioRef.current && !isMuted) {
        audioRef.current.play().catch(() => {});
      }
      document.removeEventListener('click', handleFirstInteraction);
    };
    document.addEventListener('click', handleFirstInteraction);
    return () => document.removeEventListener('click', handleFirstInteraction);
  }, [isMuted]);

  const isLandingPage = location.pathname === '/';

  const handleVideoEnd = () => {
    if (videoList.length > 0) {
      setCurrentVideoIdx((prev) => (prev + 1) % videoList.length);
    }
  };

  const handleMusicEnd = () => {
    if (musicList.length > 0) {
      setCurrentMusicIdx((prev) => (prev + 1) % musicList.length);
    }
  };

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);

    if (videoRef.current) {
      videoRef.current.muted = nextMuted;
      if (!nextMuted) {
        videoRef.current.volume = 1.0;
        videoRef.current.play().catch(() => {});
      }
    }

    if (audioRef.current) {
      audioRef.current.muted = nextMuted;
      if (!nextMuted) {
        audioRef.current.volume = 0.5; // Always keep music at 50%
        audioRef.current.play().catch(() => {});
      }
    }
  };

  if (videoList.length === 0) return null;

  return (
    <>
      <div
        style={{
          position: 'fixed', inset: 0, zIndex: -2, overflow: 'hidden',
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
          style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.4) saturate(0.8)' }}
          playsInline
        />
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(180deg, rgba(26,10,46,0.5) 0%, rgba(13,10,26,0.7) 100%)'
        }} />
      </div>

      {/* Global Background Music Loop */}
      {musicList.length > 0 && (
        <audio
          ref={audioRef}
          key={musicList[currentMusicIdx]}
          src={musicList[currentMusicIdx]}
          autoPlay
          muted={isMuted}
          onLoadedData={(e) => { e.target.volume = 0.5; e.target.muted = isMuted; if (!isMuted) e.target.play().catch(()=>{}); }}
          onEnded={handleMusicEnd}
        />
      )}

      {/* Mute button — sacred styled */}
      <button
        onClick={toggleMute}
        style={{
          position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 1000,
          borderRadius: '50%', width: '50px', height: '50px', padding: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'linear-gradient(135deg, rgba(26,10,46,0.9), rgba(45,27,105,0.9))',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3), 0 0 15px rgba(212,175,55,0.15)',
          border: '2px solid rgba(212,175,55,0.3)',
          cursor: 'pointer', transition: 'all 0.3s',
          color: '#D4AF37'
        }}
        title={isMuted ? 'Unmute' : 'Mute'}
        onMouseOver={e => { e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.3), 0 0 25px rgba(212,175,55,0.3)'; e.currentTarget.style.transform = 'scale(1.1)'; }}
        onMouseOut={e => { e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.3), 0 0 15px rgba(212,175,55,0.15)'; e.currentTarget.style.transform = 'scale(1)'; }}
      >
        {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
      </button>
    </>
  );
};
