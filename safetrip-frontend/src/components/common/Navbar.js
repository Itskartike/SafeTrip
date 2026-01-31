import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './Navbar.css';

const NAVBAR_HEIGHT = 64;

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    navigate('/');
  };

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  // Lock body scroll when menu open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
      document.body.classList.add('menu-open');
    } else {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
      document.body.classList.remove('menu-open');
    }
  }, [menuOpen]);

  // ESC key close
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Brand */}
        <Link to="/" className="navbar-brand" onClick={() => setMenuOpen(false)}>
          SafeTrip
        </Link>

        {/* Hamburger */}
        <button
          className="navbar-toggle"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-expanded={menuOpen}
          aria-label="Toggle menu"
        >
          <span className="navbar-toggle-bar" />
          <span className="navbar-toggle-bar" />
          <span className="navbar-toggle-bar" />
        </button>

        {/* Menu */}
        <ul className={`navbar-links ${menuOpen ? 'navbar-links-open' : ''}`}>
          <li>
            <Link to="/" className={isActive('/') ? 'active' : ''}>
              Home
            </Link>
          </li>
          <li>
            <Link to="/sos" className={isActive('/sos') ? 'active' : ''}>
              SOS
            </Link>
          </li>
          <li>
            <Link to="/dashboard" className={isActive('/dashboard') ? 'active' : ''}>
              Dashboard
            </Link>
          </li>
          <li>
            <Link to="/safety-tips" className={isActive('/safety-tips') ? 'active' : ''}>
              Safety Tips
            </Link>
          </li>

          {isAuthenticated ? (
            <>
              <li>
                <Link to="/profile" className={isActive('/profile') ? 'active' : ''}>
                  Profile
                </Link>
              </li>
              <li>
                <button className="navbar-logout" onClick={handleLogout}>
                  Logout
                </button>
              </li>
            </>
          ) : (
            <>
              <li>
                <Link to="/login" className={isActive('/login') ? 'active' : ''}>
                  Login
                </Link>
              </li>
              <li>
                <Link to="/signup" className={isActive('/signup') ? 'active' : ''}>
                  Sign Up
                </Link>
              </li>
            </>
          )}
        </ul>
      </div>

      {menuOpen && <div className="navbar-backdrop" onClick={() => setMenuOpen(false)} />}
    </nav>
  );
};

export default Navbar;
