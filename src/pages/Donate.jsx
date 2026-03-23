import React from 'react';
import { motion } from 'framer-motion';
import { Heart, Phone, Mail, Copy, Landmark, HeartHandshake, Home, UtensilsCrossed, Footprints, Flower2, Users, Smartphone, Building2, Banknote } from 'lucide-react';

const categories = [
  {
    Icon: Landmark,
    title: 'Old Temple Maintenance & Restoration',
    desc: 'Preserving and revitalizing heritage temples for future generations.',
    color: '#f5a623',
    bg: '#fff8ee',
  },
  {
    Icon: HeartHandshake,
    title: 'Monthly Remunerations for Temple Dharma-Sevaks',
    desc: 'Supporting those who serve the Lord selflessly every day.',
    color: '#9b59b6',
    bg: '#f9f0ff',
  },
  {
    Icon: Home,
    title: 'Monthly Maintenance for Needy Families',
    desc: 'Extending a helping hand to families in financial hardship.',
    color: '#27ae60',
    bg: '#effff5',
  },
  {
    Icon: UtensilsCrossed,
    title: 'Yearly Anna Prasadam Seva — Kerala',
    desc: 'Serving thousands of devotees near Azhudha River every single year.',
    color: '#e74c3c',
    bg: '#fff5f5',
  },
  {
    Icon: Footprints,
    title: 'Sponsoring Pilgrimage to Sabarimala',
    desc: 'Ensuring no devotee is deprived of darshan due to financial constraints.',
    color: '#2980b9',
    bg: '#f0f7ff',
  },
  {
    Icon: Flower2,
    title: 'Kanyadanam — Sreshtham & Mahadaan',
    desc: 'Honoring daughters of poor Vedic practitioners in lifelong dedication.',
    color: '#e91e8c',
    bg: '#fff0f9',
  },
  {
    Icon: Users,
    title: 'Care for the Elderly',
    desc: 'Dedicated to the well-being of our community\'s most experienced members.',
    color: '#546e7a',
    bg: '#f5f8fa',
  },
];

const copyToClipboard = (text) => {
  navigator.clipboard.writeText(text);
  alert(`Copied: ${text}`);
};

export const Donate = () => {
  return (
    <div className="container slide-up" style={{ padding: '3rem 24px', maxWidth: '1000px' }}>

      {/* Greeting */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        style={{ textAlign: 'center', marginBottom: '3rem' }}
      >
        <Heart size={40} color="var(--accent-primary)" style={{ margin: '0 auto 1rem auto', display: 'block' }} />
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--accent-primary)', marginBottom: '1rem', lineHeight: 1.2 }}>
          Support Our Sacred Mission
        </h1>
        <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto', lineHeight: 1.8 }}>
          Your contribution, however small, lights the path of devotion.<br />
          <strong style={{ color: 'var(--accent-primary)' }}>Swamy Sharanam Ayyappa!</strong>
        </p>
      </motion.div>

      {/* Category Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '4rem' }}>
        {categories.map((cat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: i * 0.07 }}
            style={{
              background: cat.bg,
              border: `1.5px solid ${cat.color}22`,
              borderRadius: '16px',
              padding: '1.75rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
              boxShadow: `0 4px 20px ${cat.color}15`,
              transition: 'transform 0.2s, box-shadow 0.2s',
              cursor: 'default',
            }}
            whileHover={{ y: -4, boxShadow: `0 10px 30px ${cat.color}30` }}
          >
            <cat.Icon size={32} color={cat.color} />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: cat.color, margin: 0, lineHeight: 1.4 }}>{cat.title}</h3>
            <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>{cat.desc}</p>
          </motion.div>
        ))}
      </div>

      {/* How to Donate */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="card"
        style={{ background: 'var(--accent-light)', border: '1.5px solid rgba(46,49,146,0.15)', borderRadius: '20px', padding: '2.5rem' }}
      >
        <h2 style={{ fontSize: '1.8rem', color: 'var(--accent-primary)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Heart size={24} color="#e74c3c" fill="#e74c3c" /> How to Contribute
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem' }}>
          {/* UPI */}
          <div style={{ background: 'white', borderRadius: '14px', padding: '1.5rem', boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
            <h4 style={{ color: 'var(--accent-primary)', marginBottom: '0.5rem', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Smartphone size={18} /> UPI / GPay / PhonePe
            </h4>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-secondary)', padding: '0.75rem', borderRadius: '8px', marginBottom: '0.5rem' }}>
              <code style={{ flex: 1, fontSize: '0.9rem', fontWeight: 600 }}>sastatrust@upi</code>
              <button onClick={() => copyToClipboard('sastatrust@upi')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-primary)' }}><Copy size={16} /></button>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', margin: 0 }}>Scan or paste UPI ID to send</p>
          </div>

          {/* Bank Transfer */}
          <div style={{ background: 'white', borderRadius: '14px', padding: '1.5rem', boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
            <h4 style={{ color: 'var(--accent-primary)', marginBottom: '0.5rem', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Building2 size={18} /> Bank Transfer / NEFT
            </h4>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.8 }}>
              <div><b>Account Name:</b> Sasta Trust</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span><b>Account No:</b> XXXXXXXXXXX</span>
                <button onClick={() => copyToClipboard('XXXXXXXXXXX')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-primary)' }}><Copy size={14} /></button>
              </div>
              <div><b>IFSC:</b> XXXXXXXXXXX</div>
              <div><b>Bank:</b> State Bank of India</div>
            </div>
          </div>

          {/* Cash / Contact */}
          <div style={{ background: 'white', borderRadius: '14px', padding: '1.5rem', boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
            <h4 style={{ color: 'var(--accent-primary)', marginBottom: '0.5rem', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Banknote size={18} /> Cash / Contact Us
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <a href="tel:+919391672398" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: 500 }}>
                <Phone size={16} color="var(--accent-primary)" /> +91 93916 72398
              </a>
              <a href="mailto:sastatrust@gmail.com" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: 500 }}>
                <Mail size={16} color="var(--accent-primary)" /> sastatrust@gmail.com
              </a>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', margin: 0, marginTop: '0.25rem' }}>
                G-04, Sai Nilayam Apartments, Saptarishi Nagar, Hyderabad – 500 088
              </p>
            </div>
          </div>
        </div>

        <p style={{ marginTop: '1.5rem', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.9rem', fontStyle: 'italic' }}>
          After donating, please contact us with your name and amount so we can send you an official Sasta Trust receipt.
        </p>
      </motion.div>
    </div>
  );
};
