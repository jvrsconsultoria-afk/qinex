"use client";

import { useEffect, useId, useRef, useState } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/animation";
import { useFontsReady } from "@/hooks/use-fonts-ready";

type Box = { x: number; y: number; width: number; height: number };
type StrokeTextProps = {
  text: string;
  className?: string;
  strokeColor?: string;
  fillColor?: string;
  strokeWidth?: number;
  drawDuration?: number;
  fillDelay?: number;
  stagger?: number;
  fontSize?: number;
  fontWeight?: number;
  letterSpacing?: number;
  trigger?: "mount" | "scroll";
  fillGradient?: boolean;
};

export default function StrokeText({
  text, className = "", strokeColor = "#a58bff", fillColor = "#f0edff",
  strokeWidth = 1.4, drawDuration = 1.6, fillDelay = 0.2, stagger = 0.05,
  fontSize = 96, fontWeight = 500, letterSpacing = -5,
  trigger = "mount", fillGradient = false,
}: StrokeTextProps) {
  const rootRef = useRef<HTMLSpanElement>(null);
  const textRef = useRef<SVGTextElement>(null);
  const wipeRef = useRef<SVGRectElement>(null);
  const [box, setBox] = useState<Box | null>(null);
  const fontsReady = useFontsReady();
  const wipeId = `stroke-wipe-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const gradientId = `${wipeId}-gradient`;
  const chars = Array.from(text);
  const fontStyle = { fontSize: `${fontSize}px`, fontWeight, letterSpacing: `${letterSpacing}px` };

  useEffect(() => {
    if (!fontsReady || !textRef.current) return;
    const bounds = textRef.current.getBBox();
    if (!bounds.width) return;
    const pad = Math.max(strokeWidth * 2, fontSize * 0.025);
    setBox({ x: bounds.x - pad, y: bounds.y - pad, width: bounds.width + pad * 2, height: bounds.height + pad * 2 });
  }, [fontsReady, text, fontSize, fontWeight, letterSpacing, strokeWidth]);

  useGSAP(() => {
    if (!rootRef.current || !box) return;
    const media = gsap.matchMedia();
    const strokes = rootRef.current.querySelectorAll("[data-stroke-char]");
    const dash = Math.max(fontSize * 7, 200);
    media.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.set(strokes, { strokeDasharray: dash, strokeDashoffset: dash });
      gsap.set(wipeRef.current, { attr: { width: 0 } });
      const timeline = gsap.timeline({ paused: true });
      timeline.to(strokes, { strokeDashoffset: 0, duration: drawDuration, stagger, ease: "power2.out" }, 0);
      timeline.to(wipeRef.current, { attr: { width: box.width }, duration: Math.max(0.4, drawDuration * 0.5), ease: "power2.inOut" }, drawDuration + fillDelay);
      const scrollTrigger = trigger === "scroll" ? ScrollTrigger.create({ trigger: rootRef.current, start: "top 85%", once: true, onEnter: () => timeline.play() }) : undefined;
      if (trigger === "mount") timeline.play();
      return () => { scrollTrigger?.kill(); timeline.kill(); };
    });
    media.add("(prefers-reduced-motion: reduce)", () => {
      gsap.set(strokes, { strokeDasharray: dash, strokeDashoffset: 0 });
      gsap.set(wipeRef.current, { attr: { width: box.width } });
    });
    return () => media.revert();
  }, { scope: rootRef, dependencies: [box, fontSize, drawDuration, fillDelay, stagger, trigger], revertOnUpdate: true });

  const fallback: Box = { x: -10, y: -fontSize, width: fontSize * chars.length * 0.7, height: fontSize * 1.3 };
  const dimensions = box ?? fallback;
  return <span ref={rootRef} className={`stroke-text ${className}`.trim()} style={{ width: `${dimensions.width / fontSize}em`, height: `${dimensions.height / fontSize}em` }} role="img" aria-label={text}>
    <svg viewBox={`${dimensions.x} ${dimensions.y} ${dimensions.width} ${dimensions.height}`} className="stroke-text-svg" style={{ visibility: box ? "visible" : "hidden" }} aria-hidden="true">
      <defs>
        <clipPath id={wipeId} clipPathUnits="userSpaceOnUse"><rect ref={wipeRef} x={dimensions.x} y={dimensions.y} width="0" height={dimensions.height} /></clipPath>
        {fillGradient && <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="27%">
          <stop offset="0%" style={{ stopColor: "var(--brand-text-start)" }} />
          <stop offset="20%" style={{ stopColor: "var(--brand-text-cyan)" }} />
          <stop offset="44%" style={{ stopColor: "var(--brand-text-blue)" }} />
          <stop offset="72%" style={{ stopColor: "var(--brand-text-violet)" }} />
          <stop offset="100%" style={{ stopColor: "var(--brand-text-end)" }} />
        </linearGradient>}
      </defs>
      <text ref={textRef} x="0" y="0" fill="none" stroke={strokeColor} strokeWidth={strokeWidth} strokeLinejoin="round" strokeLinecap="round" style={fontStyle}>
        {chars.map((char, index) => <tspan data-stroke-char key={index}>{char}</tspan>)}
      </text>
      <text x="0" y="0" fill={fillGradient ? `url(#${gradientId})` : fillColor} style={fontStyle} clipPath={`url(#${wipeId})`}>
        {chars.map((char, index) => <tspan key={index}>{char}</tspan>)}
      </text>
    </svg>
  </span>;
}
