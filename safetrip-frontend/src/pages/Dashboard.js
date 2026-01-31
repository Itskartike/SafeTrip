import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import useAlerts from "../hooks/useAlerts";
import DashboardSkeleton from "../components/dashboard/DashboardSkeleton";
import ErrorMessage from "../components/common/ErrorMessage";
import StatusBadge from "../components/alerts/StatusBadge";
import { formatDate } from "../utils/formatters";
import { getGoogleMapsUrl } from "../utils/helpers";
import "./Dashboard.css";

const Dashboard = () => {
  const { user } = useAuth();
  const { alerts, loading, error, fetchAlerts, updateAlertStatus, getStats } =
    useAlerts(false);

  const [filter, setFilter] = useState("ALL");
  const [refreshing, setRefreshing] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState(null);

  const stats = getStats();

  useEffect(() => {
    const interval = setInterval(() => fetchAlerts(), 30000);
    return () => clearInterval(interval);
  }, [fetchAlerts]);

  const handleStatusChange = async (id, newStatus) => {
    await updateAlertStatus(id, newStatus);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAlerts();
    setRefreshing(false);
  };

  const filteredAlerts =
    filter === "ALL" ? alerts : alerts.filter((a) => a.status === filter);

  if (loading && alerts.length === 0) {
    return <DashboardSkeleton />;
  }

  if (error && alerts.length === 0) {
    return <ErrorMessage error={{ message: error }} onRetry={fetchAlerts} />;
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-container">
        <div className="dashboard-header">
          <div>
            <h1>🚨 Emergency Alerts Dashboard</h1>
            <p className="dashboard-subtitle">
              Monitor and respond to emergency alerts in real-time
            </p>
          </div>
          <button
            type="button"
            className="refresh-btn"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            {refreshing ? "🔄 Refreshing..." : "🔄 Refresh"}
          </button>
        </div>

        <div className="stats-grid">
          <div className="stat-card stat-total">
            <div className="stat-icon">📊</div>
            <div className="stat-content">
              <h3>{stats.total}</h3>
              <p>Total Alerts</p>
            </div>
          </div>
          <div className="stat-card stat-pending">
            <div className="stat-icon">⏳</div>
            <div className="stat-content">
              <h3>{stats.pending}</h3>
              <p>Pending</p>
            </div>
          </div>
          <div className="stat-card stat-in-progress">
            <div className="stat-icon">🚀</div>
            <div className="stat-content">
              <h3>{stats.inProgress}</h3>
              <p>In Progress</p>
            </div>
          </div>
          <div className="stat-card stat-resolved">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <h3>{stats.resolved}</h3>
              <p>Resolved</p>
            </div>
          </div>
        </div>

        <div className="dashboard-filters">
          <button
            type="button"
            className={`filter-btn ${filter === "ALL" ? "active" : ""}`}
            onClick={() => setFilter("ALL")}
          >
            All <span className="filter-count">{stats.total}</span>
          </button>
          <button
            type="button"
            className={`filter-btn ${filter === "PENDING" ? "active" : ""}`}
            onClick={() => setFilter("PENDING")}
          >
            Pending <span className="filter-count">{stats.pending}</span>
          </button>
          <button
            type="button"
            className={`filter-btn ${filter === "IN_PROGRESS" ? "active" : ""}`}
            onClick={() => setFilter("IN_PROGRESS")}
          >
            In Progress <span className="filter-count">{stats.inProgress}</span>
          </button>
          <button
            type="button"
            className={`filter-btn ${filter === "RESOLVED" ? "active" : ""}`}
            onClick={() => setFilter("RESOLVED")}
          >
            Resolved <span className="filter-count">{stats.resolved}</span>
          </button>
        </div>

        {filteredAlerts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <h3>No alerts found</h3>
            <p>
              There are no {filter === "ALL" ? "" : filter.toLowerCase()} alerts
              at the moment.
            </p>
          </div>
        ) : (
          <div className="alerts-grid">
            {filteredAlerts.map((alert) => (
              <div key={alert.id} className="alert-card">
                <div className="alert-card-header">
                  <div className="alert-id-badge">#{alert.id}</div>
                  <StatusBadge status={alert.status} />
                </div>

                <div className="alert-card-body">
                  <div className="alert-user-info">
                    <div className="user-avatar">
                      {alert.name ? alert.name.charAt(0).toUpperCase() : "?"}
                    </div>
                    <div className="user-details">
                      <h3 className="user-name">{alert.name || "Unknown"}</h3>
                      <p className="user-contact">
                        📞 {alert.phone || "No phone"}
                      </p>
                    </div>
                  </div>

                  <div className="alert-info-grid">
                    <div className="info-item">
                      <span className="info-label">🕒 Time</span>
                      <span className="info-value">
                        {formatDate(alert.timestamp)}
                      </span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">📍 Location</span>
                      <span className="info-value">
                        {alert.latitude && alert.longitude
                          ? `${parseFloat(alert.latitude).toFixed(4)}, ${parseFloat(alert.longitude).toFixed(4)}`
                          : "No location"}
                      </span>
                    </div>
                  </div>

                  {alert.message && (
                    <div className="alert-message">
                      <strong>💬 Message:</strong>
                      <p>{alert.message}</p>
                    </div>
                  )}
                </div>

                <div className="alert-card-footer">
                  <a
                    href={getGoogleMapsUrl(alert.latitude, alert.longitude)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-map"
                  >
                    🗺️ View on Map
                  </a>
                  <select
                    value={alert.status}
                    onChange={(e) =>
                      handleStatusChange(alert.id, e.target.value)
                    }
                    className="status-select"
                  >
                    <option value="PENDING">Pending</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="RESOLVED">Resolved</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
