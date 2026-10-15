import { CHAPTERS } from "@/lib/story";
import { CONTACT_CHANNELS, INSTAGRAM_HANDLE, INSTAGRAM_URL, OG_IMAGE, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";

// Only verified facts are emitted. There is deliberately no telephone, email or
// street address here until the real values exist; inventing them would produce
// confidently wrong structured data in search results.
const organization = {
  "@type": ["Organization", "LocalBusiness"],
  "@id": `${SITE_URL}/#organization`,
  name: SITE_NAME,
  alternateName: "ሸጋ ኢቨንትስ",
  url: SITE_URL,
  description: SITE_DESCRIPTION,
  image: `${SITE_URL}${OG_IMAGE.url}`,
  address: {
    "@type": "PostalAddress",
    addressLocality: "Addis Ababa",
    addressCountry: "ET",
  },
  areaServed: { "@type": "Country", name: "Ethiopia" },
  knowsAbout: ["Event planning", "Concert production", "Brand activations", "Festivals", "Live experiences"],
  sameAs: [INSTAGRAM_URL],
  ...(CONTACT_CHANNELS.length ? { contactPoint: CONTACT_CHANNELS.map((channel) => ({ "@type": "ContactPoint", name: channel.label, url: channel.href })) } : {}),
};

const portfolio = {
  "@type": "ItemList",
  "@id": `${SITE_URL}/#portfolio`,
  name: `Selected moments by ${SITE_NAME}`,
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
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }} />
      {/* Instagram is the only confirmed channel; keep it discoverable as a link. */}
      <link rel="me" href={INSTAGRAM_URL} title={INSTAGRAM_HANDLE} />
    </>
  );
}
