import type { Metadata } from "next";
import GalleryContent from "./gallery-content";

export const metadata: Metadata = {
  title: "Event Gallery",
  description: "Explore the Shega Events archive of concerts, festivals and live experiences.",
};

export default function GalleryPage() {
  return <GalleryContent />;
}
