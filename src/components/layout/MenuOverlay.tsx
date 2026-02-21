import React from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

interface MenuOverlayProps {
  isOpen: boolean;
  closeMenu: () => void;
}

export const MenuOverlay: React.FC<MenuOverlayProps> = ({ isOpen, closeMenu }) => {
  const links = [
    { title: 'WORK', path: '/work', count: 7 },
    { title: 'ABOUT', path: '/about' },
    { title: 'CONTACT', path: '/contact' },
    { title: 'VAULT', path: '/vault' }
  ];

  // The custom Quintic Out easing (cubic-bezier tuple)
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
                transition={{ delay: 0.1 + (i * 0.1), duration: 1.2, ease: customEase }}
              >
                <Link 
                  to={link.path} 
                  className="menu-link"
                  onClick={closeMenu}
                >
                  {link.title}
                  {link.count && <span className="menu-count">({link.count})</span>}
                </Link>
              </motion.div>
            ))}
          </nav>
        </motion.div>
      )}
    </AnimatePresence>
  );
};