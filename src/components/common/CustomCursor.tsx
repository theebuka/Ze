import React, { useEffect } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { useCursor } from '../../context/CursorContext';

export const CustomCursor: React.FC = () => {
  const { cursorType } = useCursor();

  // Motion values for raw mouse position
  const mouseX = useMotionValue(-50);
  const mouseY = useMotionValue(-50);

  // Spring physics for smooth movement (adjust stiffness/damping for feel)
  const springConfig = { damping: 25, stiffness: 300, mass: 0.25 };
  const cursorX = useSpring(mouseX, springConfig);
  const cursorY = useSpring(mouseY, springConfig);

  useEffect(() => {
    const moveCursor = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };

    window.addEventListener('mousemove', moveCursor);
    return () => {
      window.removeEventListener('mousemove', moveCursor);
    };
  }, [mouseX, mouseY]);

  // Variants for animating between cursor states
  const variants = {
    default: {
      width: 24,
      height: 24,
      backgroundColor: 'var(--text-color)',
      mixBlendMode: 'difference' as const,
    },
    'view-project': {
      width: 80,
      height: 80,
      backgroundColor: 'var(--text-color)',
      mixBlendMode: 'difference' as const,
    },
  };

  return (
    <motion.div
      className="custom-cursor"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 9999,
        pointerEvents: 'none',
        x: cursorX,
        y: cursorY,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        // Center the cursor div on the mouse point
        marginLeft: cursorType === 'view-project' ? -40 : -8,
        marginTop: cursorType === 'view-project' ? -40 : -8,
      }}
      variants={variants}
      animate={cursorType}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
    >
      {/* Animate the text label in and out */}
      <motion.span
        animate={{ 
          opacity: cursorType === 'view-project' ? 1 : 0,
          scale: cursorType === 'view-project' ? 1 : 0.5
        }}
        style={{
          color: 'var(--bg-color)', // Inverted color because of mix-blend-mode
          fontSize: '12px',
          fontWeight: 'bold',
          letterSpacing: '0.05em',
          pointerEvents: 'none',
        }}
      >
        VIEW
      </motion.span>
    </motion.div>
  );
};