const ENDPOINTS = {
  ALERTS: {
    LIST: '/api/alerts/',
    CREATE: '/api/alerts/',
    DETAIL: (id) => `/api/alerts/${id}/`,
    UPDATE: (id) => `/api/alerts/${id}/`,
    DELETE: (id) => `/api/alerts/${id}/`,
    PENDING: '/api/alerts/pending/',
  },
  AUTH: {
    LOGIN: '/api/auth/login/',
    LOGOUT: '/api/auth/logout/',
    REGISTER: '/api/auth/register/',
    REFRESH: '/api/auth/refresh/',
    USER: '/api/auth/user/',
  },
  PROFILE: '/api/profile/',
  USERS: {
    LIST: '/api/users/',
  },
  EMERGENCY_CONTACTS: {
    LIST: '/api/emergency-contacts/',
  },
};

export default ENDPOINTS;
