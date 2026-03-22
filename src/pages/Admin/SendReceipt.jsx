import React, { useState } from 'react';
import { addReceipt } from '../../services/db';
import { Mail, Phone, Send, Receipt as ReceiptIcon } from 'lucide-react';
import emailjs from '@emailjs/browser';

export const SendReceipt = () => {
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    details: '',
    contactType: 'email',
    contactValue: ''
  });
  
  const [sending, setSending] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const handleSend = async (e) => {
    e.preventDefault();
    setSending(true);
    setSuccessMsg('');

    try {
      // 1. Save receipt to the Database
      const receipt = await addReceipt(formData);

      if (formData.contactType === 'email') {
        const serviceID = import.meta.env.VITE_EMAILJS_SERVICE_ID || 'service_placeholder';
        const templateID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || 'template_placeholder';
        const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || 'public_key_placeholder';
        
        // This relies on you setting up EmailJS and putting the actual strings in .env
        // And setting up a template in EmailJS with {{receipt_id}}, {{devotee_name}}, {{amount}}, {{details}}
        if (serviceID === 'service_placeholder') {
           console.log("EmailJS keys missing. Simulating send.");
           setSuccessMsg(`Receipt ${receipt.id} securely saved! (To actually send email, configure EmailJS keys in .env)`);
        } else {
           await emailjs.send(serviceID, templateID, {
             receipt_id: receipt.id,
             devotee_name: formData.name,
             amount: formData.amount,
             details: formData.details,
             date: new Date().toLocaleDateString(),
             to_email: formData.contactValue,
             reply_to: 'sastatrust@gmail.com'
           }, publicKey);
           
           setSuccessMsg(`Receipt ${receipt.id} successfully generated, saved, and emailed to ${formData.contactValue}!`);
        }
      } else {
        setSuccessMsg(`Receipt ${receipt.id} securely generated and saved for SMS delivery.`);
      }

      setFormData({ name: '', amount: '', details: '', contactType: 'email', contactValue: '' });
      setSending(false);

    } catch (err) {
      console.error(err);
      alert('Failed to send receipt internally or via EmailJS. Check console.');
      setSending(false);
    }
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  return (
    <div className="container slide-up" style={{ padding: '2rem 24px', maxWidth: '600px' }}>
      <div className="card">
        <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-primary)' }}>
          <ReceiptIcon size={24} /> Send Official Receipt
        </h2>
        
        {successMsg && (
          <div style={{ padding: '1rem', background: 'var(--success)', color: 'white', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', fontWeight: 500 }}>
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSend}>
          <div className="input-group">
            <label className="input-label">Devotee Name</label>
            <input 
              type="text" 
              name="name"
              className="input-field" 
              required
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. Ramesh Kumar"
            />
          </div>

          <div className="input-group">
            <label className="input-label">Donation Amount (₹)</label>
            <input 
              type="number" 
              name="amount"
              className="input-field" 
              required
              min="1"
              value={formData.amount}
              onChange={handleChange}
              placeholder="e.g. 5000"
            />
          </div>

          <div className="input-group">
            <label className="input-label">Donation Details</label>
            <textarea 
              name="details"
              className="input-field" 
              required
              rows="3"
              style={{ resize: 'vertical' }}
              value={formData.details}
              onChange={handleChange}
              placeholder="e.g. Anna Prasadam Seva contribution"
            />
          </div>

          <div className="input-group">
            <label className="input-label">Send Receipt Via</label>
            <div style={{ display: 'flex', gap: '1rem' }}>
               <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', padding: '0.75rem', background: formData.contactType === 'email' ? 'var(--accent-light)' : 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', flex: 1, border: formData.contactType === 'email' ? '2px solid var(--accent-primary)' : '2px solid transparent' }}>
                 <input type="radio" name="contactType" value="email" checked={formData.contactType === 'email'} onChange={handleChange} style={{ display: 'none' }} />
                 <Mail size={18} color={formData.contactType === 'email' ? 'var(--accent-primary)' : 'var(--text-secondary)'} /> Email
               </label>
               <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', padding: '0.75rem', background: formData.contactType === 'phone' ? 'var(--accent-light)' : 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', flex: 1, border: formData.contactType === 'phone' ? '2px solid var(--accent-primary)' : '2px solid transparent' }}>
                 <input type="radio" name="contactType" value="phone" checked={formData.contactType === 'phone'} onChange={handleChange} style={{ display: 'none' }} />
                 <Phone size={18} color={formData.contactType === 'phone' ? 'var(--accent-primary)' : 'var(--text-secondary)'} /> SMS
               </label>
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">{formData.contactType === 'email' ? 'Email Address' : 'Phone Number'}</label>
            <input 
              type={formData.contactType === 'email' ? 'email' : 'tel'} 
              name="contactValue"
              className="input-field" 
              required
              value={formData.contactValue}
              onChange={handleChange}
              placeholder={formData.contactType === 'email' ? 'devotee@example.com' : '+91 90000 00000'}
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem', padding: '1rem' }} disabled={sending}>
            {sending ? 'Sending Receipt securely...' : <><Send size={18} /> Send Receipt</>}
          </button>
        </form>
      </div>
    </div>
  );
};
