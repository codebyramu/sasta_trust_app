import React, { useEffect, useState, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn, LogOut, Menu, Bell, Calendar, Receipt, X, ChevronRight, Crown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getReceipts, getOccasions } from '../services/db';

export const Navigation = () => {
  const { user, loginWithGoogle, logout } = useAuth();
  const location = useLocation();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotifyOpen, setIsNotifyOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const [compactHomeBar, setCompactHomeBar] = useState(location.pathname === '/');
  const notifyRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
      const heroHeight = document.getElementById('home')?.offsetHeight || window.innerHeight;
      setCompactHomeBar(location.pathname === '/' && window.scrollY < heroHeight - 24);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [location.pathname]);

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
          combined.push({
            type: 'occasion',
            id: occ.id,
            title: occ.title,
            date: new Date(occ.createdAt || Date.now()),
            link: `/occasion/${occ.id}`,
            icon: <Calendar size={15} color="#000" />
          });
        });
        const myReceipts = user?.role === 'owner' ? receiptsData : receiptsData.filter(r => r.contactValue === user?.email);
        myReceipts.forEach(rcpt => {
          combined.push({
            type: 'receipt',
            id: rcpt.id,
            title: user?.role === 'owner' ? `Receipt for ${rcpt.name}` : 'Official donation receipt issued',
            amount: rcpt.amount,
            date: new Date(rcpt.createdAt || Date.now()),
            link: '/donations',
            icon: <Receipt size={15} color="#0ca678" />
          });
        });
        combined.sort((a, b) => b.date - a.date);
        setNotifications(combined.slice(0, 15));
        const lastSeen = parseInt(localStorage.getItem(`sasta_last_notify_${user?.email || 'guest'}`) || '0');
        setUnreadCount(combined.filter(n => n.date.getTime() > lastSeen).length);
      } catch (e) {
        console.error(e);
      }
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
    <header className={`trust-site-nav${compactHomeBar ? ' trust-site-nav-compact' : ''}`} style={{
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      background: '#14253d',
      borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
      transition: 'box-shadow 0.3s ease',
      boxShadow: scrolled ? '0 5px 18px rgba(10, 24, 42, 0.2)' : 'none'
    }}>
      <div style={{
        maxWidth: '1440px',
        margin: '0 auto',
        padding: '14px 4%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }} className="trust-navigation-inner">
        {/* Brand */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none' }}>
          <img
            src="/sasta_logo.png"
            alt="Sasta Trust"
            className="trust-nav-logo"
            style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }}
            onError={(e) => { e.target.style.display = 'none'; }}
          />
          <div>
            <span className="trust-brand-caption" style={{
              fontFamily: 'Libre Baskerville, serif',
              fontWeight: 700,
              fontSize: '1.15rem',
              color: '#ffffff',
              letterSpacing: '-0.01em',
              display: 'block',
              lineHeight: 1.2
            }}>
              Sasta Trust
            </span>
            <span className="trust-nav-subtitle" style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '0.68rem',
              color: 'rgba(255,255,255,.66)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              display: 'block'
            }}>
              Azhudha River · Kerala
            </span>
          </div>
        </Link>

        {/* Center Nav Links (Museum / Editorial Style) */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '28px' }} className="nav-links-desktop">
          <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>
            Home
          </Link>
          <a href="/#impact-story" className="nav-link">About</a>
          <Link to="/dashboard" className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Calendar size={14} color="#d97706" />
            <span>Events</span>
          </Link>
          <Link to="/donations" className={`nav-link ${isActive('/donations') ? 'active' : ''}`}>
            Ways to Contribute
          </Link>
          <a href="/#contact" className="nav-link">
            Contact
          </a>
          <Link to="/donate" className={`nav-link ${isActive('/donate') ? 'active' : ''}`}>
            My Receipts
          </Link>

          {user?.role === 'owner' && (
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                style={{
                  background: '#f3f4f6',
                  border: '1px solid #e5e7eb',
                  borderRadius: '30px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  color: '#000',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 14px',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '0.8rem',
                  letterSpacing: '0.02em',
                  textTransform: 'uppercase'
                }}
              >
                <Crown size={14} color="#D4AF37" /> Admin <Menu size={14} />
              </button>
              <AnimatePresence>
                {isDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    style={{
                      position: 'absolute',
                      top: '100%',
                      right: 0,
                      marginTop: '8px',
                      background: '#ffffff',
                      borderRadius: '12px',
                      boxShadow: '0 15px 35px rgba(0,0,0,0.15)',
                      padding: '8px',
                      minWidth: '200px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                      border: '1px solid #eee'
                    }}
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    <Link to="/admin" className="dropdown-link">Manage Occasions</Link>
                    <Link to="/admin/receipt" className="dropdown-link">Send Receipt</Link>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </nav>

        <button
          className="trust-mobile-menu-toggle"
          onClick={() => setIsMobileMenuOpen(open => !open)}
          aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={isMobileMenuOpen}
        >
          {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        {/* Right CTA / Auth / Notifications */}
        <div className="trust-navigation-actions" style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {/* Notifications bell */}
          <div className="trust-nav-notifications" style={{ position: 'relative' }} ref={notifyRef}>
            <button
              onClick={toggleNotifications}
              style={{
                position: 'relative',
                background: '#f5f5f7',
                border: 'none',
                borderRadius: '50%',
                width: '38px',
                height: '38px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'background 0.2s'
              }}
              title="Recent Updates"
            >
              <Bell size={17} color="#333" />
              {unreadCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '-2px',
                  right: '-2px',
                  background: '#000000',
                  color: '#ffffff',
                  borderRadius: '50%',
                  width: '18px',
                  height: '18px',
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notification Popover */}
            <AnimatePresence>
              {isNotifyOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.96 }}
                  style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    marginTop: '12px',
                    width: '320px',
                    background: '#ffffff',
                    borderRadius: '16px',
                    boxShadow: '0 20px 50px rgba(0,0,0,0.18)',
                    border: '1px solid #eee',
                    overflow: 'hidden',
                    zIndex: 1100
                  }}
                >
                  <div style={{
                    padding: '14px 18px',
                    borderBottom: '1px solid #eee',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: '#fafafa'
                  }}>
                    <h4 style={{ margin: 0, color: '#000', fontFamily: 'Libre Baskerville, serif', fontSize: '0.92rem' }}>
                      Recent Updates
                    </h4>
                    <button
                      onClick={() => setIsNotifyOpen(false)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#999' }}
                    >
                      <X size={16} />
                    </button>
                  </div>
                  <div style={{ maxHeight: '350px', overflowY: 'auto', padding: '6px' }}>
                    {notifications.length > 0 ? notifications.map((n, i) => (
                      <Link
                        key={i}
                        to={n.link}
                        onClick={() => setIsNotifyOpen(false)}
                        style={{
                          display: 'flex',
                          gap: '12px',
                          padding: '10px 12px',
                          borderRadius: '10px',
                          textDecoration: 'none',
                          borderBottom: i === notifications.length - 1 ? 'none' : '1px solid #f5f5f5',
                          transition: 'background 0.15s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = '#f7f7f9'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          background: '#f0f0f4',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          {n.icon}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ color: '#222', fontSize: '0.82rem', fontWeight: 600, lineHeight: 1.35 }}>
                            {n.title}
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px' }}>
                            <span style={{ fontSize: '0.72rem', color: '#888' }}>
                              {n.date.toLocaleDateString([], { month: 'short', day: 'numeric' })}
                            </span>
                            <ChevronRight size={13} color="#aaa" />
                          </div>
                        </div>
                      </Link>
                    )) : (
                      <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: '#888', fontSize: '0.85rem' }}>
                        No recent updates
                      </div>
                    )}
                  </div>
                  <div style={{ padding: '10px', textAlign: 'center', background: '#fafafa', borderTop: '1px solid #eee' }}>
                    <Link
                      to="/dashboard"
                      onClick={() => setIsNotifyOpen(false)}
                      style={{ fontSize: '0.82rem', color: '#000', fontWeight: 600, textDecoration: 'none' }}
                    >
                      View All Occasions →
                    </Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* User Auth or Donate Pill */}
          {!user ? (
            <div className="trust-nav-auth-options" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={() => loginWithGoogle()}
                className="pill-btn pill-btn-outline pill-btn-sm"
                data-nav-login="true"
                style={{ fontSize: '0.82rem', padding: '8px 16px' }}
              >
                <LogIn size={14} /> Login
              </button>

              <Link
                to="/donations"
                className="pill-btn pill-btn-black pill-btn-sm trust-nav-donate"
                style={{ fontSize: '0.82rem', padding: '8px 18px' }}
              >
                Donate
              </Link>
            </div>
          ) : (
            <div className="trust-nav-auth-options" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Link
                to="/donations"
                className="pill-btn pill-btn-black pill-btn-sm trust-nav-donate"
                style={{ fontSize: '0.82rem', padding: '8px 18px' }}
              >
                Donate
              </Link>

              <div className="trust-nav-profile" style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '4px 10px',
                background: '#f3f4f6',
                borderRadius: '30px'
              }}>
                <img
                  src={user.picture || 'https://ui-avatars.com/api/?name=User'}
                  alt="Profile"
                  style={{ width: 24, height: 24, borderRadius: '50%' }}
                />
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#222' }}>
                  {user.name?.split(' ')[0]}
                </span>
                <button
                  onClick={logout}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#777', padding: '2px', display: 'flex' }}
                  title="Logout"
                >
                  <LogOut size={15} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {isMobileMenuOpen && (
        <nav className="trust-mobile-menu" aria-label="Mobile navigation">
          <Link to="/" onClick={() => setIsMobileMenuOpen(false)}>Home</Link>
          <a href="/#impact-story" onClick={() => setIsMobileMenuOpen(false)}>About</a>
          <Link to="/dashboard" onClick={() => setIsMobileMenuOpen(false)}>Events &amp; occasions</Link>
          <Link to="/donations" onClick={() => setIsMobileMenuOpen(false)}>Ways to contribute</Link>
          <Link to="/donate" onClick={() => setIsMobileMenuOpen(false)}>My receipts</Link>
          <a href="/#contact" onClick={() => setIsMobileMenuOpen(false)}>Contact</a>
          {user?.role === 'owner' && <><Link to="/admin" onClick={() => setIsMobileMenuOpen(false)}>Manage occasions</Link><Link to="/admin/receipt" onClick={() => setIsMobileMenuOpen(false)}>Send receipt</Link></>}
          {user ? <button type="button" onClick={() => { logout(); setIsMobileMenuOpen(false); }}>Sign out</button> : <button type="button" onClick={() => { loginWithGoogle(); setIsMobileMenuOpen(false); }}>Sign in</button>}
        </nav>
      )}

      <style>{`
        .nav-link {
          font-family: 'Inter', sans-serif;
          font-weight: 500;
          font-size: 0.88rem;
          color: rgba(255,255,255,.82);
          text-decoration: none;
          letter-spacing: -0.01em;
          transition: color 0.2s ease;
          position: relative;
        }
        .nav-btn-link {
          background: none;
          border: none;
          cursor: pointer;
          padding: 0;
        }
        .nav-link:hover, .nav-link.active {
          color: #f0c36a;
          font-weight: 600;
        }
        .dropdown-link {
          padding: 8px 14px;
          border-radius: 8px;
          color: #333;
          text-decoration: none;
          font-size: 0.84rem;
          font-weight: 500;
          transition: background 0.15s;
        }
        .dropdown-link:hover {
          background: #f4f4f5;
          color: #000;
        }
        .trust-mobile-menu-toggle, .trust-mobile-menu { display: none; }
        @media (max-width: 960px) {
          .nav-links-desktop {
            display: none !important;
          }
          .trust-mobile-menu-toggle {
            display: grid;
            place-items: center;
            width: 38px;
            height: 38px;
            margin-left: auto;
            border: 1px solid rgba(255,255,255,.25);
            border-radius: 4px;
            background: transparent;
            color: #fff;
            cursor: pointer;
          }
          .trust-mobile-menu {
            position: absolute;
            top: 100%;
            right: 16px;
            left: 16px;
            display: flex;
            flex-direction: column;
            gap: 2px;
            padding: 8px;
            border: 1px solid rgba(255,255,255,.14);
            border-radius: 5px;
            background: #14253d;
            box-shadow: 0 12px 24px rgba(10,24,42,.22);
          }
          .trust-mobile-menu a {
            padding: 11px 12px;
            border-radius: 3px;
            color: rgba(255,255,255,.9);
            font-size: .88rem;
          }
          .trust-mobile-menu a:hover { background: rgba(255,255,255,.08); }
          .trust-mobile-menu button {
            margin-top: 4px;
            padding: 11px 12px;
            border: 1px solid rgba(255,255,255,.25);
            border-radius: 3px;
            background: transparent;
            color: #fff;
            text-align: left;
            font: 500 .88rem 'Inter', sans-serif;
          }
        }
        @media (max-width: 650px) {
          .trust-navigation-inner { padding: 10px 16px !important; }
          .trust-navigation-inner > a { flex-shrink: 0; gap: 8px !important; }
          .trust-brand-caption { display: block; white-space: nowrap; font-size: .94rem !important; }
          .trust-nav-subtitle { display: none !important; }
          .trust-nav-notifications, .trust-nav-auth-options [data-nav-login], .trust-nav-profile { display: none !important; }
          .trust-navigation-actions { gap: 0 !important; }
          .trust-nav-donate { display: inline-flex !important; min-height: 36px !important; padding: 0 13px !important; border-radius: 4px !important; background: #e8bb65 !important; color: #14253d !important; font-size: .78rem !important; font-weight: 700 !important; }
        }
      `}</style>
    </header>
  );
};
