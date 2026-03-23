import React, { useEffect, useState, useRef } from 'react';
import { getReceipts } from '../services/db';
import { useAuth } from '../context/AuthContext';
import { Receipt, FileText, Download, Trophy, FileSpreadsheet, Heart, Phone, Mail, Copy, Landmark, HeartHandshake, Home, UtensilsCrossed, Footprints, Flower2, Users, Smartphone, Building2, Banknote, Image as ImageIcon, X, ZoomIn } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import * as XLSX from 'xlsx';

// Load photos from public folder
const photoFilesMap = import.meta.glob('/public/photos_to_play/*.{jpg,jpeg,png,webp}', { eager: true, query: '?url', import: 'default' });
const photoList = Object.values(photoFilesMap);

const categories = [
  { Icon: Landmark, title: 'Old Temple Maintenance & Restoration', desc: 'Preserving and revitalizing heritage temples for future generations.', color: '#FFD700' },
  { Icon: HeartHandshake, title: 'Monthly Remunerations for Temple Dharma-Sevaks', desc: 'Supporting those who serve the Lord selflessly every day.', color: '#FFD700' },
  { Icon: Home, title: 'Monthly Maintenance for Needy Families', desc: 'Extending a helping hand to families in financial hardship.', color: '#FFD700' },
  { Icon: UtensilsCrossed, title: 'Yearly Anna Prasadam Seva — Kerala', desc: 'Serving thousands of devotees near Azhudha River every single year.', color: '#FFD700' },
  { Icon: Footprints, title: 'Sponsoring Pilgrimage to Sabarimala', desc: 'Ensuring no devotee is deprived of darshan due to financial constraints.', color: '#FFD700' },
  { Icon: Flower2, title: 'Kanyadanam — Sreshtham & Mahadaan', desc: 'Honoring daughters of poor Vedic practitioners in lifelong dedication.', color: '#FFD700' },
  { Icon: Users, title: 'Care for the Elderly', desc: 'Dedicated to the well-being of our community\'s most experienced members.', color: '#FFD700' },
];

const copyToClipboard = (text) => {
  navigator.clipboard.writeText(text);
  alert(`Copied: ${text}`);
};

export const UserReceipts = () => {
  const { user } = useAuth();
  const [receipts, setReceipts] = useState([]);
  const [allReceipts, setAllReceipts] = useState([]);
  const [topDonors, setTopDonors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  
  // Slideshow Logic: Cross-fade every 4-6 seconds
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
        }, 5000); // Fixed 5 second timing
    };

    runSlideshow();
    return () => clearTimeout(timer);
  }, []); // Only run once on mount

  useEffect(() => {
    loadReceipts();
  }, [user]);

  const loadReceipts = async () => {
    try {
      setLoading(true);
      const data = await getReceipts();
      const grouped = {};
      data.forEach(r => {
        if (!grouped[r.name]) grouped[r.name] = 0;
        grouped[r.name] += Number(r.amount);
      });
      const sortedList = Object.entries(grouped)
        .map(([name, amt]) => ({ name, amt }))
        .sort((a, b) => b.amt - a.amt)
        .slice(0, 10);
      setTopDonors(sortedList);
      setAllReceipts(data);
      const mine = (user?.role === 'owner') ? data : data.filter(r => r.contactValue === user?.email);
      setReceipts(mine);
    } catch (e) { console.error(e); } 
    finally { setLoading(false); }
  };

  const exportToExcel = () => {
    const sorted = [...allReceipts].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    const rows = sorted.map((r, i) => ({
      'S.No': i + 1,
      'Name': r.name,
      'Amount': `\u20B9${Number(r.amount).toLocaleString('en-IN')}`,
      'Reason / Purpose': r.details,
      'Date': new Date(r.createdAt).toLocaleDateString('en-IN'),
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Receipts');
    XLSX.writeFile(wb, 'Sasta_Trust_Receipts.xlsx');
  };

  if (loading) {
    return <div className="container" style={{ display: 'flex', justifyContent: 'center', marginTop: '4rem' }}><div className="loader"></div></div>;
  }

  return (
    <div style={{ position: 'relative', minHeight: '100vh', color: 'white' }}>

      {/* === CROSS-FADE BACKGROUND SLIDESHOW === */}
      {photoList.length > 0 && (
        <div style={{ position: 'fixed', inset: 0, zIndex: -1, background: '#000' }}>
            <img src={photoList[currentIdx]} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: isFading ? 0 : 1, transition: 'opacity 1.2s ease-in-out', filter: 'brightness(0.1)' }} />
            {photoList.length > 1 && (
                <img src={photoList[nextIdx]} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: isFading ? 1 : 0, transition: 'opacity 1.2s ease-in-out', filter: 'brightness(0.1)' }} />
            )}
        </div>
      )}

      {/* === TOP SECTIONS (on darkened background) === */}
      <div className="container" style={{ padding: '6rem 24px 2rem 24px', maxWidth: '1100px', position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: '8rem' }}>
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <Heart size={44} style={{ margin: '0 auto 1.5rem', opacity: 0.9, color: '#FFD700' }} />
            <h1 style={{ fontSize: 'clamp(2rem, 8vw, 4rem)', fontWeight: 900, marginBottom: '1rem', textShadow: '0 4px 10px rgba(0,0,0,0.5)' }}>
              Support Our Sacred Mission
            </h1>
            <p style={{ fontSize: '1.4rem', fontStyle: 'italic', marginBottom: '2rem', textShadow: '0 2px 4px rgba(0,0,0,0.5)', opacity: 0.9 }}>
              Your contribution, however small, lights the path of devotion.
            </p>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#FFD700', letterSpacing: '2px', textShadow: '0 2px 5px rgba(0,0,0,0.5)' }}>
               ✦ Swamy Sharanam Ayyappa! ✦
            </h2>
          </motion.div>
        </div>

        <div style={{ marginBottom: '8rem' }}>
          <h2 style={{ fontSize: '2.5rem', textAlign: 'center', marginBottom: '4rem', fontWeight: 800, textShadow: '0 2px 10px rgba(0,0,0,0.3)' }}>Ways to Contribute</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '3rem' }}>
            {categories.map((cat, i) => (
              <motion.div key={i} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ delay: i * 0.1 }}>
                <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>
                  <cat.Icon size={28} color="#FFD700" style={{ flexShrink: 0 }} />
                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', color: '#FFD700' }}>{cat.title}</h3>
                    <p style={{ fontSize: '1rem', opacity: 0.85, lineHeight: 1.6 }}>{cat.desc}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* CONTRIBUTE INFO - Before the white section */}
        <div style={{ marginBottom: '4rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
          {/* UPI */}
          <div style={{ textAlign: 'center' }}>
             <h3 style={{ fontSize: '1.5rem', color: '#FFD700', marginBottom: '1.5rem' }}>UPI Payments</h3>
             <div 
               onClick={() => setIsQRModalOpen(true)}
               style={{ cursor: 'zoom-in', width: '160px', margin: '0 auto 1.5rem', borderRadius: '16px', border: '4px solid white', overflow: 'hidden' }}
             >
                <img src="/QRcode/QRCode.png" alt="QR" style={{ width: '100%', display: 'block' }} />
             </div>
             <code style={{ fontSize: '1.1rem', background: 'rgba(255,255,255,0.1)', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid rgba(255,b215,0,0.3)' }}>sastatrust@upi</code>
             <button onClick={() => copyToClipboard('sastatrust@upi')} style={{ color: '#FFD700', background: 'none', border: 'none', cursor: 'pointer', marginLeft: '0.5rem' }}><Copy size={18} /></button>
          </div>

          {/* Details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <div>
                <h3 style={{ color: '#FFD700', marginBottom: '0.5rem' }}>Bank Transfer</h3>
                <p style={{ margin: 0, fontSize: '1rem' }}>A/C Name: <b>Sasta Trust</b><br/>A/C No: <b>XXXXXXXXXXXX</b><br/>IFSC: <b>XXXXX000XXXX</b></p>
              </div>
              <div>
                <h3 style={{ color: '#FFD700', marginBottom: '0.5rem' }}>Contact</h3>
                <p style={{ margin: 0, fontSize: '1rem' }}>+91 93916 72398<br/>sastatrust@gmail.com</p>
              </div>
          </div>
        </div>
      </div>

      {/* === WHITE SECTION BOX (from Leaderboard to Bottom) === */}
      <div style={{ background: 'white', color: '#1a1a1a', padding: '6rem 24px', marginTop: '4rem', position: 'relative', zIndex: 1, minHeight: '600px', boxShadow: '0 -20px 40px rgba(0,0,0,0.1)' }}>
        <div className="container" style={{ maxWidth: '1100px' }}>
            
            {/* LEADERBOARD */}
            <div style={{ marginBottom: '8rem' }}>
              <h2 style={{ fontSize: '2.4rem', textAlign: 'center', marginBottom: '3rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', color: '#1a1a1a' }}>
                 <Trophy size={32} color="#fcd34d" fill="#fcd34d" /> Top 10 Devotee Donors
              </h2>
              {topDonors.length > 0 ? (
                <div style={{ background: '#f8fafc', borderRadius: '32px', padding: '2rem', border: '1px solid #e2e8f0', boxShadow: '0 10px 30px rgba(0,0,0,0.04)' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #fcd34d' }}>
                        <th style={{ padding: '1.5rem', textAlign: 'left', color: '#1a1a1a', fontWeight: 800 }}>Rank</th>
                        <th style={{ padding: '1.5rem', textAlign: 'left', color: '#1a1a1a', fontWeight: 800 }}>Devotee Name</th>
                        <th style={{ padding: '1.5rem', textAlign: 'right', color: '#1a1a1a', fontWeight: 800 }}>Contribution</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topDonors.map((d, i) => (
                        <tr key={i} style={{ borderBottom: i === topDonors.length - 1 ? 'none' : '1px solid #e2e8f0' }}>
                          <td style={{ padding: '1.25rem', fontWeight: 800, color: '#64748b' }}>#{i + 1}</td>
                          <td style={{ padding: '1.25rem', fontWeight: 600 }}>{d.name}</td>
                          <td style={{ padding: '1.25rem', textAlign: 'right', fontWeight: 800, color: '#059669' }}>₹{d.amt.toLocaleString('en-IN')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : <p style={{ textAlign: 'center', opacity: 0.5 }}>No donation records found yet.</p>}
            </div>

            {/* RECEIPTS LIST */}
            <div style={{ marginBottom: '6rem' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
                  <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#1a1a1a' }}><Receipt size={28} /> {user?.role === 'owner' ? 'All System Receipts' : 'My Receipts'}</h2>
                  {user?.role === 'owner' && <button className="btn btn-primary" onClick={exportToExcel}><FileSpreadsheet size={16} /> Export Excel</button>}
               </div>
               
               <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '2rem' }}>
                  {receipts.map(rcpt => (
                     <motion.div key={rcpt.id} layout style={{ background: '#f8fafc', borderRadius: '24px', padding: '2rem', border: '1px solid #e2e8f0', boxShadow: '0 5px 15px rgba(0,0,0,0.03)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                           <span style={{ fontWeight: 800, color: '#f59e0b' }}>#{rcpt.id}</span>
                           <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>{new Date(rcpt.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div style={{ marginBottom: '1.5rem' }}>
                           <h2 style={{ fontSize: '2.4rem', margin: 0, color: '#1a1a1a' }}>₹{rcpt.amount}</h2>
                           <p style={{ margin: 0, color: '#64748b' }}>By {rcpt.name}</p>
                        </div>
                        <p style={{ background: 'white', padding: '1rem', borderRadius: '12px', fontSize: '0.95rem', border: '1px solid #f1f5f9' }}>{rcpt.details}</p>
                     </motion.div>
                  ))}
               </div>
            </div>

            {/* BOTTOM BANNER */}
            <div style={{ textAlign: 'center', padding: '4rem 2rem', borderTop: '1px solid #f1f5f9' }}>
               <p style={{ fontSize: '1.2rem', fontWeight: 800, letterSpacing: '4px', color: '#1a1a1a', marginBottom: '1rem', opacity: 0.8 }}>SEVA IS WORSHIP — SERVICE IS TRADITION</p>
               <p style={{ maxWidth: '600px', margin: '0 auto', color: '#64748b', lineHeight: 1.8 }}>With blessings of Lord Dharma Sasta, Sasta Trust continues its humble journey of devotion and service.</p>
            </div>
        </div>
      </div>

      {/* MODAL */}
      <AnimatePresence>
        {isQRModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={() => setIsQRModalOpen(false)}>
            <button style={{ position: 'absolute', top: '2rem', right: '2rem', background: 'none', border: 'none', color: 'white' }}><X size={40} /></button>
            <motion.img initial={{ scale: 0.8 }} animate={{ scale: 1 }} exit={{ scale: 0.8 }} src="/QRcode/QRCode.png" alt="QR" style={{ maxHeight: '90vh', maxWidth: '100%', borderRadius: '20px' }} onClick={(e) => e.stopPropagation()} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
