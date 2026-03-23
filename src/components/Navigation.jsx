import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn, LogOut, Menu, Bell, Calendar, Receipt, X, ChevronRight, Dot } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getReceipts, getOccasions } from '../services/db';

export const Navigation = () => {
  const { user, loginWithGoogle, logout } = useAuth();
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotifyOpen, setIsNotifyOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const notifyRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
        if (notifyRef.current && !notifyRef.current.contains(e.target)) {
            setIsNotifyOpen(false);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch all updates (Occasions + Receipts)
  useEffect(() => {
    const fetchUpdates = async () => {
      try {
        const [receiptsData, occasionsData] = await Promise.all([getReceipts(), getOccasions()]);
        
        let combined = [];

        // 1. Process Occasions (Public)
        occasionsData.forEach(occ => {
            combined.push({
                type: 'occasion',
                id: occ.id,
                title: occ.title,
                date: new Date(occ.createdAt),
                link: `/occasion/${occ.id}`,
                icon: <Calendar size={16} color="var(--accent-primary)" />
            });
        });

        // 2. Process Receipts (Private to user or Global if owner)
        const myReceipts = user?.role === 'owner' ? receiptsData : receiptsData.filter(r => r.contactValue === user?.email);
        myReceipts.forEach(rcpt => {
            combined.push({
                type: 'receipt',
                id: rcpt.id,
                title: user?.role === 'owner' ? `Receipt generated for ${rcpt.name}` : 'Your official receipt is ready!',
                amount: rcpt.amount,
                date: new Date(rcpt.createdAt),
                link: '/donations',
                icon: <Receipt size={16} color="#4ade80" />
            });
        });

        // Sort by date descending
        combined.sort((a, b) => b.date - a.date);
        setNotifications(combined.slice(0, 15)); // Latest 15

        // Calculate unread (those since last bell click)
        const lastSeen = parseInt(localStorage.getItem(`sasta_last_notify_${user?.email || 'guest'}`) || '0');
        const count = combined.filter(n => n.date.getTime() > lastSeen).length;
        setUnreadCount(count);
      } catch (e) { console.error(e); }
    };

    fetchUpdates();
    const interval = setInterval(fetchUpdates, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, [user]);

  const toggleNotifications = () => {
    if (!isNotifyOpen) {
        localStorage.setItem(`sasta_last_notify_${user?.email || 'guest'}`, Date.now().toString());
        setUnreadCount(0);
    }
    setIsNotifyOpen(!isNotifyOpen);
  };

  return (
    <nav style={{ padding: '0.8rem 0', background: 'white', position: 'sticky', top: 0, zIndex: 1000, borderBottom: '1px solid var(--bg-tertiary)', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
      <div className="container justify-between items-center flex">
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-primary)', textDecoration: 'none' }}>
           <div style={{ padding: '6px', background: 'var(--accent-light)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
             <img src="/sasta_logo.png" alt="Sasta Trust Logo" style={{ width: 30, height: 30, objectFit: 'cover', borderRadius: '6px' }} />
           </div>
           <span style={{ fontWeight: 800, fontSize: '1.2rem', letterSpacing: '-0.02em' }}>Sasta Trust</span>
        </Link>

        {/* DESKTOP NAV */}
        <div className="desktop-nav" style={{ display: 'flex', gap: '1.75rem', alignItems: 'center' }}>
          <Link to="/" className="nav-link">Home</Link>
          <Link to="/dashboard" className="nav-link">Occasions</Link>
          <Link to="/donations" className="nav-link">Donate & Receipts</Link>

          {user?.role === 'owner' && (
             <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                >
                  Admin <Menu size={16} />
                </button>
                <AnimatePresence>
                  {isDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      style={{ position: 'absolute', top: '100%', right: 0, marginTop: '8px', background: 'white', borderRadius: '14px', boxShadow: '0 10px 30px rgba(0,0,0,0.12)', padding: '8px', minWidth: '190px', display: 'flex', flexDirection: 'column', gap: '4px', border: '1px solid var(--bg-tertiary)' }}
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
            <button
                onClick={toggleNotifications}
                style={{ position: 'relative', background: 'var(--bg-secondary)', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }}
            >
                <Bell size={20} color={unreadCount > 0 ? 'var(--accent-primary)' : 'var(--text-secondary)'} />
                {unreadCount > 0 && (
                    <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} style={{ position: 'absolute', top: '-2px', right: '-2px', background: '#e74c3c', color: 'white', borderRadius: '50%', width: '20px', height: '20px', fontSize: '0.7rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid white' }}>
                    {unreadCount}
                    </motion.span>
                )}
            </button>

            {/* NOTIFICATION POPOVER */}
            <AnimatePresence>
               {isNotifyOpen && (
                 <motion.div 
                   initial={{ opacity: 0, y: 15, scale: 0.95 }}
                   animate={{ opacity: 1, y: 0, scale: 1 }}
                   exit={{ opacity: 0, y: 15, scale: 0.95 }}
                   style={{ position: 'absolute', top: '100%', right: -60, marginTop: '12px', width: '320px', background: 'white', borderRadius: '24px', boxShadow: '0 15px 50px rgba(0,0,0,0.15)', border: '1px solid var(--bg-tertiary)', overflow: 'hidden' }}
                 >
                    <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--bg-tertiary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)' }}>
                        <h4 style={{ margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>Latest Updates</h4>
                        <button onClick={() => setIsNotifyOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)' }}><X size={18} /></button>
                    </div>
                    
                    <div style={{ maxHeight: '400px', overflowY: 'auto', padding: '0.5rem' }}>
                        {notifications.length > 0 ? notifications.map((n, i) => (
                           <Link 
                             key={i} 
                             to={n.link} 
                             onClick={() => setIsNotifyOpen(false)}
                             style={{ display: 'flex', gap: '1rem', padding: '1rem', borderRadius: '16px', textDecoration: 'none', transition: 'all 0.2s', borderBottom: i === notifications.length - 1 ? 'none' : '1px solid var(--bg-tertiary)' }}
                             onMouseOver={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
                             onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                           >
                                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    {n.icon}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ color: 'var(--text-primary)', fontSize: '0.85rem', fontWeight: 600, lineHeight: 1.4, marginBottom: '0.25rem' }}>{n.title}</div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{n.date.toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                                        <ChevronRight size={14} color="var(--text-tertiary)" />
                                    </div>
                                </div>
                           </Link>
                        )) : (
                            <div style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--text-tertiary)' }}>
                                <Dot size={48} style={{ margin: '0 auto', opacity: 0.2 }} />
                                <p style={{ fontSize: '0.9rem' }}>No recent updates</p>
                            </div>
                        )}
                    </div>

                    <div style={{ padding: '1rem', textAlign: 'center', background: 'var(--bg-secondary)', borderTop: '1px solid var(--bg-tertiary)' }}>
                        <Link to="/dashboard" onClick={() => setIsNotifyOpen(false)} style={{ fontSize: '0.85rem', color: 'var(--accent-primary)', fontWeight: 700, textDecoration: 'none' }}>View All Festivals</Link>
                    </div>
                 </motion.div>
               )}
            </AnimatePresence>
          </div>

          <div style={{ height: '24px', width: '1px', background: 'var(--bg-tertiary)' }} />

          {!user ? (
            <button onClick={() => loginWithGoogle()} className="btn btn-primary" style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem' }}><LogIn size={16} /> Login</button>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.35rem 0.75rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-full)', border: '1px solid var(--bg-tertiary)' }}>
                <img src={user.picture || 'https://ui-avatars.com/api/?name=User'} alt="Profile" style={{ width: 26, height: 26, borderRadius: '50%' }} />
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>{user.name?.split(' ')[0]}</span>
              </div>
              <button onClick={logout} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', padding: '5px' }} title="Logout">
                <LogOut size={18} />
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .nav-link { font-weight: 600; color: var(--text-secondary); text-decoration: none; transition: 0.2s; font-size: 0.95rem; }
        .nav-link:hover { color: var(--accent-primary); }
        .dropdown-item { padding: 10px 14px; border-radius: 10px; color: var(--text-primary); text-decoration: none; font-weight: 600; font-size: 0.9rem; transition: 0.2s; }
        .dropdown-item:hover { background: var(--bg-secondary); color: var(--accent-primary); }
      `}</style>
    </nav>
  );
};
