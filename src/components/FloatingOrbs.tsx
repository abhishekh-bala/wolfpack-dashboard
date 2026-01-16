import { useEffect, useState } from 'react';

interface Orb {
  id: number;
  size: number;
  x: number;
  y: number;
  color: string;
  duration: number;
  delay: number;
}

const COLORS = [
  'hsl(200, 100%, 50%)',   // Primary blue
  'hsl(142, 71%, 45%)',    // Success green
  'hsl(280, 80%, 60%)',    // Purple
  'hsl(45, 93%, 47%)',     // Warning amber
  'hsl(180, 100%, 45%)',   // Cyan
  'hsl(320, 70%, 55%)',    // Pink
];

export function FloatingOrbs() {
  const [orbs, setOrbs] = useState<Orb[]>([]);

  useEffect(() => {
    // Generate random orbs
    const generateOrbs = () => {
      const newOrbs: Orb[] = [];
      const orbCount = 8;

      for (let i = 0; i < orbCount; i++) {
        newOrbs.push({
          id: i,
          size: Math.random() * 300 + 150, // 150-450px
          x: Math.random() * 100,
          y: Math.random() * 100,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          duration: Math.random() * 20 + 20, // 20-40s
          delay: Math.random() * -20,
        });
      }
      setOrbs(newOrbs);
    };

    generateOrbs();
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {orbs.map((orb) => (
        <div
          key={orb.id}
          className="absolute rounded-full opacity-20 blur-3xl animate-float"
          style={{
            width: `${orb.size}px`,
            height: `${orb.size}px`,
            left: `${orb.x}%`,
            top: `${orb.y}%`,
            backgroundColor: orb.color,
            animationDuration: `${orb.duration}s`,
            animationDelay: `${orb.delay}s`,
            transform: 'translate(-50%, -50%)',
          }}
        />
      ))}
    </div>
  );
}
