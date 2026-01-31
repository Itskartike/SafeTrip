import { useState, useEffect, useCallback } from 'react';
import alertService from '../api/services/alertService';

const useAlerts = (autoFetch = true) => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await alertService.getAllAlerts();
      setAlerts(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to fetch alerts');
      console.error('Error fetching alerts:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createAlert = async (alertData) => {
    try {
      const newAlert = await alertService.createAlert(alertData);
      setAlerts((prev) => [newAlert, ...prev]);
      return { success: true, data: newAlert };
    } catch (err) {
      console.error('Error creating alert:', err);
      return { success: false, error: err };
    }
  };

  const updateAlertStatus = async (id, status) => {
    try {
      const updatedAlert = await alertService.updateAlertStatus(id, status);
      setAlerts((prev) =>
        prev.map((alert) => (alert.id === id ? updatedAlert : alert))
      );
      return { success: true, data: updatedAlert };
    } catch (err) {
      console.error('Error updating alert:', err);
      return { success: false, error: err };
    }
  };

  const deleteAlert = async (id) => {
    try {
      await alertService.deleteAlert(id);
      setAlerts((prev) => prev.filter((alert) => alert.id !== id));
      return { success: true };
    } catch (err) {
      console.error('Error deleting alert:', err);
      return { success: false, error: err };
    }
  };

  const filterByStatus = useCallback(
    (status) => alerts.filter((alert) => alert.status === status),
    [alerts]
  );

  const getStats = useCallback(
    () => ({
      total: alerts.length,
      pending: alerts.filter((a) => a.status === 'PENDING').length,
      inProgress: alerts.filter((a) => a.status === 'IN_PROGRESS').length,
      resolved: alerts.filter((a) => a.status === 'RESOLVED').length,
    }),
    [alerts]
  );

  useEffect(() => {
    if (autoFetch) fetchAlerts();
  }, [autoFetch, fetchAlerts]);

  return {
    alerts,
    loading,
    error,
    fetchAlerts,
    createAlert,
    updateAlertStatus,
    deleteAlert,
    filterByStatus,
    getStats,
  };
};

export default useAlerts;
