import React, { useEffect, useState } from 'react';
import { getOccasions } from '../services/db';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar as CalendarIcon, Image as ImageIcon, LayoutGrid, CalendarDays, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

const STATUS_CONFIG = {
  present: { label: 'Today', color: '#1A0A2E', bg: 'linear-gradient(135deg, #D4AF37, #F4D03F)', border: '#D4AF37' },
  future: { label: 'Upcoming', color: '#4A2C8A', bg: '#EDE5FF', border: '#6B3FA0' },
  past: { label: 'Past', color: '#7B6B8A', bg: '#F3EDE4', border: '#D5CFC6' },
};

export const Dashboard = () => {
  const [occasions, setOccasions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => { loadOccasions(); }, []);

  const loadOccasions = async () => {
    try {
      setLoading(true);
      const data = await getOccasions();
      setOccasions(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const getStatus = (dateStr) => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const date = new Date(dateStr);
    const diff = Math.ceil((date - today) / 86400000);
    if (diff === 0) return 'present';
    if (diff > 0) return 'future';
    return 'past';
  };

  const filtered = occasions.filter(o => filter === 'all' || getStatus(o.date) === filter)
    .sort((a, b) => {
      const order = { present: 0, future: 1, past: 2 };
      if (filter === 'all') return order[getStatus(a.date)] - order[getStatus(b.date)];
      return new Date(b.date) - new Date(a.date);
    });

  const occasionsOnSelectedDate = occasions.filter(o =>
    new Date(o.date).toDateString() === selectedDate.toDateString()
  );

  const tileContent = ({ date, view }) => {
    if (view === 'month') {
      const has = occasions.some(o => new Date(o.date).toDateString() === date.toDateString());
      return has ? <div className="calendar-dot" /> : null;
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '1.5rem' }}>
        <div className="loader" style={{ width: 48, height: 48 }} />
        <p style={{ color: 'var(--gold-primary)', fontFamily: 'Cinzel, serif', letterSpacing: '0.1em', textTransform: 'uppercase', fontSize: '0.8rem' }}>Loading Sacred Calendar</p>
      </div>
    );
  }

  return (
    <div style={{ background: 'var(--bg-primary)', minHeight: '100vh' }}>
      {/* Page Header */}
      <div className="sacred-border" style={{ background: 'linear-gradient(135deg, var(--purple-dark), var(--purple-royal))', padding: '3rem 0 0' }}>
        <div className="container" style={{ maxWidth: 1100 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1.5rem', paddingBottom: '2rem' }}>
            <div>
              <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.75rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(212,175,55,0.6)', fontWeight: 600, marginBottom: '0.5rem' }}>
                Sacred Calendar
              </p>
              <h1 style={{ fontFamily: 'Cinzel, serif', fontSize: 'clamp(1.6rem, 4vw, 2.2rem)', fontWeight: 700, color: '#D4AF37', margin: 0, letterSpacing: '0.04em' }}>
                Festivals & Occasions
              </h1>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              {viewMode === 'grid' && (
                <div style={{ display: 'flex', borderRadius: 'var(--radius-md)', overflow: 'hidden', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(212,175,55,0.15)' }}>
                  {['all', 'present', 'future', 'past'].map(f => (
                    <button key={f} onClick={() => setFilter(f)} style={{
                      padding: '0.5rem 1.1rem', border: 'none', cursor: 'pointer',
                      fontFamily: 'DM Sans, sans-serif', fontSize: '0.78rem', fontWeight: 600,
                      letterSpacing: '0.04em', textTransform: 'uppercase',
                      background: filter === f ? 'linear-gradient(135deg, #D4AF37, #F4D03F)' : 'transparent',
                      color: filter === f ? '#1A0A2E' : 'rgba(255,255,255,0.5)',
                      transition: 'all 0.2s',
                      borderRight: f !== 'past' ? '1px solid rgba(212,175,55,0.1)' : 'none',
                    }}>
                      {f === 'all' ? 'All' : STATUS_CONFIG[f].label}
                    </button>
                  ))}
                </div>
              )}

              <div style={{ display: 'flex', borderRadius: 'var(--radius-md)', overflow: 'hidden', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(212,175,55,0.15)' }}>
                {[
                  { mode: 'grid', Icon: LayoutGrid, label: 'Grid' },
                  { mode: 'calendar', Icon: CalendarDays, label: 'Calendar' },
                ].map(({ mode, Icon, label }) => (
                  <button key={mode} onClick={() => setViewMode(mode)} style={{
                    display: 'flex', alignItems: 'center', gap: '0.4rem',
                    padding: '0.5rem 1rem', border: 'none',
                    borderRight: mode === 'grid' ? '1px solid rgba(212,175,55,0.1)' : 'none',
                    cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: '0.78rem',
                    fontWeight: 600, letterSpacing: '0.03em', textTransform: 'uppercase',
                    background: viewMode === mode ? 'linear-gradient(135deg, #D4AF37, #F4D03F)' : 'transparent',
                    color: viewMode === mode ? '#1A0A2E' : 'rgba(255,255,255,0.5)',
                    transition: 'all 0.2s',
                  }}>
                    <Icon size={14} /> {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container" style={{ maxWidth: 1100, padding: '2.5rem 24px' }}>
        {viewMode === 'calendar' ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: '2rem' }}>
            <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(45,27,105,0.06)', padding: '1.5rem', boxShadow: 'var(--shadow-sm)' }}>
              <Calendar onChange={setSelectedDate} value={selectedDate} tileContent={tileContent} />
            </div>
            <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(45,27,105,0.06)', padding: '2rem', boxShadow: 'var(--shadow-sm)', position: 'relative' }}>
              <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 60, height: 3, background: 'linear-gradient(90deg, #D4AF37, #F4D03F)', borderRadius: '0 0 3px 3px' }} />
              <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.72rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-tertiary)', fontWeight: 600, marginBottom: '0.5rem' }}>
                {selectedDate.toLocaleDateString('en-IN', { weekday: 'long' })}
              </p>
              <h3 style={{ fontFamily: 'Cinzel, serif', fontSize: '1.3rem', color: 'var(--text-primary)', margin: '0 0 1.5rem', letterSpacing: '0.03em' }}>
                {selectedDate.toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
              </h3>
              <div style={{ height: 1, background: 'linear-gradient(90deg, var(--gold-primary), transparent)', marginBottom: '1.5rem', opacity: 0.3 }} />
              {occasionsOnSelectedDate.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-tertiary)' }}>
                  <CalendarIcon size={32} style={{ opacity: 0.15, marginBottom: '0.75rem' }} />
                  <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.9rem' }}>No occasions on this date</p>
                </div>
              ) : occasionsOnSelectedDate.map(occ => (
                <Link key={occ.id} to={`/occasion/${occ.id}`} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '1rem 1.25rem', marginBottom: '0.75rem', borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-primary)', textDecoration: 'none', color: 'inherit',
                  borderLeft: '3px solid var(--gold-primary)', transition: 'all 0.2s',
                }}
                  onMouseOver={e => { e.currentTarget.style.background = 'var(--purple-faint)'; e.currentTarget.style.borderLeftColor = 'var(--purple-royal)'; }}
                  onMouseOut={e => { e.currentTarget.style.background = 'var(--bg-primary)'; e.currentTarget.style.borderLeftColor = 'var(--gold-primary)'; }}
                >
                  <div>
                    <h4 style={{ fontFamily: 'Cinzel, serif', fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 0.25rem' }}>{occ.title}</h4>
                    <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.8rem', color: 'var(--text-tertiary)', margin: 0 }}>Click to view details</p>
                  </div>
                  <ChevronRight size={16} color="var(--gold-primary)" />
                </Link>
              ))}
            </div>
          </div>
        ) : (
          <>
            {filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '5rem 2rem', background: 'white', border: '1px solid rgba(45,27,105,0.06)', borderRadius: 'var(--radius-lg)' }}>
                <CalendarIcon size={40} style={{ opacity: 0.1, marginBottom: '1rem', display: 'block', margin: '0 auto 1rem', color: 'var(--gold-primary)' }} />
                <h3 style={{ fontFamily: 'Cinzel, serif', color: 'var(--text-tertiary)', fontWeight: 600 }}>No festivals found</h3>
                <p style={{ fontFamily: 'DM Sans, sans-serif', color: 'var(--text-tertiary)', fontSize: '0.9rem' }}>Try changing the filter above.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.75rem' }}>
                <AnimatePresence>
                  {filtered.map((occ, idx) => {
                    const status = getStatus(occ.date);
                    const sc = STATUS_CONFIG[status];
                    const hasMedia = occ.media && occ.media.length > 0;
                    const src = hasMedia ? occ.media[0] : null;
                    const isYT = src && (src.includes('youtube.com') || src.includes('youtu.be'));
                    let ytId = '';
                    if (isYT) ytId = src.includes('v=') ? src.split('v=')[1].split('&')[0] : src.split('youtu.be/')[1]?.split('?')[0];

                    return (
                      <motion.div key={occ.id}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.4, delay: idx * 0.06 }}
                      >
                        <Link to={`/occasion/${occ.id}`} style={{
                          display: 'flex', flexDirection: 'column', textDecoration: 'none', color: 'inherit',
                          background: 'white', borderRadius: 'var(--radius-lg)',
                          overflow: 'hidden', height: '100%', transition: 'all 0.3s',
                          boxShadow: 'var(--shadow-sm)', border: '1px solid rgba(45,27,105,0.05)',
                          position: 'relative'
                        }}
                          onMouseOver={e => { e.currentTarget.style.boxShadow = '0 8px 30px rgba(212,175,55,0.15), var(--shadow-md)'; e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.borderColor = 'rgba(212,175,55,0.3)'; }}
                          onMouseOut={e => { e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'rgba(45,27,105,0.05)'; }}
                        >
                          {/* Temple arch top */}
                          <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 50, height: 3, background: 'linear-gradient(90deg, #D4AF37, #F4D03F, #D4AF37)', borderRadius: '0 0 3px 3px', zIndex: 2 }} />

                          {/* Media Thumbnail with golden overlay */}
                          <div style={{ height: 200, background: 'linear-gradient(135deg, var(--purple-dark), var(--purple-royal))', position: 'relative', overflow: 'hidden' }}>
                            {isYT
                              ? <img src={`https://img.youtube.com/vi/${ytId}/hqdefault.jpg`} alt={occ.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              : src
                                ? <img src={src} alt={occ.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ImageIcon size={36} color="rgba(212,175,55,0.3)" /></div>
                            }
                            {/* Golden overlay gradient */}
                            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 50%, rgba(26,10,46,0.6) 100%)' }} />

                            {/* Status badge — styled like temple flag */}
                            <div style={{
                              position: 'absolute', top: 12, right: 12,
                              background: sc.bg, color: sc.color,
                              padding: '4px 12px', borderRadius: 'var(--radius-full)',
                              fontFamily: 'DM Sans, sans-serif', fontSize: '0.68rem',
                              fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
                              boxShadow: status === 'present' ? '0 2px 10px rgba(212,175,55,0.4)' : 'var(--shadow-sm)'
                            }}>
                              {sc.label}
                            </div>
                          </div>

                          {/* Card Body */}
                          <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.6rem', color: 'var(--gold-dark)', fontFamily: 'DM Sans, sans-serif', fontSize: '0.76rem', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                              <CalendarIcon size={12} />
                              {new Date(occ.date).toLocaleDateString('en-IN', { dateStyle: 'long' })}
                            </div>
                            <h3 style={{ fontFamily: 'Cinzel, serif', fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 0.75rem', lineHeight: 1.4, letterSpacing: '0.02em' }}>{occ.title}</h3>
                            <div style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.7, flex: 1, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', fontFamily: 'DM Sans, sans-serif' }} dangerouslySetInnerHTML={{ __html: occ.content }} />
                            <div style={{ marginTop: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--gold-primary)', fontFamily: 'DM Sans, sans-serif', fontSize: '0.82rem', fontWeight: 700, letterSpacing: '0.02em' }}>
                              View Details <ChevronRight size={14} />
                            </div>
                          </div>
                        </Link>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
