import React, { useState } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { addOccasion, uploadMedia, addMediaToOccasion } from '../../services/db';
import { useNavigate } from 'react-router-dom';
import { Save, ImagePlus, ArrowLeft } from 'lucide-react';

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
    } catch (err) {
      console.error(err);
      alert('Failed to save occasion');
    } finally {
      setSaving(false);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) setCoverFile(e.target.files[0]);
  };

  return (
    <div style={{ backgroundColor: '#ffffff', minHeight: '100vh', paddingBottom: '90px' }}>
      <section style={{ padding: '60px 6% 40px', borderBottom: '1px solid #eee', backgroundColor: '#fafafa' }}>
        <div style={{ maxWidth: '850px', margin: '0 auto' }}>
          <button
            onClick={() => navigate('/dashboard')}
            className="pill-btn pill-btn-outline pill-btn-sm"
            style={{ marginBottom: '20px' }}
          >
            <ArrowLeft size={14} /> Back to Calendar
          </button>
          <p className="kicker" style={{ color: '#888', marginBottom: '8px' }}>
            Admin Panel · Occasion Management
          </p>
          <h1 style={{ fontFamily: 'Libre Baskerville, serif', fontSize: '2.4rem', fontWeight: 700, color: '#000' }}>
            Create New Occasion
          </h1>
        </div>
      </section>

      <div style={{ maxWidth: '850px', margin: '0 auto', padding: '50px 6%' }}>
        <form
          onSubmit={handleSubmit}
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
          <div>
            <label style={{ display: 'block', fontFamily: 'Inter', fontSize: '0.88rem', fontWeight: 600, marginBottom: '8px', color: '#222' }}>
              Occasion Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Mandala Mahotsavam & Special Anna Prasadam Camp"
              value={title}
              onChange={e => setTitle(e.target.value)}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '12px',
                border: '1px solid #d1d5db',
                fontFamily: 'Inter',
                fontSize: '0.95rem',
                outline: 'none'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontFamily: 'Inter', fontSize: '0.88rem', fontWeight: 600, marginBottom: '8px', color: '#222' }}>
              Auspicious Date *
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={e => setDate(e.target.value)}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '12px',
                border: '1px solid #d1d5db',
                fontFamily: 'Inter',
                fontSize: '0.95rem',
                outline: 'none'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontFamily: 'Inter', fontSize: '0.88rem', fontWeight: 600, marginBottom: '8px', color: '#222' }}>
              Cover Image (Optional)
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '12px',
                border: '1px solid #d1d5db',
                fontFamily: 'Inter',
                fontSize: '0.9rem'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontFamily: 'Inter', fontSize: '0.88rem', fontWeight: 600, marginBottom: '8px', color: '#222' }}>
              Occasion Description & Details *
            </label>
            <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid #d1d5db' }}>
              <ReactQuill
                theme="snow"
                value={content}
                onChange={setContent}
                modules={modules}
                formats={formats}
                placeholder="Share sacred timings, seva arrangements, location directions, and prasadam schedules..."
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="pill-btn pill-btn-black"
            style={{ padding: '16px 32px', alignSelf: 'flex-start', marginTop: '10px' }}
          >
            <Save size={16} /> {saving ? 'Publishing Occasion...' : 'Publish Occasion'}
          </button>
        </form>
      </div>
    </div>
  );
};
