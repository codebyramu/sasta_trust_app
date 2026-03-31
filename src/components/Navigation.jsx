import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn, LogOut, Menu, Bell, Calendar, Receipt, X, ChevronRight, Dot, Crown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getReceipts, getOccasions } from '../services/db';

export const Navigation = () => {
  const { user, loginWithGoogle, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotifyOpen, setIsNotifyOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const notifyRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifyRef.current && !notifyRef.current.contains(e.target)) setIsNotifyOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchUpdates = async () => {
      try {
        const [receiptsData, occasionsData] = await Promise.all([getReceipts(), getOccasions()]);
        let combined = [];
        occasionsData.forEach(occ => {
          combined.push({ type: 'occasion', id: occ.id, title: occ.title, date: new Date(occ.createdAt), link: `/occasion/${occ.id}`, icon: <Calendar size={16} color="var(--gold-primary)" /> });
        });
        const myReceipts = user?.role === 'owner' ? receiptsData : receiptsData.filter(r => r.contactValue === user?.email);
        myReceipts.forEach(rcpt => {
          combined.push({ type: 'receipt', id: rcpt.id, title: user?.role === 'owner' ? `Receipt generated for ${rcpt.name}` : 'Your official receipt is ready!', amount: rcpt.amount, date: new Date(rcpt.createdAt), link: '/donations', icon: <Receipt size={16} color="var(--success)" /> });
        });
        combined.sort((a, b) => b.date - a.date);
        setNotifications(combined.slice(0, 15));
        const lastSeen = parseInt(localStorage.getItem(`sasta_last_notify_${user?.email || 'guest'}`) || '0');
        setUnreadCount(combined.filter(n => n.date.getTime() > lastSeen).length);
      } catch (e) { console.error(e); }
    };
    fetchUpdates();
    const interval = setInterval(fetchUpdates, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const toggleNotifications = () => {
    if (!isNotifyOpen) {
      localStorage.setItem(`sasta_last_notify_${user?.email || 'guest'}`, Date.now().toString());
      setUnreadCount(0);
    }
    setIsNotifyOpen(!isNotifyOpen);
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav style={{
      padding: '0.75rem 0',
      background: 'rgba(26, 10, 46, 0.85)',
      backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
      position: 'sticky', top: 0, zIndex: 1000,
      borderBottom: '1px solid rgba(212, 175, 55, 0.15)',
      boxShadow: '0 4px 30px rgba(0, 0, 0, 0.2)'
    }}>
      <div className="container justify-between items-center flex">
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', textDecoration: 'none' }}>
          <div style={{
            padding: '3px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #D4AF37, #F4D03F, #D4AF37)',
            boxShadow: '0 0 20px rgba(212, 175, 55, 0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <div style={{ borderRadius: '50%', overflow: 'hidden', width: 36, height: 36 }}>
              <img src="/sasta_logo.png" alt="Sasta Trust Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          </div>
          <span style={{
            fontFamily: 'Cinzel, serif', fontWeight: 800, fontSize: '1.2rem', letterSpacing: '0.06em',
            background: 'linear-gradient(135deg, #D4AF37, #F4D03F)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
          }}>Sasta Trust</span>
        </Link>

        {/* DESKTOP NAV */}
        <div className="desktop-nav" style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          {[
            { path: '/', label: 'Home' },
            { path: '/dashboard', label: 'Occasions' },
            { path: '/donations', label: 'Donate & Receipts' },
          ].map(nav => (
            <Link key={nav.path} to={nav.path} className="nav-link" data-active={isActive(nav.path)}>
              {nav.label}
            </Link>
          ))}

          {user?.role === 'owner' && (
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                style={{
                  background: 'linear-gradient(135deg, rgba(212,175,55,0.15), rgba(212,175,55,0.05))',
                  border: '1px solid rgba(212,175,55,0.3)', borderRadius: 'var(--radius-full)',
                  cursor: 'pointer', fontWeight: 700, color: '#D4AF37',
                  display: 'flex', alignItems: 'center', gap: '0.4rem',
                  padding: '0.4rem 1rem', fontFamily: 'DM Sans, sans-serif',
                  fontSize: '0.82rem', letterSpacing: '0.04em', textTransform: 'uppercase'
                }}
              >
                <Crown size={14} /> Admin <Menu size={14} />
              </button>
              <AnimatePresence>
                {isDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    style={{
                      position: 'absolute', top: '100%', right: 0, marginTop: '8px',
                      background: 'var(--purple-dark)', borderRadius: 'var(--radius-lg)',
                      boxShadow: '0 15px 40px rgba(0,0,0,0.4)', padding: '8px',
                      minWidth: '200px', display: 'flex', flexDirection: 'column', gap: '4px',
                      border: '1px solid rgba(212,175,55,0.2)'
                    }}
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    <Link to="/admin" className="dropdown-item">Manage Occasions</Link>
                    <Link to="/admin/receipt" className="dropdown-item">Send Receipt</Link>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          <div style={{ position: 'relative' }} ref={notifyRef}>
            <button onClick={toggleNotifications} style={{
              position: 'relative', background: 'rgba(212,175,55,0.1)',
              border: '1px solid rgba(212,175,55,0.2)', borderRadius: '50%',
              width: '40px', height: '40px', display: 'flex', alignItems: 'center',
              justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s'
            }}>
              <Bell size={18} color={unreadCount > 0 ? '#D4AF37' : 'rgba(255,255,255,0.5)'} />
              {unreadCount > 0 && (
                <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} style={{
                  position: 'absolute', top: '-4px', right: '-4px',
                  background: 'linear-gradient(135deg, #D4AF37, #F4D03F)', color: '#1A0A2E',
                  borderRadius: '50%', width: '20px', height: '20px', fontSize: '0.7rem',
                  fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: '2px solid var(--purple-dark)'
                }}>{unreadCount}</motion.span>
              )}
            </button>

            {/* NOTIFICATION POPOVER */}
            <AnimatePresence>
              {isNotifyOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 15, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 15, scale: 0.95 }}
                  style={{
                    position: 'absolute', top: '100%', right: -60, marginTop: '12px',
                    width: '340px', background: 'var(--purple-dark)', borderRadius: 'var(--radius-xl)',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                    border: '1px solid rgba(212,175,55,0.15)', overflow: 'hidden'
                  }}
                >
                  <div style={{
                    padding: '1.25rem', borderBottom: '1px solid rgba(212,175,55,0.1)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    background: 'rgba(212,175,55,0.05)'
                  }}>
                    <h4 style={{ margin: 0, color: '#D4AF37', fontFamily: 'Cinzel, serif', fontSize: '0.95rem' }}>Latest Updates</h4>
                    <button onClick={() => setIsNotifyOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)' }}><X size={18} /></button>
                  </div>
                  <div style={{ maxHeight: '400px', overflowY: 'auto', padding: '0.5rem' }}>
                    {notifications.length > 0 ? notifications.map((n, i) => (
                      <Link key={i} to={n.link} onClick={() => setIsNotifyOpen(false)}
                        style={{
                          display: 'flex', gap: '1rem', padding: '1rem', borderRadius: 'var(--radius-lg)',
                          textDecoration: 'none', transition: 'all 0.2s',
                          borderBottom: i === notifications.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.05)'
                        }}
                        onMouseOver={e => e.currentTarget.style.background = 'rgba(212,175,55,0.08)'}
                        onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(212,175,55,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {n.icon}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.85rem', fontWeight: 600, lineHeight: 1.4, marginBottom: '0.25rem' }}>{n.title}</div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)' }}>{n.date.toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                            <ChevronRight size={14} color="rgba(212,175,55,0.5)" />
                          </div>
                        </div>
                      </Link>
                    )) : (
                      <div style={{ padding: '3rem 1rem', textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>
                        <Dot size={48} style={{ margin: '0 auto', opacity: 0.2 }} />
                        <p style={{ fontSize: '0.9rem' }}>No recent updates</p>
                      </div>
                    )}
                  </div>
                  <div style={{ padding: '1rem', textAlign: 'center', background: 'rgba(212,175,55,0.05)', borderTop: '1px solid rgba(212,175,55,0.1)' }}>
                    <Link to="/dashboard" onClick={() => setIsNotifyOpen(false)} style={{ fontSize: '0.85rem', color: '#D4AF37', fontWeight: 700, textDecoration: 'none', fontFamily: 'Cinzel, serif' }}>View All Festivals</Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div style={{ height: '24px', width: '1px', background: 'rgba(212,175,55,0.2)' }} />

          {!user ? (
            <button onClick={() => loginWithGoogle()} className="btn btn-primary" style={{ padding: '0.5rem 1.25rem', fontSize: '0.82rem', borderRadius: 'var(--radius-full)' }}>
              <LogIn size={16} /> Login
            </button>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '0.6rem',
                padding: '0.35rem 0.85rem', background: 'rgba(212,175,55,0.08)',
                borderRadius: 'var(--radius-full)', border: '1px solid rgba(212,175,55,0.15)'
              }}>
                <img src={user.picture || 'https://ui-avatars.com/api/?name=User'} alt="Profile" style={{ width: 26, height: 26, borderRadius: '50%', border: '2px solid rgba(212,175,55,0.3)' }} />
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'rgba(255,255,255,0.85)', fontFamily: 'DM Sans, sans-serif' }}>{user.name?.split(' ')[0]}</span>
              </div>
              <button onClick={logout} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', padding: '5px' }} title="Logout">
                <LogOut size={18} />
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .nav-link {
          font-family: 'DM Sans', sans-serif;
          font-weight: 500;
          font-size: 0.82rem;
          color: rgba(255,255,255,0.55);
          text-decoration: none;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          padding: 6px 0;
          position: relative;
          transition: color 0.3s;
        }
        .nav-link::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          width: 0;
          height: 2px;
          background: linear-gradient(90deg, #D4AF37, #F4D03F);
          border-radius: 2px;
          transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .nav-link:hover { color: #D4AF37; }
        .nav-link:hover::after, .nav-link[data-active="true"]::after { width: 100%; }
        .nav-link[data-active="true"] { color: #D4AF37; font-weight: 700; }
        .dropdown-item {
          padding: 10px 16px;
          border-radius: var(--radius-md);
          color: rgba(255,255,255,0.7);
          text-decoration: none;
          font-family: 'DM Sans', sans-serif;
          font-weight: 500;
          font-size: 0.82rem;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          transition: background 0.2s, color 0.2s;
          display: block;
        }
        .dropdown-item:hover { background: rgba(212,175,55,0.1); color: #D4AF37; }
      `}</style>
    </nav>
  );
};
