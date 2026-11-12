import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getReceipts } from '../services/db';
import { ArrowRight, Download, FileText, Heart, Receipt, Search, ShieldCheck, Sparkles } from 'lucide-react';
import * as XLSX from 'xlsx';

const rupees = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`;
const formatDate = (receipt) => {
  const date = receipt.date ? new Date(`${receipt.date}T00:00:00`) : new Date(receipt.createdAt);
  return Number.isNaN(date.getTime()) ? 'Date unavailable' : new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
};

export const UserReceipts = () => {
  const { user, loginWithGoogle } = useAuth();
  const [allReceipts, setAllReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  useEffect(() => {
    let active = true;
    getReceipts().then((items) => { if (active) setAllReceipts(items || []); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const mine = useMemo(() => {
    if (!user?.email) return [];
    const email = user.email.trim().toLowerCase();
    return allReceipts.filter((item) => item.contactValue?.trim().toLowerCase() === email);
  }, [allReceipts, user?.email]);
  const visible = useMemo(() => {
    const records = user?.role === 'owner' ? allReceipts : mine;
    if (!query.trim()) return records;
    const value = query.trim().toLowerCase();
    return records.filter((item) => [item.name, item.details, item.contactValue, item.id].some((part) => String(part || '').toLowerCase().includes(value)));
  }, [allReceipts, mine, query, user?.role]);
  const total = (user?.role === 'owner' ? allReceipts : mine).reduce((sum, item) => sum + Number(item.amount || 0), 0);

  const exportReceipts = () => {
    const rows = [...allReceipts].map((item, index) => ({
      'S.No': index + 1,
      'Receipt ID': item.id,
      'Donor': item.name,
      'Amount': Number(item.amount || 0),
      'Purpose': item.details || 'Seva contribution',
      'Date': formatDate(item),
    }));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(rows), 'Receipts');
    XLSX.writeFile(workbook, 'Sasta_Trust_Receipts.xlsx');
  };

  return (
    <main className="receipts-page">
      <section className="receipts-hero">
        <div className="receipts-hero-mark"><Receipt size={24} /></div>
        <p className="impact-kicker">Sasta Trust · Seva records</p>
        <h1>{user?.role === 'owner' ? 'Donation records' : 'Your giving, gathered in one place.'}</h1>
        <p>{user?.role === 'owner' ? 'Review and export the trust’s recorded contributions.' : 'Official receipt records linked to your signed-in email appear here.'}</p>
      </section>

      <section className="receipts-content">
        <div className="receipts-summary">
          <article><span className="receipts-summary-icon"><FileText size={18} /></span><div><small>{user?.role === 'owner' ? 'All records' : 'Your receipts'}</small><strong>{loading ? '—' : (user?.role === 'owner' ? allReceipts.length : mine.length)}</strong></div></article>
          <article><span className="receipts-summary-icon"><Heart size={18} /></span><div><small>{user?.role === 'owner' ? 'Total recorded' : 'Total contributed'}</small><strong>{loading ? '—' : rupees(total)}</strong></div></article>
          <div className="receipts-summary-side"><ShieldCheck size={18} /><span>Receipt records are linked to your account email.</span></div>
        </div>

        <div className="receipts-list-heading">
          <div><p className="impact-kicker">A record of your support</p><h2>{user?.role === 'owner' ? 'All receipts' : 'My receipts'}</h2></div>
          <div className="receipts-list-actions">
            {(user?.role === 'owner' || mine.length > 0) && <label className="receipts-search"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search receipts" aria-label="Search receipts" /></label>}
            {user?.role === 'owner' && allReceipts.length > 0 && <button className="receipts-export" onClick={exportReceipts}><Download size={16} /> Export</button>}
          </div>
        </div>

        {loading ? <div className="receipts-state"><span className="receipts-spinner" /><p>Loading your records…</p></div> : visible.length > 0 ? (
          <div className="receipts-grid">
            {visible.map((item) => (
              <article className="receipt-card" key={item.id}>
                <div className="receipt-card-top"><span><Receipt size={16} /> Receipt #{item.id}</span><small>{formatDate(item)}</small></div>
                <h3>{item.name || 'Contributor'}</h3>
                <p>{item.details || 'Sasta Trust seva contribution'}</p>
                <div className="receipt-card-bottom"><strong>{rupees(item.amount)}</strong><span><ShieldCheck size={15} /> Recorded</span></div>
              </article>
            ))}
          </div>
        ) : (
          <div className="receipts-empty">
            <div className="receipts-empty-art"><Sparkles size={22} /><span><Receipt size={38} /></span><Heart size={20} /></div>
            <p className="impact-kicker">Your seva record</p>
            <h3>{user ? (query ? 'No matching receipts' : 'Your receipts will appear here') : 'Sign in to find your receipts'}</h3>
            <p>{user ? (query ? 'Try another name, purpose or receipt number.' : 'Receipts are matched to the email address used when the donation was recorded. If yours is missing, contact the trust and we’ll help locate it.') : 'Use the same Google account whose email address was shared with Sasta Trust for your receipt.'}</p>
            {user ? <a href="mailto:sastatrust@gmail.com?subject=Help%20finding%20my%20receipt">Ask us to find a receipt <ArrowRight size={16} /></a> : <button onClick={loginWithGoogle}>Continue with Google <ArrowRight size={16} /></button>}
            <Link to="/donations" className="receipts-give-link">Explore ways to contribute</Link>
          </div>
        )}
      </section>
    </main>
  );
};
