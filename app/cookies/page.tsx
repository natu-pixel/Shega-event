import { Metadata } from "next";
import { SITE_NAME, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Cookies",
  description: `${SITE_NAME} information about cookies and similar technologies.`,
  alternates: { canonical: "/cookies" },
};

export default function CookiesPage() {
  return (
    <main className="shega-legal-page">
      <section className="shega-legal-section">
        <div className="shega-container shega-legal-grid">
          <div className="shega-legal-left">
            <h1 className="shega-legal-title">Cookies Policy</h1>
            <p className="shega-legal-intro">Last updated: October 17, 2026</p>
            <nav className="shega-legal-nav">
              <a href="#what-are-cookies">What are cookies</a>
              <a href="#cookies-we-use">Cookies on this site</a>
              <a href="#managing-cookies">Managing cookies</a>
              <a href="#contact-us">Contact us</a>
            </nav>
          </div>
          <div className="shega-legal-right">
            <section id="what-are-cookies" className="shega-legal-block">
              <h2>What are cookies</h2>
              <p>
                Cookies are small files a website or its service providers may store on your device.
                Similar technologies can store or read information in other ways.
              </p>
            </section>
            <section id="cookies-we-use" className="shega-legal-block">
              <h2>Cookies on this site</h2>
              <p>
                The site code does not include analytics or advertising trackers, and we do not use
                analytics or advertising cookies. The hosting and security services that deliver the
                site may use strictly necessary technologies to protect and operate their services.
                Their use is governed by those providers’ practices.
              </p>
            </section>
            <section id="managing-cookies" className="shega-legal-block">
              <h2>Managing cookies</h2>
              <p>
                You can manage or remove cookies through your browser settings. Blocking all cookies
                may affect security or site delivery features provided by our hosting services.
              </p>
            </section>
            <section id="contact-us" className="shega-legal-block">
              <h2>Contact us</h2>
              <p>
                For questions about this policy, email <a href="mailto:info@shega.events">info@shega.events</a>.
              </p>
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}
