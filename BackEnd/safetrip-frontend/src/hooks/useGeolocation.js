import { useState, useCallback } from 'react';

/**
 * Hook for fetching current position via Geolocation API.
 * - Clears previous location when getLocation() is called so we always use fresh coordinates.
 * - Requires secure context (HTTPS or localhost).
 */
const useGeolocation = (options = {}) => {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const defaultOptions = {
    enableHighAccuracy: true,
    timeout: 15000,
    maximumAge: 0,
    ...options,
  };

  const getLocation = useCallback(() => {
    setLoading(true);
    setError(null);
    setLocation(null); // Force fresh location; avoid using stale coords

    if (!navigator.geolocation) {
      setError({
        code: 0,
        message: 'Geolocation is not supported by your browser',
      });
      setLoading(false);
      return;
    }

    // Geolocation only works on secure contexts (HTTPS or localhost)
    if (!window.isSecureContext) {
      setError({
        code: 0,
        message: 'Location requires a secure connection. Please use https:// or open from http://localhost',
      });
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
        });
        setLoading(false);
      },
      (err) => {
        let errorMessage = 'Unable to retrieve location';
        switch (err.code) {
          case err.PERMISSION_DENIED:
            errorMessage =
              'Location permission denied. Please allow location access when the browser asks, or enable it in your browser/site settings.';
            break;
          case err.POSITION_UNAVAILABLE:
            errorMessage = 'Location is unavailable. Check that location/GPS is on and try again.';
            break;
          case err.TIMEOUT:
            errorMessage = 'Location request timed out. Please ensure location is enabled and try again.';
            break;
          default:
            errorMessage = 'Could not get location. Please try again.';
        }
        setError({ code: err.code, message: errorMessage });
        setLoading(false);
      },
      defaultOptions
    );
  }, []);

  return { location, error, loading, getLocation };
};

export default useGeolocation;
