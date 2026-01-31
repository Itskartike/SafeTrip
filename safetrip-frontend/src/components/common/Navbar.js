import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './Navbar.css';

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

  const closeMenu = () => setMenuOpen(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const handleEscape = (e) => e.key === 'Escape' && setMenuOpen(false);
    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand" onClick={closeMenu}>
          SafeTrip
        </Link>
        <button
          type="button"
          className="navbar-toggle"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-expanded={menuOpen}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
        >
          <span className="navbar-toggle-bar" />
          <span className="navbar-toggle-bar" />
          <span className="navbar-toggle-bar" />
        </button>
        <ul className={`navbar-links ${menuOpen ? 'navbar-links-open' : ''}`}>
          <li>
            <Link to="/" className={isActive('/') ? 'active' : ''} onClick={closeMenu}>
              Home
            </Link>
          </li>
          <li>
            <Link to="/sos" className={isActive('/sos') ? 'active' : ''} onClick={closeMenu}>
              SOS
            </Link>
          </li>
          <li>
            <Link to="/dashboard" className={isActive('/dashboard') ? 'active' : ''} onClick={closeMenu}>
              Dashboard
            </Link>
          </li>
          <li>
            <Link to="/safety-tips" className={isActive('/safety-tips') ? 'active' : ''} onClick={closeMenu}>
              Safety Tips
            </Link>
          </li>
          {isAuthenticated ? (
            <>
              <li>
                <Link to="/profile" className={isActive('/profile') ? 'active' : ''} onClick={closeMenu}>
                  Profile
                </Link>
              </li>
              <li>
                <button type="button" className="navbar-logout" onClick={handleLogout}>
                  Logout
                </button>
              </li>
            </>
          ) : (
            <>
              <li>
                <Link to="/login" className={isActive('/login') ? 'active' : ''} onClick={closeMenu}>
                  Login
                </Link>
              </li>
              <li>
                <Link to="/signup" className={isActive('/signup') ? 'active' : ''} onClick={closeMenu}>
                  Sign up
                </Link>
              </li>
            </>
          )}
        </ul>
      </div>
      {menuOpen && <div className="navbar-backdrop" onClick={closeMenu} aria-hidden />}
    </nav>
  );
};

export default Navbar;
