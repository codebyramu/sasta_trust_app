import React from 'react';
import { motion } from 'framer-motion';
import { Heart, Phone, Mail, Copy, Landmark, HeartHandshake, Home, UtensilsCrossed, Footprints, Flower2, Users, Smartphone, Building2, Banknote, CheckCircle } from 'lucide-react';

const categories = [
  { Icon: Landmark, title: 'Old Temple Maintenance & Restoration', desc: 'Preserving and revitalizing heritage temples for future generations.', color: '#b45309', accent: '#fef3c7' },
  { Icon: HeartHandshake, title: 'Monthly Remunerations for Temple Dharma-Sevaks', desc: 'Supporting those who serve the Lord selflessly every day.', color: '#7c3aed', accent: '#ede9fe' },
  { Icon: Home, title: 'Monthly Maintenance for Needy Families', desc: 'Extending a helping hand to families in financial hardship.', color: '#065f46', accent: '#d1fae5' },
  { Icon: UtensilsCrossed, title: 'Yearly Anna Prasadam Seva — Kerala', desc: 'Serving thousands of devotees near Azhudha River every single year.', color: '#9f1239', accent: '#ffe4e6' },
  { Icon: Footprints, title: 'Sponsoring Pilgrimage to Sabarimala', desc: 'Ensuring no devotee is deprived of darshan due to financial constraints.', color: '#1e3a8a', accent: '#dbeafe' },
  { Icon: Flower2, title: 'Kanyadanam — Sreshtham & Mahadaan', desc: 'Honoring daughters of poor Vedic practitioners in lifelong dedication.', color: '#9d174d', accent: '#fce7f3' },
  { Icon: Users, title: 'Care for the Elderly', desc: 'Dedicated to the well-being of our community\'s most experienced members.', color: '#374151', accent: '#f3f4f6' },
];

const copyToClipboard = (text) => {
  navigator.clipboard.writeText(text);
};

export const Donate = () => {
  return (
    <div style={{ background: 'var(--bg-primary)', minHeight: '100vh' }}>

      {/* Page Header */}
      <div style={{ background: 'white', borderBottom: '1px solid var(--bg-tertiary)' }}>
        <div className="container" style={{ maxWidth: 1000, padding: '3.5rem 24px 2.5rem' }}>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.72rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-tertiary)', fontWeight: 600, marginBottom: '0.6rem' }}>
            सेवा परमो धर्मः
          </p>
          <h1 style={{ fontFamily: 'Cinzel, serif', fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 1rem', letterSpacing: '0.04em', lineHeight: 1.2 }}>
            Support Our Sacred Mission
          </h1>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '1rem', color: 'var(--text-secondary)', maxWidth: 560, lineHeight: 1.8, margin: 0 }}>
            Your contribution, however small, lights the path of devotion and sustains the sacred work of Sasta Trust.
          </p>
        </div>
      </div>

      <div className="container" style={{ maxWidth: 1000, padding: '3rem 24px' }}>

        {/* Causes */}
        <div style={{ marginBottom: '3.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.75rem' }}>
            <div style={{ height: 1, flex: 1, background: 'var(--bg-tertiary)' }} />
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.72rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-tertiary)', fontWeight: 600, whiteSpace: 'nowrap', margin: 0 }}>Where Your Donation Goes</p>
            <div style={{ height: 1, flex: 1, background: 'var(--bg-tertiary)' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: '1.25rem' }}>
            {categories.map((cat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
                style={{ display: 'flex', gap: '1rem', padding: '1.4rem', background: 'white', border: '1px solid var(--bg-tertiary)', borderRadius: 4, alignItems: 'flex-start', boxShadow: 'var(--shadow-sm)', transition: 'box-shadow 0.2s, transform 0.2s' }}
                whileHover={{ y: -3, boxShadow: '0 12px 32px rgba(46,49,146,0.08)' }}
              >
                <div style={{ width: 42, height: 42, borderRadius: 4, background: cat.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <cat.Icon size={20} color={cat.color} />
                </div>
                <div>
                  <h4 style={{ fontFamily: 'Cinzel, serif', fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 0.4rem', lineHeight: 1.4, letterSpacing: '0.02em' }}>{cat.title}</h4>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>{cat.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Payment Methods */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.75rem' }}>
            <div style={{ height: 1, flex: 1, background: 'var(--bg-tertiary)' }} />
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.72rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-tertiary)', fontWeight: 600, whiteSpace: 'nowrap', margin: 0 }}>How to Contribute</p>
            <div style={{ height: 1, flex: 1, background: 'var(--bg-tertiary)' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
            {/* UPI */}
            <div style={{ background: 'white', border: '1px solid var(--bg-tertiary)', borderRadius: 4, padding: '2rem', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
                <div style={{ width: 38, height: 38, borderRadius: 4, background: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Smartphone size={18} color="#7c3aed" />
                </div>
                <div>
                  <p style={{ fontFamily: 'Cinzel, serif', fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', margin: 0, letterSpacing: '0.02em' }}>UPI Payment</p>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.72rem', color: 'var(--text-tertiary)', margin: 0 }}>GPay / PhonePe / Paytm</p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-primary)', padding: '0.75rem 1rem', borderRadius: 4, border: '1px solid var(--bg-tertiary)', marginBottom: '0.6rem' }}>
                <code style={{ flex: 1, fontFamily: 'Inter, monospace', fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '0.02em' }}>sastatrust@upi</code>
                <button onClick={() => copyToClipboard('sastatrust@upi')} title="Copy" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-primary)', padding: '2px' }}>
                  <Copy size={15} />
                </button>
              </div>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.78rem', color: 'var(--text-tertiary)', margin: 0 }}>Open any UPI app and scan / paste the ID</p>
            </div>

            {/* Bank */}
            <div style={{ background: 'white', border: '1px solid var(--bg-tertiary)', borderRadius: 4, padding: '2rem', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
                <div style={{ width: 38, height: 38, borderRadius: 4, background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Building2 size={18} color="#1e3a8a" />
                </div>
                <div>
                  <p style={{ fontFamily: 'Cinzel, serif', fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', margin: 0, letterSpacing: '0.02em' }}>Bank Transfer</p>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.72rem', color: 'var(--text-tertiary)', margin: 0 }}>NEFT / IMPS / RTGS</p>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {[
                  { label: 'Account Name', value: 'Sasta Trust' },
                  { label: 'Account No', value: 'XXXXXXXXXXX', copy: true },
                  { label: 'IFSC Code', value: 'XXXXXXXXXXX' },
                  { label: 'Bank', value: 'State Bank of India' },
                ].map(row => (
                  <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: 'Inter, sans-serif', fontSize: '0.85rem' }}>
                    <span style={{ color: 'var(--text-tertiary)', fontWeight: 500 }}>{row.label}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{row.value}</span>
                      {row.copy && (
                        <button onClick={() => copyToClipboard(row.value)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-primary)', padding: '1px' }}>
                          <Copy size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Cash / Contact */}
            <div style={{ background: 'white', border: '1px solid var(--bg-tertiary)', borderRadius: 4, padding: '2rem', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
                <div style={{ width: 38, height: 38, borderRadius: 4, background: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Banknote size={18} color="#065f46" />
                </div>
                <div>
                  <p style={{ fontFamily: 'Cinzel, serif', fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', margin: 0, letterSpacing: '0.02em' }}>Cash / Contact</p>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.72rem', color: 'var(--text-tertiary)', margin: 0 }}>Reach out directly</p>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <a href="tel:+919391672398" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--text-primary)', textDecoration: 'none', fontFamily: 'Inter, sans-serif', fontSize: '0.9rem', fontWeight: 500 }}>
                  <Phone size={15} color="var(--accent-primary)" /> +91 93916 72398
                </a>
                <a href="mailto:sastatrust@gmail.com" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--text-primary)', textDecoration: 'none', fontFamily: 'Inter, sans-serif', fontSize: '0.9rem', fontWeight: 500 }}>
                  <Mail size={15} color="var(--accent-primary)" /> sastatrust@gmail.com
                </a>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.78rem', color: 'var(--text-tertiary)', margin: 0, marginTop: '0.25rem', lineHeight: 1.6 }}>
                  G-04, Sai Nilayam Apts, Saptarishi Nagar, Hyderabad – 500 088
                </p>
              </div>
            </div>
          </div>

          {/* Info note */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '1.1rem 1.4rem', background: 'var(--accent-light)', border: '1px solid rgba(46,49,146,0.1)', borderRadius: 4 }}>
            <CheckCircle size={17} color="var(--accent-primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.7 }}>
              After donating, please contact us with your <strong>name and amount</strong> — we'll send you an official Sasta Trust receipt for your records.
            </p>
          </div>
        </motion.div>

      </div>
    </div>
  );
};
