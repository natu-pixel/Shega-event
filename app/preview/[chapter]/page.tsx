import Link from "next/link";
import { notFound } from "next/navigation";
import { ScrollStory } from "@/components/scroll-story";
import { CHAPTERS } from "@/lib/story";
import { EventDetails } from "@/components/event-details";
import { Brand } from "@/components/brand";

export function generateStaticParams() {
  return CHAPTERS.map((chapter) => ({ chapter: chapter.id }));
}

export default async function ChapterPreview({ params }: { params: Promise<{ chapter: string }> }) {
  const { chapter: id } = await params;
  const chapter = CHAPTERS.find((item) => item.id === id);
  if (!chapter) notFound();
  return (
    <>
      <header className="preview-header"><Brand /><Link href="/">&#8592; All experiences</Link></header>
      <main>
        <ScrollStory chapters={[chapter]} introduction={false} />
        <section className="preview-end" id="work" aria-label={`${chapter.name} event details`}>
          <EventDetails chapter={chapter} variant="overview" />
          <Link className="text-link" href="/">View the complete experience &#8599;</Link>
        </section>
      </main>
    </>
  );
}
