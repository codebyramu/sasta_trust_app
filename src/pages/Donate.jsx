import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Heart, HeartHandshake, Leaf, Phone, Users } from 'lucide-react';

const causes = [
  { title: 'Anna Prasadam seva', eyebrow: 'PILGRIM CARE', copy: 'Help prepare and serve nourishing meals to pilgrims along the Azhudha River route.', image: '/photos_to_play/WhatsApp%20Image%202026-03-23%20at%201.10.17%20PM.jpeg', label: 'A meal shared on the pilgrimage' },
  { title: 'Care for sacred spaces', eyebrow: 'SACRED SPACES', copy: 'Support the upkeep of heritage temples and the people who care for them.', image: '/gallery/heritage_temple_restoration.jpg', label: 'Temple care and restoration' },
  { title: 'Support for pilgrims', eyebrow: 'PILGRIM SUPPORT', copy: 'Help make the pilgrimage safer and more welcoming for people who need a little extra care.', image: '/photos_to_play/WhatsApp%20Image%202026-03-23%20at%201.10.17%20PM%20(2).jpeg', label: 'Volunteers supporting pilgrims' },
  { title: 'Community care', eyebrow: 'COMMUNITY CARE', copy: 'Extend practical support to elders and families in the Sasta Trust community.', image: '/photos_to_play/WhatsApp%20Image%202026-03-23%20at%201.10.18%20PM.jpeg', label: 'Community members gathered together' },
];

export const Donate = () => (
  <main className="contribute-page">
    <section className="contribute-hero">
      <div className="contribute-hero-copy">
        <p className="contribute-kicker">Ways to give · Sasta Trust</p>
        <h1>Put your support where it matters to you.</h1>
        <p>Choose a seva that speaks to you. Your gift helps care for pilgrims, serve Anna Prasadam and support the Azhudha River community.</p>
        <a className="contribute-primary" href="#ways-to-give">Explore the seva <ArrowRight size={16} /></a>
        <div className="contribute-hero-promise"><Leaf size={17} /><span>Every offering helps carry the service forward.</span></div>
      </div>
      <figure className="contribute-hero-photo">
        <img src="/photos_to_play/WhatsApp%20Image%202026-03-23%20at%201.10.17%20PM%20(2).jpeg" alt="Volunteers serving pilgrims at the Azhudha River" />
        <figcaption><span>Anna Prasadam seva</span><span>Azhudha River · Kerala</span></figcaption>
      </figure>
    </section>

    <section className="contribute-intro">
      <div><p className="impact-kicker">The work your gift supports</p><h2>Four ways to be part of the seva.</h2></div>
      <p>Choose where you feel connected. Our team can help you direct your contribution or answer questions before you give.</p>
    </section>

    <section className="contribute-causes" id="ways-to-give">
      {causes.map((cause) => (
        <article className="contribute-cause" key={cause.title}>
          <div className="contribute-cause-image">
            <img src={cause.image} alt={cause.label} loading="lazy" />
          </div>
          <div className="contribute-cause-copy">
            <p className="contribute-cause-eyebrow">{cause.eyebrow}</p>
            <h3>{cause.title}</h3>
            <p>{cause.copy}</p>
            <a href="#give">Support this seva <ArrowRight size={15} /></a>
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
