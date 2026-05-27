"use client";

import { useEffect, useRef } from "react";
import "./codex-animated-bg.css";

type ParticleState = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
};

function createParticle(width: number, height: number): ParticleState {
  return {
    x: Math.random() * width,
    y: Math.random() * height,
    vx: (Math.random() - 0.5) * 0.4,
    vy: (Math.random() - 0.5) * 0.4,
    radius: Math.random() * 2 + 0.5,
    alpha: Math.random() * 0.5 + 0.1,
  };
}

function resetParticle(p: ParticleState, width: number, height: number) {
  p.x = Math.random() * width;
  p.y = Math.random() * height;
  p.vx = (Math.random() - 0.5) * 0.4;
  p.vy = (Math.random() - 0.5) * 0.4;
  p.radius = Math.random() * 2 + 0.5;
  p.alpha = Math.random() * 0.5 + 0.1;
}

export default function CodexAnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const orbRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const orb = orbRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const particles: ParticleState[] = [];
    let frameId = 0;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const initParticles = () => {
      particles.length = 0;
      const count = window.innerWidth < 700 ? 55 : 80;
      for (let i = 0; i < count; i++) {
        particles.push(createParticle(canvas.width, canvas.height));
      }
    };

    const drawConnections = () => {
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(0, 168, 255, ${0.12 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const particle of particles) {
        particle.x += particle.vx;
        particle.y += particle.vy;
        if (
          particle.x < 0 ||
          particle.x > canvas.width ||
          particle.y < 0 ||
          particle.y > canvas.height
        ) {
          resetParticle(particle, canvas.width, canvas.height);
        }
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 168, 255, ${particle.alpha})`;
        ctx.fill();
      }
      drawConnections();
      frameId = requestAnimationFrame(animate);
    };

    const onResize = () => {
      resizeCanvas();
      initParticles();
    };

    const onMouseMove = (event: MouseEvent) => {
      if (!orb) return;
      orb.style.left = `${event.clientX}px`;
      orb.style.top = `${event.clientY}px`;
    };

    resizeCanvas();
    initParticles();
    animate();

    window.addEventListener("resize", onResize);
    document.addEventListener("mousemove", onMouseMove);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("mousemove", onMouseMove);
    };
  }, []);

  return (
    <div id="codex-animated-bg" className="codex-animated-bg" aria-hidden="true">
      <canvas ref={canvasRef} id="codex-neural-canvas" className="codex-neural-canvas" />
      <div ref={orbRef} id="codex-light-orb" className="codex-light-orb" />
    </div>
  );
}
