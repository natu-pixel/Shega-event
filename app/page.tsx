"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ScrollStory } from "@/components/scroll-story";
import { Brand } from "@/components/brand";
import { type GalleryItem } from "@/components/CoverflowGallery";
import Navbar from "@/components/Navbar";
import { CONTACT_CHANNELS, INSTAGRAM_HANDLE, INSTAGRAM_URL, SITE_NAME } from "@/lib/site";
import { FEATURED_EVENTS } from "@/lib/events";

// Photographs collected from the Shega Events Instagram account. Every card keeps
// its credit and links back to the original post; see public/events/sources.json.
const galleryItems: GalleryItem[] = [
  {
    id: "kemen-1",
    title: "Bermel Fest - Live duet",
    image: "/events/kemen-lejemer/01-live-duet.jpg",
    href: "https://www.instagram.com/bermel_fest/p/DZIF0nbDdTP/",
    mediaType: "photo",
    category: "bermel",
    credit: "@bermel_fest",
  },
  {
    id: "kemen-2",
    title: "Bermel Fest - The entrance",
    image: "/events/kemen-lejemer/02-user-selected-entrance.jpg",
    href: "https://www.instagram.com/bermel_fest/p/DZIF0nbDdTP/?img_index=4",
    mediaType: "photo",
    category: "bermel",
    credit: "@bermel_fest",
  },
  {
    id: "kemen-3",
    title: "Bermel Fest - Solo performance",
    image: "/events/kemen-lejemer/03-solo-performance.jpg",
    href: "https://www.instagram.com/bermel_fest/p/DZIF0nbDdTP/?img_index=6",
    mediaType: "photo",
    category: "bermel",
    credit: "@bermel_fest",
  },
  {
    id: "kemen-4",
    title: "Bermel Fest - Three voices",
    image: "/events/kemen-lejemer/04-group-performance.jpg",
    href: "https://www.instagram.com/bermel_fest/p/DZIF0nbDdTP/?img_index=9",
    mediaType: "photo",
    category: "bermel",
    credit: "@bermel_fest",
  },
  {
    id: "rophnan-1",
    title: "Rophnan - Aerial stage and crowd",
    image: "/events/rophnan-finale/01-aerial-stage-and-crowd.jpg",
    href: "https://www.instagram.com/rophnan/p/DUGMfeZgpqV/",
    mediaType: "photo",
    category: "rophnan",
    credit: "@rophnan",
  },
  {
    id: "rophnan-2",
    title: "Rophnan - Dancers on stage",
    image: "/events/rophnan-finale/02-dancers-onstage.jpg",
    href: "https://www.instagram.com/rophnan/p/DUGMfeZgpqV/?img_index=3",
    mediaType: "photo",
    category: "rophnan",
    credit: "@rophnan",
  },
  {
    id: "rophnan-3",
    title: "Rophnan - On stage",
    image: "/events/rophnan-finale/03-rophnan-onstage.jpg",
    href: "https://www.instagram.com/rophnan/p/DUGMfeZgpqV/?img_index=7",
    mediaType: "photo",
    category: "rophnan",
    credit: "@rophnan",
  },
  {
    id: "rophnan-4",
    title: "Rophnan - The crowd",
    image: "/events/rophnan-finale/04-user-selected-crowd.jpg",
    href: "https://www.instagram.com/rophnan/p/DUGMfeZgpqV/?img_index=17",
    mediaType: "photo",
    category: "rophnan",
    credit: "@rophnan",
  },
  {
    id: "ke-beraf-1",
    title: "Ke Beraf - Live at Kana",
    image: "/events/keberaf/01-concert.jpg",
    href: "https://www.instagram.com/shega_events/p/DaDU5qnjAjM/",
    mediaType: "photo",
    category: "shega",
    credit: "@shega_events",
  },
  {
    id: "ke-beraf-2",
    title: "Ke Beraf - On the microphone",
    image: "/events/keberaf/02-concert.jpg",
    href: "https://www.instagram.com/shega_events/p/DaDU5qnjAjM/?img_index=2",
    mediaType: "photo",
    category: "shega",
    credit: "@shega_events",
  },
  {
    id: "ke-beraf-3",
    title: "Ke Beraf - Toward the crowd",
    image: "/events/keberaf/03-concert.jpg",
    href: "https://www.instagram.com/shega_events/p/DaDU5qnjAjM/?img_index=3",
    mediaType: "photo",
    category: "shega",
    credit: "@shega_events",
  },
  {
    id: "ke-beraf-4",
    title: "Ke Beraf - Phone lights",
    image: "/events/keberaf/04-concert.jpg",
    href: "https://www.instagram.com/shega_events/p/DaDU5qnjAjM/?img_index=4",
    mediaType: "photo",
    category: "shega",
    credit: "@shega_events",
  },
  {
    id: "wazema-1",
    title: "Wazema - Arm raised",
    image: "/events/wazema/01-live-performance.jpg",
    href: "https://www.instagram.com/mastewal_eyayu_official/p/DdcDTHmgO0V/",
    mediaType: "photo",
    category: "shega",
    credit: "@mastewal_eyayu_official",
  },
  {
    id: "wazema-2",
    title: "Wazema - Stage and smoke",
    image: "/events/wazema/02-stage-smoke.jpg",
    href: "https://www.instagram.com/mastewal_eyayu_official/p/DdcDTHmgO0V/?img_index=2",
    mediaType: "photo",
    category: "shega",
    credit: "@mastewal_eyayu_official",
  },
  {
    id: "wazema-3",
    title: "Wazema - Concert atmosphere",
    image: "/events/wazema/03-concert-atmosphere.jpg",
    href: "https://www.instagram.com/mastewal_eyayu_official/p/DdcDTHmgO0V/?img_index=3",
    mediaType: "photo",
    category: "shega",
    credit: "@mastewal_eyayu_official",
  },
  {
    id: "wazema-4",
    title: "Wazema - Guest vocalist",
    image: "/events/wazema/04-live-show.jpg",
    href: "https://www.instagram.com/mastewal_eyayu_official/p/DdcDTHmgO0V/?img_index=4",
    mediaType: "photo",
    category: "shega",
    credit: "@mastewal_eyayu_official",
  },
  {
    id: "halo-1",
    title: "Halo Hawassa - Beside the stage",
    image: "/events/halo-hawassa/01-yohana-stage-crowd.jpg",
    href: "https://www.instagram.com/yohanaoriginal/p/DU8R_MYDaEg/",
    mediaType: "photo",
    category: "shega",
    credit: "@yohanaoriginal",
  },
  {
    id: "halo-2",
    title: "Halo Hawassa - The audience",
    image: "/events/halo-hawassa/02-hawassa-concert.jpg",
    href: "https://www.instagram.com/yohanaoriginal/p/DU8R_MYDaEg/?img_index=2",
    mediaType: "photo",
    category: "shega",
    credit: "@yohanaoriginal",
  },
  {
    id: "halo-3",
    title: "Halo Hawassa - Wide view",
    image: "/events/halo-hawassa/03-hawassa-stage-wide.jpg",
    href: "https://www.instagram.com/yohanaoriginal/p/DU8R_MYDaEg/?img_index=3",
    mediaType: "photo",
    category: "shega",
    credit: "@yohanaoriginal",
  },
  {
    id: "halo-4",
    title: "Halo Hawassa - Purple lights",
    image: "/events/halo-hawassa/04-hawassa-concert.jpg",
    href: "https://www.instagram.com/yohanaoriginal/p/DU8R_MYDaEg/?img_index=4",
    mediaType: "photo",
    category: "shega",
    credit: "@yohanaoriginal",
  },
  {
    id: "arbaminch-1",
    title: "Great Arba Minch Run - On the course",
    image: "/events/great-arbaminch-run/01-race-photo.jpg",
    href: "https://www.instagram.com/greatethrun/p/DaKhF1nCL5f/",
    mediaType: "photo",
    category: "shega",
    credit: "@greatethrun",
  },
  {
    id: "arbaminch-2",
    title: "Great Arba Minch Run - Smiling runner",
    image: "/events/great-arbaminch-run/02-race-photo.jpg",
    href: "https://www.instagram.com/greatethrun/p/DaKhF1nCL5f/?img_index=2",
    mediaType: "photo",
    category: "shega",
    credit: "@greatethrun",
  },
  {
    id: "arbaminch-3",
    title: "Great Arba Minch Run - Photo frame",
    image: "/events/great-arbaminch-run/03-race-photo.jpg",
    href: "https://www.instagram.com/greatethrun/p/DaKhF1nCL5f/?img_index=3",
    mediaType: "photo",
    category: "shega",
    credit: "@greatethrun",
  },
  {
    id: "arbaminch-4",
    title: "Great Arba Minch Run - Two runners",
    image: "/events/great-arbaminch-run/04-race-photo.jpg",
    href: "https://www.instagram.com/greatethrun/p/DaKhF1nCL5f/?img_index=4",
    mediaType: "photo",
    category: "shega",
    credit: "@greatethrun",
  },
];

const stats: readonly { label: string; value: string }[] = [
  { label: "HEADQUARTERS", value: "Addis Ababa" },
  { label: "EVENTS PRODUCED", value: "23+" },
  { label: "FLAGSHIP SERIES", value: "Bermel Fest" },
  { label: "EVENT PHOTOGRAPHS", value: "Unlimited" },
];

const archiveItems = [
  galleryItems[1],
  galleryItems[5],
  galleryItems[9],
  galleryItems[13],
  galleryItems[17],
  galleryItems[21],
];

export default function ShegaLandingPage() {
  const [activeTab, setActiveTab] = useState<"nightmakers" | "peoples">("nightmakers");

  useEffect(() => {
    const targets = Array.from(document.querySelectorAll<HTMLElement>(".blur-reveal"));
    if (!("IntersectionObserver" in window)) {
      targets.forEach((target) => target.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.remove("is-pending");
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -4% 0px" });

    targets.forEach((target) => {
      const bounds = target.getBoundingClientRect();
      if (bounds.top >= window.innerHeight || bounds.bottom < 0) target.classList.add("is-pending");
      observer.observe(target);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <main className="shega-page">
      <Navbar />
      {/* 1. Hero — the scroll-driven Shega Website Video sequence. */}
      <section id="experience" className="shega-hero-slot" aria-label="Shega Events">
        <ScrollStory />
      </section>

      {/* 2. About */}
      <section id="about" className="shega-about-section">
        <div className="shega-container shega-about-grid">
          <div>
            <h2 className="shega-about-headline blur-reveal">
              AN INDEPENDENT EVENT COMPANY CREATING EXPERIENCES THAT BRING PEOPLE
              TOGETHER, FROM THE FIRST IDEA TO THE FINAL MOMENT.
            </h2>
          </div>

          <div className="shega-about-right">
            <p className="shega-about-bio">
              Shega Events produces live experiences in Addis Ababa &mdash; concerts,
              festivals and brand activations &mdash; from the first idea to the final
              moment. See the original posts behind every photograph we show, and the
              full archive on Instagram.
            </p>

            <div className="shega-stats-list">
              {stats.map((stat) => (
                <div key={stat.label} className="shega-stat-row">
                  <span className="shega-stat-label">{stat.label}</span>
                  <span className="shega-stat-value">{stat.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 3. Featured events */}
      <section id="events" className="shega-events-section" aria-label="Featured events">
        {FEATURED_EVENTS.map((event) => (
          <article key={event.slug} className="shega-event-card">
            <div className="shega-event-card-bar" />
            <div className="shega-event-image-wrap">
              <img src={event.image} alt={event.title} loading="lazy" />
            </div>
            <div className="shega-event-card-copy">
              <h2>{event.title}</h2>
              <p>{event.detail}</p>
              <Link href={`/events/${event.slug}`}>
                View detail <span aria-hidden="true">↗</span>
              </Link>
            </div>
          </article>
        ))}
      </section>

      {/* 4. Visual archive */}
      <section id="gallery" className="shega-archive-section" aria-label="Visual archive">
        <div className="shega-container shega-archive-heading">
          <h2 className="blur-reveal">THROUGH OUR<br />EYES.</h2>
          <div>
            <p className="shega-archive-label">VISUAL ARCHIVES</p>
            <p>The lights, the noise. The faces. The moments between the moments.</p>
          </div>
        </div>
        <div className="shega-archive-viewport">
          <div className="shega-archive-track">
            {[...archiveItems, ...archiveItems].map((item, index) => (
              <a key={`${item.id}-${index}`} href={item.href} target="_blank" rel="noopener noreferrer" className="shega-archive-tile" aria-label={item.title} aria-hidden={index >= archiveItems.length} tabIndex={index >= archiveItems.length ? -1 : undefined}>
                <span className="shega-archive-tile-inner">
                  <span className="shega-archive-face shega-archive-face-front">
                    <img src={item.image} alt="" loading="lazy" />
                  </span>
                  <span className="shega-archive-face shega-archive-face-back" aria-hidden="true">{item.title}</span>
                </span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Contact */}
      <section id="contact" className="shega-dark-section">
        <div className="shega-container">
          <div className="shega-switcher-header">
            <button type="button" onClick={() => setActiveTab("nightmakers")} className={`shega-tab-btn ${activeTab === "nightmakers" ? "is-active" : ""}`}>
              <h2 className="shega-section-title-lg">MEET THE<br />NIGHTMAKERS.</h2>
            </button>
            <span className="shega-switcher-or">OR</span>
            <button type="button" onClick={() => setActiveTab("peoples")} className={`shega-tab-btn ${activeTab === "peoples" ? "is-active" : ""}`}>
              <h2 className="shega-section-title-lg">WHAT<br />PEOPLE SAY.</h2>
            </button>
          </div>

          <div className="shega-divider-stage">
            <div className="shega-vertical-line" />
          </div>

          <div className="shega-contact-grid">
            <div className="shega-contact-left">
              <div>
                <div className="shega-eyebrow-light">
                  <span className="shega-orange-dot" />
                  <span>START A PROJECT</span>
                </div>

                <h2 key={activeTab} className="shega-contact-title kinetic-type">{activeTab === "nightmakers" ? <>LET&apos;S MAKE<br />IT AN EVENT.</> : <>LET&apos;S MAKE<br />IT MEMORABLE.</>}</h2>

                <p className="shega-contact-subtext">
                  From concept to final encore &mdash; tell us what you have in mind and
                  we&apos;ll build something people talk about long after the lights come up.
                </p>
              </div>

              <div className="shega-contact-info-list">
                {CONTACT_CHANNELS.map((channel) => (
                  <div key={channel.label} className="shega-contact-info-row">
                    <span className="shega-contact-label">{channel.label}</span>
                    <a href={channel.href} target="_blank" rel="noopener noreferrer" className="shega-contact-link">
                      {channel.value}
                    </a>
                  </div>
                ))}

                <p className="shega-contact-footnote">
                  BASED IN ADDIS ABABA &middot; PRODUCING ACROSS ETHIOPIA &amp; BEYOND
                </p>
              </div>
            </div>

            <div className="shega-form-card">
              <h3 className="shega-form-heading">TELL US ABOUT YOUR EVENT</h3>
              <p className="shega-contact-subtext">
                Give us the first details. Your email app will open with a ready-to-send brief.
              </p>
              <form
                className="shega-inquiry-form"
                onSubmit={(event) => {
                  event.preventDefault();
                  const values = new FormData(event.currentTarget);
                  const subject = `Event inquiry: ${values.get("eventType")}`;
                  const body = [
                    `Name: ${values.get("name")}`,
                    `Email: ${values.get("email")}`,
                    `Event type: ${values.get("eventType")}`,
                    `Date: ${values.get("date") || "Not set"}`,
                    `Estimated guests: ${values.get("guests") || "Not sure yet"}`,
                    "",
                    String(values.get("brief") || ""),
                  ].join("\\n");
                  window.location.href = `mailto:info@shega.events?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                }}
              >
                <div className="shega-form-fields">
                  <label>Name<input name="name" autoComplete="name" placeholder="Your name" required /></label>
                  <label>Email<input name="email" type="email" autoComplete="email" placeholder="you@example.com" required /></label>
                  <label>Event type<select name="eventType" defaultValue="" required>
                    <option value="" disabled>Select an event</option>
                    <option>Concert</option><option>Festival</option><option>Brand activation</option><option>Private event</option><option>Other</option>
                  </select></label>
                  <label>Target date<input name="date" type="date" /></label>
                  <label className="shega-form-wide">Estimated guests<input name="guests" type="number" min="1" placeholder="e.g. 500" /></label>
                  <label className="shega-form-wide">Tell us a little more<textarea name="brief" rows={3} placeholder="Location, goals, or anything you have in mind" required /></label>
                </div>
                <div className="shega-form-actions">
                  <button className="shega-submit-pill" type="submit">Prepare event brief <span aria-hidden="true">↗</span></button>
                  <span className="shega-form-note">Opens your email app to send to info@shega.events</span>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Footer */}
      <footer className="shega-footer">
        <div className="shega-footer-marquee" aria-hidden="true">
          <div className="shega-footer-marquee-track">
            {[0, 1].map((copy) => <span key={copy}>MAKE IT A MOMENT <i>✳</i> SHEGA EVENTS <i>✳</i> ADDIS ABABA <i>✳</i>&nbsp;</span>)}
          </div>
        </div>
        <div className="shega-footer-rule" aria-hidden="true"><span /><span /><span /><span /><span /><span /><span /><span /><span /><span /><span /><span /></div>
        <div className="shega-container shega-footer-inner">
          <div className="shega-footer-brand">
            <Brand footer />
            <p className="shega-footer-tagline">{SITE_NAME} &middot; Addis Ababa, Ethiopia</p>
          </div>
          <nav className="shega-footer-links">
            <a href="/privacy" className="shega-footer-link">Privacy Policy</a>
            <a href="/cookies" className="shega-footer-link">Cookies</a>
            <a href="/terms" className="shega-footer-link">Terms of Service</a>
            <a href="#contact" className="shega-footer-link">Contact</a>
          </nav>
          <div className="shega-footer-socials">
            <a href="mailto:info@shega.events" className="shega-footer-social" target="_blank" rel="noopener noreferrer">
              info@shega.events <span aria-hidden="true">&#8599;</span>
            </a>
            <Link href={INSTAGRAM_URL} className="shega-footer-social" target="_blank" rel="noopener noreferrer">
              {INSTAGRAM_HANDLE} <span aria-hidden="true">&#8599;</span>
            </Link>
          </div>
          <p className="shega-footer-year">&copy; {new Date().getFullYear()} {SITE_NAME}. All rights reserved.</p>
          <p className="shega-footer-build">Built by <a href="https://daat.tech" target="_blank" rel="noopener noreferrer" className="shega-footer-build-link">daat.tech</a></p>
        </div>
      </footer>
    </main>
  );
}
