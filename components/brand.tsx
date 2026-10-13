import Link from "next/link";
import Image from "next/image";

export function Brand({ footer = false }: { footer?: boolean }) {
  return (
    <Link href="/#experience" className={`brand${footer ? " brand-footer" : ""}`} aria-label="Shega home">
      <Image src="/brand/shega-events-white.png" alt="Shega Events" width={150} height={150} unoptimized className="brand-logo" />
    </Link>
  );
}
