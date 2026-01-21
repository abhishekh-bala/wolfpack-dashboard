import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
}

export function ParticleNetwork(): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number>();
  const mouseRef = useRef({ x: -1000, y: -1000 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const initParticles = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      canvas.width = width;
      canvas.height = height;

      // Calculate particle count based on screen size
      const particleCount = Math.min(100, Math.floor((width * height) / 12000));
      particlesRef.current = [];

      // Create a grid-based distribution with randomization for even spread
      const cols = Math.ceil(Math.sqrt(particleCount * (width / height)));
      const rows = Math.ceil(particleCount / cols);
      const cellWidth = width / cols;
      const cellHeight = height / rows;

      for (let i = 0; i < particleCount; i++) {
        const col = i % cols;
        const row = Math.floor(i / cols);
        
        // Position within cell with randomization
        const x = (col * cellWidth) + (Math.random() * cellWidth);
        const y = (row * cellHeight) + (Math.random() * cellHeight);

        particlesRef.current.push({
          x: Math.min(x, width),
          y: Math.min(y, height),
          vx: (Math.random() - 0.5) * 0.8,
          vy: (Math.random() - 0.5) * 0.8,
          size: Math.random() * 2 + 1.5,
        });
      }
    };

    initParticles();

    const handleResize = () => {
      initParticles();
    };

    window.addEventListener('resize', handleResize);

    const connectionDistance = 180;
    const mouseConnectionDistance = 250;

    const animate = () => {
      const width = canvas.width;
      const height = canvas.height;
      
      ctx.clearRect(0, 0, width, height);

      const particles = particlesRef.current;

      // Update and draw particles
      particles.forEach((particle, i) => {
        // Update position
        particle.x += particle.vx;
        particle.y += particle.vy;

        // Bounce off edges with some padding
        if (particle.x < 0) {
          particle.x = 0;
          particle.vx *= -1;
        } else if (particle.x > width) {
          particle.x = width;
          particle.vx *= -1;
        }
        
        if (particle.y < 0) {
          particle.y = 0;
          particle.vy *= -1;
        } else if (particle.y > height) {
          particle.y = height;
          particle.vy *= -1;
        }

        // Draw particle with glow
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(100, 180, 255, 0.8)';
        ctx.fill();
        
        // Add subtle glow
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size * 2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(100, 180, 255, 0.15)';
        ctx.fill();

        // Draw connections to other particles
        for (let j = i + 1; j < particles.length; j++) {
          const other = particles[j];
          const dx = particle.x - other.x;
          const dy = particle.y - other.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < connectionDistance) {
            const opacity = (1 - distance / connectionDistance) * 0.4;
            ctx.beginPath();
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(other.x, other.y);
            ctx.strokeStyle = `rgba(100, 180, 255, ${opacity})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }

        // Draw connection to mouse
        const mouseDx = particle.x - mouseRef.current.x;
        const mouseDy = particle.y - mouseRef.current.y;
        const mouseDistance = Math.sqrt(mouseDx * mouseDx + mouseDy * mouseDy);

        if (mouseDistance < mouseConnectionDistance) {
          const opacity = (1 - mouseDistance / mouseConnectionDistance) * 0.6;
          ctx.beginPath();
          ctx.moveTo(particle.x, particle.y);
          ctx.lineTo(mouseRef.current.x, mouseRef.current.y);
          ctx.strokeStyle = `rgba(140, 200, 255, ${opacity})`;
          ctx.lineWidth = 1.2;
          ctx.stroke();
        }
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseLeave = () => {
      mouseRef.current = { x: -1000, y: -1000 };
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 particle-network"
      style={{ background: 'transparent' }}
    />
  );
}
