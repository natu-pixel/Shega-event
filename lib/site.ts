// Central site identity. Swap the domain via NEXT_PUBLIC_SITE_URL (or the
// fallback below) once the production domain is confirmed.
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://shega-events.example";

export const SITE_NAME = "Shega Events";
export const SITE_TITLE = "Shega Events — Event Organizer in Addis Ababa, Ethiopia";
export const SITE_DESCRIPTION =
  "Shega Events is an event organizer in Addis Ababa, Ethiopia, producing concerts, festivals, brand activations and live experiences — from Rophnan and Lij Michael shows to city-wide runs.";

export const PHONE_DISPLAY = "0909 090 909";
export const PHONE_TEL = "+251909090909";

export const INSTAGRAM_URL = "https://www.instagram.com/shega_events/";
export const OG_IMAGE = { url: "/events/rophnan-finale.jpg", width: 1440, height: 810, alt: "Rophnan concert audience and stage, produced by Shega Events" };
