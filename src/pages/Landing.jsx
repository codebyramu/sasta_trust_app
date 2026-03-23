import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Phone, MapPin, ArrowRight, Volume2, VolumeX, Landmark, Users, Home, UtensilsCrossed, Mountain, Flower2, HeartHandshake, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

const fadeIn = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
};

const videoFilesMap = import.meta.glob('/public/videos_to_play/*.{mp4,webm,mov}', { eager: true, query: '?url', import: 'default' });
// Removed local videoList usage as it's global now

// Removed local sevaItems list to consolidate on Donations page


export const Landing = () => {
  const [splashState, setSplashState] = useState(() => {
    return sessionStorage.getItem('sasta_splash_seen') ? 2 : 0;
  });
  const [mousePos, setMousePos] = useState({ x: -1000, y: -1000 });
  // Removed local video state

  useEffect(() => {
    if (splashState === 2) return;
    const t1 = setTimeout(() => setSplashState(1), 2200);
    const t2 = setTimeout(() => {
      setSplashState(2);
      sessionStorage.setItem('sasta_splash_seen', 'true');
    }, 4000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [splashState]);

  const handlePointerMove = (e) => {
    setMousePos({ x: e.clientX, y: e.clientY });
  };
  // Removed toggleMute and handleVideoEnd

  return (
    <div onPointerMove={handlePointerMove}>

      {/* Video BG is now handled globally in BackgroundManager.jsx */}


      {/* === SPLASH OVERLAY === */}
      <AnimatePresence>
        {splashState < 2 && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.8 } }}
            style={{ position: 'fixed', inset: 0, zIndex: 9999, background: '#ffffff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
          >
            {splashState === 0 && (
              <motion.div
                initial={{ scale: 0.2, opacity: 0, rotate: -30, filter: 'blur(10px)' }}
                animate={{ scale: [1, 1.1, 1], opacity: 1, rotate: 0, filter: 'blur(0px)' }}
                transition={{ duration: 1.2, ease: 'backOut', times: [0, 0.6, 1] }}
                style={{ width: 150, height: 150, borderRadius: '50%', background: '#2E3192', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 40px rgba(46,49,146,0.6), 0 0 100px rgba(46,49,146,0.2)', overflow: 'hidden', border: '3px solid rgba(255,255,255,0.8)' }}
              >
                <img src="/sasta_logo.png" alt="Sasta Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.target.onerror = null; e.target.src = 'https://ui-avatars.com/api/?name=Sasta+Trust&background=2e3192&color=fff'; }} />
              </motion.div>
            )}

            {splashState === 1 && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                <motion.div
                  initial={{ scale: 1, opacity: 1 }}
                  animate={{ scale: 0.8, y: -40, opacity: 0 }}
                  transition={{ duration: 0.6, ease: 'anticipate' }}
                  style={{ width: 100, height: 100, borderRadius: '50%', background: '#2E3192', overflow: 'hidden' }}
                >
                  <img src="/sasta_logo.png" alt="Sasta Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.target.onerror = null; e.target.src = 'https://ui-avatars.com/api/?name=Sasta+Trust&background=2e3192&color=fff'; }} />
                </motion.div>
                <motion.h1
                  initial={{ opacity: 0, y: 30, filter: 'blur(10px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  transition={{ duration: 0.8 }}
                  style={{ fontSize: '4rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginTop: '-2rem', background: 'linear-gradient(135deg, #2E3192, var(--accent-primary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
                >
                  SASTA TRUST
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  transition={{ delay: 0.3, duration: 1 }}
                  style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', borderTop: '2px solid rgba(46,49,146,0.2)', paddingTop: '0.5rem', marginTop: '0.5rem' }}
                >
                  A journey towards tradition
                </motion.p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* === HERO SECTION === */}
      <motion.div
        className="container"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: splashState === 2 ? 1 : 0, y: splashState === 2 ? 0 : 40 }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', maxWidth: '800px', margin: '0 auto', minHeight: '100vh', padding: '4rem 24px', position: 'relative', zIndex: 10 }}
      >
        <motion.div variants={fadeIn} initial="hidden" animate={splashState === 2 ? 'visible' : 'hidden'} style={{ marginBottom: '2rem' }}>
          <div style={{ width: 120, height: 120, borderRadius: '50%', background: '#2E3192', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '4px solid rgba(255,255,255,0.6)', boxShadow: '0 10px 30px rgba(46,49,146,0.3)', margin: '0 auto' }}>
            <img src="/sasta_logo.png" alt="Sasta Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.target.onerror = null; e.target.src = 'https://ui-avatars.com/api/?name=ST&background=2e3192&color=fff'; }} />
          </div>
        </motion.div>

        <motion.h1 variants={fadeIn} initial="hidden" animate={splashState === 2 ? 'visible' : 'hidden'}
          style={{ fontSize: 'clamp(3rem, 8vw, 5rem)', fontWeight: 800, letterSpacing: '-0.04em', background: 'linear-gradient(135deg, #2E3192, #5c6bc0)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '1rem', lineHeight: 1.1 }}
        >
          Sasta Trust
        </motion.h1>

        <motion.p variants={fadeIn} initial="hidden" animate={splashState === 2 ? 'visible' : 'hidden'}
          style={{ fontSize: '1.2rem', color: '#333', marginBottom: '3rem', maxWidth: '580px', lineHeight: 1.7, textShadow: '0 1px 3px rgba(255,255,255,0.8)', fontWeight: 500 }}
        >
          A spiritual journey celebrating Indian festivals, occasions, and heartfelt devotion — serving with simplicity & grace.
        </motion.p>

        <motion.div variants={fadeIn} initial="hidden" animate={splashState === 2 ? 'visible' : 'hidden'} style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/dashboard" className="btn btn-primary" style={{ padding: '1rem 2.5rem', fontSize: '1.05rem', borderRadius: '30px', boxShadow: '0 8px 20px rgba(46,49,146,0.4)' }}>
            Explore Festivals <ArrowRight size={18} />
          </Link>
          <Link to="/donate" className="btn btn-outline" style={{ padding: '1rem 2.5rem', fontSize: '1.05rem', borderRadius: '30px', background: 'white', boxShadow: '0 4px 15px rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Heart size={18} /> Support the Cause
          </Link>
        </motion.div>
      </motion.div>

      {/* === ABOUT + CONTACT SECTION (scrollable below hero) === */}
      <div style={{ position: 'relative', zIndex: 10, background: 'rgba(255,255,255,0.35)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', borderTop: '1px solid rgba(255,255,255,0.3)' }}>
        <div className="container" style={{ maxWidth: '900px', margin: '0 auto', padding: '5rem 24px' }}>

          {/* About headline */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            style={{ textAlign: 'center', marginBottom: '3.5rem' }}
          >
            <span style={{ display: 'inline-block', background: 'var(--accent-light)', color: 'var(--accent-primary)', fontWeight: 700, fontSize: '0.85rem', padding: '0.4rem 1rem', borderRadius: '20px', letterSpacing: '0.08em', marginBottom: '1rem', textTransform: 'uppercase' }}>
              About Sasta Trust
            </span>
            <h2 style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.75rem', lineHeight: 1.2 }}>
              Anna Prasadam Seva<br />
              <span style={{ color: 'var(--accent-primary)' }}>14th Consecutive Year</span>
            </h2>
            <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', maxWidth: '650px', margin: '0 auto', lineHeight: 1.8 }}>
              Thousands of pilgrims are blessed with Anna Prasadam on the sacred trekking route near Azhudha River, Mundakayam Pambavalley Rd, Kerala. We serve with love and devotion every single year.
            </p>
          </motion.div>

          {/* Seva Grid removed - consolidated on Donations page */}


          {/* Spiritual Quote */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{ textAlign: 'center', padding: '2.5rem', background: 'linear-gradient(135deg, var(--accent-light), rgba(92,107,192,0.1))', borderRadius: '20px', marginBottom: '5rem', border: '1px solid rgba(46,49,146,0.12)' }}
          >
            <p style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-primary)', marginBottom: '0.5rem' }}>
              Swamy Sharanam Ayyappa!
            </p>
            <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', fontStyle: 'italic', fontWeight: 600, letterSpacing: '1px', marginBottom: '1rem' }}>
              SEVA IS WORSHIP — SERVICE IS TRADITION
            </p>
            <p style={{ fontSize: '0.95rem', color: 'var(--text-tertiary)', margin: 0 }}>
              With blessings of Lord Dharma Sasta, Sasta Trust continues its humble journey of devotion and service.
            </p>
          </motion.div>

          {/* Contact Us */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{ textAlign: 'center' }}
          >
            <h3 style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Contact Us</h3>
            <p style={{ color: 'var(--text-tertiary)', marginBottom: '2rem' }}>
              G-04, Sai Nilayam Apartments, Saptarishi Nagar, Pet Pujari Road, Hyderabad – 500 088, Telangana
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem', justifyContent: 'center' }}>
              <a href="mailto:sastatrust@gmail.com" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500, padding: '0.9rem 1.75rem', background: 'var(--bg-secondary)', borderRadius: '14px', textDecoration: 'none', border: '1px solid var(--bg-tertiary)', transition: 'all 0.2s' }}
                onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.08)'; }}
                onMouseOut={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
              >
                <Mail size={20} color="var(--accent-primary)" /> sastatrust@gmail.com
              </a>
              <a href="tel:+919391672398" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500, padding: '0.9rem 1.75rem', background: 'var(--bg-secondary)', borderRadius: '14px', textDecoration: 'none', border: '1px solid var(--bg-tertiary)', transition: 'all 0.2s' }}
                onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.08)'; }}
                onMouseOut={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
              >
                <Phone size={20} color="var(--accent-primary)" /> +91 93916 72398
              </a>
              <a href="https://maps.google.com/?q=Saptarishi+Nagar+Hyderabad" target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500, padding: '0.9rem 1.75rem', background: 'var(--bg-secondary)', borderRadius: '14px', textDecoration: 'none', border: '1px solid var(--bg-tertiary)', transition: 'all 0.2s' }}
                onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.08)'; }}
                onMouseOut={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
              >
                <MapPin size={20} color="var(--accent-primary)" /> Near Azhudha River, Kerala
              </a>
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
};
