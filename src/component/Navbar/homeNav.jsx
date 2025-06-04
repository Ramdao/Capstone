import './Nav.css';
import { Link } from 'react-router-dom';
import { useState } from 'react';

// Accept auth and handleLogout as props
export default function HomeNav({ auth, handleLogout }) {
  const [menuOpen, setMenuOpen] = useState(false);

  // Define navigation items based on authentication status and role
  let navItems = [];

  if (auth && auth.role === 'client') {
    // User is logged in as a client
    navItems = [
      { name: "Events", path: "/client-event" },
      { name: "Ask a Stylist", path: "/ask-stylist" },
      { name: "Ask an AI", path: "/ask-ai" },
      { name: "Collection", path: "/client-dashboard" },
      { name: "Profile", path: "/client-profile" },
      { name: "Logout", path: "/", action: handleLogout } 
    ];
  } else if (auth && auth.role === 'stylist') {
    // User is logged in as a stylist
    navItems = [
      { name: "Ask AI", path: "/ask-ai" },
      { name: "Events", path: "/event" },
      { name: "Collection", path: "/stylist-dashboard" },
      { name: "Client list", path: "/client-list" },
      { name: "Logout", path: "/", action: handleLogout } 
    ];
  } else if (auth && auth.role === 'admin') {
    // User is logged in as an admin
    navItems = [
      
      { name: "Collections", path: "/admin-dashboard" },
      { name: "Stylist List", path: "/all-stylist-list" }, 
      { name: "Client List", path: "/all-client-list" },   
      { name: "Logout", path: "/", action: handleLogout } 
    ];
  } else {
    // User is not logged in (public navigation)
    navItems = [
      { name: "Login", path: "/login" },
      { name: "About", path: "/about" },
      { name: "Contact", path: "/contact" },
      { name: "Home", path: "/" },
    ];
  }

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
        {navItems.map((item) => (
          
          <Link
            key={item.name}
            to={item.path} 
            className="nav-link"
            onClick={() => {
              if (item.action) { 
                item.action(); // Execute the action first
              }
              setMenuOpen(false); 
            }}
          >
            {item.name}
          </Link>
        ))}
      </div>
    </div>
  );
}