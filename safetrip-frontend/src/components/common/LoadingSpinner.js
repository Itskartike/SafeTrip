import React from 'react';
import './LoadingSpinner.css';

const LoadingSpinner = ({ size = 'medium', text = 'Loading...' }) => (
  <div className="loading-container">
    <div className={`spinner spinner-${size}`} />
    {text && <p className="loading-text">{text}</p>}
  </div>
);

export default LoadingSpinner;
