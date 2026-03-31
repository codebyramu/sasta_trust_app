import React, { useEffect, useState } from 'react';
import { getReceipts } from '../services/db';
import { useAuth } from '../context/AuthContext';
import { Receipt, FileSpreadsheet, Heart, Copy, Landmark, HeartHandshake, Home, UtensilsCrossed, Footprints, Flower2, Users, Smartphone, Building2, Banknote, X, Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import * as XLSX from 'xlsx';

const photoFilesMap = import.meta.glob('/public/photos_to_play/*.{jpg,jpeg,png,webp}', { eager: true, query: '?url', import: 'default' });
const photoList = Object.values(photoFilesMap);

const categories = [
  { Icon: Landmark, title: 'Old Temple Maintenance & Restoration', desc: 'Preserving and revitalizing heritage temples for future generations.' },
  { Icon: HeartHandshake, title: 'Monthly Remunerations for Temple Dharma-Sevaks', desc: 'Supporting those who serve the Lord selflessly every day.' },
  { Icon: Home, title: 'Monthly Maintenance for Needy Families', desc: 'Extending a helping hand to families in financial hardship.' },
  { Icon: UtensilsCrossed, title: 'Yearly Anna Prasadam Seva — Kerala', desc: 'Serving thousands of devotees near Azhudha River every year.' },
  { Icon: Footprints, title: 'Sponsoring Pilgrimage to Sabarimala', desc: 'Ensuring no devotee is deprived of darshan due to financial constraints.' },
  { Icon: Flower2, title: 'Kanyadanam — Sreshtham & Mahadaan', desc: 'Honoring daughters of poor Vedic practitioners in lifelong dedication.' },
  { Icon: Users, title: 'Care for the Elderly', desc: "Dedicated to the well-being of our community's most experienced members." },
];

const copyToClipboard = (text) => { navigator.clipboard.writeText(text); alert(`Copied: ${text}`); };

export const UserReceipts = () => {
  const { user } = useAuth();
  const [receipts, setReceipts] = useState([]);
  const [allReceipts, setAllReceipts] = useState([]);
  const [topDonors, setTopDonors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [nextIdx, setNextIdx] = useState(1);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    if (photoList.length < 2) return;
    let timer;
    const runSlideshow = () => {
      timer = setTimeout(() => {
        setIsFading(true);
        setTimeout(() => {
          setCurrentIdx(prev => (prev + 1) % photoList.length);
          setNextIdx(prev => (prev + 1) % photoList.length);
          setIsFading(false);
          runSlideshow();
        }, 1200);
      }, 5000);
    };
    runSlideshow();
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => { loadReceipts(); }, [user]);

  const loadReceipts = async () => {
    try {
      setLoading(true);
      const data = await getReceipts();
      const grouped = {};
      data.forEach(r => { if (!grouped[r.name]) grouped[r.name] = 0; grouped[r.name] += Number(r.amount); });
      const sortedList = Object.entries(grouped).map(([name, amt]) => ({ name, amt })).sort((a, b) => b.amt - a.amt).slice(0, 10);
      setTopDonors(sortedList);
      setAllReceipts(data);
      const mine = (user?.role === 'owner') ? data : data.filter(r => r.contactValue === user?.email);
      setReceipts(mine);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const exportToExcel = () => {
    const sorted = [...allReceipts].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    const rows = sorted.map((r, i) => ({ 'S.No': i + 1, 'Name': r.name, 'Amount': `\u20B9${Number(r.amount).toLocaleString('en-IN')}`, 'Reason / Purpose': r.details, 'Date': new Date(r.createdAt).toLocaleDateString('en-IN') }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Receipts');
    XLSX.writeFile(wb, 'Sasta_Trust_Receipts.xlsx');
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '1.5rem' }}>
        <div className="loader" style={{ width: 48, height: 48 }} />
        <p style={{ color: 'var(--gold-primary)', fontFamily: 'Cinzel, serif', letterSpacing: '0.1em', textTransform: 'uppercase', fontSize: '0.8rem' }}>Loading Sacred Offerings</p>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', minHeight: '100vh', color: 'white' }}>

      {/* BACKGROUND SLIDESHOW */}
      {photoList.length > 0 && (
        <div style={{ position: 'fixed', inset: 0, zIndex: -1, background: '#0D0A1A' }}>
          <img src={photoList[currentIdx]} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: isFading ? 0 : 1, transition: 'opacity 1.2s ease-in-out', filter: 'brightness(0.08)' }} />
          {photoList.length > 1 && (
            <img src={photoList[nextIdx]} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: isFading ? 1 : 0, transition: 'opacity 1.2s ease-in-out', filter: 'brightness(0.08)' }} />
          )}
          {/* Purple overlay */}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(26,10,46,0.7) 0%, rgba(13,10,26,0.9) 100%)' }} />
        </div>
      )}

      {/* HERO */}
      <div className="container" style={{ padding: '6rem 24px 2rem', maxWidth: '1100px', position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: '8rem' }}>
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <Heart size={44} style={{ margin: '0 auto 1.5rem', color: '#D4AF37', filter: 'drop-shadow(0 0 12px rgba(212,175,55,0.4))' }} />
            <h1 style={{
              fontSize: 'clamp(2rem, 8vw, 3.5rem)', fontWeight: 900, marginBottom: '1rem',
              fontFamily: 'Cinzel, serif',
              background: 'linear-gradient(135deg, #D4AF37, #F4D03F, #D4AF37)',
              backgroundSize: '200% auto', animation: 'shimmer 4s linear infinite',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              letterSpacing: '0.06em'
            }}>
              Support Our Sacred Mission
            </h1>
            <p style={{ fontFamily: 'Crimson Pro, serif', fontStyle: 'italic', fontSize: '1.3rem', marginBottom: '2rem', color: 'rgba(255,255,255,0.6)', letterSpacing: '0.03em' }}>
              Your contribution, however small, lights the path of devotion.
            </p>
            <h2 style={{
              fontFamily: 'Cinzel, serif', fontSize: '1.4rem', fontWeight: 800,
              background: 'linear-gradient(135deg, #D4AF37, #F4D03F)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              letterSpacing: '3px'
            }}>
              ✦ Swamy Sharanam Ayyappa! ✦
            </h2>
          </motion.div>
        </div>

        {/* CAUSES */}
        <div style={{ marginBottom: '8rem' }}>
          <h2 style={{ fontFamily: 'Cinzel, serif', fontSize: '2rem', textAlign: 'center', marginBottom: '4rem', fontWeight: 800, color: '#D4AF37', letterSpacing: '0.06em' }}>
            Ways to Contribute
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2.5rem' }}>
            {categories.map((cat, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}>
                <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 'var(--radius-md)', flexShrink: 0,
                    background: 'linear-gradient(135deg, rgba(212,175,55,0.15), rgba(244,208,63,0.05))',
                    border: '1px solid rgba(212,175,55,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <cat.Icon size={22} color="#D4AF37" />
                  </div>
                  <div>
                    <h3 style={{ fontFamily: 'Cinzel, serif', fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.4rem', color: '#D4AF37', letterSpacing: '0.02em' }}>{cat.title}</h3>
                    <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.92rem', opacity: 0.6, lineHeight: 1.7, margin: 0 }}>{cat.desc}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* PAYMENT INFO */}
        <div style={{ marginBottom: '4rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2.5rem' }}>
          {/* UPI */}
          <div style={{
            textAlign: 'center', padding: '2.5rem', borderRadius: 'var(--radius-xl)',
            background: 'rgba(212,175,55,0.05)', border: '1px solid rgba(212,175,55,0.15)',
            backdropFilter: 'blur(10px)'
          }}>
            <Smartphone size={28} color="#D4AF37" style={{ marginBottom: '1rem' }} />
            <h3 style={{ fontFamily: 'Cinzel, serif', fontSize: '1.3rem', color: '#D4AF37', marginBottom: '1.5rem' }}>UPI Payments</h3>
            <div
              onClick={() => setIsQRModalOpen(true)}
              style={{ cursor: 'zoom-in', width: '160px', margin: '0 auto 1.5rem', borderRadius: 'var(--radius-lg)', border: '3px solid rgba(212,175,55,0.3)', overflow: 'hidden', boxShadow: '0 0 20px rgba(212,175,55,0.15)' }}
            >
              <img src="/QRcode/QRCode.png" alt="QR" style={{ width: '100%', display: 'block' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              <code style={{ fontFamily: 'DM Sans, monospace', fontSize: '1rem', background: 'rgba(255,255,255,0.05)', padding: '0.6rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(212,175,55,0.2)', color: '#D4AF37', fontWeight: 600 }}>sastatrust@upi</code>
              <button onClick={() => copyToClipboard('sastatrust@upi')} style={{ color: '#D4AF37', background: 'none', border: 'none', cursor: 'pointer' }}><Copy size={18} /></button>
            </div>
          </div>

          {/* Bank + Contact */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{
              padding: '2rem', borderRadius: 'var(--radius-xl)',
              background: 'rgba(212,175,55,0.05)', border: '1px solid rgba(212,175,55,0.15)',
              backdropFilter: 'blur(10px)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <Building2 size={20} color="#D4AF37" />
                <h3 style={{ fontFamily: 'Cinzel, serif', color: '#D4AF37', margin: 0, fontSize: '1.1rem' }}>Bank Transfer</h3>
              </div>
              <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.95rem', lineHeight: 2 }}>
                <span style={{ opacity: 0.5 }}>A/C Name:</span> <b>Sasta Trust</b><br/>
                <span style={{ opacity: 0.5 }}>A/C No:</span> <b>XXXXXXXXXXXX</b><br/>
                <span style={{ opacity: 0.5 }}>IFSC:</span> <b>XXXXX000XXXX</b>
              </div>
            </div>
            <div style={{
              padding: '2rem', borderRadius: 'var(--radius-xl)',
              background: 'rgba(212,175,55,0.05)', border: '1px solid rgba(212,175,55,0.15)',
              backdropFilter: 'blur(10px)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <Banknote size={20} color="#D4AF37" />
                <h3 style={{ fontFamily: 'Cinzel, serif', color: '#D4AF37', margin: 0, fontSize: '1.1rem' }}>Contact Us</h3>
              </div>
              <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.95rem', lineHeight: 2 }}>
                +91 93916 72398<br/>sastatrust@gmail.com
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* WHITE SECTION */}
      <div style={{
        background: 'var(--bg-primary)', color: 'var(--text-primary)', padding: '5rem 24px',
        position: 'relative', zIndex: 1, borderRadius: '40px 40px 0 0',
        boxShadow: '0 -20px 60px rgba(0,0,0,0.2)'
      }}>
        {/* Gold decorative top border */}
        <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 100, height: 4, background: 'linear-gradient(90deg, #D4AF37, #F4D03F, #D4AF37)', borderRadius: '0 0 4px 4px' }} />

        <div className="container" style={{ maxWidth: '1100px' }}>

          {/* LEADERBOARD */}
          <div style={{ marginBottom: '6rem' }}>
            <h2 style={{
              fontFamily: 'Cinzel, serif', fontSize: '2rem', textAlign: 'center', marginBottom: '3rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem',
              color: 'var(--text-primary)', letterSpacing: '0.04em'
            }}>
              <Trophy size={28} color="#D4AF37" fill="#D4AF37" /> Top 10 Devotee Donors
            </h2>
            {topDonors.length > 0 ? (
              <div style={{
                background: 'white', borderRadius: 'var(--radius-xl)', padding: '2rem',
                border: '1px solid rgba(45,27,105,0.06)', boxShadow: 'var(--shadow-sm)',
                position: 'relative', overflow: 'hidden'
              }}>
                <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 80, height: 3, background: 'linear-gradient(90deg, #D4AF37, #F4D03F, #D4AF37)', borderRadius: '0 0 3px 3px' }} />
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--gold-primary)' }}>
                      <th style={{ padding: '1.25rem', textAlign: 'left', fontFamily: 'Cinzel, serif', color: 'var(--purple-royal)', fontWeight: 700, fontSize: '0.85rem', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Rank</th>
                      <th style={{ padding: '1.25rem', textAlign: 'left', fontFamily: 'Cinzel, serif', color: 'var(--purple-royal)', fontWeight: 700, fontSize: '0.85rem', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Devotee Name</th>
                      <th style={{ padding: '1.25rem', textAlign: 'right', fontFamily: 'Cinzel, serif', color: 'var(--purple-royal)', fontWeight: 700, fontSize: '0.85rem', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Contribution</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topDonors.map((d, i) => (
                      <tr key={i} style={{ borderBottom: i === topDonors.length - 1 ? 'none' : '1px solid var(--bg-tertiary)', transition: 'background 0.2s' }}
                        onMouseOver={e => e.currentTarget.style.background = 'var(--purple-wash)'}
                        onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <td style={{ padding: '1.25rem', fontWeight: 800, color: i < 3 ? 'var(--gold-primary)' : 'var(--text-tertiary)', fontFamily: 'Cinzel, serif', fontSize: '1rem' }}>
                          {i < 3 ? ['🥇', '🥈', '🥉'][i] : `#${i + 1}`}
                        </td>
                        <td style={{ padding: '1.25rem', fontWeight: 600, fontFamily: 'DM Sans, sans-serif', color: 'var(--text-primary)' }}>{d.name}</td>
                        <td style={{ padding: '1.25rem', textAlign: 'right', fontWeight: 800, color: 'var(--gold-dark)', fontFamily: 'DM Sans, sans-serif', fontSize: '1.05rem' }}>₹{d.amt.toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <p style={{ textAlign: 'center', opacity: 0.4, fontFamily: 'Crimson Pro, serif', fontStyle: 'italic' }}>No donation records found yet.</p>}
          </div>

          {/* RECEIPTS LIST */}
          <div style={{ marginBottom: '5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
              <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem', fontFamily: 'Cinzel, serif', letterSpacing: '0.04em' }}>
                <Receipt size={24} color="var(--gold-primary)" /> {user?.role === 'owner' ? 'All System Receipts' : 'My Receipts'}
              </h2>
              {user?.role === 'owner' && <button className="btn btn-primary" onClick={exportToExcel} style={{ borderRadius: 'var(--radius-full)' }}><FileSpreadsheet size={16} /> Export Excel</button>}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
              {receipts.map(rcpt => (
                <motion.div key={rcpt.id} layout style={{
                  background: 'white', borderRadius: 'var(--radius-xl)', padding: '2rem',
                  border: '1px solid rgba(45,27,105,0.06)', boxShadow: 'var(--shadow-sm)',
                  position: 'relative', overflow: 'hidden', transition: 'all 0.3s'
                }}>
                  <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 50, height: 3, background: 'linear-gradient(90deg, #D4AF37, #F4D03F)', borderRadius: '0 0 3px 3px' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                    <span style={{ fontWeight: 800, fontFamily: 'Cinzel, serif', color: 'var(--gold-primary)', fontSize: '0.85rem' }}>#{rcpt.id}</span>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-tertiary)', fontFamily: 'DM Sans, sans-serif' }}>{new Date(rcpt.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div style={{ marginBottom: '1.25rem' }}>
                    <h2 style={{
                      fontSize: '2rem', margin: '0 0 0.25rem',
                      background: 'linear-gradient(135deg, var(--purple-royal), var(--gold-primary))',
                      WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                      fontFamily: 'Cinzel, serif'
                    }}>₹{rcpt.amount}</h2>
                    <p style={{ margin: 0, color: 'var(--text-tertiary)', fontFamily: 'DM Sans, sans-serif', fontSize: '0.9rem' }}>By {rcpt.name}</p>
                  </div>
                  <p style={{ background: 'var(--bg-primary)', padding: '1rem', borderRadius: 'var(--radius-md)', fontSize: '0.92rem', border: '1px solid var(--bg-tertiary)', fontFamily: 'Crimson Pro, serif', fontStyle: 'italic', color: 'var(--text-secondary)', margin: 0 }}>{rcpt.details}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* BOTTOM BANNER */}
          <div style={{ textAlign: 'center', padding: '3rem 2rem' }}>
            <div style={{ height: 1, maxWidth: 200, margin: '0 auto 2rem', background: 'linear-gradient(90deg, transparent, var(--gold-primary), transparent)', opacity: 0.3 }} />
            <p style={{
              fontFamily: 'Cinzel, serif', fontSize: '1.1rem', fontWeight: 700,
              letterSpacing: '4px', marginBottom: '1rem',
              background: 'linear-gradient(135deg, var(--purple-royal), var(--gold-primary))',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
            }}>SEVA IS WORSHIP — SERVICE IS TRADITION</p>
            <p style={{ fontFamily: 'Crimson Pro, serif', fontStyle: 'italic', maxWidth: '600px', margin: '0 auto', color: 'var(--text-tertiary)', lineHeight: 1.8 }}>
              With blessings of Lord Dharma Sasta, Sasta Trust continues its humble journey of devotion and service.
            </p>
          </div>
        </div>
      </div>

      {/* QR MODAL */}
      <AnimatePresence>
        {isQRModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(13,10,26,0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(10px)' }}
            onClick={() => setIsQRModalOpen(false)}>
            <button style={{ position: 'absolute', top: '2rem', right: '2rem', background: 'none', border: 'none', color: '#D4AF37' }}><X size={40} /></button>
            <motion.img initial={{ scale: 0.8 }} animate={{ scale: 1 }} exit={{ scale: 0.8 }} src="/QRcode/QRCode.png" alt="QR"
              style={{ maxHeight: '90vh', maxWidth: '100%', borderRadius: 'var(--radius-xl)', border: '3px solid rgba(212,175,55,0.3)', boxShadow: '0 0 40px rgba(212,175,55,0.2)' }}
              onClick={(e) => e.stopPropagation()} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
