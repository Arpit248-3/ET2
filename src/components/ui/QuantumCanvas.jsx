import React, { useEffect, useRef } from 'react';

export default function QuantumCanvas({ accentColor = '#00e5ff' }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Particles for kinetic flow
    const particleCount = 45;
    const particles = Array.from({ length: particleCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2 + 1,
      speedY: Math.random() * 0.4 + 0.1,
      speedX: (Math.random() - 0.5) * 0.2,
      opacity: Math.random() * 0.5 + 0.2,
    }));

    let angle = 0;

    const render = () => {
      angle += 0.005;
      ctx.fillStyle = '#020712';
      ctx.fillRect(0, 0, width, height);

      // ── 1. Perspective Radial Grid Overlay ──────────────────────────────
      const cx = width / 2;
      const cy = height / 2;

      ctx.save();
      ctx.strokeStyle = 'rgba(0, 229, 255, 0.05)';
      ctx.lineWidth = 1;

      // Draw concentric orbital radar rings
      for (let r = 80; r < Math.max(width, height); r += 90) {
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Draw rotating radar scan arc
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, Math.max(width, height) * 0.8, angle, angle + 0.4);
      ctx.lineTo(cx, cy);
      const scanGrad = ctx.createRadialGradient(cx, cy, 10, cx, cy, Math.max(width, height) * 0.8);
      scanGrad.addColorStop(0, 'rgba(0, 229, 255, 0.12)');
      scanGrad.addColorStop(1, 'rgba(0, 229, 255, 0)');
      ctx.fillStyle = scanGrad;
      ctx.fill();

      // Perspective grid lines
      const gridGap = 60;
      for (let x = 0; x < width; x += gridGap) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.strokeStyle = 'rgba(29, 140, 255, 0.03)';
        ctx.stroke();
      }

      for (let y = 0; y < height; y += gridGap) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.strokeStyle = 'rgba(29, 140, 255, 0.03)';
        ctx.stroke();
      }
      ctx.restore();

      // ── 2. Floating Kinetic Data Particles ─────────────────────────────
      particles.forEach((p) => {
        p.y -= p.speedY;
        p.x += p.speedX;

        if (p.y < 0) {
          p.y = height;
          p.x = Math.random() * width;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 229, 255, ${p.opacity})`;
        ctx.shadowColor = accentColor;
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // ── 3. Ambient Center Depth Glow ────────────────────────────────────
      const depthGlow = ctx.createRadialGradient(cx, cy, 50, cx, cy, Math.max(width, height) * 0.5);
      depthGlow.addColorStop(0, 'rgba(13, 29, 56, 0.4)');
      depthGlow.addColorStop(0.7, 'rgba(4, 10, 22, 0.8)');
      depthGlow.addColorStop(1, 'rgba(2, 7, 18, 0.98)');
      ctx.fillStyle = depthGlow;
      ctx.fillRect(0, 0, width, height);

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [accentColor]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  );
}
