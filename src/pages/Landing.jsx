import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ArrowUp,
  Star,
  CheckCircle2,
  MapPin,
  Heart,
  Calendar,
} from 'lucide-react';
import { InteractiveImageSlider } from '../components/InteractiveImageSlider';
import { AlternatingSlideImage } from '../components/AlternatingSlideImage';
import emailjs from '@emailjs/browser';

const SECTION3_IMAGES = [
  '/photos_to_play/WhatsApp%20Image%202026-03-23%20at%201.10.17%20PM.jpeg',
  '/photos_to_play/WhatsApp%20Image%202026-03-23%20at%201.10.17%20PM%20(1).jpeg',
  '/photos_to_play/WhatsApp%20Image%202026-03-23%20at%201.10.17%20PM%20(2).jpeg',
];

const SECTION4_IMAGES = [
  '/gallery/pilgrims_azhudha_trek.jpg',
  '/photos_to_play/WhatsApp Image 2026-03-23 at 1.10.17 PM (2).jpeg',
  '/gallery/anna_prasadam_service_camp.jpg',
  '/photos_to_play/WhatsApp Image 2026-03-23 at 1.10.17 PM.jpeg',
];

const SECTION5_IMAGES = [
  '/gallery/heritage_temple_restoration.jpg',
  '/photos_to_play/WhatsApp Image 2026-03-23 at 1.10.18 PM.jpeg',
  '/gallery/anna_prasadam_cooking.jpg',
  '/flower/collage.jpg',
];

const CARD1_IMAGES = [
  '/gallery/anna_prasadam_cooking.jpg',
  '/photos_to_play/WhatsApp Image 2026-03-23 at 1.10.17 PM.jpeg',
  '/gallery/anna_prasadam_service_camp.jpg',
];

const CARD2_IMAGES = [
  '/gallery/heritage_temple_restoration.jpg',
  '/photos_to_play/WhatsApp Image 2026-03-23 at 1.10.18 PM.jpeg',
  '/flower/collage.jpg',
];

const CARD3_IMAGES = [
  '/gallery/anna_prasadam_service_camp.jpg',
  '/gallery/pilgrims_azhudha_trek.jpg',
  '/photos_to_play/WhatsApp Image 2026-03-23 at 1.10.17 PM (1).jpeg',
];

export const Landing = () => {
  const [starRating, setStarRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [willReturn, setWillReturn] = useState('Yes');
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    seva: '',
    message: ''
  });

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name) {
      alert('Please enter your name.');
      return;
    }
    setSubmitting(true);

    try {
      const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
      const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
      const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

      if (serviceId && templateId && publicKey) {
        try {
          await emailjs.send(
            serviceId,
            templateId,
            {
              from_name: formData.name,
              from_email: formData.email || 'devotee@sastatrust.org',
              phone: formData.phone,
              rating: starRating,
              likelihood: willReturn,
              seva_interest: formData.seva,
              message: formData.message
            },
            publicKey
          );
        } catch (mailErr) {
          console.warn('EmailJS skipped:', mailErr);
        }
      }

      setFormSubmitted(true);
    } catch (err) {
      console.error(err);
      setFormSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div style={{ backgroundColor: '#ffffff', color: '#000000', overflowX: 'hidden' }}>

      <section id="home" className="trust-hero">
        <div className="trust-hero-content">
          <p className="trust-eyebrow"><span /> Pilgrim support · Azhudha River, Kerala</p>
          <h1>Meals and care<br /><em>for every pilgrim.</em></h1>
          <p className="trust-hero-copy">Sasta Trust serves free meals and drinking water to pilgrims travelling the Sabarimala route. This work is made possible by volunteers and public support.</p>
          <div className="trust-hero-actions">
            <Link to="/donations" className="trust-button trust-button-gold">Support the seva <ArrowRight size={17} /></Link>
            <Link to="/dashboard" className="trust-button trust-button-light"><Calendar size={17} /> Festival calendar</Link>
          </div>
          <div className="trust-hero-proof"><span className="trust-proof-mark"><CheckCircle2 size={18} /></span><span><strong>Free service for pilgrims</strong><small>Supported by volunteers and donors</small></span></div>
        </div>
        <figure className="trust-hero-visual">
          <img src="/photos_to_play/WhatsApp%20Image%202026-03-23%20at%201.10.17%20PM.jpeg" alt="Sasta Trust volunteers serving pilgrims at the Azhudha River camp" />
          <figcaption><MapPin size={15} /> Anna Prasadam seva · Azhudha River</figcaption>
        </figure>
      </section>

      <section className="trust-impact-strip" aria-label="Sasta Trust at a glance">
        <div><strong>Since 2012</strong><span>Serving pilgrims</span></div>
        <div><strong>Free meals</strong><span>Prepared and served at the camp</span></div>
        <div><strong>Drinking water</strong><span>Support along the pilgrimage route</span></div>
        <Link to="/dashboard">Upcoming events <ArrowRight size={16} /></Link>
      </section>

      {/* One clear service story follows the homepage hero: copy alongside a real trust photo. */}
      <section id="manifesto" className="landing-section trust-service-story">
        <div className="trust-manifesto-copy">
          <h2 className="landing-title">
            <span className="line-left">Practical care for</span>
            <span className="line-indented">pilgrims on the route</span>
          </h2>

          <div className="landing-sub-kicker">
            PILGRIM SUPPORT<br />
            AT AZHUDHA RIVER
          </div>
          <h3 className="landing-heading-secondary">
            Volunteers prepare and serve meals, provide drinking water, and help pilgrims rest during their journey.
          </h3>
          <div className="editorial-paragraphs trust-service-copy">
            <p>
              The trust offers Anna Prasadam and practical support to pilgrims travelling the Sabarimala route. Volunteers prepare and serve each meal with care at the Azhudha River camp.
            </p>
            <p>
              This is a free service, sustained by community donations and the time of volunteers.
            </p>
            <Link
              to="/donations"
              className="pill-base pill-black"
              style={{ marginTop: '12px' }}
            >
              Support the seva <ArrowRight size={16} />
            </Link>
          </div>
        </div>
        <div className="trust-service-photo">
          <InteractiveImageSlider
            images={SECTION3_IMAGES}
            height="clamp(300px, 35vw, 440px)"
            borderRadius="16px"
            alt="Sasta Trust volunteers serving Anna Prasadam to pilgrims"
            caption="Anna Prasadam seva · Azhudha River camp"
          />
        </div>
      </section>


      {/* =========================================================================
          SECTION 4: 14 YEARS OF SACRED SERVICE
          ========================================================================= */}
      <section className="landing-section landing-pad-top-lg">
        <div className="editorial-grid-2col">
          <div>
            <h2 className="editorial-heading">
              Fourteen Unbroken Years of Devoted Service
            </h2>

            <div className="editorial-paragraphs" style={{ maxWidth: '100%' }}>
              <p>
                With the divine blessings of Lord Dharma Sasta, Sasta Trust has maintained an unbroken chain of devotional service since 2012. Founded on the conviction that <em>"Seva is Worship — Service is Tradition"</em>, the trust established a permanent camp along the arduous trekking route near the Azhudha River, Kerala.
              </p>

              <p>
                From humble beginnings under simple rain shelters, the seva has grown into a comprehensive operation nourishing tens of thousands of pilgrims during each Mandala-Makaravilakku season. Every meal is prepared fresh, with wholesome ingredients, and offered with sacred reverence as prasadam of the Lord.
              </p>
            </div>
          </div>

          <div>
            <AlternatingSlideImage
              images={SECTION4_IMAGES}
              height="420px"
              borderRadius="16px"
              alt="Lord Dharma Sasta Seva Camp at Azhudha River"
            />
            <p style={{
              fontFamily: 'Inter',
              fontSize: '13px',
              fontStyle: 'italic',
              color: '#666666',
              marginTop: '12px'
            }}>
              Lord Dharma Sasta Seva Camp — Pilgrims receiving Anna Prasadam along the Azhudha River trekking route, Kerala.
            </p>
          </div>
        </div>
      </section>


      {/* =========================================================================
          SECTION 5: TEMPLE RESTORATION & HERITAGE REVIVAL
          ========================================================================= */}
      <section className="landing-section landing-pad-top-lg">
        <div className="editorial-grid-2col">
          <div>
            <AlternatingSlideImage
              images={SECTION5_IMAGES}
              height="420px"
              borderRadius="16px"
              alt="Heritage Temple Restoration and Sacred Mahaprasadam"
            />
            <p style={{
              fontFamily: 'Inter',
              fontSize: '13px',
              fontStyle: 'italic',
              color: '#666666',
              marginTop: '12px'
            }}>
              Restoration of ancient heritage temples &amp; continuous sacred rituals &copy; Sasta Trust Seva Samiti
            </p>
          </div>

          <div>
            <h2 className="editorial-heading">
              Heritage Temple Restoration &amp; Dharma-Sevak Support
            </h2>

            <div className="editorial-paragraphs" style={{ maxWidth: '100%' }}>
              <p>
                <strong>Ancient Temple Maintenance &amp; Restoration:</strong> Sasta Trust is deeply committed to preserving heritage shrines and neglected sacred sanctuaries. We restore ancient structures, rebuild sacred sanctums, and ensure continuous daily pujas in communities that have lost access to consistent ritual care.
              </p>

              <p>
                <strong>Monthly Remunerations for Temple Dharma-Sevaks:</strong> Devoted priests, traditional musicians, and temple caretakers who uphold ancient Vedic traditions receive dignified, consistent sustenance — so that sacred rituals may continue without interruption for generations to come.
              </p>
            </div>
          </div>
        </div>
      </section>


      {/* =========================================================================
          SECTION 6: THE SEVEN SACRED CAUSES
          ========================================================================= */}
      <section id="seva-causes" className="landing-section landing-pad-top-lg">
        <div className="landing-sub-kicker" style={{ marginTop: 0, marginBottom: '20px' }}>
          SEVEN CAUSES OF DEVOTION
        </div>

        <h2 style={{
          fontFamily: 'Libre Baskerville, serif',
          fontSize: 'clamp(2.8rem, 6.5vw, 5.2rem)',
          fontWeight: 400,
          lineHeight: 1.1,
          letterSpacing: '-0.02em',
          color: '#000000',
          marginBottom: '35px'
        }}>
          The <span style={{ fontStyle: 'italic' }}>sacred</span> causes<br />
          of the seva
        </h2>

        <div className="editorial-paragraphs">
          <p>
            From the misty banks of the Azhudha River in Kerala to heritage shrines across southern India, Sasta Trust guides a comprehensive journey of devotion, dignity, and humanitarian service. Devotees worldwide may participate directly, sponsor Prasadam services, or contribute to elderly welfare and pilgrimage support.
          </p>

          <p>
            For enquiries and participation: <a href="mailto:sastatrust@gmail.com" style={{ textDecoration: 'underline' }}>sastatrust@gmail.com</a> &middot; <a href="tel:+919391672398" style={{ textDecoration: 'underline' }}>+91 93916 72398</a><br />
            Seva Location: Near Azhudha River, Mundakayam Pambavalley Road, Kerala.
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '30px' }}>
            <Link
              to="/donations"
              className="pill-base pill-black"
            >
              View all seva causes <ArrowRight size={16} />
            </Link>
            <span style={{ fontFamily: 'Inter', fontSize: '15px', color: '#666' }}>
              7 Sacred Causes
            </span>
          </div>
        </div>
      </section>


      {/* =========================================================================
          SECTION 7: THREE PRINCIPAL SEVA PROGRAMS
          ========================================================================= */}
      <section id="calendar-exhibition" className="landing-section landing-pad-top-md">
        <h2 style={{
          fontFamily: 'Libre Baskerville, serif',
          fontSize: 'clamp(2rem, 3.8vw, 2.8rem)',
          fontWeight: 400,
          color: '#000000'
        }}>
          Principal Seva Programmes
        </h2>

        <div className="cards-grid-3col">
          {/* Card 1 */}
          <div>
            <AlternatingSlideImage
              images={CARD1_IMAGES}
              height="220px"
              borderRadius="12px"
              style={{ marginBottom: '18px' }}
              alt="Anna Prasadam Seva"
            />
            <div className="story-card-num">1.</div>
            <h3 className="story-card-title">
              Yearly Anna Prasadam Seva — Kerala
            </h3>
            <p className="story-card-desc">
              Thousands of pilgrims are blessed with Anna Prasadam on the sacred trekking route near the Azhudha River, Mundakayam Pambavalley Road, Kerala. Served with devotion without fail, every single year.
            </p>

            <Link
              to="/donations"
              className="pill-base pill-black"
              style={{ padding: '8px 18px', fontSize: '14px', marginBottom: '24px' }}
            >
              <Heart size={12} /> &nbsp;Contribute to this Seva
            </Link>

            <div className="story-card-chapter">
              <span>1.1. Anna Prasadam on the Azhudha Trekking Route</span>
              <ArrowRight size={14} color="#666" />
            </div>
            <div className="story-card-chapter">
              <span>1.2. Devotee Meal Sponsorship</span>
              <ArrowRight size={14} color="#666" />
            </div>
          </div>

          {/* Card 2 */}
          <div>
            <AlternatingSlideImage
              images={CARD2_IMAGES}
              height="220px"
              borderRadius="12px"
              style={{ marginBottom: '18px' }}
              alt="Heritage Temple Restoration"
            />
            <div className="story-card-num">2.</div>
            <h3 className="story-card-title">
              Heritage Temple Restoration &amp; Dharma-Sevak Support
            </h3>
            <p className="story-card-desc">
              Preserving and revitalizing heritage temples for future generations. Supporting dharma-sevaks with monthly remunerations so ancient Vedic rituals continue uninterrupted.
            </p>

            <Link
              to="/donations"
              className="pill-base pill-black"
              style={{ padding: '8px 18px', fontSize: '14px', marginBottom: '24px' }}
            >
              <Heart size={12} /> &nbsp;Contribute to this Seva
            </Link>

            <div className="story-card-chapter">
              <span>2.1. Ancient Shrine Restoration</span>
              <ArrowRight size={14} color="#666" />
            </div>
            <div className="story-card-chapter">
              <span>2.2. Dharma-Sevak Monthly Remuneration</span>
              <ArrowRight size={14} color="#666" />
            </div>
          </div>

          {/* Card 3 */}
          <div>
            <AlternatingSlideImage
              images={CARD3_IMAGES}
              height="220px"
              borderRadius="12px"
              style={{ marginBottom: '18px' }}
              alt="Pilgrimage & Humanitarian Care"
            />
            <div className="story-card-num">3.</div>
            <h3 className="story-card-title">
              Pilgrimage Sponsorship, Elderly Care &amp; Kanyadanam
            </h3>
            <p className="story-card-desc">
              Ensuring no devotee is deprived of Sabarimala darshan due to financial constraints. Dedicated care for the elderly and Kanyadanam in honour of daughters of needy Vedic families.
            </p>

            <Link
              to="/donations"
              className="pill-base pill-black"
              style={{ padding: '8px 18px', fontSize: '14px', marginBottom: '24px' }}
            >
              <Heart size={12} /> &nbsp;Contribute to this Seva
            </Link>

            <div className="story-card-chapter">
              <span>3.1. Sabarimala Pilgrimage Sponsorship</span>
              <ArrowRight size={14} color="#666" />
            </div>
            <div className="story-card-chapter">
              <span>3.2. Elderly Welfare &amp; Kanyadanam</span>
              <ArrowRight size={14} color="#666" />
            </div>
          </div>
        </div>
      </section>


      {/* =========================================================================
          SECTION 8: CONTACT FORM + FOOTER WRAPPER
          White card overlapping dark navy footer
          ========================================================================= */}
      <section id="contact" style={{ marginTop: '130px' }}>
        <div className="feedback-card-wrapper">
          <div className="feedback-card">
            <h2 className="feedback-card-title">
              Connect with Sasta Trust
            </h2>
            <p className="feedback-card-sub">
              Share your message of devotion, enquire about seva participation, or offer your counsel.
            </p>

            {formSubmitted ? (
              <div style={{
                textAlign: 'center',
                padding: '40px 20px',
                background: '#f0fdf4',
                borderRadius: '16px',
                border: '1px solid #bbf7d0'
              }}>
                <CheckCircle2 size={44} color="#16a34a" style={{ margin: '0 auto 12px' }} />
                <h3 style={{ fontFamily: 'Libre Baskerville', color: '#166534', fontSize: '1.35rem', marginBottom: '6px' }}>
                  Swamy Sharanam! Message Received.
                </h3>
                <p style={{ fontFamily: 'Inter', color: '#15803d', fontSize: '0.95rem' }}>
                  Your message has been received with gratitude. The Sasta Trust team will respond at the earliest.
                </p>
                <button
                  onClick={() => setFormSubmitted(false)}
                  className="pill-base pill-black"
                  style={{ marginTop: '16px', padding: '8px 20px', fontSize: '14px' }}
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleContactSubmit}>
                {/* Devotion Rating */}
                <div style={{ marginBottom: '28px' }}>
                  <label style={{ display: 'block', fontFamily: 'Inter', fontSize: '15px', color: '#333333', marginBottom: '10px' }}>
                    How would you rate your experience with Sasta Trust? *
                  </label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setStarRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px' }}
                      >
                        <Star
                          size={32}
                          fill={(hoverRating || starRating) >= star ? '#FBBF24' : 'none'}
                          color={(hoverRating || starRating) >= star ? '#FBBF24' : '#D1D5DB'}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Seva Interest & Return Likelihood */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: '24px',
                  marginBottom: '24px'
                }}>
                  <div>
                    <textarea
                      placeholder="Which seva cause interests you most? (Anna Prasadam, Temple Restoration, Pilgrimage Sponsorship…)"
                      rows={4}
                      value={formData.seva}
                      onChange={(e) => setFormData({ ...formData, seva: e.target.value })}
                      className="input-box"
                      style={{ resize: 'vertical' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontFamily: 'Inter', fontSize: '15px', color: '#333333', marginBottom: '12px' }}>
                      Would you like to receive seva updates?
                    </label>
                    {['Yes', 'No', 'Perhaps'].map((opt) => (
                      <label
                        key={opt}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          marginBottom: '10px',
                          cursor: 'pointer',
                          fontFamily: 'Inter',
                          fontSize: '15px',
                          color: '#444444'
                        }}
                      >
                        <input
                          type="radio"
                          name="willReturn"
                          value={opt}
                          checked={willReturn === opt}
                          onChange={() => setWillReturn(opt)}
                          style={{ accentColor: '#101625', width: 16, height: 16 }}
                        />
                        {opt}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Name */}
                <div style={{ marginBottom: '24px' }}>
                  <input
                    type="text"
                    placeholder="Your Name *"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input-box"
                  />
                </div>

                <p style={{ fontFamily: 'Inter', fontSize: '15px', color: '#666666', marginBottom: '12px' }}>
                  Leave your contact details for a personal response.
                </p>

                {/* Email & Phone */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                  gap: '20px',
                  marginBottom: '24px'
                }}>
                  <input
                    type="email"
                    placeholder="Email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="input-box"
                  />
                  <input
                    type="tel"
                    placeholder="Phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="input-box"
                  />
                </div>

                {/* Message */}
                <div style={{ marginBottom: '28px' }}>
                  <textarea
                    placeholder="Your message, prayer, or enquiry…"
                    rows={4}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="input-box"
                    style={{ resize: 'vertical' }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="pill-base"
                  style={{
                    backgroundColor: '#101625',
                    color: '#ffffff',
                    padding: '14px 32px'
                  }}
                >
                  {submitting ? 'Sending\u2026' : 'Send Message \u2192'}
                </button>
              </form>
            )}
          </div>
        </div>


        {/* =========================================================================
            SECTION 9: MASTER FOOTER WITH ARCHITECTURAL SVG BACKGROUND
            Exact Holmenkollen360.com style with geometric facets & sacred geometry SVG
            ========================================================================= */}
        <footer id="footer-credits" className="navy-footer">
          {/* Architectural SVG Background — Geometric Aperture Facets, Topographic River Curves & Sacred Geometry */}
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
            <svg
              width="100%"
              height="100%"
              viewBox="0 0 1440 800"
              preserveAspectRatio="xMidYMid slice"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
            >
              <defs>
                <linearGradient id="facetGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="0.06" />
                  <stop offset="100%" stopColor="#ffffff" stopOpacity="0.01" />
                </linearGradient>
                <linearGradient id="facetGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#d4af37" stopOpacity="0.08" />
                  <stop offset="100%" stopColor="#d4af37" stopOpacity="0" />
                </linearGradient>
                <pattern id="sacredGrid" width="64" height="64" patternUnits="userSpaceOnUse">
                  <path d="M 64 0 L 0 0 0 64" fill="none" stroke="rgba(255,255,255,0.02)" strokeWidth="1" />
                  <circle cx="32" cy="32" r="1.5" fill="rgba(212,175,55,0.08)" />
                </pattern>
              </defs>

              {/* Architectural Dot Grid */}
              <rect width="100%" height="100%" fill="url(#sacredGrid)" />

              {/* Left-side Geometric Polygon Facets (Exact Reference Style) */}
              <polygon points="110,80 250,25 370,105 350,265 210,320 70,240" fill="url(#facetGrad1)" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" />
              <polygon points="140,110 250,65 340,130 320,245 220,285 115,225" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
              <circle cx="230" cy="180" r="75" stroke="rgba(255,255,255,0.05)" strokeWidth="1" strokeDasharray="4 4" />
              <circle cx="230" cy="180" r="45" stroke="rgba(212,175,55,0.08)" strokeWidth="1" />

              {/* Right-side Geometric Polygons */}
              <polygon points="1120,160 1260,90 1400,170 1380,340 1240,410 1100,330" fill="url(#facetGrad2)" stroke="rgba(212,175,55,0.09)" strokeWidth="1.5" />
              <polygon points="1150,190 1260,130 1370,195 1350,320 1250,375 1140,315" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
              <circle cx="1250" cy="255" r="80" stroke="rgba(212,175,55,0.07)" strokeWidth="1" strokeDasharray="5 5" />

              {/* Central Sacred Yantra Mandala Watermark */}
              <g transform="translate(720, 440)" opacity="0.055">
                <circle r="230" stroke="#d4af37" strokeWidth="1.5" />
                <circle r="190" stroke="#ffffff" strokeWidth="1" strokeDasharray="6 4" />
                <circle r="150" stroke="#d4af37" strokeWidth="1.5" />
                <circle r="110" stroke="#ffffff" strokeWidth="1" />
                <polygon points="0,-150 130,75 -130,75" stroke="#d4af37" strokeWidth="1.5" fill="none" />
                <polygon points="0,150 130,-75 -130,-75" stroke="#d4af37" strokeWidth="1.5" fill="none" />
                <polygon points="0,-190 165,95 -165,95" stroke="#ffffff" strokeWidth="1" fill="none" />
                <polygon points="0,190 165,-95 -165,-95" stroke="#ffffff" strokeWidth="1" fill="none" />
              </g>

              {/* Flowing Azhudha River Topographic Contours */}
              <path d="M-50,630 C 300,560 620,700 960,600 C 1220,530 1370,660 1500,620" stroke="rgba(255,255,255,0.04)" strokeWidth="2" fill="none" />
              <path d="M-50,670 C 280,600 640,740 990,640 C 1240,580 1390,700 1500,660" stroke="rgba(212,175,55,0.05)" strokeWidth="1.5" fill="none" />
              <path d="M-50,710 C 260,640 660,780 1020,680 C 1260,620 1410,740 1500,700" stroke="rgba(255,255,255,0.03)" strokeWidth="1" fill="none" />
            </svg>
          </div>

          {/* Top Banner Statement */}
          <div className="footer-top-banner" style={{ position: 'relative', zIndex: 1 }}>
            <h3>
              All seva is performed locally and<br />
              sustained by devotion worldwide.
            </h3>
          </div>

          {/* 3 Columns */}
          <div className="footer-columns-wrap">

            {/* Column 1: Brand Mark (vertical, like Holmenkollen logo) + Email Pill */}
            <div>
              <div style={{ marginBottom: '28px' }}>
                <img
                  src="/sasta_logo.png"
                  alt="Sasta Trust"
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: '50%',
                    background: '#ffffff',
                    padding: '3px',
                    display: 'block',
                    marginBottom: '16px'
                  }}
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
                <div style={{
                  fontFamily: 'Inter',
                  fontWeight: 800,
                  fontSize: '1.5rem',
                  letterSpacing: '0.07em',
                  lineHeight: 1.0,
                  textTransform: 'uppercase',
                  color: '#ffffff'
                }}>
                  SASTA TRUST
                </div>
                <div style={{
                  fontFamily: 'Inter',
                  fontSize: '0.72rem',
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: 'rgba(255,255,255,0.5)',
                  marginTop: '5px'
                }}>
                  Est. 2012 — 14th Year of Seva — Kerala
                </div>
                <div style={{
                  fontFamily: 'Libre Baskerville, serif',
                  fontStyle: 'italic',
                  fontSize: '0.9rem',
                  color: 'rgba(255,255,255,0.4)',
                  marginTop: '8px'
                }}>
                  — Azhudha River —
                </div>
              </div>

              <p style={{
                fontFamily: 'Inter',
                fontSize: '14px',
                color: 'rgba(255,255,255,0.58)',
                lineHeight: 1.65,
                marginBottom: '28px',
                maxWidth: '340px'
              }}>
                Dedicated to sacred Anna Prasadam Seva near Azhudha River, Kerala, and the revitalization of ancient heritage temples.
              </p>

              {/* Outline Email Pill — exact Holmenkollen style */}
              <a
                href="mailto:sastatrust@gmail.com"
                className="footer-email-pill"
              >
                sastatrust@gmail.com
              </a>
            </div>

            {/* Column 2: ADDRESS */}
            <div>
              <div className="footer-heading">ADDRESS</div>
              <div style={{ fontFamily: 'Inter', fontSize: '15px', color: 'rgba(255,255,255,0.72)', lineHeight: 1.75 }}>
                <strong style={{ color: '#ffffff', display: 'block', marginBottom: '2px' }}>Sasta Trust Seva Camp</strong>
                Mundakayam Pambavalley Road<br />
                Near Azhudha River, Kerala<br /><br />
                <strong style={{ color: '#ffffff', display: 'block', marginBottom: '2px' }}>Registered Trust Office:</strong>
                G-04, Sai Nilayam Apartments<br />
                Saptarishi Nagar, Hyderabad – 500 088<br /><br />
                <strong style={{ color: '#ffffff' }}>Phone: </strong>
                <a href="tel:+919391672398" style={{ color: 'rgba(255,255,255,0.85)', textDecoration: 'underline' }}>
                  +91 93916 72398
                </a>
              </div>
            </div>

            {/* Column 3: INFORMATION */}
            <div>
              <div className="footer-heading">INFORMATION</div>
              <ul className="footer-links-list">
                <li><Link to="/dashboard">Festivals &amp; Sacred Calendar</Link></li>
                <li><Link to="/donations">Support Our Causes</Link></li>
                <li><a href="mailto:sastatrust@gmail.com">Contact Us</a></li>
                <li><Link to="/donations">Donation &amp; Receipt Policy</Link></li>
                <li><Link to="/donations">Seva Participation</Link></li>
                <li><Link to="/dashboard">About the Trust</Link></li>
              </ul>
            </div>
          </div>

          {/* Bottom Copyright Bar */}
          <div className="footer-bottom-bar">
            <div>
              <p style={{ fontFamily: 'Inter', fontSize: '13px', color: 'rgba(255,255,255,0.45)', margin: 0 }}>
                &copy; 2025 &ndash; 2026 Sasta Trust &middot; All rights reserved
              </p>
              <p style={{ fontFamily: 'Libre Baskerville', fontStyle: 'italic', fontSize: '13px', color: 'rgba(255,255,255,0.3)', marginTop: '4px' }}>
                &#10022; Swamy Sharanam Ayyappa! &#10022; Seva is Worship &middot; Service is Tradition
              </p>
            </div>

            <button
              type="button"
              onClick={scrollToTop}
              className="trust-back-to-top"
              aria-label="Back to top"
            >
              <ArrowUp size={20} />
            </button>
          </div>
        </footer>
      </section>
    </div>
  );
};
