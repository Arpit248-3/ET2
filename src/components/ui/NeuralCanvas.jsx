import React, { useEffect, useRef } from 'react';

export default function NeuralCanvas({
  nodeCount = 65,
  connectionRadius = 140,
  mouseRadius = 180,
  accentColor = '#00e5ff',
}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Mouse coordinates
    const mouse = {
      x: width / 2,
      y: height / 2,
      targetX: width / 2,
      targetY: height / 2,
      isHovering: false,
    };

    const handleMouseMove = (e) => {
      mouse.targetX = e.clientX;
      mouse.targetY = e.clientY;
      mouse.isHovering = true;
    };

    const handleMouseLeave = () => {
      mouse.isHovering = false;
    };

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('resize', handleResize);

    // Initialize Nodes
    const nodes = Array.from({ length: nodeCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.7,
      vy: (Math.random() - 0.5) * 0.7,
      radius: Math.random() * 2 + 1.5,
      pulse: Math.random() * Math.PI * 2,
      pulseSpeed: Math.random() * 0.03 + 0.01,
    }));

    // Electrical Impulse Signals
    const impulses = [];
    const spawnImpulse = (startNode, endNode) => {
      impulses.push({
        startX: startNode.x,
        startY: startNode.y,
        endX: endNode.x,
        endY: endNode.y,
        progress: 0,
        speed: Math.random() * 0.02 + 0.015,
      });
    };

    let frame = 0;

    const render = () => {
      frame++;
      // Smooth mouse interpolation
      mouse.x += (mouse.targetX - mouse.x) * 0.1;
      mouse.y += (mouse.targetY - mouse.y) * 0.1;

      // Dark background fill
      ctx.fillStyle = '#020813';
      ctx.fillRect(0, 0, width, height);

      // Radial background glow around center
      const bgGrad = ctx.createRadialGradient(width / 2, height / 2, 50, width / 2, height / 2, Math.max(width, height) * 0.7);
      bgGrad.addColorStop(0, 'rgba(13, 29, 56, 0.6)');
      bgGrad.addColorStop(0.6, 'rgba(5, 12, 26, 0.9)');
      bgGrad.addColorStop(1, '#020813');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Update Node positions & Physics
      nodes.forEach((node) => {
        node.x += node.vx;
        node.y += node.vy;
        node.pulse += node.pulseSpeed;

        // Bounce off canvas boundaries
        if (node.x < 0 || node.x > width) node.vx *= -1;
        if (node.y < 0 || node.y > height) node.vy *= -1;

        // Mouse attraction physics
        if (mouse.isHovering) {
          const dx = mouse.x - node.x;
          const dy = mouse.y - node.y;
          const dist = Math.hypot(dx, dy);
          if (dist < mouseRadius && dist > 1) {
            const force = (mouseRadius - dist) / mouseRadius;
            node.x += (dx / dist) * force * 0.6;
            node.y += (dy / dist) * force * 0.6;
          }
        }
      });

      // Draw Synapse Connection Lines
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const n1 = nodes[i];
          const n2 = nodes[j];
          const dx = n2.x - n1.x;
          const dy = n2.y - n1.y;
          const dist = Math.hypot(dx, dy);

          if (dist < connectionRadius) {
            const alpha = (1 - dist / connectionRadius) * 0.45;
            
            // Check if mouse is near this synapse vector
            let mouseAlphaBonus = 0;
            if (mouse.isHovering) {
              const mDist1 = Math.hypot(mouse.x - n1.x, mouse.y - n1.y);
              const mDist2 = Math.hypot(mouse.x - n2.x, mouse.y - n2.y);
              if (mDist1 < mouseRadius || mDist2 < mouseRadius) {
                mouseAlphaBonus = 0.35;
              }
            }

            ctx.beginPath();
            ctx.moveTo(n1.x, n1.y);
            ctx.lineTo(n2.x, n2.y);
            ctx.strokeStyle = `rgba(0, 229, 255, ${Math.min(alpha + mouseAlphaBonus, 0.8)})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();

            // Randomly spawn impulse signal along vector
            if (frame % 120 === 0 && Math.random() < 0.08) {
              spawnImpulse(n1, n2);
            }
          }
        }
      }

      // Draw & Update Electrical Impulses
      for (let k = impulses.length - 1; k >= 0; k--) {
        const imp = impulses[k];
        imp.progress += imp.speed;
        if (imp.progress >= 1) {
          impulses.splice(k, 1);
          continue;
        }

        const currX = imp.startX + (imp.endX - imp.startX) * imp.progress;
        const currY = imp.startY + (imp.endY - imp.startY) * imp.progress;

        ctx.beginPath();
        ctx.arc(currX, currY, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = accentColor;
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Draw Glowing Nodes (Neurons)
      nodes.forEach((node) => {
        const glowOpacity = (Math.sin(node.pulse) + 1) / 2 * 0.5 + 0.3;
        
        // Outer halo
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius * 2.8, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 229, 255, ${glowOpacity * 0.25})`;
        ctx.fill();

        // Inner node
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fillStyle = accentColor;
        ctx.shadowColor = accentColor;
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [nodeCount, connectionRadius, mouseRadius, accentColor]);

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
