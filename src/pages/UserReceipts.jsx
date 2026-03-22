import React, { useEffect, useState } from 'react';
import { getReceipts } from '../services/db';
import { useAuth } from '../context/AuthContext';
import { Receipt, FileText, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const UserReceipts = () => {
  const { user } = useAuth();
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReceipts();
  }, [user]);

  const loadReceipts = async () => {
    try {
      setLoading(true);
      const data = await getReceipts();
      // Only show receipts matching this user's email
      const mine = data.filter(r => r.contactValue === user?.email);
      setReceipts(mine);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="container" style={{ display: 'flex', justifyContent: 'center', marginTop: '4rem' }}><div className="loader"></div></div>;
  }

  return (
    <div className="container slide-up" style={{ padding: '2rem 24px' }}>
      <h2 style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Receipt size={24} color="var(--accent-primary)" /> My Donation Receipts
      </h2>

      {(!user) ? (
        <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-tertiary)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)' }}>
           <FileText size={48} style={{ margin: '0 auto 1rem auto', opacity: 0.5 }} />
           <h3>Authentication Required</h3>
           <p>Please log in via Google to view receipts sent to your email.</p>
        </div>
      ) : receipts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-tertiary)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)' }}>
           <FileText size={48} style={{ margin: '0 auto 1rem auto', opacity: 0.5 }} />
           <h3>No receipts found</h3>
           <p>Any offline donations recorded by the Sasta Trust owner will appear here once sent to your email ({user?.email}).</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
          <AnimatePresence>
            {receipts.map(rcpt => (
              <motion.div 
                key={rcpt.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="card" 
                style={{ display: 'flex', flexDirection: 'column', gap: '1rem', borderTop: '4px solid var(--accent-primary)' }}
              >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                     <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Receipt #{rcpt.id}</span>
                     <span className="badge" style={{ background: 'var(--accent-light)', color: 'var(--accent-primary)' }}>Official</span>
                  </div>
                  <div>
                    <h1 style={{ fontSize: '2rem', margin: 0, color: 'var(--success)' }}>₹{rcpt.amount}</h1>
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-tertiary)' }}>Received from <strong style={{ color: 'var(--text-secondary)' }}>{rcpt.name}</strong></span>
                  </div>
                <div style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '8px', fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                     {rcpt.details}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--bg-tertiary)' }}>
                     <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
                        {new Date(rcpt.createdAt).toLocaleDateString()}
                     </span>
                     <button 
                       className="btn btn-outline" 
                       style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }} 
                       onClick={() => {
                         const receiptText = `SASTA TRUST\n(Regd. No. 288/V/2024)\nG-04, Sai Nilayam Apartments, Saptarishi Nagar, Pet Pujari Road,\nHyderabad - 500 088, Telangana\nPh: +91 93916 72398 · E: sastatrust@gmail.com\n\nRECEIPT\nNo. ${rcpt.id}\nReceived with thanks from ${rcpt.name}\nThe sum of Rupees ${rcpt.amount}\nBeing the amount of Rupees for ${rcpt.details}\nDate: ${new Date(rcpt.createdAt).toLocaleDateString()}\nRs. ${rcpt.amount}/-\n\nFor SASTA TRUST\nAuthorised Signatory,`;
                         const blob = new Blob([receiptText], { type: 'text/plain' });
                         const url = URL.createObjectURL(blob);
                         const a = document.createElement('a');
                         a.href = url;
                         a.download = `Sasta_Trust_Receipt_${rcpt.id}.txt`;
                         a.click();
                         URL.revokeObjectURL(url);
                       }}
                     >
                        <Download size={14} /> Download
                     </button>
                  </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};
