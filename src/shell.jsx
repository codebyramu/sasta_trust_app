import { pageLayers } from './page-layers';
import React, { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  MapPin,
  Phone,
  UserRound,
  Heart,
  Menu,
  X,
  ChevronDown,
  Mail,
} from 'lucide-react';
import { useAccount } from './account';
import { database } from './data';
import { ThemePicker } from './theme-picker';
import { office } from './shared';

const links = [
  ['/', 'Home'],
  ['/about', 'The trust'],
  ['/services', 'Our services'],
  ['/events', 'Events'],
  ['/gallery', 'Gallery'],
  ['/contact', 'Contact'],
];
function Identity() {
  return pageLayers(
    'Identity',
    <Link className="identity" to="/" aria-label="Sasta Trust home">
      <img src="/sasta_logo.png" alt="" />
      <span>
        <strong>Sasta Trust</strong>
        <small>Pilgrim welfare &amp; charitable services</small>
      </span>
    </Link>
  );
}
export default function Shell() {
  const location = useLocation();
  const { user, owner } = useAccount();
  const [mobile, setMobile] = useState(false);
  const [message, setMessage] = useState('');
  const accountMenu = useRef(null);
  useEffect(() => {
    setMobile(false);
    if (accountMenu.current) accountMenu.current.open = false;
    const frame = requestAnimationFrame(() => {
      const anchor = document.getElementById(location.hash.slice(1));
      if (anchor && location.hash) anchor.scrollIntoView();
      else window.scrollTo(0, 0);
      document.title =
        (document.querySelector('main h1')?.textContent || 'Pilgrim services') +
        ' · Sasta Trust';
    });
    return () => cancelAnimationFrame(frame);
  }, [location.pathname, location.hash]);
  useEffect(() => {
    const close = (e) => {
      if (e.key === 'Escape') {
        setMobile(false);
        if (accountMenu.current) accountMenu.current.open = false;
      }
    };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, []);
  useEffect(() => {
    function onPointerDown(e) {
      const btn = e.target.closest(
        '.nav-links a, .mast .btn, .receipt-nav, .menu-toggle, .btn, .service-card, .saved-theme-chip'
      );
      if (!btn) return;
      const rect = btn.getBoundingClientRect();
      const d = Math.max(rect.width, rect.height) * 1.5;
      const circle = document.createElement('span');
      circle.className = 'btn-touch-ripple';
      circle.style.width = circle.style.height = `${d}px`;
      const clientX = e.clientX ?? (e.touches && e.touches[0]?.clientX);
      const clientY = e.clientY ?? (e.touches && e.touches[0]?.clientY);
      if (clientX !== undefined && clientY !== undefined) {
        circle.style.left = `${clientX - rect.left - d / 2}px`;
        circle.style.top = `${clientY - rect.top - d / 2}px`;
      } else {
        circle.style.left = `${rect.width / 2 - d / 2}px`;
        circle.style.top = `${rect.height / 2 - d / 2}px`;
      }
      const old = btn.querySelector('.btn-touch-ripple');
      if (old) old.remove();
      btn.appendChild(circle);
      setTimeout(() => circle.remove(), 600);
    }
    document.addEventListener('pointerdown', onPointerDown, { passive: true });
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, []);
  async function logout() {
    const { error } = await database.auth.signOut({ scope: 'local' });
    setMessage(error ? 'Sign-out failed. Please try again.' : '');
  }
  return pageLayers(
    'Shell',
    <>
      <a className="skip" href="#main">
        Skip to content
      </a>
      <header>
        <div className="utility">
          <div className="wrap utility-inner">
            <span>
              <MapPin size={13} /> HYDERABAD
            </span>
            <div>
              <a className="help-phone" href={office.tel}>
                <Phone size={13} />
                {office.phone}
              </a>
              {user ? (
                <details ref={accountMenu} className="account-menu">
                  <summary>
                    <UserRound size={14} /> My account <ChevronDown size={12} />
                  </summary>
                  <div>
                    <Link to="/receipts">My receipts</Link>
                    {owner && <Link to="/admin">Administration</Link>}
                    <button onClick={logout}>Sign out</button>
                  </div>
                </details>
              ) : (
                <Link to="/signin">
                  <UserRound size={14} /> Sign in
                </Link>
              )}
              <span
                aria-hidden="true"
                className="theme-launcher-space"
                data-editor-ui
              />
            </div>
          </div>
        </div>
        <div className="wrap mast">
          <Identity />
          <nav className="mast-nav" aria-label="Primary navigation">
            <div
              id="nav-list"
              className={'nav-links' + (mobile ? ' open' : '')}
            >
              {links.map(([to, label]) => (
                <NavLink end key={to} to={to} onClick={() => setMobile(false)}>
                  {label}
                </NavLink>
              ))}
            </div>
          </nav>
          <Link className="btn" to="/donations">
            <Heart size={16} /> Make a donation
          </Link>
        </div>
        <div className="nav announcement-bar">
          <div className="wrap nav-inner">
            <button
              className="menu-toggle"
              aria-expanded={mobile}
              aria-controls="nav-list"
              onClick={() => setMobile(!mobile)}
            >
              {mobile ? <X size={17} /> : <Menu size={17} />}Menu
            </button>
            <Link className="receipt-nav" to="/receipts">
              Donation receipts
            </Link>
          </div>
        </div>
      </header>
      {message && (
        <p role="alert" className="wrap status">
          {message}
        </p>
      )}
      <main id="main" tabIndex={-1}>
        <Outlet />
      </main>
      <footer>
        <div className="wrap footer-grid">
          <div>
            <Identity />
            <p>Serving pilgrims along the Sabarimala route since 2012.</p>
          </div>
          <div>
            <h2>Trust information</h2>
            <Link to="/about">About the trust</Link>
            <Link to="/services">Our services</Link>
            <Link to="/events">Events and occasions</Link>
          </div>
          <div>
            <h2>Support &amp; enquiries</h2>
            <Link to="/donations">Donations</Link>
            <Link to="/receipts">Donation receipts</Link>
            <Link to="/contact">Volunteer enquiries</Link>
          </div>
          <div>
            <h2>Trust office</h2>
            <a href={'mailto:' + office.email}>
              <Mail size={14} />
              {office.email}
            </a>
            <a href={office.tel}>
              <Phone size={14} />
              {office.phone}
            </a>
          </div>
        </div>
        <div className="footer-end">
          <div className="wrap">
            <span>© {new Date().getFullYear()} Sasta Trust</span>
            <Link to="/signin?next=/admin">Staff sign-in</Link>
          </div>
        </div>
      </footer>
      <ThemePicker />
    </>
  );
}
