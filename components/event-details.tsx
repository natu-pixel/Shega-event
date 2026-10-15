import type { Chapter } from "@/lib/story";

export function EventDetails({ chapter, variant = "overlay" }: {
  chapter: Chapter;
  variant?: "overlay" | "overview";
}) {
  const titleId = `${variant}-${chapter.id}-title`;
  return (
    <article className={`event-details event-details-${variant}`} data-event-id={chapter.id} aria-labelledby={titleId}>
      <div className="event-copy">
        <div className="event-heading">
          <span className="eyebrow">ABOUT THE EVENT</span>
          <h2 id={titleId}>{chapter.details.title}</h2>
        </div>
        <p className="event-description">{chapter.details.description}</p>
        <dl className="event-facts">
          {chapter.details.facts.map((fact) => (
            <div key={fact.label}><dt>{fact.label}</dt><dd>{fact.value}</dd></div>
          ))}
        </dl>
        <a className="event-source" href={chapter.details.source.url} target="_blank" rel="noopener noreferrer">
          {chapter.details.source.label}<span aria-hidden="true">&#8599;</span>
        </a>
      </div>
    </article>
  );
}
