import React from 'react';
import './Input.css';

const Input = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  onBlur,
  error,
  placeholder,
  required = false,
  disabled = false,
  icon,
  className = '',
  ...props
}) => (
  <div className={`input-group ${className}`}>
    {label && (
      <label htmlFor={name} className="input-label">
        {label}
        {required && <span className="required">*</span>}
      </label>
    )}
    <div className="input-wrapper">
      {icon && <span className="input-icon">{icon}</span>}
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        className={`input ${error ? 'input-error' : ''} ${icon ? 'input-with-icon' : ''}`}
        {...props}
      />
    </div>
    {error && <span className="error-message">{error}</span>}
  </div>
);

export default Input;
