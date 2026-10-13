import { Brand } from "@/components/brand";
import Navbar from "@/components/Navbar";
import CoverflowGallery, { GalleryItem } from "@/components/CoverflowGallery";
import { ScrollStory } from "@/components/scroll-story";
import { StructuredData } from "@/components/structured-data";
import { PHONE_DISPLAY, PHONE_TEL } from "@/lib/site";

const galleryItems: GalleryItem[] = [
  {
    id: 1,
    title: "Kemn Ljemr - Concert reel",
    image: "/events/kemen-lejemer/02-user-selected-entrance.jpg",
    href: "https://www.instagram.com/bermel_fest/p/DZIF0nbDdTP/",
    mediaType: "video",
    category: "kemen",
    count: 1,
  },
  {
    id: 2,
    title: "Hello Hawassa",
    image: "/events/halo-hawassa/01-yohana-stage-crowd.jpg",
    href: "https://www.instagram.com/yohanaoriginal/p/DU6cP2yCkBV/",
    mediaType: "video",
    category: "hawassa",
    count: 1,
  },
  {
    id: 3,
    title: "Kemn Ljemr - Live album",
    image: "/events/kemen-lejemer/01-live-duet.jpg",
    href: "https://www.instagram.com/bermel_fest/p/DZIF0nbDdTP/",
    mediaType: "photo",
    category: "kemen",
    count: 1,
  },
  {
    id: 4,
    title: "Hello Hawassa - Yohanna live",
    image: "/events/yohanna-halo-hawassa.jpg",
    href: "https://www.instagram.com/yohanaoriginal/p/DU6cP2yCkBV/",
    mediaType: "photo",
    category: "hawassa",
    count: 1,
  },
  {
    id: 5,
    title: "Bermel Fest - Pyro and lights",
    image: "/events/rophnan-finale/01-aerial-stage-and-crowd.jpg",
    href: "https://www.instagram.com/rophnan/p/DUGMfeZgpqV/",
    mediaType: "video",
    category: "bermel",
    count: 1,
  },
  {
    id: 6,
    title: "Bermel Fest - Crowd energy",
    image: "/events/rophnan-finale/04-user-selected-crowd.jpg",
    href: "https://www.instagram.com/shega_events/p/DaDU5qnjAjM/",
    mediaType: "photo",
    category: "bermel",
    count: 1,
  },
  {
    id: 7,
    title: "Hello Hawassa - Main stage",
    image: "/events/halo-hawassa/02-hawassa-concert.jpg",
    href: "https://www.instagram.com/yohanaoriginal/p/DU6cP2yCkBV/",
    mediaType: "video",
    category: "hawassa",
    count: 1,
  },
  {
    id: 8,
    title: "Bermel Fest - Night celebration",
    image: "/events/keberaf/01-concert.jpg",
    href: "https://www.instagram.com/shega_events/p/DaDU5qnjAjM/",
    mediaType: "photo",
    category: "bermel",
    count: 1,
  },
  {
    id: 9,
    title: "Kemn Ljemr - Solo entrance",
    image: "/events/kemen-lejemer/03-solo-performance.jpg",
    href: "https://www.instagram.com/bermel_fest/p/DZIF0nbDdTP/",
    mediaType: "photo",
    category: "kemen",
    count: 1,
  },
  {
    id: 10,
    title: "Hello Hawassa - Festival view",
    image: "/events/halo-hawassa/03-hawassa-stage-wide.jpg",
    href: "https://www.instagram.com/yohanaoriginal/p/DU6cP2yCkBV/",
    mediaType: "photo",
    category: "hawassa",
    count: 1,
  },
  {
    id: 11,
    title: "Bermel Fest - Sound setup",
    image: "/events/wazema/01-live-performance.jpg",
    href: "https://www.instagram.com/mastewal_eyayu_official/p/DdcDTHmgO0V/",
    mediaType: "video",
    category: "bermel",
    count: 1,
  },
  {
    id: 12,
    title: "Bermel Fest - Finale smoke & stage",
    image: "/events/wazema/02-stage-smoke.jpg",
    href: "https://www.instagram.com/mastewal_eyayu_official/p/DdcDTHmgO0V/",
    mediaType: "photo",
    category: "bermel",
    count: 1,
  },
];

const partners = [
  "Awash Bank",
  "Ethiopian Airlines",
  "Dashen Brewery",
  "Habesha Cement",
  "Abyssinia Bank",
  "Meta Abo Brewery",
];

export default function Home() {
  return (
    <>
      <StructuredData />
      <a href="#gallery" className="skip-link">Skip the animated experience</a>

      {/* ── Navigation ─────────────────────────────────────── */}
      <Navbar logoSrc="/brand/shega-events-white.png" logoAlt="Shega Events" />

      <main>
        {/* ── Hero scroll story ──────────────────────────── */}
        <div id="home">
          <ScrollStory />
        </div>

        {/* ── About Us ──────────────────────────────────── */}
        <section className="intro-section section-pad" id="about" aria-labelledby="about-title">
          <div className="section-meta">
            <span className="eyebrow">01 / THE SHEGA FEELING</span>
            <span className="tiny-mark" aria-hidden="true">*</span>
          </div>
          <div className="manifesto">
            <h2 id="about-title">You had<br />to <em>be there.</em></h2>
            <div className="manifesto-copy">
              <p>That first beat. The lights coming up. A whole crowd moving as one.</p>
              <p className="muted">We create experiences that bring people closer. From live stages to shared streets, we turn a gathering into something you feel.</p>
              <a href="#contact" className="text-link">Let&apos;s create that feeling <span aria-hidden="true">&#8599;</span></a>
            </div>
          </div>
          <div className="services">
            <div><span>01</span><h3>Live experiences</h3><p>Stages, sounds and the moments in between.</p></div>
            <div><span>02</span><h3>Brand encounters</h3><p>Real connections. Beyond the logo.</p></div>
            <div><span>03</span><h3>Creative production</h3><p>A clear idea, brought to life with care.</p></div>
          </div>
        </section>

        {/* ── Coverflow Gallery ───────────────────────────── */}
        <CoverflowGallery items={galleryItems} />

        {/* ── Partners ──────────────────────────────────── */}
        <section className="partners-section section-pad" id="partners" aria-labelledby="partners-title">
          <div className="section-meta">
            <span className="eyebrow">03 / TRUSTED BY</span>
          </div>
          <h2 id="partners-title" className="partners-heading">Our <em>Partners</em></h2>
          <div className="partners-grid">
            {partners.map((name) => (
              <div key={name} className="partner-card">
                <span>{name}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── Contact ───────────────────────────────────── */}
        <section className="contact-section section-pad" id="contact" aria-labelledby="contact-title">
          <div className="section-meta">
            <span className="eyebrow">04 / YOUR NEXT MOMENT</span>
            <span className="eyebrow">LET&apos;S MAKE IT MATTER.</span>
          </div>
          <a className="contact-link" href="https://www.instagram.com/shega_events/" target="_blank" rel="noopener noreferrer">
            <h2 id="contact-title">Have something<br /><em>in mind?</em></h2>
            <span className="contact-arrow" aria-hidden="true">&#8599;</span>
          </a>
          <div className="contact-bottom">
            <p>We&apos;d love to hear it.</p>
            <div className="contact-actions">
              <a className="text-link call-link" href={`tel:${PHONE_TEL}`}>Call us on {PHONE_DISPLAY} <span aria-hidden="true">&#9742;</span></a>
              <a className="text-link" href="https://www.instagram.com/shega_events/" target="_blank" rel="noopener noreferrer">Talk to Shega on Instagram <span aria-hidden="true">&#8599;</span></a>
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <Brand footer />
        <p>Made for the moment. Remembered long after.</p>
        <a href="#experience">Back to the feeling <span aria-hidden="true">&#8593;</span></a>
      </footer>
    </>
  );
}
