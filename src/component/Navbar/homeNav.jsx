import './Nav.css';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useState } from 'react';

const MotionLink = motion(Link);

export default function HomeNav() {
  const [menuOpen, setMenuOpen] = useState(false);
  const navItems = ["Home", "About", "Contact", "Login"];

  const toggleMenu = () => setMenuOpen(!menuOpen);

  return (
    <div className="topNav">
      <div className="flame"></div>
      <p className="title">FitFusion</p>

      {/* Burger icon for mobile */}
      <div className="burger" onClick={toggleMenu}>
        ☰
      </div>

      {/* Navigation links */}
      <div className={`navLinks ${menuOpen ? 'open' : ''}`}>
        {navItems.map((text, index) => (
          <MotionLink
            key={text}
            to={text === "Home" ? "/" : `/${text.toLowerCase()}`}
            className="nav-link"
            onClick={() => setMenuOpen(false)} // close menu on link click
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * index, duration: 0.5 }}
            whileHover={{
              scale: 1.1,
              y: -3,
              transition: { duration: 0.1, ease: "easeOut" },
            }}
            whileTap={{ scale: 0.95 }}
          >
            {text}
          </MotionLink>
        ))}
      </div>
    </div>
  );
}
