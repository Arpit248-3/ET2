/**
 * CyberGrid — Animated canvas background for auth pages.
 * Features: particle field, grid lines, radar sweep, network nodes, scanning beam.
 */
import React, { useEffect, useRef } from 'react';

export default function CyberGrid({ style = {} }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Particles
    const PARTICLE_COUNT = 60;
    const particles = Array.from({ length: PARTICLE_COUNT }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      r: Math.random() * 1.5 + 0.5,
      alpha: Math.random() * 0.6 + 0.2,
      color: Math.random() > 0.6 ? '#00e5ff' : '#1d8cff',
    }));

    // Network nodes (fixed points)
    const NODES = Array.from({ length: 12 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      pulse: Math.random() * Math.PI * 2,
    }));

    // Radar sweep
    let radarAngle = 0;

    // Scanning line
    let scanY = 0;
    let scanDir = 1;

    const GRID_SIZE = 60;
    const NEON_BLUE = '#1d8cff';
    const NEON_CYAN = '#00e5ff';

    function drawGrid(w, h) {
      ctx.strokeStyle = 'rgba(29, 140, 255, 0.06)';
      ctx.lineWidth = 0.5;
      for (let x = 0; x < w; x += GRID_SIZE) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
      }
      for (let y = 0; y < h; y += GRID_SIZE) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
      }
      // Intersection dots
      ctx.fillStyle = 'rgba(0, 229, 255, 0.12)';
      for (let x = 0; x < w; x += GRID_SIZE) {
        for (let y = 0; y < h; y += GRID_SIZE) {
          ctx.beginPath(); ctx.arc(x, y, 1.2, 0, Math.PI * 2); ctx.fill();
        }
      }
    }

    function drawParticles() {
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color + Math.round(p.alpha * 255).toString(16).padStart(2, '0');
        ctx.fill();
      });
    }

    function drawConnections() {
      const MAX_DIST = 120;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < MAX_DIST) {
            const alpha = (1 - d / MAX_DIST) * 0.15;
            ctx.strokeStyle = `rgba(29, 140, 255, ${alpha})`;
            ctx.lineWidth = 0.6;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }
    }

    function drawNodes(t) {
      NODES.forEach(node => {
        node.pulse += 0.04;
        const alpha = 0.4 + Math.sin(node.pulse) * 0.3;
        const r = 3 + Math.sin(node.pulse) * 1;
        // Outer ring
        ctx.strokeStyle = `rgba(0, 229, 255, ${alpha * 0.4})`;
        ctx.lineWidth = 0.8;
        ctx.beginPath(); ctx.arc(node.x, node.y, r * 3, 0, Math.PI * 2); ctx.stroke();
        // Inner dot
        ctx.fillStyle = `rgba(0, 229, 255, ${alpha})`;
        ctx.beginPath(); ctx.arc(node.x, node.y, r, 0, Math.PI * 2); ctx.fill();
      });
    }

    function drawScanLine(h) {
      scanY += 0.8 * scanDir;
      if (scanY > h) { scanY = h; scanDir = -1; }
      if (scanY < 0) { scanY = 0; scanDir = 1; }
      const grad = ctx.createLinearGradient(0, scanY - 40, 0, scanY + 2);
      grad.addColorStop(0, 'rgba(0, 229, 255, 0)');
      grad.addColorStop(1, 'rgba(0, 229, 255, 0.06)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, scanY - 40, canvas.width, 42);
      ctx.strokeStyle = 'rgba(0, 229, 255, 0.18)';
      ctx.lineWidth = 0.8;
      ctx.beginPath(); ctx.moveTo(0, scanY); ctx.lineTo(canvas.width, scanY); ctx.stroke();
    }

    function drawBinaryRain() {
      // Subtle binary digits floating
      const digits = ['0', '1'];
      ctx.font = '9px "JetBrains Mono", monospace';
      ctx.fillStyle = 'rgba(29, 140, 255, 0.06)';
      for (let i = 0; i < 8; i++) {
        const x = (i * 80 + 20) % canvas.width;
        const y = (Date.now() / 20 + i * 120) % canvas.height;
        ctx.fillText(digits[i % 2], x, y);
      }
    }

    let frameCount = 0;
    function animate() {
      frameCount++;
      const w = canvas.width, h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      drawGrid(w, h);
      drawBinaryRain();
      drawConnections();
      drawParticles();
      drawNodes(frameCount);
      drawScanLine(h);

      animRef.current = requestAnimationFrame(animate);
    }

    animate();

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        opacity: 0.85,
        ...style,
      }}
    />
  );
}
