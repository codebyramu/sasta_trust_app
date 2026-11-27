import { pageLayers } from './page-layers';
import React, { useCallback } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ArrowRight, CalendarDays, Search } from 'lucide-react';
import { Page, RecordState, More, useRecords } from './shared';
import { allEvents, displayDate, localDate, oneEvent, plainText } from './data';
import { useAccount } from './account';

export function Events() {
  const records = useRecords(allEvents);
  const [params, setParams] = useSearchParams();
  const q = params.get('q') || '',
    period = params.get('period') || (q ? 'all' : 'upcoming');
  const today = localDate();
  const rows = (records.data || [])
    .filter((row) => {
      const matches = [
        row.name,
        row.category,
        row.date,
        plainText(row.description),
      ]
        .join(' ')
        .toLowerCase()
        .includes(q.trim().toLowerCase());
      return (
        matches &&
        (period === 'all' ||
          (period === 'upcoming' ? row.date >= today : row.date < today))
      );
    })
    .sort((a, b) =>
      period === 'upcoming'
        ? a.date.localeCompare(b.date)
        : b.date.localeCompare(a.date)
    );
  function filter(change) {
    setParams(
      { ...Object.fromEntries(params), ...change },
      { replace: true, preventScrollReset: true }
    );
  }
  return pageLayers(
    'Events',
    <Page
      title="Events and occasions"
      intro="Dates and details of trust programmes and seva activities."
    >
      <div className="filters">
        <label>
          <Search size={16} />
          <input
            aria-label="Search events"
            type="search"
            placeholder="Search events"
            value={q}
            onChange={(e) =>
              filter({ q: e.target.value, period: q ? period : 'all' })
            }
          />
        </label>
        <select
          value={period}
          aria-label="Filter events by date"
          onChange={(e) => filter({ period: e.target.value })}
        >
          <option value="upcoming">Upcoming events</option>
          <option value="past">Past events</option>
          <option value="all">All events</option>
        </select>
      </div>
      <RecordState records={records}>
        {rows.length ? (
          <div className="collection">
            {rows.map((row) => (
              <Link
                className="event-line"
                key={row.id}
                to={'/occasion/' + row.id}
              >
                <CalendarDays size={21} />
                <span>
                  <small>{displayDate(row.date)}</small>
                  <b>{row.name}</b>
                </span>
                <ArrowRight size={17} />
              </Link>
            ))}
          </div>
        ) : (
          <p className="status">
            {q
              ? 'No matching events. Try another search or date filter.'
              : 'No events are listed for this period.'}
          </p>
        )}
      </RecordState>
    </Page>
  );
}

function Media({ item }) {
  const source = item.url || item.youtube_link;
  if (!source) return null;
  let url;
  try {
    url = new URL(source);
    if (!['http:', 'https:'].includes(url.protocol)) return null;
  } catch {
    return null;
  }
  if (item.youtube_link) {
    const videoId =
      url.hostname === 'youtu.be'
        ? url.pathname.slice(1)
        : ['www.youtube.com', 'youtube.com', 'm.youtube.com'].includes(
              url.hostname
            )
          ? url.searchParams.get('v')
          : null;
    if (videoId && /^[\w-]{11}$/.test(videoId))
      return pageLayers(
        'Media',
        <iframe
          title="Event video"
          src={'https://www.youtube-nocookie.com/embed/' + videoId}
          allowFullScreen
        />
      );
    return pageLayers(
      'Media',
      <a className="more" href={url.href} target="_blank" rel="noreferrer">
        View event video ↗
      </a>
    );
  }
  return pageLayers(
    'Media',
    /\.(mp4|webm|mov)$/i.test(url.pathname) ? (
      <video src={source} controls />
    ) : (
      <img src={source} loading="lazy" alt="Photograph from the occasion" />
    )
  );
}

export function EventDetails() {
  const { id } = useParams();
  const { owner } = useAccount();
  const load = useCallback(() => oneEvent(id), [id]);
  const records = useRecords(load),
    row = records.data;
  return pageLayers(
    'EventDetails',
    <Page
      title={row?.name || 'Occasion details'}
      intro={row ? displayDate(row.date) : ''}
    >
      <RecordState records={records}>
        {row ? (
          <article className="paper prose">
            <div className="description">{plainText(row.description)}</div>
            {row.media.length > 0 && (
              <div className="event-media">
                {row.media.map((item) => (
                  <Media key={item.id} item={item} />
                ))}
              </div>
            )}
            {owner && (
              <More to={'/admin/event/' + row.id}>Edit this occasion</More>
            )}
          </article>
        ) : (
          <p className="status">This occasion could not be found.</p>
        )}
      </RecordState>
      <More to="/events">Return to events</More>
    </Page>
  );
}
