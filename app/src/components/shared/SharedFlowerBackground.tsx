"use client";

import { useEffect, useRef } from "react";

export type SharedFlowerBackgroundMode = "hero" | "atelier";

interface SharedFlowerBackgroundProps {
  mode: SharedFlowerBackgroundMode;
  dimmed?: boolean;
  className?: string;
}

const FLOWER_VIDEO_SRC =
  "https://stream.mux.com/ajgB02kpdVJOjKWIC6hWuanvwH00wkj2LmeMkgYm00BA28.m3u8";
const FLOWER_VIDEO_POSTER =
  "https://image.mux.com/ajgB02kpdVJOjKWIC6hWuanvwH00wkj2LmeMkgYm00BA28/thumbnail.webp";
const HLS_SCRIPT_SRC = "https://cdn.jsdelivr.net/npm/hls.js@1.5.17/dist/hls.min.js";
const BASE_OPACITY = 0.86;
const FADE_MS = 1800;
const FADE_OUT_LEAD = 1.2;
const PARALLAX_FACTOR = 0.035;
const VIDEO_CLASS_NAME =
  "absolute inset-0 h-full w-full scale-[1.4] object-cover saturate-[0.94] sm:scale-[1.24] lg:translate-x-[10%] lg:scale-[1.1]";

type HlsInstance = {
  loadSource: (src: string) => void;
  attachMedia: (media: HTMLVideoElement) => void;
  on: (event: string, handler: () => void) => void;
  off: (event: string, handler: () => void) => void;
  destroy: () => void;
};

type HlsConstructor = {
  new (): HlsInstance;
  isSupported: () => boolean;
  Events?: {
    MANIFEST_PARSED: string;
  };
};

declare global {
  interface Window {
    Hls?: HlsConstructor;
  }
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const getOpacity = (video: HTMLVideoElement) => {
  const parsed = Number.parseFloat(video.style.opacity || "");
  return Number.isFinite(parsed) ? parsed : 0;
};

const setOpacity = (video: HTMLVideoElement, value: number) => {
  video.style.opacity = String(clamp(value, 0, BASE_OPACITY));
};

const joinClasses = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(" ");

const getOverlayConfig = (mode: SharedFlowerBackgroundMode, dimmed: boolean) => {
  if (mode === "atelier") {
    return {
      glowOne: dimmed ? "bg-white/[0.04] blur-[120px]" : "bg-white/[0.06] blur-[132px]",
      glowTwo: dimmed ? "bg-white/[0.05] blur-[150px]" : "bg-white/[0.07] blur-[162px]",
      glowThree: dimmed ? "bg-white/[0.025] blur-[150px]" : "bg-white/[0.035] blur-[160px]",
      radial: dimmed
        ? "bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.05),transparent_22%)]"
        : "bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.07),transparent_24%)]",
      wash: dimmed ? "bg-black/52 sm:bg-black/46" : "bg-black/42 sm:bg-black/36",
      lateral:
        "bg-gradient-to-r from-black via-black/88 to-black/48 sm:w-[84%] lg:w-[68%]",
      bottom: "bg-gradient-to-t from-[#050505] via-[#050505]/90 to-transparent",
    };
  }

  if (dimmed) {
    return {
      glowOne: "bg-white/[0.05] blur-[126px]",
      glowTwo: "bg-white/[0.07] blur-[162px]",
      glowThree: "bg-white/[0.03] blur-[158px]",
      radial:
        "bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.06),transparent_22%)]",
      wash: "bg-black/44 sm:bg-black/38",
      lateral:
        "bg-gradient-to-r from-black via-black/84 to-transparent sm:w-[80%] lg:w-[62%]",
      bottom: "bg-gradient-to-t from-[#050505] via-[#050505]/88 to-transparent",
    };
  }

  return {
    glowOne: "bg-white/8 blur-[140px]",
    glowTwo: "bg-white/10 blur-[180px]",
    glowThree: "bg-white/[0.05] blur-[170px]",
    radial: "bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_24%)]",
    wash: "bg-black/34 sm:bg-black/28",
    lateral: "bg-gradient-to-r from-black via-black/78 to-transparent sm:w-[78%] lg:w-[58%]",
    bottom: "bg-gradient-to-t from-[#050505] via-[#050505]/84 to-transparent",
  };
};

export default function SharedFlowerBackground({
  mode,
  dimmed = false,
  className,
}: SharedFlowerBackgroundProps) {
  const videoARef = useRef<HTMLVideoElement>(null);
  const videoBRef = useRef<HTMLVideoElement>(null);
  const parallaxRef = useRef<HTMLDivElement>(null);
  const overlayConfig = getOverlayConfig(mode, dimmed);

  useEffect(() => {
    const videos = [videoARef.current, videoBRef.current].filter(
      (video): video is HTMLVideoElement => Boolean(video),
    );
    const parallaxLayer = parallaxRef.current;

    if (videos.length !== 2 || !parallaxLayer) return;

    let cancelled = false;
    let activeIndex = 0;
    let isCrossfading = false;
    let crossfadeRaf = 0;
    let parallaxRaf = 0;
    let currentParallax = 0;
    let targetParallax = 0;
    let hlsLoadCleanup: (() => void) | null = null;

    const hlsInstances: HlsInstance[] = [];
    const videoCleanups: Array<() => void> = [];

    const tryPlay = async (video: HTMLVideoElement) => {
      try {
        await video.play();
      } catch {
        // Ignore autoplay rejection; poster fallback is acceptable.
      }
    };

    const animateOpacity = (
      fromVideo: HTMLVideoElement,
      toVideo: HTMLVideoElement,
      duration: number,
      onComplete: () => void,
    ) => {
      cancelAnimationFrame(crossfadeRaf);

      const start = performance.now();
      const fromStart = getOpacity(fromVideo);
      const toStart = getOpacity(toVideo);

      const tick = (now: number) => {
        const progress = clamp((now - start) / duration, 0, 1);
        const eased = 1 - (1 - progress) * (1 - progress);

        setOpacity(fromVideo, fromStart + (0 - fromStart) * eased);
        setOpacity(toVideo, toStart + (BASE_OPACITY - toStart) * eased);

        if (progress < 1) {
          crossfadeRaf = requestAnimationFrame(tick);
          return;
        }

        onComplete();
      };

      crossfadeRaf = requestAnimationFrame(tick);
    };

    const crossfadeTo = (nextIndex: number) => {
      if (isCrossfading || nextIndex === activeIndex) return;

      const currentVideo = videos[activeIndex];
      const nextVideo = videos[nextIndex];

      if (!currentVideo.duration || !Number.isFinite(currentVideo.duration)) return;

      isCrossfading = true;

      try {
        nextVideo.currentTime = 0;
      } catch {
        // Ignore seek issues until metadata is ready.
      }

      setOpacity(nextVideo, 0);
      void tryPlay(nextVideo);

      animateOpacity(currentVideo, nextVideo, FADE_MS, () => {
        currentVideo.pause();
        try {
          currentVideo.currentTime = 0;
        } catch {
          // Ignore reset timing issues during handoff.
        }

        setOpacity(currentVideo, 0);
        setOpacity(nextVideo, BASE_OPACITY);
        activeIndex = nextIndex;
        isCrossfading = false;
      });
    };

    const onVideoTimeUpdate = (videoIndex: number) => {
      if (videoIndex !== activeIndex || isCrossfading) return;

      const video = videos[videoIndex];
      const remaining = video.duration - video.currentTime;

      if (remaining <= FADE_OUT_LEAD && remaining > 0) {
        crossfadeTo(videoIndex === 0 ? 1 : 0);
      }
    };

    const onVideoEnded = (videoIndex: number) => {
      if (videoIndex !== activeIndex || isCrossfading) return;

      crossfadeTo(videoIndex === 0 ? 1 : 0);
    };

    const configureVideo = (video: HTMLVideoElement, index: number) => {
      video.muted = true;
      video.playsInline = true;
      video.preload = "auto";
      video.poster = FLOWER_VIDEO_POSTER;
      video.removeAttribute("loop");
      setOpacity(video, index === 0 ? BASE_OPACITY : 0);

      const handleTimeUpdate = () => onVideoTimeUpdate(index);
      const handleEnded = () => onVideoEnded(index);

      video.addEventListener("timeupdate", handleTimeUpdate);
      video.addEventListener("ended", handleEnded);

      videoCleanups.push(() => {
        video.removeEventListener("timeupdate", handleTimeUpdate);
        video.removeEventListener("ended", handleEnded);
      });
    };

    videos.forEach(configureVideo);

    const attachNativeSource = (video: HTMLVideoElement) => {
      video.src = FLOWER_VIDEO_SRC;
      video.load();
    };

    const attachHlsSource = (video: HTMLVideoElement, Hls: HlsConstructor) => {
      const instance = new Hls();
      instance.loadSource(FLOWER_VIDEO_SRC);
      instance.attachMedia(video);
      hlsInstances.push(instance);
    };

    const loadHlsConstructor = async (): Promise<HlsConstructor | null> => {
      if (window.Hls) return window.Hls;

      await new Promise<void>((resolve) => {
        const existingScript = document.querySelector<HTMLScriptElement>(
          `script[src="${HLS_SCRIPT_SRC}"]`,
        );

        if (existingScript) {
          const handleLoad = () => resolve();
          existingScript.addEventListener("load", handleLoad, { once: true });
          hlsLoadCleanup = () =>
            existingScript.removeEventListener("load", handleLoad);
          return;
        }

        const script = document.createElement("script");
        script.src = HLS_SCRIPT_SRC;
        script.async = true;
        script.addEventListener("load", () => resolve(), { once: true });
        document.head.appendChild(script);
      });

      return window.Hls ?? null;
    };

    const setupStreams = async () => {
      if (videos[0].canPlayType("application/vnd.apple.mpegurl")) {
        videos.forEach(attachNativeSource);
        await Promise.all(videos.map((video) => tryPlay(video)));
        videos[1].pause();
        return;
      }

      const Hls = await loadHlsConstructor();
      if (cancelled || !Hls?.isSupported()) return;

      videos.forEach((video) => attachHlsSource(video, Hls));

      const manifestParsedEvent = Hls.Events?.MANIFEST_PARSED;
      if (!manifestParsedEvent) {
        await Promise.all(videos.map((video) => tryPlay(video)));
        videos[1].pause();
        return;
      }

      let parsedCount = 0;

      hlsInstances.forEach((instance, index) => {
        const handleManifestParsed = () => {
          parsedCount += 1;

          if (parsedCount === hlsInstances.length) {
            void Promise.all(videos.map((video) => tryPlay(video))).then(() => {
              videos[1].pause();
            });
          }

          instance.off(manifestParsedEvent, handleManifestParsed);
        };

        instance.on(manifestParsedEvent, handleManifestParsed);

        if (index === 1) {
          setOpacity(videos[1], 0);
        }
      });
    };

    const updateParallax = () => {
      currentParallax += (targetParallax - currentParallax) * 0.12;
      parallaxLayer.style.transform = `translate3d(0, ${currentParallax}px, 0)`;

      if (Math.abs(targetParallax - currentParallax) > 0.1) {
        parallaxRaf = requestAnimationFrame(updateParallax);
      } else {
        currentParallax = targetParallax;
        parallaxLayer.style.transform = `translate3d(0, ${currentParallax}px, 0)`;
        parallaxRaf = 0;
      }
    };

    const handleScroll = () => {
      targetParallax = window.scrollY * PARALLAX_FACTOR;

      if (!parallaxRaf) {
        parallaxRaf = requestAnimationFrame(updateParallax);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    void setupStreams();

    return () => {
      cancelled = true;
      window.removeEventListener("scroll", handleScroll);
      hlsLoadCleanup?.();
      videoCleanups.forEach((cleanup) => cleanup());
      hlsInstances.forEach((instance) => instance.destroy());
      cancelAnimationFrame(crossfadeRaf);
      cancelAnimationFrame(parallaxRaf);

      videos.forEach((video) => {
        video.pause();
        video.removeAttribute("src");
        video.load();
      });
    };
  }, []);

  return (
    <div
      className={joinClasses(
        "pointer-events-none fixed inset-0 z-0 overflow-hidden bg-black",
        className,
      )}
    >
      <div ref={parallaxRef} className="absolute inset-0 will-change-transform">
        <video
          ref={videoARef}
          autoPlay
          muted
          playsInline
          preload="auto"
          poster={FLOWER_VIDEO_POSTER}
          className={VIDEO_CLASS_NAME}
          aria-hidden="true"
        />
        <video
          ref={videoBRef}
          autoPlay
          muted
          playsInline
          preload="auto"
          poster={FLOWER_VIDEO_POSTER}
          className={VIDEO_CLASS_NAME}
          aria-hidden="true"
        />
      </div>

      <div className="absolute inset-0">
        <div
          className={joinClasses(
            "absolute left-[6%] top-[10%] h-56 w-56 rounded-full animate-glow-drift",
            overlayConfig.glowOne,
          )}
        />
        <div
          className={joinClasses(
            "absolute right-[10%] top-[6%] h-72 w-72 rounded-full animate-glow-drift",
            overlayConfig.glowTwo,
          )}
        />
        <div
          className={joinClasses(
            "absolute bottom-[16%] left-[34%] h-64 w-64 rounded-full animate-glow-drift",
            overlayConfig.glowThree,
          )}
        />
        <div className={joinClasses("absolute inset-0", overlayConfig.radial)} />
        <div className={joinClasses("absolute inset-0", overlayConfig.wash)} />
        <div
          className={joinClasses(
            "absolute inset-y-0 left-0 w-full",
            overlayConfig.lateral,
          )}
        />
        <div
          className={joinClasses(
            "absolute inset-x-0 bottom-0 h-40",
            overlayConfig.bottom,
          )}
        />
      </div>
    </div>
  );
}
