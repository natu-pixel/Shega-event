import Link from "next/link";
import Image from "next/image";

// The live company mark is the black-background profile image; see
// public/brand/shega-events-black-provenance.json. The file is served unmodified.
export function Brand({ footer = false }: { footer?: boolean }) {
  if (footer) {
    return (
      <Link href="/#experience" className="brand-footer-link" aria-label="Shega home">
        <Image src="/brand/shega-events-white.png" alt="Shega Events" width={40} height={40} unoptimized className="brand-footer-logo" />
        <span className="brand-footer-text">SHEGA EVENTS</span>
      </Link>
    );
  }
  return (
    <Link href="/#experience" className={`brand${footer ? " brand-footer" : ""}`} aria-label="Shega home">
      <Image src="/brand/shega-events-black.jpg" alt="Shega Events" width={150} height={150} unoptimized className="brand-logo" />
    </Link>
  );
}
