"use client";

import { useEffect, useRef } from "react";

interface Props {
  weatherCode: number;
  isDay: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  life: number;
}

export default function WeatherParticles({ weatherCode, isDay }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (rect) {
        canvas.width = rect.width;
        canvas.height = rect.height;
      }
    };
    resize();
    window.addEventListener("resize", resize);

    const type = getParticleType(weatherCode);
    if (type === "none") {
      return () => window.removeEventListener("resize", resize);
    }

    const spawnRate = type === "rain" ? 3 : type === "snow" ? 1.5 : type === "sun" ? 0.4 : 0.15;

    function spawn() {
      const w = canvas!.width;
      const h = canvas!.height;
      if (type === "rain") {
        particlesRef.current.push({
          x: Math.random() * w,
          y: -5,
          vx: -0.5 + Math.random() * -1,
          vy: 4 + Math.random() * 3,
          size: 1 + Math.random() * 1.5,
          opacity: 0.15 + Math.random() * 0.2,
          life: 1,
        });
      } else if (type === "snow") {
        particlesRef.current.push({
          x: Math.random() * w,
          y: -5,
          vx: -0.3 + Math.random() * 0.6,
          vy: 0.5 + Math.random() * 1,
          size: 2 + Math.random() * 3,
          opacity: 0.3 + Math.random() * 0.4,
          life: 1,
        });
      } else if (type === "sun") {
        // Floating warm particles rising
        particlesRef.current.push({
          x: Math.random() * w,
          y: h + 5,
          vx: -0.2 + Math.random() * 0.4,
          vy: -(0.3 + Math.random() * 0.5),
          size: 2 + Math.random() * 4,
          opacity: 0.08 + Math.random() * 0.12,
          life: 1,
        });
      } else if (type === "thunder") {
        // Occasional bright flash particle
        particlesRef.current.push({
          x: Math.random() * w,
          y: Math.random() * h * 0.3,
          vx: 0,
          vy: 0,
          size: w, // full width flash
          opacity: 0.06 + Math.random() * 0.04,
          life: 0.15, // very short
        });
      }
    }

    let accum = 0;

    function animate(ts: number) {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      accum += spawnRate;
      while (accum >= 1) {
        spawn();
        accum -= 1;
      }

      const alive: Particle[] = [];
      for (const p of particlesRef.current) {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= type === "thunder" ? 0.05 : 0.003;

        if (p.life <= 0 || p.y > canvas.height + 10 || p.y < -10 || p.x < -10 || p.x > canvas.width + 10) continue;

        const alpha = p.opacity * Math.min(1, p.life * 3);

        if (type === "rain") {
          ctx.beginPath();
          ctx.strokeStyle = `rgba(180, 220, 255, ${alpha})`;
          ctx.lineWidth = p.size;
          ctx.lineCap = "round";
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x + p.vx * 2, p.y + p.vy * 2);
          ctx.stroke();
        } else if (type === "snow") {
          ctx.beginPath();
          ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          p.vx = Math.sin(p.y * 0.02) * 0.3; // gentle sway
          ctx.fill();
        } else if (type === "sun") {
          ctx.beginPath();
          ctx.fillStyle = `rgba(255, 220, 100, ${alpha})`;
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        } else if (type === "thunder") {
          ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
          ctx.fillRect(0, 0, canvas.width, canvas.height * 0.4);
        }

        alive.push(p);
      }
      particlesRef.current = alive;
      animRef.current = requestAnimationFrame(animate);
    }

    animRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
      particlesRef.current = [];
    };
  }, [weatherCode, isDay]);

  const type = getParticleType(weatherCode);
  if (type === "none") return null;

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-[1]"
      style={{ mixBlendMode: type === "sun" ? "soft-light" : "normal" }}
    />
  );
}

function getParticleType(code: number): "rain" | "snow" | "sun" | "thunder" | "none" {
  if (code === 0) return "sun";
  if (code >= 95) return "thunder";
  if (code >= 71 && code <= 77) return "snow";
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return "rain";
  if (code <= 2) return "sun";
  return "none";
}
