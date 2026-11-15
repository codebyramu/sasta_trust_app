import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from 'framer-motion';
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
    video: '/videos/anna-prasadam-volunteers.mp4',
    poster: '/videos/anna-prasadam-volunteers-poster.jpg',
    alt: 'Volunteers serving Anna Prasadam to pilgrims at the camp',
    caption: 'Anna Prasadam seva · Azhudha River',
  },
  {
    video: '/videos/anna-prasadam-serving.mp4',
    poster: '/videos/anna-prasadam-serving-poster.jpg',
    alt: 'A volunteer offers food to a pilgrim',
    caption: 'A meal shared along the Sabarimala route',
  },
];

const waysToHelp = [
  { title: 'Anna Prasadam', image: heroSlides[1].poster, alt: 'Serving a meal to a pilgrim', icon: Utensils },
  { title: 'Drinking water', image: '/photos_to_play/WhatsApp%20Image%202026-03-23%20at%201.10.17%20PM%20(1).jpeg', alt: 'Food and water service at the camp', icon: Droplets },
  { title: 'Pilgrim assistance', image: heroSlides[0].poster, alt: 'Volunteers helping pilgrims at the camp', icon: HeartHandshake },
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
  const [isMobile, setIsMobile] = useState(() => window.matchMedia('(max-width: 700px)').matches);
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
  const referenceProgress = useTransform(scrollYProgress, (progress) => {
    const sectionHeight = revealRef.current?.offsetHeight || window.innerHeight;
    const availableScroll = Math.max(1, sectionHeight - window.innerHeight);
    const referenceTravel = Math.max(600, window.innerHeight * 2.55);
    return Math.max(0, Math.min(1, progress * availableScroll / referenceTravel));
  });
  const easedProgress = useSpring(referenceProgress, { stiffness: 180, damping: 28, mass: 0.55 });
  const phase = (progress, start, end) => {
    const value = Math.max(0, Math.min(1, (progress - start) / (end - start)));
    return value * value * (3 - 2 * value);
  };
  const getOrnamentProgress = (progress) => {
    if (progress < 0.2) return 0;
    if (progress < 0.53) return phase(progress, 0.2, 0.53);
    if (progress < 0.58) return 1;
    return 1 - phase(progress, 0.58, 1);
  };
  const paperTransform = useTransform(easedProgress, (progress) => {
    const p = getOrnamentProgress(progress);
    const scale = Math.min(window.innerWidth / 1366, (revealRef.current?.querySelector('.impact-scroll-stage')?.clientHeight || window.innerHeight) / 768);
    const x = (-1200 * (1 - p)) * scale;
    const y = (-65 * (1 - p) - Math.sin(p * Math.PI) * 83) * scale;
    const rotate = -34 * (1 - p) + 23 * Math.sin(p * Math.PI * 1.9) * (1 - p);
    const size = 0.75 + 0.25 * p + 0.11 * Math.sin(p * Math.PI) * (1 - p);
    const skew = 8 * (1 - p) * Math.sin(p * Math.PI * 1.8);
    return `translate3d(${x}px, ${y}px, 0) rotate(${rotate}deg) scale(${size}) skewY(${skew}deg)`;
  });
  const paperFilter = useTransform(easedProgress, (progress) => {
    const p = getOrnamentProgress(progress);
    return `drop-shadow(${8 * p}px ${11 * p}px ${9 * p}px rgba(31,30,12,${0.08 * p}))`;
  });
  const arrowTransform = useTransform(easedProgress, (progress) => {
    const w = getOrnamentProgress(progress);
    const scale = Math.min(window.innerWidth / 1366, (revealRef.current?.querySelector('.impact-scroll-stage')?.clientHeight || window.innerHeight) / 768);
    const bounce = (1 - w) * Math.sin(w * Math.PI * 2.5) * 12 * scale;
    const y = (-227 * (1 - w)) * scale + bounce;
    return `translate3d(0, ${y}px, 0)`;
  });
  const flowerTransform = useTransform(easedProgress, (progress) => {
    const f = getOrnamentProgress(progress);
    const scale = Math.min(window.innerWidth / 1366, (revealRef.current?.querySelector('.impact-scroll-stage')?.clientHeight || window.innerHeight) / 768);
    const x = (250 * (1 - f)) * scale;
    const y = (235 * (1 - f) - 24 * Math.sin(Math.PI * f)) * scale;
    const rotate = 42 * (1 - f) - 8 * Math.sin(f * Math.PI * 1.6) * (1 - f);
    const size = 0.72 + 0.28 * f;
    return `translate3d(${x}px, ${y}px, 0) rotate(${rotate}deg) scale(${size})`;
  });
  const revealScale = useTransform(easedProgress, (progress) => {
    if (progress < 0.2) return 0.55 + (0.45 * phase(progress, 0, 0.2));
    if (progress < 0.58) return 1;
    if (progress < 0.74) return 1 + (1.5 * phase(progress, 0.58, 0.74));
    if (progress < 0.88) return 2.5 + (5.5 * phase(progress, 0.74, 0.88));
    return 8 + (10.5 * phase(progress, 0.88, 1));
  });
  const sceneryScale = useTransform(easedProgress, [0, 1], [1, 1.12]);
  const sceneryY = useTransform(easedProgress, [0, 1], [0, -30]);
  const sceneryOpacity = useTransform(easedProgress, [0, 0.2, 0.53], [1, 0.45, 0]);
  const shadeOpacity = useTransform(easedProgress, [0, 0.9, 1], [0.18, 0.28, 0.58]);
  const leftContentOpacity = useTransform(
    easedProgress,
    [0, 0.08, 0.2],
    [1, 0.42, 0],
  );
  const leftPanelOpacity = useTransform(
    easedProgress,
    [0, 0.2, 0.53],
    [1, 0.45, 0],
  );
  const introY = useTransform(easedProgress, [0, 0.2], [0, -18]);
  const heroOpacity = useTransform(easedProgress, (progress) => Math.max(0, Math.min(1, (progress - 0.9) / 0.1)));
  const heroY = useTransform(easedProgress, [0.9, 1], [24, 0]);
  const wordOpacity = useTransform(easedProgress, [0.84, 1], [1, 0]);
  const rightPhotoOpacity = useTransform(
    easedProgress,
    [0, 0.06, 0.2],
    [1, 0.35, 0],
  );
  const apertureClip = useTransform(revealScale, (scale) => {
    const stage = revealRef.current?.querySelector('.impact-scroll-stage');
    const stageWidth = stage?.clientWidth || window.innerWidth;
    const stageHeight = stage?.clientHeight || window.innerHeight;
    // The lettering's gold bevel grows about five viewBox units into the O.
    const radiusX = stageWidth * (109 / 1366) * scale;
    const radiusY = stageHeight * (136 / 768) * scale;
    const centerX = 42.6;
    const centerY = 58;
    return `ellipse(${radiusX}px ${radiusY}px at ${centerX}% ${centerY}%)`;
  });

  useEffect(() => {
    const videos = revealRef.current?.querySelectorAll('.impact-reveal-aperture video');
    if (!videos?.length) return undefined;

    const syncPlayback = (progress) => {
      videos.forEach((video, index) => {
        if (index === activeSlide && progress > 0.002 && !prefersReducedMotion) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      });
    };

    syncPlayback(scrollYProgress.get());
    const unsubscribe = scrollYProgress.on('change', syncPlayback);
    return () => {
      unsubscribe();
      videos.forEach((video) => video.pause());
    };
  }, [activeSlide, prefersReducedMotion, scrollYProgress]);

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
            className="impact-scroll-left-panel"
            style={{ opacity: skipScrollReveal ? 1 : leftPanelOpacity }}
            aria-hidden="true"
          />
          <motion.div
            className="impact-scroll-right-photo"
            style={{ opacity: skipScrollReveal ? 0 : rightPhotoOpacity }}
            aria-hidden="true"
          />
          {!skipScrollReveal && <>
            <motion.img
              className="impact-reveal-paper"
              src="/gallery/hope-scroll-paper.png"
              alt=""
              style={{ transform: paperTransform, filter: paperFilter }}
              aria-hidden="true"
            />
            <motion.div className="impact-reveal-arrow" style={{ transform: arrowTransform }} aria-hidden="true">
              <svg viewBox="0 0 300 76" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 39H105M195 39H296" fill="none" stroke="#D5AF67" strokeWidth="2" strokeLinecap="round" />
                <path d="M150 61C133 51 128 38 135 27C145 33 150 43 150 61Z" fill="#285943" stroke="#E5C780" strokeWidth="2" strokeLinejoin="round" />
                <path d="M150 61C167 51 172 38 165 27C155 33 150 43 150 61Z" fill="#285943" stroke="#E5C780" strokeWidth="2" strokeLinejoin="round" />
                <path d="M150 58C146 40 146 24 150 9C157 22 157 39 150 58Z" fill="#285943" stroke="#E5C780" strokeWidth="2" strokeLinejoin="round" />
                <path d="M134 59Q150 67 166 59" fill="none" stroke="#E5C780" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </motion.div>
            <motion.img
              className="impact-reveal-flower"
              src="/gallery/hope-scroll-flower.png"
              alt=""
              style={{ transform: flowerTransform }}
              aria-hidden="true"
            />
          </>}
          <motion.div
            className="impact-scroll-scenery"
            style={{ scale: sceneryScale, y: sceneryY, opacity: skipScrollReveal ? 0 : sceneryOpacity }}
            aria-hidden="true"
          />
          <motion.div
            className="impact-reveal-intro"
            style={{ opacity: skipScrollReveal ? 0 : leftContentOpacity, y: skipScrollReveal ? -28 : introY }}
            aria-hidden={skipScrollReveal}
          >
            <img className="impact-reveal-brand" src="/sasta_logo.png" alt="" />
            <p className="impact-reveal-kicker">Sasta Trust · Azhudha River, Kerala</p>
            <h2>Hope begins with a meal</h2>
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
            style={{ opacity: leftContentOpacity }}
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
            className="impact-reveal-aperture"
            style={{ clipPath: skipScrollReveal ? 'inset(0)' : apertureClip }}
            aria-hidden="true"
          >
            <div className="impact-hero-slides">
              {heroSlides.map((slide, index) => (
                <video
                  key={slide.video}
                  className={`impact-hero-image${index === activeSlide ? ' is-active' : ''}`}
                  src={slide.video}
                  poster={slide.poster}
                  autoPlay={false}
                  loop
                  muted
                  playsInline
                  preload={index === 0 ? 'auto' : 'metadata'}
                  aria-label={slide.alt}
                />
              ))}
            </div>
            <motion.div className="impact-reveal-shade" style={{ opacity: skipScrollReveal ? 0.4 : shadeOpacity }} />
          </motion.div>

          {!skipScrollReveal && <motion.div className="impact-reveal-word-anchor" aria-hidden="true">
            <motion.div
              className="impact-reveal-word-stage"
              style={{ scale: revealScale, opacity: wordOpacity }}
            >
              <img src="/gallery/hope-board-lettering.png" alt="" />
            </motion.div>
          </motion.div>}

          {!skipScrollReveal && <motion.div
            className="impact-reveal-detail-rail"
            style={{ opacity: leftContentOpacity }}
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
