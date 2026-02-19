import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import SplitType from 'split-type';

export const useLineReveal = () => {
  const textRef = useRef<any>(null);

  useEffect(() => {
    if (!textRef.current) return;

    // 1. Split text into individual lines
    const split = new SplitType(textRef.current, { types: 'lines' });

    // 2. Wrap each line in a masking div for the "slide up from nowhere" effect
    if (split.lines) {
      split.lines.forEach((line) => {
        const wrapper = document.createElement('div');
        wrapper.style.overflow = 'hidden';
        wrapper.style.display = 'inline-block';
        wrapper.style.verticalAlign = 'top';
        wrapper.style.width = '100%';
        line.parentNode?.insertBefore(wrapper, line);
        wrapper.appendChild(line);
      });

      // Update your GSAP animation to use this easing
        gsap.from(split.lines, {
            y: '100%',
            duration: 1.4,         // Increased duration for a more elegant deceleration
            ease: 'power4.out',    // This is the "Quintic Out" effect seen in the video
            stagger: 0.15,         // Slightly more stagger for that staggered line effect
            delay: 0.2,
        });
    }

    // Cleanup on unmount
    return () => {
      split.revert();
    };
  }, []);

  return textRef;
};