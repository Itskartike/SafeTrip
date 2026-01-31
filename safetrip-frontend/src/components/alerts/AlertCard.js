import React from 'react';
import StatusBadge from './StatusBadge';
import { formatDate } from '../../utils/formatters';
import { getGoogleMapsUrl, normalizeLatLng } from '../../utils/helpers';
import './AlertCard.css';

const AlertCard = ({ alert, onStatusChange, onViewLocation }) => {
  const coords = normalizeLatLng(alert.latitude, alert.longitude) || { lat: 0, lng: 0 };

  return (
    <div className="alert-card">
      <div className="alert-card-header">
        <div>
          <h3>{alert.name}</h3>
          <p className="alert-phone">{alert.phone}</p>
        </div>
        <StatusBadge status={alert.status} />
      </div>
      <div className="alert-card-body">
        <div className="alert-info">
          <span className="alert-label">Time:</span>
          <span>{formatDate(alert.timestamp)}</span>
        </div>
        <div className="alert-info">
          <span className="alert-label">Location:</span>
          <span>{coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}</span>
        </div>
      </div>
      <div className="alert-card-actions">
        <a
          href={getGoogleMapsUrl(alert.latitude, alert.longitude)}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-secondary"
        >
          📍 View on Map
        </a>
        {onStatusChange && (
          <select
            value={alert.status}
            onChange={(e) => onStatusChange(alert.id, e.target.value)}
            className="status-select"
          >
            <option value="PENDING">Pending</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
          </select>
        )}
      </div>
    </div>
  );
};

export default AlertCard;
