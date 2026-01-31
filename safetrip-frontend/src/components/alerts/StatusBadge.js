import React from 'react';
import './StatusBadge.css';

const statusConfig = {
  PENDING: {
    label: 'Pending',
    className: 'status-pending',
    icon: '⏳',
  },
  IN_PROGRESS: {
    label: 'In Progress',
    className: 'status-in-progress',
    icon: '🔄',
  },
  RESOLVED: {
    label: 'Resolved',
    className: 'status-resolved',
    icon: '✅',
  },
};

const StatusBadge = ({ status }) => {
  const config = statusConfig[status] || statusConfig.PENDING;

  return (
    <span className={`status-badge ${config.className}`}>
      <span className="status-icon">{config.icon}</span>
      {config.label}
    </span>
  );
};

export default StatusBadge;
