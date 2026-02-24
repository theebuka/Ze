import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SplashLoaderProps {
  onComplete: () => void;
}

export const SplashLoader: React.FC<SplashLoaderProps> = ({ onComplete }) => {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    const startCounter = () => {
      let currentCount = 0;

      const updateCount = () => {
        if (currentCount < 85) {
          currentCount += Math.floor(Math.random() * 3) + 1;
          if (currentCount > 85) currentCount = 85;
          setCount(currentCount);
          timeoutId = setTimeout(updateCount, 80);

        } else if (currentCount === 85) {
          setCount(currentCount);
          currentCount += 1;
          timeoutId = setTimeout(updateCount, 600);

        } else if (currentCount < 100) {
          currentCount += Math.floor(Math.random() * 2) + 1;
          if (currentCount >= 100) currentCount = 100;
          setCount(currentCount);

          if (currentCount === 100) {
            // Brief pause at 100, then pull the curtain.
            // onComplete fires via AnimatePresence onExitComplete below —
            // only after the full 1.4s exit transition resolves.
            timeoutId = setTimeout(() => setIsVisible(false), 400);
          } else {
            timeoutId = setTimeout(updateCount, 120);
          }
        }
      };

      updateCount();
    };

    // Gate on fonts being ready so SplitType (which runs after onComplete)
    // measures line breaks with the real font, not the fallback.
    // Promise.race prevents a broken font load from hanging the splash.
    Promise.race([
      document.fonts.ready,
      new Promise<void>((resolve) => setTimeout(resolve, 2000)),
    ]).then(startCounter);

    return () => clearTimeout(timeoutId);
  }, []);

  return (
    // onExitComplete: fires once all children finish their exit animation.
    // This is the correct API — replaces onAnimationComplete(definition==='exit')
    // which only works with named variants, not inline exit props.
    <AnimatePresence onExitComplete={onComplete}>
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