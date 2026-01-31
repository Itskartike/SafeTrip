import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Input from "../components/common/Input";
import Button from "../components/common/Button";
import useGeolocation from "../hooks/useGeolocation";
import alertService from "../api/services/alertService";
import { useAuth } from "../contexts/AuthContext";
import { validatePhone, validateName } from "../utils/validation";
import alertSound from "../utils/alertSound";
import "./SOS.css";

const SOS = () => {
  const navigate = useNavigate();
  const { isAuthenticated, profile, user } = useAuth();
  const {
    location,
    error: geoError,
    loading: geoLoading,
    getLocation,
  } = useGeolocation();

  const [formData, setFormData] = useState({ name: "", phone: "" });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [alertActive, setAlertActive] = useState(false);

  const useProfile = isAuthenticated;
  const displayName = useProfile
    ? `${user?.first_name || ""} ${user?.last_name || ""}`.trim() ||
      user?.username ||
      "User"
    : formData.name;
  const displayPhone = useProfile
    ? (profile?.relative_mobile_no || profile?.emergency_contact_phone)
    : formData.phone;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const validateForm = () => {
    if (useProfile) return true;
    const newErrors = {};
    const nameError = validateName(formData.name);
    if (nameError) newErrors.name = nameError;
    const phoneError = validatePhone(formData.phone);
    if (phoneError) newErrors.phone = phoneError;
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(false);
    if (!validateForm()) return;

    // Play emergency alert sound and show visual indicator
    setAlertActive(true);
    alertSound.playSiren(3000);

    // Remove alert active state after sound finishes
    setTimeout(() => setAlertActive(false), 3000);

    setSubmitting(true);
    getLocation();
  };

  useEffect(() => {
    if (!location || !submitting) return;
    const sendAlert = async () => {
      try {
        const alertData = {
          latitude: location.latitude,
          longitude: location.longitude,
          message: "Emergency SOS Alert - Immediate assistance needed!",
          address: location.address || `${location.latitude}, ${location.longitude}`,
        };

        // Send user_id if authenticated, otherwise send name/phone
        if (useProfile && user) {
          alertData.user_id = user.id;
          // Send emergency contact phone so backend sends SMS (profile uses relative_mobile_no)
          const emergencyPhone = profile?.relative_mobile_no || profile?.emergency_contact_phone;
          if (emergencyPhone) {
            alertData.emergency_contact_phone = emergencyPhone;
          }
        } else {
          alertData.name = formData.name;
          alertData.phone = formData.phone;
        }

        await alertService.createAlert(alertData);
        setSubmitSuccess(true);
        if (!useProfile) setFormData({ name: "", phone: "" });
        setTimeout(() => navigate("/dashboard"), 2000);
      } catch (error) {
        if (error.errors) {
          setErrors(error.errors);
          setSubmitError("Please fix the errors and try again");
        } else {
          setSubmitError(
            error.message || "Failed to send alert. Please try again."
          );
        }
      } finally {
        setSubmitting(false);
      }
    };
    sendAlert();
  }, [location, submitting]);

  useEffect(() => {
    if (geoError && submitting) {
      setSubmitError(geoError.message);
      setSubmitting(false);
    }
  }, [geoError, submitting]);

  return (
    <div className="sos-page">
      <div className={`sos-container ${alertActive ? "alert-active" : ""}`}>
        <div className="sos-header">
          <div className={`sos-icon ${alertActive ? "alert-ringing" : ""}`}>
            🚨
          </div>
          <h1>Emergency SOS Alert</h1>
          <p>Send your location to emergency services immediately</p>
          {alertActive && (
            <div className="alert-sound-indicator">
              <span className="sound-wave"></span>
              <span className="sound-wave"></span>
              <span className="sound-wave"></span>
              <span className="alert-text">🔊 Alert Sound Active</span>
            </div>
          )}
        </div>

        {submitSuccess && (
          <div className="alert alert-success">
            <strong>✅ Alert Sent Successfully!</strong>
            <p>
              Your emergency alert has been sent with your location. It is
              visible on the Emergency Alert Dashboard and will be shared with
              emergency helplines. Redirecting...
            </p>
          </div>
        )}

        {submitError && (
          <div className="alert alert-error">
            <strong>⚠️ Error</strong>
            <p>{submitError}</p>
          </div>
        )}

        {useProfile && (
          <div className="sos-profile-notice">
            Sending as <strong>{displayName}</strong> — {user?.contact_no || user?.email}
            {(profile?.relative_mobile_no || profile?.emergency_contact_phone) && (
              <span className="sos-emergency-notice">
                {" "}
                • Emergency contact will be notified: {displayPhone}
              </span>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="sos-form">
          {!useProfile && (
            <>
              <Input
                label="Your Full Name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                error={errors.name}
                placeholder="Enter your full name"
                required
                icon="👤"
              />
              <Input
                label="Phone Number"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                error={errors.phone}
                placeholder="+91 9876543210"
                required
                icon="📞"
              />
              <p className="sos-profile-hint">
                <a href="/login">Log in</a> and set up your{" "}
                <a href="/profile">profile</a> to skip this form next time.
              </p>
            </>
          )}
          {(geoLoading || (submitting && !location)) && (
            <p className="sos-location-hint">
              Getting your location… Please allow when your browser asks, or
              enable location/GPS and try again.
            </p>
          )}
          <Button
            type="submit"
            variant="danger"
            size="large"
            fullWidth
            loading={submitting || geoLoading}
            disabled={geoLoading}
          >
            {geoLoading
              ? "Getting location..."
              : submitting
                ? "Sending Alert..."
                : "🆘 SEND SOS ALERT"}
          </Button>
        </form>

        <div className="sos-info">
          <h3>How it works:</h3>
          <ol>
            <li>
              {useProfile
                ? 'Click "SEND SOS ALERT"'
                : "Fill in your name and phone (or use your profile)"}
            </li>
            <li>
              Allow browser to access your location when prompted (required for
              your current position)
            </li>
            <li>
              Your alert with GPS location is sent to the Emergency Alert
              Dashboard
            </li>
            <li>
              Emergency helplines and your emergency contact can be notified
            </li>
          </ol>
        </div>

        <div className="sos-emergency-numbers">
          <h3>Emergency Helplines</h3>
          <div className="emergency-grid">
            <div className="emergency-item">
              <span className="emergency-icon">🚔</span>
              <span className="emergency-label">Police</span>
              <span className="emergency-number">100</span>
            </div>
            <div className="emergency-item">
              <span className="emergency-icon">🚑</span>
              <span className="emergency-label">Ambulance</span>
              <span className="emergency-number">108</span>
            </div>
            <div className="emergency-item">
              <span className="emergency-icon">👩</span>
              <span className="emergency-label">Women Helpline</span>
              <span className="emergency-number">181</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SOS;
