"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import * as THREE from "three";

const MAX_COLORS = 8;
const DEFAULT_COLORS = ["#2453ff", "#8456ff", "#5bdcff"];

const vertexShader = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 1.0);
}
`;

const fragmentShader = `
#define MAX_COLORS ${MAX_COLORS}
uniform vec2 uCanvas;
uniform float uTime;
uniform float uSpeed;
uniform vec2 uRot;
uniform int uColorCount;
uniform vec3 uColors[MAX_COLORS];
uniform int uTransparent;
uniform float uScale;
uniform float uVerticalStretch;
uniform float uFrequency;
uniform float uWarpStrength;
uniform vec2 uPointer;
uniform float uMouseInfluence;
uniform float uParallax;
uniform float uNoise;
uniform int uIterations;
uniform float uIntensity;
uniform float uBandWidth;
varying vec2 vUv;

void main() {
  float t = uTime * uSpeed;
  vec2 p = vUv * 2.0 - 1.0;
  p += uPointer * uParallax * 0.1;
  vec2 rp = vec2(p.x * uRot.x - p.y * uRot.y, p.x * uRot.y + p.y * uRot.x);
  vec2 q = vec2(rp.x * (uCanvas.x / uCanvas.y), rp.y);
  q.y /= max(uVerticalStretch, 0.0001);
  q /= max(uScale, 0.0001);
  q /= 0.5 + 0.2 * dot(q, q);
  q += 0.2 * cos(t) - 7.56;
  q += (uPointer - rp) * uMouseInfluence * 0.2;

  for (int j = 0; j < 5; j++) {
    if (j >= uIterations - 1) break;
    vec2 rr = sin(1.5 * (q.yx * uFrequency) + 2.0 * cos(q * uFrequency));
    q += (rr - q) * 0.15;
  }

  vec3 col = vec3(0.0);
  float a = 1.0;
  if (uColorCount > 0) {
    vec2 s = q;
    vec3 sumCol = vec3(0.0);
    float cover = 0.0;
    for (int i = 0; i < MAX_COLORS; ++i) {
      if (i >= uColorCount) break;
      s -= 0.01;
      vec2 r = sin(1.5 * (s.yx * uFrequency) + 2.0 * cos(s * uFrequency));
      float m0 = length(r + sin(5.0 * r.y * uFrequency - 3.0 * t + float(i)) / 4.0);
      float kBelow = clamp(uWarpStrength, 0.0, 1.0);
      float kMix = pow(kBelow, 0.3);
      float gain = 1.0 + max(uWarpStrength - 1.0, 0.0);
      vec2 warped = s + (r - s) * kBelow * gain;
      float m1 = length(warped + sin(5.0 * warped.y * uFrequency - 3.0 * t + float(i)) / 4.0);
      float m = mix(m0, m1, kMix);
      float w = 1.0 - exp(-uBandWidth / exp(uBandWidth * m));
      sumCol += uColors[i] * w;
      cover = max(cover, w);
    }
    col = clamp(sumCol, 0.0, 1.0);
    a = uTransparent > 0 ? cover : 1.0;
  } else {
    vec2 s = q;
    for (int k = 0; k < 3; ++k) {
      s -= 0.01;
      vec2 r = sin(1.5 * (s.yx * uFrequency) + 2.0 * cos(s * uFrequency));
      float m0 = length(r + sin(5.0 * r.y * uFrequency - 3.0 * t + float(k)) / 4.0);
      float kBelow = clamp(uWarpStrength, 0.0, 1.0);
      float kMix = pow(kBelow, 0.3);
      float gain = 1.0 + max(uWarpStrength - 1.0, 0.0);
      vec2 warped = s + (r - s) * kBelow * gain;
      float m1 = length(warped + sin(5.0 * warped.y * uFrequency - 3.0 * t + float(k)) / 4.0);
      float m = mix(m0, m1, kMix);
      col[k] = 1.0 - exp(-uBandWidth / exp(uBandWidth * m));
    }
    a = uTransparent > 0 ? max(max(col.r, col.g), col.b) : 1.0;
  }

  col *= uIntensity;
  if (uNoise > 0.0001) {
    float n = fract(sin(dot(gl_FragCoord.xy + vec2(uTime), vec2(12.9898, 78.233))) * 43758.5453123);
    col = clamp(col + (n - 0.5) * uNoise, 0.0, 1.0);
  }
  gl_FragColor = vec4(uTransparent > 0 ? col * a : col, a);
}
`;

type ColorBendsProps = {
  className?: string;
  style?: CSSProperties;
  colors?: string[];
  rotation?: number;
  speed?: number;
  transparent?: boolean;
  autoRotate?: number;
  scale?: number;
  verticalStretch?: number;
  frequency?: number;
  warpStrength?: number;
  mouseInfluence?: number;
  parallax?: number;
  noise?: number;
  iterations?: number;
  intensity?: number;
  bandWidth?: number;
};

export default function ColorBends({
  className = "", style, colors = DEFAULT_COLORS, rotation = 90,
  speed = 0.2, transparent = true, autoRotate = 0, scale = 1, verticalStretch = 1,
  frequency = 1, warpStrength = 1, mouseInfluence = 1, parallax = 0.5,
  noise = 0.15, iterations = 1, intensity = 1.5, bandWidth = 6,
}: ColorBendsProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true, powerPreference: "low-power" });
    } catch {
      // The black hero remains usable when WebGL is unavailable.
      return;
    }

    const palette = colors.filter(color => /^#(?:[\da-f]{3}|[\da-f]{6})$/i.test(color)).slice(0, MAX_COLORS);
    const colorVectors = Array.from({ length: MAX_COLORS }, (_, index) => {
      const hex = palette[index]?.slice(1);
      if (!hex) return new THREE.Vector3();
      const expanded = hex.length === 3 ? [...hex].map(char => char + char).join("") : hex;
      return new THREE.Vector3(
        parseInt(expanded.slice(0, 2), 16) / 255,
        parseInt(expanded.slice(2, 4), 16) / 255,
        parseInt(expanded.slice(4, 6), 16) / 255,
      );
    });
    const uniforms = {
      uCanvas: { value: new THREE.Vector2(1, 1) },
      uTime: { value: 0 }, uSpeed: { value: speed },
      uRot: { value: new THREE.Vector2() },
      uColorCount: { value: palette.length }, uColors: { value: colorVectors },
      uTransparent: { value: transparent ? 1 : 0 }, uScale: { value: scale },
      uVerticalStretch: { value: verticalStretch },
      uFrequency: { value: frequency }, uWarpStrength: { value: warpStrength },
      uPointer: { value: new THREE.Vector2() }, uMouseInfluence: { value: mouseInfluence },
      uParallax: { value: parallax }, uNoise: { value: noise },
      uIterations: { value: iterations }, uIntensity: { value: intensity }, uBandWidth: { value: bandWidth },
    };
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const geometry = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.ShaderMaterial({ vertexShader, fragmentShader, uniforms, transparent: true, premultipliedAlpha: true });
    scene.add(new THREE.Mesh(geometry, material));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setClearColor(0x000000, transparent ? 0 : 1);
    container.appendChild(renderer.domElement);

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const pointerTarget = new THREE.Vector2();
    let animationFrame: number | null = null;
    let elapsed = 0;
    let lastFrame = 0;
    let inView = true;
    let contextLost = false;

    function draw() {
      const angle = THREE.MathUtils.degToRad(rotation + autoRotate * elapsed);
      uniforms.uTime.value = elapsed;
      uniforms.uRot.value.set(Math.cos(angle), Math.sin(angle));
      renderer.render(scene, camera);
    }

    function animate(now: number) {
      animationFrame = requestAnimationFrame(animate);
      if (now - lastFrame < 1000 / 30) return;
      const delta = Math.min((now - lastFrame) / 1000, 0.1);
      lastFrame = now;
      elapsed += delta;
      uniforms.uPointer.value.lerp(pointerTarget, Math.min(1, delta * 8));
      draw();
    }

    function updateAnimation() {
      if (animationFrame !== null) cancelAnimationFrame(animationFrame);
      animationFrame = null;
      if (contextLost || document.hidden || !inView) return;
      draw();
      if (!reducedMotion.matches) {
        lastFrame = performance.now();
        animationFrame = requestAnimationFrame(animate);
      }
    }

    function resize() {
      if (!container || contextLost) return;
      const width = container.clientWidth || 1;
      const height = container.clientHeight || 1;
      renderer.setSize(width, height, false);
      uniforms.uCanvas.value.set(width, height);
      draw();
    }

    // Listen on the hero so the decorative canvas never intercepts buttons.
    const pointerSurface = container.parentElement ?? container;
    function handlePointerMove(event: PointerEvent) {
      if (reducedMotion.matches) return;
      const rect = container!.getBoundingClientRect();
      pointerTarget.set(((event.clientX - rect.left) / rect.width) * 2 - 1, 1 - ((event.clientY - rect.top) / rect.height) * 2);
    }
    function resetPointer() { pointerTarget.set(0, 0); }
    function handleContextLost(event: Event) {
      event.preventDefault();
      contextLost = true;
      updateAnimation();
    }
    function handleContextRestored() {
      contextLost = false;
      resize();
      updateAnimation();
    }

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);
    const visibilityObserver = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      updateAnimation();
    });
    visibilityObserver.observe(container);
    document.addEventListener("visibilitychange", updateAnimation);
    reducedMotion.addEventListener("change", updateAnimation);
    pointerSurface.addEventListener("pointermove", handlePointerMove);
    pointerSurface.addEventListener("pointerleave", resetPointer);
    renderer.domElement.addEventListener("webglcontextlost", handleContextLost);
    renderer.domElement.addEventListener("webglcontextrestored", handleContextRestored);
    resize();
    updateAnimation();

    return () => {
      if (animationFrame !== null) cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
      visibilityObserver.disconnect();
      document.removeEventListener("visibilitychange", updateAnimation);
      reducedMotion.removeEventListener("change", updateAnimation);
      pointerSurface.removeEventListener("pointermove", handlePointerMove);
      pointerSurface.removeEventListener("pointerleave", resetPointer);
      renderer.domElement.removeEventListener("webglcontextlost", handleContextLost);
      renderer.domElement.removeEventListener("webglcontextrestored", handleContextRestored);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    };
  }, [colors, rotation, speed, transparent, autoRotate, scale, verticalStretch, frequency, warpStrength, mouseInfluence, parallax, noise, iterations, intensity, bandWidth]);

  return <div ref={containerRef} className={`color-bends-container ${className}`} style={style} aria-hidden="true" />;
}
