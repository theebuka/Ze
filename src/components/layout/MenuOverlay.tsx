import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { client } from '../../lib/sanity';
import { RollingText } from '../common/RollingText';

interface MenuOverlayProps {
  isOpen: boolean;
  closeMenu: () => void;
}

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
    { title: 'WORK', path: '/work', count: workCount },
    { title: 'ABOUT', path: '/about' },
    { title: 'CONTACT', path: '/contact' },
    { title: 'VAULT', path: '/vault' },
  ];

  const customEase: [number, number, number, number] = [0.76, 0, 0.24, 1];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="menu-overlay"
          initial={{ y: '-100%' }}
          animate={{ y: 0 }}
          exit={{ y: '-100%' }}
          transition={{ duration: 1.4, ease: customEase }}
        >
          <nav className="menu-nav">
            {links.map((link, i) => (
              <motion.div
                key={link.title}
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -50, opacity: 0 }}
                transition={{
                  delay: 0.1 + i * 0.1,
                  duration: 1.2,
                  ease: customEase,
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

                    We pass the className so the rolling-text wrapper
                    inherits any typography styles applied to .menu-link > span.
                  */}
                  <RollingText text={link.title} />

                  {link.count !== undefined && link.count > 0 && (
                    <span className="menu-count">({link.count})</span>
                  )}
                </Link>
              </motion.div>
            ))}
          </nav>
        </motion.div>
      )}
    </AnimatePresence>
  );
};