import React from 'react';
import { Link } from 'react-router-dom';
import './NotFound.css';

const NotFound = () => (
  <div className="not-found-page">
    <h1>404</h1>
    <p>Page not found</p>
    <Link to="/" className="not-found-link">
      Go to Home
    </Link>
  </div>
);

export default NotFound;
