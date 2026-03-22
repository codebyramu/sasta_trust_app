import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getOccasions, addMediaToOccasion, toBase64, deleteOccasion, deleteMediaFromOccasion, updateOccasion } from '../services/db';
import { useAuth } from '../context/AuthContext';
import { ImagePlus, ArrowLeft, Loader2, Trash2, Edit2, Save, X } from 'lucide-react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

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

export const OccasionDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [occasion, setOccasion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ title: '', date: '', content: '' });
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getOccasions();
      const occ = data.find(o => o.id === id);
      if (occ) setOccasion(occ);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const startEditing = () => {
    setIsEditing(true);
    setEditForm({ title: occasion.title, date: occasion.date, content: occasion.content });
  };

  const handleSaveEdit = async () => {
    if (!editForm.title || !editForm.date || !editForm.content) return alert("Fields cannot be empty.");
    setSavingEdit(true);
    try {
      const updated = await updateOccasion(id, editForm);
      setOccasion({ ...updated });
      setIsEditing(false);
    } catch (e) { 
      alert("Failed to update."); 
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteOccasion = async () => {
    const confirmDelete = window.confirm("Are you sure you want to delete this occasion/festival? \n\nWARNING: this action will permanently delete the thing");
    if (confirmDelete) {
      try {
        await deleteOccasion(id);
        navigate('/dashboard');
      } catch (e) {
        alert("Failed to delete occasion.");
      }
    }
  };

  const handleDeleteMedia = async (mediaIndex) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this image/video? \n\nWARNING: this action will permanently delete the thing");
    if (confirmDelete) {
      try {
        const updated = await deleteMediaFromOccasion(id, mediaIndex);
        setOccasion({ ...updated });
      } catch (e) {
        alert("Failed to delete media.");
      }
    }
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    
    if (occasion.media.length + files.length > 50) {
      alert("Cannot exceed 50 media limit.");
      return;
    }

    try {
      setUploading(true);
      const mediaArray = await Promise.all(files.map(f => toBase64(f)));
      const updated = await addMediaToOccasion(id, mediaArray);
      setOccasion({ ...updated });
    } catch (err) {
      console.error(err);
      alert(err.message || 'Error uploading files');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return <div className="container" style={{ display: 'flex', justifyContent: 'center', marginTop: '4rem' }}><div className="loader"></div></div>;
  }

  if (!occasion) {
    return <div className="container" style={{ padding: '2rem' }}><h2>Occasion not found</h2></div>;
  }

  const isOwner = user?.role === 'owner';

  return (
    <div className="container slide-up" style={{ padding: '2rem 24px', maxWidth: '800px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <button onClick={() => navigate(-1)} className="btn btn-secondary">
          <ArrowLeft size={16} /> Back
        </button>
        {isOwner && !isEditing && (
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button onClick={startEditing} className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Edit2 size={16} /> Edit Occasion
            </button>
            <button onClick={handleDeleteOccasion} className="btn" style={{ background: 'var(--danger)', color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Trash2 size={16} /> Delete
            </button>
          </div>
        )}
      </div>

      <div className="card" style={{ marginBottom: '2rem', border: 'none', position: 'relative' }}>
        {isEditing ? (
           <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
             <input type="text" className="input-field" value={editForm.title} onChange={e => setEditForm({...editForm, title: e.target.value})} placeholder="Occasion Title" />
             <input type="date" className="input-field" value={editForm.date} onChange={e => setEditForm({...editForm, date: e.target.value})} />
             <ReactQuill theme="snow" value={editForm.content} onChange={val => setEditForm({...editForm, content: val})} modules={modules} formats={formats} />
             <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button onClick={handleSaveEdit} className="btn btn-primary" style={{ flex: 1 }} disabled={savingEdit}>
                  {savingEdit ? 'Saving...' : <><Save size={18}/> Save Changes</>}
                </button>
                <button onClick={() => setIsEditing(false)} className="btn btn-secondary" style={{ flex: 1 }} disabled={savingEdit}>
                  <X size={18}/> Cancel
                </button>
             </div>
           </div>
        ) : (
           <>
             <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', color: 'var(--accent-primary)' }}>{occasion.title}</h1>
             <p style={{ color: 'var(--text-tertiary)', marginBottom: '2rem', fontWeight: 600 }}>
               {new Date(occasion.date).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
             </p>
             <div className="occasion-content" dangerouslySetInnerHTML={{ __html: occasion.content }} style={{ fontSize: '1.1rem', color: 'var(--text-secondary)' }} />
           </>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2>Media Gallery ({occasion.media?.length || 0}/50)</h2>
      </div>

      <div className="gallery-grid">
         {isOwner && occasion.media.length < 50 && (
           <label className="gallery-item" style={{ border: '2px dashed var(--accent-primary)', background: 'var(--accent-light)', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-primary)', gap: '0.5rem' }}>
             {uploading ? <Loader2 size={32} className="loader" style={{ border: 'none', background: 'transparent' }} /> : (
               <>
                 <ImagePlus size={32} />
                 <span style={{ fontWeight: 600 }}>Add Media</span>
                 <input type="file" multiple accept="image/*,video/*" style={{ display: 'none' }} onChange={handleFileUpload} />
               </>
             )}
           </label>
         )}

         {occasion.media?.map((src, i) => (
            <div key={i} className="gallery-item" style={{ background: 'var(--bg-tertiary)', position: 'relative' }}>
              {src.startsWith('data:image') || src.startsWith('http') ? (
                <img src={src} alt={`Media ${i+1}`} loading="lazy" />
              ) : (
                <video src={src} controls loading="lazy" />
              )}
              {isOwner && (
                <button 
                  onClick={() => handleDeleteMedia(i)} 
                  style={{ position: 'absolute', top: '8px', right: '8px', background: 'red', color: 'white', border: 'none', borderRadius: '50%', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', opacity: 0.8 }}
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
         ))}
      </div>
    </div>
  );
};
