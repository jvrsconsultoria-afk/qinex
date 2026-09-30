"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useSpring, useTransform, useMotionValue, useVelocity, useAnimationFrame, useReducedMotion, useInView, usePageInView } from "motion/react";

export default function ScrollVelocity({ text, velocity = 12 }: { text: string; velocity?: number }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const copyRef = useRef<HTMLSpanElement>(null);
  const [copyWidth, setCopyWidth] = useState(0);
  const baseX = useMotionValue(0);
  const { scrollY } = useScroll();
  const scrollVelocity = useVelocity(scrollY);
  const smoothVelocity = useSpring(scrollVelocity, { damping: 50, stiffness: 300 });
  const reducedMotion = useReducedMotion();
  const inView = useInView(rootRef, { margin: "100px" });
  const pageVisible = usePageInView();
  const direction = useRef(1);

  useEffect(() => {
    const copy = copyRef.current;
    if (!copy) return;
    const measure = () => setCopyWidth(copy.getBoundingClientRect().width);
    const observer = new ResizeObserver(measure);
    observer.observe(copy);
    measure();
    return () => observer.disconnect();
  }, []);

  const x = useTransform(baseX, value => {
    if (!copyWidth || reducedMotion) return "0px";
    const wrapped = ((value % copyWidth) + copyWidth) % copyWidth;
    return `${wrapped - copyWidth}px`;
  });

  useAnimationFrame((_time, delta) => {
    if (reducedMotion || !inView || !pageVisible) return;
    const factor = Math.max(-2, Math.min(2, smoothVelocity.get() / 700));
    if (factor < -0.03) direction.current = -1;
    else if (factor > 0.03) direction.current = 1;
    baseX.set(baseX.get() + direction.current * velocity * (Math.min(delta, 64) / 1000) * (1 + Math.abs(factor)));
  });

  return <div ref={rootRef} className="scroll-velocity" aria-hidden="true">
    <motion.div className="velocity-scroller" style={{ x }}>
      {Array.from({ length: 6 }, (_, index) => <span className="velocity-copy" ref={index === 0 ? copyRef : undefined} key={index}>{text}<span className="velocity-separator"> / </span></span>)}
    </motion.div>
  </div>;
}
