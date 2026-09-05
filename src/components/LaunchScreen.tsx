import React, { useState, useEffect } from 'react';
import { TregaLogo } from './TregaLogo';
import { motion } from 'motion/react';

interface LaunchScreenProps {
  onComplete?: () => void;
  minDuration?: number;
}

export const LaunchScreen: React.FC<LaunchScreenProps> = ({
  onComplete,
  minDuration = 2000,
}) => {
  const [isFading, setIsFading] = useState(false);
  const [isUnmounted, setIsUnmounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsFading(true);
      setTimeout(() => {
        setIsUnmounted(true);
        if (onComplete) {
          onComplete();
        }
      }, 500); // 500ms fade duration
    }, minDuration);

    return () => clearTimeout(timer);
  }, [minDuration, onComplete]);

  if (isUnmounted) return null;

  return (
    <div
      className={`fixed inset-0 z-100 flex items-center justify-center bg-white select-none transition-opacity duration-500 ease-in-out ${
        isFading ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ 
          duration: 1.2, 
          ease: [0.16, 1, 0.3, 1], // Super smooth custom ease-out
        }}
      >
        <TregaLogo variant="full" size="hero" />
      </motion.div>
    </div>
  );
};
