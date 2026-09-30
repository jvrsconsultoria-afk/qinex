"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/animation";
import { createScrollFrames } from "@/lib/scroll-frames";

type ScrollVideoProps = {
  src: string;
  poster: string;
  width: number;
  height: number;
  frames: { directory: string; count: number; width: number; height: number };
};

export default function ScrollVideo({ src, poster, width, height, frames }: ScrollVideoProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { directory, count, width: frameWidth, height: frameHeight } = frames;

  useEffect(() => {
    const video = videoRef.current;
    const root = rootRef.current;
    const canvas = canvasRef.current;
    if (!video || !root || !canvas) return;

    const media = gsap.matchMedia();
    media.add({
      reduceMotion: "(prefers-reduced-motion: reduce)",
      compact: "(max-width: 760px)",
      touch: "(pointer: coarse)",
      desktop: "(min-width: 761px) and (pointer: fine)",
    }, context => {
      if (context.conditions?.reduceMotion) return;

      if (context.conditions?.compact || context.conditions?.touch) {
        const sequence = createScrollFrames(canvas, { directory, count, width: frameWidth, height: frameHeight });
        if (!sequence) return;
        root.dataset.renderer = "frames";
        const playhead = { progress: 0 };
        const animation = gsap.to(playhead, {
          progress: 1,
          ease: "none",
          onUpdate: () => sequence.render(playhead.progress),
          scrollTrigger: {
            trigger: root,
            start: "top 85%",
            end: "bottom 20%",
            scrub: 0.2,
            onRefresh: () => sequence.render(playhead.progress),
          },
        });
        sequence.render(playhead.progress);
        return () => {
          animation.scrollTrigger?.kill();
          animation.kill();
          sequence.dispose();
          delete root.dataset.renderer;
        };
      }

      root.dataset.renderer = "video";
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
      video.src = src;
      video.load();
      initialize();

      return () => {
        video.removeEventListener("loadedmetadata", initialize);
        video.removeEventListener("loadeddata", initialize);
        video.removeEventListener("seeked", requestFrame);
        window.cancelAnimationFrame(frameRequest);
        animation?.scrollTrigger?.kill();
        animation?.kill();
        video.pause();
        video.removeAttribute("src");
        video.load();
        delete root.dataset.renderer;
      };
    });

    return () => media.revert();
  }, [src, directory, count, frameWidth, frameHeight]);

  return <div className="scroll-video" ref={rootRef} aria-hidden="true">
    <video ref={videoRef} poster={poster} width={width} height={height} muted playsInline preload="auto" />
    <canvas className="scroll-video-frames" ref={canvasRef} width={frameWidth} height={frameHeight} />
  </div>;
}
