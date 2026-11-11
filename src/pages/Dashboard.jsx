import React, { useEffect, useMemo, useState } from 'react';
import { getOccasions } from '../services/db';
import { ArrowRight, CalendarDays } from 'lucide-react';
import { Link } from 'react-router-dom';

const formatDate = (value) => {
  if (!value) return { day: '—', month: 'Date pending', year: '' };
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { day: '—', month: 'Date pending', year: '' };
  return {
    day: date.toLocaleDateString('en-IN', { day: '2-digit' }),
    month: date.toLocaleDateString('en-IN', { month: 'long' }),
    year: date.getFullYear(),
  };
};

const isUpcoming = (value) => {
  if (!value) return true;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return true;
  date.setHours(23, 59, 59, 999);
  return date >= new Date();
};

export const Dashboard = () => {
  const [occasions, setOccasions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('upcoming');

  useEffect(() => {
    let active = true;
    getOccasions()
      .then(data => { if (active) setOccasions(data || []); })
      .catch(error => console.error('Unable to load trust events:', error))
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const events = useMemo(() => occasions
    .filter(item => filter === 'all' || (filter === 'upcoming' ? isUpcoming(item.date) : !isUpcoming(item.date)))
    .sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : Number.MAX_SAFE_INTEGER;
      const dateB = b.date ? new Date(b.date).getTime() : Number.MAX_SAFE_INTEGER;
      return filter === 'past' ? dateB - dateA : dateA - dateB;
    }), [occasions, filter]);

  return (
    <main className="trust-events-page">
      <div className="trust-events-wrap">
        <nav className="trust-events-breadcrumb" aria-label="Breadcrumb"><Link to="/">Home</Link><span>/</span><span>Events</span></nav>
        <header className="trust-events-heading">
          <div>
            <p className="trust-events-overline">Sasta Trust · Azhudha River</p>
            <h1>Events &amp; occasions</h1>
            <p>Temple occasions and community service updates from the trust.</p>
          </div>
          <Link to="/donations" className="trust-events-support">Support our work <ArrowRight size={16} /></Link>
        </header>

        <section aria-label="Trust events">
          <div className="trust-events-controls">
            <h2>Trust calendar</h2>
            <div className="trust-events-filters" role="group" aria-label="Filter events">
              {[['upcoming', 'Upcoming'], ['past', 'Past'], ['all', 'All events']].map(([value, label]) => (
                <button key={value} type="button" className={filter === value ? 'active' : ''} onClick={() => setFilter(value)}>{label}</button>
              ))}
            </div>
          </div>

          {loading ? (
            <p className="trust-events-message">Loading events…</p>
          ) : events.length === 0 ? (
            <div className="trust-events-empty"><CalendarDays size={21} /><p>{filter === 'past' ? 'There are no past events listed.' : 'No upcoming events are listed right now. Please check back soon.'}</p></div>
          ) : (
            <div className="trust-events-list">
              {events.map(event => {
                const date = formatDate(event.date);
                const description = (event.content || event.description || '').replace(/<[^>]+>/g, '').trim();
                return (
                  <article className="trust-event-row" key={event.id}>
                    <div className="trust-event-date"><strong>{date.day}</strong><span>{date.month}{date.year ? ` ${date.year}` : ''}</span></div>
                    <div className="trust-event-copy">
                      <h3>{event.title || event.name || 'Trust occasion'}</h3>
                      {description && <p>{description.slice(0, 220)}{description.length > 220 ? '…' : ''}</p>}
                    </div>
                    <Link to={`/occasion/${event.id}`} aria-label={`Read more about ${event.title || event.name || 'this event'}`} className="trust-event-link"><span>Details</span><ArrowRight size={16} /></Link>
                  </article>
                );
              })}
            </div>
          )}
        </section>
        <p className="trust-events-footnote">For questions about an event, please <Link to="/donations">contact the trust</Link>.</p>
      </div>
    </main>
  );
};
