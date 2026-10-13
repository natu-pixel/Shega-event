import type { Metadata, Viewport } from "next";
import { Montserrat, Poppins } from "next/font/google";
import { OG_IMAGE, SITE_DESCRIPTION, SITE_NAME, SITE_TITLE, SITE_URL } from "@/lib/site";
import "./globals.css";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
  variable: "--font-montserrat",
  display: "swap",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "SHEGA — Moments that move you", template: `%s — ${SITE_NAME}` },
  description: SITE_DESCRIPTION,
  keywords: [
    "event organizer Addis Ababa", "event organizer Ethiopia", "concert production Ethiopia",
    "event planning Addis Ababa", "brand activation Ethiopia", "festival organizer Ethiopia",
    "የዝግጅት አዘጋጅ አዲስ አበባ", "ኮንሰርት ኢትዮጵያ", "Shega Events",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    locale: "en_US",
    images: [OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [OG_IMAGE.url],
  },
  robots: { index: true, follow: true },
};
export const viewport: Viewport = { themeColor: "#0A0A0A" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${montserrat.variable} ${poppins.variable}`}>
      <body>{children}</body>
    </html>
  );
}
