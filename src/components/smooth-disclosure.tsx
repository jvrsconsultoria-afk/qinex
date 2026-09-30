"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { gsap, ScrollTrigger } from "@/lib/animation";

export default function SmoothDisclosure({ className, summary, children }: {
  className: string;
  summary: ReactNode;
  children: ReactNode;
}) {
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const openIntent = useRef(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const content = contentRef.current;
    return () => { if (content) gsap.killTweensOf(content); };
  }, []);

  function toggle() {
    const details = detailsRef.current;
    const content = contentRef.current;
    if (!details || !content) return;
    const next = !openIntent.current;
    openIntent.current = next;
    setExpanded(next);
    const currentHeight = content.getBoundingClientRect().height;
    gsap.killTweensOf(content);

    if (next) {
      if (!details.open) gsap.set(content, { height: 0, opacity: 0 });
      details.open = true;
    } else {
      gsap.set(content, { height: currentHeight });
    }

    const complete = () => {
      if (next) gsap.set(content, { height: "auto" });
      else details.open = false;
      ScrollTrigger.refresh();
    };

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.set(content, { height: next ? "auto" : 0, opacity: next ? 1 : 0 });
      complete();
      return;
    }

    gsap.to(content, {
      height: next ? content.scrollHeight : 0,
      opacity: next ? 1 : 0,
      duration: next ? 0.38 : 0.28,
      ease: "power2.inOut",
      onComplete: complete,
    });
  }

  return <details ref={detailsRef} className={`smooth-disclosure ${className}`} data-expanded={expanded}>
    <summary aria-expanded={expanded} onClick={event => { event.preventDefault(); toggle(); }}>{summary}</summary>
    <div ref={contentRef} className="disclosure-content">{children}</div>
  </details>;
}
