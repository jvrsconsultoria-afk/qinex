"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/animation";

type ScrollVideoProps = {
  src: string;
  poster: string;
  width: number;
  height: number;
};

export default function ScrollVideo({ src, poster, width, height }: ScrollVideoProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    const root = rootRef.current;
    if (!video || !root) return;

    const media = gsap.matchMedia();
    media.add("(prefers-reduced-motion: no-preference)", () => {
      const playhead = { time: 0 };
      let animation: gsap.core.Tween | undefined;
      let frameRequest = 0;
      let lastRequestedTime = -1;

      // Keep only the latest scroll position while the browser decodes a frame.
      const requestFrame = () => {
        if (frameRequest) return;
        frameRequest = window.requestAnimationFrame(() => {
          frameRequest = 0;
          if (video.readyState < 2 || video.seeking) return;
          const target = Math.max(0, Math.min(playhead.time, video.duration - 1 / 30));
          if (Math.abs(target - lastRequestedTime) < 1 / 60) return;
          lastRequestedTime = target;
          video.currentTime = target;
        });
      };

      const initialize = () => {
        if (!animation && Number.isFinite(video.duration) && video.duration > 0) {
          video.pause();
          animation = gsap.to(playhead, {
            time: Math.max(0, video.duration - 1 / 30),
            ease: "none",
            onUpdate: requestFrame,
            scrollTrigger: {
              trigger: root,
              start: "top 85%",
              end: "bottom 20%",
              scrub: 0.35,
              onRefresh: requestFrame,
            },
          });
        }
        requestFrame();
      };

      video.addEventListener("loadedmetadata", initialize);
      video.addEventListener("loadeddata", initialize);
      video.addEventListener("seeked", requestFrame);
      initialize();

      return () => {
        video.removeEventListener("loadedmetadata", initialize);
        video.removeEventListener("loadeddata", initialize);
        video.removeEventListener("seeked", requestFrame);
        window.cancelAnimationFrame(frameRequest);
        animation?.scrollTrigger?.kill();
        animation?.kill();
      };
    });

    return () => media.revert();
  }, [src]);

  return <div className="scroll-video" ref={rootRef} aria-hidden="true">
    <video ref={videoRef} src={src} poster={poster} width={width} height={height} muted playsInline preload="auto" />
  </div>;
}
