import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Input from "../components/common/Input";
import Button from "../components/common/Button";
import { useAuth } from "../contexts/AuthContext";
import "./Signup.css";

const Signup = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    username: "hukum1",
    password: "TestPassword@123",
    email: "jadhavrj0011@gmail.com",
    first_name: "Raj",
    last_name: "Jadhav",
    contact_no: "9876541210",
  });
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
      const response = await register(formData);
      // Backend returns {message: \"...\"} on successful registration
      alert(
        response.message || "Registration successful! Please login with OTP."
      );
      navigate("/login");
    } catch (err) {
      const data = err.response?.data;
      let msg = "Sign up failed. Please try again.";
      if (data?.errors && Array.isArray(data.errors)) {
        msg = data.errors.join(" ");
      } else if (data?.error) {
        msg = data.error;
      } else if (data?.username) {
        msg = Array.isArray(data.username) ? data.username[0] : data.username;
      } else if (data?.password) {
        msg = Array.isArray(data.password) ? data.password[0] : data.password;
      } else if (data?.detail) {
        msg = data.detail;
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-page">
      <div className="signup-container">
        <h1>Sign up</h1>
        <p className="signup-subtitle">Create your SafeTrip account</p>
        {error && (
          <div className="alert alert-error">
            <p>{error}</p>
          </div>
        )}
        <form onSubmit={handleSubmit} className="signup-form">
          <Input
            label="Username"
            name="username"
            type="text"
            value={formData.username}
            onChange={handleChange}
            placeholder="Choose a username"
            required
          />
          <Input
            label="Password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="At least 6 characters"
            required
          />
          <Input
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="you@example.com"
            required
          />
          <Input
            label="First Name"
            name="first_name"
            type="text"
            value={formData.first_name}
            onChange={handleChange}
            placeholder="First name"
            required
          />
          <Input
            label="Last Name"
            name="last_name"
            type="text"
            value={formData.last_name}
            onChange={handleChange}
            placeholder="Last name"
            required
          />
          <Input
            label="Contact Number"
            name="contact_no"
            type="tel"
            value={formData.contact_no}
            onChange={handleChange}
            placeholder="9876543210"
            required
          />
          <Button type="submit" fullWidth loading={loading}>
            Sign up
          </Button>
        </form>
        <p className="signup-footer">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
