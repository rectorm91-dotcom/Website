'use client';

import { useEffect, useRef } from 'react';
import { SITE_CONFIG } from '../config';
import { advanceParticles, createParticles, drawConstellation, type Particle } from '../lib/constellation';

export function ConstellationBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d', { alpha: true });
    if (!canvas || !context) return;
    const options = SITE_CONFIG.constellation;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const finePointer = window.matchMedia('(pointer: fine)');
    let width = 0;
    let height = 0;
    let particles: Particle[] = [];
    let frame: number | null = null;
    let lastTime = 0;
    const target = { x: 0, y: 0, active: false };
    const cursor = { x: 0, y: 0, active: false };

    const draw = () => drawConstellation(context, particles, width, height, options);
    const tick = (time: number) => {
      if (document.hidden || reducedMotion.matches) { frame = null; return; }
      const elapsed = time - lastTime;
      if (elapsed >= 1000 / options.framesPerSecond) {
        const seconds = Math.min(elapsed / 1000, 0.05);
        lastTime = time;
        const ease = 1 - Math.exp(-seconds / 0.16);
        cursor.x += (target.x - cursor.x) * ease;
        cursor.y += (target.y - cursor.y) * ease;
        cursor.active = target.active;
        advanceParticles(particles, seconds, width, height, cursor, options);
        draw();
      }
      frame = window.requestAnimationFrame(tick);
    };
    const stop = () => {
      if (frame !== null) window.cancelAnimationFrame(frame);
      frame = null;
      target.active = false;
      cursor.active = false;
    };
    const syncMotion = () => {
      stop();
      if (document.hidden) return;
      draw();
      if (!reducedMotion.matches) {
        lastTime = performance.now();
        frame = window.requestAnimationFrame(tick);
      }
    };
    const resize = () => {
      const bounds = canvas.getBoundingClientRect();
      const nextWidth = Math.max(1, bounds.width);
      const nextHeight = Math.max(1, bounds.height);
      if (width === nextWidth && height === nextHeight) return;
      width = nextWidth;
      height = nextHeight;
      // Bound backing-store memory even on high-density/ultrawide displays.
      const scale = Math.min(window.devicePixelRatio || 1, 2, Math.sqrt(4_000_000 / (width * height)));
      canvas.width = Math.round(width * scale);
      canvas.height = Math.round(height * scale);
      context.setTransform(scale, 0, 0, scale, 0, 0);
      particles = createParticles(width, height, options, width <= 740 || !finePointer.matches);
      syncMotion();
    };
    const move = (event: PointerEvent) => {
      if (!finePointer.matches || reducedMotion.matches || document.hidden || event.pointerType === 'touch') return;
      if (!target.active) { cursor.x = event.clientX; cursor.y = event.clientY; }
      target.x = event.clientX;
      target.y = event.clientY;
      target.active = true;
    };
    const leave = () => { target.active = false; };
    const pointerOut = (event: PointerEvent) => { if (!event.relatedTarget) leave(); };
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();
    window.addEventListener('pointermove', move, { passive: true });
    window.addEventListener('pointerout', pointerOut, { passive: true });
    window.addEventListener('blur', leave);
    document.addEventListener('visibilitychange', syncMotion);
    reducedMotion.addEventListener('change', syncMotion);
    finePointer.addEventListener('change', leave);
    return () => {
      stop();
      observer.disconnect();
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerout', pointerOut);
      window.removeEventListener('blur', leave);
      document.removeEventListener('visibilitychange', syncMotion);
      reducedMotion.removeEventListener('change', syncMotion);
      finePointer.removeEventListener('change', leave);
    };
  }, []);

  return <div className="constellation-background" aria-hidden="true"><canvas ref={canvasRef} /></div>;
}
