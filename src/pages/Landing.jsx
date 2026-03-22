
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Phone, MapPin, ArrowRight, Volume2, VolumeX } from 'lucide-react';
import { Link } from 'react-router-dom';

const fadeIn = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
};

// Vite feature: eagerly load all video URLs from the public folder
const videoFilesMap = import.meta.glob('/public/videos_to_play/*.{mp4,webm,mov}', { eager: true, query: '?url', import: 'default' });
const videoList = Object.values(videoFilesMap);

export const Landing = () => {
  const [splashState, setSplashState] = useState(() => {
    return sessionStorage.getItem('sasta_splash_seen') ? 2 : 0;
  });
  const [mousePos, setMousePos] = useState({ x: -1000, y: -1000 });
  const [currentVideoIdx, setCurrentVideoIdx] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => {
    if (splashState === 2) return;
    const t1 = setTimeout(() => setSplashState(1), 2200);
    const t2 = setTimeout(() => {
      setSplashState(2);
      sessionStorage.setItem('sasta_splash_seen', 'true');
    }, 4000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [splashState]);

  // Handle changing to next video when current ends
  const handleVideoEnd = () => {
    if (videoList.length > 0) {
      setCurrentVideoIdx((prev) => (prev + 1) % videoList.length);
    }
  };

  const handlePointerMove = (e) => {
    setMousePos({ x: e.clientX, y: e.clientY });
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      if (!videoRef.current.muted) {
        videoRef.current.volume = 1.0;
        videoRef.current.play().catch(() => { });
      }
      setIsMuted(videoRef.current.muted);
    }
  };

  return (
    <div
      onPointerMove={handlePointerMove}
      style={{ position: 'relative', minHeight: 'calc(100vh - 70px)', overflow: 'hidden' }}
    >
      {/* Background Videos Layer */}
      {videoList.length > 0 && (
        <div style={{ position: 'absolute', inset: 0, zIndex: -2, overflow: 'hidden' }}>
          <video
            ref={videoRef}
            key={videoList[currentVideoIdx]}
            src={videoList[currentVideoIdx]}
            autoPlay
            muted={isMuted}
            onLoadedData={(e) => { e.target.muted = isMuted; if (!isMuted) e.target.volume = 1.0; }}
            onEnded={handleVideoEnd}
            style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 1 }}
            playsInline
          />
          {/* White overlay to make text readable but allow video to be bright */}
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(255, 255, 255, 0.55)' }} />
        </div>
      )}

      {/* Reactive Background Particles / Cursor Glow */}
      <div
        style={{
          position: 'absolute', inset: 0, zIndex: -1, pointerEvents: 'none',
          background: `radial-gradient(circle 400px at ${mousePos.x}px ${mousePos.y}px, rgba(46, 49, 146, 0.1), transparent 100%)`,
          transition: 'background 0.1s ease'
        }}
      />

      {/* Splash Animation Overlay */}
      <AnimatePresence>
        {splashState < 2 && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } }}
            style={{
              position: 'fixed', inset: 0, zIndex: 9999,
              background: '#ffffff', display: 'flex',
              flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
            }}
          >
            {splashState === 0 && (
              <motion.div
                initial={{ scale: 0.2, opacity: 0, rotate: -30, filter: 'blur(10px)' }}
                animate={{ scale: [1, 1.1, 1], opacity: 1, rotate: 0, filter: 'blur(0px)' }}
                transition={{ duration: 1.2, ease: "backOut", times: [0, 0.6, 1] }}
                style={{ width: 150, height: 150, borderRadius: '50%', background: '#2E3192', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 40px rgba(46,49,146,0.6), 0 0 100px rgba(46,49,146,0.2)', overflow: 'hidden', border: '3px solid rgba(255,255,255,0.8)' }}
              >
                <img src="/sasta_logo.png" alt="Sasta Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.target.onerror = null; e.target.src = "https://ui-avatars.com/api/?name=Sasta+Trust&background=2e3192&color=fff"; }} />
              </motion.div>
            )}

            {splashState === 1 && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                <motion.div
                  initial={{ scale: 1, opacity: 1 }}
                  animate={{ scale: 0.8, y: -40, opacity: 0 }}
                  transition={{ duration: 0.6, ease: "anticipate" }}
                  style={{ width: 100, height: 100, borderRadius: '50%', background: '#2E3192', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}
                >
                  <img src="/sasta_logo.png" alt="Sasta Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.target.onerror = null; e.target.src = "https://ui-avatars.com/api/?name=Sasta+Trust&background=2e3192&color=fff"; }} />
                </motion.div>

                <motion.h1
                  initial={{ opacity: 0, y: 30, filter: 'blur(10px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, scale: 1.1 }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                  style={{ fontSize: '4rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginTop: '-2rem', background: 'linear-gradient(135deg, #2E3192, var(--accent-primary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
                >
                  SASTA TRUST
                </motion.h1>
                <motion.div
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: "100%", opacity: 1 }}
                  transition={{ delay: 0.3, duration: 1, ease: "easeOut" }}
                  style={{ overflow: 'hidden', whiteSpace: 'nowrap', borderTop: '2px solid rgba(46, 49, 146, 0.2)', paddingTop: '0.5rem', marginTop: '0.5rem' }}
                >
                  <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                    A journey towards tradition
                  </p>
                </motion.div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Home Page */}
      <motion.div
        className="container"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: splashState === 2 ? 1 : 0, y: splashState === 2 ? 0 : 40 }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', maxWidth: '800px', margin: '4rem auto', minHeight: '50vh', position: 'relative', zIndex: 10 }}
      >
        {videoList.length > 0 && splashState === 2 && (
          <button
            onClick={toggleMute}
            className="btn btn-outline"
            style={{ position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 50, borderRadius: '50%', width: '50px', height: '50px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'white' }}
            title={isMuted ? "Unmute Video Background" : "Mute Server Background"}
          >
            {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </button>
        )}

        <motion.div variants={fadeIn} initial="hidden" animate={splashState === 2 ? "visible" : "hidden"} style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: 120, height: 120, borderRadius: '50%', background: '#2E3192', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '4px solid var(--accent-light)', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
            <img src="/sasta_logo.png" alt="Sasta Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.target.onerror = null; e.target.src = "https://ui-avatars.com/api/?name=ST&background=2e3192&color=fff"; }} />
          </div>
        </motion.div>

        <motion.h1
          variants={fadeIn}
          initial="hidden" animate={splashState === 2 ? "visible" : "hidden"}
          style={{
            fontSize: '4.5rem',
            fontWeight: 800,
            letterSpacing: '-0.04em',
            background: 'linear-gradient(135deg, #2E3192, var(--accent-primary))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '1rem',
            lineHeight: 1.1
          }}
        >
          Sasta Trust
        </motion.h1>

        <motion.p variants={fadeIn} initial="hidden" animate={splashState === 2 ? "visible" : "hidden"} style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', marginBottom: '3rem', maxWidth: '600px', margin: '0 auto 3rem auto', lineHeight: 1.6 }}>
          A spiritual journey managing and celebrating Indian festivals, occasions, and heartfelt donation services with simplicity, grace, and devotion.
        </motion.p>

        <motion.div variants={fadeIn} initial="hidden" animate={splashState === 2 ? "visible" : "hidden"} style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginBottom: '4rem' }}>
          <Link to="/dashboard" className="btn btn-primary" style={{ padding: '1rem 2.5rem', fontSize: '1.1rem', borderRadius: '30px', boxShadow: '0 8px 20px rgba(0, 0, 0, 0.68)' }}>
            Explore Festivals <ArrowRight size={20} />
          </Link>
        </motion.div>

        <motion.div variants={fadeIn} initial="hidden" animate={splashState === 2 ? "visible" : "hidden"} className="card" style={{ background: 'rgba(255, 255, 255, 0.9)', width: '100%', marginBottom: '4rem', backdropFilter: 'blur(10px)', boxShadow: '0 20px 40px rgba(0,0,0,0.05)', textAlign: 'left', padding: '3rem 2rem' }}>
           <h2 style={{ fontSize: '2.5rem', color: 'var(--accent-primary)', marginBottom: '0.5rem', textAlign: 'center' }}>About Sasta Trust - Hyd</h2>
           <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '1.2rem', marginBottom: '2rem' }}>Anna Prasadam Seva — 14th Consecutive Year</p>
           
           <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: '2rem', textAlign: 'center' }}>
             Serving Devotees with Love & Tradition. Thousands of pilgrims are blessed with Anna Prasadam on the sacred trekking route near Azhudha River, Mundakayam Pambavalley Rd, Anakkallu, Koruthodu, Kerala - 686510.
           </p>

           <h3 style={{ fontSize: '1.5rem', color: 'var(--text-primary)', marginBottom: '1.5rem', borderBottom: '2px solid var(--bg-tertiary)', paddingBottom: '0.5rem', textAlign: 'center' }}>Key Seva Activities</h3>
           
           <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
             <div style={{ padding: '1.5rem', background: 'var(--bg-secondary)', borderRadius: '12px' }}>
               <h4 style={{ color: 'var(--accent-primary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem' }}>🏛️ Temple Restoration</h4>
               <p style={{ color: 'var(--text-tertiary)', fontSize: '0.95rem', margin: 0, lineHeight: 1.5 }}>Preserving and revitalizing heritage temples for future generations.</p>
             </div>
             <div style={{ padding: '1.5rem', background: 'var(--bg-secondary)', borderRadius: '12px' }}>
               <h4 style={{ color: 'var(--accent-primary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem' }}>🙏 Dharma-Sevaks</h4>
               <p style={{ color: 'var(--text-tertiary)', fontSize: '0.95rem', margin: 0, lineHeight: 1.5 }}>Monthly remunerations supporting those who serve the Lord selflessly.</p>
             </div>
             <div style={{ padding: '1.5rem', background: 'var(--bg-secondary)', borderRadius: '12px' }}>
               <h4 style={{ color: 'var(--accent-primary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem' }}>👨‍👩‍👧‍👦 Family Support</h4>
               <p style={{ color: 'var(--text-tertiary)', fontSize: '0.95rem', margin: 0, lineHeight: 1.5 }}>Extending a helping hand to needy families in financial hardship.</p>
             </div>
             <div style={{ padding: '1.5rem', background: 'var(--bg-secondary)', borderRadius: '12px' }}>
               <h4 style={{ color: 'var(--accent-primary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem' }}>🍚 Anna Prasadam</h4>
               <p style={{ color: 'var(--text-tertiary)', fontSize: '0.95rem', margin: 0, lineHeight: 1.5 }}>Serving thousands of devotees near Azhudha River every single year.</p>
             </div>
             <div style={{ padding: '1.5rem', background: 'var(--bg-secondary)', borderRadius: '12px' }}>
               <h4 style={{ color: 'var(--accent-primary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem' }}>⛰️ Sabarimala Pilgrims</h4>
               <p style={{ color: 'var(--text-tertiary)', fontSize: '0.95rem', margin: 0, lineHeight: 1.5 }}>Ensuring no devotee is deprived of darshan due to financial constraints.</p>
             </div>
             <div style={{ padding: '1.5rem', background: 'var(--bg-secondary)', borderRadius: '12px' }}>
               <h4 style={{ color: 'var(--accent-primary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem' }}>🌸 Kanyadanam</h4>
               <p style={{ color: 'var(--text-tertiary)', fontSize: '0.95rem', margin: 0, lineHeight: 1.5 }}>Supporting daughters of poor Vedic partitioners in lifelong dedication.</p>
             </div>
             <div style={{ padding: '1.5rem', background: 'var(--bg-secondary)', borderRadius: '12px', gridColumn: '1 / -1' }}>
               <h4 style={{ color: 'var(--accent-primary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem' }}>👴 Care for the Elderly</h4>
               <p style={{ color: 'var(--text-tertiary)', fontSize: '0.95rem', margin: 0, lineHeight: 1.5 }}>Guided by empathy, dedicating ourselves to the well-being of our community's most experienced members.</p>
             </div>
           </div>

           <div style={{ marginTop: '3rem', textAlign: 'center', padding: '2rem', background: 'var(--accent-light)', borderRadius: '12px', border: '1px solid rgba(46, 49, 146, 0.1)' }}>
             <p style={{ color: 'var(--accent-primary)', fontWeight: 800, fontSize: '1.3rem', marginBottom: '0.75rem' }}>Swamy Sharanam Ayyappa! With Gratitude & Blessings</p>
             <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic', fontWeight: 600, letterSpacing: '1px' }}>SEVA IS WORSHIP — SERVICE IS TRADITION</p>
             <p style={{ color: 'var(--text-tertiary)', fontSize: '0.9rem', marginTop: '1rem' }}>With blessings of Lord Dharma Sasta, Sasta Trust continues its humble journey of devotion and service.</p>
           </div>
        </motion.div>

        <motion.div variants={fadeIn} initial="hidden" animate={splashState === 2 ? "visible" : "hidden"} className="card" style={{ background: 'rgba(255, 255, 255, 0.8)', border: '1px solid rgba(46, 49, 146, 0.1)', width: '100%', backdropFilter: 'blur(10px)', boxShadow: '0 20px 40px rgba(0,0,0,0.05)' }}>
          <h3 style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '1.5rem', color: 'var(--text-primary)' }}>Contact Us</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', justifyContent: 'center' }}>
            <a href="mailto:sastatrust@gmail.com" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500, padding: '0.75rem 1.5rem', background: 'var(--bg-secondary)', borderRadius: '12px', transition: 'all 0.2s' }} className="contact-link" onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
              <Mail size={20} color="var(--accent-primary)" /> sastatrust@gmail.com
            </a>
            <a href="tel:+919391672398" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500, padding: '0.75rem 1.5rem', background: 'var(--bg-secondary)', borderRadius: '12px', transition: 'all 0.2s' }} className="contact-link" onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
              <Phone size={20} color="var(--accent-primary)" /> +91 93916 72398
            </a>
            <a href="https://maps.google.com/?q=Near+Azhudha+River,Kerala" target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500, padding: '0.75rem 1.5rem', background: 'var(--bg-secondary)', borderRadius: '12px', transition: 'all 0.2s' }} className="contact-link" onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
              <MapPin size={20} color="var(--accent-primary)" /> Near Azhudha River, Kerala
            </a>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};
