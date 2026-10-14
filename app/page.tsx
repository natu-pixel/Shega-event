"use client";

import { useState } from "react";
import { ScrollStory } from "@/components/scroll-story";

export default function ShegaLandingPage() {
  const [activeArchive, setActiveArchive] = useState<number>(2);
  const [activeTab, setActiveTab] = useState<"nightmakers" | "peoples">("nightmakers");

  const eventShowcases = [
    {
      id: 1,
      title: "KEMN LEJEMER",
      category: "CONCERT / NIGHTLIFE",
      year: "2026",
      mediaNote: "event video or photo",
    },
    {
      id: 2,
      title: "HELLO HAWASSA",
      category: "FESTIVAL EXPERIENCE",
      year: "2026",
      mediaNote: "event video or photo",
    },
  ];

  const visualArchives = [
    { id: 0, label: "BACKSTAGE ENERGY & SOUNDCHECK" },
    { id: 1, label: "CROWD MOMENTS IN MOTION" },
    { id: 2, label: "Photos moving with captions on the hover" },
    { id: 3, label: "LIGHTING & STAGE DESIGN" },
    { id: 4, label: "AFTERHOURS SESSIONS" },
    { id: 5, label: "FINALE & ENCORE" },
  ];

  return (
    <main className="shega-page">
      {/* =====================================================================
          1. HERO SECTION SLOT (Place your existing Hero component here)
      ===================================================================== */}
      <section id="hero-placeholder" className="shega-hero-slot">
        <ScrollStory />
      </section>

      {/* =====================================================================
          2. ABOUT / INTRO SECTION (WHITE BG)
      ===================================================================== */}
      <section className="shega-about-section">
        <div className="shega-container shega-about-grid">
          <div className="shega-about-left">
            <h2 className="shega-about-headline">
              AN INDEPENDENT EVENT COMPANY CREATING EXPERIENCES THAT BRING PEOPLE
              TOGETHER, FROM THE FIRST IDEA TO THE FINAL MOMENT.
            </h2>
          </div>

          <div className="shega-about-right">
            <p className="shega-about-bio">
              Shega Events is an independent event production company founded in
              2023. We design, produce, and manage live experiences &mdash; from
              intimate cultural gatherings to large-scale music nights &mdash; built on
              unforgettable atmosphere.
            </p>

            <div className="shega-stats-list">
              <div className="shega-stat-row">
                <span className="shega-stat-label">FOUNDED</span>
                <span className="shega-stat-value">2023</span>
              </div>
              <div className="shega-stat-row">
                <span className="shega-stat-label">HEADQUARTERS</span>
                <span className="shega-stat-value">Addis Ababa</span>
              </div>
              <div className="shega-stat-row">
                <span className="shega-stat-label">FLAGSHIP SERIES</span>
                <span className="shega-stat-value">Kemn Lejemer</span>
              </div>
              <div className="shega-stat-row">
                <span className="shega-stat-label">EVENTS PRODUCED</span>
                <span className="shega-stat-value">15+</span>
              </div>
            </div>

            <div>
              <button type="button" className="shega-pill-outline-btn">
                <span className="shega-orange-dot" />
                LEARN MORE
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          3. FEATURED EVENTS SHOWCASE (BLACK FRAME + WHITE CARDS)
      ===================================================================== */}
      <section className="shega-events-section">
        {eventShowcases.map((event) => (
          <article key={event.id} className="shega-event-card">
            <div className="shega-event-top-bar" />

            <div className="shega-event-media-placeholder">
              <span>{event.mediaNote}</span>
            </div>

            <div className="shega-event-footer">
              <h3 className="shega-event-title">{event.title}</h3>
              <p className="shega-event-category">{event.category}</p>
              <p className="shega-event-year">{event.year}</p>
              <button type="button" className="shega-event-btn">
                EXPLORE EVENT
              </button>
            </div>
          </article>
        ))}
      </section>

      {/* =====================================================================
          4. THROUGH OUR EYES (VISUAL ARCHIVES ACCORDION GALLERY)
      ===================================================================== */}
      <section className="shega-archives-section">
        <div className="shega-container shega-archives-header">
          <div className="shega-archives-title-col">
            <h2 className="shega-section-title-lg">
              THROUGH OUR
              <br />
              EYES.
            </h2>
          </div>
          <div className="shega-archives-sub-col">
            <p className="shega-eyebrow-dark">VISUAL ARCHIVES</p>
            <p className="shega-archives-desc">
              The lights, the crowd, the chaos, the moments between the moments.
            </p>
          </div>
        </div>

        <div className="shega-archives-strip-row">
          {visualArchives.map((item, idx) => {
            const isExpanded = activeArchive === idx;
            return (
              <div
                key={item.id}
                onMouseEnter={() => setActiveArchive(idx)}
                onClick={() => setActiveArchive(idx)}
                className={`shega-archive-panel ${isExpanded ? "is-expanded" : ""}`}
              >
                <div className="shega-archive-caption">
                  <p>{item.label}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* =====================================================================
          5. DARK SECTION: MEET THE NIGHTMAKERS + LET'S MAKE IT AN EVENT
      ===================================================================== */}
      <section className="shega-dark-section">
        <div className="shega-container">
          {/* Switcher Header */}
          <div className="shega-switcher-header">
            <button
              type="button"
              onClick={() => setActiveTab("nightmakers")}
              className={`shega-tab-btn ${activeTab === "nightmakers" ? "is-active" : ""}`}
            >
              <h2 className="shega-section-title-lg">
                MEET THE
                <br />
                NIGHTMAKERS.
              </h2>
            </button>

            <span className="shega-switcher-or">OR</span>

            <button
              type="button"
              onClick={() => setActiveTab("peoples")}
              className={`shega-tab-btn ${activeTab === "peoples" ? "is-active" : ""}`}
            >
              <h2 className="shega-section-title-lg">
                WHAT
                <br />
                PEOPLES SAY.
              </h2>
            </button>
          </div>

          {/* Vertical Divider Space */}
          <div className="shega-divider-stage">
            <div className="shega-vertical-line" />
            <div className="shega-divider-content" />
          </div>

          {/* Bottom Contact Grid */}
          <div className="shega-contact-grid">
            {/* Left Column */}
            <div className="shega-contact-left">
              <div>
                <div className="shega-eyebrow-light">
                  <span className="shega-orange-dot" />
                  <span>START A PROJECT</span>
                </div>

                <h2 className="shega-contact-title">
                  LET&apos;S MAKE
                  <br />
                  IT AN EVENT.
                </h2>

                <p className="shega-contact-subtext">
                  From concept to final encore &mdash; let&apos;s build something people
                  talk about long after the lights come up.
                </p>
              </div>

              <div className="shega-contact-info-list">
                <div className="shega-contact-info-row">
                  <span className="shega-contact-label">GENERAL INQUIRIES</span>
                  <a
                    href="mailto:info@shega.events"
                    className="shega-contact-link"
                  >
                    info@shega.events
                  </a>
                </div>

                <div className="shega-contact-info-row">
                  <span className="shega-contact-label">PARTNERSHIPS</span>
                  <a
                    href="mailto:partnerships@shega.events"
                    className="shega-contact-link"
                  >
                    partnerships@shega.events
                  </a>
                </div>

                <div className="shega-contact-info-row">
                  <span className="shega-contact-label">DIRECT PHONE</span>
                  <a href="tel:+251911000000" className="shega-contact-link">
                    +251 911 00 00 00
                  </a>
                </div>

                <p className="shega-contact-footnote">
                  BASED IN ADDIS ABABA &middot; PRODUCING ACROSS ETHIOPIA &amp; BEYOND
                </p>
              </div>
            </div>

            {/* Right Column: Form Card */}
            <div className="shega-contact-right">
              <div className="shega-form-card">
                <h3 className="shega-form-heading">TELL US ABOUT YOUR EVENT</h3>

                <form onSubmit={(e) => e.preventDefault()} className="shega-form">
                  <div className="shega-field">
                    <label className="shega-label">YOUR NAME *</label>
                    <input
                      type="text"
                      placeholder="Full name or organization"
                      className="shega-input"
                    />
                  </div>

                  <div className="shega-field">
                    <label className="shega-label">EMAIL ADDRESS *</label>
                    <input
                      type="email"
                      placeholder="you@example.com"
                      className="shega-input"
                    />
                  </div>

                  <div className="shega-field">
                    <label className="shega-label">EVENT TYPE</label>
                    <input
                      type="text"
                      placeholder="Concert, brand activation, festival, private..."
                      className="shega-input"
                    />
                  </div>

                  <div className="shega-field">
                    <label className="shega-label">ESTIMATED GUESTS &amp; DATE</label>
                    <input
                      type="text"
                      placeholder="e.g. 500 guests • November 2026"
                      className="shega-input"
                    />
                  </div>

                  <div className="shega-field">
                    <label className="shega-label">PROJECT DETAILS</label>
                    <input
                      type="text"
                      placeholder="Share your vision, venue ideas, or goals..."
                      className="shega-input"
                    />
                  </div>

                  <div className="shega-form-actions">
                    <button type="submit" className="shega-submit-pill">
                      SEND INQUIRY
                    </button>
                    <button
                      type="submit"
                      aria-label="Submit inquiry"
                      className="shega-submit-arrow"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        width="14"
                        height="14"
                      >
                        <path
                          fillRule="evenodd"
                          d="M5.22 14.78a.75.75 0 0 0 1.06 0l7.22-7.22v5.69a.75.75 0 0 0 1.5 0v-7.5a.75.75 0 0 0-.75-.75h-7.5a.75.75 0 0 0 0 1.5h5.69l-7.22 7.22a.75.75 0 0 0 0 1.06Z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          6. ORANGE FOOTER SECTION
      ===================================================================== */}
      <footer className="shega-footer">
        <div className="shega-container shega-footer-inner">
          <div className="shega-footer-col">Logo</div>
          <div className="shega-footer-center">
            <a href="#privacy">Privacy policy....</a>
            <span>&amp; other footers</span>
          </div>
          <div className="shega-footer-col">Socials</div>
        </div>
      </footer>
    </main>
  );
}
