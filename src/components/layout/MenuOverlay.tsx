import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { client } from '../../lib/sanity';
import { RollingText } from '../common/RollingText';

interface MenuOverlayProps {
  isOpen: boolean;
  closeMenu: () => void;
}

/** Seconds the panel takes to slide in, and back out. */
export const MENU_PANEL_DURATION = 1.4;

/**
 * How long after the menu closes before a newly-mounted page is allowed to
 * start revealing (see AppContent in App.tsx).
 *
 * Half the exit, deliberately. Clicking a menu link mounts the next page
 * instantly, and its reveals used to fire while this panel was still sliding
 * up — the animation was spent on a covered screen and the curtain lifted on
 * content that had already settled. Waiting for the FULL exit overcorrects
 * the other way: the panel uncovers the page top-down, so the last stretch
 * would show a blank strip. Releasing at the halfway mark means the copy is
 * rising into place exactly as the panel clears it.
 */
export const MENU_REVEAL_LEAD_MS = (MENU_PANEL_DURATION * 1000) / 2;

export const MenuOverlay: React.FC<MenuOverlayProps> = ({ isOpen, closeMenu }) => {
  const [workCount, setWorkCount] = useState<number>(0);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const count = await client.fetch(`count(*[_type == "caseStudy"])`);
        setWorkCount(count);
      } catch (err) {
        console.error('Failed to fetch count:', err);
      }
    };
    fetchCount();
  }, []);

  const links = [
    { title: 'work', path: '/work', count: workCount },
    { title: 'about', path: '/about' },
    { title: 'contact', path: '/contact' },
    { title: 'vault', path: '/vault' },
  ];

  /** Panel curve — matches --ease-custom in index.css. */
  const customEase: [number, number, number, number] = [0.76, 0, 0.24, 1];
  /** Entrance curve — CSS/JS twin of MOTION.ease ('expo.out'). */
  const expoOut: [number, number, number, number] = [0.16, 1, 0.3, 1];
  /** Exit curve — the mirror of expoOut. Leaves fast, no glide. */
  const expoIn: [number, number, number, number] = [0.7, 0, 0.84, 0];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="menu-overlay"
          initial={{ y: '-100%' }}
          animate={{ y: 0 }}
          exit={{ y: '-100%' }}
          transition={{ duration: MENU_PANEL_DURATION, ease: customEase }}
        >
          {/*
            Each item is a clipping frame (.menu-item) holding a rising panel
            (.menu-item-inner). The word starts fully below the frame and
            tipped away from the viewer on its bottom edge, then swings flat as
            it rises — a slab of type hinging up into place rather than a block
            of text sliding on. rotateX only ever shortens the projected
            height, so unlike a rotate() the corners never punch out through
            the mask.

            The 0.42s lead-in lets the panel travel most of its distance
            first; the words then arrive into a settled surface instead of
            racing it down the screen.
          */}
          <nav className="menu-nav">
            {links.map((link, i) => (
              <div className="menu-item" key={link.title}>
                <motion.div
                  className="menu-item-inner"
                  initial={{ y: '110%', rotateX: -78, opacity: 0 }}
                  animate={{ y: '0%', rotateX: 0, opacity: 1 }}
                  exit={{
                    y: '-55%',
                    rotateX: 42,
                    opacity: 0,
                    // Reversed stagger on the way out: the list peels from
                    // the bottom up, so it reads as the inverse of the
                    // entrance rather than a replay of it.
                    transition: {
                      delay: (links.length - 1 - i) * 0.045,
                      duration: 0.45,
                      ease: expoIn,
                    },
                  }}
                  transition={{
                    delay: 0.42 + i * 0.085,
                    duration: 1.15,
                    ease: expoOut,
                  }}
                >
                  <Link
                    to={link.path}
                    className="menu-link"
                    onClick={closeMenu}
                  >
                    {/*
                      RollingText replaces the plain text node.
                      The stagger per character makes each giant menu
                      item feel kinetic and mechanical on hover.

                      Its two rows carry the colour change too: .rt-top is
                      muted grey, .rt-bot is white (index.css), so the roll
                      IS the hover state — the white row is what rolls in.
                    */}
                    <RollingText text={link.title} />

                    {link.count !== undefined && link.count > 0 && (
                      <span className="menu-count">({link.count})</span>
                    )}
                  </Link>
                </motion.div>
              </div>
            ))}
          </nav>
        </motion.div>
      )}
    </AnimatePresence>
  );
};