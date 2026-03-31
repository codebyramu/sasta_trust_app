import React, { useState } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { addOccasion, uploadMedia, addMediaToOccasion } from '../../services/db';
import { useNavigate } from 'react-router-dom';
import { Save, ImagePlus } from 'lucide-react';

const modules = {
  toolbar: [
    [{ 'font': [] }],
    [{ 'header': [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike', 'blockquote'],
    [{'list': 'ordered'}, {'list': 'bullet'}, {'indent': '-1'}, {'indent': '+1'}],
    [{ 'color': [] }, { 'background': [] }],
    ['clean']
  ],
};

const formats = [
  'font', 'header',
  'bold', 'italic', 'underline', 'strike', 'blockquote',
  'list', 'bullet', 'indent',
  'color', 'background'
];

export const AddOccasion = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [content, setContent] = useState('');
  const [coverFile, setCoverFile] = useState(null);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !date || !content) return alert("Please fill Title, Date and Description");
    setSaving(true);
    try {
      const newOcc = await addOccasion({ title, date, content });
      if (coverFile) {
        const url = await uploadMedia(coverFile);
        await addMediaToOccasion(newOcc.id, [url]);
      }
      alert('Occasion Created Successfully!');
      navigate('/dashboard');
    } catch (err) { console.error(err); alert('Failed to save occasion'); }
    finally { setSaving(false); }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) setCoverFile(e.target.files[0]);
  };

  return (
    <div style={{ background: 'var(--bg-primary)', minHeight: '100vh' }}>
      {/* Header */}
      <div className="sacred-border" style={{ background: 'linear-gradient(135deg, var(--purple-dark), var(--purple-royal))', padding: '2.5rem 0' }}>
        <div className="container" style={{ maxWidth: 800 }}>
          <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.72rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(212,175,55,0.5)', fontWeight: 600, marginBottom: '0.5rem' }}>
            Admin Panel
          </p>
          <h1 style={{ fontFamily: 'Cinzel, serif', fontSize: 'clamp(1.4rem, 3vw, 1.8rem)', fontWeight: 700, color: '#D4AF37', margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem', letterSpacing: '0.04em' }}>
            <Save size={24} /> Create Occasion / Festival
          </h1>
        </div>
      </div>

      <div className="container" style={{ padding: '2.5rem 24px', maxWidth: '800px' }}>
        <div className="card" style={{ borderRadius: 'var(--radius-xl)' }}>
          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label className="input-label">Occasion Title</label>
              <input type="text" className="input-field" placeholder="e.g. Maha Shivaratri 2024" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>

            <div className="input-group">
              <label className="input-label">Date</label>
              <input type="date" className="input-field" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>

            <div className="input-group">
              <label className="input-label">Thumbnail / Cover Image (Optional)</label>
              <label className="input-field" style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer',
                justifyContent: 'center', borderStyle: 'dashed',
                borderColor: coverFile ? 'var(--gold-primary)' : 'var(--bg-tertiary)',
                background: coverFile ? 'rgba(212,175,55,0.05)' : 'transparent',
                transition: 'all 0.2s'
              }}>
                <ImagePlus size={20} color="var(--gold-primary)" />
                {coverFile ? <span style={{ color: 'var(--success)', fontWeight: 700 }}>{coverFile.name} (Ready)</span> : "Click to Upload Cover Image"}
                <input type="file" accept="image/*,video/*" style={{ display: 'none' }} onChange={handleFileChange} />
              </label>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginTop: '0.5rem', fontFamily: 'DM Sans, sans-serif' }}>This image will be shown as the primary thumbnail.</p>
            </div>

            <div className="input-group">
              <label className="input-label">Rich Description</label>
              <ReactQuill theme="snow" value={content} onChange={setContent} modules={modules} formats={formats} placeholder="Write a beautiful description for the occasion..." style={{ minHeight: '150px' }} />
            </div>

            <button type="submit" className="btn btn-primary" style={{
              width: '100%', marginTop: '2rem', padding: '1.15rem', fontSize: '1rem',
              borderRadius: 'var(--radius-full)'
            }} disabled={saving}>
              {saving ? 'Creating...' : 'Publish Occasion'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
