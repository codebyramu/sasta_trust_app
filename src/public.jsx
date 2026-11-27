import { pageLayers } from './page-layers';
import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Download,
  HandHeart,
  MapPin,
  Phone,
  Mail,
  ReceiptText,
  Users,
  Utensils,
  Landmark,
  Footprints,
  HeartHandshake,
  X,
  Expand,
} from 'lucide-react';
import { allEvents, displayDate, sendMail, localDate } from './data';
import {
  More,
  Page,
  RecordState,
  office,
  programmes,
  useRecords,
} from './shared';

const photos = [
  [
    '/videos/anna-prasadam-volunteers-poster.jpg',
    'Anna Prasadam at the Azhudha River camp',
  ],
  [
    '/videos/anna-prasadam-serving-poster.jpg',
    'Volunteers serving a freshly prepared meal',
  ],
  [
    '/photos_to_play/WhatsApp Image 2026-03-23 at 1.10.17 PM (2).jpeg',
    'Serving pilgrims at the meal station',
  ],
  [
    '/photos_to_play/WhatsApp Image 2026-03-23 at 1.10.17 PM (1).jpeg',
    'The volunteer team at the camp',
  ],
];
const serviceIcons = [Utensils, Landmark, Footprints, HeartHandshake];
const visitorLinks = [
  [
    HandHeart,
    'Make a contribution',
    'Support meals, pilgrim assistance, and temple care.',
    '/donations',
  ],
  [
    ReceiptText,
    'Find a receipt',
    'View the contributions recorded against your email.',
    '/receipts',
  ],
  [
    Users,
    'Volunteer with us',
    'Contact the trust about helping at the seva camp.',
    '/contact?subject=Volunteering',
  ],
];

export function Home() {
  const events = useRecords(allEvents);
  const next = (events.data || [])
    .filter((item) => item.date >= localDate())
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 3);
  return pageLayers(
    'Home',
    <>
      <section className="intro">
        <div className="wrap intro-grid">
          <div className="intro-text">
            <p className="eyeline">
              <i
                className="eyeline-rule"
                aria-label="Accent line"
                aria-hidden="true"
              />
              Sabarimala pilgrim services
            </p>
            <h1>
              Pilgrim care at
              <br />
              Azhudha River
            </h1>
            <p>
              Free meals, drinking water, and assistance for pilgrims travelling
              the Sabarimala route in Kerala.
            </p>
            <Link className="btn" to="/services">
              Explore our services <ArrowRight size={16} />
            </Link>
          </div>
          <figure className="lead-photo">
            <img
              src={photos[0][0]}
              fetchpriority="high"
              alt="Volunteers serving food to pilgrims at the camp"
            />
            <figcaption>
              <MapPin size={14} /> Azhudha River seva camp, Kerala
            </figcaption>
          </figure>
        </div>
      </section>
      <section className="wrap visitor">
        <div className="section-title">
          <h2>Visitor services</h2>
        </div>
        <div className="visitor-grid">
          {visitorLinks.map(([Icon, title, desc, path]) => (
            <Link className="service-card" key={path} to={path}>
              <div className="card-icons">
                <span>
                  <Icon size={26} strokeWidth={1.8} />
                </span>
                <ArrowRight size={19} />
              </div>
              <h3>{title}</h3>
              <p>{desc}</p>
            </Link>
          ))}
        </div>
      </section>
      <div className="information">
        <div className="wrap info-grid">
          <section>
            <div className="section-title">
              <h2>Upcoming events</h2>
              <More to="/events">Event calendar</More>
            </div>
            <RecordState records={events}>
              {next.length ? (
                next.map((item) => (
                  <Link
                    key={item.id}
                    to={'/occasion/' + item.id}
                    className="event-line"
                  >
                    <CalendarDays size={18} />
                    <span>
                      <small>{displayDate(item.date)}</small>
                      <b>{item.name}</b>
                    </span>
                    <ChevronRight size={16} />
                  </Link>
                ))
              ) : (
                <p className="status">
                  There are no upcoming occasions listed. Please contact the
                  trust for camp enquiries.
                </p>
              )}
            </RecordState>
          </section>
          <section>
            <div className="section-title">
              <h2>About the trust</h2>
            </div>
            <p>
              Since 2012, Sasta Trust has brought volunteers and donors together
              to serve pilgrims, care for sacred places, and support local
              communities.
            </p>
            <More to="/about">Read about our work</More>
          </section>
        </div>
      </div>
    </>
  );
}

export function About() {
  return pageLayers(
    'About',
    <Page
      title="The trust"
      intro="Sasta Trust brings people together in service along the Sabarimala pilgrimage route."
    >
      <div className="split">
        <article className="paper prose">
          <h2>Service at Azhudha River</h2>
          <p>
            The trust began its work in 2012. At the Azhudha River camp in
            Kerala, volunteers prepare Anna Prasadam and serve meals and
            drinking water to passing pilgrims.
          </p>
          <h2>Community participation</h2>
          <p>
            Contributions help provide food and supplies, care for heritage
            shrines, and support local families. The trust office connects
            people who want to volunteer with the work at the camp.
          </p>
          <More to="/contact?subject=Volunteering">
            Enquire about volunteering
          </More>
        </article>
        <figure className="page-photo">
          <img src={photos[1][0]} alt={photos[1][1]} />
          <figcaption>{photos[1][1]}</figcaption>
        </figure>
      </div>
    </Page>
  );
}

export function Services() {
  return pageLayers(
    'Services',
    <Page
      title="Our services"
      intro="The trust supports pilgrims and local communities through four areas of seva."
    >
      <div className="programme-grid">
        {programmes.map(([title, desc], i) => {
          const Icon = serviceIcons[i];
          return (
            <article
              id={'seva-' + (i + 1)}
              className="paper programme"
              key={title}
            >
              <Icon size={25} />
              <h2>{title}</h2>
              <p>{desc}</p>
              <More to="/donations">Support this service</More>
            </article>
          );
        })}
      </div>
    </Page>
  );
}

export function Gallery() {
  const [selected, setSelected] = useState(0);
  const ref = useRef(null);
  function step(by) {
    setSelected((i) => (i + by + photos.length) % photos.length);
  }
  return pageLayers(
    'Gallery',
    <Page
      title="Camp gallery"
      intro="Photographs from Anna Prasadam service at the Azhudha River camp."
    >
      <div className="photo-grid">
        {photos.map(([url, caption], i) => (
          <button
            key={url}
            onClick={() => {
              setSelected(i);
              ref.current.showModal();
            }}
          >
            <img src={url} alt="" loading="lazy" />
            <span>
              {caption}
              <Expand size={15} />
            </span>
          </button>
        ))}
      </div>
      <dialog
        ref={ref}
        aria-label="Enlarged camp photograph"
        onKeyDown={(e) => {
          if (e.key === 'ArrowLeft') step(-1);
          if (e.key === 'ArrowRight') step(1);
        }}
      >
        <button
          className="close"
          onClick={() => ref.current.close()}
          aria-label="Close photograph"
        >
          <X />
        </button>
        <img src={photos[selected][0]} alt={photos[selected][1]} />
        <div className="viewer-bar">
          <button aria-label="Previous photograph" onClick={() => step(-1)}>
            <ChevronLeft />
          </button>
          <span aria-live="polite">{photos[selected][1]}</span>
          <button aria-label="Next photograph" onClick={() => step(1)}>
            <ChevronRight />
          </button>
        </div>
      </dialog>
    </Page>
  );
}

export function Giving() {
  return pageLayers(
    'Giving',
    <Page
      title="Make a donation"
      intro="Contribute to the trust’s pilgrim welfare and community services."
    >
      <div className="split">
        <article className="paper prose">
          <h2>Contribute by UPI</h2>
          <ol className="steps">
            <li>
              Scan the trust’s QR code using your UPI app, or download the image
              and open it in the app.
            </li>
            <li>
              Check the recipient name, enter your contribution, and confirm the
              payment.
            </li>
            <li>
              Share your name, email, and transaction reference with the trust
              office to request a receipt.
            </li>
          </ol>
          <More to="/contact?subject=Donation%20receipt">
            Request a donation receipt
          </More>
          <hr />
          <h3>Already received a receipt?</h3>
          <p>
            Sign in with the email address you shared when the contribution was
            recorded.
          </p>
          <More to="/receipts">Find my receipts</More>
        </article>
        <section className="paper qr">
          <h2>Trust payment QR</h2>
          <img src="/QRcode/QRCode.png" alt="Sasta Trust UPI payment QR code" />
          <a
            className="btn secondary"
            href="/QRcode/QRCode.png"
            download="Sasta-Trust-UPI.png"
          >
            <Download size={15} />
            Download QR code
          </a>
        </section>
      </div>
    </Page>
  );
}

export function Contact() {
  const subject =
    new URLSearchParams(window.location.search).get('subject') ||
    'General enquiry';
  const [busy, setBusy] = useState(false),
    [notice, setNotice] = useState('');
  async function submit(e) {
    e.preventDefault();
    const form = e.currentTarget;
    const values = Object.fromEntries(new FormData(form));
    setBusy(true);
    setNotice('');
    try {
      await sendMail({
        ...values,
        message: values.subject + '\n\n' + values.message,
        seva_interest: values.subject,
      });
      setNotice('Your enquiry has been sent to the trust office.');
      form.reset();
    } catch {
      setNotice(
        'Your enquiry could not be sent. Please use the office email or telephone number below.'
      );
    } finally {
      setBusy(false);
    }
  }
  return pageLayers(
    'Contact',
    <Page
      title="Contact the trust"
      intro="Ask about the camp, volunteering, or a contribution."
    >
      <div className="split">
        <form className="paper form" onSubmit={submit}>
          <h2>Send an enquiry</h2>
          <label>
            Your name
            <input name="from_name" autoComplete="name" required />
          </label>
          <label>
            Email address
            <input
              name="from_email"
              type="email"
              autoComplete="email"
              required
            />
          </label>
          <label>
            Subject
            <select name="subject" defaultValue={subject}>
              {[
                'General enquiry',
                'Volunteering',
                'Donation receipt',
                'Pilgrim services',
              ].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>
          <label>
            Message
            <textarea name="message" rows="4" required />
          </label>
          <button className="btn" type="submit" disabled={busy}>
            {busy ? 'Sending…' : 'Send enquiry'}
            <ArrowRight size={16} />
          </button>
          {notice && <p role="status">{notice}</p>}
        </form>
        <aside className="paper contacts">
          <h2>Trust office</h2>
          <a href={'mailto:' + office.email}>
            <Mail size={17} />
            {office.email}
          </a>
          <a href={office.tel}>
            <Phone size={17} />
            {office.phone}
          </a>
          <span>
            <MapPin size={17} />
            Azhudha River, Kerala
          </span>
        </aside>
      </div>
    </Page>
  );
}
