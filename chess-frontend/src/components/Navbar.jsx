import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import "../css_files/Navbar.css";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };
  
  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <header className="header">      
      {/* Hamburger Menu Button */}
      <div 
        className={`hamburger ${isMenuOpen ? 'active' : ''}`} 
        onClick={toggleMenu}
      >
        <span></span>
        <span></span>
        <span></span>
      </div>
      
      {/* Navigation Links */}
      <nav className={`navbar ${isMenuOpen ? 'open' : ''}`}>
        <NavLink 
          to="/" 
          className={({ isActive }) => isActive ? "active" : ""}
          onClick={closeMenu}
        >
          Home
        </NavLink>
        <NavLink 
          to="/about" 
          className={({ isActive }) => isActive ? "active" : ""}
          onClick={closeMenu}
        >
          About
        </NavLink>
        <NavLink 
          to="/contact" 
          className={({ isActive }) => isActive ? "active" : ""}
          onClick={closeMenu}
        >
          Contact
        </NavLink>
        <NavLink 
          to="/play" 
          className={({ isActive }) => isActive ? "active" : ""}
          onClick={closeMenu}
        >
          Play
        </NavLink>
      </nav>
    </header>
  );
}