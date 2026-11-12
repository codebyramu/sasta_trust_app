import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Droplets,
  HeartHandshake,
  Landmark,
  Mail,
  MapPin,
  Phone,
  Utensils,
} from 'lucide-react';
import emailjs from '@emailjs/browser';

const heroSlides = [
  {
    image: '/photos_to_play/WhatsApp%20Image%202026-03-23%20at%201.10.17%20PM%20(2).jpeg',
    alt: 'Volunteers serving Anna Prasadam to pilgrims at the camp',
    caption: 'Anna Prasadam seva · Azhudha River',
  },
  {
    image: '/photos_to_play/WhatsApp%20Image%202026-03-23%20at%201.10.17%20PM.jpeg',
    alt: 'A volunteer offers food to a pilgrim',
    caption: 'A meal shared along the Sabarimala route',
  },
  {
    image: '/photos_to_play/WhatsApp%20Image%202026-03-23%20at%201.10.17%20PM%20(1).jpeg',
    alt: 'Volunteers preparing a meal for pilgrims',
    caption: 'Prepared and served by volunteers',
  },
];

const waysToHelp = [
  { title: 'Anna Prasadam', image: heroSlides[1].image, alt: 'Serving a meal to a pilgrim', icon: Utensils },
  { title: 'Drinking water', image: heroSlides[2].image, alt: 'Food and water service at the camp', icon: Droplets },
  { title: 'Pilgrim assistance', image: heroSlides[0].image, alt: 'Volunteers helping pilgrims at the camp', icon: HeartHandshake },
  { title: 'Temple care', image: null, alt: '', icon: Landmark },
  { title: 'Route support', image: null, alt: '', icon: MapPin },
];

const programmes = [
  {
    number: '01',
    title: 'Anna Prasadam Seva',
    copy: 'Free meals for pilgrims travelling the Sabarimala route near the Azhudha River.',
    icon: Utensils,
  },
  {
    number: '02',
    title: 'Temple restoration',
    copy: 'Care for heritage shrines and support for the people who sustain daily worship.',
    icon: Landmark,
  },
  {
    number: '03',
    title: 'Pilgrim and community support',
    copy: 'Practical help for pilgrims, elders and families through community-led seva.',
    icon: HeartHandshake,
  },
];

export const Landing = () => {
  const [activeSlide, setActiveSlide] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', message: '' });
  const revealRef = useRef(null);
  const prefersReducedMotion = useReducedMotion();
  const skipScrollReveal = prefersReducedMotion || isMobile;
  const { scrollYProgress } = useScroll({
    target: revealRef,
    offset: ['start start', 'end end'],
  });
  const revealEnd = 0.353;
  const revealClose = revealEnd * 0.9;
  const revealScale = useTransform(scrollYProgress, [0, revealEnd], [0.55, 8.1]);
  const introFadeStart = revealEnd * 0.08;
  const introFadeEnd = revealEnd * 0.25;
  const introOpacity = useTransform(scrollYProgress, (progress) => Math.max(0, Math.min(1, (introFadeEnd - progress) / (introFadeEnd - introFadeStart))));
  const introY = useTransform(scrollYProgress, [introFadeStart, introFadeEnd], [0, -24]);
  const heroOpacity = useTransform(scrollYProgress, (progress) => Math.max(0, Math.min(1, (progress - revealClose) / (revealEnd - revealClose))));
  const heroY = useTransform(scrollYProgress, [revealClose, revealEnd], [24, 0]);
  const wordOpacity = useTransform(scrollYProgress, (progress) => Math.max(0, Math.min(1, (revealEnd - progress) / (revealEnd - revealClose))));
  const apertureClip = useTransform(revealScale, (scale) => {
    const radiusX = 4.2 * scale;
    const radiusY = 9.3 * scale;
    return `ellipse(${radiusX}vw ${radiusY}svh at 50% 57%)`;
  });

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % heroSlides.length);
    }, 6500);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const media = window.matchMedia('(max-width: 700px)');
    const update = () => setIsMobile(media.matches);
    update();
    media.addEventListener?.('change', update);
    return () => media.removeEventListener?.('change', update);
  }, []);

  const goToSlide = (direction) => {
    setActiveSlide((current) => (current + direction + heroSlides.length) % heroSlides.length);
  };

  const handleContactSubmit = async (event) => {
    event.preventDefault();
    if (!formData.name.trim()) {
      setFormError('Please enter your name.');
      return;
    }

    setSubmitting(true);
    setFormError('');
    try {
      const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
      const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
      const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
      if (!serviceId || !templateId || !publicKey) throw new Error('Contact form is not configured');

      await emailjs.send(serviceId, templateId, {
        from_name: formData.name,
        from_email: formData.email || 'devotee@sastatrust.org',
        phone: formData.phone,
        message: formData.message,
        rating: 'Not provided',
        likelihood: 'Not provided',
        seva_interest: 'Not provided',
      }, publicKey);
      setFormSubmitted(true);
    } catch (error) {
      console.error('Contact form submission failed:', error);
      setFormError('We could not send your message. Please email sastatrust@gmail.com or call +91 93916 72398.');
    } finally {
      setSubmitting(false);
    }
  };

  const updateField = (field) => (event) => setFormData((current) => ({ ...current, [field]: event.target.value }));

  return (
    <div className="impact-home">
      <section className="impact-scroll-reveal" ref={revealRef} aria-label="A moment of care for every pilgrim">
        <div className="impact-scroll-stage" id="home">
          <motion.div
            className="impact-reveal-intro"
            style={{ opacity: skipScrollReveal ? 0 : introOpacity, y: skipScrollReveal ? -28 : introY }}
            aria-hidden={skipScrollReveal}
          >
            <p className="impact-reveal-kicker">Sasta Trust · Azhudha River, Kerala</p>
            <h2>Hope begins with a meal.</h2>
            <p>Free Anna Prasadam and drinking water on the Sabarimala route.</p>
            <div className="impact-reveal-promises">
              <span><Utensils size={15} /> Anna Prasadam</span>
              <span><Droplets size={15} /> Drinking water</span>
              <span><HeartHandshake size={15} /> Pilgrim support</span>
            </div>
            {!skipScrollReveal && <span className="impact-reveal-hint"><span /> Scroll to see the seva</span>}
          </motion.div>

          {!skipScrollReveal && <motion.div
            className="impact-reveal-side-notes"
            style={{ opacity: introOpacity }}
            aria-hidden="true"
          >
            <div className="impact-reveal-side-note">
              <Utensils size={19} />
              <p>Made with care</p>
              <span>Fresh meals, freely shared with pilgrims.</span>
            </div>
            <div className="impact-reveal-side-note is-right">
              <MapPin size={19} />
              <p>A pause along the way</p>
              <span>Water and a helping hand near Azhudha River.</span>
            </div>
          </motion.div>}

          <motion.div
            className="impact-reveal-backdrop"
            style={{ opacity: skipScrollReveal ? 1 : heroOpacity }}
            aria-hidden="true"
          >
            <div className="impact-hero-slides">
              {heroSlides.map((slide, index) => (
                <img
                  key={slide.image}
                  className={`impact-hero-image${index === activeSlide ? ' is-active' : ''}`}
                  src={slide.image}
                  alt=""
                  aria-hidden="true"
                  fetchpriority={index === 0 ? 'high' : 'auto'}
                />
              ))}
            </div>
            <div className="impact-reveal-shade" />
          </motion.div>

          {!skipScrollReveal && <motion.div
            className="impact-reveal-aperture"
            style={{ clipPath: apertureClip, opacity: wordOpacity }}
            aria-hidden="true"
          >
            <div className="impact-hero-slides">
              {heroSlides.map((slide, index) => (
                <img
                  key={slide.image}
                  className={`impact-hero-image${index === activeSlide ? ' is-active' : ''}`}
                  src={slide.image}
                  alt=""
                  aria-hidden="true"
                  fetchpriority={index === 0 ? 'high' : 'auto'}
                />
              ))}
            </div>
          </motion.div>}

          {!skipScrollReveal && <div className="impact-reveal-word-anchor" aria-hidden="true">
            <motion.div
              className="impact-reveal-word-stage"
              style={{ scale: revealScale, opacity: wordOpacity }}
            >
              <span className="impact-reveal-word-before">H</span>
              <span className="impact-reveal-word-o" />
              <span className="impact-reveal-word-after">PE</span>
            </motion.div>
          </div>}

          {!skipScrollReveal && <motion.div
            className="impact-reveal-detail-rail"
            style={{ opacity: introOpacity }}
            aria-hidden="true"
          >
            <p className="impact-reveal-detail-heading">Care along the pilgrim path</p>
            <div className="impact-reveal-detail-items">
              <span><CalendarDays size={15} /> Serving since 2012</span>
              <span><HeartHandshake size={15} /> Volunteer-led seva</span>
              <span><MapPin size={15} /> Azhudha River route</span>
            </div>
          </motion.div>}

          <motion.div
            className="impact-reveal-hero-copy"
            style={{ opacity: skipScrollReveal ? 1 : heroOpacity, y: skipScrollReveal ? 0 : heroY }}
          >
            <p className="impact-eyebrow"><span /> Sasta Trust · Azhudha River, Kerala</p>
            <h1>Meals and care<br /><em>for every pilgrim.</em></h1>
            <p>Sasta Trust volunteers serve free meals and drinking water along the Sabarimala pilgrimage route.</p>
            <div className="impact-hero-actions">
              <Link to="/donations" className="impact-donate-button">Support the seva <ArrowRight size={17} /></Link>
              <Link to="/dashboard" className="impact-hero-secondary"><CalendarDays size={16} /> Festival calendar</Link>
            </div>
          </motion.div>

          <motion.div className="impact-reveal-bottom" style={{ opacity: skipScrollReveal ? 1 : heroOpacity }}>
            <p><MapPin size={15} /> {heroSlides[activeSlide].caption}</p>
            <div className="impact-carousel-controls" aria-label="Hero image controls">
              <button type="button" onClick={() => goToSlide(-1)} aria-label="Previous image"><ArrowLeft size={17} /></button>
              <button type="button" onClick={() => goToSlide(1)} aria-label="Next image"><ArrowRight size={17} /></button>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="impact-ways" id="how-we-help">
        <div className="impact-section-heading">
          <p className="impact-kicker">Seva, in many forms</p>
          <h2>How we work to make a difference</h2>
        </div>
        <div className="impact-ways-grid">
          {waysToHelp.map(({ title, image, alt, icon: Icon }) => (
            <Link to="/donations" className="impact-way" key={title}>
              <span className="impact-way-image">
                {image ? <img src={image} alt={alt} loading="lazy" /> : <span className="impact-way-placeholder"><Icon size={38} strokeWidth={1.5} /></span>}
                <span className="impact-way-icon-badge"><Icon size={19} /></span>
              </span>
              <span className="impact-way-title">{title}</span>
              <span className="impact-way-arrow"><ArrowRight size={14} /></span>
            </Link>
          ))}
        </div>
      </section>

      <section className="impact-story" id="impact-story">
        <div className="impact-story-photo">
          <img src="/photos_to_play/WhatsApp%20Image%202026-03-23%20at%201.10.17%20PM.jpeg" alt="Volunteers serving a meal to a pilgrim at the camp" loading="lazy" />
          <span>At the Azhudha River camp</span>
        </div>
        <div className="impact-story-copy">
          <p className="impact-kicker">A meal along the way</p>
          <h2>A meal, made possible by many hands.</h2>
          <p>On the journey to Sabarimala, a meal and drinking water can offer a welcome pause. At the Azhudha River camp, volunteers prepare and serve Anna Prasadam to pilgrims.</p>
          <p>The service is free. Contributors and volunteers make it possible, one shared offering at a time.</p>
          <Link to="/donations" className="impact-inline-link">Be part of the seva <ArrowRight size={16} /></Link>
        </div>
      </section>

      <section className="impact-about" aria-labelledby="impact-about-title">
        <div className="impact-about-image">
          <img src="/photos_to_play/WhatsApp%20Image%202026-03-23%20at%201.10.17%20PM%20(2).jpeg" alt="The Sasta Trust seva team preparing food at the pilgrim camp" loading="lazy" />
        </div>
        <div className="impact-about-copy">
          <p className="impact-kicker">The Sasta Trust</p>
          <h2 id="impact-about-title">A tradition of service, carried forward together.</h2>
          <p>Sasta Trust began in 2012 with a commitment to serve pilgrims and care for sacred places. Today, its work includes Anna Prasadam at Azhudha River, temple restoration, and support for pilgrims and local communities.</p>
          <Link to="/donations" className="impact-blue-button">About our seva <ArrowRight size={16} /></Link>
        </div>
      </section>

      <section className="impact-stats" aria-label="Sasta Trust at a glance">
        <div><strong>Since 2012</strong><span>Serving with devotion</span></div>
        <div><strong>Free meals</strong><span>Anna Prasadam for pilgrims</span></div>
        <div><strong>Azhudha River</strong><span>Along the Sabarimala route</span></div>
        <div><strong>Community-led</strong><span>Made possible by volunteers</span></div>
      </section>

      <section className="impact-programmes" id="seva-causes">
        <div className="impact-programmes-heading">
          <div>
            <p className="impact-kicker">Ways to take part</p>
            <h2>Support a seva</h2>
          </div>
          <Link to="/donations" className="impact-inline-link">View all ways to give <ArrowRight size={16} /></Link>
        </div>
        <div className="impact-programme-list">
          {programmes.map(({ number, title, copy, icon: Icon }) => (
            <article className="impact-programme" key={number}>
              <span className="impact-programme-number">{number}</span>
              <span className="impact-programme-icon"><Icon size={22} strokeWidth={1.7} /></span>
              <div><h3>{title}</h3><p>{copy}</p></div>
              <Link to="/donations" aria-label={`Support ${title}`}><ArrowRight size={18} /></Link>
            </article>
          ))}
        </div>
      </section>

      <section className="impact-contact" id="contact">
        <div className="impact-contact-copy">
          <p className="impact-kicker">Get in touch</p>
          <h2>We’d love to hear from you.</h2>
          <p>Ask us about volunteering, pilgrim support, or contributing to a seva.</p>
          <a href="mailto:sastatrust@gmail.com"><Mail size={17} /> sastatrust@gmail.com</a>
          <a href="tel:+919391672398"><Phone size={17} /> +91 93916 72398</a>
        </div>
        <div className="impact-contact-panel">
          {formSubmitted ? (
            <div className="impact-contact-success">
              <CheckCircle2 size={30} />
              <h3>Thank you for writing to us.</h3>
              <p>Your message has been sent with gratitude.</p>
              <button type="button" onClick={() => setFormSubmitted(false)}>Send another message</button>
            </div>
          ) : (
            <form className="impact-contact-form" onSubmit={handleContactSubmit}>
              <h3>Send a message</h3>
              <label>Name<input type="text" autoComplete="name" required value={formData.name} onChange={updateField('name')} placeholder="Your name" /></label>
              <div className="impact-contact-row">
                <label>Email<input type="email" autoComplete="email" value={formData.email} onChange={updateField('email')} placeholder="Email address" /></label>
                <label>Phone<input type="tel" autoComplete="tel" value={formData.phone} onChange={updateField('phone')} placeholder="Phone number" /></label>
              </div>
              <label>Message<textarea rows={3} value={formData.message} onChange={updateField('message')} placeholder="How can we help?" /></label>
              {formError && <p role="alert" className="impact-form-error">{formError}</p>}
              <button type="submit" disabled={submitting}>{submitting ? 'Sending…' : 'Send message'} <ArrowRight size={16} /></button>
            </form>
          )}
        </div>
      </section>

      <footer className="impact-footer">
        <div className="impact-footer-brand">
          <Link to="/" className="impact-footer-logo"><img src="/sasta_logo.png" alt="" /> <span>Sasta Trust</span></Link>
          <p>Anna Prasadam Seva and pilgrim support at the Azhudha River, Kerala.</p>
          <div className="impact-footer-contact"><a href="mailto:sastatrust@gmail.com">sastatrust@gmail.com</a><a href="tel:+919391672398">+91 93916 72398</a></div>
        </div>
        <div className="impact-footer-links">
          <h3>Explore</h3>
          <Link to="/dashboard">Festival calendar</Link>
          <Link to="/donations">Ways to contribute</Link>
          <a href="#how-we-help">Our seva</a>
        </div>
        <a className="impact-footer-qr" href="/donations" aria-label="Open donation options">
          <span>Scan to support the seva</span>
          <img src="/QRcode/QRCode.png" alt="Sasta Trust UPI donation QR code" />
        </a>
        <div className="impact-footer-bottom"><span>© 2026 Sasta Trust</span><span>Serving pilgrims since 2012 · Swamy Sharanam</span><button type="button" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>Back to top ↑</button></div>
      </footer>
    </div>
  );
};
