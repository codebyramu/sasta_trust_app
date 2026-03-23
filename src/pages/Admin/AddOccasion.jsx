import React, { useState } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { addOccasion, uploadMedia, addMediaToOccasion } from '../../services/db';
import { useNavigate } from 'react-router-dom';
import { Save, ImagePlus, CheckCircle2 } from 'lucide-react';

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
      const occasionData = {
        title,
        date,
        content
      };
      const newOcc = await addOccasion(occasionData);
      
      // Handle optional single cover image
      if (coverFile) {
        const url = await uploadMedia(coverFile);
        await addMediaToOccasion(newOcc.id, [url]); // Passes as array for db.js flexibility
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
    if (e.target.files && e.target.files[0]) {
        setCoverFile(e.target.files[0]);
    }
  };

  return (
    <div className="container slide-up" style={{ padding: '2rem 24px', maxWidth: '800px' }}>
      <div className="card">
        <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.8rem', color: 'var(--accent-primary)' }}>
            <Save size={28} /> Create Occasion / Festival
        </h2>
        
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
            <label className="input-label">Thumbnail / Cover Image (Optional)</label>
            <label className="input-field" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', justifyContent: 'center', borderStyle: 'dashed', background: coverFile ? 'var(--bg-secondary)' : 'transparent' }}>
               <ImagePlus size={20} color="var(--accent-primary)" /> 
               {coverFile ? <span style={{ color: 'var(--success)', fontWeight: 700 }}>{coverFile.name} (Ready)</span> : "Click to Upload Covers Image"}
               <input type="file" accept="image/*,video/*" style={{ display: 'none' }} onChange={handleFileChange} />
            </label>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginTop: '0.5rem' }}>This image will be shown as the primary thumbnail for all users.</p>
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
              style={{ minHeight: '150px' }}
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '2.5rem', padding: '1.25rem', fontSize: '1.1rem' }} disabled={saving}>
            {saving ? 'Creating...' : 'Publish Occasion'}
          </button>
        </form>
      </div>
    </div>
  );
};
