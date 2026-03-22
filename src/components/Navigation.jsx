import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn, LogOut, User, Menu } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const Navigation = () => {
  const { user, loginWithGoogle, logout } = useAuth();
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  return (
    <>
    <nav style={{ padding: '1rem 0', background: 'white', position: 'sticky', top: 0, zIndex: 100, borderBottom: '1px solid var(--bg-tertiary)' }}>
      <div className="container justify-between items-center flex">
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-primary)' }}>
          <div style={{ padding: '4px', background: 'var(--accent-light)', borderRadius: '12px' }}>
             <img src="/sasta_logo.png" alt="Sasta Trust Logo" style={{ width: 32, height: 32, objectFit: 'cover', borderRadius: '8px' }} onError={(e) => e.target.src = "https://ui-avatars.com/api/?name=Sasta+Trust"} />
          </div>
          <span style={{ fontWeight: 800, fontSize: '1.25rem', letterSpacing: '-0.02em' }}>Sasta Trust</span>
        </Link>
        
        <div className="desktop-nav" style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
          <Link to="/" style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>Home</Link>
          <Link to="/dashboard" style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>Occasions / Festivals</Link>
          <Link to={user?.role === 'owner' ? '/admin/receipt' : '/user/receipts'} style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>{user?.role === 'owner' ? 'Receipts' : 'Donations'}</Link>
          {user?.role === 'owner' && (
             <div style={{ position: 'relative' }}>
                <button 
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500, color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                >
                  Admin <Menu size={16} />
                </button>
                <AnimatePresence>
                  {isDropdownOpen && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }} 
                      animate={{ opacity: 1, y: 0 }} 
                      exit={{ opacity: 0, y: 10 }}
                      style={{ position: 'absolute', top: '100%', right: 0, marginTop: '8px', background: 'white', borderRadius: '12px', boxShadow: 'var(--shadow-md)', padding: '8px', minWidth: '180px', display: 'flex', flexDirection: 'column', gap: '4px', border: '1px solid var(--bg-tertiary)' }}
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      <Link to="/admin" style={{ padding: '8px 12px', borderRadius: '8px', color: 'var(--text-primary)', textDecoration: 'none', fontWeight: 500 }} onMouseOver={(e) => e.target.style.background = 'var(--bg-tertiary)'} onMouseOut={(e) => e.target.style.background = 'transparent'}>Manage Occasions</Link>
                      <Link to="/admin/receipt" style={{ padding: '8px 12px', borderRadius: '8px', color: 'var(--text-primary)', textDecoration: 'none', fontWeight: 500 }} onMouseOver={(e) => e.target.style.background = 'var(--bg-tertiary)'} onMouseOut={(e) => e.target.style.background = 'transparent'}>Send Receipt</Link>
                    </motion.div>
                  )}
                </AnimatePresence>
             </div>
          )}

          {!user ? (
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
               <button onClick={() => loginWithGoogle()} className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}><LogIn size={16} /> Login via Google</button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                 <img src={user.picture || 'https://ui-avatars.com/api/?name=User'} alt="User" style={{ width: 32, height: 32, borderRadius: '50%' }} />
                 <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>{user.name}</span>
               </div>
               <button onClick={logout} className="btn btn-secondary" style={{ padding: '0.5rem', borderRadius: '50%' }} title="Logout">
                 <LogOut size={16} />
               </button>
            </div>
          )}
        </div>
      </div>
    </nav>
    </>
  );
};
