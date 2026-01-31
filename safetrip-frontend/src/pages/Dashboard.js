import React, { useState, useEffect } from 'react';
import useAlerts from '../hooks/useAlerts';
import AlertTable from '../components/alerts/AlertTable';
import DashboardSkeleton from '../components/dashboard/DashboardSkeleton';
import ErrorMessage from '../components/common/ErrorMessage';
import './Dashboard.css';

const Dashboard = () => {
  const {
    alerts,
    loading,
    error,
    fetchAlerts,
    updateAlertStatus,
    getStats,
  } = useAlerts(true);

  const [filter, setFilter] = useState('ALL');
  const [refreshing, setRefreshing] = useState(false);

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
    filter === 'ALL' ? alerts : alerts.filter((a) => a.status === filter);

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
          <h1>Emergency Alerts Dashboard</h1>
          <button
            type="button"
            className="refresh-btn"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            {refreshing ? '🔄 Refreshing...' : '🔄 Refresh'}
          </button>
        </div>

        <div className="stats-grid">
          <div className="stat-card stat-total">
            <h3>{stats.total}</h3>
            <p>Total Alerts</p>
          </div>
          <div className="stat-card stat-pending">
            <h3>{stats.pending}</h3>
            <p>Pending</p>
          </div>
          <div className="stat-card stat-in-progress">
            <h3>{stats.inProgress}</h3>
            <p>In Progress</p>
          </div>
          <div className="stat-card stat-resolved">
            <h3>{stats.resolved}</h3>
            <p>Resolved</p>
          </div>
        </div>

        <div className="dashboard-filters">
          <button
            type="button"
            className={`filter-btn ${filter === 'ALL' ? 'active' : ''}`}
            onClick={() => setFilter('ALL')}
          >
            All ({stats.total})
          </button>
          <button
            type="button"
            className={`filter-btn ${filter === 'PENDING' ? 'active' : ''}`}
            onClick={() => setFilter('PENDING')}
          >
            Pending ({stats.pending})
          </button>
          <button
            type="button"
            className={`filter-btn ${filter === 'IN_PROGRESS' ? 'active' : ''}`}
            onClick={() => setFilter('IN_PROGRESS')}
          >
            In Progress ({stats.inProgress})
          </button>
          <button
            type="button"
            className={`filter-btn ${filter === 'RESOLVED' ? 'active' : ''}`}
            onClick={() => setFilter('RESOLVED')}
          >
            Resolved ({stats.resolved})
          </button>
        </div>

        <AlertTable
          alerts={filteredAlerts}
          onStatusChange={handleStatusChange}
          loading={loading}
        />
      </div>
    </div>
  );
};

export default Dashboard;
