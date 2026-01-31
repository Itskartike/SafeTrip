import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import { useAuth } from '../contexts/AuthContext';
import './Login.css';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(formData.username, formData.password);
      navigate('/profile');
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        err.message ||
        'Login failed. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <h1>Log in</h1>
        <p className="login-subtitle">Sign in to your SafeTrip account</p>
        {error && (
          <div className="alert alert-error">
            <p>{error}</p>
          </div>
        )}
        <form onSubmit={handleSubmit} className="login-form">
          <Input
            label="Username"
            name="username"
            type="text"
            value={formData.username}
            onChange={handleChange}
            placeholder="Enter username"
            required
          />
          <Input
            label="Password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Enter password"
            required
          />
          <Button type="submit" fullWidth loading={loading}>
            Log in
          </Button>
        </form>
        <p className="login-footer">
          Don&apos;t have an account? <Link to="/signup">Sign up</Link>
        </p>
        {/* <p className="login-demo">
          Demo: username <strong>demo</strong>, password <strong>demo123</strong>
        </p> */}
      </div>
    </div>
  );
};

export default Login;
