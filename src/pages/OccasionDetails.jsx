import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getOccasions, addMediaToOccasion, uploadMedia, deleteOccasion, deleteMediaFromOccasion, updateOccasion } from '../services/db';
import { useAuth } from '../context/AuthContext';
import { ImagePlus, ArrowLeft, Trash2, Edit2, Save, X, Share2, Calendar, MapPin } from 'lucide-react';
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
    if (window.confirm("Are you sure you want to delete this occasion?")) {
      try {
        await deleteOccasion(id);
        navigate('/dashboard');
      } catch (e) {
        alert("Failed to delete.");
      }
    }
  };

  const handleDeleteMedia = async (mediaUrl) => {
    if (window.confirm("Delete this media item permanently?")) {
      try {
        const updated = await deleteMediaFromOccasion(id, mediaUrl);
        setOccasion({ ...updated });
      } catch (e) {
        alert("Failed to delete media.");
      }
    }
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    try {
      setUploading(true);
      const mediaArray = await Promise.all(files.map(f => uploadMedia(f)));
      const updated = await addMediaToOccasion(id, mediaArray);
      setOccasion({ ...updated });
    } catch (err) {
      alert(err.message || 'Error uploading files');
    } finally {
      setUploading(false);
    }
  };

  const handleAddExternalLink = async () => {
    const link = window.prompt("Paste YouTube or Video Link:");
    if (!link) return;
    try {
      setUploading(true);
      const updated = await addMediaToOccasion(id, [link]);
      setOccasion({ ...updated });
    } catch (err) {
      alert(err.message || 'Error saving link');
    } finally {
      setUploading(false);
    }
  };

  const renderMedia = (src) => {
    if (!src) return null;
    const isYoutube = src.includes('youtube.com') || src.includes('youtu.be');
    if (isYoutube) {
      let videoId = '';
      if (src.includes('v=')) videoId = src.split('v=')[1].split('&')[0];
      else if (src.includes('youtu.be/')) videoId = src.split('youtu.be/')[1].split('?')[0];
      return (
        <iframe
          width="100%"
          height="100%"
          src={`https://www.youtube.com/embed/${videoId}`}
          title="YouTube Video"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          style={{ objectFit: 'cover', borderRadius: '16px' }}
        />
      );
    }
    if (src.includes('.mp4') || src.includes('.mov') || src.includes('.webm')) {
      return (
        <video src={src} controls style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '16px' }} />
      );
    }
    return (
      <img src={src} alt="Media" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '16px' }} />
    );
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <p style={{ fontFamily: 'Inter', color: '#666' }}>Loading occasion details...</p>
      </div>
    );
  }

  if (!occasion) {
    return (
      <div style={{ padding: '80px 20px', textAlign: 'center' }}>
        <h2 style={{ fontFamily: 'Libre Baskerville' }}>Occasion not found</h2>
        <button onClick={() => navigate('/dashboard')} className="pill-btn pill-btn-black pill-btn-sm" style={{ marginTop: '20px' }}>
          Back to Calendar
        </button>
      </div>
    );
  }

  const isOwner = user?.role === 'owner';

  return (
    <div className="trust-occasion-page" style={{ backgroundColor: '#ffffff', minHeight: '100vh', paddingBottom: '90px' }}>
      <div className="trust-occasion-wrap" style={{ maxWidth: '900px', margin: '0 auto', padding: '50px 6%' }}>
        {/* Navigation & Controls */}
        <div className="trust-occasion-controls" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <button
            onClick={() => navigate(-1)}
            className="pill-btn pill-btn-outline pill-btn-sm"
          >
            <ArrowLeft size={14} /> Back
          </button>

          {isOwner && !isEditing && (
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={startEditing} className="pill-btn pill-btn-outline pill-btn-sm">
                <Edit2 size={14} /> Edit
              </button>
              <button
                onClick={handleDeleteOccasion}
                className="pill-btn pill-btn-sm"
                style={{ backgroundColor: '#e02424', color: '#fff' }}
              >
                <Trash2 size={14} /> Delete
              </button>
            </div>
          )}
        </div>

        {/* Content Card */}
        <div className="trust-occasion-content" style={{
          background: '#ffffff',
          borderRadius: '24px',
          border: '1px solid #eee',
          padding: '40px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.04)',
          marginBottom: '40px'
        }}>
          {isEditing ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <input
                type="text"
                value={editForm.title}
                onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                placeholder="Occasion Title"
                style={{
                  padding: '12px',
                  borderRadius: '10px',
                  border: '1px solid #ddd',
                  fontFamily: 'Inter',
                  fontSize: '1rem'
                }}
              />
              <input
                type="date"
                value={editForm.date}
                onChange={e => setEditForm({ ...editForm, date: e.target.value })}
                style={{
                  padding: '12px',
                  borderRadius: '10px',
                  border: '1px solid #ddd',
                  fontFamily: 'Inter'
                }}
              />
              <ReactQuill
                theme="snow"
                value={editForm.content}
                onChange={val => setEditForm({ ...editForm, content: val })}
                modules={modules}
                formats={formats}
              />
              <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <button
                  onClick={handleSaveEdit}
                  className="pill-btn pill-btn-black pill-btn-sm"
                  disabled={savingEdit}
                >
                  <Save size={14} /> {savingEdit ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="pill-btn pill-btn-outline pill-btn-sm"
                  disabled={savingEdit}
                >
                  <X size={14} /> Cancel
                </button>
              </div>
            </div>
          ) : (
            <div>
              <p className="kicker" style={{ color: '#888', marginBottom: '8px' }}>
                SACRED OCCASION · {occasion.date ? new Date(occasion.date).toLocaleDateString('en-IN', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Continuous Seva'}
              </p>

              <h1 style={{
                fontFamily: 'Libre Baskerville, serif',
                fontSize: 'clamp(2rem, 4vw, 2.8rem)',
                fontWeight: 700,
                color: '#000000',
                marginBottom: '20px',
                lineHeight: 1.2
              }}>
                {occasion.title || occasion.name}
              </h1>

              <div
                style={{
                  fontFamily: 'Inter',
                  fontSize: '1.05rem',
                  lineHeight: 1.8,
                  color: '#333333'
                }}
                dangerouslySetInnerHTML={{ __html: occasion.content || occasion.description }}
              />
            </div>
          )}
        </div>

        {/* Media Attachments */}
        <div>
          <div className="trust-occasion-media-heading" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontFamily: 'Libre Baskerville, serif', fontSize: '1.4rem', color: '#000' }}>
              Media & Attachments
            </h3>

            {isOwner && (
              <div style={{ display: 'flex', gap: '10px' }}>
                <label className="pill-btn pill-btn-outline pill-btn-sm" style={{ cursor: 'pointer' }}>
                  <ImagePlus size={14} /> Upload Photos
                  <input type="file" multiple accept="image/*,video/*" onChange={handleFileUpload} style={{ display: 'none' }} />
                </label>
                <button onClick={handleAddExternalLink} className="pill-btn pill-btn-outline pill-btn-sm">
                  + Add Video Link
                </button>
              </div>
            )}
          </div>

          {occasion.media && occasion.media.length > 0 ? (
            <div className="trust-occasion-media-grid" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '20px'
            }}>
              {occasion.media.map((item, idx) => (
                <div
                  key={idx}
                  className="trust-occasion-media-item"
                  style={{
                    height: '240px',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    position: 'relative',
                    border: '1px solid #eee',
                    background: '#000'
                  }}
                >
                  {renderMedia(item)}
                  {isOwner && (
                    <button
                      onClick={() => handleDeleteMedia(item)}
                      style={{
                        position: 'absolute',
                        top: 10,
                        right: 10,
                        background: 'rgba(224,36,36,0.9)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '50%',
                        width: 30,
                        height: 30,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer'
                      }}
                      title="Delete media"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p style={{ fontFamily: 'Inter', color: '#888', fontSize: '0.92rem' }}>
              No additional photos attached to this occasion.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
