"use client";

import { Children, createElement, isValidElement, useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { gsap, GSAPSplitText, useGSAP } from "@/lib/animation";
import { useFontsReady } from "@/hooks/use-fonts-ready";

const DEFAULT_FROM: gsap.TweenVars = { opacity: 0, y: 40 };
const DEFAULT_TO: gsap.TweenVars = { opacity: 1, y: 0 };

function plainText(children: ReactNode): string {
  return Children.toArray(children).map(child => {
    if (typeof child === "string" || typeof child === "number") return String(child);
    if (isValidElement<{ children?: ReactNode }>(child)) {
      return child.type === "br" ? " " : plainText(child.props.children);
    }
    return "";
  }).join("");
}

type SplitTextProps = {
  text?: string;
  children?: ReactNode;
  id?: string;
  tag?: "h1" | "h2" | "h3" | "p" | "span";
  className?: string;
  delay?: number;
  duration?: number;
  ease?: string;
  splitType?: "chars" | "words" | "lines" | "words,chars" | "lines,words" | "lines,words,chars";
  from?: gsap.TweenVars;
  to?: gsap.TweenVars;
  threshold?: number;
  rootMargin?: string;
  textAlign?: CSSProperties["textAlign"];
  onLetterAnimationComplete?: () => void;
  showCallback?: boolean;
};

export default function SplitText({
  text, children, id, tag = "p", className = "", delay = 50, duration = 1.25,
  ease = "power3.out", splitType = "chars", from = DEFAULT_FROM, to = DEFAULT_TO,
  threshold = 0.1, rootMargin = "-100px", textAlign = "center", onLetterAnimationComplete,
}: SplitTextProps) {
  const rootRef = useRef<HTMLElement>(null);
  const completed = useRef(false);
  const onCompleteRef = useRef(onLetterAnimationComplete);
  const fontsReady = useFontsReady();

  useEffect(() => { onCompleteRef.current = onLetterAnimationComplete; }, [onLetterAnimationComplete]);

  useGSAP(() => {
    if (!fontsReady || !rootRef.current) return;
    const media = gsap.matchMedia();
    media.add("(prefers-reduced-motion: no-preference)", () => {
      const root = rootRef.current!;
      const split = GSAPSplitText.create(root, {
        type: splitType,
        tag: "span",
        autoSplit: true,
        aria: "none",
        linesClass: "split-line",
        wordsClass: "split-word",
        charsClass: "split-char",
        onSplit(self) {
          const gradients = root.matches(".gradient-text") ? [root] : [...root.querySelectorAll<HTMLElement>(".gradient-text")];
          gradients.forEach(gradient => {
            const bounds = gradient.getBoundingClientRect();
            gradient.querySelectorAll<HTMLElement>(".split-char").forEach(char => {
              const position = char.getBoundingClientRect();
              char.style.backgroundSize = `${bounds.width}px ${bounds.height}px`;
              char.style.backgroundPosition = `${bounds.left - position.left}px ${bounds.top - position.top}px`;
            });
          });
          [...self.lines, ...self.words, ...self.chars].forEach(part => part.setAttribute("aria-hidden", "true"));
          const targets = splitType.includes("chars") ? self.chars : splitType.includes("words") ? self.words : self.lines;
          if (completed.current) return gsap.set(targets, to);
          return gsap.fromTo(targets, from, {
            ...to, duration, stagger: delay / 1000, ease,
            scrollTrigger: {
              trigger: root,
              start: () => {
                const margin = /^(-?\d+(?:\.\d+)?)(px|%)?$/.exec(rootMargin.trim().split(/\s+/)[0]);
                const amount = margin ? Number(margin[1]) : 0;
                const pixels = margin?.[2] === "%" ? window.innerHeight * amount / 100 : amount;
                return `top ${window.innerHeight * (1 - Math.min(1, Math.max(0, threshold))) + pixels}px`;
              },
              once: true,
            },
            onComplete: () => {
              completed.current = true;
              onCompleteRef.current?.();
            },
          });
        },
      });
      return () => split.revert();
    });
    return () => media.revert();
  }, { scope: rootRef, dependencies: [fontsReady, text, delay, duration, ease, splitType, from, to, threshold, rootMargin], revertOnUpdate: true });

  const content = children ?? text;
  return createElement(tag, {
    ref: rootRef, id, className: `split-text ${className}`.trim(),
    "aria-label": plainText(content),
    style: { textAlign },
  }, content);
}
