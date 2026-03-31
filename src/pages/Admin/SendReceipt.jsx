import React, { useState, useRef } from 'react';
import { addReceipt } from '../../services/db';
import { Mail, Phone, Send, Receipt as ReceiptIcon, Download, Eye, Smartphone, CheckCircle2, Image as ImageIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import emailjs from '@emailjs/browser';
import { toWords } from '../../utils/numberToWords';

const WHATSAPP_OWNER_NUMBER = '919391672398';

export const SendReceipt = () => {
    const [formData, setFormData] = useState({
        name: '', amount: '', details: '', payMethod: 'Cash', payRef: '',
        payDate: new Date().toISOString().split('T')[0],
        sendEmail: true, sendWhatsApp: false, email: '', countryCode: '91', phoneNumber: ''
    });
    const [sending, setSending] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    const [previewUrl, setPreviewUrl] = useState(null);
    const canvasRef = useRef(null);

    const coords = {
        no: { x: 55, y: 220 }, date: { x: 790, y: 220 }, name: { x: 260, y: 300 },
        amountWords: { x: 190, y: 375 }, purpose: { x: 120, y: 445 },
        payMethod: { x: 200, y: 512 }, payOn: { x: 470, y: 512 }, amountNum: { x: 85, y: 605 }
    };

    const generateReceiptImage = async (receiptId) => {
        return new Promise((resolve) => {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            const img = new Image();
            img.src = '/modalrecipt/modalrecipt.png';
            img.onload = () => {
                canvas.width = img.width; canvas.height = img.height;
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
        });
    };

    const handleSend = async (e) => {
        e.preventDefault();
        setSending(true); setSuccessMsg('');
        try {
            const receipt = await addReceipt({
                name: formData.name, amount: formData.amount, details: formData.details,
                contactType: (formData.sendEmail && formData.sendWhatsApp) ? 'both' : (formData.sendEmail ? 'email' : 'whatsapp'),
                contactValue: formData.sendEmail ? formData.email : (formData.phoneNumber ? `+${formData.countryCode}${formData.phoneNumber}` : ''),
                date: formData.payDate
            });
            const dataUrl = await generateReceiptImage(receipt.id);
            if (formData.sendEmail && formData.email) {
                const serviceID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
                const templateID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
                const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
                if (serviceID && templateID && publicKey) {
                    await emailjs.send(serviceID, templateID, {
                        receipt_id: receipt.id, devotee_name: formData.name,
                        amount: formData.amount, email_to: formData.email, content: dataUrl
                    }, publicKey);
                }
            }
            if (formData.sendWhatsApp && formData.phoneNumber) {
                const targetNumber = `${formData.countryCode}${formData.phoneNumber.replace(/\D/g, '')}`;
                const encodedMsg = encodeURIComponent(`SASTA TRUST\nGreetings! Attached is the official receipt for your contribution.\n\nReceipt No: ${receipt.id}\nAmount: ₹${formData.amount}\nName: ${formData.name}\n\nThank you for your devotion.`);
                window.open(`https://wa.me/${targetNumber}?text=${encodedMsg}`, '_blank');
            }
            setSuccessMsg(`✅ Receipt ${receipt.id} generated and sent successfully!`);
        } catch (err) { console.error(err); alert('Error generating/sending receipt.'); }
        finally { setSending(false); }
    };

    const handleChange = (e) => {
        const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        setFormData({ ...formData, [e.target.name]: value });
    };

    return (
        <div style={{ background: 'var(--bg-primary)', minHeight: '100vh' }}>
            {/* Header */}
            <div className="sacred-border" style={{ background: 'linear-gradient(135deg, var(--purple-dark), var(--purple-royal))', padding: '2.5rem 0' }}>
                <div className="container" style={{ maxWidth: 850 }}>
                    <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.72rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(212,175,55,0.5)', fontWeight: 600, marginBottom: '0.5rem' }}>
                        Admin Panel
                    </p>
                    <h1 style={{ fontFamily: 'Cinzel, serif', fontSize: 'clamp(1.4rem, 3vw, 1.8rem)', fontWeight: 700, color: '#D4AF37', margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem', letterSpacing: '0.04em' }}>
                        <ReceiptIcon size={24} /> Generate Official Receipt
                    </h1>
                </div>
            </div>

            <div className="container" style={{ padding: '2.5rem 24px', maxWidth: '900px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '2rem' }}>

                    {/* FORM */}
                    <div className="card" style={{ borderRadius: 'var(--radius-xl)' }}>
                        <form onSubmit={handleSend}>
                            <div className="input-group">
                                <label className="input-label">Devotee Name</label>
                                <input type="text" name="name" className="input-field" required value={formData.name} onChange={handleChange} placeholder="Full Name" />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="input-group">
                                    <label className="input-label">Amount (₹)</label>
                                    <input type="number" name="amount" className="input-field" required value={formData.amount} onChange={handleChange} placeholder="0" />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">Date</label>
                                    <input type="date" name="payDate" className="input-field" required value={formData.payDate} onChange={handleChange} />
                                </div>
                            </div>
                            <div className="input-group">
                                <label className="input-label">Details / Towards</label>
                                <input type="text" name="details" className="input-field" required value={formData.details} onChange={handleChange} placeholder="e.g. Anna Prasadam Seva" />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="input-group">
                                    <label className="input-label">Payment Method</label>
                                    <select name="payMethod" className="input-field" value={formData.payMethod} onChange={handleChange}>
                                        <option>Cash</option><option>Cheque</option><option>UPI / Online</option><option>D.D. No.</option>
                                    </select>
                                </div>
                                <div className="input-group">
                                    <label className="input-label">Reference No. (Optional)</label>
                                    <input type="text" name="payRef" className="input-field" value={formData.payRef} onChange={handleChange} placeholder="Ref No." />
                                </div>
                            </div>

                            {/* Send Options */}
                            <div style={{
                                padding: '1.5rem', background: 'var(--purple-wash)', borderRadius: 'var(--radius-lg)',
                                border: '1px solid rgba(45,27,105,0.08)', marginBottom: '1.5rem'
                            }}>
                                <label className="input-label" style={{ marginBottom: '1rem', display: 'block' }}>Send Options</label>
                                <div style={{ marginBottom: '1.25rem' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', marginBottom: '0.5rem' }}>
                                        <input type="checkbox" name="sendEmail" checked={formData.sendEmail} onChange={handleChange} style={{ width: '18px', height: '18px', accentColor: 'var(--gold-primary)' }} />
                                        <Mail size={18} color="var(--gold-primary)" /> <strong style={{ fontFamily: 'DM Sans, sans-serif' }}>Send via Email</strong>
                                    </label>
                                    {formData.sendEmail && (
                                        <input type="email" name="email" className="input-field" required value={formData.email} onChange={handleChange} placeholder="devotee@email.com" />
                                    )}
                                </div>
                                <div>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', marginBottom: '0.5rem' }}>
                                        <input type="checkbox" name="sendWhatsApp" checked={formData.sendWhatsApp} onChange={handleChange} style={{ width: '18px', height: '18px', accentColor: 'var(--gold-primary)' }} />
                                        <Smartphone size={18} color="var(--gold-primary)" /> <strong style={{ fontFamily: 'DM Sans, sans-serif' }}>Send via WhatsApp</strong>
                                    </label>
                                    {formData.sendWhatsApp && (
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', background: 'white', padding: '0 0.5rem', borderRadius: 'var(--radius-md)', border: '2px solid var(--bg-tertiary)', fontSize: '0.9rem', fontWeight: 700 }}>+
                                                <input type="number" name="countryCode" value={formData.countryCode} onChange={handleChange} style={{ width: '35px', border: 'none', background: 'none', padding: '0.5rem 0', textAlign: 'center', fontWeight: 700, outline: 'none' }} />
                                            </div>
                                            <input type="tel" name="phoneNumber" className="input-field" required value={formData.phoneNumber} onChange={handleChange} placeholder="Phone number" style={{ flex: 1, background: 'white' }} />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button type="button" onClick={() => generateReceiptImage('XXXXXX')} className="btn btn-secondary" style={{ flex: 1, borderRadius: 'var(--radius-full)' }}>
                                    <Eye size={18} /> Preview
                                </button>
                                <button type="submit" disabled={sending} className="btn btn-primary" style={{ flex: 2, borderRadius: 'var(--radius-full)' }}>
                                    {sending ? 'Sending...' : <><Send size={18} /> Generate & Send</>}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* PREVIEW */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div className="card" style={{
                            padding: '1.5rem', borderStyle: 'dashed', borderColor: 'rgba(212,175,55,0.3)',
                            background: 'var(--purple-wash)', display: 'flex', alignItems: 'center',
                            justifyContent: 'center', minHeight: '300px', borderRadius: 'var(--radius-xl)'
                        }}>
                            {previewUrl ? (
                                <div style={{ width: '100%', textAlign: 'center' }}>
                                    <img src={previewUrl} alt="Receipt Preview" style={{
                                        width: '100%', height: 'auto', borderRadius: 'var(--radius-md)',
                                        boxShadow: 'var(--shadow-lg)', border: '2px solid rgba(212,175,55,0.2)'
                                    }} />
                                    <div style={{ marginTop: '1.25rem', display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                                        <a href={previewUrl} download="Sasta_Trust_Receipt.png" className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', borderRadius: 'var(--radius-full)' }}>
                                            <Download size={16} /> Download PNG
                                        </a>
                                    </div>
                                </div>
                            ) : (
                                <div style={{ textAlign: 'center', color: 'var(--text-tertiary)' }}>
                                    <ImageIcon size={48} style={{ opacity: 0.15, margin: '0 auto 1rem', color: 'var(--gold-primary)' }} />
                                    <p style={{ fontFamily: 'Crimson Pro, serif', fontStyle: 'italic' }}>Fill the form and click Preview<br />to see the generated receipt.</p>
                                </div>
                            )}
                            <canvas ref={canvasRef} style={{ display: 'none' }} />
                        </div>

                        {successMsg && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                style={{
                                    padding: '1.25rem', background: 'linear-gradient(135deg, rgba(212,175,55,0.1), rgba(16,185,129,0.1))',
                                    color: 'var(--success)', borderRadius: 'var(--radius-lg)',
                                    border: '1px solid var(--success)', display: 'flex', alignItems: 'center', gap: '0.75rem'
                                }}
                            >
                                <CheckCircle2 size={24} />
                                <div>
                                    <strong style={{ display: 'block', fontFamily: 'Cinzel, serif' }}>Success!</strong>
                                    <span style={{ fontSize: '0.9rem', fontFamily: 'DM Sans, sans-serif' }}>{successMsg}</span>
                                </div>
                            </motion.div>
                        )}
                    </div>
                </div>

                {/* Coordinates Reference */}
                <div className="card" style={{
                    marginTop: '3rem', background: 'var(--purple-wash)',
                    border: '1px solid rgba(45,27,105,0.1)', opacity: 0.7,
                    borderRadius: 'var(--radius-xl)'
                }}>
                    <h4 style={{ color: 'var(--purple-royal)', marginBottom: '0.75rem', fontFamily: 'Cinzel, serif', fontSize: '0.95rem' }}>Canvas Pixel Coordinates Reference:</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', fontSize: '0.85rem', fontFamily: 'DM Sans, sans-serif' }}>
                        <div>• <b>Receipt No:</b> 55, 220</div>
                        <div>• <b>Date:</b> 790, 220</div>
                        <div>• <b>Donor Name:</b> 260, 300</div>
                        <div>• <b>Rupees (Words):</b> 190, 375</div>
                        <div>• <b>Towards:</b> 120, 445</div>
                        <div>• <b>Pay Method:</b> 200, 512</div>
                        <div>• <b>Rs. (Digits):</b> 85, 605</div>
                    </div>
                    <p style={{ marginTop: '1rem', fontSize: '0.8rem', color: 'var(--text-tertiary)', fontFamily: 'Crimson Pro, serif', fontStyle: 'italic' }}>
                        Coordinates based on the template proportions. Adjustable on request.
                    </p>
                </div>
            </div>
        </div>
    );
};
