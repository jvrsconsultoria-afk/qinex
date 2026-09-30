"use client";

import { useEffect, useRef } from "react";
import Lenis from "lenis";
import { gsap, ScrollTrigger } from "@/lib/animation";

export default function SmoothScroll({ locked = false }: { locked?: boolean }) {
  const instanceRef = useRef<Lenis | null>(null);

  useEffect(() => {
    const lenis = new Lenis({
      lerp: 0.075,
      wheelMultiplier: 0.85,
      smoothWheel: true,
      syncTouch: false,
      respectReducedMotion: true,
      anchors: { force: true },
      prevent: node => node.closest("[data-lenis-prevent]") !== null,
    });
    instanceRef.current = lenis;
    const tick = (time: number) => lenis.raf(time * 1000);
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(tick);

    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
      instanceRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (locked) instanceRef.current?.stop();
    else instanceRef.current?.start();
  }, [locked]);

  return null;
}
