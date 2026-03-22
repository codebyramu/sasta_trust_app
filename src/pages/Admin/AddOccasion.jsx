import React, { useState } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { addOccasion, toBase64 } from '../../services/db';
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
  const [coverMedia, setCoverMedia] = useState([]);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !date || !content) return alert("Please fill Title, Date and Description");
    
    setSaving(true);
    try {
      const occasionData = {
        title,
        date,
        content
      };
      const newOcc = await addOccasion(occasionData);
      
      // If we selected cover images on creation
      if (coverMedia.length > 0) {
        const mediaUtils = await import('../../services/db');
        const b64Array = await Promise.all(coverMedia.map(f => mediaUtils.toBase64(f)));
        await mediaUtils.addMediaToOccasion(newOcc.id, b64Array);
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

  return (
    <div className="container slide-up" style={{ padding: '2rem 24px', maxWidth: '800px' }}>
      <div className="card">
        <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-primary)' }}><Save size={24} /> Create Occasion / Festival</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label className="input-label">Occasion Title</label>
            <input 
              type="text" 
              className="input-field" 
              placeholder="e.g. Maha Shivaratri 2024"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label className="input-label">Date</label>
            <input 
              type="date" 
              className="input-field"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label className="input-label">Initial Cover Media (Optional)</label>
            <label className="input-field" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', justifyContent: 'center', borderStyle: 'dashed' }}>
               <ImagePlus size={18} color="var(--accent-primary)" /> Choose Files (Max 5)
               <input type="file" multiple accept="image/*,video/*" style={{ display: 'none' }} onChange={(e) => setCoverMedia(Array.from(e.target.files).slice(0, 5))} />
            </label>
            {coverMedia.length > 0 && <span style={{ fontSize: '0.9rem', color: 'var(--success)' }}>{coverMedia.length} files selected</span>}
          </div>

          <div className="input-group">
            <label className="input-label">Rich Description</label>
            <ReactQuill 
              theme="snow" 
              value={content} 
              onChange={setContent} 
              modules={modules}
              formats={formats}
              placeholder="Write a beautiful description for the occasion..."
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem', padding: '1rem' }} disabled={saving}>
            {saving ? 'Saving...' : 'Publish Occasion'}
          </button>
        </form>
      </div>
    </div>
  );
};
