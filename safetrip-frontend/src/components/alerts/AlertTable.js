import React, { useState } from 'react';
import StatusBadge from './StatusBadge';
import { formatDate } from '../../utils/formatters';
import { getGoogleMapsUrl, normalizeLatLng } from '../../utils/helpers';
import './AlertTable.css';

const AlertTable = ({ alerts, onStatusChange, loading }) => {
  const [sortField, setSortField] = useState('timestamp');
  const [sortDirection, setSortDirection] = useState('desc');

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedAlerts = [...(alerts || [])].sort((a, b) => {
    let aValue = a[sortField];
    let bValue = b[sortField];
    if (sortField === 'timestamp') {
      aValue = new Date(aValue || 0);
      bValue = new Date(bValue || 0);
    }
    if (sortDirection === 'asc') return aValue > bValue ? 1 : -1;
    return aValue < bValue ? 1 : -1;
  });

  if (loading) {
    return <div className="table-loading">Loading alerts...</div>;
  }

  if (!alerts?.length) {
    return (
      <div className="table-empty">
        <p>No alerts found</p>
      </div>
    );
  }

  return (
    <div className="alert-table-container">
      <table className="alert-table">
        <thead>
          <tr>
            <th onClick={() => handleSort('id')} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && handleSort('id')}>
              ID {sortField === 'id' && (sortDirection === 'asc' ? '↑' : '↓')}
            </th>
            <th onClick={() => handleSort('name')} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && handleSort('name')}>
              Name {sortField === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
            </th>
            <th>Phone</th>
            <th>Location</th>
            <th onClick={() => handleSort('timestamp')} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && handleSort('timestamp')}>
              Time {sortField === 'timestamp' && (sortDirection === 'asc' ? '↑' : '↓')}
            </th>
            <th onClick={() => handleSort('status')} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && handleSort('status')}>
              Status {sortField === 'status' && (sortDirection === 'asc' ? '↑' : '↓')}
            </th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {sortedAlerts.map((alert) => {
            const coords = normalizeLatLng(alert.latitude, alert.longitude) || { lat: 0, lng: 0 };
            return (
              <tr key={alert.id}>
                <td>#{alert.id}</td>
                <td>{alert.name}</td>
                <td>{alert.phone}</td>
                <td>
                  <a
                    href={getGoogleMapsUrl(alert.latitude, alert.longitude)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="location-link"
                  >
                    📍 View Map
                  </a>
                  <br />
                  <small className="coordinates">
                    {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
                  </small>
                </td>
                <td>{formatDate(alert.timestamp)}</td>
                <td>
                  <StatusBadge status={alert.status} />
                </td>
                <td>
                  <select
                    value={alert.status}
                    onChange={(e) => onStatusChange(alert.id, e.target.value)}
                    className="status-select-table"
                  >
                    <option value="PENDING">Pending</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="RESOLVED">Resolved</option>
                  </select>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default AlertTable;
