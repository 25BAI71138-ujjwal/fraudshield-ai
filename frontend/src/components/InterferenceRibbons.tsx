import React, { useEffect, useRef } from 'react';

export interface InterferenceRibbonsProps {
  className?: string;
  wireCount?: number;
  speed?: number;
  twistFactor?: number;
  amplitude?: number;
  frequency?: number;
  baseColor?: string; // e.g. Synapse violet / cyan
  opacity?: number;
  interactive?: boolean;
}

/**
 * Interference Ribbons Component
 * "A ribbon of fine glowing wires drifting and twisting"
 *
 * Implements a procedural parametric bundle of fine strands with harmonic
 * phase interference, 3D twisting, and additive glowing wire aesthetics.
 */
export const InterferenceRibbons: React.FC<InterferenceRibbonsProps> = ({
  className = '',
  wireCount = 38,
  speed = 0.0008,
  twistFactor = 3.2,
  amplitude = 110,
  frequency = 0.0022,
  opacity = 0.65,
  interactive = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animId: number;
    let width = 0;
    let height = 0;
    let dpr = 1;

    // Mouse tracking for subtle interference ripple
    let targetMouseX = 0;
    let targetMouseY = 0;
    let currentMouseX = 0;
    let currentMouseY = 0;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Initialize mouse in center
      if (targetMouseX === 0 && targetMouseY === 0) {
        targetMouseX = width * 0.5;
        targetMouseY = height * 0.5;
        currentMouseX = targetMouseX;
        currentMouseY = targetMouseY;
      }
    };

    const handlePointerMove = (e: PointerEvent) => {
      targetMouseX = e.clientX;
      targetMouseY = e.clientY;
    };

    window.addEventListener('resize', resize, { passive: true });
    if (interactive) {
      window.addEventListener('pointermove', handlePointerMove, { passive: true });
    }
    resize();

    let time = 0;

    const render = () => {
      time += 1;
      const t = time * speed;

      // Smooth mouse interpolation
      currentMouseX += (targetMouseX - currentMouseX) * 0.035;
      currentMouseY += (targetMouseY - currentMouseY) * 0.035;

      const normMouseX = (currentMouseX / (width || 1) - 0.5) * 2;
      const normMouseY = (currentMouseY / (height || 1) - 0.5) * 2;

      ctx.clearRect(0, 0, width, height);

      // Additive screen blend mode for luminous wire interference
      ctx.save();
      ctx.globalCompositeOperation = 'screen';

      const segments = Math.max(64, Math.floor(width / 16));
      const stepX = width / segments;

      // Ribbon Centerline & Normal vectors
      for (let w = 0; w < wireCount; w++) {
        // Strand parametric offset within ribbon bundle
        const wireNorm = (w / (wireCount - 1) - 0.5) * 2; // -1 to +1
        const wirePhase = w * 0.12;

        ctx.beginPath();
        ctx.lineWidth = 0.95;

        // Color gradient from Synapse Violet to Neon Cyan with white nodes
        const hue = 265 + (w / wireCount) * 45; // 265 (violet) to 310 (electric purple)
        const isAccent = w % 6 === 0;
        const strokeAlpha = (0.28 + Math.sin(t * 1.5 + wirePhase) * 0.12) * opacity;

        if (isAccent) {
          ctx.strokeStyle = `rgba(139, 243, 230, ${strokeAlpha * 1.3})`; // Cyan highlight wire
        } else {
          ctx.strokeStyle = `hsla(${hue}, 88%, 68%, ${strokeAlpha})`;
        }

        let started = false;

        for (let i = 0; i <= segments; i++) {
          const x = i * stepX;
          const s = x / (width || 1); // 0 to 1 along screen width

          // Primary undulating centerline wave
          const wave1 = Math.sin(x * frequency + t * 1.8) * amplitude;
          const wave2 = Math.cos(x * (frequency * 1.6) - t * 1.2) * (amplitude * 0.55);
          const mouseDeflection = Math.sin(s * Math.PI) * (normMouseY * 70);

          const centerY = height * 0.5 + wave1 + wave2 + mouseDeflection;

          // 3D Ribbon Twist Angle along length
          const twistAngle = s * Math.PI * twistFactor + t * 1.4 + (normMouseX * 0.6);

          // Ribbon cross-section radius
          const ribbonRadius = (65 + Math.sin(s * Math.PI * 2 + t * 0.8) * 35);

          // Strand position rotated around ribbon core
          const strandOffset = wireNorm * ribbonRadius;
          const offsetY = Math.sin(twistAngle + wirePhase * 0.4) * strandOffset;
          const offsetX = Math.cos(twistAngle + wirePhase * 0.4) * (strandOffset * 0.35);

          const px = x + offsetX;
          const py = centerY + offsetY;

          if (!started) {
            ctx.moveTo(px, py);
            started = true;
          } else {
            ctx.lineTo(px, py);
          }
        }

        ctx.stroke();
      }

      // Secondary ambient ribbon drifting below for harmonic depth
      for (let w = 0; w < Math.floor(wireCount * 0.45); w++) {
        const wireNorm = (w / (wireCount * 0.45 - 1) - 0.5) * 2;
        const wirePhase = w * 0.22;

        ctx.beginPath();
        ctx.lineWidth = 0.75;
        const strokeAlpha = 0.18 * opacity;
        ctx.strokeStyle = `rgba(139, 92, 246, ${strokeAlpha})`;

        let started = false;
        for (let i = 0; i <= segments; i++) {
          const x = i * stepX;
          const s = x / (width || 1);

          const wave = Math.sin(x * (frequency * 0.85) - t * 0.9 + wirePhase) * (amplitude * 0.75);
          const centerY = height * 0.68 + wave;

          const twistAngle = s * Math.PI * 2.4 - t * 0.8;
          const strandOffset = wireNorm * 45;
          const py = centerY + Math.sin(twistAngle) * strandOffset;
          const px = x + Math.cos(twistAngle) * (strandOffset * 0.25);

          if (!started) {
            ctx.moveTo(px, py);
            started = true;
          } else {
            ctx.lineTo(px, py);
          }
        }
        ctx.stroke();
      }

      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      if (interactive) {
        window.removeEventListener('pointermove', handlePointerMove);
      }
    };
  }, [wireCount, speed, twistFactor, amplitude, frequency, opacity, interactive]);

  return (
    <div
      className={`pointer-events-none fixed inset-0 z-0 overflow-hidden select-none ${className}`}
      aria-hidden="true"
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full block pointer-events-none"
      />
    </div>
  );
};

export default InterferenceRibbons;
