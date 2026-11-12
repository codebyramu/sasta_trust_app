import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowDown, ArrowRight, Heart, HeartHandshake, Phone, Users } from 'lucide-react';

const causes = [
  { title: 'Anna Prasadam seva', copy: 'Help prepare and serve nourishing meals to pilgrims along the Azhudha River route.', image: '/photos_to_play/WhatsApp%20Image%202026-03-23%20at%201.10.17%20PM.jpeg', label: 'A meal shared on the pilgrimage' },
  { title: 'Care for sacred spaces', copy: 'Support the upkeep of heritage temples and the people who care for them.', image: '/gallery/heritage_temple_restoration.jpg', label: 'Temple care and restoration' },
  { title: 'Support for pilgrims', copy: 'Help make the pilgrimage safer and more welcoming for people who need a little extra care.', image: '/photos_to_play/WhatsApp%20Image%202026-03-23%20at%201.10.17%20PM%20(2).jpeg', label: 'Volunteers supporting pilgrims' },
  { title: 'Community care', copy: 'Extend practical support to elders and families in the Sasta Trust community.', image: '/photos_to_play/WhatsApp%20Image%202026-03-23%20at%201.10.18%20PM.jpeg', label: 'Community members gathered together' },
];

export const Donate = () => (
  <main className="contribute-page">
    <section className="contribute-hero">
      <img src="/photos_to_play/WhatsApp%20Image%202026-03-23%20at%201.10.17%20PM%20(2).jpeg" alt="Volunteers serving pilgrims at the Azhudha River" />
      <div className="contribute-hero-shade" />
      <div className="contribute-hero-copy">
        <p className="contribute-kicker">Swamy Sharanam · Seva at Azhudha River</p>
        <h1>Make room for one more at the meal.</h1>
        <p>Your support helps Sasta Trust care for pilgrims, serve Anna Prasadam and look after the places that bring people together.</p>
        <a className="contribute-primary" href="#ways-to-give">Explore ways to give <ArrowDown size={17} /></a>
      </div>
      <span className="contribute-photo-caption">Azhudha River · Kerala</span>
    </section>

    <section className="contribute-intro">
      <p className="impact-kicker">Every offering carries the seva forward</p>
      <h2>Choose the kind of care<br />you’d like to stand behind.</h2>
      <p>Gifts help sustain ongoing service for pilgrims and the local community. Here are some of the ways the trust serves.</p>
    </section>

    <section className="contribute-causes" id="ways-to-give">
      {causes.map((cause, index) => (
        <article className="contribute-cause" key={cause.title}>
          <div className="contribute-cause-image">
            <img src={cause.image} alt={cause.label} loading="lazy" />
            <span>{String(index + 1).padStart(2, '0')}</span>
          </div>
          <div className="contribute-cause-copy">
            <h3>{cause.title}</h3>
            <p>{cause.copy}</p>
          </div>
        </article>
      ))}
    </section>

    <section className="contribute-give" id="give">
      <div className="contribute-give-copy">
        <p className="impact-kicker">Your support becomes seva</p>
        <h2>Give in a way that works for you.</h2>
        <p>Scan the trust’s payment QR with your UPI app. After donating, share your name and transaction details so the team can help with your receipt.</p>
        <div className="contribute-give-note"><Heart size={17} /> Every contribution is received with gratitude.</div>
        <a className="contribute-contact-link" href="tel:+919391672398"><Phone size={16} /> Questions? Call +91 93916 72398</a>
        <Link className="contribute-receipts-link" to="/donate">Already contributed? Find your receipt <ArrowRight size={16} /></Link>
      </div>
      <div className="contribute-qr-card">
        <div className="contribute-qr-heading"><span><HeartHandshake size={19} /></span><div><strong>Scan to contribute</strong><small>UPI · Any payment app</small></div></div>
        <img src="/QRcode/QRCode.png" alt="Sasta Trust payment QR code" />
        <p>Check the recipient name in your payment app before confirming.</p>
      </div>
    </section>

    <section className="contribute-thanks">
      <div className="contribute-thanks-icon"><Users size={24} /></div>
      <p className="impact-kicker">A shared offering</p>
      <h2>Seva grows when we do it together.</h2>
      <p>Thank you for standing with pilgrims, volunteers and the communities around the Azhudha River.</p>
      <Link to="/">Learn about the work <ArrowRight size={16} /></Link>
    </section>
  </main>
);
