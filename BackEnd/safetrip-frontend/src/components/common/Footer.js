import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => (
  <footer className="footer">
    <div className="footer-container">
      <div className="footer-links">
        <Link to="/">Home</Link>
        <Link to="/sos">SOS</Link>
        <Link to="/dashboard">Dashboard</Link>
        <Link to="/safety-tips">Safety Tips</Link>
      </div>
      <p className="footer-copy">
        © {new Date().getFullYear()} SafeTrip. Travel safer.
      </p>
    </div>
  </footer>
);

export default Footer;
