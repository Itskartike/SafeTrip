import React from 'react';
import './ErrorMessage.css';

const ErrorMessage = ({ error, onRetry }) => {
  if (!error) return null;

  return (
    <div className="error-container">
      <div className="error-icon">⚠️</div>
      <h3>Something went wrong</h3>
      <p className="error-text">
        {error.message || 'An unexpected error occurred'}
      </p>
      {onRetry && (
        <button type="button" className="retry-button" onClick={onRetry}>
          Try Again
        </button>
      )}
    </div>
  );
};

export default ErrorMessage;
