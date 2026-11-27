import { pageLayers } from './page-layers';
import React, { useCallback, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Page, More, RecordState, useRecords } from './shared';
import {
  database,
  read,
  oneEvent,
  plainText,
  localDate,
  sendMail,
} from './data';
import { receiptImage, downloadImage } from './receipt-file';

function StaffNav() {
  return pageLayers(
    'StaffNav',
    <nav className="staff-nav" aria-label="Staff tools">
      <Link to="/admin">Publish an event</Link>
      <Link to="/admin/receipt">Issue a receipt</Link>
      <Link to="/receipts">Receipt register</Link>
    </nav>
  );
}

export function StaffEvent() {
  const { id } = useParams();
  const load = useCallback(
    () =>
      id
        ? oneEvent(id)
        : Promise.resolve({
            name: '',
            date: localDate(),
            description: '',
            media: [],
          }),
    [id]
  );
  const records = useRecords(load);
  return pageLayers(
    'StaffEvent',
    <Page title={id ? 'Manage occasion' : 'Publish an event'}>
      <StaffNav />
      <RecordState records={records}>
        {records.data ? (
          <EventForm key={id || 'new'} event={records.data} />
        ) : (
          <p className="status">Occasion not found.</p>
        )}
      </RecordState>
    </Page>
  );
}

function EventForm({ event }) {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false),
    [notice, setNotice] = useState('');
  const [media, setMedia] = useState(event.media);
  async function perform(action, failure) {
    setBusy(true);
    setNotice('');
    try {
      await action();
    } catch {
      setNotice(failure);
    } finally {
      setBusy(false);
    }
  }
  function save(e) {
    e.preventDefault();
    const values = Object.fromEntries(new FormData(e.currentTarget));
    if (values.description === plainText(event.description))
      values.description = event.description;
    perform(async () => {
      if (event.id) {
        await read(
          database.from('occasions').update(values).eq('id', event.id)
        );
        setNotice('Event details saved.');
      } else {
        const row = await read(
          database.from('occasions').insert(values).select('id').single()
        );
        navigate('/admin/event/' + row.id, { replace: true });
      }
    }, 'Event details could not be saved.');
  }
  function addMedia(e) {
    e.preventDefault();
    const form = e.currentTarget;
    const values = new FormData(form);
    perform(async () => {
      const file = values.get('file'),
        link = String(values.get('link')).trim();
      if (!file.size && !link) {
        setNotice('Choose a file or enter a video link.');
        return;
      }
      if (link && !/^https?:\/\//i.test(link)) {
        setNotice('Enter a full web address.');
        return;
      }
      const rows = [];
      if (file.size) {
        const path =
          'uploads/' +
          crypto.randomUUID() +
          '-' +
          file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const bucket = database.storage.from('media');
        await read(bucket.upload(path, file));
        rows.push({
          occasion_id: event.id,
          type: 'file',
          url: bucket.getPublicUrl(path).data.publicUrl,
        });
      }
      if (link)
        rows.push({
          occasion_id: event.id,
          type: 'video_link',
          youtube_link: link,
        });
      const added = await read(database.from('media').insert(rows).select());
      setMedia((list) => [...list, ...added]);
      form.reset();
      setNotice('Media added.');
    }, 'Media could not be added. Your saved occasion is available in the calendar.');
  }
  function removeMedia(item) {
    if (!window.confirm('Remove this item from the occasion?')) return;
    perform(async () => {
      await read(database.from('media').delete().eq('id', item.id));
      setMedia((list) => list.filter((row) => row.id !== item.id));
    }, 'Media could not be removed.');
  }
  function remove() {
    if (!window.confirm('Delete this occasion and its media entries?')) return;
    perform(async () => {
      await read(database.from('occasions').delete().eq('id', event.id));
      navigate('/events');
    }, 'The occasion could not be deleted.');
  }
  return pageLayers(
    'EventForm',
    <div className="split">
      <form className="form paper" onSubmit={save}>
        <h2>Event details</h2>
        <label>
          Event name
          <input name="name" defaultValue={event.name} required />
        </label>
        <label>
          Date
          <input type="date" name="date" defaultValue={event.date} required />
        </label>
        <label>
          Description
          <textarea
            name="description"
            rows="6"
            required
            defaultValue={plainText(event.description)}
          />
        </label>
        <div className="actions">
          <button disabled={busy} className="btn">
            {event.id ? 'Save changes' : 'Publish event'}
          </button>
          {event.id && (
            <button
              className="link danger"
              type="button"
              disabled={busy}
              onClick={remove}
            >
              Delete occasion
            </button>
          )}
        </div>
        {notice && <p role="status">{notice}</p>}
      </form>
      <aside className="paper prose">
        <h2>Event photographs and video</h2>
        {event.id ? (
          <>
            <More to={'/occasion/' + event.id}>View public event</More>
            <form className="form" onSubmit={addMedia}>
              <label>
                Upload a photo or video
                <input type="file" name="file" accept="image/*,video/*" />
              </label>
              <label>
                Video link
                <input type="url" name="link" placeholder="https://" />
              </label>
              <button className="btn secondary" disabled={busy}>
                Add media
              </button>
            </form>
            {media.map((item) => (
              <div className="media-row" key={item.id}>
                <span>
                  {(item.url || item.youtube_link || 'Media').split('/').pop()}
                </span>
                <button
                  className="link"
                  disabled={busy}
                  onClick={() => removeMedia(item)}
                >
                  Remove
                </button>
              </div>
            ))}
          </>
        ) : (
          <p>
            After publishing the event, you can attach photographs and video
            here.
          </p>
        )}
      </aside>
    </div>
  );
}

export function StaffReceipt() {
  const [result, setResult] = useState(null),
    [busy, setBusy] = useState(false),
    [notice, setNotice] = useState(''),
    [channel, setChannel] = useState('email');
  async function issue(e) {
    e.preventDefault();
    if (busy || result) return;
    const v = Object.fromEntries(new FormData(e.currentTarget));
    setBusy(true);
    setNotice('');
    try {
      const row = await read(
        database
          .from('receipts')
          .insert({
            date: v.date,
            donor_name: v.name.trim(),
            purpose: v.purpose.trim(),
            amount: Number(v.amount),
            via: channel,
            contact: (v.email || v.phone).trim(),
          })
          .select()
          .single()
      );
      const saved = {
        row,
        phone: v.phone,
        method: [v.method, v.reference].filter(Boolean).join(' / '),
      };
      setResult(saved);
      try {
        const image = await receiptImage(row, saved.method);
        setResult({ ...saved, image });
        if (channel !== 'whatsapp') {
          await sendMail({
            receipt_id: row.id,
            devotee_name: row.donor_name,
            email_to: v.email,
            amount: row.amount,
            content: image,
          });
          setNotice('Receipt emailed to the donor.');
        }
      } catch {
        setNotice(
          'The receipt is recorded. Download a copy to share with the donor.'
        );
      }
    } catch {
      setNotice(
        'Could not issue the receipt. Check the details and try again.'
      );
    } finally {
      setBusy(false);
    }
  }
  async function download() {
    try {
      downloadImage(
        result.image || (await receiptImage(result.row, result.method)),
        result.row.id
      );
    } catch {
      setNotice('The receipt file could not be prepared. Please try again.');
    }
  }
  return pageLayers(
    'StaffReceipt',
    <Page
      title="Issue a receipt"
      intro="Record a confirmed contribution and prepare the donor’s receipt."
    >
      <StaffNav />
      {result ? (
        <section className="paper prose">
          <h2>Receipt #{result.row.id} issued</h2>
          <p>
            {result.row.donor_name} · ₹{result.row.amount}
          </p>
          <div className="actions">
            <button className="btn" onClick={download}>
              Download receipt
            </button>
            {result.phone && (
              <a
                className="btn secondary"
                target="_blank"
                rel="noreferrer"
                href={
                  'https://wa.me/' +
                  result.phone.replace(/\D/g, '') +
                  '?text=' +
                  encodeURIComponent(
                    'Sasta Trust receipt #' +
                      result.row.id +
                      ' for ₹' +
                      result.row.amount +
                      ' · ' +
                      result.row.purpose
                  )
                }
              >
                Share on WhatsApp
              </a>
            )}
            <button
              disabled={busy}
              className="link"
              onClick={() => {
                setResult(null);
                setNotice('');
              }}
            >
              Issue another receipt
            </button>
          </div>
        </section>
      ) : (
        <form className="paper form staff-form" onSubmit={issue}>
          <label>
            Donor name
            <input name="name" required />
          </label>
          <div className="field-pair">
            <label>
              Amount (₹)
              <input
                name="amount"
                type="number"
                min=".01"
                max="9999999999.99"
                step=".01"
                required
              />
            </label>
            <label>
              Payment date
              <input
                type="date"
                name="date"
                defaultValue={localDate()}
                required
              />
            </label>
          </div>
          <label>
            Purpose
            <input name="purpose" required defaultValue="Anna Prasadam seva" />
          </label>
          <div className="field-pair">
            <label>
              Payment method
              <select name="method">
                {['UPI', 'Bank transfer', 'Cash', 'Cheque'].map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </label>
            <label>
              Payment reference
              <input name="reference" />
            </label>
          </div>
          <label>
            Receipt delivery
            <select
              value={channel}
              onChange={(e) => setChannel(e.target.value)}
            >
              <option value="email">Email</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="both">Email and WhatsApp</option>
            </select>
          </label>
          {channel !== 'whatsapp' && (
            <label>
              Donor email
              <input type="email" name="email" required />
            </label>
          )}
          {channel !== 'email' && (
            <label>
              WhatsApp number with country code
              <input type="tel" name="phone" required placeholder="+91…" />
            </label>
          )}
          <button className="btn" disabled={busy}>
            {busy ? 'Issuing receipt…' : 'Issue receipt'}
          </button>
        </form>
      )}
      {notice && (
        <p className="status" role="status">
          {notice}
        </p>
      )}
    </Page>
  );
}
