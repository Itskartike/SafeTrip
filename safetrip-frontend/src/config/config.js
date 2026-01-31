export const config = {
  apiBaseUrl: process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000',
  apiTimeout: parseInt(process.env.REACT_APP_API_TIMEOUT, 10) || 10000,
  googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY || '',
  environment: process.env.REACT_APP_ENVIRONMENT || 'development',
};

export default config;
