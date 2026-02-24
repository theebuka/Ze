import React, { useEffect, useRef } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { useCursor } from '../../context/CursorContext';

/**
 * CustomCursor
 *
 * Three distinct states:
 *   'default'      → 24px dot, mix-blend-mode: difference
 *   'view-project' → 80px circle with "VIEW" label
 *   'media'        → 120px borderless circle playing a muted looping video
 *                    from `cursorMedia` URL (set via CursorContext)
 *
 * Fully disabled on touch/coarse-pointer devices. No listeners, no render.
 */
export const CustomCursor: React.FC = () => {
  // ── Device guard: bail completely on touch devices ───────────────────
  const isPointerFine =
    typeof window !== 'undefined' &&
    window.matchMedia('(pointer: fine)').matches;

  if (!isPointerFine) return null;

  return <CursorInner />;
};

/** Separated so the hook rules are clean after the early return above */
const CursorInner: React.FC = () => {
  const { cursorType, cursorMedia } = useCursor();
  const videoRef = useRef<HTMLVideoElement>(null);

  const mouseX = useMotionValue(-200);
  const mouseY = useMotionValue(-200);

  const springConfig = { damping: 25, stiffness: 300, mass: 0.25 };
  const cursorX = useSpring(mouseX, springConfig);
  const cursorY = useSpring(mouseY, springConfig);

  useEffect(() => {
    const moveCursor = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };
    window.addEventListener('mousemove', moveCursor);
    return () => window.removeEventListener('mousemove', moveCursor);
  }, [mouseX, mouseY]);

  // ── Play/pause the video as the cursor enters/leaves media mode ──────
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (cursorType === 'media' && cursorMedia) {
      video.src = cursorMedia;
      video.play().catch(() => {
        // Autoplay blocked in some browsers — fail silently
      });
    } else {
      video.pause();
      video.src = '';
    }
  }, [cursorType, cursorMedia]);

  // ── Size + blend-mode config per state ──────────────────────────────
  const sizeMap = {
    default: 24,
    'view-project': 80,
    media: 120,
  };

  const size = sizeMap[cursorType];
  const offset = size / 2;

  // Media mode has no blend mode — video colours need to be accurate
  const blendMode =
    cursorType === 'media' ? 'normal' : ('difference' as const);

  const bgColor =
    cursorType === 'media' ? 'transparent' : 'var(--text-color)';

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
        marginLeft: -offset,
        marginTop: -offset,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: cursorType === 'media' ? 'hidden' : 'visible',
      }}
      animate={{
        width: size,
        height: size,
        backgroundColor: bgColor,
        mixBlendMode: blendMode,
      }}
      transition={{ type: 'spring', stiffness: 280, damping: 22 }}
    >
      {/* ── VIEW label (view-project state) ─────────────────── */}
      <motion.span
        animate={{
          opacity: cursorType === 'view-project' ? 1 : 0,
          scale: cursorType === 'view-project' ? 1 : 0.5,
        }}
        transition={{ duration: 0.2 }}
        style={{
          color: 'var(--bg-color)',
          fontSize: '11px',
          fontWeight: 700,
          letterSpacing: '0.08em',
          pointerEvents: 'none',
          position: 'absolute',
        }}
      >
        VIEW
      </motion.span>

      {/* ── Video player (media state) ───────────────────────── */}
      <motion.div
        className="cursor-media-wrapper"
        animate={{ opacity: cursorType === 'media' ? 1 : 0 }}
        transition={{ duration: 0.25 }}
        style={{ position: 'absolute', inset: 0 }}
      >
        <video
          ref={videoRef}
          muted
          loop
          playsInline
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            borderRadius: '50%',
            display: 'block',
          }}
        />
        {/* "PLAY" label floats over the video */}
        <motion.span
          className="cursor-media-label"
          animate={{ opacity: cursorType === 'media' ? 1 : 0 }}
          transition={{ delay: 0.1 }}
        >
          PLAY
        </motion.span>
      </motion.div>
    </motion.div>
  );
};