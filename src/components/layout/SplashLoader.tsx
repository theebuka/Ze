import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SplashLoaderProps {
  onComplete: () => void;
}

export const SplashLoader: React.FC<SplashLoaderProps> = ({ onComplete }) => {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    let currentCount = 0;
    let timeoutId: ReturnType<typeof setTimeout>;

    const updateCount = () => {
      if (currentCount < 85) {
        // Phase 1: Slower climb (increments by 1, 2, or 3)
        currentCount += Math.floor(Math.random() * 3) + 1;
        if (currentCount > 85) currentCount = 85;
        setCount(currentCount);
        
        // Increased delay from 30ms to 80ms for a heavier tick
        timeoutId = setTimeout(updateCount, 80); 
        
      } else if (currentCount === 85) {
        // Phase 2: The Tension Hang
        setCount(currentCount);
        currentCount += 1;
        timeoutId = setTimeout(updateCount, 600); // Hangs for slightly longer (0.6s)
        
      } else if (currentCount < 100) {
        // Phase 3: Final slow tick to 100 (increments by 1 or 2)
        currentCount += Math.floor(Math.random() * 2) + 1;
        if (currentCount >= 100) currentCount = 100;
        setCount(currentCount);
        
        if (currentCount === 100) {
          // Trigger the slide up, then tell the app we're done
          setTimeout(() => {
            setIsVisible(false);
            setTimeout(onComplete, 600); 
          }, 400); // Brief pause exactly at 100 before pulling the curtain
        } else {
          // Increased delay for the final ticks
          timeoutId = setTimeout(updateCount, 120);
        }
      }
    };

    updateCount();

    return () => clearTimeout(timeoutId);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="splash-screen"
          initial={{ y: 0 }}
          exit={{ y: '-100%' }}
          transition={{ duration: 1.4, ease: [0.76, 0, 0.24, 1] }}
        >
          <div className="splash-counter">{count}</div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};