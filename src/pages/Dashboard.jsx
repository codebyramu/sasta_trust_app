import React, { useEffect, useState } from 'react';
import { getOccasions } from '../services/db';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar as CalendarIcon, Image as ImageIcon, LayoutGrid, CalendarDays } from 'lucide-react';
import { Link } from 'react-router-dom';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

export const Dashboard = () => {
  const [occasions, setOccasions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, present, future, past
  const [viewMode, setViewMode] = useState('grid'); // grid, calendar
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    loadOccasions();
  }, []);

  const loadOccasions = async () => {
    try {
      setLoading(true);
      const data = await getOccasions();
      setOccasions(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const getStatus = (dateStr) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const date = new Date(dateStr);
    
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'present';
    if (diffDays > 0) return 'future';
    return 'past';
  };

  const filtered = occasions.filter(occ => {
    if (filter === 'all') return true;
    return getStatus(occ.date) === filter;
  }).sort((a, b) => {
    const statusOrder = { present: 0, future: 1, past: 2 };
    if (filter === 'all') {
      const aStat = statusOrder[getStatus(a.date)];
      const bStat = statusOrder[getStatus(b.date)];
      return aStat - bStat;
    }
    return new Date(b.date) - new Date(a.date);
  });

  const occasionsOnSelectedDate = occasions.filter(occ => {
    const occDate = new Date(occ.date);
    return occDate.toDateString() === selectedDate.toDateString();
  });

  const tileContent = ({ date, view }) => {
    if (view === 'month') {
      const hasOccasion = occasions.some(occ => new Date(occ.date).toDateString() === date.toDateString());
      return hasOccasion ? <div style={{ height: '4px', width: '4px', background: 'var(--accent-primary)', borderRadius: '50%', margin: '0 auto', marginTop: '2px' }}></div> : null;
    }
  };

  if (loading) {
    return <div className="container" style={{ display: 'flex', justifyContent: 'center', marginTop: '4rem' }}><div className="loader"></div></div>;
  }

  return (
    <div className="container slide-up" style={{ padding: '2rem 24px' }}>
      <div className="flex justify-between items-center" style={{ marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h2>Occasions / Festivals</h2>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          
          {viewMode === 'grid' && (
            <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--bg-secondary)', padding: '0.3rem', borderRadius: 'var(--radius-full)' }}>
              <button onClick={() => setFilter('all')} className="btn" style={{ padding: '0.5rem 1rem', background: filter === 'all' ? 'var(--accent-primary)' : 'transparent', color: filter === 'all' ? 'white' : 'var(--text-secondary)' }}>All</button>
              <button onClick={() => setFilter('present')} className="btn" style={{ padding: '0.5rem 1rem', background: filter === 'present' ? 'white' : 'transparent', color: filter === 'present' ? 'var(--success)' : 'var(--text-secondary)', boxShadow: filter === 'present' ? 'var(--shadow-sm)' : 'none' }}>Present</button>
              <button onClick={() => setFilter('future')} className="btn" style={{ padding: '0.5rem 1rem', background: filter === 'future' ? 'white' : 'transparent', color: filter === 'future' ? '#1c7ed6' : 'var(--text-secondary)', boxShadow: filter === 'future' ? 'var(--shadow-sm)' : 'none' }}>Future</button>
              <button onClick={() => setFilter('past')} className="btn" style={{ padding: '0.5rem 1rem', background: filter === 'past' ? 'white' : 'transparent', color: filter === 'past' ? '#e8590c' : 'var(--text-secondary)', boxShadow: filter === 'past' ? 'var(--shadow-sm)' : 'none' }}>Past</button>
            </div>
          )}

          <div style={{ display: 'flex', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', padding: '0.2rem' }}>
            <button 
              onClick={() => setViewMode('grid')} 
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', background: viewMode === 'grid' ? 'white' : 'transparent', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', boxShadow: viewMode === 'grid' ? 'var(--shadow-sm)' : 'none', color: viewMode === 'grid' ? 'var(--accent-primary)' : 'var(--text-secondary)' }}
            >
               <LayoutGrid size={18} /> <span style={{ fontWeight: 500, display: window.innerWidth > 600 ? 'block' : 'none' }}>Grid</span>
            </button>
            <button 
              onClick={() => setViewMode('calendar')} 
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', background: viewMode === 'calendar' ? 'white' : 'transparent', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', boxShadow: viewMode === 'calendar' ? 'var(--shadow-sm)' : 'none', color: viewMode === 'calendar' ? 'var(--accent-primary)' : 'var(--text-secondary)' }}
            >
               <CalendarDays size={18} /> <span style={{ fontWeight: 500, display: window.innerWidth > 600 ? 'block' : 'none' }}>Calendar</span>
            </button>
          </div>
        </div>
      </div>

      {viewMode === 'calendar' ? (
        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
           <div className="card" style={{ flex: '1 1 350px', background: 'white' }}>
              <Calendar
                 onChange={setSelectedDate}
                 value={selectedDate}
                 tileContent={tileContent}
                 className="custom-calendar-style"
                 style={{ width: '100%', border: 'none', fontFamily: 'inherit' }}
              />
           </div>
           <div className="card" style={{ flex: '2 1 400px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                <CalendarIcon size={20} color="var(--accent-primary)" /> {selectedDate.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </h3>
              <hr style={{ border: 'none', height: '1px', background: 'var(--bg-tertiary)' }} />
              
              {occasionsOnSelectedDate.length === 0 ? (
                <p style={{ color: 'var(--text-tertiary)', fontStyle: 'italic', padding: '2rem 0', textAlign: 'center' }}>No occasions marked for this date.</p>
              ) : (
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                   {occasionsOnSelectedDate.map(occ => (
                      <Link to={`/occasion/${occ.id}`} key={occ.id} style={{ display: 'block', padding: '1rem', borderRadius: 'var(--radius-md)', background: 'var(--bg-secondary)', color: 'inherit', textDecoration: 'none', transition: 'all 0.2s', borderLeft: '4px solid var(--accent-primary)' }} onMouseOver={(e) => e.currentTarget.style.transform = 'translateX(5px)'} onMouseOut={(e) => e.currentTarget.style.transform = 'translateX(0)'}>
                         <h4 style={{ margin: 0, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>{occ.title}</h4>
                         <div dangerouslySetInnerHTML={{ __html: occ.content }} style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }} />
                      </Link>
                   ))}
                 </div>
              )}
           </div>
        </div>
      ) : (
        <>
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-tertiary)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)' }}>
               <CalendarIcon size={48} style={{ margin: '0 auto 1rem auto', opacity: 0.5 }} />
               <h3>No festivals found</h3>
               <p>Check back later or change the filters.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
              <AnimatePresence>
                {filtered.map(occ => {
                  const status = getStatus(occ.date);
                  const hasMedia = occ.media && occ.media.length > 0;
                  return (
                    <motion.div 
                      key={occ.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Link to={`/occasion/${occ.id}`} className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 0, overflow: 'hidden', textDecoration: 'none', color: 'inherit' }}>
                         {hasMedia ? (
                            <div style={{ height: '200px', width: '100%', background: 'var(--bg-tertiary)' }}>
{(() => {
   const src = occ.media[0];
   if (!src) return null;
   const isYoutube = src.includes('youtube.com') || src.includes('youtu.be');
   const isFacebook = src.includes('facebook.com') || src.includes('fb.watch');

   if (isYoutube) {
      let videoId = '';
      if (src.includes('v=')) videoId = src.split('v=')[1].split('&')[0];
      else if (src.includes('youtu.be/')) videoId = src.split('youtu.be/')[1].split('?')[0];
      return <img src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`} alt="YouTube Thumbnail" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />;
   }

   if (isFacebook) {
      return (
         <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#e4ebf5', color: '#1877F2' }}>
           <span style={{ fontWeight: 600 }}>Facebook Video</span>
         </div>
      );
   }

   if (src.includes('.mp4') || src.includes('.mov') || src.includes('.webm') || src.startsWith('data:video')) {
      return <video src={src} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />;
   }

   return <img src={src} alt={occ.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />;
})()}
                            </div>
                         ) : (
                            <div style={{ height: '200px', width: '100%', background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)' }}>
                               <ImageIcon size={48} opacity={0.3} />
                            </div>
                         )}
                         <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                               <h3 style={{ margin: 0, fontSize: '1.25rem' }}>{occ.title}</h3>
                               <span className={`badge ${status}`} style={{ textTransform: 'capitalize' }}>{status}</span>
                            </div>
                            <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                               <CalendarIcon size={14} /> {new Date(occ.date).toLocaleDateString('en-IN', { dateStyle: 'long' })}
                            </div>
                            <div 
                               style={{ color: 'var(--text-secondary)', flex: 1, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', fontSize: '0.9rem' }}
                               dangerouslySetInnerHTML={{ __html: occ.content }} 
                            />
                         </div>
                      </Link>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </>
      )}
    </div>
  );
};
