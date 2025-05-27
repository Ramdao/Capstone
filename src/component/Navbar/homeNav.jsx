import './Nav.css';
import { Link } from 'react-router-dom';
import { useState } from 'react';

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
        {navItems.map((text) => (
          <Link
            key={text}
            to={text === "Home" ? "/" : `/${text.toLowerCase()}`}
            className="nav-link"
            onClick={() => setMenuOpen(false)}
          >
            {text}
          </Link>
        ))}
      </div>
    </div>
  );
}
