import { CHAPTERS } from "@/lib/story";
import { INSTAGRAM_URL, PHONE_TEL, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";

const organization = {
  "@type": ["Organization", "LocalBusiness"],
  "@id": `${SITE_URL}/#organization`,
  name: SITE_NAME,
  alternateName: "ሸጋ ኢቨንትስ",
  url: SITE_URL,
  description: SITE_DESCRIPTION,
  telephone: PHONE_TEL,
  logo: `${SITE_URL}/brand/shega-events-logo.png`,
  image: `${SITE_URL}/events/rophnan-finale.jpg`,
  address: {
    "@type": "PostalAddress",
    addressLocality: "Addis Ababa",
    addressCountry: "ET",
  },
  areaServed: { "@type": "Country", name: "Ethiopia" },
  knowsAbout: ["Event planning", "Concert production", "Brand activations", "Festivals", "Live experiences"],
  sameAs: [INSTAGRAM_URL],
};

const portfolio = {
  "@type": "ItemList",
  "@id": `${SITE_URL}/#portfolio`,
  name: "Selected moments by Shega Events",
  itemListElement: CHAPTERS.map((chapter, index) => ({
    "@type": "ListItem",
    position: index + 1,
    item: {
      "@type": "Event",
      name: chapter.details.title,
      description: chapter.details.description,
      eventStatus: "https://schema.org/EventScheduled",
      organizer: { "@id": `${SITE_URL}/#organization` },
      location: { "@type": "Country", name: "Ethiopia" },
      sameAs: chapter.details.source.url,
    },
  })),
};

const website = {
  "@type": "WebSite",
  "@id": `${SITE_URL}/#website`,
  url: SITE_URL,
  name: SITE_NAME,
  publisher: { "@id": `${SITE_URL}/#organization` },
  inLanguage: "en",
};

const graph = { "@context": "https://schema.org", "@graph": [organization, website, portfolio] };

export function StructuredData() {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }} />;
}
