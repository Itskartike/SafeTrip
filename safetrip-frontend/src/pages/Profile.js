import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Input from "../components/common/Input";
import Button from "../components/common/Button";
import { useAuth } from "../contexts/AuthContext";
import { validatePhone, validateName } from "../utils/validation";
import "./Profile.css";

const API_BASE = process.env.REACT_APP_API_BASE_URL || "http://localhost:8000";

const Profile = () => {
  const navigate = useNavigate();
  const { user, profile, updateProfile, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState("personal");
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || "",
        phone: profile.phone || "",
        emergency_contact_name: profile.emergency_contact_name || "",
        emergency_contact_phone: profile.emergency_contact_phone || "",
      });
      if (profile.image) {
        const path = profile.image.startsWith("http")
          ? profile.image
          : profile.image.startsWith("/")
            ? `${API_BASE}${profile.image}`
            : `${API_BASE}/media/${profile.image}`;
        setImagePreview(path);
      }
    }
  }, [profile]);

  if (!isAuthenticated) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const validate = () => {
    const newErrors = {};
    const nameErr = validateName(formData.full_name);
    if (nameErr) newErrors.full_name = nameErr;
    const phoneErr = validatePhone(formData.phone);
    if (phoneErr) newErrors.phone = phoneErr;
    if (formData.emergency_contact_phone) {
      const ecErr = validatePhone(formData.emergency_contact_phone);
      if (ecErr) newErrors.emergency_contact_phone = ecErr;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess(false);
    if (!validate()) return;
    setSaving(true);
    try {
      await updateProfile({
        ...formData,
        ...(imageFile && { image: imageFile }),
      });
      setSuccess(true);
      setImageFile(null);
      setEditMode(false);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      const data = err.response?.data;
      if (data && typeof data === "object") {
        const errs = {};
        Object.keys(data).forEach((k) => {
          errs[k] = Array.isArray(data[k]) ? data[k][0] : data[k];
        });
        setErrors(errs);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditMode(false);
    setFormData({
      full_name: profile?.full_name || "",
      phone: profile?.phone || "",
      emergency_contact_name: profile?.emergency_contact_name || "",
      emergency_contact_phone: profile?.emergency_contact_phone || "",
    });
    setErrors({});
  };

  const ProfileStats = () => (
    <div className="profile-stats">
      <div className="stat-item">
        <span className="stat-icon">�</span>
        <div className="stat-content">
          <span className="stat-label">Username</span>
          <span className="stat-value">{user?.username || "N/A"}</span>
        </div>
      </div>
      <div className="stat-item">
        <span className="stat-icon">✉️</span>
        <div className="stat-content">
          <span className="stat-label">Email</span>
          <span className="stat-value">
            {user?.email || "No email provided"}
          </span>
        </div>
      </div>
      <div className="stat-item">
        <span className="stat-icon">🛡️</span>
        <div className="stat-content">
          <span className="stat-label">Account Status</span>
          <span className="stat-badge status-active">Active</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="profile-page">
      <div className="profile-layout">
        {/* Profile Header Card */}
        <div className="profile-header-card">
          <div className="profile-banner">
            <div className="banner-gradient"></div>
          </div>
          <div className="profile-header-content">
            <div className="profile-avatar-section">
              <div className="profile-avatar-wrap">
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Profile"
                    className="profile-avatar"
                  />
                ) : (
                  <div className="profile-avatar-placeholder">
                    <span className="avatar-icon">👤</span>
                  </div>
                )}
                {editMode && (
                  <label className="avatar-edit-btn">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="profile-image-input"
                    />
                    <span className="edit-icon">📷</span>
                  </label>
                )}
              </div>
              <div className="profile-header-info">
                <h1 className="profile-name">
                  {profile?.full_name || user?.username || "User Name"}
                </h1>
                <p className="profile-email">
                  {user?.email || "No email provided"}
                </p>
              </div>
            </div>
            {!editMode && (
              <button
                className="edit-profile-btn"
                onClick={() => setEditMode(true)}
              >
                <span className="btn-icon">✏️</span>
                Edit Profile
              </button>
            )}
          </div>
        </div>

        {/* Success Message */}
        {success && (
          <div className="alert-success-modern">
            <span className="alert-icon">✓</span>
            <span>Profile updated successfully!</span>
          </div>
        )}

        {/* Main Content */}
        <div className="profile-content">
          {/* Tabs */}
          <div className="profile-tabs">
            <button
              className={`tab-btn ${activeTab === "personal" ? "active" : ""}`}
              onClick={() => setActiveTab("personal")}
            >
              <span className="tab-icon">👤</span>
              Personal Info
            </button>
            <button
              className={`tab-btn ${activeTab === "emergency" ? "active" : ""}`}
              onClick={() => setActiveTab("emergency")}
            >
              <span className="tab-icon">🆘</span>
              Emergency Contact
            </button>
            <button
              className={`tab-btn ${activeTab === "stats" ? "active" : ""}`}
              onClick={() => setActiveTab("stats")}
            >
              <span className="tab-icon">📊</span>
              Account Info
            </button>
          </div>

          {/* Tab Content */}
          <div className="tab-content">
            {activeTab === "personal" && (
              <div className="info-section">
                <h2 className="section-title">
                  <span className="title-icon">👤</span>
                  Personal Information
                </h2>
                <p className="section-description">
                  This information will be shared with emergency contacts during
                  SOS alerts.
                </p>

                {editMode ? (
                  <form onSubmit={handleSubmit} className="profile-form">
                    <Input
                      label="Full name"
                      name="full_name"
                      value={formData.full_name}
                      onChange={handleChange}
                      error={errors.full_name}
                      placeholder="Your full name"
                      required
                    />
                    <Input
                      label="Phone number"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleChange}
                      error={errors.phone}
                      placeholder="+91 9876543210"
                      required
                    />
                    <div className="form-actions">
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={handleCancel}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" loading={saving}>
                        Save Changes
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="info-grid">
                    <div className="info-item">
                      <span className="info-label">Full Name</span>
                      <span className="info-value">
                        {formData.full_name || "Not set"}
                      </span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Phone Number</span>
                      <span className="info-value">
                        {formData.phone || "Not set"}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "emergency" && (
              <div className="info-section">
                <h2 className="section-title">
                  <span className="title-icon">🆘</span>
                  Emergency Contact
                </h2>
                <p className="section-description">
                  This contact will be notified immediately when you trigger an
                  SOS alert.
                </p>

                {editMode ? (
                  <form onSubmit={handleSubmit} className="profile-form">
                    <Input
                      label="Emergency contact name"
                      name="emergency_contact_name"
                      value={formData.emergency_contact_name}
                      onChange={handleChange}
                      placeholder="Contact person name"
                    />
                    <Input
                      label="Emergency contact phone"
                      name="emergency_contact_phone"
                      type="tel"
                      value={formData.emergency_contact_phone}
                      onChange={handleChange}
                      error={errors.emergency_contact_phone}
                      placeholder="+91 9123456789"
                    />
                    <div className="form-actions">
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={handleCancel}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" loading={saving}>
                        Save Changes
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="info-grid">
                    <div className="info-item">
                      <span className="info-label">Contact Name</span>
                      <span className="info-value">
                        {formData.emergency_contact_name || "Not set"}
                      </span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Contact Phone</span>
                      <span className="info-value">
                        {formData.emergency_contact_phone || "Not set"}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "stats" && (
              <div className="info-section">
                <h2 className="section-title">
                  <span className="title-icon">📊</span>
                  Account Information
                </h2>
                <p className="section-description">
                  Your account details and membership information.
                </p>
                <ProfileStats />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
