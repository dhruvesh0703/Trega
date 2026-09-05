import React, { useMemo } from 'react';
import { Smartphone, Laptop, Headphones, Camera, Watch, Gamepad2, Bike, Shirt, Coffee, Book } from 'lucide-react';

const ICONS = [Smartphone, Laptop, Headphones, Camera, Watch, Gamepad2, Bike, Shirt, Coffee, Book];

export const FloatingIconsBackground: React.FC = () => {
  const particles = useMemo(() => {
    // Generate a static grid of icons with some jitter to look scattered
    const items = [];
    let id = 0;
    // 6 rows, 4 columns for a decent spread across the screen
    for (let row = 0; row < 6; row++) {
      for (let col = 0; col < 4; col++) {
        const Icon = ICONS[id % ICONS.length];
        
        // Calculate static percentage positions with a bit of organic randomness
        const top = (row * 18) + (Math.random() * 8); 
        const left = (col * 25) + (Math.random() * 10);
        const size = Math.random() * 20 + 24; // 24px to 44px
        const rotate = Math.random() * 360; 
        
        items.push({
          id: id++,
          Icon,
          size,
          top,
          left,
          rotate
        });
      }
    }
    return items;
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-[0] opacity-[0.04]">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute text-brand-900"
          style={{
            top: `${p.top}%`,
            left: `${p.left}%`,
            transform: `rotate(${p.rotate}deg)`,
          }}
        >
          <p.Icon size={p.size} strokeWidth={1.5} />
        </div>
      ))}
    </div>
  );
};
