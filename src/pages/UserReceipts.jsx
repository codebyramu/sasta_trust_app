import React, { useEffect, useState } from 'react';
import { getReceipts } from '../services/db';
import { useAuth } from '../context/AuthContext';
import {
  Receipt,
  FileSpreadsheet,
  Heart,
  Copy,
  Landmark,
  HeartHandshake,
  Home,
  UtensilsCrossed,
  Footprints,
  Flower2,
  Users,
  Smartphone,
  Building2,
  Mail,
  Phone,
  X,
  Trophy,
  Download,
  Search,
  CheckCircle2,
  QrCode
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import * as XLSX from 'xlsx';
import { AlternatingSlideImage } from '../components/AlternatingSlideImage';

const categories = [
  {
    Icon: Landmark,
    title: 'Old Temple Maintenance & Restoration',
    desc: 'Preserving and revitalizing heritage temples for future generations.',
    images: ['/gallery/heritage_temple_restoration.jpg', '/photos_to_play/WhatsApp Image 2026-03-23 at 1.10.18 PM.jpeg', '/flower/collage.jpg']
  },
  {
    Icon: HeartHandshake,
    title: 'Monthly Remunerations for Temple Dharma-Sevaks',
    desc: 'Supporting those who serve the Lord selflessly every day.',
    images: ['/photos_to_play/WhatsApp Image 2026-03-23 at 1.10.18 PM.jpeg', '/gallery/heritage_temple_restoration.jpg']
  },
  {
    Icon: Home,
    title: 'Monthly Maintenance for Needy Families',
    desc: 'Extending a helping hand to families in financial hardship.',
    images: ['/gallery/anna_prasadam_service_camp.jpg', '/photos_to_play/WhatsApp Image 2026-03-23 at 1.10.17 PM (1).jpeg']
  },
  {
    Icon: UtensilsCrossed,
    title: 'Yearly Anna Prasadam Seva — Kerala',
    desc: 'Serving thousands of devotees near Azhudha River every year.',
    images: ['/gallery/anna_prasadam_cooking.jpg', '/photos_to_play/WhatsApp Image 2026-03-23 at 1.10.17 PM.jpeg', '/gallery/anna_prasadam_service_camp.jpg']
  },
  {
    Icon: Footprints,
    title: 'Sponsoring Pilgrimage to Sabarimala',
    desc: 'Ensuring no devotee is deprived of darshan due to financial constraints.',
    images: ['/gallery/pilgrims_azhudha_trek.jpg', '/gallery/azhudha_river_misty_valley.jpg', '/photos_to_play/WhatsApp Image 2026-03-23 at 1.10.17 PM (2).jpeg']
  },
  {
    Icon: Flower2,
    title: 'Kanyadanam — Sreshtham & Mahadaan',
    desc: 'Honoring daughters of poor Vedic practitioners in lifelong dedication.',
    images: ['/flower/collage.jpg', '/gallery/heritage_temple_restoration.jpg']
  },
  {
    Icon: Users,
    title: 'Care for the Elderly',
    desc: "Dedicated to the well-being of our community's most experienced members.",
    images: ['/gallery/anna_prasadam_service_camp.jpg', '/gallery/anna_prasadam_cooking.jpg', '/photos_to_play/WhatsApp Image 2026-03-23 at 1.10.17 PM (1).jpeg']
  }
];

export const UserReceipts = () => {
  const { user } = useAuth();
  const [receipts, setReceipts] = useState([]);
  const [allReceipts, setAllReceipts] = useState([]);
  const [topDonors, setTopDonors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedText, setCopiedText] = useState('');

  useEffect(() => {
    loadReceipts();
  }, [user]);

  const loadReceipts = async () => {
    try {
      setLoading(true);
      const data = await getReceipts();
      const validData = data || [];
      setAllReceipts(validData);

      // Compute top donors
      const grouped = {};
      validData.forEach(r => {
        if (!grouped[r.name]) grouped[r.name] = 0;
        grouped[r.name] += Number(r.amount || 0);
      });
      const sortedList = Object.entries(grouped)
        .map(([name, amt]) => ({ name, amt }))
        .sort((a, b) => b.amt - a.amt)
        .slice(0, 10);
      setTopDonors(sortedList);

      const mine = (user?.role === 'owner')
        ? validData
        : validData.filter(r => r.contactValue === user?.email || (user?.email && r.name?.toLowerCase().includes(user?.name?.toLowerCase())));
      setReceipts(mine);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(''), 3000);
  };

  const exportToExcel = () => {
    const sorted = [...allReceipts].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    const rows = sorted.map((r, i) => ({
      'S.No': i + 1,
      'Name': r.name,
      'Amount': `₹${Number(r.amount).toLocaleString('en-IN')}`,
      'Reason / Purpose': r.details,
      'Date': new Date(r.createdAt).toLocaleDateString('en-IN')
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Receipts');
    XLSX.writeFile(wb, 'Sasta_Trust_Receipts.xlsx');
  };

  // Filtered for manual search lookup
  const displayedReceipts = (user?.role === 'owner' ? allReceipts : (receipts.length > 0 ? receipts : allReceipts))
    .filter(r => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        r.name?.toLowerCase().includes(q) ||
        r.contactValue?.toLowerCase().includes(q) ||
        r.details?.toLowerCase().includes(q) ||
        r.id?.includes(q)
      );
    });

  return (
    <div style={{ backgroundColor: '#ffffff', minHeight: '100vh', paddingBottom: '90px' }}>
      {/* Header Banner */}
      <section style={{
        padding: '70px 6% 50px',
        borderBottom: '1px solid #eee',
        backgroundColor: '#fafafa'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <p className="kicker" style={{ color: '#888', marginBottom: '10px' }}>
            Donate & Support
          </p>
          <h1 style={{
            fontFamily: 'Libre Baskerville, serif',
            fontSize: 'clamp(2.4rem, 4.5vw, 3.6rem)',
            fontWeight: 700,
            color: '#000000',
            lineHeight: 1.15,
            marginBottom: '14px'
          }}>
            Support Our Sacred Mission
          </h1>
          <p style={{
            fontFamily: 'Inter',
            fontSize: '1.1rem',
            color: '#555',
            maxWidth: '700px'
          }}>
            Your contribution, however small, lights the path of devotion.<br />
            <strong>✦ Swamy Sharanam Ayyappa! ✦</strong>
          </p>
        </div>
      </section>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '60px 6%' }}>
        {/* =========================================================================
            WAYS TO CONTRIBUTE (7 CAUSES)
            ========================================================================= */}
        <section style={{ marginBottom: '80px' }}>
          <h2 style={{
            fontFamily: 'Libre Baskerville, serif',
            fontSize: 'clamp(1.8rem, 3.2vw, 2.4rem)',
            fontWeight: 700,
            color: '#000000',
            marginBottom: '40px'
          }}>
            Ways to Contribute
          </h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '24px'
          }}>
            {categories.map((cat, i) => {
              const IconComponent = cat.Icon;
              return (
                <div
                  key={i}
                  style={{
                    borderRadius: '20px',
                    border: '1px solid #eee',
                    background: '#ffffff',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.03)',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    transition: 'transform 0.2s, box-shadow 0.2s'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-3px)';
                    e.currentTarget.style.boxShadow = '0 16px 36px rgba(0,0,0,0.06)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.03)';
                  }}
                >
                  {cat.images && cat.images.length > 0 && (
                    <AlternatingSlideImage
                      images={cat.images}
                      height="160px"
                      borderRadius="0"
                      showDots={false}
                      alt={cat.title}
                    />
                  )}
                  <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <div style={{
                      width: 44,
                      height: 44,
                      borderRadius: '12px',
                      background: '#000000',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '18px'
                    }}>
                      <IconComponent size={22} />
                    </div>
                  <h3 style={{
                    fontFamily: 'Libre Baskerville, serif',
                    fontSize: '1.2rem',
                    fontWeight: 700,
                    color: '#000000',
                    marginBottom: '10px',
                    lineHeight: 1.3
                  }}>
                    {cat.title}
                  </h3>
                  <p style={{
                    fontFamily: 'Inter',
                    fontSize: '0.92rem',
                    color: '#666666',
                    lineHeight: 1.6,
                    flex: 1
                  }}>
                    {cat.desc}
                  </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* =========================================================================
            PAYMENT MODES: UPI & BANK TRANSFER
            ========================================================================= */}
        <section style={{ marginBottom: '80px' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '30px'
          }}>
            {/* UPI Payment Card */}
            <div style={{
              padding: '36px',
              borderRadius: '24px',
              border: '1px solid #eee',
              background: '#fafafa',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center'
            }}>
              <div style={{
                width: 50,
                height: 50,
                borderRadius: '50%',
                background: '#000',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px'
              }}>
                <Smartphone size={24} />
              </div>
              <h3 style={{ fontFamily: 'Libre Baskerville, serif', fontSize: '1.5rem', fontWeight: 700, marginBottom: '8px' }}>
                UPI Payments
              </h3>
              <p style={{ fontFamily: 'Inter', fontSize: '0.9rem', color: '#666', marginBottom: '20px' }}>
                Scan with any UPI App (GPay, PhonePe, Paytm, BHIM)
              </p>

              {/* QR Code Preview */}
              <div
                onClick={() => setIsQRModalOpen(true)}
                style={{
                  padding: '12px',
                  background: '#ffffff',
                  borderRadius: '16px',
                  border: '1px solid #e5e7eb',
                  cursor: 'pointer',
                  boxShadow: '0 8px 20px rgba(0,0,0,0.06)',
                  marginBottom: '20px'
                }}
                title="Click to zoom QR Code"
              >
                <img
                  src="/QRcode/QRCode.png"
                  alt="UPI QR Code"
                  style={{ width: 170, height: 170, objectFit: 'contain', display: 'block' }}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://api.qrserver.com/v1/create-qr-code/?size=170x170&data=upi://pay?pa=sastatrust@upi&pn=Sasta%20Trust';
                  }}
                />
              </div>

              {/* UPI ID Pill with Copy */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                background: '#ffffff',
                border: '1px solid #d1d5db',
                borderRadius: '30px',
                padding: '8px 18px'
              }}>
                <span style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: '0.95rem', color: '#111' }}>
                  sastatrust@upi
                </span>
                <button
                  onClick={() => copyToClipboard('sastatrust@upi')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#555', display: 'flex' }}
                  title="Copy UPI ID"
                >
                  <Copy size={16} />
                </button>
              </div>

              {copiedText === 'sastatrust@upi' && (
                <span style={{ fontFamily: 'Inter', fontSize: '0.78rem', color: '#16a34a', marginTop: '8px' }}>
                  ✓ Copied to clipboard!
                </span>
              )}
            </div>

            {/* Bank Transfer Card */}
            <div style={{
              padding: '36px',
              borderRadius: '24px',
              border: '1px solid #eee',
              background: '#fafafa',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <div style={{
                width: 50,
                height: 50,
                borderRadius: '50%',
                background: '#000',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px'
              }}>
                <Building2 size={24} />
              </div>
              <h3 style={{ fontFamily: 'Libre Baskerville, serif', fontSize: '1.5rem', fontWeight: 700, marginBottom: '8px' }}>
                Bank Transfer
              </h3>
              <p style={{ fontFamily: 'Inter', fontSize: '0.9rem', color: '#666', marginBottom: '24px' }}>
                Direct NEFT / RTGS / IMPS donation to Trust account:
              </p>

              <div style={{
                background: '#ffffff',
                borderRadius: '16px',
                padding: '20px',
                border: '1px solid #e5e7eb',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
                fontFamily: 'Inter',
                fontSize: '0.92rem',
                flex: 1
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f3f4f6', paddingBottom: '10px' }}>
                  <span style={{ color: '#777' }}>A/C Name:</span>
                  <strong style={{ color: '#000' }}>Sasta Trust</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f3f4f6', paddingBottom: '10px' }}>
                  <span style={{ color: '#777' }}>A/C No:</span>
                  <strong style={{ color: '#000' }}>XXXXXXXXXXXX</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f3f4f6', paddingBottom: '10px' }}>
                  <span style={{ color: '#777' }}>IFSC:</span>
                  <strong style={{ color: '#000' }}>XXXXX000XXXX</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '4px' }}>
                  <span style={{ color: '#777' }}>Branch:</span>
                  <strong style={{ color: '#000' }}>Hyderabad / Kerala</strong>
                </div>
              </div>

              {/* Contact Us note */}
              <div style={{ marginTop: '24px', paddingTop: '18px', borderTop: '1px solid #e5e7eb' }}>
                <h4 style={{ fontFamily: 'Inter', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
                  Contact Us
                </h4>
                <p style={{ fontFamily: 'Inter', fontSize: '0.88rem', color: '#555', margin: 0 }}>
                  Phone: <a href="tel:+919391672398" style={{ textDecoration: 'underline', color: '#000' }}>+91 93916 72398</a><br />
                  Email: <a href="mailto:sastatrust@gmail.com" style={{ textDecoration: 'underline', color: '#000' }}>sastatrust@gmail.com</a>
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            TOP 10 DEVOTEE DONORS LEADERBOARD
            ========================================================================= */}
        <section style={{ marginBottom: '80px' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div>
              <h2 style={{ fontFamily: 'Libre Baskerville, serif', fontSize: '1.8rem', fontWeight: 700, color: '#000' }}>
                Top 10 Devotee Donors
              </h2>
              <p style={{ fontFamily: 'Inter', fontSize: '0.9rem', color: '#666' }}>
                Honoring generous souls whose offerings empower our continuous Anna Prasadam Seva.
              </p>
            </div>

            {user?.role === 'owner' && allReceipts.length > 0 && (
              <button
                onClick={exportToExcel}
                className="pill-btn pill-btn-outline pill-btn-sm"
              >
                <FileSpreadsheet size={15} /> Export Receipts (Excel)
              </button>
            )}
          </div>

          {topDonors.length > 0 ? (
            <div style={{
              borderRadius: '20px',
              border: '1px solid #eee',
              overflow: 'hidden',
              background: '#ffffff',
              boxShadow: '0 8px 24px rgba(0,0,0,0.03)'
            }}>
              {topDonors.map((donor, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '16px 24px',
                    borderBottom: idx === topDonors.length - 1 ? 'none' : '1px solid #f3f4f6',
                    background: idx === 0 ? '#fffbeb' : idx === 1 ? '#f8fafc' : '#ffffff'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <span style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      background: idx < 3 ? '#000000' : '#f3f4f6',
                      color: idx < 3 ? '#ffffff' : '#666666',
                      fontFamily: 'Inter',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {idx + 1}
                    </span>
                    <span style={{ fontFamily: 'Libre Baskerville, serif', fontWeight: 700, fontSize: '1rem', color: '#000' }}>
                      {donor.name}
                    </span>
                  </div>
                  <strong style={{ fontFamily: 'Inter', fontSize: '1rem', color: '#000' }}>
                    ₹{Number(donor.amt).toLocaleString('en-IN')}
                  </strong>
                </div>
              ))}
            </div>
          ) : (
            <div style={{
              padding: '50px 20px',
              textAlign: 'center',
              background: '#fafafa',
              borderRadius: '20px',
              border: '1px dashed #d1d5db',
              color: '#777'
            }}>
              <Trophy size={40} color="#9ca3af" style={{ margin: '0 auto 12px' }} />
              <p style={{ fontFamily: 'Inter', fontSize: '0.95rem' }}>
                No donation records found yet.
              </p>
            </div>
          )}
        </section>

        {/* =========================================================================
            MY RECEIPTS (LOOKUP & OFFICIAL RECEIPTS LIST)
            ========================================================================= */}
        <section id="my-receipts">
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px',
            flexWrap: 'wrap',
            gap: '16px'
          }}>
            <div>
              <h2 style={{ fontFamily: 'Libre Baskerville, serif', fontSize: '1.8rem', fontWeight: 700, color: '#000' }}>
                My Receipts
              </h2>
              <p style={{ fontFamily: 'Inter', fontSize: '0.88rem', color: '#888', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                SEVA IS WORSHIP — SERVICE IS TRADITION
              </p>
            </div>

            {/* Search Input */}
            <div style={{ position: 'relative', minWidth: '280px' }}>
              <Search size={16} color="#888" style={{ position: 'absolute', left: 14, top: 12 }} />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 16px 9px 40px',
                  borderRadius: '30px',
                  border: '1px solid #d1d5db',
                  fontFamily: 'Inter',
                  fontSize: '0.88rem',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          <p style={{ fontFamily: 'Libre Baskerville, serif', fontStyle: 'italic', fontSize: '0.98rem', color: '#555', marginBottom: '28px' }}>
            With blessings of Lord Dharma Sasta, Sasta Trust continues its humble journey of devotion and service.
          </p>

          {displayedReceipts.length > 0 ? (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '24px'
            }}>
              {displayedReceipts.map((rcpt) => (
                <div
                  key={rcpt.id}
                  style={{
                    padding: '24px',
                    borderRadius: '20px',
                    border: '1px solid #eee',
                    background: '#ffffff',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.03)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <span style={{
                        padding: '4px 10px',
                        background: '#f3f4f6',
                        borderRadius: '12px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        color: '#555'
                      }}>
                        Receipt #{rcpt.id}
                      </span>
                      <span style={{ fontFamily: 'Inter', fontSize: '0.8rem', color: '#888' }}>
                        {rcpt.date || new Date(rcpt.createdAt).toLocaleDateString('en-IN')}
                      </span>
                    </div>

                    <h4 style={{ fontFamily: 'Libre Baskerville, serif', fontSize: '1.25rem', fontWeight: 700, color: '#000', marginBottom: '6px' }}>
                      {rcpt.name}
                    </h4>

                    <p style={{ fontFamily: 'Inter', fontSize: '0.88rem', color: '#666', marginBottom: '16px' }}>
                      Purpose: {rcpt.details || 'Anna Prasadam Seva'}
                    </p>
                  </div>

                  <div style={{
                    borderTop: '1px solid #f3f4f6',
                    paddingTop: '16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <strong style={{ fontFamily: 'Inter', fontSize: '1.2rem', color: '#111' }}>
                      ₹{Number(rcpt.amount).toLocaleString('en-IN')}
                    </strong>

                    <button
                      onClick={() => alert(`Receipt #${rcpt.id} verified: Sasta Trust Official Record`)}
                      className="pill-btn pill-btn-black pill-btn-sm"
                    >
                      <Receipt size={14} /> Official Receipt
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{
              padding: '60px 20px',
              textAlign: 'center',
              background: '#fafafa',
              borderRadius: '20px',
              border: '1px dashed #d1d5db'
            }}>
              <Receipt size={44} color="#9ca3af" style={{ margin: '0 auto 12px' }} />
              <h3 style={{ fontFamily: 'Libre Baskerville, serif', fontSize: '1.3rem', color: '#111', marginBottom: '6px' }}>
                No receipts found
              </h3>
              <p style={{ fontFamily: 'Inter', color: '#666', fontSize: '0.9rem' }}>
                {searchQuery ? 'Try searching with a different name or contact value.' : 'Donations made under your email will appear here automatically.'}
              </p>
            </div>
          )}
        </section>
      </div>

      {/* QR Code Zoom Modal */}
      <AnimatePresence>
        {isQRModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsQRModalOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 99999,
              background: 'rgba(0,0,0,0.85)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px'
            }}
          >
            <div
              onClick={e => e.stopPropagation()}
              style={{
                background: '#ffffff',
                borderRadius: '24px',
                padding: '36px',
                maxWidth: '420px',
                width: '100%',
                textAlign: 'center',
                position: 'relative'
              }}
            >
              <button
                onClick={() => setIsQRModalOpen(false)}
                style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#666'
                }}
              >
                <X size={20} />
              </button>

              <h3 style={{ fontFamily: 'Libre Baskerville', fontSize: '1.4rem', marginBottom: '6px' }}>
                Sasta Trust UPI QR
              </h3>
              <p style={{ fontFamily: 'Inter', fontSize: '0.85rem', color: '#666', marginBottom: '20px' }}>
                Scan to contribute directly for Anna Prasadam Seva
              </p>

              <img
                src="/QRcode/QRCode.png"
                alt="UPI QR Code"
                style={{ width: '100%', maxWidth: '260px', height: 'auto', margin: '0 auto 20px', display: 'block' }}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=upi://pay?pa=sastatrust@upi&pn=Sasta%20Trust';
                }}
              />

              <div style={{
                background: '#f3f4f6',
                borderRadius: '30px',
                padding: '8px 16px',
                fontFamily: 'Inter',
                fontWeight: 600,
                fontSize: '0.9rem',
                marginBottom: '16px'
              }}>
                sastatrust@upi
              </div>

              <button
                onClick={() => copyToClipboard('sastatrust@upi')}
                className="pill-btn pill-btn-black pill-btn-sm"
              >
                <Copy size={14} /> Copy UPI ID
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
