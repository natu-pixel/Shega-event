"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";
import { FrameCache } from "@/lib/frame-cache";
import { CHAPTERS, ETFC_SEQUENCE_END_FRAME, FIRST_SEQUENCE_END_FRAME, OPENING_STILLS_END_FRAME, posterUrl, type Chapter } from "@/lib/story";
import { chapterStart, clamp, coverRect, easeFrame, ETFC_SEQUENCE_SCREENS, OPENING_SEQUENCE_SCREENS, PLAYBACK_SCREENS, sampleStory, travelScreens } from "@/lib/timeline";

const motionQuery = "(prefers-reduced-motion: reduce)";
const AUTOPLAY_DURATION_MS = 90_000;
function subscribeMotion(callback: () => void) {
  const media = window.matchMedia(motionQuery);
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}
const getReducedMotion = () => window.matchMedia(motionQuery).matches;
const getServerMotion = () => false;
const HERO_COPY = "Not just an event.\nA feeling that stays.";

function TypewriterIntro() {
  const [characters, setCharacters] = useState(0);
  const lineBreak = HERO_COPY.indexOf("\n");

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCharacters((count) => {
        if (count >= HERO_COPY.length) {
          window.clearInterval(timer);
          return count;
        }
        return count + 1;
      });
    }, 48);
    return () => window.clearInterval(timer);
  }, []);

  const firstLine = HERO_COPY.slice(0, Math.min(characters, lineBreak));
  const secondLine = characters > lineBreak ? HERO_COPY.slice(lineBreak + 1, characters) : "";
  const showCursor = characters < HERO_COPY.length;

  return (
    <p>
      <span aria-hidden="true">
        {firstLine}
        {showCursor && characters <= lineBreak && <i className="typewriter-cursor" />}
        <br />
        {secondLine}
        {showCursor && characters > lineBreak && <i className="typewriter-cursor" />}
      </span>
      <span className="sr-only">Not just an event. A feeling that stays.</span>
    </p>
  );
}

export function ScrollStory({ chapters = CHAPTERS, introduction = true }: { chapters?: readonly Chapter[]; introduction?: boolean }) {
  const reducedMotion = useSyncExternalStore(subscribeMotion, getReducedMotion, getServerMotion);
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cacheRef = useRef<FrameCache | null>(null);
  const autoPlayRef = useRef<{ startedAt: number; startDistance: number; duration: number } | null>(null);
  const [active, setActive] = useState(0);
  const [titleChapter, setTitleChapter] = useState(0);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoPlaying, setAutoPlaying] = useState(false);
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
    let autoTargetY = 0;
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
      let distance = (window.scrollY - top) / Math.max(1, height);
      const autoPlay = autoPlayRef.current;
      if (autoPlay) {
        const remaining = Math.max(0.001, total - autoPlay.startDistance);
        const openingEnd = OPENING_SEQUENCE_SCREENS;
        const etfcEnd = openingEnd + ETFC_SEQUENCE_SCREENS;
        const firstEnd = etfcEnd + (PLAYBACK_SCREENS - etfcEnd) * ((FIRST_SEQUENCE_END_FRAME - ETFC_SEQUENCE_END_FRAME) / Math.max(1, counts[0] - ETFC_SEQUENCE_END_FRAME));
        const sequenceEnd = Math.min(PLAYBACK_SCREENS, total);
        const segments = [
          { start: 0, end: openingEnd, slowdown: 1, fixedDuration: 3_500 },
          { start: openingEnd, end: etfcEnd, slowdown: 3, fixedDuration: 0 },
          { start: etfcEnd, end: firstEnd, slowdown: 2, fixedDuration: 0 },
          { start: firstEnd, end: sequenceEnd, slowdown: 1.6, fixedDuration: 0 },
          { start: sequenceEnd, end: total, slowdown: 1, fixedDuration: 0 },
        ].map(({ start, end, slowdown, fixedDuration }) => {
          const from = Math.max(start, autoPlay.startDistance);
          const to = Math.min(end, total);
          const share = Math.max(0, to - from) / remaining;
          const segmentProgress = Math.max(0, to - from) / Math.max(0.001, end - start);
          const duration = fixedDuration > 0
            ? fixedDuration * segmentProgress
            : autoPlay.duration * share * slowdown;
          return { from, to, duration };
        }).filter((segment) => segment.duration > 0);
        const totalDuration = segments.reduce((sum, segment) => sum + segment.duration, 0);
        const progress = clamp((time - autoPlay.startedAt) / totalDuration);
        let elapsedShare = 0;
        let storyDistance = autoPlay.startDistance;
        for (const segment of segments) {
          const timeShare = segment.duration / totalDuration;
          const localProgress = clamp((progress - elapsedShare) / Math.max(0.001, timeShare));
          storyDistance = segment.from + (segment.to - segment.from) * localProgress;
          if (progress <= elapsedShare + timeShare) break;
          elapsedShare += timeShare;
        }
        distance = storyDistance;
        autoTargetY = top + distance * height;
        window.scrollTo({ top: autoTargetY, behavior: "instant" });
        if (progress >= 1) {
          autoPlayRef.current = null;
          setAutoPlaying(false);
        }
      }
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
    const stopAutoPlay = () => {
      if (!autoPlayRef.current) return;
      autoPlayRef.current = null;
      setAutoPlaying(false);
    };
    const onScroll = () => {
      if (autoPlayRef.current && Math.abs(window.scrollY - autoTargetY) > Math.max(80, height * 0.15)) {
        stopAutoPlay();
      }
      dirty = true;
      start();
    };
    const onPointerDown = (event: PointerEvent) => {
      if (event.target instanceof Element && event.target.closest(".story-autoplay-button")) return;
      stopAutoPlay();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (["ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End", " "].includes(event.key)) stopAutoPlay();
    };
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
    window.addEventListener("wheel", stopAutoPlay, { passive: true });
    window.addEventListener("touchstart", stopAutoPlay, { passive: true });
    window.addEventListener("pointerdown", onPointerDown, { passive: true });
    document.addEventListener("keydown", onKeyDown);
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
      window.removeEventListener("wheel", stopAutoPlay);
      window.removeEventListener("touchstart", stopAutoPlay);
      window.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", measure);
      window.removeEventListener("pageshow", measure);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [chapters, reducedMotion, introduction]);

  const goToChapter = (index: number) => {
    autoPlayRef.current = null;
    setAutoPlaying(false);
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
    autoPlayRef.current = null;
    setAutoPlaying(false);
    const destination = document.getElementById("about");
    if (!destination) return;
    const top = destination.getBoundingClientRect().top + window.scrollY;
    window.scrollTo(0, top);
  };

  const toggleAutoPlay = () => {
    if (autoPlayRef.current) {
      autoPlayRef.current = null;
      setAutoPlaying(false);
      return;
    }
    const section = sectionRef.current;
    const stage = stageRef.current;
    if (!section || !stage) return;
    const height = Math.max(1, stage.clientHeight);
    const top = section.getBoundingClientRect().top + window.scrollY;
    let startDistance = clamp((window.scrollY - top) / height, 0, total);
    if (startDistance >= total - 0.01) {
      startDistance = 0;
      window.scrollTo({ top, behavior: "instant" });
    }
    const duration = Math.max(2_000, AUTOPLAY_DURATION_MS * ((total - startDistance) / total));
    autoPlayRef.current = { startedAt: performance.now(), startDistance, duration };
    setAutoPlaying(true);
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
              <TypewriterIntro />
            </div>
            <div className="intro-bottom">
              <p>We bring people together.<br />And make the moment matter.</p>
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
          {!reducedMotion && (
            <div className="story-footer-controls">
              <button className="skip-story-button" type="button" onClick={skipStory}>Skip animation</button>
              <button
                className="story-autoplay-button"
                type="button"
                onClick={toggleAutoPlay}
                aria-pressed={autoPlaying}
                aria-label={autoPlaying ? "Pause automatic story playback" : "Play the story automatically"}
              >
              <span aria-hidden="true">{autoPlaying ? "Ⅱ" : "▶"}</span>
              {autoPlaying ? "PAUSE" : "AUTO PLAY"}
              </button>
            </div>
          )}
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
        <div className="film-progress" aria-hidden="true"><span /></div>
      </div>
      <noscript><style>{".scroll-story{height:100svh!important}.scroll-cue,.frame-status,.chapter-nav{display:none!important}"}</style></noscript>
    </section>
  );
}
