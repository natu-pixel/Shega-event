"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";
import { FrameCache } from "@/lib/frame-cache";
import { CHAPTERS, posterUrl, type Chapter } from "@/lib/story";
import { chapterStart, coverRect, easeFrame, sampleStory, travelScreens } from "@/lib/timeline";

const motionQuery = "(prefers-reduced-motion: reduce)";
function subscribeMotion(callback: () => void) {
  const media = window.matchMedia(motionQuery);
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}
const getReducedMotion = () => window.matchMedia(motionQuery).matches;
const getServerMotion = () => false;

export function ScrollStory({ chapters = CHAPTERS, introduction = true }: { chapters?: readonly Chapter[]; introduction?: boolean }) {
  const reducedMotion = useSyncExternalStore(subscribeMotion, getReducedMotion, getServerMotion);
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cacheRef = useRef<FrameCache | null>(null);
  const [active, setActive] = useState(0);
  const [titleChapter, setTitleChapter] = useState(0);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const total = travelScreens(chapters.length);
  const chapter = chapters[active] ?? chapters[0];
  const showIntroduction = introduction && !reducedMotion;

  useEffect(() => {
    const section = sectionRef.current;
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    if (!section || !stage || !canvas || reducedMotion || window.matchMedia(motionQuery).matches) return;
    const introLink = section.querySelector<HTMLAnchorElement>(".hero-intro .text-link");
    const context = canvas.getContext("2d", { alpha: false });
    if (!context) {
      const id = requestAnimationFrame(() => setError("Canvas is unavailable. A still image is shown instead."));
      return () => cancelAnimationFrame(id);
    }

    let disposed = false;
    let visible = true;
    let raf = 0;
    let previousTime = 0;
    let width = 1;
    let height = 1;
    let top = 0;
    let dpr = 1;
    let cursor = 0;
    let previousChapter = -1;
    let previousTitle = -1;
    let drawn = "";
    let dirty = true;
    let chapterReady = false;
    let lastStats = 0;
    const counts = chapters.map((item) => item.frames);
    const cache = new FrameCache(() => { dirty = true; }, setError);
    cacheRef.current = cache;

    const measure = () => {
      width = stage.clientWidth;
      height = stage.clientHeight;
      top = section.getBoundingClientRect().top + window.scrollY;
      dpr = Math.min(window.devicePixelRatio || 1, 2, Math.sqrt(8_000_000 / Math.max(1, width * height)));
      section.dataset.viewportHeight = String(height);
      dirty = true;
    };

    const tick = (time: number) => {
      if (disposed || !visible || document.hidden) {
        raf = 0;
        section.dataset.activeLoops = "0";
        return;
      }
      section.dataset.activeLoops = "1";
      const distance = (window.scrollY - top) / Math.max(1, height);
      const sample = sampleStory(distance, counts);
      const delta = previousTime ? time - previousTime : 16.67;
      previousTime = time;
      if (sample.chapter !== previousChapter) {
        cursor = sample.frame;
        previousChapter = sample.chapter;
        setActive(sample.chapter);
        setReady(false);
        chapterReady = false;
        drawn = "";
      } else {
        cursor = sample.phase === "playback" ? easeFrame(cursor, sample.frame, delta) : sample.frame;
      }
      if (sample.titleChapter !== previousTitle) {
        previousTitle = sample.titleChapter;
        setTitleChapter(sample.titleChapter);
      }
      const current = chapters[sample.chapter];
      const next = sample.frame > current.frames * 0.7 ? chapters[sample.chapter + 1] : undefined;
      cache.request(current, cursor, sample.frame, next);
      const direction = sample.frame > cursor ? 1 : sample.frame < cursor ? -1 : 0;
      const image = cache.nearest(current, cursor, direction);

      const introOpacity = introduction ? sample.intro : 0;
      stage.style.setProperty("--intro", introOpacity.toFixed(4));
      stage.style.setProperty("--intro-y", `${(1 - introOpacity) * -44}px`);
      stage.style.setProperty("--bridge-title", sample.bridgeTitle.toFixed(4));
      stage.style.setProperty("--exit-title", sample.exitTitle.toFixed(4));
      stage.style.setProperty("--film-progress", sample.progress.toFixed(5));
      stage.style.setProperty("--chapter-label", String((1 - sample.bridgeTitle) * (1 - sample.exitTitle)));
      if (introLink) {
        introLink.tabIndex = introOpacity < 0.01 ? -1 : 0;
        introLink.style.visibility = introOpacity < 0.01 ? "hidden" : "visible";
      }
      section.dataset.phase = sample.phase;
      section.dataset.targetFrame = String(Math.round(sample.frame) + 1);
      section.dataset.chapter = current.id;

      if (image) {
        canvas.style.opacity = "1";
        const backingWidth = Math.max(1, Math.round(width * dpr));
        const backingHeight = Math.max(1, Math.round(height * dpr));
        if (canvas.width !== backingWidth || canvas.height !== backingHeight) {
          canvas.width = backingWidth;
          canvas.height = backingHeight;
          context.setTransform(dpr, 0, 0, dpr, 0, 0);
          drawn = "";
        }
        const signature = `${current.id}:${image.index}:${sample.darkness.toFixed(5)}:${width}:${height}:${dpr}`;
        if (dirty || signature !== drawn) {
          const rect = coverRect(width, height, image.width, image.height, sample.zoom, current.focalX, current.focalY, sample.panX, sample.panY);
          context.fillStyle = "#100f0c";
          context.fillRect(0, 0, width, height);
          context.drawImage(image.image, rect.x, rect.y, rect.width, rect.height);
          if (sample.darkness > 0) {
            context.fillStyle = `rgba(16,15,12,${sample.darkness})`;
            context.fillRect(0, 0, width, height);
          }
          section.dataset.renderedFrame = String(image.index + 1);
          section.dataset.renderedChapter = current.id;
          drawn = signature;
          dirty = false;
        }
        if (!chapterReady) {
          chapterReady = true;
          setReady(true);
        }
      } else if (!chapterReady) {
        canvas.style.opacity = "0";
      }
      if (time - lastStats > 200) {
        const stats = cache.stats();
        section.dataset.loadedFrames = String(stats.loaded);
        section.dataset.decodedBytes = String(stats.decodedBytes);
        section.dataset.encodedBytes = String(stats.encodedBytes);
        lastStats = time;
      }
      raf = requestAnimationFrame(tick);
    };

    const start = () => {
      if (!raf && visible && !document.hidden && !disposed) {
        previousTime = 0;
        raf = requestAnimationFrame(tick);
      }
    };
    const onScroll = () => { dirty = true; start(); };
    const onVisibility = () => {
      cache.setActive(visible && !document.hidden);
      if (document.hidden) {
        cancelAnimationFrame(raf);
        raf = 0;
        section.dataset.activeLoops = "0";
      } else {
        measure();
        start();
      }
    };
    const resize = new ResizeObserver(() => { measure(); start(); });
    resize.observe(stage);
    const intersection = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      cache.setActive(visible && !document.hidden);
      if (visible) {
        measure();
        start();
      } else {
        cancelAnimationFrame(raf);
        raf = 0;
        section.dataset.activeLoops = "0";
      }
    }, { rootMargin: "100px" });
    intersection.observe(section);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", measure);
    window.addEventListener("pageshow", measure);
    document.addEventListener("visibilitychange", onVisibility);
    measure();
    start();

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      section.dataset.activeLoops = "0";
      cache.dispose();
      cacheRef.current = null;
      if (introLink) {
        introLink.tabIndex = 0;
        introLink.style.visibility = "";
      }
      resize.disconnect();
      intersection.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", measure);
      window.removeEventListener("pageshow", measure);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [chapters, reducedMotion, introduction]);

  const goToChapter = (index: number) => {
    if (reducedMotion) {
      setActive(index);
      return;
    }
    const section = sectionRef.current;
    const stage = stageRef.current;
    if (!section || !stage) return;
    const top = section.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: top + chapterStart(index) * stage.clientHeight, behavior: "smooth" });
  };

  const skipStory = () => {
    const destination = document.getElementById("about");
    if (!destination) return;
    const top = destination.getBoundingClientRect().top + window.scrollY;
    window.scrollTo(0, top);
  };

  return (
    <section
      className="scroll-story"
      id="experience"
      ref={sectionRef}
      aria-label="A journey through Shega events"
      data-reduced-motion={reducedMotion}
      data-introduction={showIntroduction}
      data-total-screens={total}
      style={{ "--story-screens": total + 1 } as CSSProperties}
    >
      <div className="story-stage" ref={stageRef}>
        <div className="story-poster">
          <img
            src={posterUrl(chapter)}
            alt=""
            loading="eager"
            fetchPriority="high"
            decoding="async"
            style={{ objectPosition: `${chapter.focalX * 100}% 50%` }}
          />
        </div>
        <canvas className="story-canvas" ref={canvasRef} aria-hidden="true" />
        <div className="film-shade" aria-hidden="true" />
        {showIntroduction ? (
          <div className="hero-intro">
            <div className="intro-top">
              <span className="eyebrow"><span className="live-dot" /> ADDIS ABABA, ETHIOPIA</span>
              <p>Not just an event.<br />A feeling that stays.</p>
            </div>
            <div className="hero-title">
              <h1>
                <span className="hero-brand-name">SHEGA</span>{" "}
                <span className="hero-brand-descriptor">EVENTS</span>
              </h1>
            </div>
            <div className="intro-bottom">
              <p>We bring people together.<br />And make the moment matter.</p>
              <button className="skip-story-button" type="button" onClick={skipStory}>Skip animation <span aria-hidden="true">↓</span></button>
            </div>
          </div>
        ) : <h1 className="sr-only">Shega Events: {chapter.name}</h1>}

        <div className="bridge-title" aria-hidden="true">
          <span className="eyebrow">NEXT CHAPTER / {String(titleChapter + 1).padStart(2, "0")}</span>
          <p>{chapters[titleChapter]?.name}</p>
          <span className="bridge-line">{chapters[titleChapter]?.line}</span>
        </div>
        <div className="exit-title" aria-hidden="true">
          <span className="eyebrow">THE FEELING DOESN&apos;T END HERE</span>
          <p>Some moments<br />stay with you.</p>
        </div>
        <div className="story-footer">
          <div className="chapter-caption">
            <span className="eyebrow">
              {chapters.length > 1 ? `${String(active + 1).padStart(2, "0")} / ` : ""}
              {chapter.eyebrow}
            </span>
            <p>{chapter.name} <span>In the moment.</span></p>
          </div>
          <div className="scroll-cue" aria-hidden="true"><span className="scroll-line" />SCROLL TO FLY</div>
          {chapters.length > 1 && (
            <nav className="chapter-nav" aria-label="Event chapters">
              {chapters.map((item, index) => (
                <button key={item.id} type="button" onClick={() => goToChapter(index)} aria-label={`Go to ${item.name}`} aria-current={index === active ? "step" : undefined}>
                  <span>{String(index + 1).padStart(2, "0")}</span><i />
                </button>
              ))}
            </nav>
          )}
        </div>
        {!ready && !reducedMotion && !error && <span className="frame-status" role="status">Preparing the scene<span aria-hidden="true">...</span></span>}
        {error && <div className="frame-error" role="status">{error}<button type="button" onClick={() => cacheRef.current?.retryFailures()}>Retry frames</button></div>}
        <div className="film-progress" aria-hidden="true"><span /></div>
      </div>
      <noscript><style>{".scroll-story{height:100svh!important}.scroll-cue,.frame-status,.chapter-nav{display:none!important}"}</style></noscript>
    </section>
  );
}
