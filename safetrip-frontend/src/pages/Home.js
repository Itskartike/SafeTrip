import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

const Home = () => (
  <div className="home-page">
    <section className="hero">
      <div className="hero-content">
        <h1 className="hero-title">SafeTrip</h1>
        <p className="hero-tagline">Travel safer. Stay connected.</p>
        <p className="hero-desc">
          Send emergency alerts with your location instantly. Get help when you need it most.
        </p>
        <div className="hero-actions">
          <Link to="/sos" className="btn-hero btn-sos">
            <span className="btn-hero-icon">🆘</span>
            SOS Alert
          </Link>
          <Link to="/dashboard" className="btn-hero btn-dashboard">
            Dashboard
          </Link>
        </div>
      </div>
    </section>
    <section className="features">
      <h2 className="features-heading">Features</h2>
      <div className="features-grid">
        <div className="feature-card">
          <span className="feature-icon" aria-hidden>📍</span>
          <h3>Location sharing</h3>
          <p>Share your precise GPS location with emergency contacts in one tap.</p>
        </div>
        <div className="feature-card">
          <span className="feature-icon" aria-hidden>⚡</span>
          <h3>Instant alerts</h3>
          <p>Send SOS alerts that notify responders with your name, phone, and coordinates.</p>
        </div>
        <div className="feature-card">
          <span className="feature-icon" aria-hidden>📋</span>
          <h3>Dashboard</h3>
          <p>View and manage all alerts, update status, and track responses.</p>
        </div>
      </div>
    </section>
  </div>
);

export default Home;
