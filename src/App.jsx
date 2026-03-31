import React, { useEffect, useRef } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { Navigation } from './components/Navigation';
import { Landing } from './pages/Landing';
import { Dashboard } from './pages/Dashboard';
import { OccasionDetails } from './pages/OccasionDetails';
import { AddOccasion } from './pages/Admin/AddOccasion';
import { SendReceipt } from './pages/Admin/SendReceipt';
import { UserReceipts } from './pages/UserReceipts';
import { ProtectedRoute } from './components/ProtectedRoute';
import { useAuth } from './context/AuthContext';
import { BackgroundManager } from './components/BackgroundManager';
import { motion, AnimatePresence } from 'framer-motion';

// Cursor particle effect
const ParticleTrail = () => {
  const containerRef = useRef(null);

  useEffect(() => {
    const handleMove = (e) => {
      if (!containerRef.current) return;
      const particle = document.createElement('div');
      particle.className = 'cursor-particle';
      const colors = ['#D4AF37', '#F4D03F', '#8B5CF6', '#6B3FA0'];
      particle.style.background = colors[Math.floor(Math.random() * colors.length)];
      particle.style.left = `${e.clientX + (Math.random() - 0.5) * 20}px`;
      particle.style.top = `${e.clientY + (Math.random() - 0.5) * 20}px`;
      particle.style.width = `${3 + Math.random() * 4}px`;
      particle.style.height = particle.style.width;
      containerRef.current.appendChild(particle);
      setTimeout(() => particle.remove(), 1000);
    };

    let throttle = false;
    const throttledMove = (e) => {
      if (throttle) return;
      throttle = true;
      setTimeout(() => { throttle = false; }, 50);
      handleMove(e);
    };

    window.addEventListener('pointermove', throttledMove);
    return () => window.removeEventListener('pointermove', throttledMove);
  }, []);

  return <div ref={containerRef} style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9998 }} />;
};

// Flower click explosion effect
const FlowerClickEffect = () => {
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (!containerRef.current) return;
      const numFlowers = Math.floor(Math.random() * 8) + 12; // 12 to 20 flowers

      for (let i = 0; i < numFlowers; i++) {
        const flower = document.createElement('img');
        flower.src = '/flower/collage.jpg'; // Using the user's specific flower image
        flower.className = 'falling-flower';
        // Add a fallback in case image is missing or broken
        flower.onerror = () => { flower.style.display = 'none'; };
        
        // Start near the click point
        const offsetX = (Math.random() - 0.5) * 40;
        const offsetY = (Math.random() - 0.5) * 40;
        
        flower.style.left = `${e.clientX + offsetX}px`;
        flower.style.top = `${e.clientY + offsetY}px`;
        
        // Randomize physics constraints (Lower gravity / slower fall)
        const duration = 2.5 + Math.random() * 2.5; // 2.5 to 5 seconds
        const flyX = (Math.random() - 0.5) * 200; // gentle side spread
        const flyY = 60 + Math.random() * 100; // gentle fall down distance
        const rotate = (Math.random() - 0.5) * 200; // slower rotation
        const scale = 0.5 + Math.random() * 0.7; // size
        
        flower.style.setProperty('--fly-x', `${flyX}px`);
        flower.style.setProperty('--fly-y', `${flyY}px`);
        flower.style.setProperty('--rotate', `${rotate}deg`);
        flower.style.setProperty('--scale', scale);
        flower.style.animationDuration = `${duration}s`;
        
        containerRef.current.appendChild(flower);
        
        // Remove after animation finishes
        setTimeout(() => flower.remove(), duration * 1000);
      }
    };

    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  return <div ref={containerRef} style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9999, overflow: 'hidden' }} />;
};

// Page transition wrapper
const PageTransition = ({ children }) => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

function App() {
  const { loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
        height: '100vh', background: 'linear-gradient(135deg, #1A0A2E, #2D1B69)',
        gap: '1.5rem'
      }}>
        <div className="loader" style={{ width: 56, height: 56 }} />
        <p style={{
          fontFamily: 'Cinzel, serif', color: '#D4AF37', fontSize: '0.85rem',
          letterSpacing: '0.15em', textTransform: 'uppercase', opacity: 0.7
        }}>Loading Sacred Space...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navigation />
      <BackgroundManager />
      <ParticleTrail />
      <FlowerClickEffect />

      <main style={{ flex: 1, position: 'relative' }}>
        <PageTransition>
          <Routes location={location}>
            <Route path="/" element={<Landing />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/occasion/:id" element={<OccasionDetails />} />
            <Route path="/donate" element={<UserReceipts />} />
            <Route path="/donations" element={<UserReceipts />} />
            <Route path="/admin" element={<ProtectedRoute requireOwner={true}><AddOccasion /></ProtectedRoute>} />
            <Route path="/admin/receipt" element={<ProtectedRoute requireOwner={true}><SendReceipt /></ProtectedRoute>} />
          </Routes>
        </PageTransition>
      </main>

      {/* SACRED FOOTER */}
      <footer style={{
        background: 'linear-gradient(135deg, #0D0A1A 0%, #1A0F2E 50%, #0D0A1A 100%)',
        padding: '3.5rem 2rem 2rem', textAlign: 'center',
        borderTop: '1px solid rgba(212, 175, 55, 0.15)',
        position: 'relative', overflow: 'hidden'
      }}>
        {/* Decorative top border */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
          background: 'linear-gradient(90deg, transparent, #D4AF37, #F4D03F, #D4AF37, transparent)'
        }} />

        {/* Glowing logo */}
        <div style={{
          width: 50, height: 50, borderRadius: '50%', margin: '0 auto 1.25rem',
          background: 'linear-gradient(135deg, #D4AF37, #F4D03F)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 30px rgba(212,175,55,0.3), 0 0 60px rgba(212,175,55,0.1)',
          overflow: 'hidden'
        }}>
          <img src="/sasta_logo.png" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={(e) => { e.target.onerror = null; e.target.src = 'https://ui-avatars.com/api/?name=ST&background=D4AF37&color=1A0A2E'; }} />
        </div>

        <p style={{
          fontFamily: 'Cinzel, serif', fontSize: '1.3rem', fontWeight: 700,
          background: 'linear-gradient(135deg, #D4AF37, #F4D03F, #D4AF37)',
          backgroundSize: '200% auto', animation: 'shimmer 4s linear infinite',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          letterSpacing: '0.08em', marginBottom: '0.75rem'
        }}>
          ✦ Swamy Sharanam Ayyappa! ✦
        </p>

        <p style={{
          fontFamily: 'Crimson Pro, serif', fontStyle: 'italic',
          fontSize: '0.95rem', color: 'rgba(212,175,55,0.5)',
          marginBottom: '1.5rem', letterSpacing: '0.03em'
        }}>
          Seva is Worship · Service is Tradition
        </p>

        <div style={{
          height: 1, maxWidth: 200, margin: '0 auto 1.5rem',
          background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.3), transparent)'
        }} />

        <p style={{
          fontFamily: 'DM Sans, sans-serif', fontSize: '0.78rem',
          color: 'rgba(255,255,255,0.25)', margin: 0, letterSpacing: '0.04em'
        }}>
          © {new Date().getFullYear()} Sasta Trust · G-04, Sai Nilayam Apartments, Saptarishi Nagar, Hyderabad – 500 088
        </p>
      </footer>
    </div>
  );
}

export default App;
