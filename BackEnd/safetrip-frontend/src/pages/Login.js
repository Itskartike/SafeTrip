import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Input from "../components/common/Input";
import Button from "../components/common/Button";
import { useAuth } from "../contexts/AuthContext";
import authService from "../api/services/authService";
import "./Login.css";

const Login = () => {
  const navigate = useNavigate();
  const { setAuthData } = useAuth();
  const [step, setStep] = useState("email"); // 'email' or 'otp'
  const [formData, setFormData] = useState({ email: "", otp: "" });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleRequestOTP = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      await authService.requestOTP(formData.email);
      setSuccess("OTP sent to your email!");
      setStep("otp");
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Failed to send OTP";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { token, user } = await authService.verifyOTP(
        formData.email,
        formData.otp
      );
      setAuthData(user, null);
      // Redirect by role: Authority -> dashboard, User -> home
      if (user?.role === "AUTHORITY") {
        navigate("/dashboard", { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Invalid OTP";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <h1>Log in</h1>
        <p className="login-subtitle">
          {step === "email"
            ? "Enter your email to receive OTP"
            : "Enter the OTP sent to your email"}
        </p>
        {error && (
          <div className="alert alert-error">
            <p>{error}</p>
          </div>
        )}
        {success && (
          <div
            className="alert alert-success"
            style={{
              background: "#d4edda",
              color: "#155724",
              marginBottom: "1rem",
              padding: "0.75rem",
              borderRadius: "0.5rem",
            }}
          >
            <p>{success}</p>
          </div>
        )}
        {step === "email" ? (
          <form onSubmit={handleRequestOTP} className="login-form">
            <Input
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="your@email.com"
              required
            />
            <Button type="submit" fullWidth loading={loading}>
              Send OTP
            </Button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP} className="login-form">
            <Input
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              disabled
            />
            <Input
              label="OTP"
              name="otp"
              type="text"
              value={formData.otp}
              onChange={handleChange}
              placeholder="Enter 6-digit OTP"
              required
            />
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setStep("email")}
                style={{ flex: 1 }}
              >
                Back
              </Button>
              <Button type="submit" loading={loading} style={{ flex: 1 }}>
                Verify OTP
              </Button>
            </div>
          </form>
        )}
        <p className="login-footer">
          Don&apos;t have an account? <Link to="/signup">Sign up</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
