import React, { useState, useEffect, useRef, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, Environment, Center, ContactShadows, Html, Text3D, GradientTexture, Float, Hud, PerspectiveCamera } from '@react-three/drei';

// Module-level flags — persist across React re-renders and navigation
let sessionSplashSeen = false;

class GLBErrorCatcher extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError() { return { hasError: true }; }
  render() { return this.state.hasError ? this.props.fallback : this.props.children; }
}

// Slow continuous rotation temple model
const TempleModel = () => {
  const group = useRef();
  const gltf = useGLTF('/glb_view/temple.glb');
  useFrame((state, delta) => {
    if (group.current) {
      group.current.rotation.y += delta * 0.12; // very slow, majestic
    }
  });
  return (
    <group ref={group}>
      <Center>
        <primitive object={gltf.scene} scale={1.5} />
      </Center>
    </group>
  );
};

const PlaceholderTemple = () => {
  const group = useRef();
  useFrame((state, delta) => {
    if (group.current) {
      group.current.rotation.y += delta * 0.12;
    }
  });
  return (
    <group ref={group}>
      <Center>
        <mesh>
          <boxGeometry args={[3, 3, 3]} />
          <meshStandardMaterial color="#6B3FA0" wireframe />
        </mesh>
        <Html center position={[0, -2.5, 0]}>
          <div style={{ whiteSpace: 'nowrap', background: '#1A0A2E', color: '#D4AF37', padding: '8px 16px', borderRadius: '8px', border: '1px solid #D4AF37', fontWeight: 'bold', fontFamily: 'Cinzel, serif' }}>
            Add /glb_view/temple.glb
          </div>
        </Html>
      </Center>
    </group>
  );
};

// Floating lotus particle
const LotusParticle = ({ delay, x }) => (
  <motion.div
    initial={{ opacity: 0, y: 100, x: x, rotate: 0 }}
    animate={{ opacity: [0, 0.6, 0.3, 0], y: -200, rotate: 360 }}
    transition={{ duration: 8 + Math.random() * 4, delay, repeat: Infinity, ease: 'linear' }}
    style={{
      position: 'absolute', bottom: 0, left: `${20 + Math.random() * 60}%`,
      fontSize: '1.2rem', pointerEvents: 'none', zIndex: 5,
      filter: 'drop-shadow(0 0 6px rgba(212,175,55,0.4))'
    }}
  >
    ✦
  </motion.div>
);

// Sweeping light to create a slanting mirror-like reflection sweep left-to-right across the 3D text
const MovingShineLight = () => {
  const lightRef = useRef();
  useFrame(({ clock }) => {
    if (lightRef.current) {
      // Progress from 0 to 1 over 2.5 seconds, repeating
      const progress = (clock.getElapsedTime() / 2.5) % 1; 
      
      // Starts completely left (-8), moves to completely right (+8)
      lightRef.current.position.x = -8 + (progress * 16);
      
      // Slants downwards from top (+3) to bottom (-3)
      lightRef.current.position.y = 3 - (progress * 6);
    }
  });
  return <pointLight ref={lightRef} position={[-8, 3, 1.5]} intensity={40} distance={20} decay={1.5} color="#FFFFFF" />;
};

// Sasta Trust Text inside HUD layer
const FixedSastaText = () => {
  const [hovered, setHovered] = useState(false);
  const targetScale = hovered ? 1.05 : 1;
  const group = useRef();

  useFrame((state, delta) => {
    if (group.current) {
      group.current.scale.lerp({ x: targetScale, y: targetScale, z: targetScale }, delta * 8);
    }
  });

  useEffect(() => {
    document.body.style.cursor = hovered ? 'pointer' : 'auto';
    return () => { document.body.style.cursor = 'auto'; };
  }, [hovered]);

  return (
    <Center>
      {/* Continuously floating up and down */}
      <Float speed={3.5} rotationIntensity={0.05} floatIntensity={1.5}>
        <group ref={group}>
          <Text3D
            font="https://unpkg.com/three@0.77.0/examples/fonts/helvetiker_bold.typeface.json"
            size={1.2} height={0.3} curveSegments={12}
            bevelEnabled bevelThickness={0.06} bevelSize={0.04} bevelOffset={0} bevelSegments={5}
            onPointerOver={() => setHovered(true)}
            onPointerOut={() => setHovered(false)}
          >
            Sasta Trust
            {/* Front Face: Totally yellow only, mirror-like so the sweeping light reflects sharply */}
            <meshStandardMaterial attach="material-0" color="#FFEA00" roughness={0.05} metalness={0.95} emissive="#554400" emissiveIntensity={0.2} />
            {/* Sides/Bevel: Red shade completely */}
            <meshStandardMaterial attach="material-1" color="#FF0000" roughness={0.3} metalness={0.8} emissive="#AA0000" emissiveIntensity={0.5} />
          </Text3D>
        </group>
      </Float>
    </Center>
  );
};


export const Landing = () => {
  // If splash already seen this session, skip entirely (state starts at 2)
  const [splashState, setSplashState] = useState(() => sessionSplashSeen ? 2 : 0);

  useEffect(() => {
    if (sessionSplashSeen || splashState === 2) return;
    const t1 = setTimeout(() => setSplashState(1), 2200);
    const t2 = setTimeout(() => {
      setSplashState(2);
      sessionSplashSeen = true;
    }, 4500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [splashState]);

  return (
    <div>
      {/* SPLASH OVERLAY — only shown on very first visit */}
      <AnimatePresence>
        {splashState < 2 && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 1 } }}
            style={{
              position: 'fixed', inset: 0, zIndex: 9999,
              background: 'linear-gradient(135deg, #1A0A2E 0%, #2D1B69 50%, #1A0A2E 100%)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden'
            }}
          >
            {/* Decorative particles */}
            {[...Array(12)].map((_, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: [0, 0.5, 0], scale: [0, 1, 0] }}
                transition={{ duration: 3, delay: i * 0.3, repeat: Infinity }}
                style={{
                  position: 'absolute',
                  top: `${10 + Math.random() * 80}%`,
                  left: `${10 + Math.random() * 80}%`,
                  width: 4, height: 4, borderRadius: '50%',
                  background: '#D4AF37',
                  boxShadow: '0 0 10px rgba(212,175,55,0.6)'
                }}
              />
            ))}

            {splashState === 0 && (
              <motion.div
                initial={{ scale: 0.2, opacity: 0, rotate: -30, filter: 'blur(10px)' }}
                animate={{ scale: [1, 1.1, 1], opacity: 1, rotate: 0, filter: 'blur(0px)' }}
                transition={{ duration: 1.2, ease: 'backOut', times: [0, 0.6, 1] }}
                style={{
                  width: 130, height: 130, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #D4AF37, #F4D03F)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 0 60px rgba(212,175,55,0.5), 0 0 120px rgba(212,175,55,0.2)',
                  overflow: 'hidden', border: '3px solid rgba(255,255,255,0.3)'
                }}
              >
                <img src="/sasta_logo.png" alt="Sasta Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => { e.target.onerror = null; e.target.src = 'https://ui-avatars.com/api/?name=Sasta+Trust&background=D4AF37&color=1A0A2E'; }} />
              </motion.div>
            )}

            {splashState === 1 && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '0 1.5rem' }}>
                <motion.div
                  initial={{ scale: 1, opacity: 1 }}
                  animate={{ scale: 0.6, y: -40, opacity: 0 }}
                  transition={{ duration: 0.6, ease: 'anticipate' }}
                  style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg, #D4AF37, #F4D03F)', overflow: 'hidden' }}
                >
                  <img src="/sasta_logo.png" alt="Sasta Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => { e.target.onerror = null; e.target.src = 'https://ui-avatars.com/api/?name=Sasta+Trust&background=D4AF37&color=1A0A2E'; }} />
                </motion.div>

                <motion.h1
                  initial={{ opacity: 0, y: 30, filter: 'blur(10px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  transition={{ duration: 0.8 }}
                  style={{
                    fontFamily: 'Cinzel, serif', fontSize: 'clamp(2rem, 8vw, 4rem)', fontWeight: 900,
                    marginTop: '-1rem', letterSpacing: '0.08em',
                    background: 'linear-gradient(135deg, #D4AF37 0%, #F4D03F 40%, #D4AF37 60%, #FFF8E7 80%, #D4AF37 100%)',
                    backgroundSize: '200% auto',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                    animation: 'shimmer 3s linear infinite'
                  }}
                >
                  SASTA TRUST
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  transition={{ delay: 0.3, duration: 1.2 }}
                  style={{
                    fontFamily: 'Crimson Pro, serif', fontStyle: 'italic',
                    fontSize: 'clamp(0.9rem, 3vw, 1.2rem)', color: 'rgba(212,175,55,0.8)',
                    letterSpacing: '0.06em', whiteSpace: 'nowrap', overflow: 'hidden',
                    borderTop: '1px solid rgba(212,175,55,0.3)', paddingTop: '0.75rem', marginTop: '0.75rem'
                  }}
                >
                  A Journey Towards Spiritual Enlightenment
                </motion.p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ====== HERO SECTION with 3D ====== */}
      <motion.div
        initial={{ opacity: sessionSplashSeen ? 1 : 0 }}
        animate={{ opacity: splashState === 2 ? 1 : 0 }}
        transition={{ duration: sessionSplashSeen ? 0 : 1, delay: sessionSplashSeen ? 0 : 0.2 }}
        style={{
          position: 'relative', width: '100%', minHeight: '100vh',
          background: 'linear-gradient(180deg, #1A0A2E 0%, #2D1B69 30%, #1A0A2E 100%)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          zIndex: 10, overflow: 'hidden'
        }}
      >
        {/* Floating lotus particles */}
        {[...Array(6)].map((_, i) => (
          <LotusParticle key={i} delay={i * 1.5} x={Math.random() * 20 - 10} />
        ))}

        {/* Mandala bg glow */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          width: '80vmin', height: '80vmin', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(212,175,55,0.05) 0%, rgba(45,27,105,0.02) 50%, transparent 70%)',
          pointerEvents: 'none'
        }} />

        {/* 3D Canvas — temple model only */}
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
          <Suspense fallback={
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div className="loader" style={{ width: 60, height: 60 }} />
            </div>
          }>
            <Canvas camera={{ position: [0, 2, 8], fov: 45 }}>
              <ambientLight intensity={0.4} />
              <directionalLight position={[10, 10, 5]} intensity={1.2} color="#FFF8E7" />
              <pointLight position={[-5, 5, -5]} intensity={0.5} color="#D4AF37" />
              <Environment preset="sunset" />
              <GLBErrorCatcher fallback={<PlaceholderTemple />}>
                <TempleModel />
              </GLBErrorCatcher>
              
              <OrbitControls enableZoom={true} minDistance={3} maxDistance={15} enablePan={false} autoRotate={false} makeDefault />
              <ContactShadows position={[0, -2.5, 0]} opacity={0.4} scale={20} blur={2.5} far={4} color="#1A0A2E" />

              {/* FIXED HUD LAYER — Always in front, ignores background OrbitControls */}
              <Hud renderPriority={1}>
                <PerspectiveCamera makeDefault position={[0, 0, 8]} fov={45} />
                <ambientLight intensity={0.4} />
                <Environment preset="city" /> {/* Critical for mirror-like reflections on metal */}
                <directionalLight position={[10, 10, 10]} intensity={2} color="#FFF8E7" />
                <MovingShineLight /> {/* The sweeping "mirror shine" animation */}
                <FixedSastaText />
              </Hud>
            </Canvas>
          </Suspense>
        </div>

        {/* CTA Buttons */}
        <motion.div
          initial={{ scale: 0.9, opacity: sessionSplashSeen ? 1 : 0, y: sessionSplashSeen ? 0 : 50 }}
          animate={{ scale: splashState === 2 ? 1 : 0.9, opacity: splashState === 2 ? 1 : 0, y: splashState === 2 ? 0 : 50 }}
          transition={{ delay: sessionSplashSeen ? 0 : 1.5, duration: 0.8, type: 'spring' }}
          style={{
            position: 'absolute', bottom: 'clamp(4%, 6vh, 10%)',
            display: 'flex', gap: 'clamp(0.75rem, 2vw, 1.5rem)',
            justifyContent: 'center', flexWrap: 'wrap', zIndex: 12,
            background: 'rgba(26, 10, 46, 0.6)', padding: 'clamp(0.75rem, 2vw, 1.25rem) clamp(1rem, 3vw, 2.5rem)',
            borderRadius: '50px', backdropFilter: 'blur(20px)',
            border: '1px solid rgba(212,175,55,0.2)',
            boxShadow: '0 10px 40px rgba(0,0,0,0.3)'
          }}
        >
          <Link to="/dashboard" style={{
            padding: 'clamp(0.6rem, 1.5vw, 0.9rem) clamp(1rem, 3vw, 2rem)',
            fontSize: 'clamp(0.75rem, 2vw, 0.95rem)', borderRadius: '30px',
            background: 'linear-gradient(135deg, #D4AF37, #F4D03F)', color: '#1A0A2E',
            fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem',
            textDecoration: 'none', fontFamily: 'DM Sans, sans-serif',
            letterSpacing: '0.05em', textTransform: 'uppercase',
            boxShadow: '0 4px 20px rgba(212,175,55,0.4)',
            transition: 'all 0.3s ease'
          }}>
            Explore Festivals <ArrowRight size={18} />
          </Link>
          <Link to="/donate" style={{
            padding: 'clamp(0.6rem, 1.5vw, 0.9rem) clamp(1rem, 3vw, 2rem)',
            fontSize: 'clamp(0.75rem, 2vw, 0.95rem)', borderRadius: '30px',
            background: 'transparent', color: '#D4AF37',
            border: '2px solid rgba(212,175,55,0.5)',
            fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem',
            textDecoration: 'none', fontFamily: 'DM Sans, sans-serif',
            letterSpacing: '0.05em', textTransform: 'uppercase',
            transition: 'all 0.3s ease'
          }}>
            <Heart size={18} /> Support the Cause
          </Link>
        </motion.div>
      </motion.div>

      {/* ====== ABOUT + CONTACT SECTION ====== */}
      <div className="sacred-border" style={{ background: 'var(--bg-primary)' }}>
        <div className="container" style={{ maxWidth: 900, margin: '0 auto', padding: 'clamp(2.5rem, 5vw, 5rem) clamp(16px, 4vw, 24px)' }}>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'clamp(2rem, 4vw, 4rem)', alignItems: 'center', marginBottom: 'clamp(2.5rem, 5vw, 5rem)' }}
          >
            <div>
              <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.72rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--gold-primary)', fontWeight: 600, marginBottom: '0.75rem' }}>
                Est. — 14th Year of Seva
              </p>
              <h2 style={{ fontFamily: 'Cinzel, serif', fontSize: 'clamp(1.3rem, 3vw, 2rem)', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '0.03em', margin: '0 0 1.25rem', lineHeight: 1.3 }}>
                Anna Prasadam Seva
              </h2>
              <p style={{ fontFamily: 'Crimson Pro, serif', fontStyle: 'italic', fontSize: 'clamp(0.9rem, 2vw, 1.05rem)', color: 'var(--text-secondary)', lineHeight: 1.9, margin: 0 }}>
                Thousands of pilgrims are blessed with Anna Prasadam on the sacred trekking route near the Azhudha River, Mundakayam Pambavalley Road, Kerala. We serve with love and devotion every single year, without fail.
              </p>
            </div>
            <div style={{
              padding: 'clamp(1.5rem, 3vw, 2.5rem)', background: 'linear-gradient(135deg, var(--purple-dark), var(--purple-royal))',
              borderRadius: 'var(--radius-lg)', position: 'relative', overflow: 'hidden'
            }}>
              <div style={{
                position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
                width: 80, height: 4, background: 'linear-gradient(90deg, #D4AF37, #F4D03F)', borderRadius: '0 0 4px 4px'
              }} />
              <p style={{ fontFamily: 'Cinzel, serif', fontSize: 'clamp(1.1rem, 3vw, 1.5rem)', fontWeight: 700, color: '#D4AF37', margin: '0 0 0.75rem', lineHeight: 1.4, letterSpacing: '0.04em' }}>
                Swamy Sharanam Ayyappa
              </p>
              <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.82rem', color: 'rgba(212,175,55,0.7)', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600, margin: '0 0 1rem' }}>
                Seva is Worship · Service is Tradition
              </p>
              <div style={{ height: 1, background: 'rgba(212,175,55,0.2)', marginBottom: '1rem' }} />
              <p style={{ fontFamily: 'Crimson Pro, serif', fontStyle: 'italic', fontSize: '0.95rem', color: 'rgba(255,255,255,0.75)', lineHeight: 1.8, margin: 0 }}>
                With the blessings of Lord Dharma Sasta, Sasta Trust continues its humble journey of devotion and service to all.
              </p>
            </div>
          </motion.div>

          {/* Contact */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem' }}>
              <div style={{ height: 1, flex: 1, background: 'linear-gradient(90deg, transparent, var(--gold-primary), transparent)' }} />
              <p style={{ fontFamily: 'Cinzel, serif', fontSize: '0.82rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gold-dark)', fontWeight: 700, margin: 0, whiteSpace: 'nowrap' }}>
                Get In Touch
              </p>
              <div style={{ height: 1, flex: 1, background: 'linear-gradient(90deg, transparent, var(--gold-primary), transparent)' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              {[
                { label: 'Email', value: 'sastatrust@gmail.com', href: 'mailto:sastatrust@gmail.com' },
                { label: 'Phone', value: '+91 93916 72398', href: 'tel:+919391672398' },
                { label: 'Location', value: 'Near Azhudha River, Kerala', href: 'https://maps.google.com/?q=Azhudha+River+Kerala' },
              ].map(c => (
                <a key={c.label} href={c.href} target={c.label === 'Location' ? '_blank' : undefined} rel="noreferrer"
                  style={{
                    display: 'block', padding: '1.25rem 1.25rem', background: 'white',
                    border: '1px solid var(--bg-tertiary)', borderRadius: 'var(--radius-md)',
                    borderBottom: '3px solid transparent',
                    textDecoration: 'none', transition: 'all 0.2s'
                  }}
                  onMouseOver={e => { e.currentTarget.style.borderBottomColor = 'var(--gold-primary)'; e.currentTarget.style.boxShadow = 'var(--shadow-gold)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseOut={e => { e.currentTarget.style.borderBottomColor = 'transparent'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-tertiary)', fontWeight: 600, margin: '0 0 0.4rem' }}>
                    {c.label}
                  </p>
                  <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 'clamp(0.78rem, 2vw, 0.9rem)', color: 'var(--purple-royal)', fontWeight: 600, margin: 0, wordBreak: 'break-word' }}>
                    {c.value}
                  </p>
                </a>
              ))}
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
};
