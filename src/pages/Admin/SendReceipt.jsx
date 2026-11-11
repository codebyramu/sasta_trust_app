import React, { useState, useRef } from 'react';
import { addReceipt } from '../../services/db';
import { Mail, Phone, Send, Receipt as ReceiptIcon, Download, Eye, Smartphone, CheckCircle2, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import emailjs from '@emailjs/browser';
import { toWords } from '../../utils/numberToWords';

export const SendReceipt = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    details: 'Yearly Anna Prasadam Seva — Kerala',
    payMethod: 'UPI',
    payRef: '',
    payDate: new Date().toISOString().split('T')[0],
    sendEmail: true,
    sendWhatsApp: false,
    email: '',
    countryCode: '91',
    phoneNumber: ''
  });
  const [sending, setSending] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [previewUrl, setPreviewUrl] = useState(null);
  const canvasRef = useRef(null);

  const coords = {
    no: { x: 55, y: 220 },
    date: { x: 790, y: 220 },
    name: { x: 260, y: 300 },
    amountWords: { x: 190, y: 375 },
    purpose: { x: 120, y: 445 },
    payMethod: { x: 200, y: 512 },
    payOn: { x: 470, y: 512 },
    amountNum: { x: 85, y: 605 }
  };

  const generateReceiptImage = async (receiptId) => {
    return new Promise((resolve) => {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.src = '/modalrecipt/modalrecipt.png';
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        ctx.fillStyle = '#1a1a1b';
        ctx.font = 'bold 24px "Times New Roman", serif';
        ctx.fillText(receiptId, coords.no.x, coords.no.y);
        const dateStr = new Date(formData.payDate).toLocaleDateString('en-IN');
        ctx.fillText(dateStr, coords.date.x, coords.date.y);
        ctx.fillText(formData.name, coords.name.x, coords.name.y);
        ctx.font = '22px "Times New Roman", serif';
        ctx.fillText(toWords(formData.amount), coords.amountWords.x, coords.amountWords.y);
        ctx.fillText(formData.details, coords.purpose.x, coords.purpose.y);
        const methodStr = `${formData.payMethod} ${formData.payRef ? '/ ' + formData.payRef : ''}`;
        ctx.fillText(methodStr, coords.payMethod.x, coords.payMethod.y);
        ctx.fillText(dateStr, coords.payOn.x, coords.payOn.y);
        ctx.font = 'bold 32px "Times New Roman", serif';
        ctx.fillText(`${formData.amount}/-`, coords.amountNum.x, coords.amountNum.y);
        const dataUrl = canvas.toDataURL('image/png');
        setPreviewUrl(dataUrl);
        resolve(dataUrl);
      };
      img.onerror = () => {
        // Fallback simple receipt canvas if template not loaded
        canvas.width = 800;
        canvas.height = 600;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 800, 600);
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 28px serif';
        ctx.fillText('SASTA TRUST - OFFICIAL RECEIPT', 200, 80);
        ctx.font = '20px serif';
        ctx.fillText(`Receipt No: ${receiptId}`, 50, 150);
        ctx.fillText(`Donor: ${formData.name}`, 50, 200);
        ctx.fillText(`Amount: ₹${formData.amount}`, 50, 250);
        ctx.fillText(`Purpose: ${formData.details}`, 50, 300);
        const dataUrl = canvas.toDataURL('image/png');
        setPreviewUrl(dataUrl);
        resolve(dataUrl);
      };
    });
  };

  const handleSend = async (e) => {
    e.preventDefault();
    setSending(true);
    setSuccessMsg('');
    try {
      const receipt = await addReceipt({
        name: formData.name,
        amount: formData.amount,
        details: formData.details,
        contactType: (formData.sendEmail && formData.sendWhatsApp) ? 'both' : (formData.sendEmail ? 'email' : 'whatsapp'),
        contactValue: formData.sendEmail ? formData.email : (formData.phoneNumber ? `+${formData.countryCode}${formData.phoneNumber}` : ''),
        date: formData.payDate
      });

      const receiptId = receipt ? receipt.id : `ST-${Date.now().toString().slice(-6)}`;
      const dataUrl = await generateReceiptImage(receiptId);

      if (formData.sendEmail && formData.email) {
        const serviceID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
        const templateID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
        const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
        if (serviceID && templateID && publicKey) {
          try {
            await emailjs.send(serviceID, templateID, {
              receipt_id: receiptId,
              devotee_name: formData.name,
              amount: formData.amount,
              email_to: formData.email,
              content: dataUrl
            }, publicKey);
          } catch (err) {
            console.warn('EmailJS error:', err);
          }
        }
      }

      if (formData.sendWhatsApp && formData.phoneNumber) {
        const targetNumber = `${formData.countryCode}${formData.phoneNumber.replace(/\D/g, '')}`;
        const encodedMsg = encodeURIComponent(
          `SASTA TRUST\nGreetings! Official receipt generated for your contribution.\n\nReceipt No: ${receiptId}\nAmount: ₹${formData.amount}\nName: ${formData.name}\nPurpose: ${formData.details}\n\nSwamy Sharanam Ayyappa!`
        );
        window.open(`https://wa.me/${targetNumber}?text=${encodedMsg}`, '_blank');
      }

      setSuccessMsg(`Official Receipt #${receiptId} generated successfully!`);
    } catch (err) {
      console.error(err);
      alert('Error generating receipt.');
    } finally {
      setSending(false);
    }
  };

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  return (
    <div style={{ backgroundColor: '#ffffff', minHeight: '100vh', paddingBottom: '90px' }}>
      <section style={{ padding: '60px 6% 40px', borderBottom: '1px solid #eee', backgroundColor: '#fafafa' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <button
            onClick={() => navigate('/dashboard')}
            className="pill-btn pill-btn-outline pill-btn-sm"
            style={{ marginBottom: '20px' }}
          >
            <ArrowLeft size={14} /> Back
          </button>
          <p className="kicker" style={{ color: '#888', marginBottom: '8px' }}>
            Admin Panel · Receipt Generator
          </p>
          <h1 style={{ fontFamily: 'Libre Baskerville, serif', fontSize: '2.4rem', fontWeight: 700, color: '#000' }}>
            Generate & Issue Official Receipt
          </h1>
        </div>
      </section>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '50px 6%' }}>
        {successMsg && (
          <div style={{
            padding: '20px',
            borderRadius: '16px',
            backgroundColor: '#f0fdf4',
            border: '1px solid #bbf7d0',
            color: '#166534',
            fontFamily: 'Inter',
            marginBottom: '30px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <CheckCircle2 size={20} color="#16a34a" />
            <span style={{ fontWeight: 600 }}>{successMsg}</span>
          </div>
        )}

        <form
          onSubmit={handleSend}
          style={{
            background: '#ffffff',
            borderRadius: '24px',
            border: '1px solid #eee',
            padding: '40px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.04)',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px'
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', fontFamily: 'Inter', fontSize: '0.88rem', fontWeight: 600, marginBottom: '8px' }}>
                Donor Name *
              </label>
              <input
                type="text"
                name="name"
                required
                placeholder="Devotee Full Name"
                value={formData.name}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  border: '1px solid #d1d5db',
                  fontFamily: 'Inter',
                  fontSize: '0.92rem',
                  outline: 'none'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontFamily: 'Inter', fontSize: '0.88rem', fontWeight: 600, marginBottom: '8px' }}>
                Amount (₹) *
              </label>
              <input
                type="number"
                name="amount"
                required
                placeholder="e.g. 5001"
                value={formData.amount}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  border: '1px solid #d1d5db',
                  fontFamily: 'Inter',
                  fontSize: '0.92rem',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontFamily: 'Inter', fontSize: '0.88rem', fontWeight: 600, marginBottom: '8px' }}>
              Purpose of Contribution
            </label>
            <input
              type="text"
              name="details"
              value={formData.details}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: '10px',
                border: '1px solid #d1d5db',
                fontFamily: 'Inter',
                fontSize: '0.92rem',
                outline: 'none'
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', fontFamily: 'Inter', fontSize: '0.88rem', fontWeight: 600, marginBottom: '8px' }}>
                Payment Method
              </label>
              <select
                name="payMethod"
                value={formData.payMethod}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  border: '1px solid #d1d5db',
                  fontFamily: 'Inter',
                  fontSize: '0.92rem',
                  outline: 'none',
                  backgroundColor: '#fff'
                }}
              >
                <option value="UPI">UPI</option>
                <option value="Bank Transfer">Bank Transfer (NEFT/IMPS)</option>
                <option value="Cash">Cash</option>
                <option value="Cheque">Cheque</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontFamily: 'Inter', fontSize: '0.88rem', fontWeight: 600, marginBottom: '8px' }}>
                Payment Reference # / UTR
              </label>
              <input
                type="text"
                name="payRef"
                placeholder="e.g. UPI Ref / Txn ID"
                value={formData.payRef}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  border: '1px solid #d1d5db',
                  fontFamily: 'Inter',
                  fontSize: '0.92rem',
                  outline: 'none'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontFamily: 'Inter', fontSize: '0.88rem', fontWeight: 600, marginBottom: '8px' }}>
                Date of Donation
              </label>
              <input
                type="date"
                name="payDate"
                value={formData.payDate}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  border: '1px solid #d1d5db',
                  fontFamily: 'Inter',
                  fontSize: '0.92rem',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          {/* Delivery Options */}
          <div style={{ borderTop: '1px solid #eee', paddingTop: '20px' }}>
            <h4 style={{ fontFamily: 'Inter', fontSize: '0.9rem', fontWeight: 700, marginBottom: '14px', color: '#111' }}>
              Dispatch Receipt To Devotee
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontFamily: 'Inter', fontSize: '0.9rem', cursor: 'pointer', marginBottom: '8px' }}>
                  <input
                    type="checkbox"
                    name="sendEmail"
                    checked={formData.sendEmail}
                    onChange={handleChange}
                    style={{ accentColor: '#000', width: 16, height: 16 }}
                  />
                  Send Official Receipt via Email
                </label>
                {formData.sendEmail && (
                  <input
                    type="email"
                    name="email"
                    placeholder="devotee@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: '10px',
                      border: '1px solid #d1d5db',
                      fontFamily: 'Inter',
                      fontSize: '0.92rem',
                      outline: 'none',
                      marginTop: '6px'
                    }}
                  />
                )}
              </div>

              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontFamily: 'Inter', fontSize: '0.9rem', cursor: 'pointer', marginBottom: '8px' }}>
                  <input
                    type="checkbox"
                    name="sendWhatsApp"
                    checked={formData.sendWhatsApp}
                    onChange={handleChange}
                    style={{ accentColor: '#000', width: 16, height: 16 }}
                  />
                  Send Receipt via WhatsApp
                </label>
                {formData.sendWhatsApp && (
                  <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                    <input
                      type="text"
                      name="countryCode"
                      value={formData.countryCode}
                      onChange={handleChange}
                      style={{
                        width: '70px',
                        padding: '12px 10px',
                        borderRadius: '10px',
                        border: '1px solid #d1d5db',
                        fontFamily: 'Inter',
                        textAlign: 'center'
                      }}
                    />
                    <input
                      type="tel"
                      name="phoneNumber"
                      placeholder="9876543210"
                      value={formData.phoneNumber}
                      onChange={handleChange}
                      style={{
                        flex: 1,
                        padding: '12px 14px',
                        borderRadius: '10px',
                        border: '1px solid #d1d5db',
                        fontFamily: 'Inter'
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={sending}
            className="pill-btn pill-btn-black"
            style={{ padding: '16px 32px', alignSelf: 'flex-start', marginTop: '10px' }}
          >
            <Send size={16} /> {sending ? 'Generating Official Receipt...' : 'Generate & Send Official Receipt'}
          </button>
        </form>

        {/* Hidden Canvas for High Resolution Receipt Image Generation */}
        <canvas ref={canvasRef} style={{ display: 'none' }} />

        {/* Receipt Image Preview */}
        {previewUrl && (
          <div style={{
            marginTop: '40px',
            padding: '30px',
            background: '#fafafa',
            borderRadius: '24px',
            border: '1px solid #eee'
          }}>
            <h3 style={{ fontFamily: 'Libre Baskerville', fontSize: '1.3rem', marginBottom: '16px' }}>
              Generated Official Receipt
            </h3>
            <img
              src={previewUrl}
              alt="Official Sasta Trust Receipt"
              style={{ width: '100%', maxWidth: '700px', borderRadius: '12px', border: '1px solid #ddd', display: 'block', marginBottom: '16px' }}
            />
            <a
              href={previewUrl}
              download={`Sasta_Trust_Receipt_${formData.name.replace(/\s+/g, '_')}.png`}
              className="pill-btn pill-btn-black pill-btn-sm"
            >
              <Download size={14} /> Download Receipt PNG
            </a>
          </div>
        )}
      </div>
    </div>
  );
};
